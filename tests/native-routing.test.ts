import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nativeEdgeCost,nativeRoute} from '../src/nativeRouting';
import {pathLength,type Coord,type Trail} from '../src/domain';
const trail=(id:string,coordinates:Coord[],type:'run'|'lift'='run',groomed:boolean|null=true):Trail=>({id,name:id,type,difficulty:'green',groomed,coordinates,length:pathLength(coordinates)});
test('native lift, flat-run and ungroomed preference costs are recovered multipliers',()=>{
 const lift=trail('lift',[[0,0,100],[0,.01,200]],'lift');assert.equal(nativeEdgeCost(lift),lift.length*.3);
 const flat=trail('flat',[[0,0,200],[0,.01,199]],'run',false);assert.equal(nativeEdgeCost(flat),flat.length*4);
 assert.equal(nativeEdgeCost(flat,{preferUngroomed:true,avoidCatwalks:true}),flat.length*.6*3*4);
});
test('shared interior vertices connect routes and destination lift is not traversed',()=>{
 const lift=trail('lift',[[0,0,100],[0,.01,200]],'lift');
 const run=trail('run',[[0,.01,200],[.01,.01,150],[.02,.01,100]]);
 const branch=trail('branch',[[.01,.01,150],[.01,0,100]]);
 const target=trail('target',[[.01,0,100],[.02,0,200]],'lift');
 const result=nativeRoute([lift,run,branch,target],'lift','target',{allowUphillWalk:false});
 assert.deepEqual(result?.map(t=>t.id),['lift','run','branch']);assert.equal(result?.[1].coordinates.length,2);
});
test('unknown grooming is allowed when avoiding ungroomed; explicitly ungroomed is excluded',()=>{
 const a=trail('a',[[0,0,100],[0,.01,200]],'lift');const b=trail('b',[[0,.01,200],[.01,.01,100]],'run',null);const target=trail('target',[[.01,.01,100],[.02,.01,200]],'lift');
 assert.ok(nativeRoute([a,b,target],'a','target',{avoidUngroomed:true,allowUphillWalk:false}));
 assert.equal(nativeRoute([a,{...b,groomed:false},target],'a','target',{avoidUngroomed:true,allowUphillWalk:false}),null);
});
test('GPS origin snaps to a centerline and remote origins are rejected',async()=>{
 const {nativeRouteFrom}=await import('../src/nativeRouting');
 const a=trail('a',[[0,0,100],[0,.01,200]],'lift');const b=trail('b',[[0,.01,200],[.01,.01,100]]);const target=trail('target',[[.01,.01,100],[.02,.01,200]],'lift');
 assert.deepEqual(nativeRouteFrom([a,b,target],[0,.005,150],'target',{allowUphillWalk:false})?.map(t=>t.id),['a','b']);
 assert.equal(nativeRouteFrom([a,b,target],[30,30],'target'),null);
});
test('cumulative ascent across successive junctions cannot bypass the native 12 m ceiling',()=>{
 const a=trail('a',[[0,0,100],[0,.01,110]],'run');const b=trail('b',[[0,.01,110],[0,.02,120]],'run');const target=trail('target',[[0,.02,120],[.01,.02,130]],'lift');
 assert.equal(nativeRoute([a,b,target],'a','target',{allowUphillWalk:false}),null);
});
test('bundled demo navigates from actual experience GPS through Hoods Hollow to the Magic Carpet base',async()=>{
 const {readFileSync}=await import('node:fs');const {parseResort}=await import('../src/domain');const {nativeRouteFrom}=await import('../src/nativeRouting');
 const resort=parseResort(JSON.parse(readFileSync(new URL('../public/assets/mt_hutt_demo.json',import.meta.url),'utf8')));
 const result=nativeRouteFrom(resort.trails,[171.540131,-43.49515],'lift-001',{maxDifficulty:'blue'});
 assert.ok(result&&result.length>1);assert.equal(result[0].id,'lift-002');assert.ok(result.some(t=>t.id==='run-016'));assert.ok(!result.some(t=>t.id==='lift-001'));
});
