// Isolated signed-in planner regression checks. All account/API data is synthetic.
import assert from "node:assert/strict";
import { encode } from "next-auth/jwt";
import { mkdir } from "node:fs/promises";
import { savedVehicleFixture } from "../garage/data.ts";
const { chromium } = await import(process.env.NAVIO_PLAYWRIGHT_MODULE ?? "playwright");
const origin = process.env.NAVIO_TEST_ORIGIN ?? "http://localhost:3107";
const tripId = "a1000000-0000-4000-8000-000000000001";
const stamp = new Date().toISOString();
let trip = { id:tripId, displayName:"Northern Thailand", startDate:"2026-09-01", endDate:"2026-09-20", destinationId:"chiang-mai", destinationName:"Chiang Mai", destinationCountry:"Thailand", destinationLat:18.78, destinationLng:98.98, visibility:"PRIVATE", createdAt:stamp, updatedAt:stamp };
const place = (id,name) => ({id,type:"place",placeId:id,name,address:"Chiang Mai, Thailand",lat:18.78,lng:98.98});
const charger = {...place("charger-1","Test charging station"),placeId:"ev-charger:test",evCharger:{connectorTypes:["CCS2"],maxKw:50,totalConnectors:2,availableConnectors:2,priceText:null,openingHoursSummary:"Open 24 hours",estimatedChargeMinutes:10,operatorName:null,targetBatteryPct:100}};
let snapshot = {blocks:Array.from({length:19},(_,i)=>({id:`day-${i+1}`,kind:"itinerary",title:`Day ${i+1}`,date:`2026-09-${String(i+1).padStart(2,"0")}`,colorId:"teal",items:i===0?[place("stop-1","Old town temple"),charger,place("stop-2","Riverside market")]:[]})),budget:{currency:"THB",amount:0,expenses:[]},version:1,savedAt:stamp,capabilities:["day-destinations","charge-targets","day-anchors"]};
const browser = await chromium.launch({channel:"chrome",headless:true});
const context = await browser.newContext({viewport:{width:1440,height:900}});
const cookie = await encode({secret:"community-ui-test-secret-not-for-production",salt:"authjs.session-token",token:{sub:"22222222-2222-4222-8222-222222222222",name:"Test traveler",accessToken:"test-only",accessTokenExpiresAt:Math.floor(Date.now()/1000)+3600}});
await context.addCookies([{name:"authjs.session-token",value:cookie,url:origin,httpOnly:true,sameSite:"Lax"}]);
const writes=[],errors=[],unexpected=[];
let favorites=[];
await context.route(`${origin}/api/**`,async route=>{
  const request=route.request(),url=new URL(request.url()),path=url.pathname;
  if(path.startsWith("/api/auth/")) return route.continue();
  let body;
  if(path===`/api/trips/${tripId}/planner`){
    if(request.method()==="PUT") { const payload=request.postDataJSON(); writes.push(structuredClone(payload)); snapshot={...snapshot,...payload,version:snapshot.version+1}; }
    body=snapshot;
  } else if(path===`/api/trips/${tripId}`){
    if(request.method()==="PUT") {trip={...trip,...request.postDataJSON()};snapshot.version++;} body=trip;
  } else if(path==="/api/trips") body={content:[trip],totalElements:1};
  else if(path==="/api/users/me/vehicles") body=[savedVehicleFixture];
  else if(path==="/api/users/me/places"){
    if(request.method()==="POST"){const saved={address:null,providerPlaceId:null,isDefault:false,...request.postDataJSON(),id:"33333333-3333-4333-8333-333333333333",createdAt:stamp,updatedAt:stamp};favorites.push(saved);body=saved;}else body=favorites;
  } else if(path.endsWith("/destinations")) body={items:[{provider:"GOOGLE",providerPlaceId:"bangkok",mainText:"Bangkok",secondaryText:"Thailand",types:["locality"],place:{lat:13.75,lng:100.5}}]};
  else if(path==="/api/routes/directions") body={segments:[]};
  else if(path.startsWith("/api/geo/places/")) body={items:[]};
  else {unexpected.push(path);return route.fulfill({status:404,json:{message:"Unexpected test request"}});}
  return route.fulfill({json:body});
});
const page=await context.newPage();page.on("pageerror",error=>errors.push(error.message));
async function eventually(check,message){for(let n=0;n<100;n++){if(check())return;await new Promise(resolve=>setTimeout(resolve,100));}assert.fail(message);}
try {
  await page.goto(`${origin}/planner/${tripId}?destinationName=Chiang%20Mai&from=2026-09-01&to=2026-09-20`,{timeout:120000});
  await page.getByRole("heading",{name:"Northern Thailand",exact:true}).waitFor({timeout:90000});
  await eventually(()=>snapshot.blocks.length===20,"missing itinerary dates were not saved");
  assert.equal(snapshot.blocks[0].items.length,3);
  const gauge=page.getByRole("slider",{name:"Target battery at Test charging station",exact:true});
  await gauge.fill("80");
  await eventually(()=>snapshot.blocks[0].items[1].evCharger.targetBatteryPct===80,"charge target did not autosave");
  await page.evaluate(()=>{window.dragStarts=0;document.addEventListener("dragstart",()=>window.dragStarts++);});
  await gauge.scrollIntoViewIfNeeded();const box=await gauge.boundingBox();
  await page.mouse.move(box.x+box.width*.8,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width*.9,box.y+box.height/2,{steps:10});await page.mouse.up();
  assert.equal(await page.evaluate(()=>window.dragStarts),0);
  await gauge.fill("80");
  const day10=page.locator("#trip-block-day-10");
  await day10.getByRole("button",{name:/Destination.*Chiang Mai.*Change/i}).click();
  await day10.getByRole("combobox").first().fill("Bangkok");
  await day10.getByRole("option",{name:/Bangkok/}).click();
  await eventually(()=>snapshot.blocks[9].destination?.name==="Bangkok","day destination did not autosave");
  assert.match(await page.locator("#trip-block-day-11").innerText(),/Bangkok/);
  assert.equal(snapshot.blocks[0].items.length,3);
  await page.getByRole("button",{name:/Set where this trip starts/}).first().click();
  await page.getByRole("button",{name:"Pin on map",exact:true}).click();
  const coordinates=page.getByRole("button",{name:"Enter coordinates",exact:true});
  if(await coordinates.isEnabled() && await coordinates.getAttribute("aria-expanded")==="false") await coordinates.click();
  await page.getByLabel("Latitude",{exact:true}).fill("18.78");await page.getByLabel("Longitude",{exact:true}).fill("98.98");
  await page.getByLabel("Place name",{exact:true}).fill("Test home");
  await page.getByRole("button",{name:"Save and use",exact:true}).click();
  await eventually(()=>snapshot.blocks[0].startAnchor?.name==="Test home","favorite anchor did not autosave");
  assert.equal(favorites.length,1);
  await page.getByRole("button",{name:"Edit trip name",exact:true}).click();
  await page.getByLabel("Trip name",{exact:true}).fill("A relaxed northern trip");await page.getByRole("button",{name:"Save name",exact:true}).click();
  await eventually(()=>trip.displayName==="A relaxed northern trip","trip rename failed");
  await page.reload();await page.getByRole("heading",{name:trip.displayName,exact:true}).waitFor();
  await gauge.waitFor();assert.equal(await gauge.inputValue(),"80");
  await page.getByRole("button",{name:"Show start: Test home on map",exact:true}).first().waitFor();
  await page.getByRole("button",{name:"Collapse all days",exact:true}).click();
  assert.equal(await page.locator('[id^="day-content-"]:visible').count(),0);
  await page.getByRole("button",{name:"Expand all days",exact:true}).click();
  const divider=page.getByRole("separator",{name:"Resize itinerary drawer"});const before=await divider.getAttribute("aria-valuenow");await divider.focus();await page.keyboard.press("ArrowRight");assert.notEqual(await divider.getAttribute("aria-valuenow"),before);
  await mkdir("../.navio-memory/UI_REVIEW/sep13",{recursive:true});
  for(const [width,height] of [[1440,900],[820,1180],[390,844]]){
    await page.setViewportSize({width,height});
    for(const theme of ["light","dark"]){
      await page.evaluate(theme=>{document.documentElement.classList.toggle("dark",theme==="dark");document.documentElement.style.colorScheme=theme;},theme);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`horizontal overflow ${width}/${theme}`);
      await page.screenshot({path:`../.navio-memory/UI_REVIEW/sep13/planner-${width}-${theme}.png`});
    }
  }
  assert.ok(writes.length>0);assert.ok(writes.every(write=>write.blocks.length>=20 && write.blocks[0].items.length===3),"autosave lost saved stops or days");
  assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);
  console.log("PASS: signed-in autosave/reload, 20 dates, preserved stops, charging slider isolation, destination inheritance, saved map anchor, rename, day collapse, drawer resize and six responsive/theme layouts.");
}catch(error){console.error("Browser errors:",errors,"Unexpected requests:",unexpected);console.error((await page.locator("body").innerText()).slice(0,5000));throw error;}finally{await browser.close();}
