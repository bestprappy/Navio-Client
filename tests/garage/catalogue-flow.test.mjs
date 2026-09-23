import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as energySelection from "../../app/feature/planner/planId/_components/garage/energy-selection.ts";
import { catalogFixture, savedVehicleFixture } from "./data.ts";
import { legacyEnergyProfile, userObservedConsumption } from "../../app/feature/planner/planId/_components/garage/vehicle-api.ts";

const require = createRequire(import.meta.url);
const garage = "../../app/feature/planner/planId/_components/garage/";
// Execute real component render functions and callbacks with isolated hook/dependency adapters.
function component(file, dependencies) {
  const source = readFileSync(new URL(file, import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => dependencies[name] ?? (name.startsWith("@/components/ui/")
    ? new Proxy({}, { get: (_target, key) => key }) : require(name)) });
  return exports;
}
function hooks() {
  const values = []; let cursor = 0;
  return { reset() { cursor = 0; }, react: {
    useState(initial) { const index = cursor++; if (!(index in values)) values[index] = initial;
      return [values[index], value => { values[index] = typeof value === "function" ? value(values[index]) : value; }]; },
    useMemo(fn) { return fn(); }, useId() { return "test-info"; },
  } };
}
function elements(node) {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) return node.flatMap(elements);
  return [node, ...elements(node.props?.children)];
}
for (const authenticated of [false, true]) test(`${authenticated ? "signed-in" : "guest"} dialog defaults to catalogue and supports both submission paths`, async () => {
  const state = hooks(), commands = [];
  const { AddVehicleDialog } = component(`${garage}add-vehicle-dialog.tsx`, {
    react: state.react,
    "./garage-provider": { useGarage: () => ({ authenticated, mutation: { mutateAsync: async command => commands.push(command) } }) },
    "./custom-vehicle-form": { CustomVehicleForm: "CustomVehicleForm" },
    "./vehicle-catalog-picker": { VehicleCatalogPicker: "VehicleCatalogPicker" },
    "./vehicle-api": { userObservedConsumption: { consumptionSource: "USER_OBSERVED", consumptionMeasurementBasis: "UNKNOWN" } },
    "./energy-selection": energySelection,
  });
  const render = () => { state.reset(); return elements(AddVehicleDialog({ onClose() {} })); };
  let tree = render();
  assert.ok(tree.find(node => node.type === "VehicleCatalogPicker"));
  assert.equal(tree.find(node => node.props?.children === "Thailand catalogue").props["aria-pressed"], true);
  tree.find(node => node.type === "VehicleCatalogPicker").props.onSelect(catalogFixture);
  tree = render();
  assert.ok(tree.find(node => node.props?.children === (authenticated ? "Save to garage" : "Use for this trip")));
  tree.find(node => node.type === "form").props.onSubmit({ preventDefault() {} });
  await Promise.resolve();
  assert.equal(commands[0].kind, "catalog");
  assert.equal(commands[0].energySelection, "USE_DEFAULT");
  assert.equal(commands[0].consumptionKwhPer100km, undefined);
  assert.equal(commands[0].catalogVehicle.id, catalogFixture.id);
  tree.find(node => node.props?.children === "Custom EV").props.onClick();
  tree = render();
  const custom = tree.find(node => node.type === "CustomVehicleForm");
  assert.ok(custom);
  await custom.props.onSave({ make: "Test", model: "Custom" });
  assert.equal(commands[1].kind, "custom");
});

test("catalogue picker browses, filters and selects catalogue data", () => {
  const state = hooks(); let selected;
  const { VehicleCatalogPicker } = component(`${garage}vehicle-catalog-picker.tsx`, {
    react: state.react, "@tanstack/react-query": { useQuery: () => ({ data: [catalogFixture], isPending: false }) },
    "./vehicle-api": { listVehicleCatalog() {} }, "./vehicle-mappers": { catalogVehicleCar: value => value },
    "./vehicle-media": { VehicleMedia: "VehicleMedia" }, "@/lib/utils": { cn: (...parts) => parts.join(" ") },
  });
  const render = () => { state.reset(); return elements(VehicleCatalogPicker({ selectedId: null, onSelect: value => { selected = value; }, disabled: false })); };
  let tree = render();
  tree.find(node => node.type === "input" && node.props.type === "radio").props.onChange();
  assert.equal(selected.id, catalogFixture.id);
  tree.find(node => node.type === "Input").props.onChange({ target: { value: "no-such-model" } });
  assert.equal(render().filter(node => node.type === "input" && node.props.type === "radio").length, 0);
  render().find(node => node.type === "Input").props.onChange({ target: { value: "atto" } });
  assert.equal(render().filter(node => node.type === "input" && node.props.type === "radio").length, 1);
});

test("frontend proxy enables anonymous access only for exact catalogue GET", async () => {
  const calls = [];
  const route = component("../../app/api/users/me/vehicles/[[...path]]/route.ts", {
    "@/app/api/_lib/authenticated-api-proxy": { proxyAuthenticatedApiRequest: async (_request, path, options) => { calls.push({ path, ...options }); return new Response(); } },
  });
  for (const method of ["GET", "POST", "PATCH", "DELETE"]) {
    for (const path of [[], ["catalog"], ["catalog", "id"], ["id"], ["catalog/extra"]]) {
      await route[method](new Request("http://localhost/api/users/me/vehicles", { method }), { params: Promise.resolve({ path }) });
      assert.equal(calls.at(-1).allowAnonymous, method === "GET" && path.length === 1 && path[0] === "catalog");
    }
  }
});

for (const authenticated of [false, true]) test(`${authenticated ? "signed-in" : "guest"} settings use one save action for reset and override`, () => {
  const state = hooks(), commands = [];
  const { VehicleSettingsForm } = component(`${garage}vehicle-settings-form.tsx`, {
    react: state.react, "./battery-slider": { BatterySlider: "BatterySlider" },
    jotai: { useAtom: () => state.react.useState({}) },
    "./trip-energy-state": { tripEnergyStateAtom: {} },
    "./energy-selection": energySelection,
    "./vehicle-api": { legacyEnergyProfile, userObservedConsumption },
    "./garage-provider": { useGarage: () => ({ authenticated, query: {}, mutation: { mutate: command => commands.push(command) } }) },
  });
  const render = () => { state.reset(); return elements(VehicleSettingsForm({ vehicle: savedVehicleFixture })); };
  let tree = render();
  assert.equal(tree.some(node => node.props?.children === "Confirm existing estimate for automatic planning"), false);
  assert.equal(tree.find(node => node.type === "option" && node.props.value === "RESET_DEFAULT").props.disabled, true);
  assert.ok(tree.find(node => node.props?.children === "Nickname (Optional)"));
  tree.find(node => node.type === "BatterySlider").props.onChange(62);
  tree = render();
  assert.equal(tree.find(node => node.type === "BatterySlider").props.value, 62);
  assert.equal(commands.length, 0);
  assert.equal(tree.find(node => node.type === "Button" && node.props.type === "submit").props.disabled, true);
  tree.find(node => node.type === "select").props.onChange({ target: { value: "USE_RATED_RANGE" } });
  tree = render();
  tree.find(node => node.type === "form").props.onSubmit({ preventDefault() {} });
  const reset = commands.pop().patch;
  assert.equal(reset.energySelection, "USE_RATED_RANGE");
  assert.equal("consumptionKwhPer100km" in reset, false);
  assert.equal("settings" in reset, false);
  tree.find(node => node.type === "select").props.onChange({ target: { value: "USER_OVERRIDE" } });
  tree = render();
  tree.find(node => node.type === "form").props.onSubmit({ preventDefault() {} });
  const override = commands.pop().patch;
  assert.equal(override.energySelection, "USER_OVERRIDE");
  assert.equal(override.consumptionKwhPer100km, savedVehicleFixture.consumptionKwhPer100km);
  assert.equal(override.consumptionProvenance.consumptionMeasurementBasis, "UNKNOWN");
});
