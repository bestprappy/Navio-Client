import { Clock, ClipboardList, MapPin, Star, StickyNote, Zap } from "lucide-react";

import { cn } from "@/lib/utils";

import type { PublicAnchor, PublicDay, PublicItem, PublicPlanSnapshot } from "./publication-api";

/**
 * Renders a published snapshot, and nothing else.
 *
 * <p>Shared by the owner's preview and the recipient's page on purpose: a preview
 * drawn by different code than the real page is a promise the product does not
 * keep. It takes only the sanitised snapshot, so there is no prop through which
 * private planner state could reach it.
 *
 * <p>Presentational and stateless — no atoms, no queries, no autosave.
 */

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // An unknown currency code must not take the page down with it.
    return `${amount.toLocaleString()} ${currency}`;
  }
}

function formatDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function AnchorRow({ anchor, kind }: { anchor: PublicAnchor; kind: "start" | "end" }) {
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="sr-only">{kind === "start" ? "Starts at" : "Ends at"}:</span>
      <span className={cn(anchor.redacted && "italic")}>{anchor.name}</span>
    </p>
  );
}

function ChargerDetails({ item }: { item: PublicItem }) {
  const charger = item.charger;
  if (!charger) return null;
  const facts = [
    charger.maxKw ? `${charger.maxKw} kW` : null,
    charger.connectorTypes?.length ? charger.connectorTypes.join(", ") : null,
    charger.totalConnectors ? `${charger.totalConnectors} connectors` : null,
    charger.operatorName,
    charger.priceText,
    charger.openingHoursSummary,
  ].filter((fact): fact is string => Boolean(fact));

  if (facts.length === 0) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-1.5">
      {facts.map((fact) => (
        <li
          key={fact}
          className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground"
        >
          {fact}
        </li>
      ))}
    </ul>
  );
}

function ItemCard({ item, currency }: { item: PublicItem; currency?: string }) {
  if (item.type === "note") {
    return (
      <li className="rounded-lg border border-border bg-muted/40 p-3">
        <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <StickyNote className="size-3.5" aria-hidden="true" />
          Note
        </p>
        <p className="mt-1 text-sm whitespace-pre-wrap text-foreground">{item.noteContent}</p>
      </li>
    );
  }

  if (item.type === "checklist") {
    return (
      <li className="rounded-lg border border-border bg-muted/40 p-3">
        <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <ClipboardList className="size-3.5" aria-hidden="true" />
          {item.checklistTitle ?? "Checklist"}
        </p>
        <ul className="mt-1.5 space-y-1">
          {item.checklistLabels?.map((label, index) => (
            <li key={`${label}-${index}`} className="flex gap-2 text-sm text-foreground">
              <span aria-hidden="true" className="text-muted-foreground">
                •
              </span>
              {label}
            </li>
          ))}
        </ul>
      </li>
    );
  }

  const isCharger = item.type === "charger";
  const timeLabel = [item.time, item.timeEnd].filter(Boolean).join(" – ");

  return (
    <li className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-medium text-foreground">
            {isCharger && <Zap className="size-4 shrink-0 text-primary" aria-hidden="true" />}
            <span className="truncate">{item.name ?? "Untitled stop"}</span>
          </p>
          {item.description && (
            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
          )}
        </div>
        {typeof item.cost === "number" && currency && (
          <p className="shrink-0 text-sm font-medium text-foreground">
            {formatMoney(item.cost, currency)}
          </p>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {timeLabel && (
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden="true" />
            {timeLabel}
          </span>
        )}
        {typeof item.rating === "number" && (
          <span className="flex items-center gap-1">
            <Star className="size-3.5" aria-hidden="true" />
            {item.rating.toFixed(1)}
            {typeof item.reviewCount === "number" && ` (${item.reviewCount})`}
          </span>
        )}
      </div>

      <ChargerDetails item={item} />

      {item.notes && (
        <p className="mt-2 border-t border-border pt-2 text-sm whitespace-pre-wrap text-muted-foreground">
          {item.notes}
        </p>
      )}
    </li>
  );
}

function DaySection({ day, currency }: { day: PublicDay; currency?: string }) {
  const items = day.items ?? [];
  return (
    <section className="space-y-3" aria-labelledby={`shared-${day.label.replace(/\s+/g, "-")}`}>
      <header>
        <h3
          id={`shared-${day.label.replace(/\s+/g, "-")}`}
          className="text-base font-semibold text-foreground"
        >
          {day.label}
          {day.date && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {formatDate(day.date)}
            </span>
          )}
        </h3>
        {day.title && <p className="text-sm text-muted-foreground">{day.title}</p>}
      </header>

      {day.startsAt && <AnchorRow anchor={day.startsAt} kind="start" />}

      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <ItemCard key={`${day.label}-${index}`} item={item} currency={currency} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Nothing planned for this day.</p>
      )}

      {day.endsAt && <AnchorRow anchor={day.endsAt} kind="end" />}
    </section>
  );
}

export function SharedPlanContent({ plan }: { plan: PublicPlanSnapshot }) {
  const days = plan.days ?? [];
  const currency = plan.budget?.currency;

  return (
    <div className="space-y-6">
      {days.length > 0 ? (
        days.map((day) => <DaySection key={day.label} day={day} currency={currency} />)
      ) : (
        <p className="text-sm text-muted-foreground">
          This plan does not have any days to show yet.
        </p>
      )}

      {plan.budget && (
        <section aria-labelledby="shared-budget" className="rounded-lg border border-border bg-card p-4">
          <h3 id="shared-budget" className="text-base font-semibold text-foreground">
            Budget
          </h3>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {formatMoney(plan.budget.amount, plan.budget.currency)}
          </p>
          {plan.budget.expenses && plan.budget.expenses.length > 0 && (
            <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
              {plan.budget.expenses.map((expense, index) => (
                <li
                  key={`${expense.label}-${index}`}
                  className="flex items-baseline justify-between gap-3 text-sm"
                >
                  <span className="text-muted-foreground">{expense.label}</span>
                  <span className="font-medium text-foreground">
                    {formatMoney(expense.amount, plan.budget!.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
