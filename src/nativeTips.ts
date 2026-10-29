import './nativeTips.css';

export type NativeTipKey='resort'|'navigate'|'journal'|'friends'|'rewards';
export const nativeTips:Record<NativeTipKey,{title:string;copy:string;image:string;step?:number;steps?:number;next?:NativeTipKey;back?:NativeTipKey}>={
 resort:{title:'Find Your Resort',copy:'Tap the search bar to browse resorts. Pick one to load the trail map.',image:'yuki_tooltip_search.png',step:0,steps:1},
 navigate:{title:'Drop Pin to Navigate',copy:'Tap anywhere on the map to drop a pin, then Yuki will find the best route to get you there.',image:'yuki_tooltip_pin.png'},
 journal:{title:'Your Ski Journal',copy:'Your logbook of every run. Replay routes, compare runs side by side, and log your mountain memories.',image:'yuki_tooltip_journal.png',step:0,steps:3,next:'friends'},
 friends:{title:'Add Friends',copy:'Make friends. Connect with skiers and snowboarders. Explore the world together.',image:'yuki_tooltip_friends.png',step:1,steps:3,next:'rewards',back:'journal'},
 rewards:{title:'Challenges & Snowmiles',copy:'Complete daily challenges. Personalize Yuki in the SnowMarket.',image:'yuki_tooltip_challenges.png',step:2,steps:3,back:'friends'}
};

// d47.java:1390–1590; carousel copy and sizing verified against analysis/screens/*-tip.png.
export function renderNativeTip(key:NativeTipKey,asset:(name:string)=>string):string{
 const tip=nativeTips[key];const carousel=tip.steps!==undefined;
 return `<div class="native-tip ${carousel?'nt-carousel':'nt-single'} nt-${key}" data-native-tip="${key}"><section class="nt-card" role="dialog" aria-modal="true" aria-labelledby="nt-title"><img class="nt-art" src="${asset(tip.image)}" alt=""><h2 id="nt-title">${tip.title}</h2><p>${tip.copy}</p>${carousel?`<div class="nt-dots" aria-label="Step ${(tip.step||0)+1} of ${tip.steps}">${Array.from({length:tip.steps!},(_,i)=>`<span class="${i===tip.step?'nt-dot-active':''}"></span>`).join('')}</div>`:''}<div class="nt-actions">${tip.back?`<button class="nt-back" data-action="tip-dismiss" data-tip-key="${key}" data-tip-next="${tip.back}">Back</button>`:''}<button class="nt-next" data-action="tip-dismiss" data-tip-key="${key}" ${tip.next?`data-tip-next="${tip.next}"`:''}>${carousel?(tip.next?'Next':"Let's Go!"):'Got it'}</button></div>${!carousel?`<label class="nt-never"><input type="checkbox" data-tip-never><span aria-hidden="true"></span>Don't show this again</label>`:''}</section></div>`;
}
