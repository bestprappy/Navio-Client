export function isInteractiveCardTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        "a, button, input, textarea, select, summary, [role='button']",
      ),
    )
  );
}
