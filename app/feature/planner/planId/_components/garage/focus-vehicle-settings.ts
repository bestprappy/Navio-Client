/** Id of the Energy Consumption select in the garage vehicle settings form. */
export const ENERGY_SELECTION_ID = "energy-selection";

const GARAGE_SELECTOR = '[data-tour="planner.garage"]';

/**
 * Scrolls the planner to the active vehicle's settings and focuses the Energy Consumption field.
 * Falls back to the garage heading when no saved vehicle form is rendered.
 * Runs on the next frames so a closing dialog can return focus first.
 */
export function focusVehicleEnergySettings(): void {
  if (typeof window === "undefined") return;
  window.setTimeout(() => {
    const field = document.getElementById(ENERGY_SELECTION_ID);
    const target = field ?? document.querySelector<HTMLElement>(GARAGE_SELECTOR);
    if (!target) {
      console.warn("[focusVehicleEnergySettings] Garage section is not on this page.");
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    field?.focus({ preventScroll: true });
  }, 120);
}
