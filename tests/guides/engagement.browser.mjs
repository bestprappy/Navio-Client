const {chromium}=await import(process.env.NAVIO_PLAYWRIGHT_MODULE??'playwright');
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const origin=process.env.NAVIO_GUIDE_TEST_ORIGIN??'http://localhost:3114',id='11111111-1111-4111-8111-111111111111';
assert.ok(['localhost','127.0.0.1'].includes(new URL(origin).hostname));
const output=process.env.NAVIO_GUIDE_SCREENSHOTS??'.next/guide-engagement';
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome'});
const checks=[],errors=[],requests=[],keyErrors=[];
async function run(signedIn,viewport={width:1440,height:1000},dark=false){
 const context=await browser.newContext({viewport,colorScheme:dark?'dark':'light',reducedMotion:'reduce'});
 let total=12,myRating=null,comments=[],attempts=0,failFirst=!signedIn;
 await context.addInitScript(()=>{window.testVisible=false;Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>window.testVisible?'visible':'hidden'});});
 await context.route('**/*',async route=>{
  const request=route.request(),u=new URL(request.url()),p=u.pathname;
  if(!['localhost','127.0.0.1'].includes(u.hostname))return route.abort();
  if(p==='/api/auth/session')return route.fulfill({json:signedIn?{user:{id:'22222222-2222-4222-8222-222222222222',name:'Reader'},expires:'2099-01-01T00:00:00Z'}:{}});
  if(p==='/api/saved-content/favorites')return route.fulfill({json:u.searchParams.getAll('identity').map(identity=>({identity,count:3}))});
  if(p==='/api/users/me')return route.fulfill({json:{id:'22222222-2222-4222-8222-222222222222',displayName:'Reader',email:'reader@example.com'}});
  if(p==='/api/notifications/unread-count')return route.fulfill({json:{unreadCount:0}});
  if(p.endsWith('/view')){attempts++;requests.push(request.postDataJSON());if(failFirst){failFirst=false;return route.fulfill({status:503,json:{message:'Try again'}});}total++;return route.fulfill({status:204});}
  if(p.includes('/feedback')){
   if(p.endsWith('/rating')){myRating=request.method()==='DELETE'?null:request.postDataJSON().score;return route.fulfill({json:{}});}
   if(p.endsWith('/comments')){if(request.method()==='POST'){comments.unshift({id:'33333333-3333-4333-8333-333333333333',parentId:null,authorName:'Reader',content:request.postDataJSON().content,deleted:false,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),version:0,canEdit:true,canDelete:true,replyCount:0});return route.fulfill({status:201});}return route.fulfill({json:{content:comments,hasMore:false,total:comments.length,page:0}});}
   return route.fulfill({json:{ratingAverage:myRating??4.5,ratingCount:myRating?3:2,commentCount:comments.length,myRating,publisher:false,canModerate:false,viewCount:total,uniqueViewCount:4}});
  }
  if(p==='/api/traveler-guides/'+id)return route.fulfill({json:{id,guide:{name:'Reader engagement check',country:'Japan',countryCode:'JP',destination:{provider:'GOOGLE',providerPlaceId:'fixture',name:'Tokyo',lat:35,lng:139},description:'A reading fixture',coverPlaceId:'fixture-no-api',content:{categories:[],lists:{},places:{},body:'A quiet introduction.'}},author:{displayName:'Navio'},publishedAt:'2026-11-12T00:00:00Z',updatedAt:'2026-11-12T00:00:00Z'}});
  if(p.startsWith('/api/'))return route.fulfill({json:{items:[],content:[],plans:0,guides:0,places:0,total:0,totalElements:0,totalPages:0,last:true,number:0}});
  return route.continue();
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',message=>{if(/same key|unique.*key/i.test(message.text()))keyErrors.push(message.text());});
 await page.goto(origin+'/explore/guides/'+id);
 await page.getByRole('heading',{name:'Reader engagement check',exact:true}).waitFor();
 const stats=page.getByLabel('Guide readership and rating');await stats.getByText('12',{exact:true}).waitFor();
 assert.equal(attempts,0);checks.push('Hidden page does not count');
 const hero=await page.locator('#guide-title').boundingBox(),row=await stats.boundingBox();assert.ok(row.y>hero.y);checks.push('Readership is under cover');
 await page.evaluate(()=>{window.testVisible=true;document.dispatchEvent(new Event('visibilitychange'));});
 if(!signedIn){await stats.getByText('Readership statistics could not be refreshed.').waitFor();await stats.getByRole('button',{name:'Retry'}).click();}
 await stats.getByText('13',{exact:true}).waitFor();await stats.getByText('4',{exact:true}).waitFor();
 await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await page.waitForTimeout(200);assert.equal(attempts,signedIn?1:2);checks.push('Visible opening counts once; retries do not make a new read ID');
 const feedback=page.locator('#reader-feedback');await feedback.getByRole('heading',{name:'Ratings & conversation'}).waitFor();
 if(signedIn){
  await feedback.getByRole('radio',{name:'5 stars',exact:true}).locator('..').click();await feedback.getByText('Your rating: 5 / 5. Choose another star to update it.',{exact:true}).waitFor();
  const textarea=feedback.getByRole('textbox').first();await textarea.fill('A helpful guide for a slow afternoon.');
  await feedback.getByRole('button',{name:'Post comment',exact:true}).click();await feedback.getByText('A helpful guide for a slow afternoon.',{exact:true}).waitFor();checks.push('Signed-in rating and comment use shared feedback controls');
 }else{assert.ok(await feedback.getByRole('radio',{name:'5 stars',exact:true}).isDisabled());await feedback.getByText('Sign in to rate this guide or join the conversation.').waitFor();checks.push('Guest can read feedback but cannot contribute');}
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:`${output}/guide-engagement-${signedIn?'account':'guest'}-${viewport.width}.png`});
 await page.reload();await page.getByRole('heading',{name:'Reader engagement check',exact:true}).waitFor();
 await page.evaluate(()=>{window.testVisible=true;document.dispatchEvent(new Event('visibilitychange'));});
 await stats.getByText('14',{exact:true}).waitFor();
 await stats.getByText('4',{exact:true}).waitFor();
 checks.push('A new page opening increments total while unique account count stays unchanged');
 await context.close();
}
try{await run(false);await run(true);await run(false,{width:390,height:844},true);assert.equal(requests[0].readId,requests[1].readId);assert.notEqual(requests[1].readId,requests[2].readId);assert.deepEqual(errors,[]);assert.deepEqual(keyErrors,[], 'Signed-in feedback must have distinct sibling keys');await fs.writeFile(`${output}/results.json`,JSON.stringify({passed:true,checks,errors,readRequests:requests.length},null,2));console.log(JSON.stringify({passed:true,checks:checks.length,errors}));}finally{await browser.close();}
