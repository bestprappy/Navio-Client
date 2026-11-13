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
    "author": "Frank Schulenburg (1969–)",
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
    "country": "Türkiye",
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
    "subject": "Sagrada Família",
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
    "author": "Bjørn Christian Tørrissen",
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
    "author": "松岡明芳",
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
    "subject": "Hoàn Kiếm Lake",
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
    "author": "서울관광 아카이브",
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
    "subject": "Sensō-ji",
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
    "aliases": [
      "Pak Nam"
    ],
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
  },
  {
    "city": "Wellington",
    "country": "New Zealand",
    "aliases": [],
    "src": "/images/plan-covers/wellington.webp",
    "objectPosition": "50% 50%",
    "subject": "Wellington",
    "author": "russellstreet",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Seddon_Statue_in_Parliament_Grounds.jpg",
    "license": "CC BY-SA 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
  },
  {
    "city": "Cape Town",
    "country": "South Africa",
    "aliases": [],
    "src": "/images/plan-covers/cape-town.webp",
    "objectPosition": "50% 50%",
    "subject": "Cape Town",
    "author": "Der Berzerker from Washington, DC, USA",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Camps_bay_(53460319478)_(cropped).jpg",
    "license": "CC BY-SA 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
  },
  {
    "city": "Marrakesh",
    "country": "Morocco",
    "aliases": [],
    "src": "/images/plan-covers/marrakesh.webp",
    "objectPosition": "50% 50%",
    "subject": "Marrakesh",
    "author": "YoTuT from United States",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Marrakech,_Morocco_(5421595453)_(5).jpg",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
  },
  {
    "city": "Buenos Aires",
    "country": "Argentina",
    "aliases": [],
    "src": "/images/plan-covers/buenos-aires.webp",
    "objectPosition": "50% 50%",
    "subject": "Buenos Aires",
    "author": "Deensel",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Puerto_Madero,_Buenos_Aires_(40689219792)_(cropped).jpg",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
  },
  {
    "city": "Mexico City",
    "country": "Mexico",
    "aliases": [],
    "src": "/images/plan-covers/mexico-city.webp",
    "objectPosition": "50% 50%",
    "subject": "Mexico City",
    "author": "Gobierno CDMX",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Sobrevuelos_CDMX_HJ2A4913_(25514321687)_(cropped).jpg",
    "license": "CC0",
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
  },
  {
    "city": "Québec City",
    "country": "Canada",
    "aliases": [],
    "src": "/images/plan-covers/quebec-city.webp",
    "objectPosition": "50% 50%",
    "subject": "Quebec City",
    "author": "Quintin Soloviev",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Quebec_City_skyline_from_L%C3%A9vis.jpg",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0"
  },
  {
    "city": "Budapest",
    "country": "Hungary",
    "aliases": [],
    "src": "/images/plan-covers/budapest.webp",
    "objectPosition": "50% 50%",
    "subject": "Budapest",
    "author": "Visions of Domino",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:View_from_Gell%C3%A9rt_Hill_to_the_Danube,_Hungary_-_Budapest_(28493220635).jpg",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
  },
  {
    "city": "Salzburg",
    "country": "Austria",
    "aliases": [],
    "src": "/images/plan-covers/salzburg.webp",
    "objectPosition": "50% 50%",
    "subject": "Salzburg",
    "author": "Jorge Franganillo",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Salzburg_(48489551981).jpg",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
  },
  {
    "city": "Prague",
    "country": "Czechia",
    "aliases": [],
    "src": "/images/plan-covers/prague.webp",
    "objectPosition": "50% 50%",
    "subject": "Prague",
    "author": "Moyan Brenn from Italy",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Prague_(6365119737).jpg",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
  },
  {
    "city": "Copenhagen",
    "country": "Denmark",
    "aliases": [],
    "src": "/images/plan-covers/copenhagen.webp",
    "objectPosition": "50% 50%",
    "subject": "Copenhagen",
    "author": "Moahim",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:2018_-_Christiansborg_from_the_Marble_Bridge.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  {
    "city": "Porto",
    "country": "Portugal",
    "aliases": [],
    "src": "/images/plan-covers/porto.webp",
    "objectPosition": "50% 50%",
    "subject": "Porto",
    "author": "Diego Delso",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Puente_Don_Luis_I,_Oporto,_Portugal,_2012-05-09,_DD_13.JPG",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
  },
  {
    "city": "Lisbon",
    "country": "Portugal",
    "aliases": [],
    "src": "/images/plan-covers/lisbon.webp",
    "objectPosition": "50% 50%",
    "subject": "Lisbon",
    "author": "Vitor Oliveira from Torres Vedras, PORTUGAL",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Lisboa_-_Portugal_(52597836992).jpg",
    "license": "CC BY-SA 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
  },
  {
    "city": "Chengdu",
    "country": "China",
    "aliases": [],
    "src": "/images/plan-covers/chengdu.webp",
    "objectPosition": "50% 50%",
    "subject": "Chengdu",
    "author": "FISU",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:%E9%9B%AA%E5%B1%B1%E4%B8%8B%E7%9A%84%E6%88%90%E9%83%BD%E5%B8%82%E5%A4%A9%E9%99%85%E7%BA%BF_Chengdu_skyline_with_snow_capped_mountains.jpg",
    "license": "CC BY 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/3.0"
  },
  {
    "city": "Jeonju-si",
    "country": "South Korea",
    "aliases": [],
    "src": "/images/plan-covers/jeonju-si.webp",
    "objectPosition": "50% 50%",
    "subject": "Jeonju",
    "author": "Bernard Gagnon",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Jeonju_Hanok_Maeul_01.jpg",
    "license": "CC0",
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
  },
  {
    "city": "Tainan City",
    "country": "Taiwan",
    "aliases": [],
    "src": "/images/plan-covers/tainan-city.webp",
    "objectPosition": "50% 50%",
    "subject": "Tainan",
    "author": "Mersh",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Downtown_Tainan(2012)_(cropped).jpg",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
  },
  {
    "city": "Da Nang",
    "country": "Vietnam",
    "aliases": [],
    "src": "/images/plan-covers/da-nang.webp",
    "objectPosition": "50% 50%",
    "subject": "Da Nang",
    "author": "Somerset999",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Dragon_Bridge,_Da_Nang_during_day_-_20230819_(cropped).jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  {
    "city": "George Town",
    "country": "Malaysia",
    "aliases": [],
    "src": "/images/plan-covers/george-town.webp",
    "objectPosition": "50% 50%",
    "subject": "George Town, Penang",
    "author": "HundenvonPenang",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Skyline_of_George_Town,_Penang_at_night_Nov2024-29-17.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  {
    "city": "Rayong",
    "country": "Thailand",
    "aliases": [],
    "src": "/images/plan-covers/rayong.webp",
    "objectPosition": "50% 50%",
    "subject": "Rayong",
    "author": "Андрей Бобровский",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Chakphong,_Klaeng_District,_Rayong,_Thailand_-_panoramio_-_%D0%90%D0%BD%D0%B4%D1%80%D0%B5%D0%B9_%D0%91%D0%BE%D0%B1%D1%80%D0%BE%D0%B2%D1%81%D0%BA%D0%B8%D0%B9.jpg",
    "license": "CC BY 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/3.0"
  },
  {
    "city": "Phuket",
    "country": "Thailand",
    "aliases": [],
    "src": "/images/plan-covers/phuket.webp",
    "objectPosition": "50% 50%",
    "subject": "Phuket (city)",
    "author": "Myinternationalwikipedia",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Phuket_City.jpg",
    "license": "CC0",
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
  },
  {
    "city": "Kanchanaburi",
    "country": "Thailand",
    "aliases": [],
    "src": "/images/plan-covers/kanchanaburi.webp",
    "objectPosition": "50% 50%",
    "subject": "Kanchanaburi",
    "author": "Bjoertvedt",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Kanchanaburi_city_gate.JPG",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
  },
  {
    "city": "Thani",
    "country": "Thailand",
    "aliases": [],
    "src": "/images/plan-covers/thani.webp",
    "objectPosition": "50% 50%",
    "subject": "Sukhothai Historical Park",
    "author": "Khunkay",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Wat_srichum_03.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
  },
  {
    "city": "Phra Nakhon Si Ayutthaya",
    "country": "Thailand",
    "aliases": [],
    "src": "/images/plan-covers/phra-nakhon-si-ayutthaya.webp",
    "objectPosition": "50% 50%",
    "subject": "Wat Mahathat (Ayutthaya)",
    "author": "Chainwit.",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:2025-02-03_Wat_Maha_That_(Ayutthaya)_%E0%B8%A7%E0%B8%B1%E0%B8%94%E0%B8%A1%E0%B8%AB%E0%B8%B2%E0%B8%98%E0%B8%B2%E0%B8%95%E0%B8%B8_%E0%B8%AD%E0%B8%A2%E0%B8%B8%E0%B8%98%E0%B8%A2%E0%B8%B2_-_img_15.jpg",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0"
  },
  {
    "city": "Bangkok",
    "country": "Thailand",
    "aliases": [],
    "src": "/images/plan-covers/bangkok.webp",
    "objectPosition": "50% 50%",
    "subject": "Bangkok",
    "author": "Ninara from Helsinki, Finland",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:4Y1A1159_Bangkok_(33536795515).jpg",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
  },
  {
    "city": "Kanazawa",
    "country": "Japan",
    "aliases": [],
    "src": "/images/plan-covers/kanazawa.webp",
    "objectPosition": "50% 50%",
    "subject": "Kanazawa",
    "author": "金沢市",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:%E6%9C%9B%E6%B9%96%E5%8F%B0%EF%BC%92.jpg",
    "license": "CC BY 2.1 jp",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.1/jp/deed.en"
  },
  {
    "city": "Strasbourg",
    "country": "France",
    "aliases": [],
    "src": "/images/plan-covers/strasbourg.webp",
    "objectPosition": "50% 50%",
    "subject": "Strasbourg",
    "author": "Jonathan Martz",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Strasbourg_Cathedral.jpg",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
  },
  {
    "city": "Vienna",
    "country": "Austria",
    "aliases": [],
    "src": "/images/plan-covers/vienna.webp",
    "objectPosition": "50% 50%",
    "subject": "Vienna",
    "author": "Superbass",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Schoenbrunn_philharmoniker_2012.jpg",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
  },
  {
    "city": "Edinburgh",
    "country": "United Kingdom",
    "aliases": [],
    "src": "/images/plan-covers/edinburgh.webp",
    "objectPosition": "50% 50%",
    "subject": "Edinburgh",
    "author": "Andrew Colin",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Skyline_of_Edinburgh.jpg",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
  },
  {
    "city": "Lucerne",
    "country": "Switzerland",
    "aliases": [],
    "src": "/images/plan-covers/lucerne.webp",
    "objectPosition": "50% 50%",
    "subject": "Lucerne",
    "author": "Валерий Дед",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:L%C3%B6wendenkmal_-_panoramio.jpg",
    "license": "CC BY 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/3.0"
  },
  {
    "city": "Bled",
    "country": "Slovenia",
    "aliases": [],
    "src": "/images/plan-covers/bled.webp",
    "objectPosition": "50% 50%",
    "subject": "Lake Bled",
    "author": "Canadianhockey91",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Lake_Bled_from_the_Mountain.jpg",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
  },
  {
    "city": "Kyoto",
    "country": "Japan",
    "aliases": [],
    "src": "/images/plan-covers/kyoto-spring.webp",
    "objectPosition": "50% 50%",
    "subject": "Philosopher's Walk",
    "author": "The original uploader was Sdalu at English Wikipedia.",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Path_of_philosophy.jpg",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/",
    "variant": "spring"
  },
  {
    "city": "Kyoto",
    "country": "Japan",
    "aliases": [],
    "src": "/images/plan-covers/kyoto-autumn.webp",
    "objectPosition": "50% 50%",
    "subject": "Eikan-dō Zenrin-ji",
    "author": "Tomomarusan",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Eikando_Zenrinji-temple_Tahoto.JPG",
    "license": "CC BY 2.5",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.5",
    "variant": "autumn"
  }
] as const;

function normalize(value: string | null | undefined): string {
  return (value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function destinationPlanCover(plan: Pick<ExplorePlan, "destinationCity" | "destinationCountry" | "highlights"> & Partial<Pick<ExplorePlan, "title">>) {
  const country = normalize(plan.destinationCountry);
  const city = normalize(plan.destinationCity);
  const highlights = new Set(plan.highlights.map(normalize));
  const local = PLAN_DESTINATION_COVERS.filter(cover => normalize(cover.country) === country);
  const destinationMatches = (cover: typeof PLAN_DESTINATION_COVERS[number]) =>
    normalize(cover.city) === city || cover.aliases.some(alias => normalize(alias) === city);
  const title = (plan.title ?? "").toLowerCase();
  return local.find(cover => "variant" in cover && destinationMatches(cover)
      && title.split(/[^a-z]+/).includes(cover.variant))
    ?? local.find(cover => !("variant" in cover) && highlights.has(normalize(cover.subject)))
    ?? local.find(cover => !("variant" in cover) && destinationMatches(cover));
}

export type DestinationCover = (typeof PLAN_DESTINATION_COVERS)[number];

/**
 * The best attributed photo for a trip destination: the city's own photo when
 * there is one, otherwise the first photo from the same country. A destination
 * that is itself a country ("Taiwan") therefore still gets a picture.
 */
export function destinationCountryCover(destination: { city?: string | null; country?: string | null; name?: string | null }): DestinationCover | undefined {
  const country = normalize(destination.country);
  const names = [destination.city, destination.name].map(normalize).filter(Boolean);
  const matchesCountry = (cover: DestinationCover) => country !== "" && normalize(cover.country) === country;
  const matchesName = (cover: DestinationCover) =>
    names.some(name => name === normalize(cover.city) || cover.aliases.some(alias => normalize(alias) === name));
  return PLAN_DESTINATION_COVERS.find(cover => matchesCountry(cover) && matchesName(cover))
    ?? PLAN_DESTINATION_COVERS.find(matchesCountry)
    ?? PLAN_DESTINATION_COVERS.find(cover => names.some(name => name === normalize(cover.country)));
}
