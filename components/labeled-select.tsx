"use client";

import { useId } from "react";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function LabeledSelect({ label, value, onChange, options, disabled = false }: {
  label: string; value: string; onChange: (value: string) => void;
  options: { value: string; label: string }[]; disabled?: boolean;
}) {
  const id = useId();
  return <Field>
    <FieldLabel htmlFor={id}>{label}</FieldLabel>
    <Select value={value} onValueChange={(next) => onChange(next ?? "")} items={options} disabled={disabled}>
      <SelectTrigger id={id} className="w-full"><SelectValue /></SelectTrigger>
      <SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
    </Select>
  </Field>;
}
