export type EvGarageVehicle = {
  name: string;
  rangeKm: number;
  batteryPercent: number;
  chargePercent: number;
  imageUrl: string;
};

export const evGarageVehicle: EvGarageVehicle = {
  name: "Kia EV6",
  rangeKm: 172,
  batteryPercent: 82,
  chargePercent: 80,
  imageUrl:
    "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=520&q=80",
};
