import type {Run} from './domain';
import {formatTime} from './domain';
import './nativeComparison.css';

export const comparisonColors=['#F97316','#3B82F6','#10B981','#8B5CF6','#EC4899'] as const;
export type ComparisonContext={runs:Run[];icon:(name:string)=>string;esc:(value:string)=>string;km:(value:number)=>string;elevation:(value:number)=>string;units?:string};
export type ComparisonState={playing:boolean;speed:number;elapsed:number;expanded:boolean};
// mo5.a: full map, floating 40dp back button/title, 20dp sheet corners; stats initially collapsed.
export function renderNativeComparison(c:ComparisonContext,state:ComparisonState){
 const elapsed=Math.max(0,Number.isFinite(state.elapsed)?state.elapsed:0),duration=Math.max(1,...c.runs.map(r=>r.duration)),progress=Math.min(1,elapsed/duration);
 const first=c.runs.find(r=>r.points.length),point=first?.points.filter(p=>p.time<=first.started+elapsed*1000).at(-1)??first?.points[0];
 const imperial=c.units==='imperial',speed=(value:number)=>Math.round(value*(imperial?.621371:1)),speedUnit=imperial?'mph':'km/h';
 const row=(label:string,values:string[])=>`<div class="nc-stat"><small>${label}</small><div>${values.map((value,i)=>`<strong style="color:${comparisonColors[i]??comparisonColors[0]}">${c.esc(value)}</strong>`).join('')}</div></div>`;
 return `<section class="native-comparison"><header class="nc-header"><button data-action="back" aria-label="Back">${c.icon('back')}</button><h1>Run Comparison</h1><span></span></header><div class="nc-map-space" aria-hidden="true"></div><section class="nc-sheet"><button class="nc-handle" data-comparison-toggle aria-label="${state.expanded?'Collapse':'Expand'} comparison statistics" aria-expanded="${state.expanded}"><span></span></button><div class="nc-controls"><button class="nc-play" data-comparison-play aria-label="${state.playing?'Pause':'Play'} comparison">${c.icon(state.playing?'pause':'play')}</button><div class="nc-clock"><strong id="comparison-time">${formatTime(elapsed)}</strong><span id="comparison-speed">${speed(point?.speed??0)} ${speedUnit}</span></div><div class="nc-speeds" role="group" aria-label="Comparison replay speed">${[2,8,16].map(n=>`<button data-comparison-speed="${n}" aria-pressed="${state.speed===n}">${n}x</button>`).join('')}</div></div><input class="nc-progress" id="comparison-position" aria-label="Comparison position" type="range" min="0" max="${duration}" step=".01" value="${Math.min(duration,elapsed)}" style="--progress:${progress*100}%">${state.expanded?`<div class="nc-statistics"><div class="nc-legend">${c.runs.map((_,i)=>`<span style="color:${comparisonColors[i]??comparisonColors[0]}"><i></i>Run ${i+1}</span>`).join('')}</div><div class="nc-stat-grid">${row(`Top (${speedUnit})`,c.runs.map(r=>String(speed(r.topSpeed))))}${row(imperial?'Dist (mi)':'Dist (km)',c.runs.map(r=>(r.distance/(imperial?1609.344:1000)).toFixed(1)))}${row('Time (min)',c.runs.map(r=>formatTime(r.duration)))}</div></div>`:''}</section></section>`;
}
