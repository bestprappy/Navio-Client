import Image from "next/image";
import { Pencil } from "lucide-react";

const PLACEHOLDER_IMAGE =
  "https://www.wayfairertravel.com/hubfs/Imported%20sitepage%20images/shutterstock_2398908619_fbl654.jpg";

type TripHeroProps = {
  destinationName: string;
  coverImageUrl?: string;
};

export function TripHero({ destinationName, coverImageUrl }: TripHeroProps) {
  const imageUrl = coverImageUrl ?? PLACEHOLDER_IMAGE;

  return (
    <div
      className="relative h-[15rem] w-full overflow-hidden"
      role="img"
      aria-label={`Cover photo for trip to ${destinationName}`}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`Cover photo for trip to ${destinationName}`}
          fill
          className="object-cover"
          priority
        />
      ) : (
        <div
          className="h-full w-full"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.62 0.14 200) 0%, oklch(0.7 0.16 165) 50%, oklch(0.65 0.18 145) 100%)",
          }}
        />
      )}
      <button
        type="button"
        className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-card/80 text-foreground backdrop-blur-sm transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        aria-label="Edit cover photo"
      >
        <Pencil className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
