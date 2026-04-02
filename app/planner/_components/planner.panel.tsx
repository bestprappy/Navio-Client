'use client'

import { useAtom, useAtomValue } from 'jotai'
import {
  Zap,
  Clock,
  Route,
  Navigation,
  MapPin,
  ArrowRight,
  CornerDownLeft,
} from 'lucide-react'
import { activePanelTabAtom, activeRouteAtom, selectedStopAtom } from './planner.atoms'
import type { PlannerTab } from './planner.atoms'
import type { DirectionStep } from './data'

// ── Panel Tab Bar ─────────────────────────────────────────────────────────────

const TABS: { id: PlannerTab; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'stops', label: 'Stops' },
  { id: 'directions', label: 'Directions' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

function DirectionIcon({ type }: { type: DirectionStep['type'] }) {
  const base = 'w-4 h-4 shrink-0'
  switch (type) {
    case 'depart':
      return <Navigation className={`${base} text-primary`} />
    case 'turn-left':
      return <CornerDownLeft className={`${base} text-foreground`} style={{ transform: 'scaleX(-1)' }} />
    case 'turn-right':
      return <CornerDownLeft className={`${base} text-foreground`} />
    case 'charge':
      return <Zap className={`${base} text-amber-500`} fill="currentColor" />
    case 'arrive':
      return <MapPin className={`${base} text-primary`} fill="currentColor" />
    default:
      return <ArrowRight className={`${base} text-muted-foreground`} />
  }
}

// ── Summary Tab ───────────────────────────────────────────────────────────────

function SummaryTab() {
  const route = useAtomValue(activeRouteAtom)
  const drivingMin = route.durationMin
  const totalMin = drivingMin + route.chargingTotalMin
  const batteryDrop = route.batteryStartPct - route.batteryEndPct

  return (
    <div className="flex flex-col gap-4 p-5">
      {/* Key stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<Route className="w-4 h-4 text-primary" />}
          value={`${route.distanceKm}`}
          unit="km"
          label="Distance"
        />
        <StatCard
          icon={<Clock className="w-4 h-4 text-primary" />}
          value={formatDuration(totalMin)}
          label="Total time"
        />
        <StatCard
          icon={<Zap className="w-4 h-4 text-amber-500" />}
          value={`${route.stops.length}`}
          label="Charge stops"
        />
      </div>

      {/* Battery range */}
      <div className="rounded-xl border border-border bg-muted/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Battery
          </span>
          <span className="text-xs text-muted-foreground">
            -{batteryDrop}% net usage
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold tabular-nums text-foreground">
            {route.batteryStartPct}%
          </span>
          <div className="flex-1 relative h-3 rounded-full bg-border overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all"
              style={{ width: `${route.batteryStartPct}%` }}
            />
            <div
              className="absolute top-0 h-full w-0.5 bg-white/50"
              style={{ left: `${route.batteryEndPct}%` }}
            />
          </div>
          <span className="text-lg font-bold tabular-nums text-muted-foreground">
            {route.batteryEndPct}%
          </span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">Start</span>
          <span className="text-xs text-amber-600 font-medium">After {route.stops.length} charges: +{route.stops.reduce((acc, s) => acc + s.batteryGainPct, 0)}%</span>
          <span className="text-xs text-muted-foreground">Arrive</span>
        </div>
      </div>

      {/* Time breakdown */}
      <div className="rounded-xl border border-border bg-muted/40 p-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-3">
          Time breakdown
        </span>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Drive time</span>
            <span className="font-semibold tabular-nums">{formatDuration(drivingMin)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Charging time</span>
            <span className="font-semibold tabular-nums text-amber-600">{formatDuration(route.chargingTotalMin)}</span>
          </div>
          <div className="h-px bg-border my-1" />
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">Total</span>
            <span className="font-bold tabular-nums">{formatDuration(totalMin)}</span>
          </div>
        </div>
      </div>

      {/* Placeholder cost estimate */}
      <div className="rounded-xl border border-dashed border-border bg-transparent p-4 text-center">
        <span className="text-xs text-muted-foreground">
          Cost estimate coming soon
        </span>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  value,
  unit,
  label,
}: {
  icon: React.ReactNode
  value: string
  unit?: string
  label: string
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3 flex flex-col gap-1">
      {icon}
      <div className="flex items-baseline gap-0.5">
        <span className="text-lg font-bold tabular-nums leading-tight">{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

// ── Stops Tab ─────────────────────────────────────────────────────────────────

function StopsTab() {
  const route = useAtomValue(activeRouteAtom)
  const [selectedStop, setSelectedStop] = useAtom(selectedStopAtom)

  return (
    <div className="flex flex-col gap-3 p-5">
      <p className="text-xs text-muted-foreground">
        {route.stops.length} charging stop{route.stops.length !== 1 ? 's' : ''} planned along your route.
      </p>
      {route.stops.map((stop, i) => {
        const isSelected = selectedStop?.id === stop.id
        return (
          <button
            key={stop.id}
            type="button"
            onClick={() => setSelectedStop(isSelected ? null : stop)}
            className={[
              'w-full text-left rounded-xl border p-4 transition-all duration-150',
              isSelected
                ? 'border-primary/50 bg-primary/5 shadow-sm'
                : 'border-border bg-muted/30 hover:border-border/80 hover:bg-muted/50',
            ].join(' ')}
            aria-pressed={isSelected}
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                  <Zap className="w-3.5 h-3.5 text-amber-600" fill="currentColor" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    Stop {i + 1}: {stop.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stop.network}</p>
                </div>
              </div>
              <span
                className={[
                  'text-xs font-medium px-2 py-0.5 rounded-full shrink-0',
                  stop.chargerType === 'dc-fast'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground',
                ].join(' ')}
              >
                {stop.chargerType === 'dc-fast' ? 'DC Fast' : 'AC L2'}
              </span>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {stop.chargingTimeMin} min
              </span>
              <span className="flex items-center gap-1 text-amber-600 font-medium">
                <Zap className="w-3 h-3" />
                +{stop.batteryGainPct}%
              </span>
              <span className="flex items-center gap-1">
                <span
                  className={[
                    'w-2 h-2 rounded-full',
                    stop.availableChargers > 0 ? 'bg-green-500' : 'bg-red-400',
                  ].join(' ')}
                />
                {stop.availableChargers}/{stop.totalChargers} available
              </span>
            </div>

            <p className="text-xs text-muted-foreground mt-2 truncate">{stop.address}</p>
          </button>
        )
      })}
    </div>
  )
}

// ── Directions Tab ────────────────────────────────────────────────────────────

function DirectionsTab() {
  const route = useAtomValue(activeRouteAtom)

  return (
    <div className="flex flex-col p-5 gap-1">
      {route.directions.map((step, i) => (
        <div
          key={step.id}
          className={[
            'flex items-start gap-3 py-3',
            i < route.directions.length - 1 ? 'border-b border-border/50' : '',
          ].join(' ')}
        >
          <div className="mt-0.5 shrink-0">
            <DirectionIcon type={step.type} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground leading-snug">{step.instruction}</p>
            {(step.distanceKm > 0 || step.durationMin > 0) && (
              <div className="flex items-center gap-2 mt-1">
                {step.distanceKm > 0 && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {step.distanceKm} km
                  </span>
                )}
                {step.distanceKm > 0 && step.durationMin > 0 && (
                  <span className="text-xs text-muted-foreground">·</span>
                )}
                {step.durationMin > 0 && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatDuration(step.durationMin)}
                  </span>
                )}
              </div>
            )}
          </div>
          {step.type === 'charge' && (
            <span className="text-xs font-medium text-amber-600 shrink-0 mt-0.5">
              {step.durationMin} min
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Root Panel ────────────────────────────────────────────────────────────────

export function PlannerPanel() {
  const [activeTab, setActiveTab] = useAtom(activePanelTabAtom)

  return (
    <aside
      className="flex flex-col w-[360px] shrink-0 h-full border-l border-border bg-card overflow-hidden"
      aria-label="Trip details panel"
    >
      {/* Tab bar */}
      <div className="flex shrink-0 border-b border-border px-5 pt-4 gap-1" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'pb-3 px-1 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto" role="tabpanel">
        {activeTab === 'summary' && <SummaryTab />}
        {activeTab === 'stops' && <StopsTab />}
        {activeTab === 'directions' && <DirectionsTab />}
      </div>
    </aside>
  )
}
