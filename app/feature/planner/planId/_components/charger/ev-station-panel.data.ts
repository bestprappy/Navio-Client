export type EvGarageVehicle = {
  name: string;
  rangeKm: number;
  batteryPercent: number;
  chargePercent: number;
  imageUrl: string;
};

export type EvStationVisual = {
  imageUrl: string;
  alt: string;
};

export const evGarageVehicle: EvGarageVehicle = {
  name: "Kia EV6",
  rangeKm: 172,
  batteryPercent: 82,
  chargePercent: 80,
  imageUrl:
    "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=520&q=80",
};

const evStationVisuals: EvStationVisual[] = [
  {
    imageUrl:
      "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=320&q=80",
    alt: "EV charging connector plugged into a vehicle",
  },
  {
    imageUrl:
      "https://images.unsplash.com/photo-1617886322168-72b886573c8c?auto=format&fit=crop&w=320&q=80",
    alt: "Electric vehicle charging station",
  },
  {
    imageUrl:
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=320&q=80",
    alt: "EV charger beside a parked car",
  },
];

export function getEvStationVisual(chargerId: string): EvStationVisual {
  const hash = Array.from(chargerId).reduce(
    (total, char) => total + char.charCodeAt(0),
    0,
  );

  return evStationVisuals[hash % evStationVisuals.length] ?? evStationVisuals[0];
}
