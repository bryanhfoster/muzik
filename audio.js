/* MUZIK shared room audio: synth voices (same harmonics as studio), drums, light reverb/delay, voice cap. */
(function(){
const HARM={organ:[0,1,0.55,0.32,0.18,0.06,0.1],pulse:[0,1,0,0.33,0,0.2,0,0.14,0,0.11],bell:[0,1,0.2,0.55,0.15,0.35,0.08,0.22],brass:[0,1,0.75,0.5,0.32,0.18,0.1],flute:[0,1,0.28,0.06],voice:[0,0.35,0.15,1,0.55,0.22,0.1],hollow:[0,1,0,0.5,0,0.28,0,0.14],strings:[0,1,0.62,0.4,0.28,0.2,0.14,0.1,0.07]};
const MAX_VOICES=16;
let ac=null,out,dry,wet,noiseBuf,waves={};const live=[];
function proj(){try{return JSON.parse(localStorage.getItem("studio-project")||"null")||{};}catch(e){return {};}}
function wave(){const w=proj().wave;return typeof w==="string"&&w?w:"triangle";}
function bpm(){const b=Number(proj().bpm);return b>=40&&b<=220?b:100;}
function keyRoot(){const p=proj();const k=Number.isFinite(p.keyRoot)?p.keyRoot:(Number.isFinite(p.lastHit)?p.lastHit:60);return ((Math.round(k)%12)+12)%12;}
function setKey(m){try{const p=proj();if(!p.v){p.v=1;p.tracks=p.tracks||[];}p.lastHit=m;p.keyRoot=m;localStorage.setItem("studio-project",JSON.stringify(p));}catch(e){}}
function hz(m){return 440*Math.pow(2,(m-69)/12);}
function init(){
  if(ac){if(ac.state==="suspended")ac.resume();return ac;}
  const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;
  ac=new C();
  out=ac.createDynamicsCompressor();out.threshold.value=-14;out.ratio.value=4;
  const master=ac.createGain();master.gain.value=0.8;out.connect(master);master.connect(ac.destination);
  dry=ac.createGain();dry.connect(out);
  // light reverb (generated impulse) + feedback delay
  const len=Math.floor(ac.sampleRate*1.6),ir=ac.createBuffer(2,len,ac.sampleRate);
  for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3);}
  const conv=ac.createConvolver();conv.buffer=ir;wet=ac.createGain();wet.gain.value=0.22;
  wet.connect(conv);conv.connect(out);
  const dl=ac.createDelay(1);dl.delayTime.value=0.27;const fb=ac.createGain();fb.gain.value=0.25;
  const dg=ac.createGain();dg.gain.value=0.12;const lp=ac.createBiquadFilter();lp.frequency.value=2500;
  dry.connect(dg);dg.connect(dl);dl.connect(lp);lp.connect(fb);fb.connect(dl);lp.connect(out);
  dry.connect(wet);
  noiseBuf=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const nd=noiseBuf.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
  return ac;
}
function applyWave(o,w){const h=HARM[w];if(!h){try{o.type=w;}catch(e){o.type="triangle";}return;}
  if(!waves[w]){const re=new Float32Array(h.length),im=new Float32Array(h.length);for(let i=1;i<h.length;i++)im[i]=h[i];waves[w]=ac.createPeriodicWave(re,im);}o.setPeriodicWave(waves[w]);}
function steal(){while(live.length>=MAX_VOICES){const v=live.shift();release(v,0.03);}}
function start(m,vol,when){ // returns a held voice
  if(!init())return null;steal();when=when||ac.currentTime;vol=Math.min(0.5,vol==null?0.25:vol);
  const o=ac.createOscillator();applyWave(o,wave());o.frequency.setValueAtTime(hz(m),when);
  const g=ac.createGain();g.gain.setValueAtTime(0.0001,when);g.gain.exponentialRampToValueAtTime(vol,when+0.015);
  g.gain.setTargetAtTime(vol*0.7,when+0.03,0.2);
  o.connect(g);g.connect(dry);o.start(when);const v={o,g,done:false};live.push(v);return v;
}
function glide(v,m,t){if(!v||v.done||!ac)return;v.o.frequency.setTargetAtTime(hz(m),ac.currentTime,t||0.05);}
function release(v,t){if(!v||v.done||!ac)return;v.done=true;t=t||0.25;const n=ac.currentTime;
  try{v.g.gain.cancelScheduledValues(n);v.g.gain.setValueAtTime(Math.max(0.0001,v.g.gain.value),n);v.g.gain.setTargetAtTime(0.0001,n,t/4);v.o.stop(n+t+0.05);}catch(e){}
  const i=live.indexOf(v);if(i>=0)live.splice(i,1);}
function note(m,dur,vol,when){if(!init())return;when=when||ac.currentTime;const v=start(m,vol,when);if(!v)return;
  const t=when+(dur||0.3);v.g.gain.setTargetAtTime(0.0001,t,0.08);v.o.stop(t+0.6);v.o.onended=()=>{v.done=true;const i=live.indexOf(v);if(i>=0)live.splice(i,1);};}
function burst(when,dur,peak){const g=ac.createGain();g.gain.setValueAtTime(0.0001,when);g.gain.exponentialRampToValueAtTime(peak,when+0.004);g.gain.exponentialRampToValueAtTime(0.0001,when+dur);g.connect(dry);return g;}
function toneHit(when,f0,f1,dur,peak){const o=ac.createOscillator();o.type="sine";o.frequency.setValueAtTime(f0,when);o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),when+Math.min(0.14,dur));o.connect(burst(when,dur,peak));o.start(when);o.stop(when+dur+0.02);}
function noiseHit(when,dur,peak,type,freq,q){const s=ac.createBufferSource();s.buffer=noiseBuf;const f=ac.createBiquadFilter();f.type=type;f.frequency.value=freq;if(q)f.Q.value=q;s.connect(f);f.connect(burst(when,dur,peak));s.start(when);s.stop(when+dur+0.02);}
function drum(name,when,vol){if(!init())return;when=when||ac.currentTime;const k=vol==null?1:vol;
  if(name==="kick"){toneHit(when,170,42,0.28,1.0*k);noiseHit(when,0.018,0.3*k,"highpass",1200);}
  else if(name==="snare"){toneHit(when,186,160,0.12,0.4*k);noiseHit(when,0.16,0.55*k,"bandpass",1800,0.7);}
  else if(name==="hat"){noiseHit(when,0.045,0.32*k,"highpass",7000);}
  else if(name==="tom"){toneHit(when,220,86,0.26,0.85*k);}
  else if(name==="clap"){[0,0.012,0.024].forEach(d=>noiseHit(when+d,0.09,0.45*k,"bandpass",1400,0.6));}
  else {toneHit(when,540,540,0.16,0.25*k);}}
window.MuzikAudio={init,start,glide,release,note,drum,hz,bpm,keyRoot,setKey,wave,get ctx(){return ac;}};
})();
