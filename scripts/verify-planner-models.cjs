/* eslint-disable @typescript-eslint/no-require-imports -- Node-only regression runner installs a TypeScript require hook. */
// Run with: node scripts/verify-planner-models.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
const base = '../app/feature/planner/planId/_components/';
const { resolveDayDestinations, matchesDestination } = require(base + 'itinerary/day-destinations.ts');
const { formatOpeningHours } = require(base + 'charger/opening-hours.ts');
const { projectCanonicalCharging: projectChargingStop, projectCanonicalTrip: projectTripCharging } = require(base + 'garage/trip-energy-projection.ts');
const { ensureItineraryDays } = require(base + 'itinerary/itinerary-days.ts');
const { getTripDestinations } = require('../app/feature/planner/_components/trip-destinations.ts');
const mai = { id: 'mai', name: 'Chiang Mai', lat: 18.78, lng: 98.98 };
const bangkok = { id: 'bkk', name: 'Bangkok', lat: 13.75, lng: 100.5 };
const rai = { id: 'rai', name: 'Chiang Rai', lat: 19.91, lng: 99.84 };
const days = Array.from({ length: 20 }, (_, i) => ({ id: `day-${i + 1}`, kind: 'itinerary', date: `2026-09-${String(i + 1).padStart(2, '0')}`, items: [{ id: `kept-${i}` }], ...(i === 9 ? { destination: bangkok } : i === 14 ? { destination: rai } : {}) }));
const before = JSON.stringify(days);
const completedDays = ensureItineraryDays([days[0], days[9]], '2026-09-01', '2026-09-20');
assert.equal(completedDays.length,20);
assert.strictEqual(completedDays[0],days[0]);
assert.strictEqual(completedDays[9],days[9]);
assert.strictEqual(ensureItineraryDays(completedDays,'2026-09-01','2026-09-20'),completedDays);
assert.equal(ensureItineraryDays([],'2026-12-30','2027-01-02').length,4);
assert.equal(ensureItineraryDays([],'2026-09-20','2026-09-01').length,0);
assert.deepEqual(getTripDestinations('Chiang Mai',days),['Chiang Mai','Bangkok','Chiang Rai']);
let resolved = resolveDayDestinations([...days].reverse(), mai);
assert.equal(resolved.get('day-9').name, 'Chiang Mai');
assert.equal(resolved.get('day-10').name, 'Bangkok');
assert.equal(resolved.get('day-14').name, 'Bangkok');
assert.equal(resolved.get('day-15').name, 'Chiang Rai');
assert.equal(JSON.stringify(days), before, 'Resolving destinations must preserve all stops');
days[0].destination = rai;
resolved = resolveDayDestinations(days, mai);
assert.equal(resolved.get('day-9').name, 'Chiang Rai');
assert.equal(resolved.get('day-10').name, 'Bangkok');
days[9].destination = null;
assert.equal(resolveDayDestinations(days, mai).get('day-14').name, 'Chiang Rai');
assert(matchesDestination('Old town, Chiang Mai, Thailand', 'Chiang Mai'));
assert(!matchesDestination('Bangkok, Thailand', 'Chiang Mai'));
const week = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
assert.equal(formatOpeningHours(week.map(d => `${d}: Open 24 hours`).join(' | ')).summary, 'Open 24 hours, every day');
assert.equal(formatOpeningHours('Monday: 9 AM – 5 PM | Tuesday: 9 AM – 5 PM | Wednesday: Closed').rows.length, 2);
assert.equal(formatOpeningHours('Call ahead for holiday hours').summary, 'Call ahead for holiday hours');
const car = { energyProfile:{modelKind:'CONSUMPTION',consumptionKwhPer100km:20,usableBatteryCapacityKwh:60,ratedRangeKm:null}, chargingLimitsKnown:true, batteryKwh: 60, consumptionKwhPer100km: 20, maxAcKw: 11, maxDcKw: 150, connectorTypes: ['CCS2'] };
const charger = { connectorTypes: ['CCS2'], maxKw: 50, estimatedChargeMinutes: 10, targetBatteryPct: 100 };
assert.equal(projectChargingStop(30, charger, car).departurePct, 100);
assert.equal(projectChargingStop(90, { ...charger, targetBatteryPct: 80 }, car).chargeEnergyKwh, 0);
assert.equal(projectChargingStop(30, { ...charger, targetBatteryPct: 80 }, car).departurePct, 80);
assert.equal(projectChargingStop(50, { ...charger, connectorTypes: ['TYPE2'] }, car).departurePct, 50);
assert.equal(projectChargingStop(50, { ...charger, targetBatteryPct: null }, car).departurePct, projectChargingStop(50, { ...charger, targetBatteryPct: undefined }, car).departurePct);
assert(projectChargingStop(10, { ...charger, connectorTypes: ['CCS2','TYPE2'] }, { ...car, connectorTypes: ['TYPE2'] }).chargeMinutes > 200, 'AC-only cars must use AC charging speed');
const block = (id,date,items) => ({ id, date, kind: 'itinerary', items });
const stop = (id,evCharger) => ({ id,lat:13.7,lng:100.5, type: 'place', placeId: evCharger ? `ev-charger:${id}` : id, evCharger });
const projection = projectTripCharging([block('second','2026-09-02',[stop('carry'),stop('b')]),block('first','2026-09-01',[stop('a',charger)])], [{ blockId:'second',fromItemId:'carry',toItemId:'b',distanceMeters:60000 }], car, 30);
assert.equal(projection.days.get('first').finalBatteryPct, 100);
assert.equal(projection.days.get('second').startBatteryPct, 100);
assert.equal(projection.days.get('second').finalBatteryPct, 80);
console.log('Planner model checks passed: destination inheritance, stop preservation, hours, charging targets, legacy stops, and chronological battery carryover.');

const { getTripRouteGroups } = require(base + 'routes/trip-route.helpers.ts');
const { getGoogleMapsDirectionsLinks } = require(base + 'routes/google-maps-export.ts');
const home = { id:'home',kind:'SAVED_PLACE',name:'Home',lat:13.7,lng:100.5 };
const hotel = { id:'hotel',kind:'PLACE',name:'Hotel',lat:14,lng:101 };
const anchorDays = [
  { ...block('one','2026-09-01',[{...stop('visit'),name:'Visit',lat:13.8,lng:100.8}]), startAnchor:home,endAnchor:hotel },
  { ...block('two','2026-09-02',[]),endAnchor:home },
];
const anchorSnapshot = JSON.stringify(anchorDays);
const anchorRoutes = getTripRouteGroups(anchorDays);
assert.deepEqual(anchorRoutes[0].points.map(p=>p.name), ['Home','Visit','Hotel']);
assert.deepEqual(anchorRoutes[1].points.map(p=>p.name), ['Hotel','Home']);
assert.equal(anchorRoutes[1].points[0].id, 'two:start');
assert.equal(JSON.stringify(anchorDays), anchorSnapshot);
assert.equal(getTripRouteGroups([{...anchorDays[0],items:[]}])[0].points.length,2);
const exported = new URL(getGoogleMapsDirectionsLinks(anchorDays[0])[0].href);
assert.equal(exported.searchParams.get('origin'),'13.700000,100.500000');
assert.equal(exported.searchParams.get('destination'),'14.000000,101.000000');
console.log('Endpoint checks passed: route order, inherited starts, empty days, immutable stops, and Google Maps export.');

const { getDayPlacePositions, resolveDayAnchors } = require(base + 'itinerary/day-anchors.ts');
const overnightDays = [
  anchorDays[0],
  block('two', '2026-09-02', []),
  block('three', '2026-09-03', []),
  block('four', '2026-09-04', []),
];
const overnightSnapshot = JSON.stringify(overnightDays);
const overnight = resolveDayAnchors([...overnightDays].reverse());
assert.equal(overnight.get('one').start, home);
for (const id of ['two', 'three', 'four']) {
  assert.equal(overnight.get(id).start, hotel);
  assert.equal(overnight.get(id).end, hotel);
  assert.equal(overnight.get(id).endIsCarriedOver, true);
}
assert.equal(JSON.stringify(overnightDays), overnightSnapshot);
const startOverride = resolveDayAnchors(overnightDays.map(day => day.id === 'two' ? {...day, startAnchor: home} : day));
assert.equal(startOverride.get('two').start, home);
assert.equal(startOverride.get('two').end, hotel);
assert.equal(startOverride.get('three').start, hotel);
const hotelChange = overnightDays.map(day => day.id === 'three' ? {...day, endAnchor: home} : day);
const changed = resolveDayAnchors(hotelChange);
assert.equal(changed.get('three').start, hotel);
assert.equal(changed.get('four').start, home);
assert.equal(changed.get('four').end, home);
assert.equal(changed.get('three').endIsCarriedOver, false);
const cleared = resolveDayAnchors(hotelChange.map(day => day.id === 'three' ? {...day, endAnchor: null} : day));
assert.equal(cleared.get('four').end, hotel);
const earlierChange = resolveDayAnchors(hotelChange.map(day => day.id === 'one' ? {...day, endAnchor: null} : day));
assert.equal(earlierChange.get('two').start, null, 'Home must not seed overnight defaults');
assert.equal(earlierChange.get('two').end, null);
assert.equal(earlierChange.get('three').end, home, 'Explicit later ends survive earlier changes');
assert.equal(earlierChange.get('four').end, home);
const roundTrip = getTripRouteGroups(overnightDays.map(day => day.id === 'two' ? {...day, items: anchorDays[0].items} : day));
assert.deepEqual(roundTrip.find(day => day.blockId === 'two').points.map(point => point.name), ['Hotel', 'Visit', 'Hotel']);
assert.equal(resolveDayAnchors([]).size, 0);
console.log('Overnight defaults passed: round trips, hotel changes, manual overrides, clearing, chronological order, and immutable inputs.');
const numberedDay = { ...anchorDays[0], items: [{id:'note',type:'note'},stop('visit'),stop('charge',charger),stop('next')] };
assert.deepEqual([...getDayPlacePositions(numberedDay,true)], [['visit',2],['next',3]]);
assert.deepEqual([...getDayPlacePositions(numberedDay,false)], [['visit',1],['next',2]]);
assert.deepEqual([...getDayPlacePositions({...numberedDay,kind:'list'},true)], [['visit',1],['next',2]]);
assert.deepEqual([...getDayPlacePositions({...numberedDay,items:[stop('next'),stop('visit')]},true)], [['next',2],['visit',3]]);
assert.equal(getDayPlacePositions({...anchorDays[1],items:[stop('next-day')]}, !!resolveDayAnchors(anchorDays).get('two').start).get('next-day'),2);
const anchorProjection = projectTripCharging(anchorDays, [
  {blockId:'one',fromItemId:'one:start',toItemId:'visit',distanceMeters:30000},
  {blockId:'one',fromItemId:'visit',toItemId:'one:end',distanceMeters:15000},
  {blockId:'two',fromItemId:'two:start',toItemId:'two:end',distanceMeters:60000},
], car,80);
assert.equal(anchorProjection.days.get('one').batteryByItemId.get('one:start').departurePct,80);
assert.equal(anchorProjection.days.get('one').batteryByItemId.get('visit').arrivalPct,70);
assert.equal(anchorProjection.days.get('one').batteryByItemId.get('one:end').arrivalPct,65);
assert.equal(anchorProjection.days.get('one').distanceKm,45);
assert.equal(anchorProjection.days.get('two').startBatteryPct,65);
assert.equal(anchorProjection.days.get('two').batteryByItemId.get('two:start').departurePct,65);
assert.equal(anchorProjection.days.get('two').finalBatteryPct,45);
assert.equal(anchorProjection.summary.totalDistanceKm,105);
assert.equal(anchorProjection.summary.totalEnergyKwh,21);
const chargeFirst = projectTripCharging([{...anchorDays[0],items:[stop('charge',charger)]}], [
  {blockId:'one',fromItemId:'one:start',toItemId:'charge',distanceMeters:30000},
  {blockId:'one',fromItemId:'charge',toItemId:'one:end',distanceMeters:15000},
],car,80).days.get('one');
assert.equal(chargeFirst.batteryByItemId.get('charge').arrivalPct,70);
assert.equal(chargeFirst.batteryByItemId.get('charge').departurePct,100);
assert.equal(chargeFirst.finalBatteryPct,95);
console.log('Start/end checks passed: shared numbering, reordering, inherited starts, first-leg battery, final-leg totals, anchor-only days, and charging before the final leg.');
