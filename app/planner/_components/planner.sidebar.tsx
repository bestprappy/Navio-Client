'use client'

import { useAtom, useAtomValue } from 'jotai'
import {
  MapPin,
  Navigation,
  Plus,
  ChevronDown,
  Battery,
  Car,
  Route,
} from 'lucide-react'
import {
  originInputAtom,
  destinationInputAtom,
  selectedVehicleIdAtom,
  batteryStartAtom,
} from './planner.atoms'
import { EV_VEHICLE_MODELS } from './data'

export function PlannerSidebar() {
  const [origin, setOrigin] = useAtom(originInputAtom)
  const [destination, setDestination] = useAtom(destinationInputAtom)
  const [vehicleId, setVehicleId] = useAtom(selectedVehicleIdAtom)
  const [battery, setBattery] = useAtom(batteryStartAtom)

  const vehicle = EV_VEHICLE_MODELS.find((v) => v.id === vehicleId) ?? EV_VEHICLE_MODELS[0]
  const estimatedRangeKm = Math.round((battery / 100) * vehicle.rangeKm)

  return (
    <aside
      className="flex flex-col w-[380px] shrink-0 h-full border-r border-border bg-card overflow-y-auto"
      aria-label="Trip planner sidebar"
    >
      {/* ── Route Section ───────────────────────────────────────── */}
      <section className="p-5 border-b border-border">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Route
        </h2>

        {/* Origin input */}
        <div className="flex items-start gap-3 mb-1">
          <div className="flex flex-col items-center pt-3 shrink-0">
            <div className="w-3 h-3 rounded-full bg-primary border-2 border-primary-foreground shadow-sm" />
          </div>
          <div className="flex-1">
            <label htmlFor="origin-input" className="sr-only">
              Starting point
            </label>
            <input
              id="origin-input"
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Starting point"
              className="w-full px-3 py-2.5 rounded-xl text-sm bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-colors"
            />
          </div>
        </div>

        {/* Connector */}
        <div className="flex items-center gap-3 my-0.5">
          <div className="flex flex-col items-center w-3 shrink-0">
            <div className="w-px h-5 bg-border" />
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors ml-0"
          >
            <Plus className="w-3 h-3" />
            Add stop
          </button>
        </div>

        {/* Destination input */}
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center pt-3 shrink-0">
            <div className="w-3 h-3 rounded-sm bg-foreground shadow-sm" />
          </div>
          <div className="flex-1">
            <label htmlFor="destination-input" className="sr-only">
              Destination
            </label>
            <input
              id="destination-input"
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Destination"
              className="w-full px-3 py-2.5 rounded-xl text-sm bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-colors"
            />
          </div>
        </div>
      </section>

      {/* ── EV Settings Section ─────────────────────────────────── */}
      <section className="p-5 border-b border-border">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          EV Settings
        </h2>

        {/* Vehicle model */}
        <div className="mb-4">
          <label
            htmlFor="vehicle-select"
            className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-2"
          >
            <Car className="w-3.5 h-3.5 text-muted-foreground" />
            Vehicle
          </label>
          <div className="relative">
            <select
              id="vehicle-select"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full appearance-none px-3 py-2.5 pr-8 rounded-xl text-sm bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-colors cursor-pointer"
            >
              {EV_VEHICLE_MODELS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.rangeKm} km)
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Battery level */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="battery-slider"
              className="flex items-center gap-1.5 text-xs font-medium text-foreground"
            >
              <Battery className="w-3.5 h-3.5 text-muted-foreground" />
              Starting battery
            </label>
            <span className="text-sm font-semibold tabular-nums text-primary">
              {battery}%
            </span>
          </div>
          <input
            id="battery-slider"
            type="range"
            min={10}
            max={100}
            step={5}
            value={battery}
            onChange={(e) => setBattery(Number(e.target.value))}
            className="w-full h-2 rounded-full accent-primary cursor-pointer"
          />
          {/* Battery track visual */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">10%</span>
            <span className="text-xs text-muted-foreground font-medium">
              ~{estimatedRangeKm} km range
            </span>
            <span className="text-xs text-muted-foreground">100%</span>
          </div>
        </div>
      </section>

      {/* ── Placeholder: Preferences Section ────────────────────── */}
      <section className="p-5 border-b border-border">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Preferences
        </h2>
        <div className="flex flex-col gap-2">
          {(['Fastest route', 'Fewest stops', 'Scenic route'] as const).map((pref) => (
            <label
              key={pref}
              className="flex items-center gap-2.5 text-sm text-foreground cursor-pointer group"
            >
              <input
                type="radio"
                name="route-pref"
                defaultChecked={pref === 'Fastest route'}
                className="accent-primary w-4 h-4 cursor-pointer"
              />
              <span className="group-hover:text-primary transition-colors">{pref}</span>
            </label>
          ))}
        </div>
      </section>

      {/* ── Action Section ──────────────────────────────────────── */}
      <section className="p-5 mt-auto">
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-md hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <Route className="w-4 h-4" />
          Plan My Route
        </button>
        <button
          type="button"
          className="w-full mt-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5"
        >
          Clear and start over
        </button>
      </section>
    </aside>
  )
}
