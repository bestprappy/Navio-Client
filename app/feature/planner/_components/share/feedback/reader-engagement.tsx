"use client";
import {usePublicationRead} from '@/hooks/use-publication-read';
import {ReaderStatistics} from '@/components/reader-statistics';
import {useFavoriteCount} from '@/app/feature/saved/favorite-count';
import {Button} from '@/components/ui/button';
import type {SharedPlanEngagement} from '../publication-api';
import {usePlanFeedback} from './use-plan-feedback';
export function ReaderEngagement({token,listed,fallback}:{token?:string;listed:boolean;fallback?:SharedPlanEngagement}){
 const {summary,sessionLoading,refresh,identity}=usePlanFeedback(token,listed);
 const favorites=useFavoriteCount(listed&&token?`plan:${token}`:undefined);
 const {failed,retry}=usePublicationRead({url:token&&listed?`/api/shared-plans/${encodeURIComponent(token)}/feedback/view`:undefined,identity,loading:sessionLoading,onRecorded:refresh});
 if(!listed)return null;
 return <div className="space-y-2"><ReaderStatistics viewCount={summary.data?.viewCount??fallback?.viewCount} uniqueViewCount={summary.data?.uniqueViewCount} favoriteCount={favorites.data} ratingAverage={summary.data?summary.data.ratingAverage:fallback?.ratingAverage} ratingCount={summary.data?.ratingCount??fallback?.ratingCount}/>{(failed||summary.isError)&&<div className="flex items-center gap-2 text-xs text-muted-foreground" role="status">Statistics could not be refreshed.<Button variant="ghost" size="sm" onClick={()=>{retry();void summary.refetch();}}>Retry</Button></div>}</div>;
}
