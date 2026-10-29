export type Coord = [number, number, number?];
export type Difficulty = 'green' | 'blue' | 'red' | 'black' | 'unrated';
export type Trail = { id: string; name: string; type: 'run' | 'lift'; difficulty: Difficulty; groomed: boolean|null; coordinates: Coord[]; length: number };
export type Resort = { slug: string; name: string; trails: Trail[] };
export type Point = { lng: number; lat: number; altitude: number; time: number; speed: number };
export type Run = { id: string; resort: string; name: string; started: number; duration: number; points: Point[]; distance: number; topSpeed: number; descent: number; snowmiles: number };
const levels: Record<string, Difficulty> = { novice: 'green', easy: 'green', beginner: 'green', intermediate: 'blue', advanced: 'red', difficult: 'red', expert: 'black', freeride: 'black', extreme: 'black', green:'green', blue:'blue', red:'red', black:'black',unrated:'unrated' };
export const ranks: Record<Difficulty, number> = {green:0,blue:1,red:2,black:3,unrated:3};
export function distance(a: Coord, b: Coord) {
  const rad = Math.PI / 180, dlat=(b[1]-a[1])*rad, dlng=(b[0]-a[0])*rad;
  const h=Math.sin(dlat/2)**2+Math.cos(a[1]*rad)*Math.cos(b[1]*rad)*Math.sin(dlng/2)**2;
  return 6371000*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));
}
export const pathLength=(points: Coord[])=>points.slice(1).reduce((n,p,i)=>n+distance(points[i],p),0);
export function parseResort(value: unknown): Resort {
  if (!value || typeof value !== 'object') throw Error('Choose a GeoJSON FeatureCollection.');
  const data=value as {type?:string;features?:unknown[];metadata?:{resort_slug?:string;resort_name?:string}};
  if(data.type!=='FeatureCollection'||!Array.isArray(data.features)||data.features.length>2000) throw Error('Expected up to 2,000 GeoJSON trail features.');
  const trails: Trail[]=[];let totalPoints=0;
  for(const [i,raw] of data.features.entries()) {
    if(!raw||typeof raw!=='object') continue;
    const f=raw as {geometry?:{type?:string;coordinates?:unknown[]};properties?:Record<string,unknown>};
    if(f.geometry?.type!=='LineString') continue;
    const points=f.geometry.coordinates;
    if(!Array.isArray(points)||points.length<2||points.length>50000||(totalPoints+=points.length)>50000) throw Error('Invalid trail geometry.');
    const coords=points.map(p=>{
      if(!Array.isArray(p)||p.length<2||!Number.isFinite(p[0])||!Number.isFinite(p[1])||Math.abs(p[0])>180||Math.abs(p[1])>85) throw Error('Invalid trail coordinates.');
      return [p[0],p[1],typeof p[2]==='number'&&Number.isFinite(p[2])?p[2]:undefined] as Coord;
    });
    const p=f.properties??{};
    const type=p.type==='lift'||p.aerialway?'lift':'run';
    // Native UNRATED renders gray and uses black-run routing restrictions.
    trails.push({id:String(p.id??`trail-${i}`),name:String(p.name??`Unnamed ${type}`).slice(0,160),type,difficulty:levels[String(p.difficulty??p['piste:difficulty'])]??'unrated',groomed:typeof p.groomed==='boolean'?p.groomed:null,coordinates:coords,length:pathLength(coords)});
  }
  if(!trails.length) throw Error('No LineString trails were found.');
  if(new Set(trails.map(t=>t.id)).size!==trails.length)throw Error('Trail IDs must be unique.');
  return {slug:String(data.metadata?.resort_slug??'imported-map').slice(0,100),name:String(data.metadata?.resort_name??'Imported resort').slice(0,160),trails};
}
export function route(trails:Trail[],fromId:string,toId:string,max:Difficulty,groomedOnly=false):Trail[]|null {
  const allowed=trails.filter(t=>t.type==='lift'||ranks[t.difficulty]<=ranks[max]&&(!groomedOnly||t.groomed));
  const start=allowed.find(t=>t.id===fromId),end=allowed.find(t=>t.id===toId);
  if(!start||!end)return null;
  if(start===end)return [start];
  const costs=new Map([[start.id,start.length]]),previous=new Map<string,string>(),pending=new Set(allowed.map(t=>t.id));
  while(pending.size){
    let current:Trail|undefined,best=Infinity;
    for(const t of allowed)if(pending.has(t.id)&&(costs.get(t.id)??Infinity)<best){current=t;best=costs.get(t.id)!;}
    if(!current)break;
    pending.delete(current.id);
    if(current===end){const ids=[end.id];while(previous.has(ids[0]))ids.unshift(previous.get(ids[0])!);return ids.map(id=>allowed.find(t=>t.id===id)!);}
    for(const next of allowed){
      if(!pending.has(next.id))continue;
      // shortcut: connect trail ends within 100 m; upgrade to authoritative junction topology for navigation outside experience mode.
      const gap=distance(current.coordinates.at(-1)!,next.coordinates[0]);
      if(gap>100)continue;
      const cost=best+next.length*(next.type==='lift'?1.5:1+ranks[next.difficulty]*.15)+gap*3;
      if(cost<(costs.get(next.id)??Infinity)){costs.set(next.id,cost);previous.set(next.id,current.id);}
    }
  }
  return null;
}
export function simulationPath(trails:Trail[]):Coord[]{
  const candidates=trails.filter(t=>t.type==='run'&&t.coordinates.length>1).sort((a,b)=>b.length-a.length);
  const trail=candidates.find(t=>t.difficulty==='blue')??candidates[0];
  if(!trail)throw Error('No trail is available for the simulated run.');
  return resample(trail.coordinates,8);
}
export function resample(coords:Coord[],spacing:number):Coord[]{
 if(!Number.isFinite(spacing)||spacing<=0)throw Error('Invalid sampling interval.');
 const out:Coord[]=[coords[0]];
 for(let i=1;i<coords.length;i++){
  const a=coords[i-1],b=coords[i],steps=Math.max(1,Math.ceil(distance(a,b)/spacing));
  if(out.length+steps>50000)throw Error('This trail is too long for experience mode.');
  for(let j=1;j<=steps;j++){const f=j/steps;out.push([a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,a[2]!==undefined&&b[2]!==undefined?a[2]+(b[2]-a[2])*f:undefined]);}
 }
 return out;
}
export function runStats(points:Point[]){
 let meters=0,descent=0,topSpeed=0;
 for(let i=0;i<points.length;i++){topSpeed=Math.max(topSpeed,points[i].speed);if(i){meters+=distance([points[i-1].lng,points[i-1].lat],[points[i].lng,points[i].lat]);descent+=Math.max(0,points[i-1].altitude-points[i].altitude);}}
 return {distance:meters,descent,topSpeed,snowmiles:Math.floor(meters/100)};
}
export function formatTime(seconds:number){return `${Math.floor(seconds/60).toString().padStart(2,'0')}:${Math.floor(seconds%60).toString().padStart(2,'0')}`;}
export function gpx(run:Run){const escape=(s:string)=>s.replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]!));return `<?xml version="1.0"?><gpx version="1.1" creator="SnowRun Web" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>${escape(run.name)}</name><trkseg>${run.points.map(p=>`<trkpt lat="${p.lat}" lon="${p.lng}"><ele>${p.altitude}</ele><time>${new Date(p.time).toISOString()}</time></trkpt>`).join('')}</trkseg></trk></gpx>`;}

// kg5.java/th5.java: group named features and display the hardest classification.
export function guideRuns(trails:Trail[]):Trail[]{
 const groups=new Map<string,Trail[]>();
 for(const trail of trails){if(trail.type==='lift')continue;const name=trail.name.trim().replace(/\s+/g,' ').normalize('NFKD').replace(/\p{Mn}+/gu,'').normalize('NFC').toUpperCase().toLowerCase();const key=name||trail.id;groups.set(key,[...(groups.get(key)??[]),trail]);}
 return [...groups.values()].map(group=>{const hardest=group.reduce((a,b)=>ranks[b.difficulty]>ranks[a.difficulty]||ranks[b.difficulty]===ranks[a.difficulty]&&b.difficulty==='black'?b:a);const longest=group.reduce((a,b)=>b.length>a.length?b:a);return {...longest,difficulty:hardest.difficulty};});
}
// ie5.java: lift altitude endpoints determine the resort's overview orientation.
export function overview(trails:Trail[]){
 const lifts=trails.filter(t=>t.type==='lift'&&Number.isFinite(t.coordinates[0][2])&&Number.isFinite(t.coordinates.at(-1)![2]));if(lifts.length<2)return null;
 const ends=lifts.map(t=>[t.coordinates[0],t.coordinates.at(-1)!].sort((a,b)=>a[2]!-b[2]!));
 const mean=(i:number,axis:number)=>ends.reduce((sum,p)=>sum+p[i][axis]!,0)/ends.length;
 const low=[mean(0,0),mean(0,1)],high=[mean(1,0),mean(1,1)],rad=Math.PI/180,dlng=(high[0]-low[0])*rad;
 const bearing=(Math.atan2(Math.sin(dlng)*Math.cos(high[1]*rad),Math.sin(high[1]*rad)*Math.cos(low[1]*rad)-Math.cos(dlng)*Math.cos(high[1]*rad)*Math.sin(low[1]*rad))/rad+360)%360;
 return {bearing,center:[high[0]*.7+low[0]*.3,high[1]*.7+low[1]*.3] as [number,number]};
}
