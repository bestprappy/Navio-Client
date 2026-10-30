import {Suspense} from 'react';
import type {Metadata} from 'next';
import {SavedPage} from '@/app/feature/saved/saved-page';
export const metadata:Metadata={title:'Saved - Navio',robots:{index:false,follow:false}};
export default function Page(){return <Suspense fallback={<p className="p-8" role="status">Loading Saved…</p>}><SavedPage/></Suspense>;}
