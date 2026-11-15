import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VehicleRangeComparison } from "../../app/feature/planner/planId/_components/garage/vehicle-range-comparison.tsx";

const car={rangeKm:480,batteryKwh:60.48,rangeStandard:"NEDC",energyProfile:{modelKind:"RATED_RANGE",
  ratedRangeKm:480,consumptionKwhPer100km:null,usableBatteryCapacityKwh:60.48}};

test("the planner presents factory range, adjusted range and unchanged battery capacity together",()=>{
  const html=renderToStaticMarkup(createElement(VehicleRangeComparison,{car}));
  for(const text of ["Factory range","480 km","NEDC","Navio planning range","384 km","20% planning allowance","60.48 kWh","Battery capacity stays unchanged"])
    assert.ok(html.includes(text),text);
  assert.match(html,/aria-label="Factory and Navio range comparison"/);
  assert.match(html,/How this estimate works/);
});

test("an observed average is identified without applying a second reduction",()=>{
  const html=renderToStaticMarkup(createElement(VehicleRangeComparison,{car,planningCar:{...car,energyProfile:{
    ...car.energyProfile,modelKind:"CONSUMPTION",consumptionKwhPer100km:20,consumptionSource:"USER_OBSERVED",usableBatteryCapacityKwh:60}}}));
  assert.match(html,/Your observed average/);
  assert.match(html,/300 km/);
  assert.match(html,/no additional reduction/);
  assert.doesNotMatch(html,/20% planning allowance/);
});
