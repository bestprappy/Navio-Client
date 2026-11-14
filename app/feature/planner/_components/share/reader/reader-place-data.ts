import {catalogueItem,isCatalogueId,type CataloguePlaceDetail} from "@/app/feature/explore/places/catalogue";
import { safeExternalUrl, type DiscoveryItem } from '@/app/feature/explore/places/places-api';
import type { PlaceSearchResult } from '../../../planId/_components/constants/types';

/** Adapt the normal cached lookup, never the separately billed discovery/gallery reader. */
export function readerPlaceData(detail: PlaceSearchResult | CataloguePlaceDetail): DiscoveryItem {
  if(isCatalogueId(detail.providerPlaceId)){const item=catalogueItem(detail.providerPlaceId);if(item)return item;}
  const photoUrl = safeExternalUrl(detail.imageUrl);
  return {
    place: {
      providerPlaceId: detail.providerPlaceId,
      name: detail.name,
      address: detail.address,
      location: { lat: detail.lat, lng: detail.lng },
      photoUrl,
      category: detail.category,
      description: detail.description,
      rating: detail.rating,
      reviewCount: detail.reviewCount,
      website: detail.website,
      phone: detail.phone,
      openingHours: { summary: detail.openingHours, weekdayDescriptions: detail.weekdayOpeningHours ? [...detail.weekdayOpeningHours] : undefined },
    },
    photos: photoUrl ? [{ url: photoUrl, attributions: [] }] : [],
    photoAttributions: [],
  };
}
