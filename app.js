'use strict';
/* =====================================================================
   Closia — digital wardrobe & outfit stylist.
   Everything runs on the device: photos and data live in IndexedDB.
   The only network call is optional weather (Open-Meteo, no key).
   ===================================================================== */

/* ---------------- constants ---------------- */
const CATS = [
  {id:'top',    ar:'فوق',        e:'👕', ph:'مثلاً: قميص كتان'},
  {id:'bottom', ar:'تحت',        e:'👖', ph:'مثلاً: جينز واسع'},
  {id:'full',   ar:'قطعة كاملة', e:'👗', ph:'مثلاً: فستان، ثوب، عباية'},
  {id:'outer',  ar:'جاكيت',      e:'🧥', ph:'مثلاً: بليزر، كارديغان، بشت'},
  {id:'shoes',  ar:'حذاء',       e:'👟', ph:'مثلاً: سنيكرز أبيض'},
  {id:'bag',    ar:'شنطة',       e:'👜', ph:'مثلاً: شنطة كتف'},
  {id:'acc',    ar:'إكسسوار',    e:'⌚', ph:'مثلاً: ساعة، نظارة، شماغ، طرحة'},
];
const CAT = Object.fromEntries(CATS.map(c=>[c.id,c]));
const ORDER = ['outer','top','full','bottom','shoes','bag','acc'];
const OCCS = [
  {id:'casual',ar:'كاجوال',e:'☕'},{id:'work',ar:'دوام/جامعة',e:'💼'},{id:'out',ar:'طلعة/عشاء',e:'🌙'},
  {id:'event',ar:'مناسبة',e:'🎉'},{id:'sport',ar:'رياضة',e:'🏃'},{id:'travel',ar:'سفر',e:'✈️'},
];
const OCC = Object.fromEntries(OCCS.map(o=>[o.id,o]));
const WX = [{id:'hot',ar:'حر',e:'☀️'},{id:'mild',ar:'معتدل',e:'⛅'},{id:'cold',ar:'برد',e:'❄️'}];
const WXM = Object.fromEntries(WX.map(w=>[w.id,w]));
const SEASONS = [{id:'summer',ar:'صيفي'},{id:'winter',ar:'شتوي'},{id:'all',ar:'كل الفصول'}];
const CURS = ['ر.س','د.إ','د.ك','ر.ق','د.ب','ر.ع','$','€'];
const PALETTE = [ // hex, name, neutral
  ['#111111','أسود',1],['#F5F5F2','أبيض',1],['#8A8A8A','رمادي',1],['#3A3A3F','فحمي',1],
  ['#F1E6D2','كريمي',1],['#D6C3A3','بيج',1],['#B49A74','خاكي',1],['#6B4A33','بني',1],['#9C6B3F','جملي',1],
  ['#1E2A4A','كحلي',1],['#4A6A8F','جينز',1],['#9CB6D4','سماوي',0],['#2F5BD3','أزرق',0],
  ['#1F7A6B','تركوازي',0],['#556B2F','زيتي',1],['#3E8E4E','أخضر',0],['#A8C99A','نعناعي',0],
  ['#E8D44D','أصفر',0],['#E9A23B','خردلي',0],['#E8742E','برتقالي',0],
  ['#C0392B','أحمر',0],['#7A1F2B','عنابي',0],['#E8A0B4','وردي',0],['#D94C8A','فوشي',0],
  ['#C9B6E4','ليلكي',0],['#6B3FA0','بنفسجي',0],['#C8A27A','ذهبي',0],['#C0C0C8','فضي',1],
];

/* ---------------- icons ---------------- */
const IC = {
  lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  unlock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-1.8"/></svg>',
  heart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/></svg>',
  heartF:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/></svg>',
  edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',
  cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  shuffle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  up:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="3" width="13" height="13" rx="2"/><path d="M3 8v11a2 2 0 0 0 2 2h11"/></svg>',
  down:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="13" height="13" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v11"/></svg>',
  big:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M8 11h6M11 8v6M20 20l-4-4"/></svg>',
  small:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M8 11h6M20 20l-4-4"/></svg>',
  prev:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>',
  next:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 6l-6 6 6 6"/></svg>',
  search:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
  pin:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
};

/* ---------------- storage ---------------- */
const DB = (() => {
  let dbp;
  function open(){
    if (dbp) return dbp;
    dbp = new Promise((res,rej)=>{
      const r = indexedDB.open('khzanti',3);
      r.onupgradeneeded = e => {
        const d = r.result;
        if (e.oldVersion < 1){ d.createObjectStore('items',{keyPath:'id'}); d.createObjectStore('outfits',{keyPath:'id'}); d.createObjectStore('kv'); }
        if (e.oldVersion < 2){ d.createObjectStore('plans',{keyPath:'date'}); d.createObjectStore('trips',{keyPath:'id'}); }
        if (e.oldVersion < 3){ d.createObjectStore('wish',{keyPath:'id'}); }
      };
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  async function tx(store, mode, fn){
    const d = await open();
    return new Promise((res,rej)=>{
      const t = d.transaction(store, mode), s = t.objectStore(store), out = fn(s);
      t.oncomplete = () => res(out && 'result' in out ? out.result : undefined);
      t.onerror = () => rej(t.error);
    });
  }
  return {
    all:s=>tx(s,'readonly',st=>st.getAll()),
    get:(s,k)=>tx(s,'readonly',st=>st.get(k)),
    put:(s,v,k)=>tx(s,'readwrite',st=>k===undefined?st.put(v):st.put(v,k)),
    putMany:(s,vs)=>tx(s,'readwrite',st=>{vs.forEach(v=>st.put(v));}),
    del:(s,k)=>tx(s,'readwrite',st=>st.delete(k)),
    clear:s=>tx(s,'readwrite',st=>st.clear()),
  };
})();

/* ---------------- state ---------------- */
const now0 = new Date();
const S = {
  items:[], wish:[], outfits:[], plans:{}, trips:[], set:{cur:'ر.س', wxOn:false, tipClosed:false},
  view:'closet',
  closet:{cat:'all', q:'', color:null, sort:'new', laundry:false, tab:'items'}, hero:null,
  oTab:'style', occ:'casual', wx:null, wxManual:false, wxInfo:null, planDate:null,
  results:[], idx:0, locks:{}, look:'all', shown:new Set(),
  pTab:'cal', cal:{y:now0.getFullYear(), m:now0.getMonth()},
};

/* ---------------- helpers ---------------- */
const $ = id => document.getElementById(id);
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const byId = id => S.items.find(i=>i.id===id);
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const pick = a => a[Math.floor(Math.random()*a.length)];
const pad2 = n => String(n).padStart(2,'0');
const ymd = d => `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
const parseYmd = s => { const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d,12); };
const today = () => ymd(new Date());
const addDays = (s,n) => { const d=parseYmd(s); d.setDate(d.getDate()+n); return ymd(d); };
const LOC = 'ar-u-ca-gregory-nu-latn';
const fmtDate = (s,o={weekday:'long',day:'numeric',month:'long'}) => parseYmd(s).toLocaleDateString(LOC,o);
const daysSince = ts => ts ? Math.floor((Date.now()-ts)/864e5) : Infinity;
const money = v => (Math.round(v*10)/10).toLocaleString('en') + ' ' + S.set.cur;
const sortPieces = ps => [...ps].sort((a,b)=>ORDER.indexOf(a.cat)-ORDER.indexOf(b.cat));
const NOUN = {top:'قطعة علوية',bottom:'قطعة سفلية',full:'قطعة كاملة',outer:'جاكيت',shoes:'حذاء',bag:'شنطة',acc:'إكسسوار'};
const itemName = it => it.name || `${NOUN[it.cat]} · ${colorInfo(it.color).name}`;
function toast(m){ const t=$('toast'); t.textContent=m; t.classList.add('on'); clearTimeout(toast.t); toast.t=setTimeout(()=>t.classList.remove('on'),2200); }
function busy(on,tx){ $('busy').classList.toggle('hidden',!on); if(tx) $('busyTx').textContent=tx; }
async function saveSet(){ await DB.put('kv',S.set,'settings'); }

/* ---------------- color science ---------------- */
const hexToRgb = h => [1,3,5].map(i=>parseInt(h.substr(i,2),16));
const rgbToHex = (r,g,b) => '#'+[r,g,b].map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join('');
function rgbToHsl(r,g,b){ r/=255;g/=255;b/=255; const mx=Math.max(r,g,b),mn=Math.min(r,g,b); let h=0,s=0; const l=(mx+mn)/2;
  if(mx!==mn){ const d=mx-mn; s=l>.5?d/(2-mx-mn):d/(mx+mn); h=mx===r?((g-b)/d+(g<b?6:0)):mx===g?((b-r)/d+2):((r-g)/d+4); h*=60; }
  return [h,s,l]; }
const LIN = new Float32Array(256).map((_,v)=>{v/=255;return v>.04045?Math.pow((v+.055)/1.055,2.4):v/12.92});
function rgbToLab(r,g,b){
  r=LIN[r|0];g=LIN[g|0];b=LIN[b|0];
  let x=(r*.4124+g*.3576+b*.1805)/.95047, y=r*.2126+g*.7152+b*.0722, z=(r*.0193+g*.1192+b*.9505)/1.08883;
  const k=v=>v>.008856?Math.cbrt(v):7.787*v+16/116; x=k(x);y=k(y);z=k(z);
  return [116*y-16,500*(x-y),200*(y-z)]; }
const labDist = (a,b) => Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const PAL = PALETTE.map(p=>({hex:p[0],name:p[1],neutral:!!p[2],lab:rgbToLab(...hexToRgb(p[0]))}));
const _ci = new Map();
function colorInfo(hex){
  if(_ci.has(hex)) return _ci.get(hex);
  const rgb=hexToRgb(hex), lab=rgbToLab(...rgb), [h,s,l]=rgbToHsl(...rgb);
  let best=PAL[0],bd=1e9; for(const p of PAL){ const d=labDist(lab,p.lab); if(d<bd){bd=d;best=p;} }
  const r={hex,h,s,l,name:best.name,family:best.hex,neutral:best.neutral||s<.14||l<.13||l>.92};
  _ci.set(hex,r); return r;
}
function harmony(a,b){
  if(a.neutral&&b.neutral) return {s:(a.name===b.name&&Math.abs(a.l-b.l)<.08)?1:2,k:'neutral'};
  if(a.neutral||b.neutral) return {s:2.2,k:'neutral'};
  let d=Math.abs(a.h-b.h); if(d>180) d=360-d; const dl=Math.abs(a.l-b.l);
  if(d<18) return {s:dl>.15?2.4:1.4,k:'mono'};
  if(d<50) return {s:1.6,k:'analog'};
  if(d>=150) return {s:(a.s>.6&&b.s>.6&&dl<.12)?.6:1.8,k:'comp'};
  if(d>=105&&d<=135) return {s:.6,k:'triad'};
  return {s:-1.6,k:'clash'};
}

/* ---------------- photo processing: background removal + color ---------------- */
function loadImg(src){ return new Promise((res,rej)=>{ const im=new Image(); im.onload=()=>res(im); im.onerror=rej; im.src=src; }); }
function mkCanvas(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; }

/* Pipeline: source photo (canvas) → optional enhancement → alpha mask (AI or classic,
   plus manual touch-ups) → composed cut-out. The source and mask are stored with the
   item so every step can be redone later. */
function srcFromImage(im,MAX=720){
  const k=Math.min(1,MAX/Math.max(im.naturalWidth||im.width,im.naturalHeight||im.height));
  const w=Math.max(8,Math.round((im.naturalWidth||im.width)*k)), h=Math.max(8,Math.round((im.naturalHeight||im.height)*k));
  const c=mkCanvas(w,h), x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,w,h); x.drawImage(im,0,0,w,h); return c;
}
const ctx2d = c => c.getContext('2d',{willReadFrequently:true});
// auto levels + white balance from the photo itself, then brightness (gamma)
function enhancedData(src,{auto=true,bright=0}={}){
  const w=src.width,h=src.height, id=ctx2d(src).getImageData(0,0,w,h), d=id.data;
  if(!auto&&!bright) return id;
  const luts=[0,1,2].map(()=>new Uint8ClampedArray(256).map((_,v)=>v));
  if(auto){
    const hist=[new Uint32Array(256),new Uint32Array(256),new Uint32Array(256)]; let n=0;
    const step=Math.max(1,Math.floor(Math.sqrt(w*h/40000)));
    for(let y=0;y<h;y+=step) for(let x=0;x<w;x+=step){ const o=(y*w+x)*4; hist[0][d[o]]++; hist[1][d[o+1]]++; hist[2][d[o+2]]++; n++; }
    const pct=(hh,p)=>{ let acc=0; for(let v=0;v<256;v++){ acc+=hh[v]; if(acc>=n*p) return v; } return 255; };
    for(let c=0;c<3;c++){
      const lo=Math.min(pct(hist[c],.005),45), hi=Math.max(pct(hist[c],.995),175);
      for(let v=0;v<256;v++){ const st=(v-lo)/(hi-lo)*255; luts[c][v]=v*.35+clamp(st,0,255)*.65; }
    }
  }
  if(bright){ const g=Math.pow(2,-bright*1.6); for(let c=0;c<3;c++) for(let v=0;v<256;v++) luts[c][v]=255*Math.pow(luts[c][v]/255,g); }
  for(let i=0;i<d.length;i+=4){ d[i]=luts[0][d[i]]; d[i+1]=luts[1][d[i+1]]; d[i+2]=luts[2][d[i+2]]; }
  return id;
}
// Classic: flood-fill the background from the border (plain backgrounds).
function classicAlpha(src){
  const w=src.width,h=src.height,N=w*h, d=ctx2d(src).getImageData(0,0,w,h).data;
  const L=new Float32Array(N),A=new Float32Array(N),B=new Float32Array(N);
  for(let i=0;i<N;i++){ const o=i*4, lab=rgbToLab(d[o],d[o+1],d[o+2]); L[i]=lab[0];A[i]=lab[1];B[i]=lab[2]; }
  const dist=(i,l,a,b)=>Math.hypot(L[i]-l,A[i]-a,B[i]-b);
  const band=Math.max(2,Math.round(Math.min(w,h)*.015)), border=[];
  for(let y=0;y<h;y++) for(let x=0;x<w;x++) if(x<band||y<band||x>=w-band||y>=h-band) border.push(y*w+x);
  let bl=0,ba=0,bb=0; for(const i of border){bl+=L[i];ba+=A[i];bb+=B[i];} bl/=border.length;ba/=border.length;bb/=border.length;
  let spread=0; for(const i of border) spread+=dist(i,bl,ba,bb); spread/=border.length;
  const T1=clamp(9+spread*1.5,12,32), T2=5, T3=T1*2.3;
  const bg=new Uint8Array(N), q=new Int32Array(N); let qh=0,qt=0;
  const nbs=i=>{ const px=i%w, py=(i/w)|0; return [px>0?i-1:-1, px<w-1?i+1:-1, py>0?i-w:-1, py<h-1?i+w:-1]; };
  for(const i of border) if(!bg[i]&&dist(i,bl,ba,bb)<T3){ bg[i]=1; q[qt++]=i; }
  while(qh<qt){ const i=q[qh++];
    for(const j of nbs(i)){ if(j<0||bg[j]) continue; const dj=dist(j,bl,ba,bb);
      if(dj<T1||(dj<T3&&Math.hypot(L[j]-L[i],A[j]-A[i],B[j]-B[i])<T2)){ bg[j]=1; q[qt++]=j; } } }
  // enclosed background pockets (bag handles, straps)
  { const hole=new Uint8Array(N), T=T1*.8;
    for(let s0=0;s0<N;s0++){ if(bg[s0]||hole[s0]||dist(s0,bl,ba,bb)>=T) continue;
      qh=qt=0; q[qt++]=s0; hole[s0]=1;
      while(qh<qt){ const i=q[qh++]; for(const j of nbs(i)) if(j>=0&&!bg[j]&&!hole[j]&&dist(j,bl,ba,bb)<T){ hole[j]=1; q[qt++]=j; } }
      if(qt>N*.004) for(let k=0;k<qt;k++) bg[q[k]]=1; } }
  // drop specks: keep significant components only
  const lab=new Int32Array(N); let nl=0; const sizes=[0];
  for(let s0=0;s0<N;s0++){ if(bg[s0]||lab[s0]) continue; nl++; let n=0; qh=qt=0; q[qt++]=s0; lab[s0]=nl;
    while(qh<qt){ const i=q[qh++]; n++; for(const j of nbs(i)) if(j>=0&&!bg[j]&&!lab[j]){ lab[j]=nl; q[qt++]=j; } }
    sizes.push(n); }
  const big=sizes.reduce((m,n)=>n>m?n:m,0), keep=sizes.map(n=>n>=Math.max(big*.12,N*.002));
  let fg=0; for(let i=0;i<N;i++){ if(!bg[i]&&!keep[lab[i]]) bg[i]=1; if(!bg[i]) fg++; }
  if(fg/N<.04||fg/N>.95) return null;
  let a=new Float32Array(N); for(let i=0;i<N;i++) a[i]=bg[i]?0:255;
  for(let pass=0;pass<2;pass++){ const t=new Float32Array(N);
    for(let y=0;y<h;y++) for(let x=0;x<w;x++){ const i=y*w+x; t[i]=(a[i]+(x>0?a[i-1]:a[i])+(x<w-1?a[i+1]:a[i]))/3; }
    for(let y=0;y<h;y++) for(let x=0;x<w;x++){ const i=y*w+x; a[i]=(t[i]+(y>0?t[i-w]:t[i])+(y<h-1?t[i+w]:t[i]))/3; } }
  const out=new Uint8ClampedArray(N); for(let i=0;i<N;i++) out[i]=(a[i]-50)*1.4; return out;
}
// AI: on-device segmentation model (downloaded once, then cached by the browser).
const AI_LIB='https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm';
let _ai=null;
async function aiAlpha(src,onProgress){
  if(!_ai) _ai=import(AI_LIB).catch(e=>{ _ai=null; throw e; });
  const m=await _ai;
  const blob=await new Promise(r=>src.toBlob(r,'image/png'));
  const out=await m.segmentForeground(blob,{model:'isnet_quint8',output:{format:'image/png'},
    progress:(key,cur,total)=>{ if(onProgress&&/fetch/.test(key)&&total) onProgress(cur/total); }});
  const im=await loadImg(URL.createObjectURL(out));
  const c=mkCanvas(src.width,src.height); c.getContext('2d').drawImage(im,0,0,src.width,src.height); URL.revokeObjectURL(im.src);
  const d=ctx2d(c).getImageData(0,0,c.width,c.height).data, N=c.width*c.height, a=new Uint8ClampedArray(N);
  let fg=0; for(let i=0;i<N;i++){ a[i]=d[i*4+3]; if(a[i]>128) fg++; }
  if(fg/N<.02) throw new Error('empty mask');
  S.set.aiReady=true; saveSet();
  return a;
}
function alphaToURL(a,w,h){ const c=mkCanvas(w,h), x=c.getContext('2d'), id=x.createImageData(w,h);
  for(let i=0;i<a.length;i++){ const o=i*4; id.data[o]=id.data[o+1]=id.data[o+2]=a[i]; id.data[o+3]=255; } x.putImageData(id,0,0); return c.toDataURL('image/png'); }
async function alphaFromURL(url,w,h){ const im=await loadImg(url); const c=mkCanvas(w,h); c.getContext('2d').drawImage(im,0,0,w,h);
  const d=ctx2d(c).getImageData(0,0,w,h).data, a=new Uint8ClampedArray(w*h); for(let i=0;i<a.length;i++) a[i]=d[i*4]; return a; }
// Build the final picture + colours from source, mask and settings.
function compose(src,alpha,{auto=true,bright=0,useCut=true}={}){
  const w=src.width,h=src.height,N=w*h, id=enhancedData(src,{auto,bright}), d=id.data;
  if(useCut&&alpha){
    const bg=new Uint8Array(N); let x0=w,y0=h,x1=0,y1=0;
    for(let i=0;i<N;i++){ const v=alpha[i]; d[i*4+3]=v; bg[i]=v<128?1:0;
      if(v>20){ const px=i%w,py=(i/w)|0; if(px<x0)x0=px; if(px>x1)x1=px; if(py<y0)y0=py; if(py>y1)y1=py; } }
    if(x1>x0&&y1>y0){
      const colors=detectColors(d,w,h,bg,null);
      const c=mkCanvas(w,h); c.getContext('2d').putImageData(id,0,0);
      const bw=x1-x0+1, bh=y1-y0+1, p=Math.round(Math.max(bw,bh)*.03), kk=Math.min(1,640/Math.max(bw+2*p,bh+2*p));
      const cc=mkCanvas(Math.round((bw+2*p)*kk),Math.round((bh+2*p)*kk));
      cc.getContext('2d').drawImage(c,x0,y0,bw,bh,p*kk,p*kk,bw*kk,bh*kk);
      return {img:cc.toDataURL('image/png'),ar:cc.height/cc.width,cut:true,...colors};
    }
  }
  // no cut-out: estimate background from the border to find the garment colour
  let r=0,g=0,b=0,n=0; for(let y=0;y<h;y+=4) for(const x of [0,1,w-2,w-1]){ const o=(y*w+x)*4; r+=d[o];g+=d[o+1];b+=d[o+2];n++; }
  const colors=detectColors(d,w,h,null,rgbToLab(r/n,g/n,b/n));
  const c=mkCanvas(w,h); c.getContext('2d').putImageData(id,0,0);
  return {img:c.toDataURL('image/jpeg',.85),ar:h/w,cut:false,...colors};
}
function detectColors(d,w,h,bgMask,bgLab){
  const N=w*h, step=Math.max(1,Math.floor(Math.sqrt(N/9000))), buckets=new Map(); let tot=0;
  for(let y=0;y<h;y+=step) for(let x=0;x<w;x+=step){
    const i=y*w+x, o=i*4;
    if(bgMask){ if(bgMask[i]) continue; }
    else { if(x<w*.18||x>w*.82||y<h*.18||y>h*.82) continue;
      if(labDist(rgbToLab(d[o],d[o+1],d[o+2]),bgLab)<16) continue; }
    const k=(d[o]>>5)*64+(d[o+1]>>5)*8+(d[o+2]>>5);
    const b=buckets.get(k)||{n:0,r:0,g:0,b:0}; b.n++; b.r+=d[o]; b.g+=d[o+1]; b.b+=d[o+2]; buckets.set(k,b); tot++;
  }
  const bs=[...buckets.values()].sort((a,b)=>b.n-a.n);
  if(!bs.length){ const o=((h>>1)*w+(w>>1))*4; return {color:rgbToHex(d[o],d[o+1],d[o+2]),color2:null}; }
  // merge near buckets into the leader
  const hexOf=b=>rgbToHex(b.r/b.n,b.g/b.n,b.b/b.n);
  const c1=hexOf(bs[0]), l1=rgbToLab(...hexToRgb(c1));
  let w1=0; for(const b of bs) if(labDist(rgbToLab(b.r/b.n,b.g/b.n,b.b/b.n),l1)<18) w1+=b.n;
  let color2=null;
  for(const b of bs){ const hx=hexOf(b); const lb=rgbToLab(...hexToRgb(hx)); if(labDist(lb,l1)<30) continue;
    let ww=0; for(const b2 of bs) if(labDist(rgbToLab(b2.r/b2.n,b2.g/b2.n,b2.b/b2.n),lb)<18) ww+=b2.n;
    if(ww>tot*.2) color2=hx; break; }
  return {color:c1,color2};
}

/* ---------------- sheet ---------------- */
let sheetClose=null;
function openSheet(html,onClose){ $('sheetBody').innerHTML=html; $('scrim').classList.add('on'); $('sheet').classList.add('on'); $('sheet').scrollTop=0; sheetClose=onClose||null; }
function closeSheet(){ $('scrim').classList.remove('on'); $('sheet').classList.remove('on'); const f=sheetClose; sheetClose=null; if(f) f(); }
$('scrim').onclick=closeSheet;
// swipe down on the grab handle to close
(()=>{ let y0=null; const sh=$('sheet');
  sh.addEventListener('touchstart',e=>{ y0=sh.scrollTop<=0?e.touches[0].clientY:null; },{passive:true});
  sh.addEventListener('touchend',e=>{ if(y0!==null&&e.changedTouches[0].clientY-y0>110&&sh.scrollTop<=0) closeSheet(); y0=null; },{passive:true});
})();

/* ---------------- outfit boards (collage) ---------------- */
function autoLayout(pieces){
  // tidy flat-lay: centred column (top → bottom → shoes), jacket and bag on the sides
  const R=.75, ar=p=>clamp(p.ar||1.2,.3,3), g=c=>pieces.find(p=>p.cat===c), L=[];
  const add=(p,x,y,w,z)=>L.push({id:p.id,x:+x.toFixed(4),y:+y.toFixed(4),w:+w.toFixed(4),z});
  const outer=g('outer'),top=g('top'),bot=g('bottom'),full=g('full'),shoes=g('shoes'),bag=g('bag'),acc=g('acc');
  const col=[];
  if(full) col.push({p:full,w:.34,z:2});
  else { if(top) col.push({p:top,w:.3,z:3}); if(bot) col.push({p:bot,w:.25,z:2,ov:.015}); }
  if(shoes) col.push({p:shoes,w:.2,z:1,ov:-.025});
  const hOf=(c,k)=>Math.min(c.w*k*ar(c.p)*R,.5);
  const total=k=>col.reduce((s,c,i)=>s+hOf(c,k)-(i?(c.ov||0):0),0);
  let k=1; for(let n=0;n<12&&total(k)>.82;n++) k*=.9;
  const cx=outer?.45:bag?.53:.5;
  let y=(1-total(k))/2, topY=y, topW=0;
  col.forEach((c,i)=>{ if(i) y-=c.ov||0; const h=hOf(c,k), w=h/(ar(c.p)*R);
    add(c.p,cx-w/2,y,w,c.z); if(i===0){ topY=y; topW=w; } y+=h; });
  if(outer){ let w=.27*k, h=Math.min(w*ar(outer)*R,.42); w=h/(ar(outer)*R); add(outer,Math.min(.96-w,cx+topW/2-.05),topY-.01,w,1.5); }
  if(bag){ let w=.2, h=Math.min(w*ar(bag)*R,.24); w=h/(ar(bag)*R); add(bag,Math.max(.04,cx-(topW||.3)/2-w-.0),.5-h/2,w,4); }
  if(acc){ let w=.13, h=Math.min(w*ar(acc)*R,.14); w=h/(ar(acc)*R); add(acc,outer?.8:.74,outer?.6:.3,w,5); }
  pieces.filter(p=>!L.some(l=>l.id===p.id)).forEach((p,i)=>add(p,.78,.06+i*.16,.14,8+i));
  return L;
}
function boardHTML(layout,cls=''){
  return `<div class="board ${cls}">${[...layout].sort((a,b)=>a.z-b.z).map(l=>{ const it=byId(l.id)||S.wish.find(w=>w.id===l.id); if(!it) return '';
    return `<img src="${it.img}" class="${it.cut?'':'nocut'}" style="left:${(l.x*100).toFixed(2)}%;top:${(l.y*100).toFixed(2)}%;width:${(l.w*100).toFixed(2)}%" alt="">`; }).join('')}</div>`;
}
const layoutOf = o => (o.layout && o.layout.length ? o.layout.filter(l=>byId(l.id)) : autoLayout(o.ids.map(byId).filter(Boolean)));

/* ---------------- weather ---------------- */
function autoWxByMonth(dateStr){ const m=parseYmd(dateStr||today()).getMonth()+1; return [12,1,2].includes(m)?'cold':[3,4,10,11].includes(m)?'mild':'hot'; }
function wxDay(dateStr){ const w=S.wxInfo; return w&&w.days&&w.days[dateStr]; }
function wxFor(dateStr){ const d=wxDay(dateStr); if(!d) return autoWxByMonth(dateStr); const f=(d.max*2+d.min)/3; return f>=29?'hot':f>=19?'mild':'cold'; }
function wxIcon(code){ if(code==null) return '🌡️'; if(code===0) return '☀️'; if(code<=3) return '⛅'; if(code<=48) return '🌫️'; if(code<=67) return '🌧️'; if(code<=77) return '🌨️'; if(code<=82) return '🌦️'; return '⛈️'; }
async function fetchWeather(manual){
  if(!navigator.geolocation){ if(manual) toast('الموقع مو متاح'); return; }
  try{
    const pos=await new Promise((res,rej)=>navigator.geolocation.getCurrentPosition(res,rej,{timeout:12000,maximumAge:3*3600e3}));
    const {latitude:la,longitude:lo}=pos.coords;
    const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${la.toFixed(2)}&longitude=${lo.toFixed(2)}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=16`);
    const j=await r.json(); const info={at:Date.now(),temp:Math.round(j.current.temperature_2m),code:j.current.weather_code,days:{}};
    j.daily.time.forEach((t,i)=>info.days[t]={max:Math.round(j.daily.temperature_2m_max[i]),min:Math.round(j.daily.temperature_2m_min[i]),code:j.daily.weather_code[i]});
    S.wxInfo=info; await DB.put('kv',info,'wx'); S.set.wxOn=true; await saveSet();
    if(!S.wxManual){ S.wx=wxFor(S.planDate||today()); S.results=[]; }
    render(); if(manual) toast('تحدّث الجو ✓');
  }catch(e){ if(manual) toast('ما قدرت أجيب الجو — اسمح بالموقع'); }
}

/* ---------------- stylist engine ----------------
   Not random: every candidate outfit is enumerated and scored against
   real styling formulas ("looks"), styling rules (formality, proportions,
   patterns, colour count) and the user's learned taste. */
const STYLES = [
  {id:'casual',ar:'كاجوال',f:2.4},{id:'smart',ar:'سمارت',f:3.3},{id:'classic',ar:'رسمي/كلاسيك',f:4},
  {id:'street',ar:'ستريت',f:2},{id:'sport',ar:'رياضي',f:1},{id:'evening',ar:'سهرة',f:4.6},{id:'trad',ar:'تقليدي',f:4},
];
const STY = Object.fromEntries(STYLES.map(s=>[s.id,s]));
const FITS = [{id:'loose',ar:'واسع'},{id:'regular',ar:'عادي'},{id:'slim',ar:'ضيق'}];
const PATTERNS = [{id:'solid',ar:'سادة'},{id:'stripe',ar:'مقلّم'},{id:'check',ar:'كاروهات'},{id:'print',ar:'نقشة'},{id:'denim',ar:'جينز'}];
const OCC_F = {sport:1,casual:2.4,travel:2.4,work:3.4,out:3.5,event:4.4};
const WARM_N = new Set(['كريمي','بيج','خاكي','بني','جملي']);
const GREY_N = new Set(['أسود','رمادي','فحمي','فضي','أبيض']);
const BLUE_N = new Set(['كحلي','جينز','سماوي','أزرق']);
const EARTH = new Set(['زيتي','خاكي','جملي','بني','بيج','كريمي','خردلي','برتقالي','عنابي','ذهبي']);
const EARTH_KEY = new Set(['زيتي','خاكي','جملي','خردلي','برتقالي','عنابي','بني']);
const COOL_LOUD = new Set(['أزرق','سماوي','بنفسجي','ليلكي','فوشي','وردي','تركوازي']);
const LOOKS = [
  {id:'quiet',   e:'🤍', ar:'الفخامة الهادئة', d:'ألوان محايدة ناعمة وقصّات نظيفة — ستايل «Quiet Luxury» اللي ماسك التريند.'},
  {id:'tonal',   e:'🎚️', ar:'تون أون تون',     d:'درجات من نفس اللون من فوق لتحت — يطوّلك ويبيّن اللبس مدروس.'},
  {id:'pop',     e:'💥', ar:'محايد + لمسة لون', d:'أساس محايد وقطعة وحدة ملوّنة تخطف العين.'},
  {id:'earth',   e:'🌿', ar:'ألوان الأرض',      d:'زيتي وجملي وبني وبيج — دافية وراقية وماسكة الموسم.'},
  {id:'bw',      e:'🖤', ar:'أبيض وأسود',       d:'تباين كلاسيكي ما يطلع من الموضة.'},
  {id:'sandwich',e:'🥪', ar:'قاعدة الساندويتش', d:'لون الحذاء يعيد لون القطعة الفوقية ويقفل اللوك — حركة الستايلستات.'},
  {id:'smart',   e:'👔', ar:'سمارت كاجوال',     d:'قطعة مرتبة مع قطعة مريحة — أنيق بدون تكلّف.'},
  {id:'street',  e:'🧢', ar:'ستريت ريلاكس',     d:'قصّات واسعة وسنيكرز — مريح وعصري.'},
  {id:'denim',   e:'👖', ar:'دينم × دينم',       d:'جينز على جينز بدرجتين مختلفتين — رجع بقوة.'},
  {id:'bold',    e:'🌈', ar:'ألوان جريئة',       d:'لونين قويين متناسقين على عجلة الألوان — للي يحب يلفت النظر.'},
  {id:'onepiece',e:'✨', ar:'قطعة وحدة أنيقة',   d:'قطعة كاملة مع حذاء وشنطة متناسقين — سهل وفخم.'},
];
const LOOK = Object.fromEntries(LOOKS.map(l=>[l.id,l]));

const KW = [
  ['sport',  /رياض|تراك|جوقر|جوغر|ترنق|ركض|جيم|ليقنز|ليغنز/],
  ['trad',   /ثوب|بشت|عباي|شماغ|غتر|جلابي|قفطان|دراع|كندور|مصر|طرح|نقاب|شيل/],
  ['evening',/سهر|ساتان|ستان|حرير|لامع|ترتر|كعب|مخمل/],
  ['classic',/بليزر|بدل|كوت|معطف|قماش|كلاسيك|لوفر|اكسفورد|أكسفورد|رسمي|ربطة|كرفته/],
  ['street', /هودي|أوفر|اوفر|كارغو|كارجو|جيرسي|كاب|بومبر|سويت/],
  ['smart',  /قميص|شينو|بولو|كارديغ|كارديج|تريكو|بوت|صوف|كتان|موكاسين/],
  ['casual', /سنيكر|جينز|تيشيرت|تي شيرت|شورت|صندل|شبشب/],
];
function guessStyle(it){
  const t=(it.name||'')+' '+(it.tags||[]).join(' ');
  for(const [id,re] of KW) if(re.test(t)) return id;
  return {outer:'smart',acc:'smart'}[it.cat]||'casual';
}
const styleOf = it => it.style||guessStyle(it);
const fitOf = it => it.fit||'regular';
const patOf = it => it.pattern||((colorInfo(it.color).name==='جينز'||/جينز|دنيم/.test(it.name||''))?'denim':'solid');
const isNeu = it => colorInfo(it.color).neutral||patOf(it)==='denim';
const formOf = it => STY[styleOf(it)].f;
function toneGroup(ci){
  if(WARM_N.has(ci.name)) return 'warm'; if(GREY_N.has(ci.name)) return 'grey'; if(BLUE_N.has(ci.name)) return 'blue';
  if(ci.neutral) return 'n:'+ci.name; return null; // loud colours compare by hue
}
function sameTone(a,b){
  const ga=toneGroup(a), gb=toneGroup(b);
  if(ga&&gb) return ga===gb;
  if(!ga&&!gb){ let d=Math.abs(a.h-b.h); if(d>180) d=360-d; return d<26; }
  // loud vs neutral: blue family counts (navy + blue), warm family with mustard/camel-ish hues
  const loud=ga?b:a, g=ga||gb; let h=loud.h;
  return (g==='blue'&&h>195&&h<250)||(g==='warm'&&h>15&&h<50&&loud.s<.7);
}
const sameColor = (a,b) => a.family===b.family || labDist(rgbToLab(...hexToRgb(a.hex)),rgbToLab(...hexToRgb(b.hex)))<20;

function evalLooks(ps,occ){
  const g=c=>ps.find(p=>p.cat===c);
  const top=g('top'), bot=g('bottom'), full=g('full'), outer=g('outer'), shoes=g('shoes'), bag=g('bag');
  const main=ps.filter(p=>['top','bottom','full','outer'].includes(p.cat));
  const core=shoes?[...main,shoes]:main;
  const ci=p=>colorInfo(p.color);
  const louds=ps.filter(p=>!isNeu(p)), loudNames=[...new Set(louds.map(p=>ci(p).name))];
  const coreLoud=core.filter(p=>!isNeu(p));
  const out=[];
  const add=(id,v,why)=>out.push({id,v,why});
  // quiet luxury
  if(core.every(isNeu)&&main.every(p=>['solid','stripe'].includes(patOf(p)))
    &&!core.some(p=>['sport','street'].includes(styleOf(p)))&&main.filter(p=>ci(p).name==='أسود').length<=1
    &&core.some(p=>WARM_N.has(ci(p).name)||ci(p).name==='كحلي'))
    add('quiet',main.some(p=>patOf(p)==='denim')?.7:1,'كل القطع محايدة وما فيها شعارات ولا نقشات');
  // tonal / co-ord
  if(main.length>=2&&main.every(p=>sameTone(ci(p),ci(main[0])))){
    const ls=main.map(p=>ci(p).l), spread=Math.max(...ls)-Math.min(...ls);
    if(!(toneGroup(ci(main[0]))==='grey'&&spread>.5))
    add('tonal',spread>=.12?1:.75,spread>=.12?'درجات فاتحة وغامقة من نفس اللون':'طقم بنفس اللون (co-ord) — من أقوى الترندات');
  }
  // neutral + pop of colour
  if(loudNames.length===1&&louds.length<=2&&core.length>=2){
    const p=louds[0], where={bag:'الشنطة',shoes:'الحذاء',acc:'الإكسسوار',outer:'الجاكيت'}[p.cat];
    add('pop',1,where?`لمسة ${loudNames[0]} في ${where} والباقي محايد`:`اللون ${loudNames[0]} نجم اللوك والباقي يخدمه`);
  }
  // earth tones
  const earthN=[...core,...(bag?[bag]:[])].filter(p=>EARTH.has(ci(p).name)).length;
  if(earthN>=3&&!ps.some(p=>COOL_LOUD.has(ci(p).name))&&ps.some(p=>EARTH_KEY.has(ci(p).name)))
    add('earth',1,'ألوان دافية من الطبيعة متناسقة مع بعض');
  // black & white
  if(core.length>=2&&core.every(p=>GREY_N.has(ci(p).name))&&core.some(p=>ci(p).l<.3)&&core.some(p=>ci(p).l>.75))
    add('bw',1,'أبيض وأسود بتباين واضح');
  // sandwich rule
  const upper=outer||top;
  if(shoes&&upper&&bot&&sameColor(ci(shoes),ci(upper))&&!sameColor(ci(bot),ci(upper))&&Math.abs(ci(bot).l-ci(upper).l)>.18)
    add('sandwich',1,`الحذاء ${ci(shoes).name} مثل ${upper===outer?'الجاكيت':'القطعة الفوقية'} — يربط اللوك ببعضه`);
  // smart casual
  if((top||full||outer)&&[top,outer,full].some(p=>p&&['smart','classic'].includes(styleOf(p)))
    &&!(bot&&styleOf(bot)==='sport')&&!(shoes&&styleOf(shoes)==='sport')){
    const f=core.reduce((s,p)=>s+formOf(p),0)/core.length;
    if(f>=2.7&&f<=4.1){
      const blazerSneaker=outer&&styleOf(outer)==='classic'&&shoes&&['casual','street'].includes(styleOf(shoes));
      add('smart',blazerSneaker?1:.85,blazerSneaker?'جاكيت رسمي مع حذاء كاجوال — أنيق وعصري':'توازن بين المرتّب والمريح');
    }
  }
  // street
  if((top||outer)&&[top,outer].some(p=>p&&(fitOf(p)==='loose'||styleOf(p)==='street'))
    &&(!shoes||['casual','street','sport'].includes(styleOf(shoes)))
    &&bot&&(fitOf(bot)==='loose'||patOf(bot)==='denim'||styleOf(bot)==='street')&&['casual','out','travel'].includes(occ))
    add('street',1,'قصّات مريحة وواسعة مع حذاء كاجوال');
  // denim on denim
  const den=main.filter(p=>patOf(p)==='denim');
  if(den.length>=2){ const d=Math.abs(ci(den[0]).l-ci(den[1]).l); add('denim',d>=.08?1:.35,d>=.08?'جينز بدرجتين مختلفتين':'نفس درجة الجينز — يفضل درجتين مختلفة'); }
  // bold colour
  if(loudNames.length===2&&['out','event','casual'].includes(occ)){
    const a=ci(coreLoud[0]||louds[0]), b=louds.map(ci).find(c=>c.name!==a.name);
    if(b){ const h=harmony(a,b); if(h.k!=='clash'&&h.k!=='mono') add('bold',.8,`${a.name} مع ${b.name} ${h.k==='comp'?'ألوان متكاملة':'ألوان متجاورة'} على عجلة الألوان`); }
  }
  // one-piece
  if(full&&shoes&&(!bag||isNeu(bag)||sameColor(ci(bag),ci(shoes)))&&core.filter(p=>p!==full).every(p=>isNeu(p)||sameTone(ci(p),ci(full))))
    add('onepiece',1,bag&&sameColor(ci(bag),ci(shoes))?'الشنطة والحذاء نفس اللون — لمسة فخمة':'القطعة الكاملة هي البطل والباقي ناعم');
  return out.sort((a,b)=>b.v-a.v);
}

function taste(){ if(!S.set.taste) S.set.taste={looks:{},pairs:{}}; return S.set.taste; }
const pairKey=(a,b)=>a<b?a+'|'+b:b+'|'+a;
async function learn(pieces,look,w=1){
  const t=taste(); if(look) t.looks[look]=(t.looks[look]||0)+w;
  const ids=pieces.map(p=>p.id);
  for(let i=0;i<ids.length;i++) for(let j=i+1;j<ids.length;j++){ const k=pairKey(ids[i],ids[j]); t.pairs[k]=(t.pairs[k]||0)+w; }
  await saveSet();
}

function scoreOutfit(ps,{occ,wx,bonus,ignoreRecent}){
  const g=c=>ps.find(p=>p.cat===c), top=g('top'), bot=g('bottom'), shoes=g('shoes');
  const main=ps.filter(p=>['top','bottom','full','outer'].includes(p.cat)), core=shoes?[...main,shoes]:main;
  const ci=p=>colorInfo(p.color); let s=0; const why=[];
  // colour basics
  for(let i=0;i<core.length;i++) for(let j=i+1;j<core.length;j++){
    const h=harmony(ci(core[i]),ci(core[j])); s+=h.s*.45; if(h.k==='clash') s-=1.2; }
  const louds=new Set(ps.filter(p=>!isNeu(p)).map(p=>ci(p).name));
  if(louds.size>2) s-=2.5*(louds.size-2);
  if(top&&bot){ const a=ci(top),b=ci(bot); if(Math.abs(a.l-b.l)<.06&&a.name!==b.name) s-=1;
    else if(Math.abs(a.l-b.l)>.3) why.push('تباين حلو بين فوق وتحت'); }
  // patterns: one statement at a time
  const pats=main.filter(p=>!['solid','denim'].includes(patOf(p)));
  if(pats.length>1) s-=3; else if(pats.length===1&&main.length>1) why.push(`النقشة وحدة (${PATTERNS.find(x=>x.id===patOf(pats[0])).ar}) والباقي سادة`);
  // formality fits the occasion and pieces agree with each other
  if(core.length){
    const fs=core.map(formOf), avg=fs.reduce((a,b)=>a+b,0)/fs.length;
    if(occ&&OCC_F[occ]!=null){ const tg=OCC_F[occ]; s-=Math.abs(avg-tg)*1.5;
      for(const f of fs) if(f<tg-1.8) s-=1.2; }
    if(Math.max(...fs)-Math.min(...fs)>2.6) s-=1.2;
    if(occ==='sport'&&shoes&&styleOf(shoes)!=='sport') s-=1.5;
  }
  // proportions
  if(top&&bot){ const a=fitOf(top),b=fitOf(bot);
    if((a==='loose'&&b==='slim')||(a==='slim'&&b==='loose')){ s+=.4; why.push('واسع مع ضيق — توازن في القصّات'); }
    else if(a==='slim'&&b==='slim') s-=.2; }
  // personal signals
  const t=taste();
  for(const p of ps){
    if(p.fav) s+=.4;
    if(!ignoreRecent){ const d=daysSince(p.lastWorn); if(d<3) s-=1.6; else if(d<7) s-=.6; }
    if(occ&&p.occs&&p.occs.includes(occ)) s+=.5;
    const sea=(p.seasons||['all'])[0]; if((wx==='cold'&&sea==='winter')||(wx==='hot'&&sea==='summer')) s+=.3;
    if(bonus&&bonus.has(p.id)) s+=1.4;
  }
  if(wx==='mild'&&ps.some(p=>p.cat==='outer')) s-=.5;
  for(let i=0;i<ps.length;i++) for(let j=i+1;j<ps.length;j++){ const n=t.pairs[pairKey(ps[i].id,ps[j].id)]; if(n) s+=.25*Math.min(3,n); }
  // trend looks
  const looks=evalLooks(ps,occ);
  if(looks[0]) s+=3*looks[0].v+.12*Math.log1p(t.looks[looks[0].id]||0)*3;
  if(looks[1]) s+=.6*looks[1].v;
  return {s,looks,why};
}

function bestAddOn(ps,list,opt){
  if(!list.length) return null;
  let best=null, bs=scoreOutfit(ps,opt).s+.15; // an add-on must earn its place
  for(const a of list){ const r=scoreOutfit([...ps,a],opt).s; if(r>bs){ bs=r; best=a; } }
  return best;
}

function generate(opt={}){
  const occ=opt.occ===undefined?S.occ:opt.occ, wx=opt.wx??S.wx, lockIds=opt.locks??S.locks, n=opt.n??6, want=opt.look??S.look;
  const sopt={occ,wx,bonus:opt.bonus,ignoreRecent:opt.ignoreRecent};
  const P={}; CATS.forEach(c=>P[c.id]=S.items.filter(i=>i.cat===c.id&&fits(i,occ,wx)));
  const L={}; for(const [c,id] of Object.entries(lockIds)){ const it=byId(id); if(it) L[c]=it; }
  const cores=[];
  if(L.full) cores.push([L.full]);
  else {
    if(!L.top&&!L.bottom) P.full.forEach(f=>cores.push([f]));
    const T=L.top?[L.top]:P.top, Bo=L.bottom?[L.bottom]:P.bottom;
    for(const t of T) for(const b of Bo) cores.push([t,b]);
  }
  if(!cores.length) return [];
  const outers=L.outer?[L.outer]:wx==='cold'?(P.outer.length?P.outer:[null]):wx==='mild'?[null,...P.outer]:[null];
  const shoes=L.shoes?[L.shoes]:P.shoes.length?P.shoes:[null];
  const total=cores.length*outers.length*shoes.length, combos=[];
  if(total<=3500){ for(const c of cores) for(const o of outers) for(const sh of shoes) combos.push([...c,o,sh].filter(Boolean)); }
  else for(let k=0;k<3500;k++) combos.push([...pick(cores),pick(outers),pick(shoes)].filter(Boolean));
  const recent=new Set(Object.values(S.plans).filter(p=>p.worn&&daysSince(parseYmd(p.date).getTime())<10).map(p=>[...p.ids].sort().join('|')));
  const shown=opt.ignoreRecent?new Set():(S.shown||new Set());
  const wantK=o=>(want&&want!=='all'&&o.r.looks.some(l=>l.id===want&&l.v>=.5))?100:0;
  let scored=combos.map(ps=>({ps,r:scoreOutfit(ps,sopt)})).sort((a,b)=>(wantK(b)+b.r.s)-(wantK(a)+a.r.s)).slice(0,90);
  // finish the best ones with the bag / accessory that improve them most
  const res=new Map();
  for(const {ps} of scored){
    let full=[...ps];
    const bag=L.bag||bestAddOn(full,P.bag,sopt); if(bag) full.push(bag);
    const acc=L.acc||bestAddOn(full,P.acc,sopt); if(acc) full.push(acc);
    const key=full.map(p=>p.id).sort().join('|'); if(res.has(key)) continue;
    const r=scoreOutfit(full,sopt);
    if(!opt.ignoreRecent&&recent.has(key)) r.s-=3;
    if(opt.avoid&&opt.avoid.has(key)) r.s-=4;
    if(shown.has(key)) r.s-=1.2;
    r.s+=Math.random()*.35;
    res.set(key,{pieces:full,key,...r,look:r.looks[0]?r.looks[0].id:null});
  }
  let list=[...res.values()].sort((a,b)=>b.s-a.s);
  if(want&&want!=='all'){ const f=list.filter(o=>o.looks.some(l=>l.id===want&&l.v>=.5)); f.forEach(o=>o.look=want); list=f; }
  // variety: best outfit of each look first, avoid near-duplicates
  const out=[], usedLook=new Set();
  const similar=o=>out.some(x=>x.pieces.filter(p=>p.cat!=='shoes'&&p.cat!=='bag'&&p.cat!=='acc'&&o.pieces.some(q=>q.id===p.id)).length>=2);
  for(const o of list){ if(out.length>=n) break; if(o.look&&!usedLook.has(o.look)&&!similar(o)){ out.push(o); usedLook.add(o.look); } }
  for(const o of list){ if(out.length>=n) break; if(!out.includes(o)&&!similar(o)) out.push(o); }
  for(const o of list){ if(out.length>=n) break; if(!out.includes(o)) out.push(o); }
  out.sort((a,b)=>b.s-a.s);
  return out;
}
function fits(it,occ,wx){
  if(it.laundry||it.out||it.wish) return false;
  if(it.occs&&it.occs.length&&occ&&!it.occs.includes(occ)) return false;
  const sea=(it.seasons||['all'])[0];
  if(wx==='hot'&&sea==='winter') return false;
  if(wx==='cold'&&sea==='summer'&&(it.cat==='outer'||it.cat==='shoes')) return false;
  return true;
}
function explain(o){
  const parts=[], l=o.look&&LOOK[o.look], lv=o.looks.find(x=>x.id===o.look);
  if(lv) parts.push(lv.why);
  o.looks.filter(x=>x.id!==o.look&&x.v>=.75).slice(0,1).forEach(x=>parts.push(`وفيه بعد لمسة «${LOOK[x.id].ar}»`));
  parts.push(...o.why.slice(0,1));
  if(o.pieces.some(p=>p.cat==='outer')&&S.wx==='cold') parts.push('أضفت طبقة خارجية عشان البرد');
  const fresh=o.pieces.filter(p=>!p.wears).length; if(fresh&&S.items.some(i=>i.wears)) parts.push(fresh===1?'وفيه قطعة ما لبستها قبل — فرصتها':`وفيه ${fresh} قطع ما لبستها قبل`);
  return {title:l?`${l.e} ${l.ar}`:'✨ تنسيق متوازن', desc:l?l.d:'ألوان متناسقة وقطع تمشي مع بعض.', points:parts.slice(0,3)};
}
const starsOf = s => { const n=s>=9.2?5:s>=7.6?4:s>=5.8?3:2; return '★'.repeat(n)+'☆'.repeat(5-n); };

/* ---------------- wear tracking (plans are the source of truth) ---------------- */
async function recomputeWear(){
  const w={}, last={};
  for(const p of Object.values(S.plans)) if(p.worn) for(const id of p.ids){ w[id]=(w[id]||0)+1; const t=parseYmd(p.date).getTime(); if(!last[id]||t>last[id]) last[id]=t; }
  const changed=[];
  for(const it of S.items){ const nw=w[it.id]||0, nl=last[it.id]||0; if(it.wears!==nw||it.lastWorn!==nl){ it.wears=nw; it.lastWorn=nl; changed.push(it); } }
  if(changed.length) await DB.putMany('items',changed);
}
async function setPlan(date,ids,layout,worn){
  const p={date,ids:[...ids],layout:layout||null,worn:!!worn};
  S.plans[date]=p; await DB.put('plans',p); await recomputeWear(); return p;
}
async function removePlan(date){ delete S.plans[date]; await DB.del('plans',date); await recomputeWear(); }
async function saveOutfit(ids,layout,extra={}){
  const key=[...ids].sort().join('|');
  let o=S.outfits.find(x=>x.key===key);
  if(o){ Object.assign(o,{layout:layout||o.layout},extra); }
  else { o={id:uid(),key,ids:[...ids],layout:layout||null,occ:S.occ,created:Date.now(),...extra}; S.outfits.push(o); }
  await DB.put('outfits',o); return o;
}

/* =====================================================================
   VIEWS
   ===================================================================== */
const TITLES = {
  closet:['خزانتي',()=>`${S.items.length} قطعة`],
  outfits:['أوتفتات',()=>S.oTab==='style'?'تنسيق ذكي حسب الجو والمناسبة':`${S.outfits.length} أوتفت محفوظ`],
  plan:['التقويم',()=>S.pTab==='cal'?'خطط لبسك وتابع وش لبست':'جهّز شنطة السفر'],
  stats:['إحصائيات',()=>'اعرف خزانتك أكثر'],
};
function render(){
  $('title').textContent=TITLES[S.view][0]; $('subtitle').textContent=TITLES[S.view][1]();
  ({closet:renderCloset,outfits:renderOutfits,plan:renderPlan,stats:renderStats})[S.view]();
}
function go(v){
  S.view=v; document.body.classList.toggle('home',v==='closet'); ['closet','outfits','plan','stats'].forEach(x=>$('v-'+x).classList.toggle('hidden',x!==v));
  document.querySelectorAll('nav .t').forEach(t=>t.classList.toggle('on',t.dataset.v===v));
  render(); window.scrollTo(0,0);
}
document.querySelectorAll('nav .t').forEach(t=>t.onclick=()=>go(t.dataset.v));

/* ---------------- closet ---------------- */
function closetList(){
  const C=S.closet, q=C.q.trim();
  let l=S.items.filter(i=>(C.cat==='all'||i.cat===C.cat)&&(!C.laundry||i.laundry)&&(!C.color||colorInfo(i.color).family===C.color));
  if(q) l=l.filter(i=>[i.name,i.brand,i.size,(i.tags||[]).join(' '),CAT[i.cat].ar,colorInfo(i.color).name,i.color2&&colorInfo(i.color2).name].join(' ').includes(q));
  const srt={new:(a,b)=>b.added-a.added,most:(a,b)=>(b.wears||0)-(a.wears||0),least:(a,b)=>(a.wears||0)-(b.wears||0)||(a.lastWorn||0)-(b.lastWorn||0),
    price:(a,b)=>(+b.price||0)-(+a.price||0),color:(a,b)=>colorInfo(a.color).h-colorInfo(b.color).h}[C.sort];
  return l.sort(srt);
}
const pct = s => clamp(Math.round(62+(s-4)*5.5),55,99);
function greeting(){ const h=new Date().getHours(); return h<12?'صباح الخير ☀️':h<18?'يومك سعيد 🌤️':'مساء الخير 🌙'; }
function canStyle(){ const has=c=>S.items.some(i=>i.cat===c&&!i.laundry); return (has('top')&&has('bottom'))||has('full'); }
function heroHTML(){
  if(!canStyle()) return '';
  const valid=o=>o&&o.pieces.every(p=>S.items.includes(p)&&!p.laundry);
  if(!S.hero||S.hero.day!==today()||!valid(S.hero.o)){
    if(!S.wxManual) S.wx=wxFor(today());
    const r=generate({n:1,look:'all',locks:{}}); S.hero=r[0]?{day:today(),o:r[0]}:null; }
  if(!S.hero) return '';
  const o=S.hero.o, ex=explain(o), w=WXM[S.wx];
  return `<button class="hero" id="heroBtn"><div class="tx"><span class="kick">أوتفت اليوم · ${w.e} ${w.ar}</span>
    <b>${ex.title.replace(/^\S+\s/,'')}</b><span class="sm">${OCC[S.occ].ar} · تناسق ${pct(o.s)}%</span><span class="go">شوفه</span></div>
    ${boardHTML(autoLayout(sortPieces(o.pieces)))}</button>`;
}
const CAT_IC = {
  top:'<path d="M8 4 4 6.5 5.5 10 7 9.4V20h10V9.4l1.5.6L20 6.5 16 4c-.6 1.4-2.1 2.3-4 2.3S8.6 5.4 8 4z"/>',
  bottom:'<path d="M7 3h10l1 18h-4.5L12 9.5 10.5 21H6z"/>',
  full:'<path d="M9.5 3h5l-.8 4 4.3 13H6l4.3-13z"/>',
  outer:'<path d="M8 3.5 4 6v14h5V12M16 3.5 20 6v14h-5V12M8 3.5 12 8l4-4.5M12 8v12"/>',
  shoes:'<path d="M3 16.5V9l4.5 1.5L11 13l6 1.5c2.2.5 4 1.6 4 3.5H3z"/>',
  bag:'<path d="M5 9h14l-1 11H6zM9 9V7a3 3 0 0 1 6 0v2"/>',
  acc:'<circle cx="12" cy="12" r="5"/><path d="M9.5 7.5 10 3h4l.5 4.5M9.5 16.5 10 21h4l.5-4.5"/>',
  all:'<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
};
const catSvg = id => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">${CAT_IC[id]}</svg>`;
function profileHTML(){
  const worn=Object.values(S.plans).filter(p=>p.worn).length, saved=S.outfits.filter(o=>o.ids.some(byId)).length;
  const nm=S.set.name||'Closia', av=S.set.avatar;
  return `<div class="profile">
    <div class="cover" ${S.set.cover?`style="background-image:url('${S.set.cover}')"`:''}>
      <button class="cbtn" id="pCover" aria-label="غيّر الغلاف">${IC.edit}</button>
      <button class="cbtn" id="pSet" aria-label="الإعدادات"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg></button>
    </div>
    <div class="pcard">
      <button class="avatar" id="pAv" aria-label="صورتك">${av?`<img src="${av}" alt="">`:`<span>${esc(nm.trim()[0]||'خ')}</span>`}</button>
      <button class="pname" id="pName">${esc(nm)}</button>
      <div class="handle">${greeting()}</div>
      <div class="ptabs" id="pTabs">
        <button class="${S.closet.tab!=='outfits'?'on':''}" data-t="items"><b>${S.items.length}</b><span>قطعة</span></button>
        <button class="${S.closet.tab==='outfits'?'on':''}" data-t="outfits"><b>${saved}</b><span>أوتفت</span></button>
        <button data-t="wears"><b>${worn}</b><span>لبسة</span></button>
      </div>
    </div></div>`;
}
function renderCloset(){
  const v=$('v-closet'), C=S.closet, items=S.items;
  const isIOS=/iP(hone|ad|od)/.test(navigator.userAgent), standalone=navigator.standalone||matchMedia('(display-mode: standalone)').matches;
  const tip = isIOS&&!standalone&&!S.set.tipClosed ? `<div class="banner"><span>📲</span><span>ثبّته كتطبيق: زر <b>المشاركة</b> في سفاري ← <b>«إضافة إلى الشاشة الرئيسية»</b></span><button class="x" id="tipX">✕</button></div>` : '';
  let body='';
  if(!items.length){
    body=`<div class="empty"><div class="big">👕</div><h3>ابدأ بخزانتك</h3>
      <p class="hint">صوّر قطعة قطعة — الذكاء الاصطناعي يشيل الخلفية ويعرف اللون والنوع.</p>
      <button class="btn primary" style="margin-top:14px" onclick="addSheet()">أضف أول قطعة</button></div>`;
  } else if(C.tab==='outfits'){
    const list=[...S.outfits].filter(o=>o.ids.some(byId)).sort((a,b)=>b.created-a.created);
    body=`<div class="ogrid" id="cOutfits"><button class="newcard" id="cNewO">${IC.plus}سوّ أوتفت بنفسك</button>
      ${list.map(o=>`<button class="oc" data-id="${o.id}">${boardHTML(layoutOf(o))}</button>`).join('')}</div>`;
  } else {
    const count=c=>items.filter(i=>i.cat===c).length;
    const latest=c=>items.filter(i=>i.cat===c).sort((a,b)=>b.added-a.added)[0];
    const fams=[...new Set(items.map(i=>colorInfo(i.color).family))];
    const laundryN=items.filter(i=>i.laundry).length;
    const list=closetList();
    body=`${heroHTML()}
      <div class="cats" id="ccats"><button class="cat ${C.cat==='all'?'on':''}" data-v="all"><span class="c">${catSvg('all')}</span>الكل</button>
        ${CATS.filter(c=>count(c.id)).map(c=>{ const it=latest(c.id); return `<button class="cat ${C.cat===c.id?'on':''}" data-v="${c.id}">
          <span class="c ${it?'ph':''}">${it?`<img src="${it.img}" alt="">`:catSvg(c.id)}<span class="n">${count(c.id)}</span></span>${c.ar}</button>`; }).join('')}</div>
      <div class="search">${IC.search}<input id="cq" type="search" placeholder="ابحث: اسم، ماركة، لون، تاق…" value="${esc(C.q)}">
        <select id="csort">${[['new','الأحدث'],['most','الأكثر لبس'],['least','الأقل لبس'],['price','السعر'],['color','اللون']].map(([k,t])=>`<option value="${k}" ${C.sort===k?'selected':''}>${t}</option>`).join('')}</select></div>
      <div class="chips" id="ccols" style="margin-top:-4px">
        ${laundryN?`<button class="chip ${C.laundry?'on':''}" data-l="1">🧺 بالغسيل <span class="n">${laundryN}</span></button>`:''}
        ${fams.map(f=>`<button class="chip dotchip ${C.color===f?'on':''}" data-c="${f}" aria-label="${esc(colorInfo(f).name)}"><span class="sw" style="background:${f}"></span></button>`).join('')}</div>
      ${list.length?`<div class="grid" id="cgrid">${list.map(tileHTML).join('')}</div>`:`<div class="empty"><h3>ما فيه نتائج</h3><p class="hint">جرّب فلتر ثاني.</p></div>`}`;
  }
  v.innerHTML=profileHTML()+(items.length?quickActionsHTML():'')+tip+body;
  bindQuickActions();
  // profile
  $('pSet').onclick=()=>$('settingsBtn').click();
  $('pAv').onclick=()=>pickProfileImg('avatar',256);
  $('pCover').onclick=()=>pickProfileImg('cover',900);
  $('pName').onclick=async()=>{ const n=prompt('وش اسمك؟',S.set.name||''); if(n===null) return; S.set.name=n.trim(); await saveSet(); renderCloset(); };
  $('pTabs').onclick=e=>{ const b=e.target.closest('[data-t]'); if(!b) return; if(b.dataset.t==='wears'){ S.pTab='cal'; go('plan'); return; } C.tab=b.dataset.t; renderCloset(); };
  if($('heroBtn')) $('heroBtn').onclick=()=>{ const o=S.hero.o; S.locks={}; S.look='all'; S.planDate=null;
    S.results=[o,...generate().filter(x=>x.key!==o.key)].slice(0,6); S.idx=0; S.oTab='style'; go('outfits'); };
  if($('cNewO')) $('cNewO').onclick=()=>createOutfitSheet();
  if($('cOutfits')) $('cOutfits').onclick=e=>{ const c=e.target.closest('.oc'); if(c) outfitSheet(S.outfits.find(o=>o.id===c.dataset.id)); };
  if($('cq')){
    $('cq').oninput=e=>{ C.q=e.target.value; const l=closetList(); const g=$('cgrid'); if(g) g.innerHTML=l.map(tileHTML).join(''); else renderCloset(); };
    $('csort').onchange=e=>{ C.sort=e.target.value; renderCloset(); };
    $('ccats').onclick=e=>{ const b=e.target.closest('[data-v]'); if(!b) return; C.cat=b.dataset.v; renderCloset(); };
    $('ccols').onclick=e=>{ const b=e.target.closest('button'); if(!b) return;
      if(b.dataset.l) C.laundry=!C.laundry; else C.color=C.color===b.dataset.c?null:b.dataset.c; renderCloset(); };
  }
  v.onclick=e=>{ const t=e.target.closest('.tile'); if(t) itemSheet(byId(t.dataset.id)); };
  if($('tipX')) $('tipX').onclick=async()=>{ S.set.tipClosed=true; await saveSet(); renderCloset(); };
}
function pickProfileImg(key,max){
  const inp=document.createElement('input'); inp.type='file'; inp.accept='image/*';
  inp.onchange=async()=>{ const f=inp.files[0]; if(!f) return; const u=URL.createObjectURL(f);
    try{ const im=await loadImg(u); let c=srcFromImage(im,max);
      if(key==='avatar'){ const s=Math.min(c.width,c.height), q=mkCanvas(s,s); q.getContext('2d').drawImage(c,(c.width-s)/2,(c.height-s)/2,s,s,0,0,s,s); c=q; }
      S.set[key]=c.toDataURL('image/jpeg',.82); await saveSet(); renderCloset(); }catch(e){ toast('ما قدرت أقرأ الصورة'); }
    URL.revokeObjectURL(u); };
  inp.click();
}
function tileHTML(i){
  return `<button class="tile ${i.laundry?'laundry':''}" data-id="${i.id}"><img src="${i.img}" class="${i.cut?'':'full'}" alt="" loading="lazy">
    <span class="dot" style="background:${i.color}"></span>
    <span class="badges">${i.fav?'<span>★</span>':''}${i.laundry?'<span>🧺</span>':''}${i.wears?`<span>${i.wears}×</span>`:''}</span></button>`;
}

/* add photos */
function pickPhotos(){ $('fileIn').value=''; $('fileIn').click(); }
// runtime working copies (_src canvas, _alpha mask) for new or saved items
async function ensureWork(it){
  if(it._src) return;
  if(it.src){ const im=await loadImg(it.src); it._src=srcFromImage(im,4000); it._alpha=it.mask?await alphaFromURL(it.mask,it._src.width,it._src.height):null; return; }
  // item saved before v3: only the final picture exists
  const im=await loadImg(it.img), w=im.naturalWidth, h=im.naturalHeight, c=mkCanvas(w,h); c.getContext('2d').drawImage(im,0,0);
  let a=null; if(it.cut){ const d=ctx2d(c).getImageData(0,0,w,h).data; a=new Uint8ClampedArray(w*h); for(let i=0;i<a.length;i++) a[i]=d[i*4+3]; }
  const s=mkCanvas(w,h), sx=s.getContext('2d'); sx.fillStyle='#fff'; sx.fillRect(0,0,w,h); sx.drawImage(c,0,0);
  Object.assign(it,{_src:s,_alpha:a,enh:false,bright:0,useCut:!!a});
}
function recompose(it){
  const r=compose(it._src,it._alpha,{auto:it.enh!==false,bright:it.bright||0,useCut:it.useCut!==false});
  it.img=r.img; it.ar=r.ar; it.cut=r.cut; if(it._colorAuto){ it.color=r.color; it.color2=r.color2; }
}
// Turn picture blobs into draft items (AI cut-out → editor). meta pre-fills fields.
async function intake(sources,opts={}){
  const drafts=[]; let aiOk=S.set.aiBg!==false, aiFailed=false;
  for(let n=0;n<sources.length;n++){
    const {blob,meta={}}=sources[n], lbl=sources.length>1?` (${n+1} / ${sources.length})`:'';
    busy(true,(aiOk?'✨ أشيل الخلفية بالذكاء الاصطناعي…':'أشيل الخلفية وأعرف اللون…')+lbl);
    await new Promise(r=>setTimeout(r,30));
    const u=URL.createObjectURL(blob);
    try{
      const im=await loadImg(u), src=srcFromImage(im); let alpha=null, kind=null;
      if(aiOk){ try{ alpha=await aiAlpha(src,p=>busy(true,`أنزّل محرك الذكاء الاصطناعي — مرة وحدة بس… ${Math.round(p*100)}%`)); kind='ai'; }
        catch(err){ console.warn('AI background removal failed',err); aiOk=false; aiFailed=true; } }
      if(!alpha){ busy(true,'أشيل الخلفية وأعرف اللون…'+lbl); await new Promise(r=>setTimeout(r,20)); alpha=classicAlpha(src); kind=alpha?'classic':null; }
      const it={id:uid(),_src:src,_alpha:alpha,_colorAuto:true,maskKind:kind,enh:!meta.store,bright:0,useCut:!!alpha,
        name:meta.name||'',brand:meta.brand||'',price:meta.price||'',size:'',tags:[],seasons:['all'],occs:[],fav:false,laundry:false,wears:0,lastWorn:0,added:Date.now()+n,
        ...(meta.url?{url:meta.url}:{}),...(opts.wish?{wish:true}:{})};
      recompose(it);
      it.cat=meta.cat||(S.closet.cat!=='all'&&CAT[S.closet.cat]?S.closet.cat:(it.ar<.75?'shoes':it.ar>1.45?'bottom':'top'));
      drafts.push(it);
    }catch(err){ console.warn(err); }
    URL.revokeObjectURL(u);
  }
  busy(false);
  if(aiFailed) toast('الذكاء الاصطناعي يحتاج نت أول مرة — استخدمت الطريقة السريعة');
  if(drafts.length) editItem(drafts,0,true); else toast('ما قدرت أقرأ الصورة');
}
$('fileIn').addEventListener('change',e=>{ const f=[...e.target.files]; if(f.length) intake(f.map(blob=>({blob}))); });

async function pasteImage(fromLink){
  const meta=fromLink===true?(S._linkMeta||{}):{}, wish=fromLink===true&&S._linkWish;
  try{
    const items=await navigator.clipboard.read();
    for(const it of items){ const t=it.types.find(x=>x.startsWith('image/')); if(t){ closeSheet(); return intake([{blob:await it.getType(t),meta}],{wish}); } }
    for(const it of items) if(it.types.includes('text/plain')){ const tx=(await (await it.getType('text/plain')).text()).trim(); if(splitShare(tx).url) return linkSheet(tx,wish); }
    toast('ما فيه صورة منسوخة — اضغط مطوّل على أي صورة واختر «نسخ»');
  }catch(e){ toast('اضغط «لصق» لما يطلب منك، أو انسخ صورة أول'); }
}
function linkSheet(pre='',wish=false){
  S._linkWish=wish; S._linkMeta=null;
  openSheet(`<h2>${wish?'🤍 أضف للأمنيات':'من رابط منتج'}</h2>
    <p class="hint" style="margin-top:-6px">افتح المنتج في أي متجر (زارا، نمشي، شي إن، H&M…) ← زر المشاركة ← <b>نسخ الرابط</b>، والصقه هنا.</p>
    <div class="row" style="margin:12px 0"><textarea class="inp" id="lUrl" rows="2" dir="ltr" placeholder="الصق الرابط أو نص المشاركة كامل" style="flex:1;resize:none">${esc(pre)}</textarea>
      <button class="btn" id="lPaste" style="flex:none">لصق</button></div>
    <button class="btn primary block" id="lGo">جيب الصور</button>
    <div id="lRes"></div>`);
  $('lPaste').onclick=async()=>{ try{ $('lUrl').value=(await navigator.clipboard.readText()).trim(); }catch(e){ toast('الصق بالضغط المطوّل على الخانة'); } };
  $('lGo').onclick=()=>loadLink($('lUrl').value.trim());
  if(pre) loadLink(pre);
}
const IMG_PROXY=(u,w)=>`https://wsrv.nl/?url=${encodeURIComponent(u)}&w=${w}&h=${w}&fit=inside&output=jpg&q=90`;
const PAGE_PROXIES=[u=>u, u=>'https://api.allorigins.win/raw?url='+encodeURIComponent(u), u=>'https://corsproxy.io/?url='+encodeURIComponent(u)];
async function fetchTimeout(u,ms=15000){ const c=new AbortController(), t=setTimeout(()=>c.abort(),ms); try{ return await fetch(u,{signal:c.signal}); } finally{ clearTimeout(t); } }
async function fetchPage(u){
  for(const p of PAGE_PROXIES){ try{ const r=await fetchTimeout(p(u)); if(r.ok){ const t=await r.text(); if(t.length>120) return t; } }catch(e){} }
  throw new Error('page');
}
async function fetchImageBlob(u){
  for(const src of [IMG_PROXY(u,1400),u]){ try{ const r=await fetchTimeout(src,20000); if(r.ok){ const b=await r.blob(); if(b.type.startsWith('image/')&&b.size>800) return b; } }catch(e){} }
  throw new Error('image');
}
function catFromText(t){
  t=(t||'').toLowerCase();
  const R=[['shoes',/shoe|sneaker|boot|heel|sandal|loafer|trainer|mule|slipper|حذاء|جزم|كعب|صندل|سنيكر|بوت|نعال|شبشب/],
    ['bag',/\bbag|tote|clutch|backpack|purse|crossbody|شنط|حقيب/],
    ['full',/dress|jumpsuit|abaya|thobe|kaftan|playsuit|romper|فستان|عباي|ثوب|جمبسوت|قفطان|جلابي/],
    ['outer',/jacket|coat|blazer|cardigan|parka|trench|gilet|bomber|overshirt|جاكيت|معطف|بليزر|كارديغ|كارديج|كوت|بشت/],
    ['bottom',/jeans?\b|trousers?|pants|skirt|shorts\b|leggings|chinos?|cargo|joggers?|بنطلون|جينز|تنور|شورت|سروال/],
    ['acc',/watch|sunglass|belt|\bhat\b|\bcap\b|scarf|earring|necklace|bracelet|\bring\b|beanie|ساعة|نظار|حزام|قبع|كاب|وشاح|حلق|سلسال|اسوار|أسوار|خاتم|شماغ|طرح/],
    ['top',/shirt|tee\b|t-shirt|\btop\b|blouse|sweater|hoodie|sweatshirt|polo|knit|tank|cami|jumper|قميص|تيشيرت|تي شيرت|بلوز|هودي|سويتر|كنزة|بولو|توب/]];
  for(const [c,re] of R) if(re.test(t)) return c; return null;
}
function parseProduct(html,base){
  const doc=new DOMParser().parseFromString(html,'text/html');
  const abs=x=>{ try{ return new URL(x,base).href.replace(/^http:/,'https:'); }catch(e){ return null; } };
  const imgs=[]; const push=x=>{ if(!x) return; if(Array.isArray(x)) return x.forEach(push);
    if(typeof x==='object') return push(x.url||x.contentUrl||x['@id']);
    const a=abs(String(x).trim()); if(a&&/^https:/.test(a)&&!/\.svg(\?|$)|sprite|logo|icon|placeholder|payment|flag/i.test(a)&&!imgs.includes(a)) imgs.push(a); };
  let name='',brand='',price='',cur='';
  doc.querySelectorAll('script[type="application/ld+json"]').forEach(s=>{ try{
    const walk=o=>{ if(!o||typeof o!=='object') return; if(Array.isArray(o)) return o.forEach(walk); if(o['@graph']) walk(o['@graph']);
      const t=[].concat(o['@type']||[]).join(' ');
      if(/Product/i.test(t)){ name=name||o.name; brand=brand||(o.brand&&(o.brand.name||(typeof o.brand==='string'?o.brand:''))); push(o.image);
        const of=[].concat(o.offers||[])[0]; if(of){ price=price||of.price||of.lowPrice||(of.priceSpecification&&of.priceSpecification.price)||''; cur=cur||of.priceCurrency||''; } }
      if(o.hasVariant) walk(o.hasVariant); };
    walk(JSON.parse(s.textContent)); }catch(e){} });
  const meta=n=>{ const m=doc.querySelector(`meta[property="${n}"],meta[name="${n}"]`); return m&&m.getAttribute('content'); };
  doc.querySelectorAll('meta[property="og:image"],meta[property="og:image:secure_url"],meta[name="twitter:image"]').forEach(m=>push(m.getAttribute('content')));
  if(imgs.length<4) doc.querySelectorAll('img').forEach(im=>{
    let best=im.getAttribute('data-zoom-image')||im.getAttribute('data-src')||im.getAttribute('src');
    const ss=im.getAttribute('srcset')||im.getAttribute('data-srcset');
    if(ss){ const parts=ss.split(',').map(x=>x.trim().split(/\s+/)).filter(p=>p[0]); parts.sort((a,b)=>(parseInt(b[1])||0)-(parseInt(a[1])||0)); if(parts[0]) best=parts[0][0]; }
    if(best&&!/^data:/.test(best)&&/product|media|catalog|cdn|images|files|static/i.test(best)) push(best); });
  name=(name||meta('og:title')||doc.title||'').replace(/\s*[|–-]\s*[^|–-]{2,40}$/,'').trim();
  price=String(price||meta('product:price:amount')||meta('og:price:amount')||'').replace(/[^\d.]/g,'');
  cur=cur||meta('product:price:currency')||meta('og:price:currency')||'';
  brand=String(brand||meta('product:brand')||meta('og:site_name')||'').trim();
  // pages that build the gallery with JavaScript (e.g. SHEIN): scan the raw source for image URLs
  if(imgs.length<3){
    const raw=html.replace(/\\u002F/gi,'/').replace(/\\\//g,'/');
    const re=/(?:https?:)?\/\/[a-z0-9.-]+\.[a-z]{2,}\/[^"'\s()<>\\]+?\.(?:jpe?g|png|webp)(?:\?[^"'\s<>\\]*)?/gi, found=new Map(); let m, n=0;
    while((m=re.exec(raw))&&n++<3000){ let u=m[0]; if(u.startsWith('//')) u='https:'+u;
      if(/sprite|logo|icon|banner|flag|payment|avatar|badge|emoji|\/\d{2}x\d{2}[._]/i.test(u)) continue;
      const key=u.replace(/_thumbnail_\d+x\d*(?=\.)/,'').replace(/_\d{2,4}x\d{2,4}(?=\.)/,'').replace(/\?.*$/,'');
      found.set(key,(found.get(key)||0)+1); }
    const prod=u=>/goods|product|images3_p|catalog|media|\/p\/|item/i.test(u)?1:0;
    [...found.entries()].sort((a,b)=>(prod(b[0])-prod(a[0]))||(b[1]-a[1])).slice(0,16).forEach(e=>push(e[0]));
  }
  return {name:name.slice(0,60),brand:brand.slice(0,40),price,cur,imgs:imgs.slice(0,16)};
}
// Shared text from store apps looks like "Product title… check it out! https://…" — split it.
function splitShare(text){
  const m=String(text||'').match(/https?:\/\/[^\s"'<>،]+/i); if(!m) return {url:null,title:''};
  const url=m[0].replace(/[).,]+$/,'');
  const before=String(text).slice(0,m.index).replace(/(I (just )?(discovered|found)|Check (it|this|them) out|Shop now|اكتشفت|شاهد|تسوق)[^\n]*$/gim,'');
  const title=before.split(/\n/).map(x=>x.trim().replace(/[\s,،-]+$/,'')).filter(Boolean)[0]||'';
  return {url,title:title.slice(0,80)};
}
function brandFromUrl(u){
  try{ const h=new URL(u).hostname.replace(/^www\.|^m\./,'');
    const known={shein:'SHEIN',zara:'ZARA',hm:'H&M','h&m':'H&M',namshi:'Namshi',noon:'noon',mango:'MANGO',bershka:'Bershka',pullandbear:'Pull&Bear',stradivarius:'Stradivarius',uniqlo:'UNIQLO',asos:'ASOS',farfetch:'FARFETCH',ounass:'Ounass',levelshoes:'Level Shoes',amazon:'Amazon',temu:'Temu',nike:'Nike',adidas:'adidas',massimodutti:'Massimo Dutti',cos:'COS',max:'Max','6thstreet':'6thStreet',aldoshoes:'ALDO',charleskeith:'CHARLES & KEITH'};
    for(const k in known) if(h.includes(k)) return known[k]; return ''; }catch(e){ return ''; }
}
async function loadLink(input){
  const box=$('lRes'); if(!box) return;
  const sh=splitShare(input), url=sh.url;
  if(!url){ toast('ما لقيت رابط في النص — انسخ رابط المنتج'); return; }
  S._linkMeta={name:sh.title,brand:brandFromUrl(url),cat:catFromText(sh.title+' '+url),url,store:true};
  box.innerHTML='<div class="spin" style="margin:24px auto"></div><p class="hint" style="text-align:center">أقرأ صفحة المنتج…</p>';
  let p;
  if(/\.(jpe?g|png|webp|avif|gif)(\?|$)/i.test(url)) p={name:'',brand:'',price:'',cur:'',imgs:[url]};
  else { try{ p=parseProduct(await fetchPage(url),url); }catch(e){ p=null; } }
  if(p){ if(!p.name||/^(shein|zara|h&m|noon|namshi)$/i.test(p.name)) p.name=sh.title||p.name; p.brand=p.brand||S._linkMeta.brand; }
  if(!p||!p.imgs.length){
    const m=S._linkMeta;
    box.innerHTML=`<div class="empty" style="padding:22px 8px"><h3>المتجر منع قراءة الصفحة</h3>
      ${m.name?`<div class="lmeta" style="text-align:start"><b>${esc(m.name)}</b><span>${esc(m.brand)} · حفظت الاسم — بس أحتاج الصورة</span></div>`:''}
      <p class="hint" style="margin-top:10px">افتح المنتج في ${esc(m.brand||'المتجر')} ← اضغط مطوّل على صورة المنتج ← <b>نسخ</b>، وارجع اضغط:</p>
      <button class="btn primary" id="lPasteImg" style="margin-top:6px">📋 الصق الصورة</button></div>`;
    $('lPasteImg').onclick=()=>pasteImage(true); return;
  }
  const sel=new Set([0]);
  const draw=()=>{ box.innerHTML=`
    ${p.name?`<div class="lmeta"><b>${esc(p.name)}</b><span>${esc([p.brand,p.price&&(p.price+' '+(p.cur||''))].filter(Boolean).join(' · '))}</span></div>`:''}
    <div class="lbl" style="margin-top:12px">اختر الصورة اللي تبيها (تقدر أكثر من وحدة)</div>
    <div class="lgrid" id="lGrid">${p.imgs.map((u,i)=>`<button class="${sel.has(i)?'on':''}" data-i="${i}"><img src="${IMG_PROXY(u,360)}" alt="" loading="lazy" onerror="this.parentNode.style.display='none'"></button>`).join('')}</div>
    <button class="btn primary block" id="lAdd" style="margin-top:14px">✨ أضف ${sel.size>1?sel.size+' صور':'الصورة'} وشيل الخلفية</button>`;
    $('lGrid').onclick=e=>{ const b=e.target.closest('[data-i]'); if(!b) return; const i=+b.dataset.i; sel.has(i)?sel.delete(i):sel.add(i); if(!sel.size) sel.add(i); draw(); };
    $('lAdd').onclick=async()=>{
      busy(true,'أجيب الصور…'); const src=[];
      const meta={name:p.name,brand:p.brand,price:p.cur&&p.cur!==curCode()?'':p.price,cat:catFromText(p.name+' '+sh.title+' '+url),url,store:true};
      for(const i of [...sel].sort((a,b)=>a-b)){ try{ src.push({blob:await fetchImageBlob(p.imgs[i]),meta}); }catch(e){ console.warn(e); } }
      busy(false); if(!src.length){ toast('ما قدرت أحمّل الصور — جرّب «الصق صورة»'); return; }
      closeSheet(); intake(src,{wish:S._linkWish}); };
  };
  draw();
}
const curCode = () => ({'ر.س':'SAR','د.إ':'AED','د.ك':'KWD','ر.ق':'QAR','د.ب':'BHD','ر.ع':'OMR','$':'USD','€':'EUR'})[S.set.cur];

/* item detail */
function itemSheet(it){
  const ci=colorInfo(it.color), cpw=+it.price&&it.wears?+it.price/it.wears:null;
  const inOutfits=S.outfits.filter(o=>o.ids.includes(it.id));
  openSheet(`
    <div class="preview"><img src="${it.img}" class="${it.cut?'':'full'}" alt=""></div>
    <div class="sheethead"><h2>${esc(itemName(it))}</h2>
      <button class="iconbtn" id="iFav" style="color:${it.fav?'var(--hi)':'inherit'}">${it.fav?IC.heartF:IC.heart}</button></div>
    <div class="hint" style="margin-top:-8px">${CAT[it.cat].e} ${CAT[it.cat].ar} · <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${it.color};vertical-align:-1px"></span> ${ci.name}${it.color2?` + ${colorInfo(it.color2).name}`:''}${it.brand?` · ${esc(it.brand)}`:''}${it.size?` · مقاس ${esc(it.size)}`:''} · ${STY[styleOf(it)].ar}${fitOf(it)!=='regular'?' · '+FITS.find(f=>f.id===fitOf(it)).ar:''}</div>
    ${it.url?`<a class="hint" href="${esc(it.url)}" target="_blank" rel="noopener" style="display:inline-block;margin-top:6px">🔗 رابط المنتج</a>`:''}
    ${(it.tags||[]).length?`<div class="tags">${it.tags.map(t=>`<span>#${esc(t)}</span>`).join('')}</div>`:''}
    <div class="kv">
      <div><b>${it.wears||0}</b><span>مرة لبستها</span></div>
      <div><b>${it.lastWorn?(daysSince(it.lastWorn)===0?'اليوم':daysSince(it.lastWorn)+' يوم'):'—'}</b><span>آخر لبسة</span></div>
      <div><b>${cpw!=null?money(cpw):(+it.price?money(+it.price):'—')}</b><span>${cpw!=null?'تكلفة اللبسة':'السعر'}</span></div>
    </div>
    ${inOutfits.length?`<div class="lbl">موجودة في ${inOutfits.length} أوتفت محفوظ</div>`:''}
    <div style="display:grid;gap:10px;margin-top:8px">
      <button class="btn primary" id="iStyle">✨ نسّق عليها</button>
      <div class="row"><button class="btn" id="iLaundry">${it.laundry?'✓ طلعت من الغسيل':'🧺 بالغسيل'}</button><button class="btn" id="iEdit">${IC.edit} تعديل</button></div>
      ${it.out?`<button class="btn" id="iBack">↩️ رجّعها للخزانة (${it.out==='sell'?'كانت للبيع':'كانت للتبرع'})</button>`:''}
      <button class="btn danger" id="iDel">${IC.trash} حذف القطعة</button>
    </div>`);
  if($('iBack')) $('iBack').onclick=async()=>{ it.out=null; it.reviewed=Date.now(); await DB.put('items',it); S.results=[]; itemSheet(it); render(); };
  $('iFav').onclick=async()=>{ it.fav=!it.fav; await DB.put('items',it); itemSheet(it); render(); };
  $('iLaundry').onclick=async()=>{ it.laundry=!it.laundry; await DB.put('items',it); S.results=[]; itemSheet(it); render(); toast(it.laundry?'حطيتها بالغسيل — ما بقترحها لين ترجع':'رجعت للخزانة ✓'); };
  $('iEdit').onclick=()=>editItem([{...it,tags:[...(it.tags||[])],occs:[...(it.occs||[])],seasons:[...(it.seasons||['all'])]}],0,false);
  $('iStyle').onclick=()=>{ closeSheet(); S.locks={[it.cat]:it.id}; S.results=[]; S.oTab='style'; go('outfits'); };
  $('iDel').onclick=async()=>{ if(!confirm('أكيد تبي تحذف القطعة؟')) return;
    await DB.del('items',it.id); S.items=S.items.filter(x=>x.id!==it.id);
    for(const o of S.outfits.filter(o=>o.ids.includes(it.id))){ o.ids=o.ids.filter(x=>x!==it.id); if(o.layout) o.layout=o.layout.filter(l=>l.id!==it.id);
      if(o.ids.length<2){ S.outfits=S.outfits.filter(x=>x!==o); await DB.del('outfits',o.id); } else await DB.put('outfits',o); }
    S.results=[]; closeSheet(); render(); toast('انحذفت'); };
}

/* item editor */
async function editItem(list,i,isNew){
  const it=list[i];
  if(!it._src){ busy(true,'لحظة…'); try{ await ensureWork(it); }catch(e){ console.warn(e); } busy(false); }
  const occSel=new Set(it.occs||[]);
  const sea=(it.seasons||['all'])[0];
  openSheet(`
    <h2>${it.wish?'🤍 أمنية جديدة':isNew?'قطعة جديدة':'تعديل القطعة'}</h2>
    <div class="preview"><img id="ePrev" src="${it.img}" class="${it.cut?'':'full'}" alt="">${list.length>1?`<span class="count">${i+1} / ${list.length}</span>`:''}</div>
    ${it._src?`<div class="imgtools">
      <div class="seg ${it._alpha?'':'hidden'}" id="eBg"><button class="${it.useCut!==false?'on':''}" data-v="1">✂️ بدون خلفية</button><button class="${it.useCut!==false?'':'on'}" data-v="0">🖼️ الأصلية</button></div>
      ${!it._alpha?`<p class="hint" style="margin:0">ما قدرت أشيل الخلفية تلقائياً — جرّب الذكاء الاصطناعي أو امسحها بيدك.</p>`:''}
      <div class="row">${it.maskKind!=='ai'?`<button class="btn" id="eAI">✨ شيل الخلفية بالذكاء الاصطناعي</button>`:''}<button class="btn" id="eTouch">🖌️ تعديل يدوي</button></div>
      <label class="tgl"><input type="checkbox" id="eEnh" ${it.enh!==false?'checked':''}><span>✨ تحسين تلقائي للإضاءة والألوان</span></label>
      <div class="slider"><span>🔅</span><input type="range" id="eBright" min="-0.5" max="0.5" step="0.05" value="${it.bright||0}"><span>🔆</span></div>
    </div>`:''}
    <div class="field"><label>النوع</label><div class="wrapchips" id="eCat">
      ${CATS.map(c=>`<button class="chip ${c.id===it.cat?'on':''}" data-v="${c.id}">${c.e} ${c.ar}</button>`).join('')}</div></div>
    <div class="field"><label>الاسم (اختياري)</label><input class="inp" id="eName" value="${esc(it.name)}" placeholder="${CAT[it.cat].ph}"></div>
    <div class="field"><label>اللون الأساسي — <span id="eCName">${colorInfo(it.color).name}</span></label>
      <div class="swatches" id="eCol"><button class="sw on" id="eAuto" data-v="${it.color}" style="background:${it.color}"></button>
        ${PALETTE.map(p=>`<button class="sw" data-v="${p[0]}" style="background:${p[0]}" aria-label="${p[1]}"></button>`).join('')}</div>
      <div class="hint" style="margin-top:6px">أول دائرة اللون اللي اكتشفته${it.color2?` · لون ثاني: ${colorInfo(it.color2).name}`:''}</div></div>
    <div class="grid2">
      <div class="field"><label>الماركة</label><input class="inp" id="eBrand" value="${esc(it.brand)}" placeholder="—"></div>
      <div class="field"><label>المقاس</label><input class="inp" id="eSize" value="${esc(it.size)}" placeholder="—"></div>
    </div>
    <div class="field"><label>السعر (${S.set.cur}) — عشان أحسب تكلفة كل لبسة</label><input class="inp" id="ePrice" inputmode="decimal" value="${esc(it.price)}" placeholder="0"></div>
    <div class="field"><label>تنفع لـ (إذا ما اخترت = تنفع لكل شي)</label><div class="wrapchips" id="eOcc">
      ${OCCS.map(o=>`<button class="chip ${occSel.has(o.id)?'on':''}" data-v="${o.id}">${o.e} ${o.ar}</button>`).join('')}</div></div>
    <div class="field"><label>الموسم</label><div class="seg" id="eSea">${SEASONS.map(s=>`<button class="${sea===s.id?'on':''}" data-v="${s.id}">${s.ar}</button>`).join('')}</div></div>
    <div class="field"><label>الستايل ${it.style?'':'<span style="opacity:.7">— خمّنته، عدّله إذا غلط</span>'}</label><div class="wrapchips" id="eSty">
      ${STYLES.map(x=>`<button class="chip ${styleOf(it)===x.id?'on':''}" data-v="${x.id}">${x.ar}</button>`).join('')}</div></div>
    <div class="field"><label>القصّة</label><div class="seg" id="eFit">${FITS.map(x=>`<button class="${fitOf(it)===x.id?'on':''}" data-v="${x.id}">${x.ar}</button>`).join('')}</div></div>
    <div class="field"><label>النقشة</label><div class="wrapchips" id="ePat">${PATTERNS.map(x=>`<button class="chip ${patOf(it)===x.id?'on':''}" data-v="${x.id}">${x.ar}</button>`).join('')}</div></div>
    <div class="field"><label>تاقات (افصل بفاصلة)</label><input class="inp" id="eTags" value="${esc((it.tags||[]).join('، '))}" placeholder="مثلاً: كتان، رسمي، هدية"></div>
    <div class="row" style="margin-top:6px">
      ${isNew&&list.length>1?`<button class="btn ghost" id="eSkip">تخطي</button>`:''}
      <button class="btn primary" id="eSave">${isNew&&i<list.length-1?'حفظ والتالي':'حفظ'}</button>
    </div>`);
  const single=(box,fn)=>$(box).onclick=e=>{ const b=e.target.closest('[data-v]'); if(!b) return;
    $(box).querySelectorAll('[data-v]').forEach(x=>x.classList.toggle('on',x===b)); fn(b.dataset.v); };
  single('eCat',v=>{ it.cat=v; $('eName').placeholder=CAT[v].ph; });
  single('eCol',v=>{ it.color=v; it._colorAuto=$('eAuto').classList.contains('on'); $('eCName').textContent=colorInfo(v).name; });
  const refresh=()=>{ recompose(it); $('ePrev').src=it.img; $('ePrev').className=it.cut?'':'full';
    if(it._colorAuto){ $('eAuto').dataset.v=it.color; $('eAuto').style.background=it.color; $('eCName').textContent=colorInfo(it.color).name; } };
  if(it._src){
    single('eBg',v=>{ it.useCut=v==='1'; refresh(); });
    $('eEnh').onchange=e=>{ it.enh=e.target.checked; refresh(); };
    let raf=0; $('eBright').oninput=e=>{ it.bright=+e.target.value; cancelAnimationFrame(raf); raf=requestAnimationFrame(refresh); };
    $('eTouch').onclick=()=>openTouch(it,()=>{ it.useCut=true; refresh(); $('eBg').classList.remove('hidden');
      $('eBg').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v==='1')); });
    if($('eAI')) $('eAI').onclick=async()=>{
      busy(true,'✨ أشيل الخلفية بالذكاء الاصطناعي…');
      try{ it._alpha=await aiAlpha(it._src,p=>busy(true,`أنزّل محرك الذكاء الاصطناعي — مرة وحدة بس… ${Math.round(p*100)}%`)); it.maskKind='ai'; it.useCut=true; busy(false); editItem(list,i,isNew); }
      catch(e){ console.warn(e); busy(false); toast('ما قدرت — تأكد إنك متصل بالنت أول مرة'); } };
  }
  single('eSea',v=>{ it.seasons=[v]; });
  single('eSty',v=>{ it.style=v; }); single('eFit',v=>{ it.fit=v; }); single('ePat',v=>{ it.pattern=v; });
  $('eOcc').onclick=e=>{ const b=e.target.closest('[data-v]'); if(!b) return; b.classList.toggle('on'); it.occs=[...$('eOcc').querySelectorAll('.on')].map(x=>x.dataset.v); };
  const next=()=>{ if(isNew&&i<list.length-1) editItem(list,i+1,true); else closeSheet(); };
  $('eSave').onclick=async()=>{
    it.name=$('eName').value.trim(); it.brand=$('eBrand').value.trim(); it.size=$('eSize').value.trim();
    it.price=$('ePrice').value.replace(/[^\d.]/g,''); it.tags=$('eTags').value.split(/[,،]/).map(s=>s.trim()).filter(Boolean);
    if(it._src){ it.src=it._src.toDataURL('image/jpeg',.85); it.mask=it._alpha?alphaToURL(it._alpha,it._src.width,it._src.height):null; }
    const rec={}; for(const k in it) if(k[0]!=='_') rec[k]=it[k];
    if(rec.wish){ await DB.put('wish',rec); const k=S.wish.findIndex(x=>x.id===rec.id); if(k<0) S.wish.push(rec); else S.wish[k]=rec;
      toast('انضافت للأمنيات 🤍'); if(isNew&&i<list.length-1) return next(); closeSheet(); return wishSheet(rec); }
    await DB.put('items',rec); const k=S.items.findIndex(x=>x.id===rec.id); if(k<0) S.items.push(rec); else S.items[k]=rec;
    S.results=[]; S.hero=null; render(); toast('انحفظت ✓'); next(); };
  if($('eSkip')) $('eSkip').onclick=next;
}

/* ---------------- outfits ---------------- */
function renderOutfits(){
  const v=$('v-outfits');
  v.innerHTML=`<div class="seg big" id="oSeg"><button class="${S.oTab==='style'?'on':''}" data-v="style">✨ نسّقلي</button><button class="${S.oTab==='saved'?'on':''}" data-v="saved">♡ المحفوظة</button></div><div id="oBody"></div>`;
  $('oSeg').onclick=e=>{ const b=e.target.closest('[data-v]'); if(!b) return; S.oTab=b.dataset.v; render(); };
  if(S.oTab==='style') renderStylist(); else renderSaved();
}
function wxBarHTML(){
  const date=S.planDate||today(), d=wxDay(date), w=WXM[S.wx];
  const isToday=date===today()&&S.wxInfo&&Date.now()-S.wxInfo.at<6*3600e3;
  const temp=isToday?S.wxInfo.temp:d?d.max:null, code=isToday?S.wxInfo.code:d?d.code:null;
  return `<div class="wxbar"><div class="tmp">${temp!=null?wxIcon(code):w.e}</div>
    <div class="d"><b>${temp!=null?temp+'°':w.ar}</b> ${d?`· ${d.min}°–${d.max}°`:''}<br>${temp!=null?(S.wxManual?'اخترت الجو يدوي':'الجو من موقعك'):'حسب الشهر — جيب الجو الحقيقي'}</div>
    <button class="btn" id="wxGet">${IC.pin} ${S.wxInfo?'تحديث':'موقعي'}</button></div>`;
}
function renderStylist(){
  const b=$('oBody');
  const has=c=>S.items.some(i=>i.cat===c&&!i.laundry);
  if(!((has('top')&&has('bottom'))||has('full'))){
    b.innerHTML=`<div class="empty"><div class="big">🪄</div><h3>أحتاج قطع أكثر</h3>
      <p class="hint">صوّر على الأقل قطعة <b>فوق</b> وقطعة <b>تحت</b> (أو <b>قطعة كاملة</b>) ويفضل حذاء — وأبدأ أنسّق لك.</p>
      <button class="btn primary" style="margin-top:12px" onclick="pickPhotos()">صوّر قطعة</button></div>`; return;
  }
  if(!S.wxManual) S.wx=wxFor(S.planDate||today());
  if(!S.results.length){ S.results=generate(); S.idx=0; }
  const o=S.results[S.idx];
  const head=`${S.planDate?`<div class="plannote">📅 تنسيق لـ ${fmtDate(S.planDate)}<button id="pnX">✕</button></div>`:''}
    ${wxBarHTML()}
    <div class="chips" id="occPick">${OCCS.map(x=>`<button class="chip ${S.occ===x.id?'on':''}" data-v="${x.id}">${x.e} ${x.ar}</button>`).join('')}</div>
    <div class="seg" id="wxPick" style="margin-bottom:12px">${WX.map(w=>`<button class="${S.wx===w.id?'on':''}" data-v="${w.id}">${w.e} ${w.ar}</button>`).join('')}</div>
    <div class="lbl">الستايل</div>
    <div class="chips" id="lookPick"><button class="chip ${S.look==='all'?'on':''}" data-v="all">🪄 فاجئني</button>${LOOKS.map(l=>`<button class="chip ${S.look===l.id?'on':''}" data-v="${l.id}">${l.e} ${l.ar}</button>`).join('')}</div>`;
  if(!o){ b.innerHTML=head+`<div class="empty"><div class="big">🤔</div><h3>ما لقيت تركيبة تناسب</h3><p class="hint">${S.look!=='all'?`قطعك الحالية ما تكفي لستايل «${LOOK[S.look].ar}». جرّب «فاجئني» أو ستايل ثاني.`:'جرّب مناسبة أو جو ثاني، أو فك القفل.'}</p></div>`; bindStyleHead(); return; }
  const ps=sortPieces(o.pieces), saved=S.outfits.some(x=>x.key===o.key), ex=explain(o);
  S.shown.add(o.key);
  b.innerHTML=head+`<div class="ocard">
      <div class="lookhead"><b>${ex.title}</b><span class="score">تناسق ${pct(o.s)}%</span></div>
      <p class="lookdesc">${ex.desc}</p>
      ${boardHTML(autoLayout(ps))}
      <div class="pieces" id="pcs">${ps.map(p=>`<div class="pc"><div class="im"><img src="${p.img}" alt=""></div>
        <button class="lk ${S.locks[p.cat]===p.id?'on':''}" data-cat="${p.cat}" data-id="${p.id}" aria-label="ثبّت">${S.locks[p.cat]===p.id?IC.lock:IC.unlock}</button></div>`).join('')}</div>
      <div class="meta"><div class="pal">${ps.map(p=>`<i style="background:${p.color}"></i>`).join('')}</div></div>
      <ul class="why">${ex.points.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>
      <div class="pager">${S.results.map((_,i)=>`<i class="${i===S.idx?'on':''}"></i>`).join('')}</div>
      <div class="row" style="margin-bottom:10px">
        <button class="btn sq" id="oFav" style="color:${saved?'var(--hi)':'inherit'}" aria-label="حفظ">${saved?IC.heartF:IC.heart}</button>
        <button class="btn sq" id="oEdit" aria-label="تعديل">${IC.edit}</button>
        <button class="btn sq" id="oShare" aria-label="شارك">📤</button>
        ${S.planDate?'':`<button class="btn sq" id="oPlan" aria-label="خطط">${IC.cal}</button>`}
        <button class="btn" id="oNext">${IC.shuffle} غيره</button>
      </div>
      <button class="btn primary block" id="oWear">${S.planDate?`📅 اعتمده لـ ${fmtDate(S.planDate,{weekday:'long'})}`:'✓ بلبسه اليوم'}</button>
    </div>
    <p class="hint" style="text-align:center">🔒 ثبّت أي قطعة من الصور الصغيرة وأنسّق الباقي عليها</p>`;
  bindStyleHead();
  $('pcs').onclick=e=>{ const l=e.target.closest('[data-cat]'); if(!l) return; const c=l.dataset.cat;
    if(S.locks[c]===l.dataset.id) delete S.locks[c]; else { S.locks[c]=l.dataset.id;
      if(c==='full'){ delete S.locks.top; delete S.locks.bottom; } if(c==='top'||c==='bottom') delete S.locks.full; }
    renderStylist(); };
  $('oShare').onclick=()=>shareOutfit(autoLayout(ps),ex.title.replace(/^\S+\s/,''));
  $('oNext').onclick=()=>{ if(S.idx<S.results.length-1) S.idx++; else { S.results=generate(); S.idx=0; } renderStylist(); };
  $('oFav').onclick=async()=>{ const ex=S.outfits.find(x=>x.key===o.key);
    if(ex){ S.outfits=S.outfits.filter(x=>x!==ex); await DB.del('outfits',ex.id); toast('انشال من المحفوظة'); }
    else { await saveOutfit(o.pieces.map(p=>p.id),null,{occ:S.occ,look:o.look}); await learn(o.pieces,o.look,1); toast('انحفظ ♥ — بتعلّم ذوقك'); } renderStylist(); };
  $('oEdit').onclick=()=>openBuilder({ids:o.pieces.map(p=>p.id),layout:autoLayout(ps),onSave:async(ids,layout)=>{ await saveOutfit(ids,layout,{occ:S.occ}); toast('انحفظ بالمحفوظة ♥'); }});
  if($('oPlan')) $('oPlan').onclick=()=>pickDateSheet(addDays(today(),1),async d=>{ await setPlan(d,o.pieces.map(p=>p.id),null,false); toast(`انضاف لـ ${fmtDate(d)} 📅`); });
  $('oWear').onclick=async()=>{
    const d=S.planDate||today(); await setPlan(d,o.pieces.map(p=>p.id),null,d===today()&&!S.planDate?true:d<=today());
    await learn(o.pieces,o.look,1.5);
    S.locks={}; S.results=[];
    if(S.planDate){ S.planDate=null; S.wxManual=false; toast('انضاف للتقويم 📅'); S.view='plan'; go('plan'); }
    else { toast('تمام ✓ سجلته بالتقويم'); renderStylist(); } };
}
function bindStyleHead(){
  $('occPick').onclick=e=>{ const b=e.target.closest('[data-v]'); if(!b) return; S.occ=b.dataset.v; S.results=[]; renderStylist(); };
  $('wxPick').onclick=e=>{ const b=e.target.closest('[data-v]'); if(!b) return; S.wx=b.dataset.v; S.wxManual=true; S.results=[]; renderStylist(); };
  $('wxGet').onclick=()=>{ S.wxManual=false; fetchWeather(true); };
  $('lookPick').onclick=e=>{ const b=e.target.closest('[data-v]'); if(!b) return; S.look=b.dataset.v; S.results=[]; renderStylist(); };
  if($('pnX')) $('pnX').onclick=()=>{ S.planDate=null; S.wxManual=false; S.results=[]; renderStylist(); };
}
function renderSaved(){
  const b=$('oBody'); const list=[...S.outfits].filter(o=>o.ids.some(byId)).sort((a,b)=>b.created-a.created);
  b.innerHTML=`<div class="ogrid" id="sg">
      <button class="newcard" id="newO">${IC.plus}سوّ أوتفت بنفسك</button>
      ${list.map(o=>`<button class="oc" data-id="${o.id}">${boardHTML(layoutOf(o))}
        <div class="cap"><span>${o.name?esc(o.name):(OCC[o.occ]?OCC[o.occ].e+' '+OCC[o.occ].ar:'')}</span><span>${o.ids.length} قطع</span></div></button>`).join('')}
    </div>${list.length?'':'<p class="hint" style="text-align:center;margin-top:16px">احفظ أوتفتات من «نسّقلي» بزر ♡ أو ركّبها بنفسك.</p>'}`;
  $('newO').onclick=()=>createOutfitSheet();
  $('sg').onclick=e=>{ const c=e.target.closest('.oc'); if(c) outfitSheet(S.outfits.find(o=>o.id===c.dataset.id)); };
}
function outfitSheet(o){
  const lay=layoutOf(o); const worn=Object.values(S.plans).filter(p=>p.worn&&[...p.ids].sort().join('|')===o.key).length;
  openSheet(`<div class="sheethead"><h2>${o.name?esc(o.name):'أوتفت'}</h2><span class="hint">${worn?`لبسته ${worn} مرة`:'ما لبسته للحين'}</span></div>
    ${boardHTML(lay)}
    <div class="field" style="margin-top:14px"><label>اسم (اختياري)</label><input class="inp" id="oName" value="${esc(o.name||'')}" placeholder="مثلاً: عشاء الخميس"></div>
    <div style="display:grid;gap:10px">
      <button class="btn primary" id="sWear">✓ بلبسه اليوم</button>
      <div class="row"><button class="btn" id="sPlan">${IC.cal} خطط ليوم</button><button class="btn" id="sEdit">${IC.edit} عدّل</button></div>
      <button class="btn" id="sShare">📤 شارك كصورة</button>
      <button class="btn danger" id="sDel">${IC.trash} حذف</button></div>`,
    async()=>{ const n=$('oName')&&$('oName').value.trim(); if(n!==undefined&&n!==(o.name||'')){ o.name=n; await DB.put('outfits',o); render(); } });
  $('sShare').onclick=()=>shareOutfit(lay,o.name||'Closia');
  $('sWear').onclick=async()=>{ await setPlan(today(),o.ids,o.layout,true); closeSheet(); toast('تمام ✓ سجلته بالتقويم'); render(); };
  $('sPlan').onclick=()=>pickDateSheet(addDays(today(),1),async d=>{ await setPlan(d,o.ids,o.layout,d<today()); toast(`انضاف لـ ${fmtDate(d)} 📅`); });
  $('sEdit').onclick=()=>{ closeSheet(); openBuilder({ids:o.ids,layout:lay,onSave:async(ids,layout)=>{
      const key=[...ids].sort().join('|'); Object.assign(o,{ids,layout,key}); await DB.put('outfits',o); toast('انحفظ ✓'); }}); };
  $('sDel').onclick=async()=>{ if(!confirm('تحذف الأوتفت؟')) return; S.outfits=S.outfits.filter(x=>x!==o); await DB.del('outfits',o.id); closeSheet(); render(); };
}
function pickDateSheet(def,cb){
  openSheet(`<h2>أي يوم؟</h2><input type="date" class="inp" id="pd" value="${def}" style="margin-bottom:16px">
    <div class="chips">${[0,1,2,3,4,5,6].map(n=>{ const d=addDays(today(),n); return `<button class="chip" data-d="${d}">${n===0?'اليوم':n===1?'بكرة':fmtDate(d,{weekday:'long'})}</button>`; }).join('')}</div>
    <button class="btn primary block" id="pdOk">تم</button>`);
  const done=async d=>{ if(!d) return; closeSheet(); await cb(d); render(); };
  $('sheetBody').querySelector('.chips').onclick=e=>{ const b=e.target.closest('[data-d]'); if(b) done(b.dataset.d); };
  $('pdOk').onclick=()=>done($('pd').value);
}

/* ---------------- builder (drag & drop collage) ---------------- */
const B={layout:[],sel:null,cat:'all',onSave:null};
function openBuilder({ids=[],layout=null,onSave,title='سوّ أوتفت'}){
  B.layout=(layout||autoLayout(ids.map(byId).filter(Boolean))).map(l=>({...l})); B.sel=null; B.onSave=onSave; B.cat='all';
  $('bTitle').textContent=title; $('builder').classList.add('on'); bRender(); bTray();
}
function bClose(){ $('builder').classList.remove('on'); }
$('bCancel').onclick=bClose;
$('bSave').onclick=async()=>{
  if(B.layout.length<2){ toast('أضف قطعتين على الأقل'); return; }
  const ids=B.layout.map(l=>l.id); await B.onSave(ids,B.layout.map(l=>({...l}))); bClose(); render(); };
function bRender(){
  const bd=$('bBoard');
  bd.innerHTML=(B.layout.length?'':'<div class="hint2">اختر قطع من تحت 👇<br>اسحبها لترتيبها، وكبّرها أو صغّرها بإصبعين</div>')+
    [...B.layout].sort((a,b)=>a.z-b.z).map(l=>{ const it=byId(l.id); return `<div class="it ${B.sel===l.id?'sel':''}" data-id="${l.id}"
      style="left:${l.x*100}%;top:${l.y*100}%;width:${l.w*100}%;z-index:${l.z}"><img src="${it.img}" class="${it.cut?'':'nocut'}" alt=""></div>`; }).join('');
  $('bTools').innerHTML=B.sel?`<button data-a="del" aria-label="شيل">${IC.trash}</button><button data-a="up" aria-label="قدّام">${IC.up}</button>
    <button data-a="down" aria-label="ورا">${IC.down}</button><button data-a="big" aria-label="كبّر">${IC.big}</button><button data-a="small" aria-label="صغّر">${IC.small}</button>`:
    `<span class="hint" style="align-self:center">اضغط على قطعة عشان تعدّلها</span>`;
}
function bTray(){
  const cats=CATS.filter(c=>S.items.some(i=>i.cat===c.id));
  $('bCats').innerHTML=`<button class="chip ${B.cat==='all'?'on':''}" data-v="all">الكل</button>`+cats.map(c=>`<button class="chip ${B.cat===c.id?'on':''}" data-v="${c.id}">${c.e} ${c.ar}</button>`).join('');
  const list=S.items.filter(i=>B.cat==='all'||i.cat===B.cat).sort((a,b)=>ORDER.indexOf(a.cat)-ORDER.indexOf(b.cat));
  $('bTray').innerHTML=list.map(i=>`<button class="ti ${B.layout.some(l=>l.id===i.id)?'in':''}" data-id="${i.id}"><img src="${i.img}" alt=""></button>`).join('');
}
$('bCats').onclick=e=>{ const b=e.target.closest('[data-v]'); if(!b) return; B.cat=b.dataset.v; bTray(); };
$('bTray').onclick=e=>{ const b=e.target.closest('[data-id]'); if(!b) return; const id=b.dataset.id;
  if(B.layout.some(l=>l.id===id)){ B.layout=B.layout.filter(l=>l.id!==id); if(B.sel===id) B.sel=null; }
  else { const it=byId(id); const tmp=autoLayout([...B.layout.map(l=>byId(l.id)).filter(Boolean),it]).find(l=>l.id===id);
    const z=Math.max(0,...B.layout.map(l=>l.z))+1; B.layout.push({...tmp,z}); B.sel=id; }
  bRender(); bTray(); };
$('bTools').onclick=e=>{ const b=e.target.closest('[data-a]'); if(!b||!B.sel) return; const l=B.layout.find(x=>x.id===B.sel); const a=b.dataset.a;
  if(a==='del'){ B.layout=B.layout.filter(x=>x!==l); B.sel=null; bTray(); }
  if(a==='up') l.z=Math.max(...B.layout.map(x=>x.z))+1;
  if(a==='down'){ B.layout.forEach(x=>x.z++); l.z=0; }
  if(a==='big') l.w=clamp(l.w*1.12,.08,1); if(a==='small') l.w=clamp(l.w/1.12,.08,1);
  bRender(); };
(()=>{ // pointer: drag with one finger, pinch with two
  const bd=$('bBoard'), pts=new Map(); let drag=null, pinch=null;
  bd.addEventListener('pointerdown',e=>{
    const t=e.target.closest('.it'); pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pts.size===1){ if(!t){ B.sel=null; bRender(); return; }
      B.sel=t.dataset.id; const l=B.layout.find(x=>x.id===B.sel);
      drag={l,x0:e.clientX,y0:e.clientY,lx:l.x,ly:l.y}; bd.setPointerCapture(e.pointerId);
      bd.querySelectorAll('.it').forEach(n=>n.classList.toggle('sel',n.dataset.id===B.sel)); bRenderTools(); }
    else if(pts.size===2&&B.sel){ const [a,b]=[...pts.values()]; const l=B.layout.find(x=>x.id===B.sel);
      pinch={l,d0:Math.hypot(a.x-b.x,a.y-b.y),w0:l.w}; drag=null; }
  });
  bd.addEventListener('pointermove',e=>{ if(!pts.has(e.pointerId)) return; pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    const r=bd.getBoundingClientRect();
    if(pinch&&pts.size>=2){ const [a,b]=[...pts.values()]; pinch.l.w=clamp(pinch.w0*Math.hypot(a.x-b.x,a.y-b.y)/pinch.d0,.08,1); moveEl(pinch.l); }
    else if(drag){ drag.l.x=clamp(drag.lx+(e.clientX-drag.x0)/r.width,-.3,.95); drag.l.y=clamp(drag.ly+(e.clientY-drag.y0)/r.height,-.3,.95); moveEl(drag.l); }
  });
  const up=e=>{ pts.delete(e.pointerId); if(pts.size<2) pinch=null; if(!pts.size) drag=null; };
  bd.addEventListener('pointerup',up); bd.addEventListener('pointercancel',up);
  function moveEl(l){ const n=bd.querySelector(`.it[data-id="${l.id}"]`); if(n){ n.style.left=l.x*100+'%'; n.style.top=l.y*100+'%'; n.style.width=l.w*100+'%'; } }
  function bRenderTools(){ const keep=B.layout; bRender(); B.layout=keep; }
})();

/* ---------------- manual touch-up (erase / restore / rotate) ---------------- */
const TU={};
function openTouch(it,onDone){
  Object.assign(TU,{it,onDone,src:it._src,orig:it._alpha?new Uint8ClampedArray(it._alpha):null,mode:'erase',undo:[]});
  TU.alpha=it._alpha?new Uint8ClampedArray(it._alpha):new Uint8ClampedArray(it._src.width*it._src.height).fill(255);
  $('tMode').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v==='erase'));
  $('touch').classList.add('on'); requestAnimationFrame(()=>{ tuPrep(); tuFit(); tuDraw(); });
}
function tuPrep(){
  const w=TU.src.width,h=TU.src.height;
  TU.rgb=enhancedData(TU.src,{auto:TU.it.enh!==false,bright:TU.it.bright||0});
  for(const id of ['tBase','tTop']){ $(id).width=w; $(id).height=h; }
  $('tBase').getContext('2d').putImageData(TU.rgb,0,0);
  TU.out=new ImageData(new Uint8ClampedArray(TU.rgb.data),w,h);
}
function tuFit(){
  const st=$('tStage').getBoundingClientRect(), w=TU.src.width, h=TU.src.height;
  const k=Math.min((st.width-32)/w,(st.height-12)/h); $('tCv').style.width=w*k+'px'; $('tCv').style.height=h*k+'px'; TU.k=k;
}
function tuDraw(){ const d=TU.out.data, a=TU.alpha; for(let i=0;i<a.length;i++) d[i*4+3]=a[i]; $('tTop').getContext('2d').putImageData(TU.out,0,0); }
function tuPaint(x,y){
  const w=TU.src.width,h=TU.src.height, r=+$('tSize').value/TU.k/2, a=TU.alpha, er=TU.mode==='erase';
  const x0=Math.max(0,Math.floor(x-r)),x1=Math.min(w-1,Math.ceil(x+r)),y0=Math.max(0,Math.floor(y-r)),y1=Math.min(h-1,Math.ceil(y+r));
  for(let yy=y0;yy<=y1;yy++) for(let xx=x0;xx<=x1;xx++){ const dd=Math.hypot(xx-x,yy-y); if(dd>r) continue;
    const f=clamp((r-dd)/(r*.35),0,1), i=yy*w+xx; a[i]=er?Math.min(a[i],255*(1-f)):Math.max(a[i],255*f); }
}
(()=>{
  const cv=$('tCv'), cur=$('tCur'); let last=null, raf=0;
  const pos=e=>{ const r=cv.getBoundingClientRect(); return {x:(e.clientX-r.left)/TU.k,y:(e.clientY-r.top)/TU.k,cx:e.clientX-r.left,cy:e.clientY-r.top}; };
  const showCur=p=>{ const s=+$('tSize').value; Object.assign(cur.style,{display:'block',left:p.cx+'px',top:p.cy+'px',width:s+'px',height:s+'px'}); };
  cv.addEventListener('pointerdown',e=>{ cv.setPointerCapture(e.pointerId); TU.undo.push(new Uint8ClampedArray(TU.alpha)); if(TU.undo.length>20) TU.undo.shift();
    const p=pos(e); last=p; tuPaint(p.x,p.y); tuDraw(); showCur(p); });
  cv.addEventListener('pointermove',e=>{ if(!last) return; const p=pos(e), r=+$('tSize').value/TU.k/2;
    const n=Math.max(1,Math.ceil(Math.hypot(p.x-last.x,p.y-last.y)/(r/3)));
    for(let k=1;k<=n;k++) tuPaint(last.x+(p.x-last.x)*k/n,last.y+(p.y-last.y)*k/n);
    last=p; showCur(p); cancelAnimationFrame(raf); raf=requestAnimationFrame(tuDraw); });
  const end=()=>{ last=null; cur.style.display='none'; tuDraw(); };
  cv.addEventListener('pointerup',end); cv.addEventListener('pointercancel',end);
})();
$('tMode').onclick=e=>{ const b=e.target.closest('[data-v]'); if(!b) return; TU.mode=b.dataset.v; $('tMode').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b)); };
$('tUndo').onclick=()=>{ const a=TU.undo.pop(); if(a&&a.length===TU.alpha.length){ TU.alpha=a; tuDraw(); } };
$('tReset').onclick=()=>{ TU.undo.push(new Uint8ClampedArray(TU.alpha)); TU.alpha=TU.orig&&TU.orig.length===TU.alpha.length?new Uint8ClampedArray(TU.orig):TU.alpha.fill(255); tuDraw(); };
$('tRot').onclick=()=>{ // rotate photo and mask 90° clockwise
  const w=TU.src.width,h=TU.src.height, c=mkCanvas(h,w), x=c.getContext('2d');
  x.translate(h,0); x.rotate(Math.PI/2); x.drawImage(TU.src,0,0); TU.src=c;
  const a=new Uint8ClampedArray(w*h); for(let y=0;y<h;y++) for(let xx=0;xx<w;xx++) a[xx*h+(h-1-y)]=TU.alpha[y*w+xx];
  TU.alpha=a; TU.undo=[]; TU.orig=null; tuPrep(); tuFit(); tuDraw(); };
$('tCancel').onclick=()=>$('touch').classList.remove('on');
$('tDone').onclick=()=>{ const it=TU.it; it._src=TU.src; it._alpha=TU.alpha; it.maskKind='manual'; $('touch').classList.remove('on'); TU.onDone&&TU.onDone(); };
addEventListener('resize',()=>{ if($('touch').classList.contains('on')) tuFit(); });

/* ================= extras: wishlist, closet review, category picker, basics library, sharing ================= */
const QA_IC = {
  wish:'<path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>',
  review:'<path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>',
  stats:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  share:'<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
  album:'<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
  camera:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.4"/>',
  link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  paste:'<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6"/>',
  library:'<path d="M4 9 12 4l8 5M5 9v9M9 9v9M15 9v9M19 9v9M3 20h18"/>',
  grid:'<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
  free:'<path d="M5 5h6v6H5zM13 13h6v6h-6z"/><path d="M14 5h5v5M10 19H5v-5" stroke-dasharray="2 2"/>',
  spark:'<path d="M12 3l1.8 4.6L18.5 9l-4.7 1.6L12 15l-1.8-4.4L5.5 9l4.7-1.4z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
};
const qi = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${QA_IC[k]}</svg>`;
const isOut = it => !!it.out;

function quickActionsHTML(){
  const rev=reviewQueue().length;
  return `<div class="qas" id="qas">
    <button data-a="wish"><span class="c">${qi('wish')}${S.wish.length?`<span class="n">${S.wish.length}</span>`:''}</span>الأمنيات</button>
    <button data-a="review"><span class="c">${qi('review')}${rev?`<span class="n">${rev}</span>`:''}</span>مراجعة الخزانة</button>
    <button data-a="stats"><span class="c">${qi('stats')}</span>إحصائياتي</button>
    <button data-a="share"><span class="c">${qi('share')}</span>شارك خزانتي</button></div>`;
}
function bindQuickActions(){
  if(!$('qas')) return;
  $('qas').onclick=e=>{ const b=e.target.closest('[data-a]'); if(!b) return;
    ({wish:wishListSheet,review:()=>reviewSheet(0),stats:()=>go('stats'),share:shareCloset})[b.dataset.a](); };
}

/* ---- add sheet (grid) ---- */
function addSheet(){
  openSheet(`<h2>أضف قطعة</h2>
    <div class="agrid">
      <button id="aAlbum">${qi('album')}<b>الألبوم</b></button>
      <button id="aCam">${qi('camera')}<b>الكاميرا</b></button>
      <button id="aLink">${qi('link')}<b>رابط منتج</b></button>
      <button id="aPaste">${qi('paste')}<b>الصق صورة</b></button>
    </div>
    <button class="arow" id="aLib"><span class="ai">${qi('library')}</span><span><b>مكتبة الأساسيات</b><small>تيشيرت أبيض، جينز، عباية… بضغطة وحدة بدون تصوير</small></span></button>
    <button class="arow" id="aWish"><span class="ai">${qi('wish')}</span><span><b>أضف للأمنيات</b><small>ناوي تشتري شي؟ الصق رابطه وأقولك تستاهل ولا لا</small></span></button>`);
  $('aAlbum').onclick=()=>{ closeSheet(); pickPhotos(); };
  $('aCam').onclick=()=>{ closeSheet(); $('camIn').value=''; $('camIn').click(); };
  $('aLink').onclick=()=>linkSheet('',false);
  $('aPaste').onclick=()=>pasteImage(false);
  $('aLib').onclick=librarySheet;
  $('aWish').onclick=()=>linkSheet('',true);
}
$('addBtn').onclick=addSheet;
$('camIn').addEventListener('change',e=>{ const f=[...e.target.files]; if(f.length) intake(f.map(blob=>({blob}))); });

/* ---- wishlist + "worth buying?" ---- */
function worthOf(w){
  const tmp={...w,wish:false,laundry:false,out:null};
  S.items.push(tmp);
  try{
    const r=generate({locks:{[w.cat]:w.id},look:'all',n:40,occ:null,ignoreRecent:true}).filter(o=>o.pieces.some(p=>p.id===w.id));
    const good=r.filter(o=>o.s>=6.8);
    const partners=new Set(good.flatMap(o=>o.pieces.filter(p=>p.id!==w.id).map(p=>p.id)));
    const fam=colorInfo(w.color).family;
    const similar=S.items.filter(i=>i!==tmp&&i.cat===w.cat&&colorInfo(i.color).family===fam&&!isOut(i));
    const looks=[...new Set(good.map(o=>o.look).filter(Boolean))];
    const score=Math.min(100,Math.round(good.length*7+partners.size*2+looks.length*4-similar.length*12));
    return {good,partners,similar,looks,score,top:good.slice(0,4)};
  } finally { S.items=S.items.filter(i=>i!==tmp); }
}
function wishListSheet(){
  const L=[...S.wish].sort((a,b)=>b.added-a.added);
  openSheet(`<div class="sheethead"><h2>🤍 الأمنيات</h2><button class="btn" id="wAdd" style="padding:9px 14px">+ أضف</button></div>
    <p class="hint" style="margin-top:-6px">قطع ناوي تشتريها — أحسب لك كم أوتفت تطلع منها مع ملابسك قبل لا تشتري.</p>
    ${L.length?`<div class="grid" id="wGrid" style="margin-top:12px">${L.map(w=>`<button class="tile" data-id="${w.id}"><img src="${w.img}" class="${w.cut?'':'full'}" alt=""><span class="badges"><span>${worthOf(w).score}%</span></span></button>`).join('')}</div>`
      :`<div class="empty" style="padding:26px 8px"><div class="big">🛍️</div><h3>ما فيه أمنيات</h3><p class="hint">لقيت شي عاجبك في متجر؟ انسخ رابطه وأضفه هنا.</p></div>`}`);
  $('wAdd').onclick=()=>linkSheet('',true);
  if($('wGrid')) $('wGrid').onclick=e=>{ const t=e.target.closest('[data-id]'); if(t) wishSheet(S.wish.find(w=>w.id===t.dataset.id)); };
}
function wishSheet(w){
  busy(true,'أحسب كم أوتفت تطلع منها…');
  setTimeout(()=>{
    const a=worthOf(w); busy(false);
    const verdict=a.score>=70?['👍 تستاهل','تركب مع قطع كثيرة عندك — بتلبسها كثير.']:a.score>=40?['🤔 مقبولة','تركب مع بعض قطعك — لو تحبها خذها.']:['✋ فكّر مرة ثانية','ما تركب مع خزانتك كثير'+(a.similar.length?' وعندك شي يشبهها.':'.')];
    openSheet(`<div class="wishhead"><div class="preview" style="width:42%;aspect-ratio:3/4;margin:0"><img src="${w.img}" class="${w.cut?'':'full'}" alt=""></div>
      <div class="tx"><h2 style="margin:0">${esc(itemName(w))}</h2><span class="hint">${esc([w.brand,w.price&&w.price+' '+S.set.cur].filter(Boolean).join(' · '))}</span>
        <div class="worth"><b>${a.score}%</b><span>${verdict[0]}</span></div><p class="hint" style="margin:0">${verdict[1]}</p></div></div>
      <div class="kv"><div><b>${a.good.length}</b><span>أوتفت حلو</span></div><div><b>${a.partners.size}</b><span>قطعة تركب معها</span></div><div><b>${a.similar.length}</b><span>عندك شبهها</span></div></div>
      ${a.looks.length?`<div class="tags">${a.looks.slice(0,4).map(l=>`<span>${LOOK[l].e} ${LOOK[l].ar}</span>`).join('')}</div>`:''}
      ${a.top.length?`<div class="lbl" style="margin-top:14px">كيف بتطلع مع ملابسك</div><div class="ogrid">${a.top.map(o=>`<div class="oc">${boardHTML(autoLayout(sortPieces(o.pieces.map(p=>p.id===w.id?w:p))),'')}</div>`).join('')}</div>`:''}
      <div style="display:grid;gap:10px;margin-top:14px">
        <button class="btn primary" id="wBuy">🛍️ اشتريتها — انقلها للخزانة</button>
        <div class="row">${w.url?`<a class="btn" href="${esc(w.url)}" target="_blank" rel="noopener">🔗 المتجر</a>`:''}<button class="btn danger" id="wDel">${IC.trash} احذف</button></div></div>`);
    // boards above reference the wish item by id: make it resolvable while the sheet is open
    $('wBuy').onclick=async()=>{ const it={...w,wish:false,added:Date.now()}; await DB.del('wish',w.id); S.wish=S.wish.filter(x=>x!==w);
      await DB.put('items',it); S.items.push(it); S.results=[]; S.hero=null; closeSheet(); render(); toast('مبروك 🛍️ صارت في خزانتك'); };
    $('wDel').onclick=async()=>{ await DB.del('wish',w.id); S.wish=S.wish.filter(x=>x!==w); closeSheet(); toast('انحذفت'); };
  },40);
}

/* ---- closet review ---- */
function reviewQueue(){
  return S.items.filter(i=>!isOut(i)&&!i.laundry&&daysSince(i.reviewed)>60&&((!i.wears&&daysSince(i.added)>=14)||(i.wears&&daysSince(i.lastWorn)>60)))
    .sort((a,b)=>(a.lastWorn||a.added)-(b.lastWorn||b.added));
}
function reviewSheet(i){
  const q=reviewQueue(), outs=S.items.filter(isOut);
  if(!q.length){
    openSheet(`<h2>🔄 مراجعة الخزانة</h2>
      <div class="empty" style="padding:20px 8px"><div class="big">✨</div><h3>خزانتك مرتبة</h3><p class="hint">ما فيه قطع منسية تحتاج قرار الحين.</p></div>
      ${outs.length?`<div class="lbl">قطع قررت تطلّعها (${outs.length})</div><div class="grid" id="rvOut">${outs.map(o=>`<button class="tile" data-id="${o.id}"><img src="${o.img}" class="${o.cut?'':'full'}" alt=""><span class="badges"><span>${o.out==='sell'?'💰':'🎁'}</span></span></button>`).join('')}</div>
        <button class="btn danger block" id="rvClear" style="margin-top:12px">${IC.trash} شيلها من الخزانة نهائياً</button>`:''}`);
    if($('rvOut')) $('rvOut').onclick=e=>{ const t=e.target.closest('[data-id]'); if(t) itemSheet(byId(t.dataset.id)); };
    if($('rvClear')) $('rvClear').onclick=async()=>{ if(!confirm(`تحذف ${outs.length} قطعة؟`)) return;
      for(const o of outs){ await DB.del('items',o.id); } S.items=S.items.filter(x=>!isOut(x)); S.results=[]; S.hero=null; closeSheet(); render(); toast('تم ✓'); };
    return;
  }
  const it=q[0];
  openSheet(`<div class="sheethead"><h2>🔄 مراجعة الخزانة</h2><span class="hint">${q.length} باقي</span></div>
    <div class="preview" style="aspect-ratio:4/5"><img src="${it.img}" class="${it.cut?'':'full'}" alt=""></div>
    <h3 style="text-align:center;font-size:19px">${esc(itemName(it))}</h3>
    <p class="hint" style="text-align:center;margin:4px 0 16px">${it.wears?`آخر مرة لبستها قبل ${daysSince(it.lastWorn)} يوم`:`ما لبستها من يوم أضفتها (${daysSince(it.added)} يوم)`}</p>
    <div class="rvbtns"><button data-r="keep">💛<b>أبيها</b></button><button data-r="donate">🎁<b>أتبرع</b></button><button data-r="sell">💰<b>أبيعها</b></button></div>
    <button class="btn block" id="rvStyle" style="margin-top:10px">✨ نسّق عليها قبل لا أقرر</button>`);
  $('sheetBody').querySelector('.rvbtns').onclick=async e=>{ const b=e.target.closest('[data-r]'); if(!b) return;
    if(b.dataset.r==='keep') it.reviewed=Date.now(); else it.out=b.dataset.r;
    await DB.put('items',it); S.results=[]; S.hero=null; reviewSheet(); };
  $('rvStyle').onclick=()=>{ it.reviewed=Date.now(); DB.put('items',it); closeSheet(); S.locks={[it.cat]:it.id}; S.results=[]; S.oTab='style'; go('outfits'); };
}

/* ---- create outfit: chooser + pick by category ---- */
function createOutfitSheet(onSave){
  onSave=onSave||(async(ids,layout)=>{ await saveOutfit(ids,layout); toast('انحفظ ♥'); });
  openSheet(`<h2>كيف تبي تسوي الأوتفت؟</h2><div class="cgrid">
    <button id="cFree">${qi('free')}<b>ركّب بحرية</b><small>اسحب وكبّر ورتّب</small></button>
    <button id="cCat">${qi('grid')}<b>حسب الفئة</b><small>اختر قطعة من كل صف</small></button>
    <button id="cAI" class="wide">${qi('spark')}<b>اقتراحات ذكية</b><small>خلني أنسّق لك على ستايلات التريند</small></button></div>`);
  $('cFree').onclick=()=>{ closeSheet(); openBuilder({onSave}); };
  $('cCat').onclick=()=>catPicker(onSave);
  $('cAI').onclick=()=>{ closeSheet(); S.locks={}; S.results=[]; S.oTab='style'; go('outfits'); };
}
function catPicker(onSave){
  const pool=c=>S.items.filter(i=>i.cat===c&&!isOut(i));
  const sel={}; ['top','bottom','shoes'].forEach(c=>{ const p=pool(c)[0]; if(p) sel[c]=p.id; }); if(!sel.top&&pool('full')[0]) sel.full=pool('full')[0].id;
  const cats=ORDER.filter(c=>pool(c).length);
  const prev=()=>{ const ps=Object.values(sel).map(byId).filter(Boolean); $('cpPrev').innerHTML=boardHTML(autoLayout(sortPieces(ps))); };
  openSheet(`<h2>حسب الفئة</h2><div id="cpPrev" class="cpprev"></div>
    ${cats.map(c=>`<div class="lbl" style="margin-top:12px">${CAT[c].e} ${CAT[c].ar}</div>
      <div class="cprow" data-cat="${c}"><button class="none ${sel[c]?'':'on'}" data-id="">بدون</button>${pool(c).map(i=>`<button class="${sel[c]===i.id?'on':''}" data-id="${i.id}"><img src="${i.img}" alt=""></button>`).join('')}</div>`).join('')}
    <button class="btn primary block" id="cpSave" style="margin-top:16px">احفظ الأوتفت</button>`);
  prev();
  $('sheetBody').querySelectorAll('.cprow').forEach(row=>row.onclick=e=>{ const b=e.target.closest('button'); if(!b) return; const c=row.dataset.cat;
    if(b.dataset.id) sel[c]=b.dataset.id; else delete sel[c];
    if(c==='full'&&sel.full){ delete sel.top; delete sel.bottom; } if((c==='top'||c==='bottom')&&sel[c]) delete sel.full;
    $('sheetBody').querySelectorAll('.cprow').forEach(r=>{ const cc=r.dataset.cat; r.querySelectorAll('button').forEach(x=>x.classList.toggle('on',(x.dataset.id||'')===(sel[cc]||''))); });
    prev(); });
  $('cpSave').onclick=async()=>{ const ids=Object.values(sel).filter(byId); if(ids.length<2){ toast('اختر قطعتين على الأقل'); return; }
    await onSave(ids,autoLayout(sortPieces(ids.map(byId)))); closeSheet(); render(); };
}

/* ---- basics library: one-tap illustrated items ---- */
const BASICS = [
  {cat:'top',ar:'تيشيرت',st:'casual',f:'M8 4 4 6.5 5.5 10 7 9.4V20h10V9.4l1.5.6L20 6.5 16 4c-.6 1.4-2.1 2.3-4 2.3S8.6 5.4 8 4z'},
  {cat:'top',ar:'قميص',st:'smart',f:'M8.5 3.5 4 6l1.5 4.5 1.5-.6V21h10V9.9l1.5.6L20 6l-4.5-2.5L12 6z',l:'M12 6v15M8.5 3.5 12 6l3.5-2.5'},
  {cat:'top',ar:'هودي',st:'street',fit:'loose',f:'M8 5 3.5 7.5l1 7 2.5-.5V21h10v-7l2.5.5 1-7L16 5c-.5-1.8-2-3-4-3S8.5 3.2 8 5z',l:'M9 5.5c.8 1.5 1.8 2.3 3 2.3s2.2-.8 3-2.3'},
  {cat:'top',ar:'بلوزة',st:'smart',f:'M9 3.5 5 6l1 4h1.5L6.5 21h11L16.5 10H18l1-4-4-2.5c-.5 1-1.6 1.6-3 1.6S9.5 4.5 9 3.5z'},
  {cat:'bottom',ar:'بنطلون',st:'smart',f:'M7 3h10l1 18h-4.5L12 9.5 10.5 21H6z'},
  {cat:'bottom',ar:'جينز',st:'casual',col:'#4A6A8F',f:'M7 3h10l1.2 18h-4.6L12 9.5 10.4 21H5.8z',l:'M7 6h10M12 3v3'},
  {cat:'bottom',ar:'تنورة',st:'smart',f:'M7.5 4h9l3 16h-15z'},
  {cat:'bottom',ar:'شورت',st:'casual',f:'M6.5 6h11l1 9h-5L12 11l-1.5 4h-5z'},
  {cat:'full',ar:'فستان',st:'evening',f:'M9.5 3h5l-.8 4 4.3 13H6l4.3-13z'},
  {cat:'full',ar:'عباية',st:'trad',col:'#111111',f:'M9 2.5h6l1 4 3.5 15h-15L8 6.5z',l:'M12 4v17'},
  {cat:'full',ar:'ثوب',st:'trad',col:'#F5F5F2',f:'M9 3h6l1.5 3L20 9l-1.5 2.5-2-1V21h-9V10.5l-2 1L4 9l3.5-3z',l:'M12 3.5v6'},
  {cat:'outer',ar:'جاكيت',st:'casual',f:'M8 3.5 4 6v14h16V6l-4-2.5L12 8z',l:'M12 8v12'},
  {cat:'outer',ar:'بليزر',st:'classic',f:'M8 3.5 4 6v15h16V6l-4-2.5-2 3L12 13l-2-6.5z',l:'M12 13v8M8 3.5l2 3M16 3.5l-2 3'},
  {cat:'shoes',ar:'سنيكرز',st:'casual',col:'#F5F5F2',f:'M3 16.5V9l4.5 1.5L11 13l6 1.5c2.2.5 4 1.6 4 3.5H3z',l:'M3 16.5h18'},
  {cat:'shoes',ar:'كعب',st:'evening',f:'M4 18 6 10c3 0 6 3 9 5l5 1v2h-4l-2-2-6 2z'},
  {cat:'bag',ar:'شنطة',st:'casual',f:'M5 9h14l-1 11H6z',l:'M9 9V7a3 3 0 0 1 6 0v2'},
];
function basicImage(b,hex){
  const S2=600, k=S2/24, t=mkCanvas(S2,S2), x=t.getContext('2d'); x.scale(k,k);
  const rgb=hexToRgb(hex), dark=rgbToHex(...rgb.map(v=>v*.62)), p=new Path2D(b.f);
  x.fillStyle=hex; x.fill(p); x.lineJoin='round'; x.lineCap='round'; x.strokeStyle=dark; x.lineWidth=.32; x.stroke(p);
  if(b.l){ x.lineWidth=.28; x.stroke(new Path2D(b.l)); }
  const d=ctx2d(t).getImageData(0,0,S2,S2).data, a=new Uint8ClampedArray(S2*S2); for(let i=0;i<a.length;i++) a[i]=d[i*4+3];
  const src=mkCanvas(S2,S2), sx=src.getContext('2d'); sx.fillStyle='#fff'; sx.fillRect(0,0,S2,S2); sx.drawImage(t,0,0);
  return {src,alpha:a};
}
function librarySheet(){
  let bi=0, col='#F5F5F2';
  const draw=()=>{ const b=BASICS[bi], c=b.col&&col==='#F5F5F2'&&!draw.touched?b.col:col;
    $('sheetBody').querySelector('#lbPrev').innerHTML=`<img src="${(()=>{ const {src,alpha}=basicImage(b,c); return compose(src,alpha,{auto:false}).img; })()}" alt="">`;
    $('sheetBody').querySelectorAll('#lbList button').forEach((x,i)=>x.classList.toggle('on',i===bi));
    $('sheetBody').querySelectorAll('#lbCol .sw').forEach(x=>x.classList.toggle('on',x.dataset.v===c)); draw.cur=c; };
  openSheet(`<h2>📚 مكتبة الأساسيات</h2><p class="hint" style="margin-top:-6px">ما عندك صورة؟ اختر النوع واللون وتنضاف على طول.</p>
    <div class="preview" id="lbPrev" style="aspect-ratio:1.3;margin-top:10px"></div>
    <div class="wrapchips" id="lbList">${BASICS.map((b,i)=>`<button class="chip" data-i="${i}">${b.ar}</button>`).join('')}</div>
    <div class="swatches" id="lbCol" style="margin-top:14px">${PALETTE.map(p=>`<button class="sw" data-v="${p[0]}" style="background:${p[0]}" aria-label="${p[1]}"></button>`).join('')}</div>
    <button class="btn primary block" id="lbAdd" style="margin-top:16px">أضف للخزانة</button>`);
  $('lbList').onclick=e=>{ const b=e.target.closest('[data-i]'); if(!b) return; bi=+b.dataset.i; draw.touched=false; col='#F5F5F2'; draw(); };
  $('lbCol').onclick=e=>{ const b=e.target.closest('[data-v]'); if(!b) return; col=b.dataset.v; draw.touched=true; draw(); };
  $('lbAdd').onclick=()=>{ const b=BASICS[bi], c=draw.cur, {src,alpha}=basicImage(b,c);
    const it={id:uid(),_src:src,_alpha:alpha,_colorAuto:false,maskKind:'basic',enh:false,bright:0,useCut:true,cat:b.cat,style:b.st,fit:b.fit,
      name:`${b.ar} ${colorInfo(c).name}`,brand:'',price:'',size:'',tags:[],seasons:['all'],occs:[],fav:false,laundry:false,wears:0,lastWorn:0,added:Date.now(),basic:true};
    recompose(it); it.color=c; it.color2=null; editItem([it],0,true); };
  draw();
}

/* ---- share as image ---- */
async function layoutPNG(layout,label){
  const W=900,H=1200,c=mkCanvas(W,H),x=c.getContext('2d'); x.fillStyle='#F3F3F3'; x.fillRect(0,0,W,H);
  for(const l of [...layout].sort((a,b)=>a.z-b.z)){ const it=byId(l.id)||S.wish.find(w=>w.id===l.id); if(!it) continue;
    const im=await loadImg(it.img), w=l.w*W, h=w*im.naturalHeight/im.naturalWidth;
    x.globalCompositeOperation=it.cut?'source-over':'multiply'; x.drawImage(im,l.x*W,l.y*H,w,h); }
  x.globalCompositeOperation='source-over'; x.fillStyle='#8A8A8A'; x.font="600 26px Alex, sans-serif"; x.textAlign='center'; x.direction='rtl';
  x.fillText(label?label+' · Closia':'Closia',W/2,H-36);
  return new Promise(r=>c.toBlob(r,'image/png'));
}
async function shareBlob(blob,name){
  const f=new File([blob],name,{type:blob.type});
  if(navigator.canShare&&navigator.canShare({files:[f]})){ try{ await navigator.share({files:[f]}); return; }catch(e){ if(e.name==='AbortError') return; } }
  const a=document.createElement('a'); a.href=URL.createObjectURL(f); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),4000);
}
async function shareOutfit(layout,label){ busy(true,'أجهّز الصورة…'); try{ await shareBlob(await layoutPNG(layout,label),'outfit.png'); } finally{ busy(false); } }
async function shareCloset(){
  const its=S.items.filter(i=>!isOut(i)).sort((a,b)=>b.added-a.added).slice(0,12); if(!its.length){ toast('أضف قطع أول'); return; }
  busy(true,'أجهّز صورة خزانتك…');
  try{ const W=900,cols=3,cell=W/cols,H=Math.ceil(its.length/cols)*cell*1.2+110,c=mkCanvas(W,H),x=c.getContext('2d');
    x.fillStyle='#F3F3F3'; x.fillRect(0,0,W,H); x.fillStyle='#1B1B1B'; x.font="800 40px Alex, sans-serif"; x.textAlign='center'; x.direction='rtl';
    x.fillText(`${S.set.name||'Closia'} · ${S.items.length} قطعة`,W/2,64);
    for(let i=0;i<its.length;i++){ const it=its[i], im=await loadImg(it.img), cx=(cols-1-i%cols)*cell, cy=90+Math.floor(i/cols)*cell*1.2;
      x.fillStyle='#fff'; x.beginPath(); x.roundRect?x.roundRect(cx+10,cy+10,cell-20,cell*1.2-20,26):x.rect(cx+10,cy+10,cell-20,cell*1.2-20); x.fill();
      const k=Math.min((cell-60)/im.naturalWidth,(cell*1.2-60)/im.naturalHeight), w=im.naturalWidth*k, h=im.naturalHeight*k;
      x.globalCompositeOperation=it.cut?'source-over':'multiply'; x.drawImage(im,cx+(cell-w)/2,cy+(cell*1.2-h)/2,w,h); x.globalCompositeOperation='source-over'; }
    await shareBlob(await new Promise(r=>c.toBlob(r,'image/png')),'closet.png');
  } finally{ busy(false); }
}
/* ---------------- calendar & trips ---------------- */
function renderPlan(){
  const v=$('v-plan');
  v.innerHTML=`<div class="seg big" id="pSeg"><button class="${S.pTab==='cal'?'on':''}" data-v="cal">📅 التقويم</button><button class="${S.pTab==='trips'?'on':''}" data-v="trips">✈️ السفرات</button></div><div id="pBody"></div>`;
  $('pSeg').onclick=e=>{ const b=e.target.closest('[data-v]'); if(!b) return; S.pTab=b.dataset.v; render(); };
  if(S.pTab==='cal') renderCal(); else renderTrips();
}
function renderCal(){
  const {y,m}=S.cal, first=new Date(y,m,1,12), startDow=first.getDay(), dim=new Date(y,m+1,0).getDate(), td=today();
  const cells=[]; for(let i=0;i<startDow;i++) cells.push(null); for(let d=1;d<=dim;d++) cells.push(`${y}-${pad2(m+1)}-${pad2(d)}`);
  while(cells.length%7) cells.push(null);
  const wd=['أحد','إثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'];
  const monthWorn=Object.values(S.plans).filter(p=>p.worn&&p.date.startsWith(`${y}-${pad2(m+1)}`)).length;
  const tp=S.plans[td];
  $('pBody').innerHTML=`
    <div class="calhead"><button id="cPrev">${IC.prev}</button><h3>${first.toLocaleDateString(LOC,{month:'long',year:'numeric'})}</h3><button id="cNext">${IC.next}</button></div>
    <div class="cal" id="calg">${wd.map(w=>`<div class="wd">${w}</div>`).join('')}
      ${cells.map(c=>{ if(!c) return '<div class="d out"></div>'; const p=S.plans[c];
        return `<button class="d ${c===td?'today':''}" data-d="${c}"><span class="n">${+c.slice(8)}</span>${p?boardHTML(p.layout||autoLayout(p.ids.map(byId).filter(Boolean))):''}${p&&p.worn?'<span class="ok">✓</span>':''}</button>`; }).join('')}</div>
    <p class="hint" style="text-align:center;margin-top:10px">لبست ${monthWorn} أوتفت هالشهر</p>
    <div class="todaycard">${tp?boardHTML(tp.layout||autoLayout(tp.ids.map(byId).filter(Boolean))):'<div class="board" style="display:grid;place-items:center;font-size:30px">✨</div>'}
      <div class="tx"><h4>اليوم</h4><p class="hint" style="margin:0 0 10px">${tp?(tp.worn?'سجلت لبسة اليوم ✓':'مخطط له — أكّد إذا لبسته'):'ما حددت وش بتلبس'}</p>
      <button class="btn primary" id="todayBtn" style="padding:10px 16px">${tp?'افتح':'نسّقلي'}</button></div></div>`;
  $('cPrev').onclick=()=>{ S.cal.m--; if(S.cal.m<0){S.cal.m=11;S.cal.y--;} renderCal(); };
  $('cNext').onclick=()=>{ S.cal.m++; if(S.cal.m>11){S.cal.m=0;S.cal.y++;} renderCal(); };
  $('calg').onclick=e=>{ const b=e.target.closest('[data-d]'); if(b) daySheet(b.dataset.d); };
  $('todayBtn').onclick=()=>tp?daySheet(td):styleFor(td);
}
function styleFor(date){ S.planDate=date===today()?null:date; S.wxManual=false; S.results=[]; S.locks={}; S.oTab='style'; go('outfits'); }
function daySheet(date){
  const p=S.plans[date], future=date>today();
  if(!p){
    openSheet(`<h2>${fmtDate(date)}</h2><p class="hint" style="margin-top:-8px;margin-bottom:16px">${wxDay(date)?`${wxIcon(wxDay(date).code)} ${wxDay(date).min}°–${wxDay(date).max}°`:''}</p>
      <div style="display:grid;gap:10px">
        <button class="btn primary" id="dStyle">✨ نسّقلي لهاليوم</button>
        <button class="btn" id="dSaved">♡ اختر من المحفوظة</button>
        <button class="btn" id="dBuild">${IC.edit} ركّبه بنفسي</button></div>`);
    $('dStyle').onclick=()=>{ closeSheet(); styleFor(date); };
    $('dBuild').onclick=()=>{ closeSheet(); openBuilder({title:fmtDate(date,{day:'numeric',month:'long'}),onSave:async(ids,layout)=>{ await setPlan(date,ids,layout,!future); toast('انضاف ✓'); }}); };
    $('dSaved').onclick=()=>{
      const list=S.outfits.filter(o=>o.ids.some(byId));
      openSheet(`<h2>اختر أوتفت</h2>${list.length?`<div class="ogrid" id="pickO">${list.map(o=>`<button class="oc" data-id="${o.id}">${boardHTML(layoutOf(o))}</button>`).join('')}</div>`:'<p class="hint">ما عندك أوتفتات محفوظة.</p>'}`);
      if($('pickO')) $('pickO').onclick=async e=>{ const c=e.target.closest('.oc'); if(!c) return; const o=S.outfits.find(x=>x.id===c.dataset.id);
        await setPlan(date,o.ids,o.layout,!future); closeSheet(); render(); toast('انضاف ✓'); }; };
    return;
  }
  const lay=p.layout||autoLayout(p.ids.map(byId).filter(Boolean));
  openSheet(`<div class="sheethead"><h2>${fmtDate(date)}</h2></div>${boardHTML(lay)}
    <div style="display:grid;gap:10px;margin-top:14px">
      ${future?'':`<button class="btn ${p.worn?'':'primary'}" id="dWorn">${p.worn?'✓ لبسته (اضغط للإلغاء)':'✓ أكّد إني لبسته'}</button>`}
      <div class="row"><button class="btn" id="dSave">${IC.heart} احفظه</button><button class="btn" id="dEdit">${IC.edit} عدّل</button></div>
      <button class="btn danger" id="dDel">${IC.trash} شيله من اليوم</button></div>`);
  if($('dWorn')) $('dWorn').onclick=async()=>{ await setPlan(date,p.ids,p.layout,!p.worn); closeSheet(); render(); };
  $('dSave').onclick=async()=>{ await saveOutfit(p.ids,lay); toast('انحفظ ♥'); };
  $('dEdit').onclick=()=>{ closeSheet(); openBuilder({ids:p.ids,layout:lay,title:fmtDate(date,{day:'numeric',month:'long'}),onSave:async(ids,layout)=>{ await setPlan(date,ids,layout,p.worn); }}); };
  $('dDel').onclick=async()=>{ await removePlan(date); closeSheet(); render(); };
}

function renderTrips(){
  const list=[...S.trips].sort((a,b)=>a.from<b.from?1:-1);
  $('pBody').innerHTML=`<button class="btn primary block" id="newTrip" style="margin-bottom:14px">${IC.plus} سفرة جديدة</button>
    ${list.map(t=>{ const ids=tripItems(t), done=ids.filter(id=>t.packed[id]).length;
      return `<button class="trip" data-id="${t.id}"><h4>✈️ ${esc(t.name)}</h4>
        <div class="sm">${fmtDate(t.from,{day:'numeric',month:'short'})} ← ${fmtDate(t.to,{day:'numeric',month:'short'})} · ${t.days.length} أيام · ${WXM[t.wx].e} ${WXM[t.wx].ar}</div>
        <div class="sm">${ids.length} قطعة للشنطة · جهزت ${done}</div><div class="bar"><i style="width:${ids.length?done/ids.length*100:0}%"></i></div></button>`; }).join('')}
    ${list.length?'':`<div class="empty"><div class="big">🧳</div><h3>مسافر قريب؟</h3><p class="hint">قلّي كم يوم ووين، وأطلع لك أوتفت لكل يوم بأقل عدد قطع — وقائمة شنطة تأشّر عليها.</p></div>`}`;
  $('newTrip').onclick=newTripSheet;
  $('pBody').onclick=e=>{ const c=e.target.closest('.trip'); if(c) tripSheet(S.trips.find(t=>t.id===c.dataset.id)); };
}
const tripItems = t => [...new Set(t.days.flatMap(d=>d.ids))].filter(byId);
function newTripSheet(){
  const f=addDays(today(),7), occSel=new Set(['casual','out']);
  let wx=S.wxInfo?wxFor(f):autoWxByMonth(f);
  openSheet(`<h2>سفرة جديدة</h2>
    <div class="field"><label>وين؟</label><input class="inp" id="tName" placeholder="مثلاً: دبي، لندن، العلا"></div>
    <div class="grid2"><div class="field"><label>من</label><input type="date" class="inp" id="tFrom" value="${f}"></div>
      <div class="field"><label>إلى</label><input type="date" class="inp" id="tTo" value="${addDays(f,3)}"></div></div>
    <div class="field"><label>الجو هناك</label><div class="seg" id="tWx">${WX.map(w=>`<button class="${wx===w.id?'on':''}" data-v="${w.id}">${w.e} ${w.ar}</button>`).join('')}</div></div>
    <div class="field"><label>وش البرنامج؟</label><div class="wrapchips" id="tOcc">${OCCS.map(o=>`<button class="chip ${occSel.has(o.id)?'on':''}" data-v="${o.id}">${o.e} ${o.ar}</button>`).join('')}</div></div>
    <button class="btn primary block" id="tGo">✨ جهّز لي الشنطة</button>`);
  $('tWx').onclick=e=>{ const b=e.target.closest('[data-v]'); if(!b) return; wx=b.dataset.v; $('tWx').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b)); };
  $('tOcc').onclick=e=>{ const b=e.target.closest('[data-v]'); if(!b) return; b.classList.toggle('on'); };
  $('tGo').onclick=async()=>{
    const name=$('tName').value.trim()||'سفرة', from=$('tFrom').value, to=$('tTo').value;
    if(!from||!to||to<from){ toast('تأكد من التواريخ'); return; }
    const occs=[...$('tOcc').querySelectorAll('.on')].map(x=>x.dataset.v); if(!occs.length) occs.push('casual');
    const t={id:uid(),name,from,to,wx,occs,days:[],packed:{},created:Date.now()};
    planTrip(t);
    if(!t.days.length){ toast('أحتاج قطع أكثر عشان أجهّز السفرة'); return; }
    S.trips.push(t); await DB.put('trips',t); closeSheet(); renderTrips(); tripSheet(t); };
}
function planTrip(t){
  let n=Math.round((parseYmd(t.to)-parseYmd(t.from))/864e5)+1; n=clamp(n,1,21);
  const chosen=new Set(), keys=new Set(); t.days=[];
  for(let i=0;i<n;i++){
    const occ=t.occs[i%t.occs.length];
    const r=generate({occ,wx:t.wx,locks:{},n:1,bonus:chosen,avoid:keys,ignoreRecent:true,look:'all'})[0]
      || generate({occ:null,wx:t.wx,locks:{},n:1,bonus:chosen,avoid:keys,ignoreRecent:true,look:'all'})[0];
    if(!r) break;
    r.pieces.forEach(p=>chosen.add(p.id)); keys.add(r.key);
    t.days.push({date:addDays(t.from,i),occ,ids:r.pieces.map(p=>p.id)});
  }
}
function tripSheet(t){
  const ids=tripItems(t), groups=CATS.map(c=>({c,items:ids.map(byId).filter(i=>i.cat===c.id)})).filter(g=>g.items.length);
  const done=ids.filter(id=>t.packed[id]).length;
  openSheet(`<div class="sheethead"><h2>✈️ ${esc(t.name)}</h2><span class="hint">${done}/${ids.length}</span></div>
    <div class="bar" style="margin:-4px 0 16px"><i style="width:${ids.length?done/ids.length*100:0}%"></i></div>
    <div class="secthead" style="margin-top:0"><h3>🧳 الشنطة</h3><small>${ids.length} قطعة لـ ${t.days.length} أوتفت</small></div>
    <div id="tPack">${groups.map(g=>`<div class="lbl" style="margin-top:10px">${g.c.e} ${g.c.ar}</div>${g.items.map(i=>`
      <button class="pack ${t.packed[i.id]?'done':''}" data-id="${i.id}"><span class="im"><img src="${i.img}" alt=""></span><span class="nm">${esc(itemName(i))}</span><span class="ck">${t.packed[i.id]?'✓':''}</span></button>`).join('')}`).join('')}</div>
    <div class="secthead"><h3>👗 أوتفت كل يوم</h3><small>اضغط 🔀 للتغيير</small></div>
    <div class="dayrow" id="tDays">${t.days.map((d,k)=>`<div class="dc">${boardHTML(autoLayout(d.ids.map(byId).filter(Boolean)))}
      <div class="cap"><span>${fmtDate(d.date,{weekday:'short',day:'numeric'})} ${OCC[d.occ]?OCC[d.occ].e:''}</span><button data-k="${k}" aria-label="غيّر">🔀</button></div></div>`).join('')}</div>
    <div style="display:grid;gap:10px;margin-top:16px">
      <button class="btn primary" id="tCal">${IC.cal} أضف الأوتفتات للتقويم</button>
      <div class="row"><button class="btn" id="tRe">${IC.shuffle} رتّبها من جديد</button><button class="btn danger" id="tDel">${IC.trash} حذف</button></div></div>`);
  $('tPack').onclick=async e=>{ const b=e.target.closest('[data-id]'); if(!b) return; t.packed[b.dataset.id]=!t.packed[b.dataset.id]; await DB.put('trips',t); tripSheet(t); renderTrips(); };
  $('tDays').onclick=async e=>{ const b=e.target.closest('[data-k]'); if(!b) return; const k=+b.dataset.k, d=t.days[k];
    const others=new Set(t.days.filter((_,j)=>j!==k).flatMap(x=>x.ids)), keys=new Set(t.days.map(x=>[...x.ids].sort().join('|')));
    const r=generate({occ:d.occ,wx:t.wx,locks:{},n:3,bonus:others,avoid:keys,ignoreRecent:true,look:'all'}); if(!r.length) return;
    d.ids=pick(r).pieces.map(p=>p.id); await DB.put('trips',t); tripSheet(t); };
  $('tCal').onclick=async()=>{ for(const d of t.days) if(!S.plans[d.date]) await setPlan(d.date,d.ids,null,false); toast('انضافت للتقويم 📅'); };
  $('tRe').onclick=async()=>{ planTrip(t); t.packed={}; await DB.put('trips',t); tripSheet(t); renderTrips(); };
  $('tDel').onclick=async()=>{ if(!confirm('تحذف السفرة؟')) return; S.trips=S.trips.filter(x=>x!==t); await DB.del('trips',t.id); closeSheet(); renderTrips(); };
}

/* ---------------- stats ---------------- */
function renderStats(){
  const v=$('v-stats'), its=S.items;
  if(!its.length){ v.innerHTML=`<div class="empty"><div class="big">📊</div><h3>ما فيه بيانات للحين</h3><p class="hint">أضف ملابسك وسجّل وش تلبس، وأوريك إحصائيات خزانتك.</p></div>`; return; }
  const priced=its.filter(i=>+i.price>0), value=priced.reduce((s,i)=>s+ +i.price,0);
  const pw=priced.filter(i=>i.wears>0), cpw=pw.length?pw.reduce((s,i)=>s+ +i.price,0)/pw.reduce((s,i)=>s+i.wears,0):null;
  const used90=its.filter(i=>daysSince(i.lastWorn)<=90).length, usage=Math.round(used90/its.length*100);
  const wornPlans=Object.values(S.plans).filter(p=>p.worn);
  const catN=CATS.map(c=>({c,n:its.filter(i=>i.cat===c.id).length})).filter(x=>x.n), maxC=Math.max(...catN.map(x=>x.n));
  const fam={}; its.forEach(i=>{ const f=colorInfo(i.color).family; fam[f]=(fam[f]||0)+1; });
  const fams=Object.entries(fam).sort((a,b)=>b[1]-a[1]);
  const most=[...its].filter(i=>i.wears).sort((a,b)=>b.wears-a.wears).slice(0,8);
  const forgotten=its.filter(i=>!i.laundry&&((!i.wears&&daysSince(i.added)>=14)||(i.wears&&daysSince(i.lastWorn)>60))).slice(0,10);
  const neverN=its.filter(i=>!i.wears).length;
  const bestVal=pw.map(i=>({i,c:+i.price/i.wears})).sort((a,b)=>a.c-b.c).slice(0,5);
  const strip=(arr,lab)=>`<div class="hlist">${arr.map(x=>{ const i=x.i||x; return `<button class="h" data-id="${i.id}"><div class="im"><img src="${i.img}" alt=""></div>${lab(x)}</button>`; }).join('')}</div>`;
  v.innerHTML=`
    <div class="cards">
      <div class="card"><b>${its.length}</b><span>قطعة بالخزانة</span></div>
      <div class="card"><b>${usage}%</b><span>استخدمتها آخر ٣ شهور</span></div>
      <div class="card"><b>${value?money(value):'—'}</b><span>قيمة الخزانة${priced.length<its.length?` (${priced.length} مسعّرة)`:''}</span></div>
      <div class="card"><b>${cpw!=null?money(cpw):'—'}</b><span>متوسط تكلفة اللبسة</span></div>
    </div>
    ${most.length?`<div class="secthead"><h3>🔥 الأكثر لبس</h3><small>${wornPlans.length} لبسة مسجلة</small></div>${strip(most,i=>`${i.wears} مرة`)}`:''}
    ${forgotten.length?`<div class="secthead"><h3>💤 منسية</h3><small>${neverN} قطعة ما انلبست أبد</small></div>
      <p class="hint" style="margin:-4px 2px 10px">اضغط عليها وخلني أنسّق عليها — أو فكّر تتبرع فيها.</p>${strip(forgotten,i=>i.wears?`قبل ${daysSince(i.lastWorn)} يوم`:'ما انلبست')}`:''}
    ${bestVal.length?`<div class="secthead"><h3>💰 أفضل قيمة</h3><small>أقل تكلفة لكل لبسة</small></div>${strip(bestVal,x=>money(x.c))}`:''}
    <div class="secthead"><h3>🎨 ألوانك</h3></div>
    <div class="panel"><div class="stack">${fams.map(([f,n])=>`<span style="flex:${n};background:${f}"></span>`).join('')}</div>
      <div class="legend">${fams.map(([f,n])=>`<span><i style="background:${f}"></i>${colorInfo(f).name} ${Math.round(n/its.length*100)}%</span>`).join('')}</div></div>
    <div class="panel"><h4>👚 التوزيع</h4>${catN.map(x=>`<div class="hbar"><span class="l">${x.c.e} ${x.c.ar}</span><span class="t"><i style="width:${x.n/maxC*100}%"></i></span><span class="v">${x.n}</span></div>`).join('')}
      ${insight(catN)}</div>`;
  v.onclick=e=>{ const h=e.target.closest('.h'); if(h) itemSheet(byId(h.dataset.id)); };
}
function insight(catN){
  const n=c=>(catN.find(x=>x.c.id===c)||{n:0}).n;
  const t=n('top'), b=n('bottom'), s=n('shoes');
  let tip='';
  if(t&&b&&t/b>3) tip='عندك قطع فوق أكثر بكثير من تحت — بنطلون محايد واحد يفتح لك تركيبات كثيرة.';
  else if(t&&b&&b/t>2) tip='قطع تحت أكثر من فوق — تيشيرت أو قميص محايد بيضاعف أوتفتاتك.';
  else if(!s) tip='أضف أحذيتك عشان تكتمل الأوتفتات.';
  else if(t&&b) tip=`عندك ${t*b+n('full')} تركيبة أساسية ممكنة 👌`;
  return tip?`<p class="hint" style="margin:10px 0 0">💡 ${tip}</p>`:'';
}

/* ---------------- settings ---------------- */
$('settingsBtn').onclick=()=>{
  openSheet(`<h2>الإعدادات</h2>
    <div class="field"><label>العملة</label><div class="wrapchips" id="sCur">${CURS.map(c=>`<button class="chip ${S.set.cur===c?'on':''}" data-v="${c}">${c}</button>`).join('')}</div></div>
    <div class="field"><label>إزالة الخلفية</label>
      <label class="tgl"><input type="checkbox" id="sAI" ${S.set.aiBg!==false?'checked':''}><span>✨ بالذكاء الاصطناعي (أدق — يشتغل على أي خلفية)</span></label>
      <p class="hint" style="margin-top:6px">أول مرة ينزّل محرك صغير (~٤٠ ميقا) ويشتغل بعدها على جوالك بدون نت. صورك ما تطلع من جوالك أبد.</p></div>
    <div class="field"><label>الجو</label><button class="btn block" id="sWx">${IC.pin} ${S.set.wxOn?'تحديث الجو من موقعي':'استخدم موقعي لجو حقيقي'}</button>
      <p class="hint" style="margin-top:6px">موقعك يروح بس لخدمة الطقس المجانية Open-Meteo، وما ينحفظ.</p></div>
    <div class="field"><label>النسخة الاحتياطية</label>
      <p class="hint" style="margin-top:0">كل شي محفوظ <b>على جوالك بس</b>. لو حذفت التطبيق أو مسحت بيانات سفاري يروح كل شي — خذ نسخة كل فترة واحفظها في الملفات أو iCloud.</p>
      <div style="display:grid;gap:10px"><button class="btn" id="bExp">⬇️ تصدير نسخة</button><button class="btn" id="bImp">⬆️ استرجاع نسخة</button></div></div>
    <button class="btn danger block" id="bWipe">${IC.trash} مسح كل شي</button>
    <p class="hint" style="margin-top:18px">📸 نصايح للتصوير: افرد القطعة على خلفية سادة تختلف عن لونها، بإضاءة نهار، وصوّر من فوق. كذا تنشال الخلفية صح ويطلع اللون مضبوط.</p>`);
  $('sCur').onclick=async e=>{ const b=e.target.closest('[data-v]'); if(!b) return; S.set.cur=b.dataset.v; await saveSet();
    $('sCur').querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x===b)); render(); };
  $('sAI').onchange=async e=>{ S.set.aiBg=e.target.checked; await saveSet(); };
  $('sWx').onclick=()=>{ closeSheet(); S.wxManual=false; fetchWeather(true); };
  $('bExp').onclick=exportData;
  $('bImp').onclick=()=>{ $('importIn').value=''; $('importIn').click(); };
  $('bWipe').onclick=async()=>{ if(!confirm('بتنمسح كل القطع والأوتفتات والتقويم. متأكد؟')) return;
    for(const s of ['items','wish','outfits','plans','trips']) await DB.clear(s);
    Object.assign(S,{wish:[],items:[],outfits:[],plans:{},trips:[],results:[],locks:{}}); closeSheet(); render(); toast('انمسح كل شي'); };
};
async function exportData(){
  const data=JSON.stringify({app:'khzanti',v:2,items:S.items,wish:S.wish,outfits:S.outfits,plans:Object.values(S.plans),trips:S.trips,settings:S.set});
  const file=new File([data],`closia-${today()}.json`,{type:'application/json'});
  if(navigator.canShare&&navigator.canShare({files:[file]})){ try{ await navigator.share({files:[file],title:'نسخة Closia'}); return; }catch(e){ if(e.name==='AbortError') return; } }
  const a=document.createElement('a'); a.href=URL.createObjectURL(file); a.download=file.name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),4000);
}
$('importIn').addEventListener('change',async e=>{
  const f=e.target.files[0]; if(!f) return;
  try{ busy(true,'أسترجع النسخة…'); const d=JSON.parse(await f.text()); if(d.app!=='khzanti') throw 0;
    await DB.putMany('items',d.items||[]); await DB.putMany('outfits',d.outfits||[]);
    if(d.wish) await DB.putMany('wish',d.wish);
    if(d.plans) await DB.putMany('plans',d.plans); if(d.trips) await DB.putMany('trips',d.trips);
    if(d.settings){ S.set={...S.set,...d.settings}; await saveSet(); }
    await load(); busy(false); closeSheet(); render(); toast(`رجعت ${(d.items||[]).length} قطعة ✓`);
  }catch(err){ busy(false); toast('الملف مو نسخة من Closia'); }
});

/* ---------------- boot ---------------- */
async function load(){
  S.items=(await DB.all('items')).map(i=>({seasons:['all'],occs:[],tags:[],name:'',brand:'',price:'',size:'',cut:false,ar:1.25,wears:0,lastWorn:0,...i}));
  S.outfits=(await DB.all('outfits')).map(o=>({created:o.date||Date.now(),key:[...o.ids].sort().join('|'),...o}));
  S.plans={}; (await DB.all('plans')).forEach(p=>S.plans[p.date]=p);
  S.trips=await DB.all('trips');
  S.wish=await DB.all('wish');
  S.set={...S.set,...((await DB.get('kv','settings'))||{})};
  S.wxInfo=(await DB.get('kv','wx'))||null;
  // migrate v1: "worn" outfits become calendar entries
  const legacy=S.outfits.filter(o=>o.worn);
  for(const o of legacy){ const d=ymd(new Date(o.date)); if(!S.plans[d]){ S.plans[d]={date:d,ids:o.ids,layout:null,worn:true}; await DB.put('plans',S.plans[d]); }
    delete o.worn; if(o.fav===false){ S.outfits=S.outfits.filter(x=>x!==o); await DB.del('outfits',o.id); } else await DB.put('outfits',o); }
  if(legacy.length) await recomputeWear();
}
(async function init(){
  S.wx=autoWxByMonth();
  try{ await load(); }catch(e){ console.error(e); toast('ما قدرت أفتح التخزين'); }
  if(navigator.storage&&navigator.storage.persist) navigator.storage.persist().catch(()=>{});
  go('closet');
  // refresh weather silently if the user turned it on before and permission is already granted
  if(S.set.wxOn&&(!S.wxInfo||Date.now()-S.wxInfo.at>3*3600e3)){
    try{ const p=await navigator.permissions.query({name:'geolocation'}); if(p.state==='granted') fetchWeather(false); }catch(e){}
  }
  if('serviceWorker' in navigator&&location.protocol==='https:') navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
