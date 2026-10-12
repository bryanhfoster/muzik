/* MUZIK install prompt — no-reading style: giant emoji, giant buttons, sound cue, big ✕ */
(function(){
"use strict";
const LS={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};
const standalone=()=>(window.matchMedia&&matchMedia("(display-mode: standalone)").matches)||navigator.standalone===true;
const ua=navigator.userAgent||"";
const isIOS=/iP(hone|ad|od)/.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1);
let deferred=null, shownAuto=false;
function say(){} /* no spoken voice */

// Service worker: register + reload once when a new version takes over
if("serviceWorker" in navigator && (location.protocol==="https:"||location.hostname==="localhost"||location.hostname==="127.0.0.1")){
  const hadController=!!navigator.serviceWorker.controller; let reloading=false;
  navigator.serviceWorker.addEventListener("controllerchange",()=>{ if(!hadController||reloading) return; reloading=true; location.reload(); });
  window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
}

const css=`#pwa-scrim{position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:99990}
#pwa-card{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:99991;width:min(92vw,560px);background:#221c14;border:6px solid #ffe600;border-radius:36px;padding:28px 20px;text-align:center;color:#fff8e8;box-shadow:0 0 60px rgba(255,230,0,.5)}
#pwa-card img.pi{width:min(40vw,190px);height:auto;border-radius:24%;box-shadow:0 0 30px rgba(255,255,255,.3)}
#pwa-go{display:block;margin:22px auto 0;width:100%;min-height:120px;font-size:64px;border:0;border-radius:30px;background:#3ddc5a;color:#06210c;font-weight:900;cursor:pointer}
#pwa-go span{font-size:44px;vertical-align:middle}
#pwa-x{position:fixed;top:16px;right:16px;z-index:99992;width:96px;height:96px;border-radius:50%;border:5px solid #fff;background:#ff5a45;color:#fff;font-size:56px;line-height:1;cursor:pointer}
.pwa-steps{display:flex;align-items:center;justify-content:center;gap:2vw;margin-top:20px;font-size:min(13vw,76px)}
.pwa-box{display:inline-flex;align-items:center;justify-content:center;width:min(18vw,120px);height:min(18vw,120px);border-radius:22%;background:#fff;color:#007aff}
.pwa-box svg{width:64%;height:64%}
.pwa-then{font-size:min(7vw,56px);color:#ffe600}
#pwa-arrow{position:fixed;left:50%;bottom:8px;transform:translateX(-50%);z-index:99992;font-size:110px;color:#ffe600;filter:drop-shadow(0 0 16px #ffe600);animation:pwaB 0.9s ease-in-out infinite;pointer-events:none}
@keyframes pwaB{0%,100%{transform:translate(-50%,0)}50%{transform:translate(-50%,26px)}}
@media (prefers-reduced-motion:reduce){#pwa-arrow{animation:none}}
@media (min-width:768px){#pwa-arrow{bottom:auto;top:4px;left:auto;right:150px;transform:none;animation:none}}`;
const SHARE=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 8l5-5 5 5"/><path d="M5 12v8h14v-8"/></svg>`;
function close(remember){ ["pwa-scrim","pwa-card","pwa-x","pwa-arrow"].forEach(id=>{const e=document.getElementById(id);if(e)e.remove();}); if(remember) LS.set("muzik.installDismissed","1");  }
function show(manual){
  if(standalone()){ if(manual) say("MUZIK is already on your home screen!"); return; }
  if(!deferred && !isIOS){ if(manual) say("Open the browser menu, then tap install."); if(!manual) return; }
  close(false);
  if(!document.getElementById("pwa-css")){const s=document.createElement("style");s.id="pwa-css";s.textContent=css;document.head.appendChild(s);}
  const scrim=document.createElement("div"); scrim.id="pwa-scrim"; scrim.onclick=()=>close(true);
  const card=document.createElement("div"); card.id="pwa-card"; card.setAttribute("role","dialog"); card.setAttribute("aria-label","Install MUZIK");
  const x=document.createElement("button"); x.id="pwa-x"; x.type="button"; x.textContent="✕"; x.setAttribute("aria-label","Close"); x.onclick=()=>close(true);
  if(deferred){
    card.innerHTML=`<img class="pi" src="icons/icon-512.png" alt=""><button id="pwa-go" type="button" aria-label="Install"><span>📲</span> ⬇</button>`;
    document.body.append(scrim,card,x);
    card.querySelector("#pwa-go").onclick=async()=>{ const d=deferred; deferred=null; close(false); try{ d.prompt(); const r=await d.userChoice; if(r&&r.outcome==="dismissed") LS.set("muzik.installDismissed","1"); }catch(e){} };
    say("Want MUZIK on your home screen? Tap the big button.");
  } else {
    card.innerHTML=`<img class="pi" src="apple-touch-icon.png" alt=""><div class="pwa-steps"><span class="pwa-box" aria-label="Share">${SHARE}</span><span class="pwa-then">➜</span><span class="pwa-box" aria-label="Add to Home Screen" style="font-size:min(11vw,80px);color:#111">➕</span><span class="pwa-then">➜</span><span>🏠</span></div>`;
    const ar=document.createElement("div"); ar.id="pwa-arrow"; ar.textContent=window.innerWidth>=768?"⬆":"⬇";
    document.body.append(scrim,card,x,ar);
    say("Tap the share button at the bottom, then tap Add to Home Screen, the plus sign.");
  }
}
function auto(){ if(shownAuto||standalone()||LS.get("muzik.installDismissed")) return; if(!deferred&&!isIOS) return;
  if(document.getElementById("ob-scrim")||document.getElementById("ob-hole")){ setTimeout(auto,8000); return; }
  shownAuto=true; show(false); }
window.addEventListener("beforeinstallprompt",e=>{ e.preventDefault(); deferred=e; });
window.addEventListener("appinstalled",()=>{ close(false); LS.set("muzik.installDismissed","1"); });
window.muzikInstall={show:()=>show(true),close};
function init(){
  const b=document.getElementById("pwaInstall");
  if(b){ b.onclick=e=>{ e.stopPropagation(); const m=document.getElementById("setupMenu"); if(m) m.classList.remove("open"); show(true); }; if(standalone()) b.style.display="none"; }
  // after the first fun moment: onboarding celebration ("🎉" gone) or ~45s of play
  setTimeout(auto,45000);
  const mo=new MutationObserver(()=>{ if(document.getElementById("ob-yay")){ mo.disconnect(); setTimeout(auto,4500);} });
  mo.observe(document.body,{childList:true});
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
})();
