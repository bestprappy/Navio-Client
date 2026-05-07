export type DestinationType = "city" | "region" | "country";

export type Destination = {
  id: string;
  name: string;
  type: DestinationType;
  country: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  alternateTerms?: string[];
};

export const destinationTypeLabels: Record<DestinationType, string> = {
  city: "Cities",
  region: "Regions",
  country: "Countries",
};

export const destinationTypes: DestinationType[] = ["city", "region", "country"];

export const mockDestinations: Destination[] = [
  {
    id: "bangkok-thailand",
    name: "Bangkok",
    type: "city",
    country: "Thailand",
    coordinates: {
      latitude: 13.7563,
      longitude: 100.5018,
    },
    alternateTerms: ["Krung Thep", "BKK", "Bangkok Metropolitan Region"],
  },
  {
    id: "bang-saen-thailand",
    name: "Bang Saen",
    type: "city",
    country: "Thailand",
    coordinates: {
      latitude: 13.2858,
      longitude: 100.9168,
    },
    alternateTerms: ["Chonburi beach", "near Bangkok"],
  },
  {
    id: "ban-chang-thailand",
    name: "Ban Chang",
    type: "city",
    country: "Thailand",
    coordinates: {
      latitude: 12.7256,
      longitude: 101.0553,
    },
    alternateTerms: ["Rayong", "U-Tapao"],
  },
  {
    id: "chiang-mai-thailand",
    name: "Chiang Mai",
    type: "city",
    country: "Thailand",
    coordinates: {
      latitude: 18.7883,
      longitude: 98.9853,
    },
    alternateTerms: ["Northern Thailand", "CNX"],
  },
  {
    id: "phuket-thailand",
    name: "Phuket",
    type: "city",
    country: "Thailand",
    coordinates: {
      latitude: 7.8804,
      longitude: 98.3923,
    },
    alternateTerms: ["Patong", "Andaman"],
  },
  {
    id: "hua-hin-thailand",
    name: "Hua Hin",
    type: "city",
    country: "Thailand",
    coordinates: {
      latitude: 12.5684,
      longitude: 99.9577,
    },
    alternateTerms: ["Prachuap Khiri Khan", "beach"],
  },
  {
    id: "isaan-thailand",
    name: "Isaan",
    type: "region",
    country: "Thailand",
    coordinates: {
      latitude: 15.87,
      longitude: 102.015,
    },
    alternateTerms: ["Northeastern Thailand", "Khorat Plateau"],
  },
  {
    id: "southern-thailand",
    name: "Southern Thailand",
    type: "region",
    country: "Thailand",
    coordinates: {
      latitude: 8.4407,
      longitude: 99.9599,
    },
    alternateTerms: ["Andaman Coast", "Gulf Coast"],
  },
  {
    id: "thailand",
    name: "Thailand",
    type: "country",
    country: "Thailand",
    coordinates: {
      latitude: 15.87,
      longitude: 100.9925,
    },
    alternateTerms: ["Thai", "Siam"],
  },
  {
    id: "tokyo-japan",
    name: "Tokyo",
    type: "city",
    country: "Japan",
    coordinates: {
      latitude: 35.6762,
      longitude: 139.6503,
    },
    alternateTerms: ["Shinjuku", "Shibuya", "Kanto"],
  },
  {
    id: "osaka-japan",
    name: "Osaka",
    type: "city",
    country: "Japan",
    coordinates: {
      latitude: 34.6937,
      longitude: 135.5023,
    },
    alternateTerms: ["Kansai"],
  },
  {
    id: "bali-indonesia",
    name: "Bali",
    type: "region",
    country: "Indonesia",
    coordinates: {
      latitude: -8.3405,
      longitude: 115.092,
    },
    alternateTerms: ["Denpasar", "Ubud"],
  },
  {
    id: "vietnam",
    name: "Vietnam",
    type: "country",
    country: "Vietnam",
    coordinates: {
      latitude: 14.0583,
      longitude: 108.2772,
    },
    alternateTerms: ["Da Nang", "Hanoi", "Ho Chi Minh City"],
  },
];

export function filterDestinations(query: string): Destination[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  if (!normalizedQuery) {
    return mockDestinations;
  }

  return mockDestinations.filter((destination) => {
    const searchableTerms = [
      destination.name,
      destination.country,
      ...(destination.alternateTerms ?? []),
    ];

    return searchableTerms.some((term) =>
      term.toLocaleLowerCase().includes(normalizedQuery),
    );
  });
}

export function getDestinationById(destinationId: string | undefined) {
  if (!destinationId) {
    return null;
  }

  return (
    mockDestinations.find((destination) => destination.id === destinationId) ??
    null
  );
}
