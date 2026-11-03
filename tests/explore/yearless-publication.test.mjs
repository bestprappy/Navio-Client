import assert from 'node:assert/strict';
import {test} from 'node:test';
import {register} from 'node:module';
register(new URL('../support/typescript-loader.mjs',import.meta.url));
const {publishedDateLabel,copyStartDate,copyDateRequest}=await import('../../app/feature/planner/_components/share/public-dates.ts');
test('public labels omit year and weekday for old and new dates',()=>{
 assert.equal(publishedDateLabel('2032-02-29'),'Feb 29');
 assert.equal(publishedDateLabel('02-29'),'Feb 29');
 assert.equal(publishedDateLabel('--12-31'),'Dec 31');
 assert.equal(publishedDateLabel('02-30'),null);
});
test('copy sends an explicit changed date so an older server cannot silently reuse the original year',()=>{
 assert.deepEqual(copyDateRequest('retain','12-25','2032',''),{dateMode:'change',startDate:'2032-12-25'});
});
test('retaining month/day requires a valid chosen year without silently adjusting leap day',()=>{
 assert.equal(copyStartDate('retain','02-29','2032',''),'2032-02-29');
 assert.throws(()=>copyStartDate('retain','02-29','2031',''),/valid/);
 assert.throws(()=>copyStartDate('retain','12-25','',''),/year/);
 assert.equal(copyStartDate('change',undefined,'','2027-12-31'),'2027-12-31');
});
