/* Official unmodified Google Maps attribution assets; intentionally not optimized. */
/* eslint-disable @next/next/no-img-element */
export function GoogleAttribution({catalogue=false}:{catalogue?:boolean}={}) {
  if(catalogue)return <p className="px-2.5 py-2 text-xs text-muted-foreground">Navio exhibition collection - Bangkok. Independently sourced information; no live Google ratings.</p>;
  return <div className="px-2.5 pt-2.5 pb-1.5"><img src="/attribution/google-maps-dark.svg" alt="Google Maps" className="h-[18px] w-auto dark:hidden" /><img src="/attribution/google-maps-white.svg" alt="Google Maps" className="hidden h-[18px] w-auto dark:block" /></div>;
}
