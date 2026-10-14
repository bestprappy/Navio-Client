"use client";

import { useState, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

import { formatClock, parseClockInput } from "../../../itinerary/stop-schedule";
import styles from "./stop-schedule.module.css";

type ScheduleTimeInputProps = {
  value: string | undefined;
  /** Called with HH:mm, or undefined when an optional time is cleared. */
  onCommit: (value: string | undefined) => void;
  label: string;
  placeholder?: string;
  optional?: boolean;
  variant: "start" | "end";
  errorId: string;
  onInvalidChange: (invalid: boolean) => void;
};

/**
 * A time typed the way people write it ("9", "930", "9:30 pm"). It is read when the field
 * is left or Enter is pressed; something that is not a time keeps the field open to fix.
 */
export function ScheduleTimeInput({
  value,
  onCommit,
  label,
  placeholder,
  optional = false,
  variant,
  errorId,
  onInvalidChange,
}: ScheduleTimeInputProps) {
  // While typing, the draft wins; otherwise the field shows the saved time.
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const shown = draft ?? (value ? formatClock(value) : "");

  function setInvalidState(next: boolean) {
    setInvalid(next);
    onInvalidChange(next);
  }

  function commit() {
    if (draft === null) return;
    const text = draft.trim();
    if (!text) {
      setDraft(null);
      setInvalidState(false);
      if (optional) onCommit(undefined);
      return;
    }
    const parsed = parseClockInput(text);
    if (!parsed) {
      setInvalidState(true);
      return;
    }
    setDraft(null);
    setInvalidState(false);
    if (parsed !== value) onCommit(parsed);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
    } else if (event.key === "Escape") {
      setDraft(null);
      setInvalidState(false);
      event.currentTarget.blur();
    }
  }

  return (
    <input
      type="text"
      inputMode="text"
      autoComplete="off"
      spellCheck={false}
      value={shown}
      placeholder={placeholder}
      aria-label={label}
      aria-invalid={invalid}
      aria-describedby={invalid ? errorId : undefined}
      data-empty={!shown}
      className={cn(styles.field, variant === "start" ? styles.timeField : styles.endField)}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
    />
  );
}
