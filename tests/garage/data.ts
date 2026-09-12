export const catalogFixture = {
  id: "th-byd-atto-3-extended-2026", make: "BYD", model: "ATTO 3", trim: "Extended", year: 2026,
  market: "TH", batteryCapacityKwh: 60.48, batteryCapacityBasis: "MANUFACTURER_DECLARED",
  rangeKm: 480, rangeStandard: "NEDC", connectorTypes: ["TYPE2", "CCS2"], maxAcKw: 7, maxDcKw: 88,
  imageUrl: "/images/vehicles/byd-atto-3.png", sourceUrl: "https://www.reverautomotive.com/specification.pdf", verifiedAt: "2026-09-12",
};

export const savedVehicleFixture = {
  id: "10000000-0000-4000-8000-000000000001", nickname: null, make: "BYD", model: "ATTO 3", year: 2026,
  batteryCapacityKwh: 60.48, rangeKm: 480, consumptionKwhPer100km: 17.5, connectorTypes: ["TYPE2", "CCS2"],
  isDefault: true, createdAt: "2026-09-12T00:00:00Z", updatedAt: "2026-09-12T00:00:00Z",
  settings: { maxAcKw: 7, maxDcKw: 88, startingBatteryPct: 65, imageUrl: "/images/vehicles/byd-atto-3.png" },
  catalog: catalogFixture,
};
