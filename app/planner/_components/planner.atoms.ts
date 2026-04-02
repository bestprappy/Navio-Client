'use client'

import { atom } from 'jotai'
import { MOCK_ROUTE } from './data'
import type { Stop, TripRoute } from './data'

export type PlannerTab = 'summary' | 'stops' | 'directions'

// Active route (mock data as initial value)
export const activeRouteAtom = atom<TripRoute>(MOCK_ROUTE)

// Right panel tab
export const activePanelTabAtom = atom<PlannerTab>('summary')

// Selected charging stop (syncs map marker highlight with panel)
export const selectedStopAtom = atom<Stop | null>(null)

// Sidebar form state
export const originInputAtom = atom<string>(MOCK_ROUTE.origin.label)
export const destinationInputAtom = atom<string>(MOCK_ROUTE.destination.label)

// EV settings
export const selectedVehicleIdAtom = atom<string>('model3')
export const batteryStartAtom = atom<number>(80)
