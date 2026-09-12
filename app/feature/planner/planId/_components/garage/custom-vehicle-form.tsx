"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { evConnectorOptions } from "../constants/vehicle.data";
import { customVehicleDefaults, customVehicleNumberFields } from "./data";
import { customVehicleSchema, type CustomVehicleInput } from "./vehicle-api";

type CustomVehicleFormProps = {
  onSave: (vehicle: CustomVehicleInput) => Promise<void>;
  onCancel: () => void;
  pending: boolean;
};

export function CustomVehicleForm({ onSave, onCancel, pending }: CustomVehicleFormProps) {
  const form = useForm<CustomVehicleInput>({ resolver: zodResolver(customVehicleSchema), defaultValues: customVehicleDefaults });
  return (
    <form onSubmit={form.handleSubmit(onSave)} className="grid gap-4" noValidate>
      <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2">
        <legend className="sr-only">Custom vehicle specifications</legend>
        {(["make", "model", "nickname"] as const).map((name) => (
          <Controller key={name} name={name} control={form.control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`vehicle-${name}`}>{name === "nickname" ? "Nickname (optional)" : name === "make" ? "Make" : "Model and trim"}</FieldLabel>
              <Input {...field} id={`vehicle-${name}`} aria-invalid={fieldState.invalid} aria-describedby={fieldState.error ? `${name}-error` : undefined} maxLength={100} />
              <FieldError id={`${name}-error`} errors={[fieldState.error]} />
            </Field>
          )} />
        ))}
        {customVehicleNumberFields.map(({ name, label, ...bounds }) => (
          <Controller key={name} name={name} control={form.control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`vehicle-${name}`}>{label}</FieldLabel>
              <Input {...field} {...bounds} id={`vehicle-${name}`} type="number" value={field.value ?? ""}
                onChange={(event) => field.onChange(event.target.value === "" ? null : Number(event.target.value))}
                aria-invalid={fieldState.invalid} aria-describedby={fieldState.error ? `${name}-error` : undefined} />
              <FieldError id={`${name}-error`} errors={[fieldState.error]} />
            </Field>
          )} />
        ))}
        <Controller name="settings.imageUrl" control={form.control} render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="vehicle-image">Image URL (optional)</FieldLabel>
            <Input {...field} value={field.value ?? ""} id="vehicle-image" placeholder="https://…" aria-invalid={fieldState.invalid} aria-describedby="vehicle-image-error" />
            <FieldError id="vehicle-image-error" errors={[fieldState.error]} />
          </Field>
        )} />
        <Controller name="connectorTypes" control={form.control} render={({ field, fieldState }) => (
          <Field className="sm:col-span-2" data-invalid={fieldState.invalid}>
            <fieldset aria-describedby="vehicle-connectors-error">
              <legend className="mb-2 text-sm font-medium">Charging connectors</legend>
              <div className="flex flex-wrap gap-3">
                {evConnectorOptions.map((connector) => (
                  <label key={connector} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={field.value.includes(connector)} disabled={pending}
                      onCheckedChange={(checked) => field.onChange(checked ? [...field.value, connector] : field.value.filter((value) => value !== connector))} />
                    {connector}
                  </label>
                ))}
              </div>
            </fieldset>
            <FieldError id="vehicle-connectors-error" errors={[fieldState.error]} />
          </Field>
        )} />
      </fieldset>
      <p className="text-xs text-muted-foreground">Use the average consumption shown by your car. Leave an unknown charging limit blank; enter 0 only if charging is unsupported.</p>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>Cancel</Button>
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save custom EV"}</Button>
      </div>
    </form>
  );
}
