// Exercises the real day action controls and privacy preference with synthetic, intercepted data.
import assert from "node:assert/strict";
import { copyFile, mkdir, unlink } from "node:fs/promises";
import { resolve } from "node:path";

const { chromium }=await import(process.env.NAVIO_PLAYWRIGHT_MODULE ?? "playwright");
const origin=process.env.NAVIO_TEST_ORIGIN ?? "http://localhost:3124";
assert.ok(["localhost","127.0.0.1"].includes(new URL(origin).hostname));
const folder=resolve("app/place-recommendations-check");
await mkdir(folder,{recursive:true});
await copyFile(resolve("tests/planner/place-recommendations.fixture.tsx"),resolve(folder,"page.tsx"));
const browser=await chromium.launch({channel:process.env.NAVIO_BROWSER_CHANNEL ?? "msedge",headless:true});
const errors=[],providerCalls=[],writes=[];
let contributes=true,failWrite=false;
try {
  const context=await browser.newContext({viewport:{width:1100,height:950},reducedMotion:"reduce"});
  await context.route("**/api/**",async route=>{
    const req=route.request(),path=new URL(req.url()).pathname;
    if(path.includes("/geo/places")) providerCalls.push(path);
    if(path==="/api/trips/place-popularity/preferences") {
      if(req.method()==="PUT") {
        writes.push(req.postDataJSON());
        if(failWrite) return route.fulfill({status:503,json:{message:"Unavailable"}});
        contributes=req.postDataJSON().contributes;
      }
      return route.fulfill({json:{contributes}});
    }
    if(path==="/api/auth/session") return route.fulfill({json:{user:{id:"22222222-2222-4222-8222-222222222222",name:"Test traveler",roles:[]},expires:"2099-01-01T00:00:00.000Z"}});
    if(path.includes("palette")) return route.fulfill({json:[]});
    return route.fulfill({json:{items:[],content:[],unreadCount:0}});
  });
  const page=await context.newPage();
  page.on("pageerror",error=>errors.push(error.message));
  await page.goto(`${origin}/place-recommendations-check`,{waitUntil:"networkidle",timeout:120000});
  const heading=page.getByRole("button",{name:"Recommended places",exact:true});
  await heading.waitFor({timeout:60000});
  const add=page.locator('#test-day button[aria-label^="Add "][aria-label$=" to this day"]').first();
  const addLabel=await add.getAttribute("aria-label");
  const name=addLabel.slice(4,-12);
  const positions=await page.evaluate(()=>{
    const input=document.querySelector('#test-day input[placeholder^="Add a stop"]');
    const row=document.querySelector('#test-day section[aria-labelledby]');
    const note=[...document.querySelectorAll('#test-day button')].find(b=>b.textContent.includes('Add a note'));
    return [input?.getBoundingClientRect().top,row?.getBoundingClientRect().top,note?.getBoundingClientRect().top];
  });
  assert.ok(positions.every(Number.isFinite)&&positions[0]<positions[1]&&positions[1]<positions[2],"Shelf is between the input and action buttons");
  await add.click();
  assert.equal(await page.getByRole("button",{name:`${name} is already in this day`,exact:true}).isDisabled(),true);
  assert.equal(await page.getByLabel("Saved stop count").textContent(),"1");
  await page.getByRole("button",{name:`Preview ${name}`,exact:true}).click();
  assert.equal(await page.getByLabel("Previewed place").textContent(),name);
  await heading.click();
  assert.equal(await heading.getAttribute("aria-expanded"),"false");
  await heading.focus(); await page.keyboard.press("Enter");
  assert.equal(await heading.getAttribute("aria-expanded"),"true");
  await page.getByRole("button",{name:"Traveler counts",exact:true}).click();
  await page.getByText(/Chosen by \d+ travelers/).first().waitFor();
  await page.getByRole("button",{name:"Next slide",exact:true}).click();
  const toggle=page.getByRole("switch",{name:/^Contribute to place popularity/});
  assert.equal(await toggle.getAttribute("aria-checked"),"true");
  await toggle.click();
  await page.waitForFunction(()=>document.querySelector('[role="switch"]')?.getAttribute('aria-checked')==='false');
  assert.deepEqual(writes[0],{contributes:false});
  failWrite=true; await toggle.click();
  await page.getByText("Privacy setting not saved",{exact:true}).waitFor();
  assert.equal(await toggle.getAttribute("aria-checked"),"false","Failed saves must preserve the saved preference");
  const output=resolve(".next/place-recommendations-screenshots"); await mkdir(output,{recursive:true});
  const previous=page.getByRole("button",{name:"Previous slide",exact:true});
  for(let i=0;i<6&&!await previous.isDisabled();i++) await previous.click();
  await page.screenshot({path:resolve(output,"desktop-light.png"),fullPage:true});
  await page.locator("#test-day").screenshot({path:resolve(output,"row-light.png")});
  await page.getByRole("button",{name:"Toggle theme",exact:true}).click();
  await page.screenshot({path:resolve(output,"desktop-dark.png"),fullPage:true});
  await page.locator("#test-day").screenshot({path:resolve(output,"row-dark.png")});
  await page.setViewportSize({width:375,height:950});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,"No mobile page overflow");
  await page.screenshot({path:resolve(output,"mobile-dark.png"),fullPage:true});
  await page.locator("#test-day").screenshot({path:resolve(output,"row-mobile.png")});
  assert.deepEqual(providerCalls,[],"The shelf must not request Google place details/photos");
  assert.deepEqual(errors,[]);
  console.log("PASS: position, add/dedup, preview, keyboard collapse, popularity labels, carousel, opt-out, failed-save recovery, themes, mobile overflow and zero provider calls");
} finally {
  await browser.close();
  await unlink(resolve(folder,"page.tsx"));
}
