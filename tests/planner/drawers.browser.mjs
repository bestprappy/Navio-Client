import assert from "node:assert/strict";
import { encode } from "next-auth/jwt";
import { savedVehicleFixture } from "../garage/data.ts";
import { drawerTrip, drawerSnapshot, drawerChargers } from "./data.ts";
const { chromium } = await import(process.env.NAVIO_PLAYWRIGHT_MODULE ?? "playwright");
const origin = "http://localhost:3114";
const browser = await chromium.launch({ channel:"chrome", headless:true });
const context = await browser.newContext({ viewport:{width:1600,height:1000} });
const cookie = await encode({secret:"community-ui-test-secret-not-for-production",salt:"authjs.session-token",token:{sub:"22222222-2222-4222-8222-222222222222",name:"Test driver",accessToken:"test-only",accessTokenExpiresAt:Math.floor(Date.now()/1000)+3600}});
await context.addCookies([{name:"authjs.session-token",value:cookie,url:origin,httpOnly:true,sameSite:"Lax"}]);
let vehicles=[savedVehicleFixture];
await context.addInitScript(()=>{if(window===window.top && !localStorage.getItem("navio:planner-drawer-width"))localStorage.setItem("navio:planner-drawer-width","30");});
await context.route(`${origin}/api/**`,route=>{
  const path=new URL(route.request().url()).pathname;
  if(path.startsWith("/api/auth/"))return route.continue();
  const body=path.endsWith("/planner")?drawerSnapshot:path===`/api/trips/${drawerTrip.id}`?drawerTrip:path.endsWith("/vehicles")?vehicles:path.endsWith("/places")?[]:path.endsWith("/ev-chargers")?{items:drawerChargers}:path.endsWith("/directions")?{segments:[]}:{items:[]};
  return route.fulfill({json:body});
});
const page=await context.newPage();const errors=[];page.on("pageerror",e=>errors.push(e.message));
const garage=page.getByRole("region",{name:"Trip vehicles",exact:true});
const usage=page.getByRole("region",{name:"Vehicle usage overview",exact:true});
const panel=page.locator("#planner-scroll-panel");
const ev=page.getByRole("complementary",{name:/Charging Station/});
async function fits(locator,name){assert.ok(await locator.evaluate(el=>el.scrollWidth<=el.clientWidth+1),`${name} overflows`);}
try{
  await page.goto(`${origin}/planner/${drawerTrip.id}`,{timeout:120000});
  await garage.getByRole("article").waitFor({timeout:90000});
  const card=garage.getByRole("article");
  assert.ok(await card.evaluate(el=>Math.abs(el.clientWidth-el.parentElement.clientWidth)<4),"one vehicle must fill the grid");
  for(const width of [1600,1280,1024,820,390]){
    await page.setViewportSize({width,height:1000});
    await usage.scrollIntoViewIfNeeded();
    await fits(panel,`drawer ${width}`);await fits(usage,`usage ${width}`);await fits(card,`vehicle ${width}`);
    await fits(card.getByRole("button",{name:"Selected for route estimates",exact:true}),"selected vehicle button");
    const day=page.locator("#trip-block-day-1");await day.scrollIntoViewIfNeeded();await fits(day,"day card");
    for(const name of ["Add a note","Add checklist","Add EV station"]){await fits(day.getByRole("button",{name,exact:true}),name);}
    for(const theme of ["light","dark"]){await page.evaluate(t=>document.documentElement.classList.toggle("dark",t==="dark"),theme);await page.screenshot({path:`../.navio-memory/UI_REVIEW/sep14/day-${width}-${theme}.png`});}
  }
  await page.setViewportSize({width:1600,height:1000});
  vehicles=Array.from({length:4},(_,i)=>({...savedVehicleFixture,id:`10000000-0000-4000-8000-${String(i+1).padStart(12,"0")}`,isDefault:i===0,nickname:`Vehicle ${i+1}`}));
  await page.reload();await garage.getByRole("article").nth(3).waitFor();
  const divider=page.getByRole("separator",{name:"Resize itinerary drawer"});await divider.focus();await page.keyboard.press("End");await page.waitForFunction(()=>document.querySelector('[aria-label="Resize itinerary drawer"]')?.getAttribute("aria-valuenow")==="68");await page.waitForFunction(()=>document.querySelector("#planner-scroll-panel")?.clientWidth>700);
  const cards=garage.getByRole("article");await cards.first().scrollIntoViewIfNeeded();
  const a=await cards.nth(0).boundingBox(),b=await cards.nth(1).boundingBox(),c=await cards.nth(2).boundingBox();
  assert.equal(a.y,b.y);assert.ok(c.y>a.y);assert.equal(c.x,a.x);
  await page.screenshot({path:"../.navio-memory/UI_REVIEW/sep14/garage-four.png"});
  await divider.focus();await page.keyboard.press("Home");
  await page.locator("#trip-block-day-1").getByRole("button",{name:"Add EV station",exact:true}).click();
  const filter=ev.getByRole("checkbox",{name:"Show only compatible",exact:true});await filter.waitFor();
  assert.equal(await filter.isChecked(),false);
  await ev.getByText("Other connector station",{exact:true}).waitFor();
  await page.getByRole("button",{name:"Select EV station Other connector station",exact:true}).waitFor();
  await filter.check();
  await ev.getByText("Other connector station",{exact:true}).waitFor({state:"hidden"});
  assert.equal(await page.getByRole("button",{name:"Select EV station Other connector station",exact:true}).count(),0);
  await ev.getByText("Compatible test station",{exact:true}).waitFor();
  await page.getByRole("button",{name:"Select EV station Compatible test station",exact:true}).waitFor();
  assert.equal(await ev.getByText("Unknown connector station",{exact:true}).count(),0);
  await filter.uncheck();await ev.getByText("Other connector station",{exact:true}).waitFor();
  const resize=page.getByRole("separator",{name:"Resize EV drawer",exact:true});const before=await ev.boundingBox();
  await resize.focus();await page.keyboard.press("ArrowLeft");assert.ok((await ev.boundingBox()).width>before.width);
  const handle=await resize.boundingBox();await page.mouse.move(handle.x+handle.width/2,handle.y+handle.height/2);await page.mouse.down();await page.mouse.move(handle.x-80,handle.y+handle.height/2,{steps:10});await page.mouse.up();assert.ok((await ev.boundingBox()).width>before.width+30);
  await fits(ev,"EV drawer");await fits(panel,"itinerary beside EV drawer");
  await page.screenshot({path:"../.navio-memory/UI_REVIEW/sep14/ev-expanded.png"});
  await page.setViewportSize({width:390,height:844});await fits(ev,"mobile EV drawer");
  assert.deepEqual(errors,[]);
  console.log("PASS: single/full-width and four/two-column vehicles; usage/day/button containment at five widths; both themes; compatible list + map filtering; keyboard/pointer EV resize; mobile EV containment.");
}catch(error){console.error(errors);console.error(await panel.evaluate(root=>({width:root.clientWidth,scroll:root.scrollWidth,style:root.parentElement.getAttribute("style"),basis:getComputedStyle(root).flexBasis,resize:document.querySelector('[aria-label="Resize itinerary drawer"]')?.outerHTML,overflow:[...root.querySelectorAll("*")].filter(el=>el.scrollWidth>el.clientWidth+2 && el.clientWidth>0).slice(0,25).map(el=>({tag:el.tagName,cls:el.className,w:el.clientWidth,s:el.scrollWidth,text:el.textContent.slice(0,70)}))})));await page.screenshot({path:"../.navio-memory/UI_REVIEW/sep14/failure.png"});throw error;}finally{await browser.close();}


