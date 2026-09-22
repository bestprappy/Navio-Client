"use client";

import { useId, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EvCar } from "../constants/vehicle.types";
import type { RouteSegment } from "../routes/trip-route.types";
import { DEFAULT_PHYSICS, simulateEnergy, validateSegments, type PhysicsProfile, type SimulationInput, type SimulationSegment } from "./energy-simulation";
import { SIMULATION_MODEL } from "./simulation-model";

const sampleSchema = z.array(z.object({
  distanceMeters: z.number(), durationSeconds: z.number(), elevationDeltaMeters: z.number(),
  startSpeedMps: z.number().optional(), endSpeedMps: z.number().optional(),
})).min(1).max(10000);

const profileFields: { key: keyof PhysicsProfile; label: string; min: number; max: number; step: number }[] = [
  { key: "massKg", label: "Vehicle + payload (kg)", min: 100, max: 10000, step: 1 },
  { key: "dragAreaM2", label: "Drag coefficient × frontal area (m²)", min: 0, max: 10, step: 0.01 },
  { key: "rollingResistance", label: "Rolling resistance coefficient", min: 0, max: 0.1, step: 0.001 },
  { key: "airDensityKgM3", label: "Air density (kg/m³)", min: 0.5, max: 2, step: 0.001 },
  { key: "driveEfficiency", label: "Drivetrain efficiency (0–1)", min: 0.1, max: 1, step: 0.01 },
  { key: "regenEfficiency", label: "Regeneration efficiency (0–1)", min: 0, max: 1, step: 0.01 },
  { key: "maxRegenKw", label: "Battery regeneration limit (kW)", min: 0, max: 500, step: 1 },
  { key: "auxiliaryKw", label: "HVAC and accessories (kW)", min: 0, max: 30, step: 0.1 },
];

type Comparison = {
  key: string;
  input: SimulationInput;
  baseline: ReturnType<typeof simulateEnergy>;
  physics: ReturnType<typeof simulateEnergy>;
  source: string;
};

export function EnergySimulationPanel({ car, startingSocPct, segments }: {
  car: EvCar; startingSocPct: number; segments: RouteSegment[];
}) {
  const id = useId();
  const [capacity, setCapacity] = useState(String(car.batteryKwh));
  const [reserve, setReserve] = useState(String(SIMULATION_MODEL.reserveSocPct));
  const [margin, setMargin] = useState(String(SIMULATION_MODEL.planningMarginFraction * 100));
  const [profile, setProfile] = useState(() => Object.fromEntries(
    Object.entries(DEFAULT_PHYSICS).map(([key, value]) => [key, String(value)]),
  ) as Record<keyof PhysicsProfile, string>);
  const [uploaded, setUploaded] = useState<{ name: string; samples: SimulationSegment[] } | null>(null);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const key = JSON.stringify({ capacity, reserve, margin, profile, uploaded, segments, car, startingSocPct });
  const current = comparison?.key === key ? comparison : null;

  function compare() {
    try {
      if ([capacity, reserve, margin, ...Object.values(profile)].some(value => value.trim() === "")) throw new Error("Complete every simulation input.");
      if (!uploaded && (!segments.length || segments.some(segment => segment.status !== "routed" ||
        segment.distanceMeters == null || segment.durationSeconds == null || segment.durationSeconds <= 0))) {
        throw new Error("Wait for complete road routes or import a reference sample file.");
      }
      const samples = uploaded?.samples ?? segments.map(segment => ({
        distanceMeters: segment.distanceMeters!, durationSeconds: segment.durationSeconds!, elevationDeltaMeters: 0,
      }));
      const input: SimulationInput = {
        model: "physics", usableBatteryKwh: Number(capacity), startingSocPct,
        reserveSocPct: Number(reserve), planningMarginFraction: Number(margin) / 100,
        consumptionKwhPer100km: car.consumptionKwhPer100km,
        profile: Object.fromEntries(Object.entries(profile).map(([name, value]) => [name, Number(value)])) as PhysicsProfile,
        segments: samples,
      };
      setComparison({ key, input, physics: simulateEnergy(input), baseline: simulateEnergy({ ...input, model: "baseline" }),
        source: uploaded ? `User-supplied samples: ${uploaded.name}; not independently verified` :
          "Google route legs; constant average speed per leg; elevation unavailable and assumed flat" });
      setError(null);
    } catch (failure) {
      setComparison(null);
      setError(failure instanceof Error ? failure.message : "The simulation could not run.");
    }
  }

  function download() {
    if (!current) return;
    const file = { version: SIMULATION_MODEL.version, createdAt: new Date().toISOString(),
      vehicle: { id: car.id, make: car.make, model: car.model, year: car.year, trim: car.trim,
        market: car.market, rangeStandard: car.rangeStandard, sourceUrl: car.sourceUrl, verifiedAt: car.verifiedAt },
      provenance: { route: current.source, physics: "User-configurable assumptions, not manufacturer-verified",
        capacity: "User-confirmed assumption; catalogue capacity is manufacturer-declared, usable capacity unconfirmed",
        consumption: "Saved or derived consumption; assumed battery-side, measurement basis unverified" },
      scope: "Energy comparison without charging stops. Scenario verification, not measured vehicle accuracy.",
      input: current.input, baseline: current.baseline, physics: current.physics };
    const url = URL.createObjectURL(new Blob([JSON.stringify(file, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "navio-energy-simulation.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <section aria-labelledby={`${id}-title`} className="mt-6 rounded-lg border border-border bg-card p-4">
      <h3 id={`${id}-title`} className="text-base font-semibold">Energy simulation</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Compare distance-based consumption with a physics scenario for {car.make} {car.model}.
        This experiment excludes charging stops and does not change your itinerary. Planner estimates use the distance-based model.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Catalogue capacity is manufacturer-declared, with usable capacity unconfirmed. Enter a documented usable value if available.
        Physics values below are editable assumptions, not specifications for this vehicle.
      </p>
      <form className="mt-4 space-y-4" onSubmit={event => { event.preventDefault(); compare(); }}>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1 text-sm" htmlFor={`${id}-capacity`}>Assumed usable battery (kWh)
            <Input id={`${id}-capacity`} required type="number" min="0.1" max="1000" step="0.01" value={capacity} onChange={e => setCapacity(e.target.value)} />
          </label>
          <label className="grid gap-1 text-sm" htmlFor={`${id}-reserve`}>Reserve (%)
            <Input id={`${id}-reserve`} required type="number" min="0" max="100" step="1" value={reserve} onChange={e => setReserve(e.target.value)} />
          </label>
          <label className="grid gap-1 text-sm" htmlFor={`${id}-margin`}>Energy margin (%)
            <Input id={`${id}-margin`} required type="number" min="0" max="100" step="1" value={margin} onChange={e => setMargin(e.target.value)} />
          </label>
        </div>
        <details>
          <summary className="cursor-pointer text-sm font-medium">Physics assumptions</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {profileFields.map(field => <label key={field.key} htmlFor={`${id}-${field.key}`} className="grid gap-1 text-sm">
              {field.label}<Input id={`${id}-${field.key}`} required type="number" min={field.min} max={field.max} step={field.step}
                value={profile[field.key]} onChange={event => setProfile({ ...profile, [field.key]: event.target.value })} />
            </label>)}
          </div>
        </details>
        <details>
          <summary className="cursor-pointer text-sm font-medium">Import reference route samples</summary>
          <p className="my-2 text-xs text-muted-foreground">
            JSON array of distanceMeters, durationSeconds and elevationDeltaMeters. Optional startSpeedMps and endSpeedMps
            describe linear-speed samples. Use short samples at changes in slope or speed. Files stay in this browser; maximum 1 MB.
          </p>
          <Input type="file" accept=".json,application/json" aria-label="Reference route samples" disabled={reading} onChange={async event => {
            const file = event.target.files?.[0];
            if (!file) return;
            setReading(true);
            setComparison(null);
            try {
              if (file.size > 1000000) throw new Error("Reference files must be 1 MB or smaller.");
              const samples = sampleSchema.parse(JSON.parse(await file.text()));
              validateSegments(samples);
              setUploaded({ name: file.name, samples });
              setError(null);
            } catch (failure) { setUploaded(null); setError(failure instanceof Error ? failure.message : "Invalid sample file."); }
            finally { setReading(false); }
          }} />
          {uploaded && <Button type="button" variant="outline" className="mt-2" onClick={() => { setUploaded(null); setComparison(null); }}>Use current route</Button>}
        </details>
        <p className="text-xs text-muted-foreground">
          {uploaded ? `Source: ${uploaded.name} (${uploaded.samples.length} samples).` :
            `Source: ${segments.length} current route legs, using average speeds and flat terrain. Elevation and acceleration are not supplied by these routes.`}
          {` Starting battery: ${startingSocPct}%.`}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={reading}>Compare energy models</Button>
          {current && <Button type="button" variant="outline" onClick={download}>Export experiment</Button>}
        </div>
      </form>
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      {current && <div className="mt-4" role="status">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="mb-2 text-left text-xs text-muted-foreground">Scenario comparison without charging. Negative SOC means insufficient energy.</caption>
            <thead><tr className="border-b border-border"><th className="py-2 pr-3">Result</th><th className="py-2 pr-3">Distance model</th><th className="py-2">Physics scenario</th></tr></thead>
            <tbody>
              {([ ["Nominal energy", "nominalKwh", "kWh"], ["Planning energy", "planningKwh", "kWh"],
                ["Arrival SOC", "finalSocPct", "%"], ["Lowest sampled SOC", "minimumSocPct", "%"] ] as const).map(([label, name, unit]) =>
                <tr key={name} className="border-b border-border"><th className="py-2 pr-3 font-normal">{label}</th>
                  <td className="py-2 pr-3 font-mono">{current.baseline[name].toFixed(2)} {unit}</td>
                  <td className="py-2 font-mono">{current.physics[name].toFixed(2)} {unit}</td></tr>)}
              <tr><th className="py-2 pr-3 font-normal">Reserve policy</th>{[current.baseline, current.physics].map(result =>
                <td key={result.model} className="py-2 pr-3">{result.feasible ? "Met at sampled points" : `Fails at ${result.firstReserveViolation === 0 ? "departure" : `sample ${result.firstReserveViolation}`}`}</td>)}</tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Model comparison measures sensitivity to the inputs. It does not establish accuracy against a physical EV. An elevation-free route cannot evaluate hills.</p>
      </div>}
    </section>
  );
}
