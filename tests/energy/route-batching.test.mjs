import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";
registerHooks({ resolve(specifier, context, next) {
  return next(specifier.startsWith(".") && !/\.(?:[cm]?js|tsx?|json)$/.test(specifier) ? `${specifier}.ts` : specifier, context);
} });
const { fetchTripRoutes } = await import("../../app/feature/planner/planId/_components/routes/trip-route-api.ts");
const { getTripRouteGroups } = await import("../../app/feature/planner/planId/_components/routes/trip-route.helpers.ts");

const point = i => ({id:`stop-${i}`,name:`Stop ${i}`,type:"place",lat:13.75,lng:100.5+i*.001});
const group = (day, count=2) => ({blockId:`day-${day}`,points:Array.from({length:count},(_,i)=>point(i))});
function responseFor(body) {
  return {segments:body.groups.flatMap(g=>g.points.slice(1).map((p,i)=>({
    id:`${g.blockId}:${g.points[i].id}:${p.id}`,blockId:g.blockId,
    fromItemId:g.points[i].id,toItemId:p.id,fromName:g.points[i].name,toName:p.name,
    status:"routed",geometry:{type:"LineString",coordinates:[[100.5,13.75],[100.51,13.75]]},
    distanceMeters:1000,durationSeconds:60,fallbackReason:null,
  })))};
}
function mockFetch(t, handler) {
  const calls=[];
  t.mock.method(globalThis,"fetch",async (_url, options)=>{
    const body=JSON.parse(options.body); calls.push(body);
    assert.ok(body.groups.length<=10);
    assert.ok(body.groups.every(g=>g.points.length>=2 && g.points.length<=25));
    return handler ? handler(body,calls.length,options) : Response.json(responseFor(body));
  });
  return calls;
}

test("25 route days are batched without changing point identities, order or profile",async t=>{
  const calls=mockFetch(t);
  const request={profile:"walking",groups:Array.from({length:25},(_,i)=>group(i))};
  const before=structuredClone(request);
  const result=await fetchTripRoutes(request);
  assert.deepEqual(calls.map(c=>c.groups.length),[10,10,5]);
  assert.ok(calls.every(c=>c.profile==="walking"));
  assert.deepEqual(result,responseFor(request));
  assert.deepEqual(request,before);
});

test("long days preserve each leg exactly once across 25-point boundaries",async t=>{
  const calls=mockFetch(t);
  for(const count of [2,24,25,26,49,50,242]) {
    const request={groups:[group(count,count)]};
    const result=await fetchTripRoutes(request);
    assert.deepEqual(result,responseFor(request));
    assert.equal(result.segments.length,count-1);
    assert.equal(new Set(result.segments.map(s=>s.id)).size,count-1);
  }
  assert.ok(calls.length>7);
});

test("rail-only enforcement survives point chunks and multiple request batches", async t => {
  const request = {
    groups: Array.from({ length: 11 }, (_, day) => {
      const routeGroup = group(day, 26);
      for (const index of [1, 24, 25]) {
        routeGroup.points[index].arrivalMode = "transit";
      }
      for (const index of [24, 25]) routeGroup.points[index].railOnly = true;
      return routeGroup;
    }),
  };
  const before = structuredClone(request);
  const calls = mockFetch(t, body => {
    const data = responseFor(body);
    for (const segment of data.segments) {
      if (!["stop-1", "stop-24", "stop-25"].includes(segment.toItemId)) continue;
      const vehicleType = segment.toItemId === "stop-24" ? "SUBWAY" : "BUS";
      segment.travelMode = "transit";
      segment.steps = [{
        travelMode: "transit", geometry: segment.geometry,
        distanceMeters: 1000, durationSeconds: 60,
        departureStop: "Origin", arrivalStop: "Destination", stopCount: 1,
        line: { name: vehicleType, color: "#9932cc", vehicleType },
      }];
    }
    return Response.json(data);
  });

  const result = await fetchTripRoutes(request);
  assert.deepEqual(calls.map(call => call.groups.length), [10, 10, 2]);
  assert.equal(result.segments.length, 275);
  assert.deepEqual(request, before);
  for (const routeGroup of request.groups) {
    const legs = result.segments.filter(segment => segment.blockId === routeGroup.blockId);
    assert.equal(legs[0].status, "routed");
    assert.equal(legs[0].steps[0].line.vehicleType, "BUS");
    assert.equal(legs[23].status, "routed");
    assert.equal(legs[23].steps[0].line.vehicleType, "SUBWAY");
    assert.equal(legs[23].steps[0].line.color, "#9932cc");
    assert.equal(legs[24].status, "fallback");
    assert.equal(legs[24].fallbackReason, "No rail route was found");
    assert.equal(legs[24].durationSeconds, null);
    assert.equal(legs[24].distanceMeters, null);
    assert.deepEqual(legs[24].steps, []);
    assert.deepEqual(legs[24].geometry.coordinates, [
      [routeGroup.points[24].lng, routeGroup.points[24].lat],
      [routeGroup.points[25].lng, routeGroup.points[25].lat],
    ]);
  }
});

test("resolved start/end anchors count toward point limits and survive chunking",async t=>{
  mockFetch(t);
  const items=Array.from({length:24},(_,i)=>({...point(i),type:"place",placeId:`place-${i}`}));
  const groups=getTripRouteGroups([{id:"day",kind:"itinerary",title:"Day",date:"2026-10-05",items,
    startAnchor:{...point(100),kind:"PLACE"},endAnchor:{...point(200),kind:"PLACE"}}]);
  assert.equal(groups[0].points.length,26);
  const result=await fetchTripRoutes({groups});
  assert.equal(result.segments.length,25);
  assert.equal(result.segments[0].fromItemId,"day:start");
  assert.equal(result.segments.at(-1).toItemId,"day:end");
});

test("a later HTTP failure rejects the entire result and includes validation details",async t=>{
  t.mock.method(console,"warn",()=>{});
  const calls=mockFetch(t,(body,n)=>n===2
    ? Response.json({message:"Validation failed",error:null,validationErrors:{groups:"size must be between 1 and 10"}},{status:400})
    : Response.json(responseFor(body)));
  await assert.rejects(fetchTripRoutes({groups:Array.from({length:25},(_,i)=>group(i))}),/Validation failed; groups: size must be between 1 and 10/);
  assert.equal(calls.length,2);
});

test("proxy error and non-JSON failures retain useful diagnostic text",async t=>{
  t.mock.method(console,"warn",()=>{});
  let count=0;
  mockFetch(t,()=>++count===1
    ? Response.json({error:"The mobility service took too long to respond."},{status:504})
    : new Response("<html>Bad gateway</html>",{status:502}));
  await assert.rejects(fetchTripRoutes({groups:[group(1)]}),/took too long/);
  await assert.rejects(fetchTripRoutes({groups:[group(1)]}),/HTTP 502/);
});

test("malformed, missing and mismatched legs cannot become a successful partial route",async t=>{
  let count=0;
  mockFetch(t,body=>{
    if(++count===1) return Response.json({segments:[]});
    if(count===2) return new Response("not JSON");
    const data=responseFor(body);data.segments[0].toItemId="wrong-stop";
    return Response.json(data);
  });
  await assert.rejects(fetchTripRoutes({groups:[group(1)]}),/incomplete or mismatched/);
  await assert.rejects(fetchTripRoutes({groups:[group(1)]}),/invalid response/);
  await assert.rejects(fetchTripRoutes({groups:[group(1)]}),/incomplete or mismatched/);
});

test("fallback status and unavailable duration remain unchanged",async t=>{
  mockFetch(t,body=>{const data=responseFor(body);Object.assign(data.segments[0],{status:"fallback",durationSeconds:null,fallbackReason:"Provider unavailable"});return Response.json(data);});
  const result=await fetchTripRoutes({groups:[group(1)]});
  assert.equal(result.segments[0].status,"fallback");
  assert.equal(result.segments[0].durationSeconds,null);
});

test("cancellation stops further batches and empty trips make no request",async t=>{
  const controller=new AbortController();
  const calls=mockFetch(t,(body,_n,options)=>{
    assert.equal(options.signal,controller.signal);controller.abort();return Response.json(responseFor(body));
  });
  assert.deepEqual(await fetchTripRoutes({groups:[]}),{segments:[]});
  assert.equal(calls.length,0);
  await assert.rejects(fetchTripRoutes({groups:Array.from({length:11},(_,i)=>group(i))},controller.signal),{name:"AbortError"});
  assert.equal(calls.length,1);
});
