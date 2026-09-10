import Image from "next/image";

const landscapes = {
  coast: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1400&q=85",
  mountain: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1400&q=85",
  forest: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=85",
};

export function TripScenery({ destinations }: { destinations: readonly string[] }) {
  const place = destinations.join(" ");
  const landscape = /chiang|pai|mountain|swiss|nepal|japan/i.test(place) ? "mountain"
    : /beach|phuket|krabi|hua hin|huahin|samui|thailand|bali|island|coast/i.test(place) ? "coast" : "forest";
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden bg-secondary">
    <Image src={landscapes[landscape]} alt="" fill sizes="(max-width: 800px) 100vw, 65vw" className="object-cover opacity-40 dark:opacity-25" />
    <div className="absolute inset-0 bg-card/35 dark:bg-background/20" />
  </div>;
}
