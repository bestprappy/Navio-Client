import {cataloguePlaces} from './catalogue';
export function CataloguePhotoCredit({src}:{src?:string}){const p=cataloguePlaces.find(p=>p.photo.path===src);return p?<a href={p.photo.sourceUrl} target="_blank" rel="noreferrer" className="block bg-background/95 px-3 py-1 text-[10px] text-muted-foreground underline">Photo: {p.photo.author} - {p.photo.license} (resized)</a>:null;}
