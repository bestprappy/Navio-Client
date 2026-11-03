const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
/** Legacy ISO values are accepted for rolling upgrades; their year is never displayed. */
export function publishedMonthDay(value?:string):string|null {
 const match=value?.match(/^(?:\d{4}-|--)?(\d{2})-(\d{2})$/);
 if(!match)return null;
 const month=Number(match[1]),day=Number(match[2]);
 if(month<1||month>12||day<1||day>[31,29,31,30,31,30,31,31,30,31,30,31][month-1])return null;
 return `${match[1]}-${match[2]}`;
}
export function publishedDateLabel(value?:string):string|null {
 const date=publishedMonthDay(value);return date?`${months[Number(date.slice(0,2))-1]} ${Number(date.slice(3))}`:null;
}
export function copyStartDate(mode:'retain'|'change',published:string|undefined,year:string,newDate:string):string {
 const monthDay=publishedMonthDay(published);
 if(mode==='retain'&&(!monthDay||!/^\d{4}$/.test(year)))throw new Error('Choose a year for the published month and day.');
 const result=mode==='retain'?`${year}-${monthDay}`:newDate;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(result))throw new Error('Choose a valid start date.');
 const date=new Date(`${result}T12:00:00Z`);
 if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==result)throw new Error('Choose a valid date and year. February 29 requires a leap year.');
 return result;
}
/** An explicit date works with both old and yearless backends; never ask an old server to reuse its year. */
export function copyDateRequest(mode:'retain'|'change',published:string|undefined,year:string,newDate:string) {
 return {dateMode:'change' as const,startDate:copyStartDate(mode,published,year,newDate)};
}
