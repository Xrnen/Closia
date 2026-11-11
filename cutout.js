/* Closia cut-out engine (runs entirely on the device).
   1. RMBG-1.4 (BRIA) — fine alpha matte of the foreground, keeps soft edges, lace, fur.
   2. SegFormer-B2 clothes — semantic map of garments vs. skin / hair / background.
   On-model photos: the garment of the requested category is isolated from the
   person; product / flat-lay photos: the matte is used directly.
   3. Refinement: guided filter snaps the garment map to image edges, tiny holes in
   the fabric are closed (keeps sheer areas), stray blobs and shadows are dropped,
   and edge colours are decontaminated so no halo of the old background remains. */
(function(){
'use strict';
const TJS = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2';
const PARSE_MODEL = 'Xenova/segformer_b2_clothes', MATTE_MODEL = 'briaai/RMBG-1.4';
const LABELS = ['Background','Hat','Hair','Sunglasses','Upper-clothes','Skirt','Pants','Dress','Belt','Left-shoe','Right-shoe','Face','Left-leg','Right-leg','Left-arm','Right-arm','Bag','Scarf'];
const GROUPS = {
  top:['Upper-clothes'], outer:['Upper-clothes'], bottom:['Pants','Skirt'], full:['Dress'],
  shoes:['Left-shoe','Right-shoe'], bag:['Bag'], acc:['Hat','Sunglasses','Belt','Scarf'],
};
const PERSON = ['Hair','Face','Left-leg','Right-leg','Left-arm','Right-arm'];

let tjs=null, parser=null, matte=null;
async function lib(){ if(!tjs){ tjs=await import(TJS); tjs.env.allowLocalModels=false; } return tjs; }
async function load(onProgress){
  const T=await lib();
  const files={}; const report=p=>{ if(p.status==='progress'&&p.total){ files[p.file]=[p.loaded,p.total];
      const v=Object.values(files), l=v.reduce((a,x)=>a+x[0],0), t=v.reduce((a,x)=>a+x[1],0); onProgress&&onProgress(l/t); } };
  if(!parser) parser=await T.pipeline('image-segmentation',PARSE_MODEL,{dtype:'q8',progress_callback:report});
  if(!matte){
    const model=await T.AutoModel.from_pretrained(MATTE_MODEL,{config:{model_type:'custom'},dtype:'q8',progress_callback:report});
    const proc=await T.AutoProcessor.from_pretrained(MATTE_MODEL,{config:{do_normalize:true,do_pad:false,do_rescale:true,do_resize:true,
      image_mean:[0.5,0.5,0.5],feature_extractor_type:'ImageFeatureExtractor',image_std:[1,1,1],resample:2,rescale_factor:1/255,size:{width:1024,height:1024}}});
    matte={model,proc};
  }
}

/* ---------- image helpers (Float32 maps, 0..1, row-major w*h) ---------- */
function boxBlur(src,w,h,r){ // integral image box mean
  const W=w+1, S=new Float64Array(W*(h+1));
  for(let y=0;y<h;y++){ let row=0; for(let x=0;x<w;x++){ row+=src[y*w+x]; S[(y+1)*W+x+1]=S[y*W+x+1]+row; } }
  const out=new Float32Array(w*h);
  for(let y=0;y<h;y++){ const y0=Math.max(0,y-r), y1=Math.min(h,y+r+1);
    for(let x=0;x<w;x++){ const x0=Math.max(0,x-r), x1=Math.min(w,x+r+1);
      out[y*w+x]=(S[y1*W+x1]-S[y0*W+x1]-S[y1*W+x0]+S[y0*W+x0])/((y1-y0)*(x1-x0)); } }
  return out;
}
function guidedFilter(gray,p,w,h,r,eps){
  const N=w*h, gp=new Float32Array(N), gg=new Float32Array(N);
  for(let i=0;i<N;i++){ gp[i]=gray[i]*p[i]; gg[i]=gray[i]*gray[i]; }
  const mI=boxBlur(gray,w,h,r), mp=boxBlur(p,w,h,r), mIp=boxBlur(gp,w,h,r), mII=boxBlur(gg,w,h,r);
  const a=new Float32Array(N), b=new Float32Array(N);
  for(let i=0;i<N;i++){ const v=mII[i]-mI[i]*mI[i]; a[i]=(mIp[i]-mI[i]*mp[i])/(v+eps); b[i]=mp[i]-a[i]*mI[i]; }
  const ma=boxBlur(a,w,h,r), mb=boxBlur(b,w,h,r), q=new Float32Array(N);
  for(let i=0;i<N;i++) q[i]=Math.min(1,Math.max(0,ma[i]*gray[i]+mb[i]));
  return q;
}
function morph(src,w,h,r,isMax){ // separable min/max filter
  const tmp=new Float32Array(w*h), out=new Float32Array(w*h), pick=isMax?Math.max:Math.min;
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){ let v=src[y*w+x]; for(let k=Math.max(0,x-r);k<=Math.min(w-1,x+r);k++) v=pick(v,src[y*w+k]); tmp[y*w+x]=v; }
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){ let v=tmp[y*w+x]; for(let k=Math.max(0,y-r);k<=Math.min(h-1,y+r);k++) v=pick(v,tmp[k*w+x]); out[y*w+x]=v; }
  return out;
}
const closeHoles=(a,w,h,r)=>morph(morph(a,w,h,r,true),w,h,r,false);
function components(bin,w,h){ // 4-connected labels of bin>0
  const lab=new Int32Array(w*h), q=new Int32Array(w*h), sizes=[0]; let n=0;
  for(let s=0;s<w*h;s++){ if(!bin[s]||lab[s]) continue; n++; let qh=0,qt=0,c=0; q[qt++]=s; lab[s]=n;
    while(qh<qt){ const i=q[qh++]; c++; const x=i%w;
      if(x>0&&bin[i-1]&&!lab[i-1]){lab[i-1]=n;q[qt++]=i-1;} if(x<w-1&&bin[i+1]&&!lab[i+1]){lab[i+1]=n;q[qt++]=i+1;}
      if(i>=w&&bin[i-w]&&!lab[i-w]){lab[i-w]=n;q[qt++]=i-w;} if(i<w*h-w&&bin[i+w]&&!lab[i+w]){lab[i+w]=n;q[qt++]=i+w;} }
    sizes.push(c); }
  return {lab,sizes};
}
function labOf(rgba,i){ // fast sRGB→Lab
  const f=v=>{ v/=255; return v>.04045?Math.pow((v+.055)/1.055,2.4):v/12.92; };
  const r=f(rgba[i*4]),g=f(rgba[i*4+1]),b=f(rgba[i*4+2]);
  const k=v=>v>.008856?Math.cbrt(v):7.787*v+16/116;
  const x=k((r*.4124+g*.3576+b*.1805)/.95047), y=k(r*.2126+g*.7152+b*.0722), z=k((r*.0193+g*.1192+b*.9505)/1.08883);
  return [116*y-16,500*(x-y),200*(y-z)];
}
function kmeans(pts,k,iters=10){
  if(pts.length<k) return pts.slice();
  let c=[]; for(let j=0;j<k;j++) c.push(pts[Math.floor((j+.5)*pts.length/k)].slice());
  for(let it=0;it<iters;it++){
    const sum=c.map(()=>[0,0,0,0]);
    for(const p of pts){ let bj=0,bd=1e9; for(let j=0;j<c.length;j++){ const d=(p[0]-c[j][0])**2+(p[1]-c[j][1])**2+(p[2]-c[j][2])**2; if(d<bd){bd=d;bj=j;} }
      const s=sum[bj]; s[0]+=p[0]; s[1]+=p[1]; s[2]+=p[2]; s[3]++; }
    c=sum.map((s,j)=>s[3]?[s[0]/s[3],s[1]/s[3],s[2]/s[3],s[3]]:c[j]);
  }
  return c;
}
// Regional colour vote: removes large areas inside the garment map whose colours belong to a
// neighbouring piece / skin (the parser sometimes bleeds), while thin stripes or prints survive.
function colourConsistency(rgba,g,other,w,h){
  const N=w*h, step=Math.max(1,Math.floor(Math.sqrt(N/6000))), gp=[], op=[];
  for(let y=0;y<h;y+=step) for(let x=0;x<w;x+=step){ const i=y*w+x;
    if(g[i]>.92&&other[i]<.05) gp.push(labOf(rgba,i)); else if(other[i]>.9&&g[i]<.05) op.push(labOf(rgba,i)); }
  if(gp.length<50||op.length<50) return g;
  const d2=(p,q)=>(p[0]-q[0])**2+(p[1]-q[1])**2+(p[2]-q[2])**2, near=(p,c)=>{ let m=1e9; for(const q of c){ const d=d2(p,q); if(d<m) m=d; } return m; };
  const cg=kmeans(gp,6), co=kmeans(op,5), total=cg.reduce((a,c)=>a+(c[3]||0),0);
  // a minority colour of the "garment" that matches the neighbour's colours is a parser bleed
  const own=cg.filter(c=>!((c[3]||0)/total<.35&&near(c,co)<18*18));
  if(!own.length) return g;
  const vote=new Float32Array(N).fill(1);
  for(let i=0;i<N;i++) if(g[i]>.3){ const p=labOf(rgba,i); vote[i]=near(p,own)<=near(p,co)*1.15?1:0; }
  const sm=boxBlur(vote,w,h,Math.max(6,Math.round(Math.min(w,h)/45)));
  const out=new Float32Array(N); for(let i=0;i<N;i++) out[i]=g[i]*Math.min(1,Math.max(0,(sm[i]-.3)/.3));
  return out;
}
function grayOf(rgba,N){ const g=new Float32Array(N); for(let i=0;i<N;i++){ const o=i*4; g[i]=(rgba[o]*.299+rgba[o+1]*.587+rgba[o+2]*.114)/255; } return g; }
async function maskToMap(T,mask,w,h){ // RawImage (1ch) → Float32 0..1 at w×h
  const m=(mask.width===w&&mask.height===h)?mask:await mask.resize(w,h);
  const out=new Float32Array(w*h), ch=m.channels||1; for(let i=0;i<w*h;i++) out[i]=m.data[i*ch]/255; return out;
}

/* ---------- analysis: run both models once per photo ---------- */
async function analyse(canvas,onProgress){
  await load(onProgress);
  const T=await lib(), w=canvas.width, h=canvas.height;
  const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));
  const img=await T.RawImage.fromBlob(blob);
  const parts=await parser(img);
  const maps={}; let person=0;
  for(const p of parts){ maps[p.label]=await maskToMap(T,p.mask,w,h); }
  const area=l=>maps[l]?maps[l].reduce((a,v)=>a+(v>.5),0)/(w*h):0;
  for(const l of PERSON) person+=area(l);
  const {pixel_values}=await matte.proc(img); const {output}=await matte.model({input:pixel_values});
  const am=await T.RawImage.fromTensor(output[0].mul(255).to('uint8'));
  const alpha=await maskToMap(T,am,w,h);
  const garmentArea={}; for(const [c,ls] of Object.entries(GROUPS)) garmentArea[c]=ls.reduce((a,l)=>a+area(l),0);
  return {w,h,maps,alpha,person,garmentArea};
}
function guessCategory(an){
  const g=an.garmentArea; if(g.full>.04&&g.full>=g.top*.8) return 'full';
  const order=['top','bottom','shoes','bag','acc'].sort((a,b)=>g[b]-g[a]); return g[order[0]]>.01?order[0]:null;
}

/* ---------- final alpha for a category ---------- */
function alphaFor(an,rgba,cat){
  const {w,h,maps}=an, N=w*h, gray=grayOf(rgba,N);
  let a=an.alpha.slice();
  const onModel=an.person>.02;
  const group=(GROUPS[cat]||[]).filter(l=>maps[l]);
  if(onModel&&group.length){
    // garment probability map snapped to image edges
    let g=new Float32Array(N); for(const l of group){ const m=maps[l]; for(let i=0;i<N;i++) g[i]=Math.max(g[i],m[i]); }
    { // pieces / skin that are not the requested garment act as the 'other' colour model
      const other=new Float32Array(N);
      for(const l of LABELS) if(maps[l]&&l!=='Background'&&!group.includes(l)){ const m=maps[l]; for(let i=0;i<N;i++) other[i]=Math.max(other[i],m[i]); }
      g=colourConsistency(rgba,g,other,w,h); }
    const r=Math.max(4,Math.round(Math.min(w,h)/90));
    const gr=guidedFilter(gray,g,w,h,r,1e-3);
    const core=morph(g,w,h,Math.max(2,r>>1),false);              // surely-garment interior
    for(let i=0;i<N;i++){ const edge=Math.min(1,Math.max(0,(gr[i]-.3)/.4)); a[i]=Math.min(a[i]>.02?Math.max(a[i],core[i]*.97):a[i],edge); }
    // never keep hair / skin that overlaps the garment edge
    const body=new Float32Array(N); for(const l of PERSON) if(maps[l]){ const m=maps[l]; for(let i=0;i<N;i++) body[i]=Math.max(body[i],m[i]); }
    const br=guidedFilter(gray,body,w,h,Math.max(2,r>>1),1e-3);
    for(let i=0;i<N;i++){ const s=Math.min(1,Math.max(0,(br[i]-.45)/.3)); if(s>0&&core[i]<.5) a[i]*=1-s; }
  }
  // close pin-holes (glitter, stitching) without filling large sheer areas
  const closed=closeHoles(a,w,h,Math.max(2,Math.round(Math.min(w,h)/400)));
  for(let i=0;i<N;i++) if(closed[i]>.9&&a[i]<closed[i]) a[i]=Math.max(a[i],closed[i]*.98);
  // keep the main piece (and big parts touching it), drop stray blobs / shadows
  const bin=new Uint8Array(N); for(let i=0;i<N;i++) bin[i]=a[i]>.5;
  const {lab,sizes}=components(bin,w,h), big=sizes.reduce((m,v)=>Math.max(m,v),0);
  const keepLab=sizes.map(s=>s>=Math.max(big*.06,N*.0015));
  const keep=new Float32Array(N); for(let i=0;i<N;i++) keep[i]=bin[i]&&keepLab[lab[i]]?1:0;
  const near=morph(keep,w,h,3,true);
  for(let i=0;i<N;i++) a[i]*=near[i];
  return a;
}
// Replace the colour of semi-transparent edge pixels with nearby garment colour (no halo).
function decontaminate(rgba,a,w,h){
  const N=w*h, solid=new Float32Array(N), ch=[new Float32Array(N),new Float32Array(N),new Float32Array(N)];
  for(let i=0;i<N;i++){ const s=a[i]>.92?1:0; solid[i]=s; for(let c=0;c<3;c++) ch[c][i]=rgba[i*4+c]*s; }
  const r=Math.max(3,Math.round(Math.min(w,h)/200)), ms=boxBlur(solid,w,h,r), mc=ch.map(x=>boxBlur(x,w,h,r));
  for(let i=0;i<N;i++){ const v=a[i]; if(v>.02&&v<.92&&ms[i]>.05){ const t=1-v; for(let c=0;c<3;c++) rgba[i*4+c]=rgba[i*4+c]*(1-t)+(mc[c][i]/ms[i])*t; } }
}

window.ClosiaCutout = {
  ready:()=>!!(parser&&matte),
  analyse, guessCategory,
  /** Alpha (Uint8ClampedArray 0..255) isolating the garment of `cat` (rgba = the photo's pixels). */
  alpha(an,rgba,cat){ const a=alphaFor(an,rgba,cat), out=new Uint8ClampedArray(a.length); for(let i=0;i<a.length;i++) out[i]=a[i]*255; return out; },
  /** Clean edge colours in-place for a given 0..255 alpha. */
  decontaminate(rgba,alphaU8,w,h){ const a=new Float32Array(alphaU8.length); for(let i=0;i<a.length;i++) a[i]=alphaU8[i]/255; decontaminate(rgba,a,w,h); },
  onModel:an=>an.person>.02,
  _internals:{boxBlur,guidedFilter,morph,components,alphaFor,decontaminate,colourConsistency,GROUPS},
};
})();
