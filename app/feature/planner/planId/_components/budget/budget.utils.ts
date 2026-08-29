import type { CurrencyCode } from "./budget.types";

export function createClientId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatMoney(amount: number, currency: CurrencyCode): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  }).format(amount);
}

export function roundMoney(amount: number, currency: CurrencyCode): number {
  const fractionDigits =
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2;
  const factor = 10 ** fractionDigits;
  return Math.round((amount + Number.EPSILON) * factor) / factor;
}
