'use client';
import type {ReactNode} from 'react';
import {SaveButton} from '@/app/feature/saved/save-button';
import {SharePlanButton} from '@/app/feature/planner/_components/share/share-plan-button';
export function SharedPlanCardActions({token,saveAction}:{token:string;saveAction?:ReactNode}){
  return <div role="group" aria-label="Plan actions" className="relative z-10 ml-auto flex shrink-0 items-center gap-2"><SharePlanButton token={token}/>{saveAction??<SaveButton token={token} className="size-9"/>}</div>;
}