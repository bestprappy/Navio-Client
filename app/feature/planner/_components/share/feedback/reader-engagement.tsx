'use client';
import { PlanEngagement } from '@/app/feature/explore/_components/shared-plans/plan-engagement';
import type {SharedPlanEngagement} from '../publication-api';
import {usePlanFeedback} from './use-plan-feedback';
export function ReaderEngagement({token,listed,fallback}:{token?:string;listed:boolean;fallback?:SharedPlanEngagement}){
  const {summary}=usePlanFeedback(token,listed);
  return <PlanEngagement {...fallback} ratingAverage={summary.data?.ratingAverage??fallback?.ratingAverage} ratingCount={summary.data?.ratingCount??fallback?.ratingCount} detail/>;
}
