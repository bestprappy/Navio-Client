// Opt-in audit of downloaded PUBLIC plan snapshots; never calls a provider.
import {register} from 'node:module';
import fs from 'node:fs/promises';
register(new URL('../support/typescript-loader.mjs',import.meta.url));
const {destinationPlanCover}=await import('../../app/feature/explore/_components/shared-plans/plan-cover.data.ts');
if(!process.env.NAVIO_PUBLIC_PLAN_SNAPSHOTS)throw new Error('Set NAVIO_PUBLIC_PLAN_SNAPSHOTS to the public-only snapshot JSON.');
const snapshots=JSON.parse(await fs.readFile(process.env.NAVIO_PUBLIC_PLAN_SNAPSHOTS,'utf8'));
const missing=Object.values(snapshots.plans).filter(plan=>!destinationPlanCover({...plan,highlights:plan.highlights??[]})).map(plan=>({title:plan.title,city:plan.destinationCity,country:plan.destinationCountry}));
console.log(JSON.stringify({plans:Object.keys(snapshots.plans).length,missing},null,2));
if(missing.length)process.exitCode=1;
