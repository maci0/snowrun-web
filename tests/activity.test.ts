import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import type {Run} from '../src/domain.ts';

// These renderers import Vite CSS and a WASM asset URL; neither asset runs in these pure-state checks.
const assetHook=registerHooks({load(url,context,next){if(url.endsWith('.css'))return {format:'module',source:'export {};',shortCircuit:true};if(url.endsWith('.wasm?url'))return {format:'module',source:'export default "sql-wasm.wasm";',shortCircuit:true};return next(url,context);}});
const {activityTrips,activitySeason,renderJournal}=await import('../src/nativeActivity.ts');
assetHook.deregister();
const day=86400000;
const run=(id:string,resort:string,started:number,duration=3600):Run=>({id,resort,started,duration,name:id,points:[],distance:1250,topSpeed:35,descent:100,snowmiles:12});

test('native trips keep resorts separate and split after two complete days from the last run end',()=>{
 const first=run('first','Mt Hutt',0),next=run('next','Mt Hutt',day),lastEnd=next.started+next.duration*1000;
 const within=run('within','Mt Hutt',lastEnd+2*day-1),other=run('other','Cardrona',day);
 assert.deepEqual(activityTrips([within,other,next,first]).map(group=>group.map(r=>r.id)),[['other'],['first','next','within']]);
 const boundary=run('boundary','Mt Hutt',lastEnd+2*day);
 assert.deepEqual(activityTrips([next,boundary,first]).map(group=>group.map(r=>r.id)),[['boundary'],['first','next']]);
});

test('native season boundaries use June in the south and October in the north',()=>{
 const now=+new Date(2026,7,10),rows=[run('winter','Mt Hutt',+new Date(2026,6,1))];
 assert.equal(activitySeason(rows,-43,now).label,'2026/27 Season');
 assert.equal(activitySeason(rows,45,now).label,'2025/26 Season');
 assert.deepEqual(activitySeason(rows,-43,now),{label:'2026/27 Season',count:1,distance:1.25,topSpeed:35,days:1});
 const boundary=+new Date(2026,5,1);
 assert.equal(activitySeason([run('old','A',boundary-1),run('new','A',boundary)],-43,now).count,1);
});

test('native season falls back to All Time and omits the overview in empty journals',()=>{
 const old=run('old','Mt Hutt',+new Date(2024,6,1));
 assert.equal(activitySeason([old],-43,+new Date(2026,7,10)).label,'All Time');
 const context={runs:[] as Run[],icon:()=>'',esc:(s:string)=>s,asset:(s:string)=>s,km:String,elevation:String};
 for(const tab of ['runs','trips'] as const){const html=renderJournal(context,tab);assert.equal(html.includes('na-season'),false);}
 assert.match(renderJournal({...context,runs:[old]}),/class="na-season"/);
});
