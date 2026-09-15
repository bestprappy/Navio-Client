import { MapPin } from "lucide-react";
import "flag-icons/css/flag-icons.min.css";

import { cn } from "@/lib/utils";

type CountryFlagProps = {
  code: string | null | undefined;
  className?: string;
};

/** Rounded country flag tile; falls back to a map pin when the country is unknown. */
export function CountryFlag({ code: countryCode, className }: CountryFlagProps) {
  const code = countryCode && /^[a-z]{2}$/i.test(countryCode) ? countryCode.toLowerCase() : null;
  return (
    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-primary", className)}>
      {code ? (
        <span role="img" aria-label={`${countryCode} flag`} className={`fi fi-${code} fis size-5 rounded-sm shadow-2xs`} />
      ) : (
        <MapPin className="size-4" aria-hidden="true" />
      )}
    </span>
  );
}
