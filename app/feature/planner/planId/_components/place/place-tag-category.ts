// Google primary types: https://developers.google.com/maps/documentation/places/web-service/place-types
// Specific types precede broad families (e.g. water parks before parks).
const PLACE_TAG_RULES = [
  ["charging", /\b(?:ev charging|electric vehicle charging|ebike charging|charging station)\b/],
  ["airport", /\b(?:airport|airstrip|heliport)\b/],
  ["bus", /\b(?:bus station|bus stop|bus depot|coach station)\b/],
  ["ferry", /\b(?:ferry|marina|boat terminal|port terminal)\b/],
  ["rail", /\b(?:subway|train|rail|railway|light rail|transit station|tram|monorail|mrt|bts|metro)\b/],
  ["parking", /\bparking\b/],
  ["bakery", /\b(?:bakery|bagel|cake|candy|chocolate|confectionery|dessert|donut|doughnut|ice cream|pastry)\b/],
  ["cafe", /\b(?:cafe|coffee|tea house|tea shop|teahouse)\b/],
  ["bar", /\b(?:bar|pub|brewpub|gastropub|brewery|beer garden|night club|nightclub|wine bar)\b/],
  ["groceries", /\b(?:grocery|groceries|supermarket|convenience store|market|food store)\b/],
  ["restaurant", /\b(?:restaurant|food|dining|dinner|diner|bistro|deli|meal|steak house|steakhouse|ramen|sushi)\b/],
  ["lodging", /\b(?:lodging|hotel|hostel|motel|resort|guest house|guesthouse|bed and breakfast|campground|camping|cottage|inn|rv park)\b/],
  ["wellness", /\b(?:spa|wellness|massage|sauna|beauty|salon|yoga|hair care|hair salon|barber)\b/],
  ["shopping", /\b(?:shopping|mall|store|shop|outlet)\b/],
  ["culture", /\b(?:museum|art gallery|art studio|cultural center|cultural centre|opera house|performing arts|planetarium)\b/],
  ["worship", /\b(?:temple|shrine|church|mosque|synagogue|hindu|worship)\b/],
  ["landmark", /\b(?:landmark|historical|monument|memorial|castle|palace|ruins|fountain|sculpture|observation deck|viewpoint|tourist attraction|visitor center|visitor centre|plaza)\b/],
  ["wildlife", /\b(?:zoo|aquarium|wildlife)\b/],
  ["entertainment", /\b(?:amusement|water park|entertainment|arcade|casino|cinema|movie theater|movie theatre|karaoke|live music|concert|comedy)\b/],
  ["sports", /\b(?:sports|sport|stadium|arena|gym|fitness|golf|bowling|athletic|swimming pool|skateboard|cycling|ski|ice skating|tennis)\b/],
  ["beach", /\b(?:beach|seaside|coast|coastal)\b/],
  ["nature", /\b(?:park|garden|hiking|forest|waterfall|mountain|lake|river|nature|natural feature|vineyard)\b/],
  ["healthcare", /\b(?:hospital|pharmacy|doctor|dentist|dental|medical|clinic|physiotherapist|health)\b/],
  ["education", /\b(?:school|university|college|library|education|educational|preschool|research institute|academic department)\b/],
  ["services", /\b(?:bank|atm|post office|police|fire station|gas station|rest stop|car rental|car repair|car wash|embassy|government|city hall|courthouse|public toilet|laundry)\b/],
] as const;

export type PlaceTagCategory = (typeof PLACE_TAG_RULES)[number][0] | "general";

function normalizeType(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getPlaceTagCategory(
  placeType: string | undefined,
  label: string,
): PlaceTagCategory {
  // Prefer the provider type, independent of the display label's language.
  // Legacy/shared places may only have a category label, so try that next.
  for (const value of [placeType, label]) {
    if (!value) continue;
    const normalized = normalizeType(value);
    const rule = PLACE_TAG_RULES.find(([, pattern]) => pattern.test(normalized));
    if (rule) return rule[0];
  }
  return "general";
}
