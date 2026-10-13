import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { afterEach, test } from "node:test";

registerHooks({ resolve(specifier, context, next) {
  return next(specifier.startsWith(".") && !/\.(?:[cm]?js|tsx?|json)$/.test(specifier) ? `${specifier}.ts` : specifier, context);
} });
const { createStore } = await import("jotai");
const atoms = await import("../../app/feature/planner/planId/_components/overview/trip-builder.atoms.ts");
const { getCurrencyOption } = await import("../../app/feature/planner/planId/_components/budget/budget.data.ts");
const { createPlaceExpenseId, getPlaceExpenses, isExpenseForPlace } = await import("../../app/feature/planner/planId/_components/budget/place-expenses.ts");
const { savePlannerSnapshot, getPlannerSnapshot } = await import("../../app/feature/planner/_components/planner-api.ts");
const { day, memorial, lunch, unlinked } = await import("./place-expenses/data.ts");
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

function newStore(block = day, expenses = []) {
  const store = createStore();
  store.set(atoms.tripCurrencyAtom, getCurrencyOption("TWD"));
  store.set(atoms.tripBlocksAtom, [block]);
  store.set(atoms.tripExpensesAtom, expenses);
  return store;
}
function save(store, fields = {}) {
  return store.set(atoms.savePlaceExpenseAtom, { blockId: day.id, itemId: memorial.id, amount: 260, label: "Dan-Dan Noodles", categoryId: "food", ...fields });
}
const currentPlace = store => store.get(atoms.tripBlocksAtom)[0].items.find(item => item.id === memorial.id);

test("multiple categorized expenses for one visit add to its cost without replacing the earlier entry", () => {
  const store = newStore();
  assert.equal(save(store), true);
  assert.equal(save(store, { amount: 80, label: "Bubble tea", categoryId: "drinks" }), true);
  const expenses = store.get(atoms.tripExpensesAtom);
  assert.equal(expenses.length, 2);
  assert.notEqual(expenses[0].id, expenses[1].id);
  assert.deepEqual(expenses.map(({ amount, label, categoryId, date }) => ({ amount, label, categoryId, date })), [
    { amount: 260, label: "Dan-Dan Noodles", categoryId: "food", date: day.date },
    { amount: 80, label: "Bubble tea", categoryId: "drinks", date: day.date },
  ]);
  assert.equal(currentPlace(store).cost, 340);
  assert.ok(expenses.every(expense => expense.id.length <= 160));
});

test("editing and deleting from Budget keep a linked card's total in sync", () => {
  const store = newStore(); save(store); save(store, { amount: 80, label: "Tea", categoryId: "drinks" });
  const [food, tea] = store.get(atoms.tripExpensesAtom);
  store.set(atoms.updateTripExpensesAtom, previous => previous.map(expense => expense.id === food.id ? { ...expense, amount: 300 } : expense));
  assert.equal(currentPlace(store).cost, 380);
  store.set(atoms.removePlaceExpenseAtom, { blockId: day.id, itemId: memorial.id, expenseId: tea.id });
  assert.equal(currentPlace(store).cost, 300);
  store.set(atoms.updateTripExpensesAtom, []);
  assert.equal(currentPlace(store).cost, undefined);
});

test("old single-cost expenses remain editable and adding another expense preserves their identity and classification", () => {
  const store = newStore({ ...day, items: [{ ...memorial, cost: 260 }] }, [lunch, unlinked]);
  assert.equal(save(store, { amount: 80, label: "Tea", categoryId: "drinks" }), true);
  assert.deepEqual(store.get(atoms.tripExpensesAtom)[0], lunch);
  assert.equal(currentPlace(store).cost, 340);
  assert.equal(save(store, { expenseId: lunch.id, amount: 275, label: "Noodles", categoryId: "food" }), true);
  assert.equal(currentPlace(store).cost, 355);
  assert.equal(store.get(atoms.tripExpensesAtom).length, 3);
});

test("a cost-only old snapshot survives adding another entry and can be edited or cleared", () => {
  const oldBlock = { ...day, items: [{ ...memorial, cost: 260 }] };
  const store = newStore(oldBlock);
  save(store, { amount: 80, label: "Tea", categoryId: "drinks" });
  assert.equal(currentPlace(store).cost, 340);
  assert.equal(store.get(atoms.tripExpensesAtom)[0].amount, 260);
  const editing = newStore(oldBlock);
  assert.equal(save(editing, { expenseId: lunch.id, amount: 300 }), true);
  assert.equal(currentPlace(editing).cost, 300);
  assert.equal(editing.get(atoms.tripExpensesAtom).length, 1);
  const clearing = newStore(oldBlock);
  clearing.set(atoms.removePlaceExpenseAtom, { blockId: day.id, itemId: memorial.id, expenseId: lunch.id });
  assert.equal(currentPlace(clearing).cost, undefined);
  assert.deepEqual(clearing.get(atoms.tripExpensesAtom), []);
});

test("visit links do not collide on shared place IDs, item ID prefixes, or separator characters", () => {
  for (const id of ["stop", "stop-more", "stop/other", "stop%2Fother", "stop:other"]) {
    const expense = { ...lunch, id: createPlaceExpenseId(id) };
    assert.equal(isExpenseForPlace(expense, id), true);
    for (const other of ["stop", "stop-more", "stop/other", "stop%2Fother", "stop:other"]) {
      if (other !== id) assert.equal(isExpenseForPlace(expense, other), false);
    }
  }
  const store = newStore(); save(store); save(store, { itemId: "memorial-return", amount: 80 });
  assert.equal(getPlaceExpenses(store.get(atoms.tripExpensesAtom), memorial.id).length, 1);
  assert.equal(store.get(atoms.tripBlocksAtom)[0].items[1].cost, 80);
});

test("deleting one visit or its day removes all associated expense entries and keeps unrelated expenses", () => {
  const store = newStore(day, [unlinked]); save(store); save(store, { amount: 80 }); save(store, { itemId: "memorial-return", amount: 100 });
  store.set(atoms.removeItemFromBlockAtom, { blockId: day.id, itemId: memorial.id });
  assert.deepEqual(store.get(atoms.tripExpensesAtom).map(expense => expense.amount), [75, 100]);
  store.set(atoms.removeTripBlockAtom, day.id);
  assert.deepEqual(store.get(atoms.tripExpensesAtom), [unlinked]);
});

test("read-only, invalid amounts, missing stops and stale edits cannot add or recreate an expense", () => {
  const store = newStore();
  for (const amount of [0, -1, NaN, Infinity]) assert.equal(save(store, { amount }), false);
  assert.equal(save(store, { itemId: "missing" }), false);
  save(store);
  const expense = store.get(atoms.tripExpensesAtom)[0];
  store.set(atoms.removePlaceExpenseAtom, { blockId: day.id, itemId: memorial.id, expenseId: expense.id });
  assert.equal(save(store, { expenseId: expense.id }), false);
  store.set(atoms.plannerReadOnlyAtom, true);
  const previous = store.get(atoms.tripBlocksAtom);
  assert.equal(save(store), false);
  store.set(atoms.updateTripExpensesAtom, [lunch]);
  store.set(atoms.removePlaceExpenseAtom, { blockId: day.id, itemId: memorial.id, expenseId: lunch.id });
  assert.deepEqual(store.get(atoms.tripBlocksAtom), previous);
  assert.deepEqual(store.get(atoms.tripExpensesAtom), []);
});

test("currency conversion totals the rounded entries instead of rounding their combined cost differently", () => {
  const store = newStore(); save(store, { amount: 0.24 }); save(store, { amount: 0.24 });
  store.set(atoms.convertTripCurrencyAtom, { currency: getCurrencyOption("JPY"), rate: 6.25 });
  assert.equal(currentPlace(store).cost, 4);
  assert.deepEqual(store.get(atoms.tripExpensesAtom).map(expense => expense.amount), [2, 2]);
});

test("the existing planner API carries multiple expense links and their total through save/reload", async () => {
  const store = newStore(); save(store); save(store, { amount: 80, label: "Tea", categoryId: "drinks" });
  let saved;
  globalThis.fetch = async (_url, options) => {
    if (options?.method === "PUT") saved = { ...JSON.parse(options.body), version: 2, savedAt: "2026-10-11T00:00:00Z" };
    return Response.json(saved);
  };
  const budget = { currency: "TWD", amount: 5000, expenses: store.get(atoms.tripExpensesAtom) };
  await savePlannerSnapshot("expense-trip", store.get(atoms.tripBlocksAtom), budget, 1);
  const restored = await getPlannerSnapshot("expense-trip");
  assert.deepEqual(restored.budget, budget);
  assert.equal(restored.blocks[0].items[0].cost, 340);
  assert.equal(getPlaceExpenses(restored.budget.expenses, memorial.id).length, 2);
});
