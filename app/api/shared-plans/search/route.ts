import { NextRequest, NextResponse } from "next/server";
import { planSearchPageSchema } from "@/app/feature/explore/_components/shared-plans/search/search-api";
/** Anonymous read-only search; never forwards credentials, tokens or arbitrary upstream paths. */
export async function GET(request: NextRequest): Promise<Response> {
 const input=request.nextUrl.searchParams;
 const term=input.get("term")||"", country=input.get("country")||"", days=input.get("days"), sort=input.get("sort")||"relevance";
 const page=input.get("page")||"0", size=input.get("size")||"12";
 if(term.length>100 || country && !/^[A-Z]{2}$/.test(country) || !/^\d+$/.test(page) || Number(page)>500 || !/^\d+$/.test(size) || Number(size)<1 || Number(size)>48 || days!==null && (!/^\d+$/.test(days)||Number(days)<1||Number(days)>36500) || !["relevance","recent","trending"].includes(sort))
  return NextResponse.json({message:"Invalid search parameters"},{status:400,headers:{"Cache-Control":"no-store"}});
 if(!process.env.NAVIO_API_BASE_URL) return NextResponse.json({message:"Search unavailable"},{status:503,headers:{"Cache-Control":"no-store"}});
 try {
  const url=new URL("/v1/shared-plans/search",process.env.NAVIO_API_BASE_URL);
  for(const [key,value] of Object.entries({term,country,page,size,sort})) url.searchParams.set(key,value);
  if(days!==null) url.searchParams.set("days",days);
  const response=await fetch(url,{headers:{Accept:"application/json"},cache:"no-store",signal:AbortSignal.any([request.signal,AbortSignal.timeout(8000)])});
  if(!response.ok) return NextResponse.json({message:"Search unavailable"},{status:response.status===404?503:response.status>=500?502:response.status,headers:{"Cache-Control":"no-store"}});
  const parsed=planSearchPageSchema.safeParse(await response.json());
  if(!parsed.success) return NextResponse.json({message:"Invalid search response"},{status:502,headers:{"Cache-Control":"no-store"}});
  return NextResponse.json(parsed.data,{headers:{"Cache-Control":"no-store"}});
 }catch { return NextResponse.json({message:"Search unavailable"},{status:502,headers:{"Cache-Control":"no-store"}}); }
}
