// ── Types ───────────────────────────────────────────────────────────────────

export type Stop = {
  id: string
  name: string
  address: string
  coordinates: [number, number]
  chargingTimeMin: number
  batteryGainPct: number
  network: string
  availableChargers: number
  totalChargers: number
  chargerType: 'dc-fast' | 'ac-level2'
}

export type DirectionStep = {
  id: string
  instruction: string
  distanceKm: number
  durationMin: number
  type: 'depart' | 'continue' | 'turn-left' | 'turn-right' | 'charge' | 'arrive'
}

export type RouteGeoJSON = {
  type: 'Feature'
  geometry: {
    type: 'LineString'
    coordinates: [number, number][]
  }
  properties: Record<string, unknown>
}

export type TripRoute = {
  id: string
  name: string
  origin: { label: string; coordinates: [number, number] }
  destination: { label: string; coordinates: [number, number] }
  distanceKm: number
  durationMin: number
  chargingTotalMin: number
  batteryStartPct: number
  batteryEndPct: number
  routeGeoJSON: RouteGeoJSON
  stops: Stop[]
  directions: DirectionStep[]
}

export type VehicleModel = {
  id: string
  name: string
  rangeKm: number
}

// ── Mock Data ────────────────────────────────────────────────────────────────

export const MOCK_ROUTE: TripRoute = {
  id: '01HWXXXXXXXXXXXXXXXXXXX001',
  name: 'Bangkok → Chiang Mai',
  origin: { label: 'Bangkok, Thailand', coordinates: [100.5018, 13.7563] },
  destination: { label: 'Chiang Mai, Thailand', coordinates: [98.9929, 18.7883] },
  distanceKm: 697,
  durationMin: 375,
  chargingTotalMin: 75,
  batteryStartPct: 80,
  batteryEndPct: 14,
  routeGeoJSON: {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [100.5018, 13.7563], // Bangkok
        [100.5876, 14.3692], // Ayutthaya
        [100.6547, 14.7995], // Lopburi
        [100.4121, 15.2047], // Chai Nat
        [100.1274, 15.6984], // Nakhon Sawan (stop 1)
        [99.8264, 16.4358],  // Kamphaeng Phet
        [99.1333, 16.8700],  // Tak
        [99.2800, 17.5800],  // Lampang area
        [99.5186, 18.2889],  // Lampang (stop 2)
        [99.0300, 18.5500],  // Lamphun
        [98.9929, 18.7883],  // Chiang Mai
      ],
    },
    properties: {},
  },
  stops: [
    {
      id: 'stop-01',
      name: 'EA Anywhere Nakhon Sawan',
      address: '45/8 Asia Rd, Nakhon Sawan 60000',
      coordinates: [100.1274, 15.6984],
      chargingTimeMin: 45,
      batteryGainPct: 52,
      network: 'EA Anywhere',
      availableChargers: 3,
      totalChargers: 4,
      chargerType: 'dc-fast',
    },
    {
      id: 'stop-02',
      name: 'PEA Volta Lampang',
      address: '238 Phahon Yothin Rd, Lampang 52000',
      coordinates: [99.5186, 18.2889],
      chargingTimeMin: 30,
      batteryGainPct: 38,
      network: 'PEA Volta',
      availableChargers: 2,
      totalChargers: 3,
      chargerType: 'dc-fast',
    },
  ],
  directions: [
    { id: 'd-01', instruction: 'Head north on Vibhavadi Rangsit Rd', distanceKm: 12, durationMin: 18, type: 'depart' },
    { id: 'd-02', instruction: 'Merge onto Highway 1 toward Ayutthaya', distanceKm: 65, durationMin: 50, type: 'continue' },
    { id: 'd-03', instruction: 'Continue north through Lopburi', distanceKm: 80, durationMin: 60, type: 'continue' },
    { id: 'd-04', instruction: 'Take exit toward Nakhon Sawan city centre', distanceKm: 90, durationMin: 70, type: 'turn-left' },
    { id: 'd-05', instruction: 'Charging stop — EA Anywhere Nakhon Sawan', distanceKm: 0, durationMin: 45, type: 'charge' },
    { id: 'd-06', instruction: 'Resume north on Highway 1', distanceKm: 140, durationMin: 105, type: 'continue' },
    { id: 'd-07', instruction: 'Turn right onto Hwy 11 toward Lampang', distanceKm: 80, durationMin: 60, type: 'turn-right' },
    { id: 'd-08', instruction: 'Charging stop — PEA Volta Lampang', distanceKm: 0, durationMin: 30, type: 'charge' },
    { id: 'd-09', instruction: 'Follow Hwy 11 north to Chiang Mai', distanceKm: 100, durationMin: 75, type: 'continue' },
    { id: 'd-10', instruction: 'Arrive at Chiang Mai', distanceKm: 0, durationMin: 0, type: 'arrive' },
  ],
}

export const EV_VEHICLE_MODELS: VehicleModel[] = [
  { id: 'model3', name: 'Tesla Model 3', rangeKm: 435 },
  { id: 'modelY', name: 'Tesla Model Y', rangeKm: 455 },
  { id: 'bydatto3', name: 'BYD Atto 3', rangeKm: 480 },
  { id: 'ora', name: 'ORA Good Cat', rangeKm: 400 },
  { id: 'neta', name: 'NETA V', rangeKm: 380 },
  { id: 'ioniq6', name: 'Hyundai IONIQ 6', rangeKm: 520 },
]
