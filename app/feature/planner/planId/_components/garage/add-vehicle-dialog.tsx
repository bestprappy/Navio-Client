"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Search, Zap } from "lucide-react";
import { useSetAtom } from "jotai";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { BudgetModalShell } from "../budget/budget-modal-shell";
import {
  EV_PLACEHOLDER_IMAGE_URL,
  evConnectorOptions,
  getAllEvCars,
} from "../constants/vehicle.data";
import type { EvConnectorType } from "../constants/types";
import type { EvCar } from "../constants/vehicle.types";
import { addVehicleAtom } from "./garage.atoms";
import { VehicleMedia } from "./vehicle-media";

type AddVehicleDialogProps = {
  onClose: () => void;
};

type AddVehicleMode = "preset" | "custom";

type CustomVehicleForm = {
  nickname: string;
  make: string;
  model: string;
  year: string;
  batteryKwh: string;
  rangeKm: string;
  consumptionKwhPer100km: string;
  maxAcKw: string;
  maxDcKw: string;
  imageUrl: string;
  connectorTypes: EvConnectorType[];
};

const DEFAULT_CUSTOM_FORM: CustomVehicleForm = {
  nickname: "",
  make: "",
  model: "",
  year: "2026",
  batteryKwh: "60",
  rangeKm: "420",
  consumptionKwhPer100km: "14.5",
  maxAcKw: "11",
  maxDcKw: "100",
  imageUrl: "",
  connectorTypes: ["CCS2", "TYPE2"],
};

export function AddVehicleDialog({ onClose }: AddVehicleDialogProps) {
  const [mode, setMode] = useState<AddVehicleMode>("preset");
  const [query, setQuery] = useState("");
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [customForm, setCustomForm] = useState<CustomVehicleForm>(
    DEFAULT_CUSTOM_FORM,
  );
  const addVehicle = useSetAtom(addVehicleAtom);
  const allCars = useMemo(() => getAllEvCars(), []);

  const filtered = useMemo(() => {
    if (!query.trim()) return allCars;
    const q = query.toLowerCase();
    return allCars.filter(
      (car) =>
        car.make.toLowerCase().includes(q) ||
        car.model.toLowerCase().includes(q) ||
        String(car.year).includes(q),
    );
  }, [allCars, query]);

  const selectedPreset = filtered.find((car) => car.id === selectedCarId);
  const customError = getCustomVehicleError(customForm);

  function handlePresetSubmit() {
    if (!selectedCarId) return;
    addVehicle({ source: "preset", carId: selectedCarId });
  }

  function handleCustomSubmit() {
    if (customError) return;

    addVehicle({
      source: "custom",
      nickname: customForm.nickname,
      car: {
        make: customForm.make.trim(),
        model: customForm.model.trim(),
        year: Number(customForm.year),
        batteryKwh: Number(customForm.batteryKwh),
        rangeKm: Number(customForm.rangeKm),
        consumptionKwhPer100km: Number(customForm.consumptionKwhPer100km),
        maxAcKw: Number(customForm.maxAcKw),
        maxDcKw: Number(customForm.maxDcKw),
        connectorTypes: customForm.connectorTypes,
        imageUrl: customForm.imageUrl.trim() || EV_PLACEHOLDER_IMAGE_URL,
      },
    });
  }

  return (
    <BudgetModalShell
      title="Add Vehicle"
      onClose={onClose}
      panelClassName="max-w-2xl"
    >
      <div className="mb-4 grid grid-cols-2 gap-2 rounded-md bg-muted p-1">
        <ModeButton
          isActive={mode === "preset"}
          onClick={() => setMode("preset")}
        >
          Prebuilt EV
        </ModeButton>
        <ModeButton
          isActive={mode === "custom"}
          onClick={() => setMode("custom")}
        >
          Custom EV
        </ModeButton>
      </div>

      {mode === "preset" ? (
        <div>
          <div className="relative mb-4">
            <Search
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search make, model, or year..."
              className="pl-9"
              aria-label="Search vehicles"
            />
          </div>

          <div
            className="grid max-h-80 gap-2 overflow-y-auto pr-1"
            role="listbox"
            aria-label="Available vehicles"
          >
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No vehicles found for &ldquo;{query}&rdquo;
              </p>
            ) : (
              filtered.map((car) => (
                <CarRow
                  key={car.id}
                  car={car}
                  isSelected={selectedCarId === car.id}
                  onSelect={() => setSelectedCarId(car.id)}
                />
              ))
            )}
          </div>

          <DialogActions
            onClose={onClose}
            onConfirm={handlePresetSubmit}
            confirmLabel={selectedPreset ? "Add to Garage" : "Choose Vehicle"}
            disabled={!selectedPreset}
          />
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleCustomSubmit();
          }}
        >
          <CustomVehicleFields
            form={customForm}
            onChange={setCustomForm}
          />
          {customError && (
            <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              {customError}
            </p>
          )}
          <DialogActions
            onClose={onClose}
            onConfirm={handleCustomSubmit}
            confirmLabel="Add Custom EV"
            disabled={Boolean(customError)}
          />
        </form>
      )}
    </BudgetModalShell>
  );
}

function ModeButton({
  isActive,
  onClick,
  children,
}: {
  isActive: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={onClick}
      className={cn(
        "rounded-sm px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        isActive
          ? "bg-card text-foreground shadow-xs"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

type CarRowProps = {
  car: EvCar;
  isSelected: boolean;
  onSelect: () => void;
};

function CarRow({ car, isSelected, onSelect }: CarRowProps) {
  return (
    <div
      role="option"
      aria-selected={isSelected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        onSelect();
      }}
      className={cn(
        "grid cursor-pointer grid-cols-[5.5rem_1fr] items-center gap-3 rounded-md border p-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:grid-cols-[5.5rem_1fr_auto]",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/40 hover:bg-muted/40",
      )}
    >
      <VehicleMedia car={car} compact />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">
          {car.make} {car.model}{" "}
          <span className="font-normal text-muted-foreground">({car.year})</span>
        </p>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span>{car.rangeKm} km range</span>
          <span>{car.batteryKwh} kWh</span>
          <span>{car.consumptionKwhPer100km} kWh/100km</span>
          {car.maxDcKw > 0 && <span>{car.maxDcKw} kW DC</span>}
        </div>
      </div>
      <div className="col-span-2 flex shrink-0 flex-wrap justify-end gap-1 sm:col-span-1 sm:flex-col sm:items-end">
        {car.connectorTypes.slice(0, 2).map((ct) => (
          <Badge
            key={ct}
            variant="outline"
            className="gap-1 px-1 py-0 text-[10px]"
          >
            <Zap className="size-2.5" aria-hidden="true" />
            {ct}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function CustomVehicleFields({
  form,
  onChange,
}: {
  form: CustomVehicleForm;
  onChange: (form: CustomVehicleForm) => void;
}) {
  function updateField(field: keyof CustomVehicleForm, value: string) {
    onChange({ ...form, [field]: value });
  }

  function toggleConnector(connectorType: EvConnectorType) {
    const hasConnector = form.connectorTypes.includes(connectorType);
    const connectorTypes = hasConnector
      ? form.connectorTypes.filter((type) => type !== connectorType)
      : [...form.connectorTypes, connectorType];

    onChange({ ...form, connectorTypes });
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Nickname" htmlFor="vehicle-nickname">
          <Input
            id="vehicle-nickname"
            value={form.nickname}
            onChange={(event) => updateField("nickname", event.target.value)}
            placeholder="Road trip car"
          />
        </Field>
        <Field label="Year" htmlFor="vehicle-year">
          <Input
            id="vehicle-year"
            inputMode="numeric"
            value={form.year}
            onChange={(event) => updateField("year", event.target.value)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Make" htmlFor="vehicle-make">
          <Input
            id="vehicle-make"
            value={form.make}
            onChange={(event) => updateField("make", event.target.value)}
            placeholder="Tesla"
          />
        </Field>
        <Field label="Model" htmlFor="vehicle-model">
          <Input
            id="vehicle-model"
            value={form.model}
            onChange={(event) => updateField("model", event.target.value)}
            placeholder="Model 3"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Battery capacity (kWh)" htmlFor="vehicle-battery">
          <Input
            id="vehicle-battery"
            inputMode="decimal"
            value={form.batteryKwh}
            onChange={(event) => updateField("batteryKwh", event.target.value)}
          />
        </Field>
        <Field label="Range (km)" htmlFor="vehicle-range">
          <Input
            id="vehicle-range"
            inputMode="decimal"
            value={form.rangeKm}
            onChange={(event) => updateField("rangeKm", event.target.value)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Use (kWh/100km)" htmlFor="vehicle-consumption">
          <Input
            id="vehicle-consumption"
            inputMode="decimal"
            value={form.consumptionKwhPer100km}
            onChange={(event) =>
              updateField("consumptionKwhPer100km", event.target.value)
            }
          />
        </Field>
        <Field label="AC limit (kW)" htmlFor="vehicle-ac">
          <Input
            id="vehicle-ac"
            inputMode="decimal"
            value={form.maxAcKw}
            onChange={(event) => updateField("maxAcKw", event.target.value)}
          />
        </Field>
        <Field label="DC limit (kW)" htmlFor="vehicle-dc">
          <Input
            id="vehicle-dc"
            inputMode="decimal"
            value={form.maxDcKw}
            onChange={(event) => updateField("maxDcKw", event.target.value)}
          />
        </Field>
      </div>

      <Field label="Image URL" htmlFor="vehicle-image-url">
        <Input
          id="vehicle-image-url"
          value={form.imageUrl}
          onChange={(event) => updateField("imageUrl", event.target.value)}
          placeholder="Optional image URL"
        />
      </Field>

      <div>
        <p className="mb-2 text-sm font-semibold text-foreground">
          Charger connector types
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {evConnectorOptions.map((connectorType) => (
            <label
              key={connectorType}
              className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground"
            >
              <Checkbox
                checked={form.connectorTypes.includes(connectorType)}
                onCheckedChange={() => toggleConnector(connectorType)}
                aria-label={`Toggle ${connectorType}`}
              />
              {connectorType}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function DialogActions({
  onClose,
  onConfirm,
  confirmLabel,
  disabled,
}: {
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  disabled: boolean;
}) {
  return (
    <div className="mt-5 flex justify-end gap-2">
      <Button type="button" variant="ghost" onClick={onClose}>
        Cancel
      </Button>
      <Button type="button" disabled={disabled} onClick={onConfirm}>
        {confirmLabel}
      </Button>
    </div>
  );
}

function getCustomVehicleError(form: CustomVehicleForm): string | null {
  if (!form.make.trim() || !form.model.trim()) {
    return "Add the make and model.";
  }

  if (form.connectorTypes.length === 0) {
    return "Choose at least one connector type.";
  }

  const requiredNumbers: Array<[keyof CustomVehicleForm, string]> = [
    ["year", "year"],
    ["batteryKwh", "battery capacity"],
    ["rangeKm", "range"],
    ["consumptionKwhPer100km", "consumption"],
    ["maxAcKw", "AC charge limit"],
    ["maxDcKw", "DC charge limit"],
  ];

  for (const [field, label] of requiredNumbers) {
    const value = Number(form[field]);

    if (!Number.isFinite(value) || value < 0) {
      return `Enter a valid ${label}.`;
    }
  }

  if (Number(form.year) < 1990 || Number(form.year) > 2100) {
    return "Enter a realistic model year.";
  }

  if (Number(form.batteryKwh) <= 0 || Number(form.rangeKm) <= 0) {
    return "Battery capacity and range must be greater than zero.";
  }

  if (Number(form.consumptionKwhPer100km) <= 0) {
    return "Consumption must be greater than zero.";
  }

  return null;
}
