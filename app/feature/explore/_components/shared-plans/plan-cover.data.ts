import type { ExplorePlan } from "./explore-plans-api";

/** Locally hosted, attributed destination photos. See public/images/plan-covers/README.md. */
export const PLAN_DESTINATION_COVERS = [
  {
    "city": "Taipei",
    "country": "Taiwan",
    "aliases": [
      "Taipei City"
    ],
    "src": "/images/plan-covers/taipei.webp",
    "objectPosition": "50% 50%",
    "subject": "Chiang Kai-shek Memorial Hall",
    "author": "AngMoKio",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Chiang_Kai-shek_memorial_amk.jpg",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
  },
  {
    "city": "Sydney",
    "country": "Australia",
    "aliases": [],
    "src": "/images/plan-covers/sydney.webp",
    "objectPosition": "50% 50%",
    "subject": "Sydney Opera House",
    "author": "Bernard Spragg. NZ from Christchurch, New Zealand",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Sydney_Australia._%2821339175489%29.jpg",
    "license": "CC0",
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/"
  },
  {
    "city": "Monterey",
    "country": "United States",
    "aliases": [],
    "src": "/images/plan-covers/monterey.webp",
    "objectPosition": "50% 50%",
    "subject": "Pigeon Point Lighthouse",
    "author": "Frank Schulenburg (1969\u2013)",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Pigeon_Point_Lighthouse_%282016%29.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  {
    "city": "New York",
    "country": "United States",
    "aliases": [],
    "src": "/images/plan-covers/new-york.webp",
    "objectPosition": "50% 0%",
    "subject": "Statue of Liberty",
    "author": "AskALotl",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Front_view_of_Statue_of_Liberty_%28cropped%29.jpg",
    "license": "CC0",
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/"
  },
  {
    "city": "Istanbul",
    "country": "T\u00fcrkiye",
    "aliases": [],
    "src": "/images/plan-covers/istanbul.webp",
    "objectPosition": "50% 50%",
    "subject": "Hagia Sophia",
    "author": "Adli Wahid",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Hagia_Sophia_%28228968325%29.jpeg",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
  },
  {
    "city": "Vik",
    "country": "Iceland",
    "aliases": [],
    "src": "/images/plan-covers/vik.webp",
    "objectPosition": "50% 50%",
    "subject": "Gullfoss",
    "author": "Nickspix",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Gullfoss_from_the_Air_%28cropped%29.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  {
    "city": "London",
    "country": "United Kingdom",
    "aliases": [],
    "src": "/images/plan-covers/london.webp",
    "objectPosition": "50% 0%",
    "subject": "Westminster Abbey",
    "author": "Antiquary",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Westminster_Abbey%2C_Westminster.jpg",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0/"
  },
  {
    "city": "Interlaken",
    "country": "Switzerland",
    "aliases": [],
    "src": "/images/plan-covers/interlaken.webp",
    "objectPosition": "50% 50%",
    "subject": "Chapel Bridge",
    "author": "Simon Koopmann",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Kapellbruecke.JPG",
    "license": "CC BY-SA 2.5",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.5/"
  },
  {
    "city": "Amsterdam",
    "country": "Netherlands",
    "aliases": [],
    "src": "/images/plan-covers/amsterdam.webp",
    "objectPosition": "50% 50%",
    "subject": "Rijksmuseum",
    "author": "Trougnouf (Benoit Brummer)",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:South_facade_of_the_Rijksmuseum_Amsterdam_%28DSCF0528%29.jpg",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0/"
  },
  {
    "city": "Barcelona",
    "country": "Spain",
    "aliases": [],
    "src": "/images/plan-covers/barcelona.webp",
    "objectPosition": "50% 0%",
    "subject": "Sagrada Fam\u00edlia",
    "author": "Canaan",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:SF_maig_2_cropped.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  {
    "city": "Rome",
    "country": "Italy",
    "aliases": [],
    "src": "/images/plan-covers/rome.webp",
    "objectPosition": "50% 50%",
    "subject": "Colosseum",
    "author": "FeaturedPics",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Colosseo_2020.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  {
    "city": "Paris",
    "country": "France",
    "aliases": [],
    "src": "/images/plan-covers/paris.webp",
    "objectPosition": "50% 0%",
    "subject": "Eiffel Tower",
    "author": "Benh LIEU SONG",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
  },
  {
    "city": "Krong Siem Reap",
    "country": "Cambodia",
    "aliases": [],
    "src": "/images/plan-covers/krong-siem-reap.webp",
    "objectPosition": "50% 50%",
    "subject": "Angkor Wat",
    "author": "Bj\u00f8rn Christian T\u00f8rrissen",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Angkor_Wat.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  {
    "city": "Luang Prabang",
    "country": "Laos",
    "aliases": [],
    "src": "/images/plan-covers/luang-prabang.webp",
    "objectPosition": "50% 50%",
    "subject": "Luang Prabang",
    "author": "\u677e\u5ca1\u660e\u82b3",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Phou_si_Luang_Prabang_Laos_%E3%83%97%E3%83%BC%E3%82%B7%E3%83%BC%E3%81%AE%E4%B8%98_%E3%83%A9%E3%82%AA%E3%82%B9%E3%83%BB%E3%83%AB%E3%82%A2%E3%83%B3%E3%83%97%E3%83%A9%E3%83%90%E3%83%BC%E3%83%B3_DSCF6777.jpg",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
  },
  {
    "city": "Hanoi",
    "country": "Vietnam",
    "aliases": [],
    "src": "/images/plan-covers/hanoi.webp",
    "objectPosition": "50% 50%",
    "subject": "Ho\u00e0n Ki\u1ebfm Lake",
    "author": "Cyril Doussin from London, United Kingdom",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Thap_Rua.jpg",
    "license": "CC BY-SA 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0/"
  },
  {
    "city": "Ubud",
    "country": "Indonesia",
    "aliases": [],
    "src": "/images/plan-covers/ubud.webp",
    "objectPosition": "50% 50%",
    "subject": "Ubud",
    "author": "Jorge Franganillo",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Ubud_%2849818456887%29.jpg",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0/"
  },
  {
    "city": "",
    "country": "Singapore",
    "aliases": [],
    "src": "/images/plan-covers/singapore.webp",
    "objectPosition": "50% 50%",
    "subject": "Marina Bay Sands",
    "author": "This Photo was taken by Supanut Arunoprayote.",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Marina_Bay_Sands_%28I%29.jpg",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0/"
  },
  {
    "city": "",
    "country": "Hong Kong",
    "aliases": [],
    "src": "/images/plan-covers/hong-kong.webp",
    "objectPosition": "50% 50%",
    "subject": "Victoria Harbour",
    "author": "Haydn Hsin",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Hong_Kong_Skyline_viewed_from_Victoria_Peak.jpg",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
  },
  {
    "city": "Busan",
    "country": "South Korea",
    "aliases": [],
    "src": "/images/plan-covers/busan.webp",
    "objectPosition": "50% 50%",
    "subject": "Haeundae Beach",
    "author": "Brit in Seoul",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Haeundae_Beach_May_2024.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  {
    "city": "Seoul",
    "country": "South Korea",
    "aliases": [],
    "src": "/images/plan-covers/seoul.webp",
    "objectPosition": "50% 50%",
    "subject": "Gyeongbokgung",
    "author": "\uc11c\uc6b8\uad00\uad11 \uc544\uce74\uc774\ube0c",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:%EA%B4%91%ED%99%94%EB%AC%B8_%EC%9B%94%EB%8C%80.jpg",
    "license": "KOGL Type 1",
    "licenseUrl": "https://www.kogl.or.kr/info/licenseType1.do"
  },
  {
    "city": "Hakone",
    "country": "Japan",
    "aliases": [],
    "src": "/images/plan-covers/hakone.webp",
    "objectPosition": "50% 50%",
    "subject": "Lake Ashi",
    "author": "663highland",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:260505_Moto-Hakone_Hakone_Japan01s3.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  {
    "city": "Sapporo",
    "country": "Japan",
    "aliases": [],
    "src": "/images/plan-covers/sapporo.webp",
    "objectPosition": "50% 50%",
    "subject": "Odori Park",
    "author": "Nkns",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Hokkaido_Sapporo_Odori_Park.jpg",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
  },
  {
    "city": "Osaka",
    "country": "Japan",
    "aliases": [],
    "src": "/images/plan-covers/osaka.webp",
    "objectPosition": "50% 50%",
    "subject": "Osaka Castle",
    "author": "663highland",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Osaka_Castle_03bs3200.jpg",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
  },
  {
    "city": "Tokyo",
    "country": "Japan",
    "aliases": [],
    "src": "/images/plan-covers/tokyo.webp",
    "objectPosition": "50% 50%",
    "subject": "Sens\u014d-ji",
    "author": "Akonnchiroll",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Sensoji_2023.jpg",
    "license": "CC0",
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/"
  },
  {
    "city": "Kyoto",
    "country": "Japan",
    "aliases": [],
    "src": "/images/plan-covers/kyoto.webp",
    "objectPosition": "50% 50%",
    "subject": "Fushimi Inari-taisha",
    "author": "Basile Morin",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Torii_path_with_lantern_at_Fushimi_Inari_Taisha_Shrine%2C_Kyoto%2C_Japan.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  {
    "city": "Mueang Chiang Rai",
    "country": "Thailand",
    "aliases": [],
    "src": "/images/plan-covers/mueang-chiang-rai.webp",
    "objectPosition": "50% 50%",
    "subject": "Wat Rong Khun",
    "author": "JJ Harrison (https://www.jjharrison.com.au/)",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Wat_Rong_Khun_-_Chiang_Rai.jpg",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
  },
  {
    "city": "Hua Hin",
    "country": "Thailand",
    "aliases": [],
    "src": "/images/plan-covers/hua-hin.webp",
    "objectPosition": "50% 50%",
    "subject": "Mrigadayavan Palace",
    "author": "Manoonp",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:%E0%B8%9E%E0%B8%A3%E0%B8%B0%E0%B8%A3%E0%B8%B2%E0%B8%8A%E0%B8%A7%E0%B8%B1%E0%B8%87%E0%B8%A1%E0%B8%A4%E0%B8%84%E0%B8%97%E0%B8%B2%E0%B8%A2%E0%B8%A7%E0%B8%B1%E0%B8%99.jpg",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
  },
  {
    "city": "Ao Nang",
    "country": "Thailand",
    "aliases": [],
    "src": "/images/plan-covers/ao-nang.webp",
    "objectPosition": "50% 50%",
    "subject": "Ao Nang",
    "author": "kallerna",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Ao_Nang_beach_panorama_1.jpg",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
  },
  {
    "city": "Nakhon Ratchasima",
    "country": "Thailand",
    "aliases": [],
    "src": "/images/plan-covers/nakhon-ratchasima.webp",
    "objectPosition": "50% 50%",
    "subject": "Khao Yai National Park",
    "author": "Nawit science",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Haew_Suwat_Waterfall_Khao-Yai02.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  {
    "city": "Chiang Mai",
    "country": "Thailand",
    "aliases": [],
    "src": "/images/plan-covers/chiang-mai.webp",
    "objectPosition": "50% 50%",
    "subject": "Wat Chedi Luang",
    "author": "Kingkidton",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:%E0%B9%80%E0%B8%88%E0%B8%94%E0%B8%B5%E0%B8%A2%E0%B9%8C%E0%B8%AB%E0%B8%A5%E0%B8%A7%E0%B8%87.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
  }
] as const;

function normalize(value: string | null | undefined): string {
  return (value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function destinationPlanCover(plan: Pick<ExplorePlan, "destinationCity" | "destinationCountry" | "highlights">) {
  const country = normalize(plan.destinationCountry);
  const city = normalize(plan.destinationCity);
  const highlights = new Set(plan.highlights.map(normalize));
  return PLAN_DESTINATION_COVERS.find(cover => highlights.has(normalize(cover.subject)))
    ?? PLAN_DESTINATION_COVERS.find(cover => normalize(cover.country) === country
      && (normalize(cover.city) === city || cover.aliases.some(alias => normalize(alias) === city)));
}
