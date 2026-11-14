export const productViews = [
  { id: "plans", label: "Shared plans", image: "/images/home/explore.webp", alt: "Navio Explore showing published trip plans and destination filters", title: "A place to start, wherever you’re going.", description: "Browse shared itineraries, open a trip that catches your eye, and copy it into your own plans to make changes.", href: "/explore", action: "Explore shared plans" },
  { id: "guides", label: "Destination guides", image: "/images/home/guides.webp", alt: "Navio Explore showing destination guides", title: "Get to know a place before you go.", description: "Read destination guides and find places to bring into your trip. Keep the ideas you want to come back to.", href: "/explore?tab=guides", action: "Explore guides" },
] as const;

export const journey = [
  { title: "Keep the places that catch your eye.", description: "Collect places and notes in My List. Bring them into your itinerary when you know where they fit.", icon: "places" },
  { title: "Give each day its own plan.", description: "Arrange your stops, check routes between places, and keep your trip budget beside the itinerary.", icon: "plan" },
  { title: "Taking an EV? Bring it along.", description: "Add a vehicle to your trip Garage and explore charging stations while you plan your route.", icon: "ev" },
] as const;

export const photoCredits = [
  {
    "subject": "Rijksmuseum",
    "author": "Trougnouf (Benoit Brummer)",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:South_facade_of_the_Rijksmuseum_Amsterdam_%28DSCF0528%29.jpg",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0/"
  },
  {
    "subject": "Sagrada Família",
    "author": "Canaan",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:SF_maig_2_cropped.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  {
    "subject": "Wat Rong Khun",
    "author": "JJ Harrison (https://www.jjharrison.com.au/)",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Wat_Rong_Khun_-_Chiang_Rai.jpg",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
  },
  {
    "subject": "Wat Chedi Luang",
    "author": "Kingkidton",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:%E0%B9%80%E0%B8%88%E0%B8%94%E0%B8%B5%E0%B8%A2%E0%B9%8C%E0%B8%AB%E0%B8%A5%E0%B8%A7%E0%B8%87.jpg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  {
    "subject": "Lucerne",
    "author": "Валерий Дед",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:L%C3%B6wendenkmal_-_panoramio.jpg",
    "license": "CC BY 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/3.0"
  },
  {
    "subject": "Lake Bled",
    "author": "Canadianhockey91",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Lake_Bled_from_the_Mountain.jpg",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
  },
  {
    "subject": "Philosopher's Walk",
    "author": "The original uploader was Sdalu at English Wikipedia.",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Path_of_philosophy.jpg",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
  }
] as const;
