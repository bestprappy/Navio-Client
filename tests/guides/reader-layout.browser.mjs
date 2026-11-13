// Fixture-only browser checks: no Google requests, account changes or publication writes.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.NAVIO_PLAYWRIGHT_MODULE??'playwright');
const origin=process.env.NAVIO_GUIDE_TEST_ORIGIN??'http://localhost:3114';
assert.ok(['localhost','127.0.0.1'].includes(new URL(origin).hostname));
const id='11111111-1111-4111-8111-111111111111';
const places=Object.fromEntries(['A','B','C'].map((suffix,index)=>[`ChIReader${suffix}`,{id:`GOOGLE:ChIReader${suffix}`,provider:'GOOGLE',providerPlaceId:`ChIReader${suffix}`,name:`Reader place ${suffix}`,address:'Canal street',lat:52.3+index/100,lng:4.8+index/100,tags:['Art'],category:'Museum'}]));
const guide={name:'Reader layout fixture',country:'Netherlands',countryCode:'NL',destination:{provider:'GOOGLE',providerPlaceId:'ChIReaderA',name:'Amsterdam',lat:52.3,lng:4.8},description:'Read slowly by the canals.',coverPlaceId:'ChIReaderA',content:{categories:[{id:'art',name:'Art places',iconId:'landmark',colorId:'violet'}],lists:{art:{id:'art',categoryId:'art'}},places,body:'<div data-embed="placeList" data-list-id="art"></div>\n\n'+Object.keys(places).map(key=>`<div data-embed="guidePlace" data-place-id="${key}"></div>\n\n${'A little context for this place. '.repeat(25)}`).join('\n\n')}};
const browser=await chromium.launch({headless:true,channel:'chrome'}),checks=[],errors=[],paths=[];
const output=process.env.NAVIO_GUIDE_SCREENSHOTS??'.next/reader-repairs';await fs.mkdir(output,{recursive:true});
try{
 for(const width of [1440,1024,390]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  await context.route('**/*',async route=>{
   const u=new URL(route.request().url()),p=u.pathname;
   if(!['localhost','127.0.0.1'].includes(u.hostname))return route.abort();
   if(p==='/reader-fixture.svg')return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect width="800" height="500" fill="#a8cdd7"/><path d="M0 400L400 40L800 400Z" fill="#678e9a"/></svg>'});
   if(p==='/api/auth/session')return route.fulfill({json:{}});
   if(p==='/api/traveler-guides/'+id)return route.fulfill({json:{id,guide,author:{displayName:'Navio'},publishedAt:'2026-11-12T00:00:00Z',updatedAt:'2026-11-12T00:00:00Z'}});
   if(p.endsWith('/view'))return route.fulfill({status:204});
   if(p.endsWith('/feedback/comments'))return route.fulfill({json:{content:[],hasMore:false,total:0,page:0}});
   if(p.endsWith('/feedback'))return route.fulfill({json:{ratingAverage:null,ratingCount:0,commentCount:0,myRating:null,publisher:false,canModerate:false,viewCount:12,uniqueViewCount:4}});
   if(p.startsWith('/api/geo/places/')){
    paths.push(p+u.search);
    if(p.endsWith('/reader'))return route.fulfill({status:404,json:{message:'Discovery is disabled'}});
    const key=decodeURIComponent(p.split('/').at(-1));const place=places[key]??Object.values(places)[0];
    return route.fulfill({json:{provider:u.searchParams.get('provider')??'GOOGLE',providerPlaceId:key,name:place.name,address:place.address,location:{lat:place.lat,lng:place.lng,address:place.address,placeId:key},photoUrl:origin+'/reader-fixture.svg',phone:'+31 1234',website:'https://example.com',rating:4.7,reviewCount:1234,category:'Museum',openingHours:{summary:'Open today',weekdayDescriptions:['Monday: 9:00 AM – 5:00 PM']}}});
   }
   if(p.startsWith('/api/'))return route.fulfill({json:{items:[],content:[],total:0,totalElements:0,totalPages:0,last:true,unreadCount:0}});
   return route.continue();
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(/same key|unique.*key/i.test(m.text()))errors.push(m.text());});
  await page.goto(origin+'/explore/guides/'+id);await page.getByRole('heading',{name:guide.name,exact:true}).waitFor();
  const metrics=()=>page.evaluate(()=>{const panel=document.getElementById('guide-reading-panel'),map=document.getElementById('guide-map-panel');return {rootHeight:document.documentElement.scrollHeight,viewport:innerHeight,scroll:window.scrollY,panelHeight:panel.clientHeight,panelScrollHeight:panel.scrollHeight,map:map.getBoundingClientRect().toJSON(),header:document.querySelector('nav[aria-label="Main navigation"]').getBoundingClientRect().toJSON()};});
  let before=await metrics();assert.ok(before.rootHeight<=before.viewport+1,JSON.stringify(before));assert.ok(before.panelScrollHeight>before.panelHeight);
  await page.getByRole('button',{name:'Show Reader place A on the map',exact:true}).click();
  if(width<1024)await page.getByRole('group',{name:'Guide view',exact:true}).getByRole('button',{name:'Map',exact:true}).click();
  const detail=page.getByRole('complementary',{name:'Place details: Reader place A'});await detail.waitFor();
  await detail.locator('img').first().waitFor();await page.waitForFunction(()=>[...document.querySelectorAll('aside[aria-label^="Place details"] img')].some(i=>i.complete&&i.naturalWidth>0));
  assert.equal(await detail.getByRole('tab',{name:'In this guide',exact:true}).count(),1);assert.equal(await detail.getByRole('button',{name:'View in itinerary'}).count(),0);
  await detail.getByRole('tab',{name:'Overview',exact:true}).focus();await page.keyboard.press('End');await detail.getByRole('tab',{name:'In this guide'}).getAttribute('aria-selected').then(v=>assert.equal(v,'true'));
  await detail.getByRole('tab',{name:'Photos',exact:true}).click();await detail.getByRole('button',{name:'Enlarge photo of Reader place A'}).waitFor();
  await detail.getByRole('button',{name:'View in guide',exact:true}).click();
  if(width>=1024){
   await page.locator('#guide-reading-panel').evaluate(el=>el.scrollTop=el.scrollHeight);let after=await metrics();assert.equal(after.map.y,before.map.y);assert.equal(after.map.height,before.map.height);assert.equal(after.scroll,0);
   const divider=page.getByRole('separator',{name:'Resize guide panel'});await divider.focus();await page.keyboard.press('ArrowLeft');assert.equal(await divider.getAttribute('aria-valuenow'),'63');
  }
  await page.evaluate(()=>window.scrollTo(0,10000));before=await metrics();assert.equal(before.scroll,0);assert.ok(before.rootHeight<=before.viewport+1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:`${output}/guide-${width}.png`});checks.push(`Guide ${width}: fixed viewport, independent scroll, cached photo, Guide tabs and reveal`);
  if(width===1440){
   await page.goto(origin+'/preview/shared-plan');const panel=page.getByRole('complementary',{name:/Place details:/});await panel.waitFor();
   await page.waitForFunction(()=>[...document.querySelectorAll('aside[aria-label^="Place details"] img')].some(i=>i.complete&&i.naturalWidth>0));
   assert.equal(await panel.getByRole('tab',{name:'In this plan',exact:true}).count(),1);
   await page.screenshot({path:`${output}/shared-plan.png`});checks.push('Shared Plan photos work while discovery reader returns 404');
  }
  await context.close();
 }
 assert.equal(paths.some(p=>p.split('?')[0].endsWith('/reader')),false,'Never request disabled discovery or paid photo galleries');
 assert.deepEqual(errors,[]);await fs.writeFile(`${output}/results.json`,JSON.stringify({passed:true,checks,requests:paths,errors},null,2));console.log(JSON.stringify({passed:true,checks,requests:paths.length}));
}finally{await browser.close();}
