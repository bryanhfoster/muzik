/* MUZIK first-run guide — no reading, no voice. A soft glowing ring spotlights one control while the
   rest of the screen dims; gentle tones confirm. Tap anywhere outside the ring, or press any key, to skip.
   Shown once (localStorage "muzik.onboarded"). */
(()=>{
"use strict";
const LS={get:k=>{try{return localStorage.getItem(k);}catch(e){return null;}},set:(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}}};
const $=id=>document.getElementById(id);
const reduced=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
const EASE="cubic-bezier(.22,.61,.36,1)";

const css=`
#ob-layer{position:fixed;inset:0;z-index:8998;opacity:0;transition:opacity .45s ${EASE}}
#ob-layer.in{opacity:1}
.ob-catch{position:fixed;z-index:8999;background:transparent;cursor:pointer}
#ob-ring{position:fixed;z-index:9000;pointer-events:none;border-radius:22px;
  box-shadow:0 0 0 200vmax rgba(4,6,12,.8);transition:left .6s ${EASE},top .6s ${EASE},width .6s ${EASE},height .6s ${EASE}}
#ob-ring::before{content:"";position:absolute;inset:-6px;border-radius:26px;border:4px solid rgba(255,255,255,.95);
  box-shadow:0 0 18px 4px rgba(120,200,255,.55),inset 0 0 12px rgba(120,200,255,.35)}
#ob-ring::after{content:"";position:absolute;inset:-6px;border-radius:26px;border:3px solid rgba(140,210,255,.8);
  animation:obRing 2.2s ${EASE} infinite}
@keyframes obRing{0%{opacity:.85;transform:scale(1)}100%{opacity:0;transform:scale(1.18)}}
#ob-dot{position:fixed;z-index:9001;pointer-events:none;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;
  background:radial-gradient(circle,rgba(255,255,255,.95) 0 30%,rgba(140,210,255,.55) 55%,transparent 72%);
  animation:obDot 1.8s ${EASE} infinite;transition:left .6s ${EASE},top .6s ${EASE}}
@keyframes obDot{0%,100%{transform:scale(.8);opacity:.75}50%{transform:scale(1.15);opacity:1}}
#ob-prog{position:fixed;z-index:9002;left:50%;bottom:calc(18px + env(safe-area-inset-bottom));transform:translateX(-50%);display:flex;gap:10px;pointer-events:none}
#ob-prog i{width:10px;height:10px;border-radius:5px;background:rgba(255,255,255,.35);transition:all .4s ${EASE}}
#ob-prog i.on{width:34px;background:#fff}
.ob-nudge{position:relative;z-index:50;animation:obNudge 1.8s ${EASE} 3!important}
@keyframes obNudge{0%,100%{box-shadow:0 0 0 0 rgba(140,210,255,0)}50%{box-shadow:0 0 0 6px rgba(255,255,255,.9),0 0 26px 8px rgba(140,210,255,.6)}}
@media (prefers-reduced-motion: reduce){#ob-layer,#ob-ring,#ob-dot,#ob-prog i{transition:none!important}#ob-ring::after,#ob-dot,.ob-nudge{animation:none!important}}
`;
const st=document.createElement("style"); st.textContent=css; document.head.appendChild(st);

/* soft sine tones only */
let ac=null;
function ctx(){ try{ if(!ac){const A=window.AudioContext||window.webkitAudioContext; if(!A) return null; ac=new A();} if(ac.state==="suspended") ac.resume(); return ac;}catch(e){return null;} }
function tone(f,t0,dur,vol){const c=ctx(); if(!c) return; const o=c.createOscillator(), g=c.createGain(), t=c.currentTime+t0;
  o.type="sine"; o.frequency.value=f; g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol||.06,t+.03); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t+dur+.05);}
const ping=()=>tone(880,0,.35,.045);                       // "look here"
const ok=()=>{tone(660,0,.3,.05);tone(990,.08,.4,.04);};    // step done
const fin=()=>{tone(523,0,.5,.04);tone(784,.12,.6,.035);};  // tour done

const STEPS=[
 {el:()=>$("keys"), aim:()=>document.querySelector("#keys .home-row .cell")||document.querySelector("#keys .cell"), hit:e=>e.target.closest("#keys .cell")},
 {el:()=>$("piano"), hit:e=>e.target.closest("#piano"), need:2},
 {el:()=>document.querySelector(".pad-group.drums")||$("mash"), aim:()=>document.querySelector('[data-drum="kick"]'), hit:e=>e.target.closest("[data-drum]")},
 {el:()=>$("rec"), hit:e=>e.target.closest("#rec")},
];
let step=-1, count=0, active=false, repeatT=0;

function mk(tag,id,cls){const e=document.createElement(tag); if(id) e.id=id; if(cls) e.className=cls; return e;}
function clear(){ const l=$("ob-layer"); if(l) l.remove(); document.querySelectorAll(".ob-catch").forEach(c=>c.remove()); ["ob-ring","ob-dot","ob-prog"].forEach(id=>{const e=$(id); if(e) e.remove();}); clearTimeout(repeatT); }
function end(done){ if(!active&&step<0&&!$("ob-ring")) return; active=false; step=-1; LS.set("muzik.onboarded","1");
  if(done) fin(); const l=$("ob-layer"); [$("ob-ring"),$("ob-dot"),$("ob-prog")].forEach(e=>{if(e){e.style.transition="opacity .4s";e.style.opacity="0";}});
  document.querySelectorAll(".ob-catch").forEach(c=>c.remove()); setTimeout(clear, reduced()?0:420); idleReset(); }

function start(){
  clear(); active=true; step=0;
  const layer=mk("div","ob-layer"); layer.setAttribute("aria-hidden","true"); document.body.appendChild(layer);
  for(let k=0;k<4;k++){const c=mk("div",null,"ob-catch"); c.addEventListener("pointerdown",skip,true); c.addEventListener("click",skip,true); document.body.appendChild(c);}
  layer.appendChild(mk("div","ob-ring")); layer.appendChild(mk("div","ob-dot"));
  const p=mk("div","ob-prog"); p.innerHTML=STEPS.map(()=>"<i></i>").join(""); p.setAttribute("aria-label","Tour"); layer.appendChild(p);
  // move ring/dot/prog to body so fixed stacking is straightforward
  [$("ob-ring"),$("ob-dot"),$("ob-prog")].forEach(e=>document.body.appendChild(e));
  requestAnimationFrame(()=>layer.classList.add("in"));
  go(0);
}
function skip(e){ e.stopPropagation(); e.preventDefault(); end(false); }
function go(i){
  if(i>=STEPS.length){ end(true); return; }
  step=i; count=0;
  const t=STEPS[i].el(); if(t&&t.scrollIntoView) t.scrollIntoView({block:"nearest",behavior:reduced()?"auto":"smooth"});
  document.querySelectorAll("#ob-prog i").forEach((d,k)=>d.classList.toggle("on",k===i));
  place(); cue();
}
function cue(){ clearTimeout(repeatT); if(!active) return; ping(); const my=step; repeatT=setTimeout(()=>{ if(active&&step===my) cue(); },9000); }
function place(){
  if(!active||step<0) return; const ring=$("ob-ring"); if(!ring) return;
  const s=STEPS[step], t=s.el(); if(!t) return;
  const r=t.getBoundingClientRect(), pad=8, W=innerWidth, H=innerHeight;
  const x=Math.max(4,r.left-pad), y=Math.max(4,r.top-pad), x2=Math.min(W-4,r.right+pad), y2=Math.min(H-4,r.bottom+pad);
  Object.assign(ring.style,{left:x+"px",top:y+"px",width:Math.max(0,x2-x)+"px",height:Math.max(0,y2-y)+"px"});
  const c=document.querySelectorAll(".ob-catch"), px=v=>v+"px";
  if(c.length===4){
    Object.assign(c[0].style,{left:"0",top:"0",width:"100vw",height:px(y)});
    Object.assign(c[1].style,{left:"0",top:px(y2),width:"100vw",bottom:"0"});
    Object.assign(c[2].style,{left:"0",top:px(y),width:px(x),height:px(y2-y)});
    Object.assign(c[3].style,{left:px(x2),top:px(y),right:"0",height:px(y2-y)});
  }
  const pg=$("ob-prog"); if(pg){ const low=(y+y2)/2>H/2; pg.style.top=low?"calc(18px + env(safe-area-inset-top))":"auto"; pg.style.bottom=low?"auto":"calc(18px + env(safe-area-inset-bottom))"; }
  const a=(s.aim&&s.aim())||t, ar=a.getBoundingClientRect(), d=$("ob-dot");
  if(d){ d.style.left=Math.min(Math.max(ar.left+ar.width/2,24),W-24)+"px"; d.style.top=Math.min(Math.max(ar.top+ar.height/2,24),H-24)+"px"; }
}

addEventListener("pointerdown",e=>{
  touched(e);
  if(!active||step<0) return; const s=STEPS[step];
  if(s.hit(e)){ if(++count>=(s.need||1)){ ok(); const n=step+1; step=-2; clearTimeout(repeatT); setTimeout(()=>{ if(active) go(n); }, reduced()?150:550); } }
},true);
const onKey=e=>{ if(active){ e.stopImmediatePropagation(); e.preventDefault(); end(false); return; } idleReset(); };
if("__obKey" in window||document.querySelector("script:not([src])")&&/__obKey/.test(document.head.innerHTML)) window.__obKey=onKey; else addEventListener("keydown",onKey,true);
addEventListener("resize",place); addEventListener("scroll",place,true);
setInterval(()=>{ if(active&&step>=0) place(); },500);

// ---- idle nudges (first 3 sessions, Hints toggle): soft glow on an unused control ----
const sessions=(Number(LS.get("muzik.sessions"))||0)+1; LS.set("muzik.sessions",String(sessions));
const nudgesOn=()=>LS.get("muzik.nudges")!=="off" && sessions<=3;
const NUDGE=[["keys","#keys .cell"],["piano","#piano"],["drum","[data-drum]"],["tones","#tones button,[data-noise]"],["rec","#rec"],["play","#play"]];
const used=new Set(); let idleT=0, nudged=null;
function touched(e){ NUDGE.forEach(([k,sel])=>{ if(e.target.closest&&e.target.closest(sel)) used.add(k); }); idleReset(); }
function unNudge(){ if(nudged){nudged.classList.remove("ob-nudge");nudged=null;} }
function idleReset(){ clearTimeout(idleT); unNudge(); if(nudgesOn()) idleT=setTimeout(nudge,10000); }
function nudge(){
  if(active||!nudgesOn()||document.hidden) return idleReset();
  const pick=NUDGE.find(([k])=>!used.has(k)); if(!pick) return;
  const target=document.querySelector(pick[1]==="#keys .cell"?"#keys .home-row .cell":pick[1].split(",")[0]);
  if(!target) return; used.add(pick[0]);
  nudged=target; target.classList.add("ob-nudge"); ping();
  setTimeout(()=>{ if(nudged===target) unNudge(); idleReset(); },5500);
}
function syncNudgeBtn(){ const b=$("obNudges"); if(!b) return; const on=LS.get("muzik.nudges")!=="off"; b.classList.toggle("off", !on); b.title=on?"Hints on":"Hints off"; const lb=b.querySelector(".tlb"); if(lb) lb.textContent="Hints"; }

function init(){
  const r=$("obReplay"); if(r){ r.onclick=e=>{e.stopPropagation(); if(window.muzikCloseMenu) window.muzikCloseMenu(); else { const m=$("setupMenu"); if(m) m.classList.remove("open"); } setTimeout(start,50);}; }
  const n=$("obNudges"); if(n) n.onclick=e=>{e.stopPropagation(); LS.set("muzik.nudges", LS.get("muzik.nudges")==="off"?"on":"off"); syncNudgeBtn(); if(LS.get("muzik.nudges")!=="off") ping(); idleReset();};
  syncNudgeBtn();
  window.muzikTour={start,go,end};
  if(!LS.get("muzik.onboarded")) setTimeout(start,600); else idleReset();
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
})();
