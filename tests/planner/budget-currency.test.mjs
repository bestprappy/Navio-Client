import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { afterEach, test } from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    const path = specifier.startsWith(".") && !/\.(?:[cm]?js|tsx?|json)$/.test(specifier)
      ? `${specifier}.ts`
      : specifier;
    return nextResolve(path, context);
  },
});

const { createStore } = await import("jotai");
const { getCurrencyOption } = await import("../../app/feature/planner/planId/_components/budget/budget.data.ts");
const { formatMoney } = await import("../../app/feature/planner/planId/_components/budget/budget.utils.ts");
const { getCurrencyRate, getPlannerSnapshot, savePlannerSnapshot, isTripBudgetState } = await import("../../app/feature/planner/_components/planner-api.ts");
const { readPlannerDraft, writePlannerDraft } = await import("../../app/feature/planner/_components/planner-draft.ts");
const { toSharedPlanBudget } = await import("../../app/feature/planner/_components/share/shared-plan-blocks.ts");
const { convertTripCurrencyAtom, tripBudgetAtom, tripCurrencyAtom, tripExpensesAtom, tripBlocksAtom } = await import("../../app/feature/planner/planId/_components/overview/trip-builder.atoms.ts");

const originalFetch = globalThis.fetch;
const originalWindow = globalThis.window;
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
});

test("TWD exchange-rate responses work as both base and quote for every supported currency", async () => {
  for (const currency of ["THB", "USD", "EUR", "JPY"]) {
    for (const [base, quote] of [[currency, "TWD"], ["TWD", currency]]) {
      const response = { base, quote, rate: 0.95, asOf: "2026-10-09", source: "Frankfurter" };
      globalThis.fetch = async (url) => {
        assert.equal(url, `/api/trips/currencies/rate?base=${base}&quote=${quote}`);
        return Response.json(response);
      };
      assert.deepEqual(await getCurrencyRate(base, quote), response);
    }
  }
});

test("changing to TWD and back converts budget, expenses and planned costs together", () => {
  const store = createStore();
  store.set(tripBudgetAtom, 1000);
  store.set(tripExpensesAtom, [{ id: "expense", amount: 100, label: "Lunch", categoryId: "food" }]);
  store.set(tripBlocksAtom, [{
    id: "day", kind: "itinerary", title: "Day 1", date: "2026-10-11", colorId: "mint",
    items: [{ id: "stop", type: "place", placeId: "museum", name: "Museum", address: "Taipei", lat: 25, lng: 121, cost: 200 }],
  }]);

  store.set(convertTripCurrencyAtom, { currency: getCurrencyOption("TWD"), rate: 0.95 });
  assert.equal(store.get(tripCurrencyAtom).code, "TWD");
  assert.equal(store.get(tripCurrencyAtom).symbol, "NT$");
  assert.equal(store.get(tripBudgetAtom), 950);
  assert.equal(store.get(tripExpensesAtom)[0].amount, 95);
  assert.equal(store.get(tripBlocksAtom)[0].items[0].cost, 190);
  assert.equal(formatMoney(95.25, "TWD"), "NT$95.25");

  store.set(convertTripCurrencyAtom, { currency: getCurrencyOption("THB"), rate: 1 / 0.95 });
  assert.equal(store.get(tripCurrencyAtom).code, "THB");
  assert.equal(store.get(tripBudgetAtom), 1000);
  assert.equal(store.get(tripExpensesAtom)[0].amount, 100);
  assert.equal(store.get(tripBlocksAtom)[0].items[0].cost, 200);
});

test("TWD expenses retain their currency through server save/load, local drafts and shared plans", async () => {
  const budget = { currency: "TWD", amount: 5000, expenses: [{ id: "expense", amount: 120.5, label: "Lunch", categoryId: "food" }] };
  const savedAt = "2026-10-11T00:00:00Z";
  globalThis.fetch = async (_url, options) => {
    if (options?.method === "PUT") {
      assert.deepEqual(JSON.parse(options.body).budget, budget);
      return Response.json({ version: 2, savedAt });
    }
    return Response.json({ blocks: [], budget, version: 2, savedAt });
  };
  assert.equal((await savePlannerSnapshot("trip", [], budget, 1)).version, 2);
  assert.deepEqual((await getPlannerSnapshot("trip")).budget, budget);

  const storage = new Map();
  globalThis.window = { localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  } };
  assert.equal(writePlannerDraft("trip", 2, { blocks: [], budget }), true);
  assert.deepEqual(readPlannerDraft("trip").budget, budget);
  const shared = toSharedPlanBudget({ budget });
  assert.equal(shared.currency, "TWD");
  assert.equal(shared.expenses[0].amount, 120.5);
  assert.equal(isTripBudgetState({ ...budget, currency: "INVALID" }), false);
});
