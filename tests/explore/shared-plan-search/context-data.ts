import type { ExplorePlan } from '../../../app/feature/explore/_components/shared-plans/explore-plans-api';
import { searchReviewPlans } from './data';
const base=searchReviewPlans[0];
export const contextReviewPlans:ExplorePlan[]=[
 {...base,token:'h'.repeat(43),title:'Coastal escape',destinationCity:'Hua Hin',destinationCountry:'Thailand',dayCount:4,highlights:['Beach','Seafood restaurant']},
 {...base,token:'b'.repeat(43),title:'Quiet temples by the river',destinationCity:'Bangkok',destinationCountry:'Thailand',dayCount:4,highlights:['Temple']},
 {...base,token:'c'.repeat(43),title:'California coastal food discoveries',destinationCity:'Monterey',destinationCountry:'United States',dayCount:3,highlights:['Seafood restaurant']},
];
