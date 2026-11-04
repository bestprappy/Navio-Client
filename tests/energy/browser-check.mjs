// Synthetic authenticated APIs; never reads or writes a real account.
import assert from "node:assert/strict";
import { encode } from "next-auth/jwt";
import { savedVehicleFixture } from "../garage/data.ts";
import { registerHooks } from "node:module";
registerHooks({resolve(specifier,context,next){return next(context.parentURL?.includes("/Navio/client/") && !context.parentURL?.includes("/node_modules/") && specifier.startsWith(".") && !/\.(?:[cm]?js|tsx?|json)$/.test(specifier) ? `${specifier}.ts` : specifier,context);}});
const { snapshotTripVehicle } = await import("../../app/feature/planner/planId/_components/garage/trip-energy-state.ts");
const { chromium } = await import(process.env.NAVIO_PLAYWRIGHT_MODULE ?? "playwright");
const origin=process.env.NAVIO_TEST_ORIGIN ?? "http://localhost:3000";
const id="a1000000-0000-4000-8000-000000000023", stamp=new Date().toISOString();
const vehicle=structuredClone(savedVehicleFixture);
const customVehicle={...structuredClone(savedVehicleFixture),id:"b1000000-0000-4000-8000-000000000024",catalog:null,nickname:"Reusable custom EV"};
vehicle.energyProfile={version:1,modelKind:"RATED_RANGE",selectionMode:"CATALOG_DEFAULT",consumptionKwhPer100km:null,consumptionSource:"UNKNOWN",consumptionMeasurementBasis:"UNKNOWN",consumptionStandard:"NONE",sourceUrl:null,usableBatteryCapacityKwh:null,capacityBasis:"MANUFACTURER_DECLARED_UNSPECIFIED",ratedRangeKm:100,ratedRangeStandard:"NEDC"};
vehicle.consumptionKwhPer100km=null;
const place=(id,lng)=>({id,type:"place",placeId:id,name:`Energy stop ${id}`,address:"Thailand",lat:13.75,lng});
let snapshot={blocks:[{id:"day-1",kind:"itinerary",title:"Day 1",date:"2026-09-23",colorId:"teal",items:[place("a",100.5),place("b",100.6),place("c",100.7)]}],budget:{currency:"THB",amount:0,expenses:[]},energyState:{initialSocPct:90,vehicleSnapshot:snapshotTripVehicle(vehicle)},version:1,savedAt:stamp,capabilities:["day-destinations","charge-targets","day-anchors","trip-energy-v1","observed-soc-v1"]};
const trip={id,displayName:"Canonical energy test",title:"Canonical energy test",destinationId:"bangkok",destinationName:"Bangkok",destinationCountry:"Thailand",destinationCountryCode:"TH",destinationCity:"Bangkok",destinationRegion:"Bangkok",destinationLat:13.75,destinationLng:100.5,startDate:"2026-09-23",endDate:"2026-09-23",visibility:"PRIVATE",createdAt:stamp,updatedAt:stamp};
snapshot.capabilities.push("trip-garage-v1", "trip-vehicles-v1");
const secondId="a2000000-0000-4000-8000-000000000024";
let secondSnapshot={...structuredClone(snapshot),energyState:null};
// The planner is protected by the server proxy; mocking /api/auth/session alone
// cannot authenticate the initial page navigation.
const secret=process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
assert.ok(secret,"Set AUTH_SECRET to the local test server's secret (for example with --env-file=.env.local).");
const browser=await chromium.launch({channel:"chrome",headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const sessionCookie=await encode({secret,salt:"authjs.session-token",token:{
  sub:"22222222-2222-4222-8222-222222222222",name:"Energy test",accessToken:"test-only",
  accessTokenExpiresAt:Math.floor(Date.now()/1000)+3600,
}});
await context.addCookies([{name:"authjs.session-token",value:sessionCookie,url:origin,httpOnly:true,sameSite:"Lax"}]);
const errors=[],garageWrites=[],writes=[];
await context.route(`${origin}/api/**`,async route=>{
  const req=route.request(),path=new URL(req.url()).pathname;
  let body;
  if(path==="/api/auth/session") body={user:{id:"22222222-2222-4222-8222-222222222222",name:"Energy test",email:"test@example.com"},expires:"2099-01-01T00:00:00Z"};
  else if(path==="/api/users/me") body={id:"22222222-2222-4222-8222-222222222222",displayName:"Energy test",email:"test@example.com"};
  else if(path===`/api/trips/${secondId}/planner`) {
    if(req.method()==="PUT") {const payload=req.postDataJSON();writes.push(payload);secondSnapshot={...secondSnapshot,...payload,version:secondSnapshot.version+1,savedAt:new Date().toISOString()};}
    body=secondSnapshot;
  } else if(path===`/api/trips/${secondId}`) body={...trip,id:secondId};
  else if(path===`/api/trips/${id}/planner`) {
    if(req.method()==="PUT") {const payload=req.postDataJSON();writes.push(payload);snapshot={...snapshot,...payload,version:snapshot.version+1,savedAt:new Date().toISOString()};}
    body=snapshot;
  } else if(path===`/api/trips/${id}`) body=trip;
  else if(path==="/api/trips") body={content:[trip],totalElements:1};
  else if(path==="/api/users/me/vehicles/catalog") body=[vehicle.catalog];
  else if(path==="/api/users/me/vehicles") {if(req.method()!=="GET")garageWrites.push(path);body=[vehicle,customVehicle];}
  else if(path.startsWith("/api/users/")) {if(req.method()!=="GET")garageWrites.push(path);body=[];}
  else if(path==="/api/routes/directions") {
    const request=req.postDataJSON();
    body={segments:(request.groups??[]).flatMap(g=>g.points.slice(1).map((p,i)=>({id:`${g.blockId}:${i}`,blockId:g.blockId,fromItemId:g.points[i].id,toItemId:p.id,fromName:g.points[i].name,toName:p.name,status:"routed",distanceMeters:10000,durationSeconds:600,geometry:{type:"LineString",coordinates:[[g.points[i].lng,g.points[i].lat],[p.lng,p.lat]]},fallbackReason:null})))};
  } else if(path.startsWith("/api/geo/")) body={items:[]};
  else return route.fulfill({status:404,json:{message:"Unmocked test endpoint"}});
  return route.fulfill({json:body});
});
const page=await context.newPage();page.on("pageerror",e=>errors.push(e.message));
async function eventually(check,message){for(let i=0;i<100;i++){if(check())return;await page.waitForTimeout(100);}assert.fail(message);}
try {
  await page.goto(`${origin}/planner/${id}`,{timeout:120000});
  await page.locator("#starting-battery").waitFor({timeout:90000});
  assert.equal(await page.locator("#starting-battery").inputValue(),"90");
  await page.locator("#starting-battery").fill("80");
  await eventually(()=>snapshot.energyState.initialSocPct===80,"trip SoC did not autosave");
  const card=page.locator("article").filter({hasText:"Energy stop b"});
  await card.getByRole("button",{name:"Set battery level",exact:true}).click();
  await card.getByLabel("Actual battery at this stop (%)",{exact:true}).fill("68");
  await card.getByRole("button",{name:"Apply battery level",exact:true}).click();
  await eventually(()=>snapshot.blocks[0].items[1].observedSocCheckpoint?.socPct===68,"observation did not autosave");
  const originalProfile=structuredClone(snapshot.energyState.vehicleSnapshot);
  vehicle.energyProfile.ratedRangeKm=999;
  await page.reload();
  await page.locator("#starting-battery").waitFor();
  assert.equal(await page.locator("#starting-battery").inputValue(),"80");
  await card.getByRole("button",{name:"Observed battery: 68%",exact:true}).waitFor();
  assert.deepEqual(snapshot.energyState.vehicleSnapshot,originalProfile);
  await card.getByRole("button",{name:"Observed battery: 68%",exact:true}).click();
  await card.getByRole("button",{name:"Clear",exact:true}).click();
  await eventually(()=>snapshot.blocks[0].items[1].observedSocCheckpoint===null,"observation clear did not autosave");
  for(const theme of ["light","dark"]){await page.evaluate(t=>document.documentElement.classList.toggle("dark",t==="dark"),theme);await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(`${origin}/planner/${secondId}`);
  const garage=page.getByRole("region",{name:"Trip vehicles"});
  await garage.getByRole("heading",{name:"Add the EV you're driving",exact:true}).waitFor();
  await garage.getByRole("button",{name:"Add vehicle",exact:true}).click();
  await page.getByRole("button",{name:"My custom EVs",exact:true}).click();
  await page.getByRole("button",{name:"Reusable custom EV",exact:true}).click();
  await eventually(()=>secondSnapshot.energyState?.garageVehicleIds?.includes(customVehicle.id),"trip membership did not save");
  await page.reload();
  await garage.getByRole("heading",{name:"Reusable custom EV",exact:true}).waitFor();
  await garage.getByRole("button",{name:"Remove Reusable custom EV from garage",exact:true}).click();
  await eventually(()=>secondSnapshot.energyState?.garageVehicleIds?.length===0,"trip removal did not save");
  await page.reload();
  await garage.getByRole("heading",{name:"Add the EV you're driving",exact:true}).waitFor();
  await garage.getByRole("button",{name:"Add vehicle",exact:true}).click();
  await page.getByRole("button",{name:"My custom EVs",exact:true}).click();
  await page.getByRole("button",{name:"Reusable custom EV",exact:true}).waitFor();
  assert.equal(snapshot.energyState.vehicleSnapshot.vehicleId,vehicle.id);
  assert.deepEqual(garageWrites,[]);
  assert.ok(writes.length>=3);
  // Exercise the real charging control and its precise autosave contract.
  vehicle.consumptionKwhPer100km=20;
  vehicle.energyProfile={...vehicle.energyProfile,modelKind:"CONSUMPTION",selectionMode:"USER_OVERRIDE",
    consumptionKwhPer100km:20,consumptionSource:"USER_OBSERVED",usableBatteryCapacityKwh:50,capacityBasis:"USABLE"};
  snapshot.energyState={...snapshot.energyState,initialSocPct:30,vehicleSnapshot:snapshotTripVehicle(vehicle)};
  snapshot.capabilities.push("precise-charging-v1");
  snapshot.version++;
  snapshot.blocks[0].items=[place("a",100.5),{...place("charging",100.6),placeId:"ev-charger:test",name:"Energy charging stop",
    evCharger:{connectorTypes:["CCS2"],maxKw:50,totalConnectors:2,availableConnectors:null,priceText:null,
      openingHoursSummary:null,estimatedChargeMinutes:17,chargingDurationMinutes:17.475,
      plannedDepartureSocPct:55.125,operatorName:null}},place("c",100.7)];
  await page.goto(`${origin}/planner/${id}`);
  const target=page.getByRole("slider",{name:"Target battery at Energy charging stop"});
  await target.waitFor();
  assert.equal(await target.inputValue(),"55");
  await target.fill("80");
  await eventually(()=>snapshot.blocks[0].items[1].evCharger.targetBatteryPct===80,"charging target did not autosave");
  assert.equal(snapshot.blocks[0].items[1].evCharger.plannedDepartureSocPct,null);
  assert.ok(Math.abs(snapshot.blocks[0].items[1].evCharger.chargingDurationMinutes-32.4)<1e-8);
  await page.reload();
  await target.waitFor();
  assert.equal(await target.inputValue(),"80");
  for(const connector of ["CHADEMO","OTHER"]){
    snapshot.blocks[0].items[1].evCharger.connectorTypes=[connector];snapshot.version++;
    await page.reload();await target.waitFor();
    const chargingCard=page.locator("article").filter({has:page.getByRole("heading",{name:"Energy charging stop",exact:true})}).first();
    if(connector==="OTHER") {
      await chargingCard.getByText(/Connector compatibility is unconfirmed/).waitFor();
      assert.equal(await chargingCard.getByText(/Leave with/).count(),0);
    } else {
      await chargingCard.getByText(/None of this station/).waitFor();
      await chargingCard.getByText("Leave with 26%",{exact:true}).waitFor();
    }
  }
  assert.deepEqual(errors,[]);
  console.log("PASS: saved trip SoC/checkpoints, immutable vehicle selection, garage isolation, responsive themes, precise charging target save/reload, incompatible and unknown plugs.");
} catch(error){console.error(errors);console.error({writes,snapshot});console.error(await page.evaluate(()=>Object.entries(localStorage)));console.error((await page.locator("body").innerText()).slice(0,5000));throw error;}
finally{await browser.close();}
