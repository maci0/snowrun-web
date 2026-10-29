import {distance,pathLength,ranks,type Coord,type Difficulty,type Trail} from './domain';

/** Source: fg5.java (ResortGraph), le5.java (direction/topology), wf5.java (preferences). */
export type NativeRoutingPreferences={maxDifficulty?:Difficulty;avoidUngroomed?:boolean;preferUngroomed?:boolean;avoidCatwalks?:boolean;difficultyWeights?:Partial<Record<Difficulty,number>>;allowUphillWalk?:boolean};
export const nativeRoutingEvidence={topology:'fg5.java:145-320,367-540,625-627,851-853',cost:'fg5.java:2008-2055',alternatives:'fg5.java:1211-1237',stations:'fg5.java:3157-3221',walks:'fg5.java:3263-3305',direction:'le5.java:192-350',preferences:'wf5.java:64'};

export function nativeEdgeCost(trail:Trail,prefs:NativeRoutingPreferences={}):number {
 let cost=trail.length*(prefs.difficultyWeights?.[trail.difficulty]??(trail.difficulty==='unrated'?prefs.difficultyWeights?.black:undefined)??1);
 if(prefs.preferUngroomed&&trail.groomed===false)cost*=.6;
 const a=trail.coordinates[0]?.[2],b=trail.coordinates.at(-1)?.[2];
 if(trail.type==='lift')return cost*.3;
 if(a!==undefined&&b!==undefined){
  const drop=a-b;
  if(prefs.avoidCatwalks&&trail.length>=150&&Math.abs(drop)/trail.length<.08)cost*=3;
  if(drop< -12)cost*=6;
  else if(drop<12||drop<25&&drop/Math.max(trail.length,1)<.1)cost*=4;
 }
 return cost;
}

type Edge={from:number;to:number;trail:Trail;cost:number;connector?:boolean;walk?:boolean;display?:boolean};
type Node={point:Coord;edges:Edge[]};
const heightCompatible=(a:Coord,b:Coord,tolerance=20)=>a[2]===undefined||b[2]===undefined||Math.abs(a[2]-b[2])<=tolerance;
// shortcut: Trail omits native direction-confidence metadata; use elevation inference until verified direction records are supplied.
function oriented(trail:Trail):Trail {
 const coords=trail.coordinates;
 if(coords.length<2)return trail;
 const altitude=coords.map(c=>c[2]);
 if(altitude.some(a=>a===undefined))return trail;
 const smooth=altitude.map((_,i)=>{const values=altitude.slice(Math.max(0,i-1),Math.min(altitude.length,i+2)) as number[];values.sort((a,b)=>a-b);return values.length===2?(values[0]+values[1])/2:values[Math.floor(values.length/2)];});
 const rise=smooth.at(-1)!-smooth[0];
 if(Math.abs(rise)<15)return trail;
 return (trail.type==='lift'?rise<0:rise>0)?{...trail,coordinates:[...coords].reverse()}:trail;
}

/** Destination is a feature coordinate, rather than an obligation to traverse the entire feature. */
export function nativeRoute(trails:Trail[],fromId:string,toId:string,prefs:NativeRoutingPreferences={},destinationPoint?:Coord):Trail[]|null {
 const all=trails.map(oriented),start=all.find(t=>t.id===fromId),target=all.find(t=>t.id===toId);
 if(!start||!target)return null;
 if(fromId===toId)return [];
 const allowed=all.filter(t=>t.type==='lift'||(!prefs.maxDifficulty||ranks[t.difficulty]<=ranks[prefs.maxDifficulty])&&(!prefs.avoidUngroomed||t.groomed!==false));
 const nodes:Node[]=[],trailNodes=new Map<string,number[]>();
 // Runs split at interior vertices; lifts retain their boarding and unloading stations (fg5:244-320).
 function node(point:Coord){let id=nodes.findIndex(n=>distance(n.point,point)<=1&&heightCompatible(n.point,point));if(id<0){id=nodes.length;nodes.push({point,edges:[]});}return id;}
 for(const t of allowed)trailNodes.set(t.id,t.coordinates.map(node));
 const source=trailNodes.get(start.id)?.[0];
 // A filtered destination can still be reached at its entrance without skiing that trail.
 const destination=node(destinationPoint??target.coordinates[0]);
 if(source===undefined)return null;
 const junctions=new Set<number>([source,destination]);
 for(const [id,ids] of trailNodes){junctions.add(ids[0]);junctions.add(ids.at(-1)!);if(allowed.find(t=>t.id===id)!.type!=='lift')for(const n of ids)junctions.add(n);}
 for(const t of allowed){const ids=trailNodes.get(t.id)!;let begin=0;for(let i=1;i<ids.length;i++)if(junctions.has(ids[i])||i===ids.length-1){
  const coords=t.coordinates.slice(begin,i+1),part={...t,coordinates:coords,length:pathLength(coords)};
  const edge={from:ids[begin],to:ids[i],trail:part,cost:nativeEdgeCost(part,prefs)};
  if(edge.from!==edge.to){nodes[edge.from].edges.push(edge);
   const heights=part.coordinates.map(c=>c[2]);
   if(t.type==='run'&&heights.every(h=>h!==undefined)&&Math.max(...heights as number[])-Math.min(...heights as number[])<12){const reverse={...part,coordinates:[...coords].reverse()};nodes[edge.to].edges.push({from:edge.to,to:edge.from,trail:reverse,cost:nativeEdgeCost(reverse,prefs)});}
  }
  begin=i;
 }}
 // Native nearby-node merges require every cross-pair to satisfy the radius/height checks.
 const js=[...junctions],clusters=js.map(n=>[n]);
 for(let i=0;i<clusters.length;i++)for(let j=i+1;j<clusters.length;j++){
  const a=clusters[i],b=clusters[j];if(!a.length||!b.length)continue;
  if(a.every(x=>b.every(y=>distance(nodes[x].point,nodes[y].point)<35&&heightCompatible(nodes[x].point,nodes[y].point)))){a.push(...b);b.length=0;}
 }
 for(const cluster of clusters)for(const a of cluster)for(const b of cluster)if(a!==b)nodes[a].edges.push({from:a,to:b,trail:start,cost:0,connector:true});

 // Lift station bridges use a 40 m radius and 15 m vertical tolerance (fg5.s).
 const liftStations=new Set<number>();for(const t of allowed)if(t.type==='lift'){const ids=trailNodes.get(t.id)!;liftStations.add(ids[0]);liftStations.add(ids.at(-1)!);}
 for(const a of liftStations)for(const b of js){if(a===b)continue;const pa=nodes[a].point,pb=nodes[b].point,gap=distance(pa,pb);if(gap<40&&heightCompatible(pa,pb,15)){const station:Trail={id:`station-${a}-${b}`,name:'',type:'run',difficulty:'green',groomed:null,coordinates:[pa,pb],length:gap};nodes[a].edges.push({from:a,to:b,trail:station,cost:gap*2,connector:true,display:true});nodes[b].edges.push({from:b,to:a,trail:{...station,id:`station-${b}-${a}`,coordinates:[pb,pa]},cost:gap*2,connector:true,display:true});}}
 // Native walk links are only added to graph sinks, not arbitrary junctions (fg5.t).
 if(prefs.allowUphillWalk!==false){
  const sinks=js.filter(n=>nodes[n].edges.length===0);
  const liftStarts=allowed.filter(t=>t.type==='lift').map(t=>trailNodes.get(t.id)![0]);
  for(const a of sinks){let nearest: number|undefined,best=100;for(const b of liftStarts){if(a===b)continue;const pa=nodes[a].point,pb=nodes[b].point,gap=distance(pa,pb);if(gap<best&&(pa[2]===undefined||pb[2]===undefined||pb[2]-pa[2]<=20)){best=gap;nearest=b;}}if(nearest!==undefined)nodes[a].edges.push({from:a,to:nearest,trail:start,cost:best*5,connector:true,walk:true});}
 }
 // Native state includes the lowest elevation since a lift/walk. This prevents ascending
 // a sequence of small connectors to bypass the cumulative 12 m uphill restriction.
 type State={node:number;floor:number|undefined;cost:number;previous?:State;edge?:Edge};
 const initial:State={node:source,floor:nodes[source].point[2],cost:0},queue:State[]=[initial],costs=new Map<string,number>();
 const key=(n:number,f:number|undefined)=>`${n}:${f===undefined?'?':Math.round(f*1000)}`;
 costs.set(key(source,initial.floor),0);
 let settled=0;
 while(queue.length&&settled++<12000){queue.sort((a,b)=>b.cost-a.cost);const current=queue.pop()!;if(current.cost!==costs.get(key(current.node,current.floor)))continue;
  if(current.node===destination){const result:Trail[]=[];let state=current;while(state.previous){if(state.edge&&(!state.edge.connector||state.edge.display))result.unshift(state.edge.trail);state=state.previous;}
   const merged:Trail[]=[];for(const t of result){const last=merged.at(-1);if(last?.id===t.id){last.coordinates.push(...t.coordinates.slice(1));last.length+=t.length;}else merged.push({...t,coordinates:[...t.coordinates]});}return merged;
  }
  for(const e of nodes[current.node].edges){let floor=current.floor;if(!e.connector&&e.trail.type==='lift'||e.walk)floor=nodes[e.to].point[2];else{const heights=e.connector?[nodes[e.to].point[2]]:e.trail.coordinates.map(c=>c[2]);let blocked=false;for(const h of heights){if(h===undefined){floor=undefined;continue;}if(floor!==undefined&&h-floor>=12){blocked=true;break;}floor=floor===undefined?h:Math.min(floor,h);}if(blocked)continue;}
   const cost=current.cost+e.cost,k=key(e.to,floor);if(cost<(costs.get(k)??Infinity)){costs.set(k,cost);queue.push({node:e.to,floor,cost,previous:current,edge:e});}
  }
 }

 return null;
}

/** GPS origin snaps to the closest trail centerline, not a caller-chosen lift. */
export function nativeRouteFrom(trails:Trail[],origin:Coord,toId:string,prefs:NativeRoutingPreferences={}):Trail[]|null {
 let nearest:{trail:Trail;index:number;point:Coord;gap:number}|undefined;
 const cos=Math.cos(origin[1]*Math.PI/180);
 for(const trail of trails)for(let i=1;i<trail.coordinates.length;i++){
  const a=trail.coordinates[i-1],b=trail.coordinates[i],dx=(b[0]-a[0])*cos,dy=b[1]-a[1],x=(origin[0]-a[0])*cos,y=origin[1]-a[1];
  const t=Math.max(0,Math.min(1,(x*dx+y*dy)/(dx*dx+dy*dy||1)));
  const point:Coord=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]!==undefined&&b[2]!==undefined?a[2]+(b[2]-a[2])*t:undefined];
  const gap=distance(origin,point);if(!nearest||gap<nearest.gap)nearest={trail,index:i,point,gap};
 }
 if(!nearest||nearest.gap>250)return null;
 const match=nearest;
 const copy=trails.map(t=>t.id===match.trail.id?{...t,coordinates:[...t.coordinates.slice(0,match.index),match.point,...t.coordinates.slice(match.index)]}:t);
 const source:Trail={...match.trail,id:'origin-snap',name:'',type:'lift',difficulty:'green',coordinates:[match.point,match.point],length:0};
 return nativeRoute([...copy,source],source.id,toId,prefs)?.filter(t=>t.id!=='origin-snap')??null;
}
