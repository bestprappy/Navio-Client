// [DEFERRED][EXCLUDE_FROM_REPORT] PLACES_EDITORIAL - disabled by user on 2026-10-22.
// Future work only. See Navio/docs/deferred/places-editorial.md before restoring.
// BEGIN DEFERRED IMPLEMENTATION
// import type { PlaceArticleDocument } from "./place-article-model";
//
// /** Original, source-checked editorial entries. Never rewrite Maps summaries or reviews.
//  * Exact place identity, source references per passage, and review dates are publication gates.
//  * Publisher names identify independent source families, not different URLs on the same site.
//  * Popularity is deliberately irrelevant. See docs/places-editorial.md before adding an entry.
//  */
// export const placeArticles: Readonly<Record<string, PlaceArticleDocument>> = {
//   "ChIJAQAAMCxu5kcRx--_4QnbGcI": {
//     placeId: "ChIJAQAAMCxu5kcRx--_4QnbGcI",
//     version: 2, locale: "en", status: "published",
//     reviewedOn: "2026-10-22", reviewDueOn: "2027-01-20",
//     title: "A slower walk through the Tuileries",
//     introduction: {
//       text: "Between the Louvre and Place de la Concorde, the Tuileries offers a different way to spend time in central Paris: walking, looking at sculpture, or pausing beside a pool. It is a public garden with a royal past, rather than simply a green route between monuments. Its name remembers the tile-making workshops that occupied the site before Catherine de' Medici commissioned a palace and garden in 1564.",
//       sourceIds: ["paris"],
//     },
//     sections: [
//       { heading: "A garden designed to be read", kind: "context", sourceIds: ["louvre"], text: "The palace did not survive, but the garden continued to change. Andre Le Notre redesigned it in 1664, giving its spaces an order that still shapes a walk today. The Louvre describes three main areas: the planted Grand Carre, the wooded Grand Couvert, and the open setting around the octagonal basin. Thinking of them as different chapters makes the garden easier to notice, rather than treating every path as the same experience." },
//       { heading: "Follow the change from planting to shade", kind: "experience", sourceIds: ["louvre"], text: "Start by looking at the garden beds, then let the wooded paths change the pace. In the Grand Couvert, groves of deciduous trees sit around the main avenue; farther along, the octagonal pool and ramps open the view again. This is a walk to adapt to your own interest. You might follow the central perspective, or spend more time comparing the enclosed groves with the broader spaces beside the water." },
//       { heading: "Make room for sculpture and a pause", kind: "experience", sourceIds: ["paris"], text: "The garden is also a place to encounter art outside a museum gallery. Paris's tourism office highlights sculpture by Maillol, Rodin and Giacometti, so a stroll can become a loose sculpture trail rather than a search for one famous object. The pools offer another reason to stop. If you want to extend the cultural part of the visit, the Musee de l'Orangerie is at the garden's south-western end, with works by Monet; check its own visiting arrangements separately." },
//       { heading: "Keep the visit unhurried", kind: "visiting", sourceIds: ["louvre", "paris"], text: "Choose one thread to follow: the landscape design, the sculpture, or simply time beside the water. The garden rewards these different kinds of attention without requiring a rigid itinerary. Use the official links below to check current access and any activities you want to include." },
//     ],
//     sources: [
//       { id: "louvre", label: "The Louvre - history and garden layout", url: "https://www.louvre.fr/en/explore/the-palace/from-royal-garden-to-public-park", publisher: "Musee du Louvre", authority: true, checkedOn: "2026-10-22" },
//       { id: "paris", label: "Paris je t'aime - garden and visitor experiences", url: "https://parisjetaime.com/eng/culture/jardin-des-tuileries-p3545", publisher: "Paris tourism office", authority: true, checkedOn: "2026-10-22" },
//     ],
//   },
//   ChIJPzZsMU6Z4jARQUzvk913bCo: {
//     placeId: "ChIJPzZsMU6Z4jARQUzvk913bCo",
//     version: 2, locale: "en", status: "published",
//     reviewedOn: "2026-10-22", reviewDueOn: "2027-01-20",
//     title: "The palace at the beginning of Bangkok's story",
//     introduction: {
//       text: "The Grand Palace is a collection of places with different purposes: royal residences, ceremonial halls, former administrative spaces and the Temple of the Emerald Buddha. Established in 1782 as Bangkok became the capital, it makes more sense as a compound than as a single palace building. A visit can follow that distinction, moving between the story of the royal court and the sacred setting of its chapel.",
//       sourceIds: ["history", "tat"],
//     },
//     sections: [
//       { heading: "A royal centre with several roles", kind: "context", sourceIds: ["history", "tat"], text: "The palace was built to bring residence, administration and worship together. Thailand's tourism authority describes the temple and royal residence as its two main zones, with the residence divided into outer, middle and inner courts. These names help explain why the site is more than a sequence of decorative facades. Different spaces served government, ceremonies and private court life. The palace continues to have ceremonial uses, so its historic importance is not confined to the past." },
//       { heading: "Look for the contrast in scale", kind: "experience", sourceIds: ["emerald"], text: "The Emerald Buddha offers a striking contrast to its elaborate surroundings. The palace's own description gives the image a height of 66 centimetres, including its base, and describes it seated in meditation high on a gilded wooden altar. Its name refers to its green colour. Three sets of ceremonial clothing correspond to the summer, rainy and winter seasons. Knowing these details gives you something specific to look for when the chapel is accessible, without expecting the image itself to be monumental." },
//       { heading: "Read the buildings as different spaces", kind: "experience", sourceIds: ["tat"], text: "Another useful thread is the architecture of the royal courts. The Middle Court contains several groups of important buildings, including the Chakri Maha Prasat buildings, and is associated with major royal ceremonies. Rather than trying to identify every structure, use the official site map and descriptions to distinguish the temple setting from the royal halls. Treat the historical layout as a guide to understanding what you see, not a promise that every court or interior is open." },
//       { heading: "Plan around a working ceremonial site", kind: "visiting", sourceIds: ["tat", "history"], text: "Choose a few features you want to understand before arriving: the chapel, the different roles of the courts, or the relationship between the halls. Check official visitor information for the areas available on your date. Current access, tickets and conduct requirements belong in that practical check, rather than in a fixed historical account like this one." },
//     ],
//     sources: [
//       { id: "history", label: "The Grand Palace - official history", url: "https://www.royalgrandpalace.th/en/discover/history", publisher: "Bureau of the Royal Household", authority: true, checkedOn: "2026-10-22" },
//       { id: "emerald", label: "The Grand Palace - the Emerald Buddha", url: "https://www.royalgrandpalace.th/en/discover/architecture/1/the-emerald-buddha", publisher: "Bureau of the Royal Household", authority: true, checkedOn: "2026-10-22" },
//       { id: "tat", label: "Tourism Authority of Thailand - palace courts and purpose", url: "https://www.tourismthailand.org/Attraction/the-grand-palace", publisher: "Tourism Authority of Thailand", authority: true, checkedOn: "2026-10-22" },
//     ],
//   },
//   ChIJgcxFcQWZ4jARLsIR9Qia9H0: {
//     placeId: "ChIJgcxFcQWZ4jARLsIR9Qia9H0",
//     version: 2, locale: "en", status: "published",
//     reviewedOn: "2026-10-22", reviewDueOn: "2027-01-20",
//     title: "Beyond Wat Pho's reclining Buddha",
//     introduction: {
//       text: "Wat Pho's reclining Buddha is an introduction to the temple on an extraordinary scale: a gilded brick-and-stucco image measuring 46 metres long and 15 metres high. But the figure is only one way into the place. The temple also offers architectural details to look for and a history of preserving knowledge. Giving those different stories some attention turns a visit from one celebrated image into a more varied encounter.",
//       sourceIds: ["buddha", "chedis", "unesco"],
//     },
//     sections: [
//       { heading: "A temple that made knowledge visible", kind: "context", sourceIds: ["unesco"], text: "Wat Pho's epigraphic archives were added to UNESCO's Memory of the World register in 2011. The inscriptions, created between 1831 and 1841, address both religious and secular subjects. UNESCO describes them as an effort by King Rama III and Thai scholars to preserve knowledge and make it visible to the public for education. That purpose gives the grounds another meaning: the temple was also a place where ideas were recorded for others to encounter." },
//       { heading: "Look closely at the reclining image", kind: "experience", sourceIds: ["buddha"], text: "The reclining Buddha belongs to the early Bangkok period and is housed in a hall in the north-western part of the temple's monastic area. Its size is the first thing to take in, but the temple also draws attention to the mother-of-pearl work on the soles of the feet. Looking from the overall form to that finer detail gives the visit a natural change of scale. It is an object of worship as well as an artwork, so leave space for the religious life around it." },
//       { heading: "Compare the four great chedis", kind: "experience", sourceIds: ["chedis"], text: "Elsewhere, the group called Phra Maha Chedi Si Rajakarn offers a different kind of close looking. The temple describes four large pagodas with colourful mosaic decoration, enclosed by a white wall and gateways. Their green, white, yellow and dark-blue tile schemes distinguish them and connect them with the first four Chakri kings. Following those changes in colour and form can be a simple way to explore without needing to identify every architectural term." },
//       { heading: "Give the smaller details a place", kind: "visiting", sourceIds: ["buddha", "chedis", "unesco"], text: "Build the visit around a few things you genuinely want to notice: the reclining figure, its inlaid feet, the chedis or the story of the inscriptions. This leaves room for looking rather than only collecting photographs. Check the temple's own visitor information for current access; this article offers background and ideas, not a guarantee that every area or activity is available." },
//     ],
//     sources: [
//       { id: "buddha", label: "Wat Pho - the reclining Buddha", url: "https://www.watpho.com/en/buddha/detail/204", publisher: "Wat Pho", authority: true, checkedOn: "2026-10-22" },
//       { id: "chedis", label: "Wat Pho - the four great chedis", url: "https://www.watpho.com/en/architecture/detail/262", publisher: "Wat Pho", authority: true, checkedOn: "2026-10-22" },
//       { id: "unesco", label: "UNESCO - Epigraphic Archives of Wat Pho", url: "https://www.unesco.org/en/memory-world/epigraphic-archives-wat-pho", publisher: "UNESCO", authority: true, checkedOn: "2026-10-22" },
//     ],
//   },
// };
// END DEFERRED IMPLEMENTATION
