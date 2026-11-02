export const travelThemes = {
  food: ['food', 'dining', 'restaurant', 'restaurants', 'cafe', 'cafes', 'culinary', 'seafood', 'sushi', 'eating'],
  scenic: ['scenic', 'scenery', 'scenary', 'view', 'views', 'viewpoint', 'landscape', 'coast', 'coastal', 'beach', 'mountain', 'garden'],
  culture: ['culture', 'cultural', 'temple', 'temples', 'museum', 'museums', 'heritage', 'historic'],
  ev: ['ev', 'charger', 'charging', 'electric vehicle'],
  walking: ['walk', 'walking', 'hiking', 'hike'],
  road: ['road trip', 'roadtrip', 'drive', 'driving'],
} as const;
// Geographic aliases are facts, not fabricated catalogue entries or availability claims.
export const geographicAliases = [
  {name:'Hua Hin',country:'TH',aliases:['huahin']},
  {name:'California',country:'US',aliases:[]},
];
export const countryAliases: Record<string,string[]> = {US:['usa','us','united states of america'],GB:['uk','britain','great britain'],KR:['south korea'],TR:['turkey']};
export const travelTopics = ['Road trip','EV trip','City break','Food trip','Scenic route','Weekend trip','Walking itinerary','Camping trip','Hiking trip','Family trip','Budget trip','Luxury trip','Beach holiday','Temple tour','Museum trip','Photography trip','Nature getaway','Island trip','Sushi food trip'];

export const generalIntentAliases=new Set(["food","dining","culinary","eat","eating","scenic","scenery","scenary","view","views","landscape","culture","cultural","ev","electric vehicle","road trip","roadtrip","drive","driving","walk","walking"]);
