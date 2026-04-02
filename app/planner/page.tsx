import type { Metadata } from 'next'
import { Planner } from './_components/planner'

export const metadata: Metadata = {
  title: 'Trip Planner — Navio',
  description: 'Plan your EV road trip with smart charging stops and real-time route optimization.',
}

export default function PlannerPage() {
  return <Planner />
}
