/* MUZIK first-run guide + idle nudges. Self-contained; never captures clicks on the app. */
(()=>{
"use strict";
const LS={get:k=>{try{return localStorage.getItem(k);}catch(e){return null;}},set:(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}}};
const $=id=>document.getElementById(id);
const COLORS=["#ff5a5a","#ff9f40","#ffe066","#7ee07e","#4fd1ff","#7a8cff","#c77dff","#ff6ec7"];
const reduced=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;

const css=`
#ob-hole{position:fixed;z-index:9000;pointer-events:none;border-radius:14px;transition:all .35s ease;}
.ob-dim{position:fixed;z-index:8999;pointer-events:none;background:rgba(8,6,4,.62);}
#ob-hole::after{content:"";position:absolute;inset:-6px;border-radius:18px;border:3px solid #ffe066;box-shadow:0 0 18px 4px rgba(255,224,102,.7);animation:obPulse 1.4s ease-in-out infinite;}
@keyframes obPulse{0%,100%{opacity:.55;transform:scale(1)}50%{opacity:1;transform:scale(1.03)}}
#ob-bubble,#ob-welcome{position:fixed;z-index:9002;background:#fffaf0;color:#2a1f10;border:3px solid #ffe066;border-radius:20px;box-shadow:0 10px 30px rgba(0,0,0,.45);font:600 17px/1.4 system-ui,sans-serif;padding:16px 18px 12px;max-width:min(340px,calc(100vw - 24px));box-sizing:border-box;}
#ob-bubble .t{font-size:20px;font-weight:900;margin:0 0 4px}
#ob-bubble .p{margin:0 0 10px}
#ob-bubble .row{display:flex;align-items:center;justify-content:space-between;gap:10px}
.ob-dots{display:flex;gap:6px}.ob-dots i{width:10px;height:10px;border-radius:50%;background:#e6dcc6;display:block}
.ob-dots i.on{background:#ffb300;transform:scale(1.25)}.ob-dots i.done{background:#7ec97e}
.ob-link{background:none;border:0;color:#8a6d3b;font:600 15px system-ui;text-decoration:underline;padding:4px}
.ob-x{position:absolute;top:6px;right:8px;background:none;border:0;font:900 22px system-ui;color:#8a6d3b;padding:2px 6px}
#ob-welcome{left:50%;top:50%;transform:translate(-50%,-50%);text-align:center;max-width:min(400px,calc(100vw - 24px));padding:26px 24px 20px}
#ob-welcome h2{font:900 30px/1.15 system-ui;margin:4px 0 8px}
#ob-welcome p{margin:0 0 18px}
.ob-btn{font:900 18px system-ui;border-radius:999px;padding:10px 22px;border:3px solid #2a1f10;background:#ffe066;color:#2a1f10;margin:0 6px}
.ob-btn.alt{background:#fff;border-color:#c9b98f}
#ob-scrim{position:fixed;inset:0;z-index:9001;background:rgba(8,6,4,.55)}
.ob-spark{position:fixed;z-index:9003;pointer-events:none;font:900 22px system-ui;animation:obFly .9s ease-out forwards}
@keyframes obFly{from{opacity:1;transform:translate(0,0) scale(.6) rotate(0)}to{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1.2) rotate(var(--r))}}
.ob-nudge{animation:obNudge 1.6s ease-in-out 3!important;border-radius:10px}
@keyframes obNudge{0%,100%{box-shadow:0 0 0 0 rgba(255,224,102,0)}50%{box-shadow:0 0 0 5px rgba(255,224,102,.75)}}
@media (prefers-reduced-motion: reduce){#ob-hole,#ob-hole::after,.ob-nudge{animation:none!important;transition:none!important}.ob-spark{display:none}}
`;
const st=document.createElement("style"); st.textContent=css; document.head.appendChild(st);

const cardCount=()=>document.querySelectorAll("#desk .card:not(.pending)").length;
const STEPS=[
 {el:()=>$("keys"), t:"Tap a color!", p:"Every color is a note. Tap any square in the rainbow and listen.", on:{down:e=>e.target.closest("#keys .cell")}},
 {el:()=>$("piano"), t:"Tickle the piano", p:"Play 3 keys, any keys. There are no wrong notes here!", need:3, on:{down:e=>e.target.closest("#piano")}},
 {el:()=>document.querySelector(".pad-group.drums")||$("mash"), t:"Boom! Hit a drum", p:"Kick, clap, cowbell... pick your favorite thump.", on:{down:e=>e.target.closest("[data-drum]")}},
 {el:()=>document.querySelector(".side")||$("tones"), t:"Change your voice", p:"Tap a different sound chip. Try a bell, a flute, or some fuzzy noise!", on:{down:e=>{const b=e.target.closest("#tones button,[data-noise]"); return b&&!b.classList.contains("on");}}},
 {el:()=>$("rec"), t:"Let's record!", p:"Press REC, sing or play something, then press REC again to stop.", recStep:true},
 {el:()=>$("previewTake"), t:"Hear yourself", p:"Press HEAR to play back what you just made.", on:{click:e=>e.target.closest("#previewTake")}},
 {el:()=>$("captureLast"), t:"Keep it!", p:"Press KEEP and watch your music land on the timeline.", keepStep:true},
];
let step=-1, count=0, recOn=false, hole, bubble, active=false, keepBase=0, keepTimer=0;

function el(tag,attrs,html){const e=document.createElement(tag);Object.assign(e,attrs||{});if(html!=null)e.innerHTML=html;return e;}
function clean(){["ob-hole","ob-bubble","ob-welcome","ob-scrim"].forEach(id=>{const e=$(id);if(e)e.remove();});document.querySelectorAll(".ob-dim").forEach(d=>d.remove());hole=bubble=null;}
function end(done){active=false;step=-1;clearInterval(keepTimer);clean();LS.set("muzik.onboarded","1");if(done)celebrate();}

function welcome(){
  clean(); active=true;
  document.body.appendChild(el("div",{id:"ob-scrim"}));
  const w=el("div",{id:"ob-welcome"},`<div style="font-size:34px">🎵🥁🎹</div><h2>Let's make some noise!</h2><p>Want a quick tour? It's 7 tiny steps, and you'll make a song by the end.</p><button class="ob-btn" id="obStart">Start</button><button class="ob-btn alt" id="obSkip">Skip</button>`);
  w.setAttribute("role","dialog"); w.setAttribute("aria-label","Welcome to MUZIK");
  document.body.appendChild(w);
  $("obStart").onclick=e=>{e.stopPropagation();go(0);};
  $("obSkip").onclick=e=>{e.stopPropagation();end(false);};
  $("obStart").focus();
}
function go(i){
  clean(); step=i; count=0; recOn=false; active=true;
  if(i>=STEPS.length){end(true);return;}
  const s=STEPS[i]; if(s.keepStep) keepBase=cardCount();
  const target=s.el(); if(target&&target.scrollIntoView) target.scrollIntoView({block:"nearest"});
  hole=el("div",{id:"ob-hole"}); document.body.appendChild(hole);
  for(let k=0;k<4;k++) document.body.appendChild(el("div",{className:"ob-dim"}));
  bubble=el("div",{id:"ob-bubble"}); bubble.setAttribute("role","dialog"); bubble.setAttribute("aria-live","polite");
  const dots=STEPS.map((_,k)=>`<i class="${k<i?"done":k===i?"on":""}"></i>`).join("");
  bubble.innerHTML=`<button class="ob-x" aria-label="Close tour">×</button><div class="t">${s.t}</div><div class="p">${s.p}</div><div class="row"><div class="ob-dots" aria-label="Step ${i+1} of ${STEPS.length}">${dots}</div><button class="ob-link">skip step</button></div>`;
  document.body.appendChild(bubble);
  bubble.querySelector(".ob-x").onclick=e=>{e.stopPropagation();end(false);};
  bubble.querySelector(".ob-link").onclick=e=>{e.stopPropagation();go(step+1);};
  place();
}
function place(){
  if(step<0||!hole||!bubble) return;
  const t=STEPS[step].el(); if(!t) return;
  const r=t.getBoundingClientRect(), pad=6, W=innerWidth, H=innerHeight;
  const x=Math.max(2,r.left-pad), y=Math.max(2,r.top-pad), x2=Math.min(W-2,r.right+pad), y2=Math.min(H-2,r.bottom+pad);
  Object.assign(hole.style,{left:x+"px",top:y+"px",width:Math.max(0,x2-x)+"px",height:Math.max(0,y2-y)+"px"});
  const d=document.querySelectorAll(".ob-dim"), px=v=>v+"px";
  if(d.length===4){
    Object.assign(d[0].style,{left:"0",top:"0",width:"100vw",height:px(y)});
    Object.assign(d[1].style,{left:"0",top:px(y2),width:"100vw",bottom:"0"});
    Object.assign(d[2].style,{left:"0",top:px(y),width:px(x),height:px(y2-y)});
    Object.assign(d[3].style,{left:px(x2),top:px(y),right:"0",height:px(y2-y)});
  }
  const bw=bubble.offsetWidth, bh=bubble.offsetHeight, m=12;
  let by = (H-y2>=bh+m*2) ? y2+m : (y>=bh+m*2) ? y-bh-m : Math.max(m,H-bh-m);
  let bx = Math.min(Math.max(m,(x+x2)/2-bw/2), W-bw-m);
  // big target covering most of the screen: tuck bubble into a corner it overlaps least
  bubble.style.left=bx+"px"; bubble.style.top=Math.max(m,Math.min(by,H-bh-m))+"px";
}
function sparkle(x,y,n){
  if(reduced()) return;
  const glyphs=["✦","♪","♫","★","●"];
  for(let k=0;k<n;k++){
    const s=el("div",{className:"ob-spark"},glyphs[k%glyphs.length]);
    const a=Math.random()*Math.PI*2, d=40+Math.random()*(n>20?260:60);
    s.style.cssText=`left:${x}px;top:${y}px;color:${COLORS[k%COLORS.length]};--dx:${Math.cos(a)*d}px;--dy:${Math.sin(a)*d}px;--r:${(Math.random()*360)|0}deg`;
    document.body.appendChild(s); setTimeout(()=>s.remove(),1000);
  }
}
function advance(){
  const r=hole&&hole.getBoundingClientRect();
  if(r) sparkle(r.left+r.width/2,r.top+r.height/2,10);
  const cheers=["Yes!","Lovely!","Ooh, nice!","You're a natural!","Bravo!","So good!","Wow!"];
  if(bubble){bubble.querySelector(".t").textContent=cheers[step%cheers.length]+" ✨";bubble.querySelector(".p").textContent="";}
  const next=step+1; step=-2; setTimeout(()=>go(next), reduced()?150:650);
}
function celebrate(){
  clean();
  document.body.appendChild(el("div",{id:"ob-scrim"}));
  const w=el("div",{id:"ob-welcome"},`<div style="font-size:34px">🎉🎶🎉</div><h2>You made a song!</h2><p>That's the whole flow: play, record, hear, keep. Now go wild! (Replay this anytime from MORE → Show me around.)</p><button class="ob-btn" id="obDone">Let's play!</button>`);
  w.setAttribute("role","dialog"); document.body.appendChild(w);
  const close=()=>clean(); $("obDone").onclick=e=>{e.stopPropagation();close();};
  sparkle(innerWidth/2,innerHeight/2,48); setTimeout(()=>sparkle(innerWidth/3,innerHeight/3,24),250); setTimeout(()=>sparkle(innerWidth*2/3,innerHeight/3,24),450);
}

// Real-event detection (capture phase so app handlers that stopPropagation can't hide it; never prevents anything).
addEventListener("pointerdown",e=>{
  touched(e);
  if(!active||step<0) return; const s=STEPS[step];
  if(s.on&&s.on.down&&s.on.down(e)){ if(++count>=(s.need||1)) advance(); }
},true);
addEventListener("click",e=>{
  if(!active||step<0) return; const s=STEPS[step];
  if(s.on&&s.on.click&&s.on.click(e)) advance();
  if(s.recStep&&e.target.closest("#rec")){
    if(!recOn){recOn=true;bubble.querySelector(".p").textContent="Recording! Make some sound... then press REC again to stop.";}
    else advance();
  }
  if(s.keepStep&&e.target.closest("#captureLast")){
    clearInterval(keepTimer); let n=0;
    keepTimer=setInterval(()=>{ n++; if(step<0){clearInterval(keepTimer);return;}
      if(cardCount()>keepBase){clearInterval(keepTimer);const d=$("desk").lastElementChild;if(d)sparkle(d.getBoundingClientRect().left+60,d.getBoundingClientRect().top+14,14);advance();}
      else if(n>12){clearInterval(keepTimer);bubble.querySelector(".p").textContent="Hmm, nothing to keep yet. Play a few notes, then press KEEP again!";}
    },100);
  }
},true);
addEventListener("keydown",e=>{ if(e.key==="Escape"&&active) end(false); idleReset(); },true);
addEventListener("resize",place); addEventListener("scroll",place,true);
setInterval(()=>{ if(active&&step>=0) place(); },500); // follow layout changes (timeline resize etc.)

// ---- idle nudges (first 3 sessions, opt-out) ----
const sessions=(Number(LS.get("muzik.sessions"))||0)+1; LS.set("muzik.sessions",String(sessions));
const nudgesOn=()=>LS.get("muzik.nudges")!=="off" && sessions<=3;
const NUDGE=[["keys","#keys .cell"],["piano","#piano"],["drum","[data-drum]"],["tones","#tones button,[data-noise]"],["rec","#rec"],["play","#play"]];
const used=new Set(); let idleT=0, nudged=null;
function touched(e){ NUDGE.forEach(([k,sel])=>{ if(e.target.closest&&e.target.closest(sel)) used.add(k); }); idleReset(); }
function idleReset(){ clearTimeout(idleT); if(nudged){nudged.classList.remove("ob-nudge");nudged=null;} if(nudgesOn()) idleT=setTimeout(nudge,8000); }
function nudge(){
  if(active||!nudgesOn()||document.hidden) return idleReset();
  const pick=NUDGE.find(([k])=>!used.has(k)); if(!pick) return;
  const target=document.querySelector(pick[1]==="#keys .cell"?"#keys .home-row .cell":pick[1].split(",")[0]);
  if(!target) return; used.add(pick[0]); // each thing is nudged at most once
  nudged=target; target.classList.add("ob-nudge");
  setTimeout(()=>{ if(nudged===target){target.classList.remove("ob-nudge");nudged=null;} idleReset(); },5000);
}
function syncNudgeBtn(){ const b=$("obNudges"); if(b) b.firstElementChild.textContent="Hints: "+(LS.get("muzik.nudges")==="off"?"off":"on"); }

function init(){
  const r=$("obReplay"); if(r) r.onclick=e=>{e.stopPropagation(); const m=$("setupMenu"); if(m) m.classList.remove("open"); welcome();};
  const n=$("obNudges"); if(n) n.onclick=e=>{e.stopPropagation(); LS.set("muzik.nudges",LS.get("muzik.nudges")==="off"?"on":"off"); syncNudgeBtn(); idleReset();};
  syncNudgeBtn();
  window.muzikTour={start:welcome,go,end};
  if(!LS.get("muzik.onboarded")) setTimeout(welcome,400); else idleReset();
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
})();
