/* MUZIK first-run guide that works WITHOUT READING: voice, a giant pointing hand, sound, and heavy focus.
   During a step only the target (and the big ✕) can be clicked; everything else is blocked. */
(()=>{
"use strict";
const LS={get:k=>{try{return localStorage.getItem(k);}catch(e){return null;}},set:(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}}};
const $=id=>document.getElementById(id);
const COLORS=["#ff5a5a","#ff9f40","#ffe066","#7ee07e","#4fd1ff","#7a8cff","#c77dff","#ff6ec7"];
const reduced=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;

const css=`
.ob-dim{position:fixed;z-index:8999;background:rgba(0,0,0,.85);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);pointer-events:auto;cursor:not-allowed}
#ob-hole{position:fixed;z-index:9000;pointer-events:none;border-radius:16px;transition:all .35s ease}
#ob-hole::before{content:"";position:absolute;inset:-12px;border-radius:24px;border:10px solid #ffe600;box-shadow:0 0 0 4px #000,0 0 40px 14px rgba(255,230,0,.9),inset 0 0 0 4px #000;animation:obPulse 1.1s ease-in-out infinite}
@keyframes obPulse{0%,100%{transform:scale(1);opacity:.8}50%{transform:scale(1.05);opacity:1}}
#ob-hand{position:fixed;z-index:9003;pointer-events:none;font-size:104px;line-height:1;left:0;top:0;filter:drop-shadow(0 0 14px #fff) drop-shadow(0 0 26px #ffe600);transition:transform .8s cubic-bezier(.3,1.4,.5,1)}
#ob-hand span{display:block;animation:obTap 1.2s ease-in-out infinite;transform-origin:20% 0}
@keyframes obTap{0%,100%{transform:translateY(0) scale(1)}40%{transform:translateY(-26px) scale(1.05)}55%{transform:translateY(6px) scale(.88)}70%{transform:translateY(0) scale(1)}}
#ob-ripple{position:fixed;z-index:9002;pointer-events:none;width:60px;height:60px;margin:-30px 0 0 -30px;border-radius:50%;border:6px solid #fff;animation:obRip 1.2s ease-out infinite}
@keyframes obRip{0%,50%{opacity:0;transform:scale(.3)}56%{opacity:1}100%{opacity:0;transform:scale(2.2)}}
#ob-icon{position:fixed;z-index:9002;pointer-events:none;font-size:84px;line-height:1;filter:drop-shadow(0 0 12px rgba(255,255,255,.8))}
#ob-dots{position:fixed;z-index:9004;left:50%;bottom:18px;transform:translateX(-50%);display:flex;gap:16px;pointer-events:none}
#ob-dots i{width:28px;height:28px;border-radius:50%;background:#555;border:4px solid #fff;display:block}
#ob-dots i.on{background:#ffe600;transform:scale(1.4);box-shadow:0 0 18px #ffe600}#ob-dots i.done{background:#3ddc5a}
.ob-big{position:fixed;z-index:9005;width:84px;height:84px;border-radius:50%;border:6px solid #fff;font:900 46px/1 system-ui;display:flex;align-items:center;justify-content:center;padding:0;cursor:pointer;box-shadow:0 0 0 4px #000,0 6px 20px rgba(0,0,0,.6)}
#ob-x{top:14px;right:14px;background:#e02020;color:#fff}
#ob-spk{top:14px;left:14px;background:#2a7bff;color:#fff;font-size:42px}
#ob-spk.off{background:#555}
#ob-scrim{position:fixed;inset:0;z-index:9001;background:rgba(0,0,0,.85);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
#ob-play{position:fixed;z-index:9002;left:50%;top:50%;width:min(300px,70vmin);height:min(300px,70vmin);margin:calc(min(300px,70vmin)/-2) 0 0 calc(min(300px,70vmin)/-2);border-radius:50%;background:#3ddc5a;border:12px solid #fff;color:#fff;font:900 min(150px,35vmin)/1 system-ui;cursor:pointer;box-shadow:0 0 0 6px #000,0 0 60px 20px rgba(61,220,90,.7);animation:obPulse 1.3s ease-in-out infinite;padding:0 0 0 .15em}
#ob-play .s{position:absolute;right:-6px;top:-6px;font-size:64px;background:#2a7bff;border:5px solid #fff;border-radius:50%;width:96px;height:96px;display:flex;align-items:center;justify-content:center;padding:0}
#ob-burst{position:fixed;z-index:9002;pointer-events:none;border-radius:50%;width:40px;height:40px;margin:-20px 0 0 -20px;animation:obBurst .7s ease-out forwards}
@keyframes obBurst{from{opacity:1;transform:scale(.2)}to{opacity:0;transform:scale(9)}}
.ob-spark{position:fixed;z-index:9006;pointer-events:none;font:900 34px system-ui;animation:obFly 1.3s ease-out forwards}
@keyframes obFly{from{opacity:1;transform:translate(0,0) scale(.6) rotate(0)}to{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1.4) rotate(var(--r))}}
#ob-yay{position:fixed;z-index:9002;left:50%;top:50%;transform:translate(-50%,-50%);font-size:min(200px,45vmin);pointer-events:none;animation:obPulse 1s ease-in-out infinite}
.ob-nudge{position:relative;z-index:50;animation:obNudge 1s ease-in-out 5!important;border-radius:12px}
@keyframes obNudge{0%,100%{box-shadow:0 0 0 0 rgba(255,230,0,0)}50%{box-shadow:0 0 0 12px rgba(255,230,0,.95),0 0 40px 10px rgba(255,230,0,.7)}}
@media (prefers-reduced-motion: reduce){#ob-hole,#ob-hand{transition:none!important}#ob-hand span,#ob-ripple,.ob-nudge,#ob-play,#ob-yay{animation:none!important}#ob-hole::before{animation:none!important;opacity:1}.ob-spark,#ob-burst{display:none}}
`;
const st=document.createElement("style"); st.textContent=css; document.head.appendChild(st);

/* ---- voice ---- */
const speechOK=()=>"speechSynthesis" in window && typeof SpeechSynthesisUtterance!=="undefined";
const voiceOn=()=>LS.get("muzik.voice")!=="off";
function say(text){
  if(!speechOK()||!voiceOn()) return;
  try{ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.rate=.9; u.pitch=1.15; u.volume=1; speechSynthesis.speak(u);}catch(e){}
}
/* ---- own little synth for chimes / demos (separate from the app's audio) ---- */
let ac=null;
function ctx(){ try{ if(!ac){const A=window.AudioContext||window.webkitAudioContext; if(!A) return null; ac=new A();} if(ac.state==="suspended") ac.resume(); return ac;}catch(e){return null;} }
function tone(f,t0,dur,type,vol){const c=ctx(); if(!c) return; const o=c.createOscillator(), g=c.createGain(), t=c.currentTime+t0;
  o.type=type||"sine"; o.frequency.value=f; g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol||.18,t+.02); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t+dur+.05);}
function drum(){const c=ctx(); if(!c) return; const o=c.createOscillator(), g=c.createGain(), t=c.currentTime;
  o.frequency.setValueAtTime(150,t); o.frequency.exponentialRampToValueAtTime(45,t+.25); g.gain.setValueAtTime(.5,t); g.gain.exponentialRampToValueAtTime(0.0001,t+.3);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t+.35);}
const chime=()=>{tone(784,0,.35,"triangle");tone(1175,.09,.45,"triangle");};
const softChime=()=>{tone(660,0,.5,"sine",.08);tone(990,.15,.6,"sine",.06);};
const melody=()=>[523,659,784,1047,784,1047].forEach((f,i)=>tone(f,i*.14,i===5?.7:.25,"triangle",.16));

const cardCount=()=>document.querySelectorAll("#desk .card:not(.pending)").length;
const STEPS=[
 {el:()=>$("keys"), aim:()=>document.querySelector("#keys .home-row .cell")||document.querySelector("#keys .cell"), icon:"🎨", say:"Tap a color.", demo:()=>tone(523,0,.5,"triangle"), on:{down:e=>e.target.closest("#keys .cell")}},
 {el:()=>$("piano"), icon:"🎹", say:"Now play the piano. Three keys.", demo:()=>[392,494,587].forEach((f,i)=>tone(f,i*.22,.4,"triangle")), need:3, on:{down:e=>e.target.closest("#piano")}},
 {el:()=>document.querySelector(".pad-group.drums")||$("mash"), aim:()=>document.querySelector('[data-drum="kick"]'), icon:"🥁", say:"Hit a drum.", demo:drum, on:{down:e=>e.target.closest("[data-drum]")}},
 {el:()=>document.querySelector(".side")||$("tones"), aim:()=>document.querySelector("#tones button:not(.on)"), icon:"🎤", say:"Pick a new sound.", demo:()=>tone(880,0,.4,"square",.07), on:{down:e=>{const b=e.target.closest("#tones button,[data-noise]"); return b&&!b.classList.contains("on");}}},
 {el:()=>$("rec"), icon:"🔴", say:"Press the red button to record.", sayOn:"Make some sound! Then press red again to stop.", recStep:true},
 {el:()=>$("previewTake"), icon:"👂", say:"Now listen. Press the speaker.", on:{click:e=>e.target.closest("#previewTake")}},
 {el:()=>$("captureLast"), icon:"✅", say:"Press the check to keep it.", keepStep:true},
];
const CHEERS=["Yay!","Nice!","Wow!","Great!","Yay!","Lovely!","Yay!"];
let step=-1, count=0, recOn=false, active=false, keepBase=0, keepTimer=0, repeatT=0, handPos=null;

function el(tag,attrs,html){const e=document.createElement(tag);Object.assign(e,attrs||{});if(html!=null)e.innerHTML=html;return e;}
function clean(keepChrome){["ob-hole","ob-hand","ob-ripple","ob-icon","ob-dots","ob-scrim","ob-play","ob-yay"].concat(keepChrome?[]:["ob-x","ob-spk"]).forEach(id=>{const e=$(id);if(e)e.remove();});
  document.querySelectorAll(".ob-dim").forEach(d=>d.remove()); clearTimeout(repeatT);}
function end(done){active=false;step=-1;clearInterval(keepTimer);clean(true);LS.set("muzik.onboarded","1");if(done)celebrate();else{clean();try{speechSynthesis.cancel();}catch(e){}}}
function chrome(){
  if(!$("ob-x")){const x=el("button",{id:"ob-x",className:"ob-big",type:"button"},"✕"); x.setAttribute("aria-label","Close tour"); x.onclick=e=>{e.stopPropagation();end(false);}; document.body.appendChild(x);}
  if(!$("ob-spk")){const s=el("button",{id:"ob-spk",className:"ob-big",type:"button"}); s.onclick=e=>{e.stopPropagation();LS.set("muzik.voice",voiceOn()?"off":"on");syncSpk();if(voiceOn())say(step>=0?STEPS[step].say:"Voice on.");else try{speechSynthesis.cancel();}catch(_){}}; document.body.appendChild(s);}
  syncSpk();
}
function syncSpk(){const s=$("ob-spk"); if(!s) return; s.textContent=voiceOn()?"🔊":"🔇"; s.classList.toggle("off",!voiceOn()); s.setAttribute("aria-label",voiceOn()?"Voice on":"Voice off"); s.style.display=speechOK()?"":"none";}

function welcome(){
  clean(); active=true; step=-1;
  document.body.appendChild(el("div",{id:"ob-scrim"}));
  const p=el("button",{id:"ob-play",type:"button"},`▶<span class="s">🔊</span>`); p.setAttribute("aria-label","Play the tour");
  p.onclick=e=>{e.stopPropagation();chime();go(0);};
  document.body.appendChild(p); chrome(); p.focus();
  const cue=()=>{say("Hi! Let's make music. Tap the big button.");softChime();};
  cue(); const again=()=>{repeatT=setTimeout(()=>{if(active&&step===-1&&$("ob-play")){cue();again();}},6000);}; again();
}
function go(i){
  clean(true); step=i; count=0; recOn=false; active=true;
  if(i>=STEPS.length){end(true);return;}
  const s=STEPS[i]; if(s.keepStep) keepBase=cardCount();
  const target=s.el(); if(target&&target.scrollIntoView) target.scrollIntoView({block:"nearest"});
  document.body.appendChild(el("div",{id:"ob-hole"}));
  for(let k=0;k<4;k++){const d=el("div",{className:"ob-dim"}); ["pointerdown","mousedown","touchstart","click","pointerup","mouseup","dblclick","contextmenu"].forEach(t=>d.addEventListener(t,blockEv,true)); document.body.appendChild(d);}
  document.body.appendChild(el("div",{id:"ob-icon"},s.icon));
  document.body.appendChild(el("div",{id:"ob-ripple"}));
  const h=el("div",{id:"ob-hand"},"<span>👆</span>"); h.setAttribute("aria-hidden","true"); document.body.appendChild(h);
  if(handPos&&!reduced()) h.style.transform=`translate(${handPos[0]}px,${handPos[1]}px)`; else h.style.transform=`translate(${innerWidth/2-50}px,${innerHeight/2}px)`;
  const dots=el("div",{id:"ob-dots"},STEPS.map((_,k)=>`<i class="${k<i?"done":k===i?"on":""}"></i>`).join("")); dots.setAttribute("aria-label",`Step ${i+1} of ${STEPS.length}`); document.body.appendChild(dots);
  chrome(); requestAnimationFrame(place);
  cue(true);
}
function blockEv(e){ e.stopPropagation(); e.preventDefault(); if(e.type==="pointerdown"&&step>=0){ softChime(); cue(false); } }
function cue(first){
  clearTimeout(repeatT); if(step<0) return; const s=STEPS[step];
  say(recOn?s.sayOn:s.say);
  if(first&&s.demo) setTimeout(()=>{ if(step>=0&&STEPS[step]===s) try{s.demo();}catch(e){} },700);
  const h=$("ob-hand"); if(h&&!reduced()){h.firstElementChild.style.animation="none"; void h.offsetWidth; h.firstElementChild.style.animation="";}
  const my=step; repeatT=setTimeout(()=>{ if(active&&step===my) cue(false); },6000);
}
function place(){
  if(step<0) return; const hole=$("ob-hole"); if(!hole) return;
  const s=STEPS[step], t=s.el(); if(!t) return;
  const r=t.getBoundingClientRect(), pad=8, W=innerWidth, H=innerHeight;
  const x=Math.max(2,r.left-pad), y=Math.max(2,r.top-pad), x2=Math.min(W-2,r.right+pad), y2=Math.min(H-2,r.bottom+pad);
  Object.assign(hole.style,{left:x+"px",top:y+"px",width:Math.max(0,x2-x)+"px",height:Math.max(0,y2-y)+"px"});
  const d=document.querySelectorAll(".ob-dim"), px=v=>v+"px";
  if(d.length===4){
    Object.assign(d[0].style,{left:"0",top:"0",width:"100vw",height:px(y)});
    Object.assign(d[1].style,{left:"0",top:px(y2),width:"100vw",bottom:"0"});
    Object.assign(d[2].style,{left:"0",top:px(y),width:px(x),height:px(y2-y)});
    Object.assign(d[3].style,{left:px(x2),top:px(y),right:"0",height:px(y2-y)});
  }
  const a=(s.aim&&s.aim())||t, ar=a.getBoundingClientRect();
  const ax=Math.min(Math.max(ar.left+ar.width/2,10),W-10), ay=Math.min(Math.max(ar.top+ar.height/2,10),H-10);
  const hx=Math.min(ax-28,W-110), hy=Math.min(ay-12,H-115); // fingertip ~ top-left of glyph
  const h=$("ob-hand"); if(h){h.style.transform=`translate(${hx}px,${hy}px)`; handPos=[hx,hy];}
  const rp=$("ob-ripple"); if(rp){rp.style.left=ax+"px"; rp.style.top=ay+"px";}
  const ic=$("ob-icon"); if(ic){ if(y>100){ic.style.left=Math.min(Math.max(8,(x+x2)/2-42),W-100)+"px"; ic.style.top=(y-98)+"px";} else if(W-x2>110){ic.style.left=(x2+16)+"px"; ic.style.top=Math.max(100,y)+"px";} else {ic.style.left=Math.max(8,x-110)+"px"; ic.style.top=Math.max(100,y)+"px";} }
}
function sparkle(x,y,n){
  if(reduced()) return;
  const glyphs=["✦","♪","♫","★","●","🎉"];
  for(let k=0;k<n;k++){
    const s=el("div",{className:"ob-spark"},glyphs[k%glyphs.length]);
    const a=Math.random()*Math.PI*2, dd=60+Math.random()*(n>20?380:120);
    s.style.cssText=`left:${x}px;top:${y}px;color:${COLORS[k%COLORS.length]};--dx:${Math.cos(a)*dd}px;--dy:${Math.sin(a)*dd}px;--r:${(Math.random()*360)|0}deg`;
    document.body.appendChild(s); setTimeout(()=>s.remove(),1400);
  }
}
function burst(x,y,c){ if(reduced()) return; const b=el("div",{id:"ob-burst"}); b.style.cssText=`left:${x}px;top:${y}px;background:radial-gradient(circle,${c},transparent 70%)`; document.body.appendChild(b); setTimeout(()=>b.remove(),750); }
function advance(){
  const hole=$("ob-hole"), r=hole&&hole.getBoundingClientRect();
  if(r){ const cx=r.left+r.width/2, cy=r.top+r.height/2; burst(cx,cy,COLORS[step%COLORS.length]); sparkle(cx,cy,16); }
  chime(); say(CHEERS[step%CHEERS.length]);
  const ic=$("ob-icon"); if(ic) ic.textContent="⭐";
  const next=step+1; step=-2; clearTimeout(repeatT); setTimeout(()=>go(next), reduced()?700:1100);
}
function celebrate(){
  clean(true); chrome();
  document.body.appendChild(el("div",{id:"ob-scrim"}));
  const y=el("div",{id:"ob-yay"},"🎉"); y.setAttribute("aria-label","You made a song!"); document.body.appendChild(y);
  melody(); say("Yay! You made a song!");
  sparkle(innerWidth/2,innerHeight/2,50); setTimeout(()=>sparkle(innerWidth/3,innerHeight/3,30),300); setTimeout(()=>sparkle(innerWidth*2/3,innerHeight/3,30),550);
  const close=()=>{clean();}; $("ob-scrim").onclick=close; y.style.pointerEvents="none";
  setTimeout(close,4500);
}

// Real-event detection (capture phase; blocked areas never reach here because dims stop them first on their own target).
addEventListener("pointerdown",e=>{
  touched(e);
  if(!active||step<0) return; const s=STEPS[step];
  if(s.on&&s.on.down&&s.on.down(e)){ if(++count>=(s.need||1)) advance(); else { tone(660+count*120,0,.15,"triangle",.08); cue(false);} }
},true);
addEventListener("click",e=>{
  if(!active||step<0) return; const s=STEPS[step];
  if(s.on&&s.on.click&&s.on.click(e)) advance();
  if(s.recStep&&e.target.closest("#rec")){
    if(!recOn){recOn=true; tone(880,0,.2,"triangle",.1); cue(false);}
    else advance();
  }
  if(s.keepStep&&e.target.closest("#captureLast")){
    clearInterval(keepTimer); let n=0;
    keepTimer=setInterval(()=>{ n++; if(step<0){clearInterval(keepTimer);return;}
      if(cardCount()>keepBase){clearInterval(keepTimer);const d=$("desk").lastElementChild;if(d){const b=d.getBoundingClientRect();sparkle(b.left+60,b.top+14,14);}advance();}
      else if(n>12){clearInterval(keepTimer); say("Play a few notes, then press the check again."); softChime();}
    },100);
  }
},true);
addEventListener("keydown",e=>{ if(e.key==="Escape"&&(active||$("ob-yay"))){ end(false); return; } idleReset(); },true);
addEventListener("resize",place); addEventListener("scroll",place,true);
setInterval(()=>{ if(active&&step>=0) place(); },500);

// ---- idle nudges (first 3 sessions, Hints toggle): soft chime + giant hand ----
const sessions=(Number(LS.get("muzik.sessions"))||0)+1; LS.set("muzik.sessions",String(sessions));
const nudgesOn=()=>LS.get("muzik.nudges")!=="off" && sessions<=3;
const NUDGE=[["keys","#keys .cell","🎨","Tap a color."],["piano","#piano","🎹","Play the piano."],["drum","[data-drum]","🥁","Hit a drum."],["tones","#tones button,[data-noise]","🎤","Pick a new sound."],["rec","#rec","🔴","Press red to record."],["play","#play","▶","Press play."]];
const used=new Set(); let idleT=0, nudged=null, nHand=null;
function touched(e){ NUDGE.forEach(([k,sel])=>{ if(e.target.closest&&e.target.closest(sel)) used.add(k); }); idleReset(); }
function unNudge(){ if(nudged){nudged.classList.remove("ob-nudge");nudged=null;} if(nHand){nHand.remove();nHand=null;} }
function idleReset(){ clearTimeout(idleT); unNudge(); if(nudgesOn()) idleT=setTimeout(nudge,8000); }
function nudge(){
  if(active||!nudgesOn()||document.hidden) return idleReset();
  const pick=NUDGE.find(([k])=>!used.has(k)); if(!pick) return;
  const target=document.querySelector(pick[1]==="#keys .cell"?"#keys .home-row .cell":pick[1].split(",")[0]);
  if(!target) return; used.add(pick[0]);
  nudged=target; target.classList.add("ob-nudge");
  const r=target.getBoundingClientRect();
  nHand=el("div",{id:"ob-hand"},"<span>👆</span>"); nHand.setAttribute("aria-hidden","true"); nHand.style.transition="none";
  nHand.style.transform=`translate(${Math.min(r.left+r.width/2-28,innerWidth-110)}px,${Math.min(r.top+r.height/2,innerHeight-115)}px)`;
  document.body.appendChild(nHand);
  softChime(); say(pick[3]);
  setTimeout(()=>{ if(nudged===target) unNudge(); idleReset(); },5000);
}
function syncNudgeBtn(){ const b=$("obNudges"); if(b) b.firstElementChild.textContent=(LS.get("muzik.nudges")==="off"?"💡 Hints: off":"💡 Hints: on"); }

function init(){
  const r=$("obReplay"); if(r){ r.onclick=e=>{e.stopPropagation(); const m=$("setupMenu"); if(m) m.classList.remove("open"); welcome();}; r.firstElementChild.textContent="👆 Show me around"; }
  const n=$("obNudges"); if(n) n.onclick=e=>{e.stopPropagation(); LS.set("muzik.nudges",LS.get("muzik.nudges")==="off"?"on":"off"); syncNudgeBtn(); if(LS.get("muzik.nudges")!=="off") softChime(); idleReset();};
  syncNudgeBtn();
  window.muzikTour={start:welcome,go,end};
  if(!LS.get("muzik.onboarded")) setTimeout(welcome,400); else idleReset();
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
})();
