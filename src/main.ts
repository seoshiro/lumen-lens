import '@fontsource-variable/inter';
import '@fontsource/bodoni-moda/latin-400.css';
import '@fontsource/bodoni-moda/latin-400-italic.css';
import './style.css';
import { COPY, type Locale } from './content';
import { CHAPTERS, chapterAt, chapterOpacity, scrollProgress, smooth } from './timeline';

const initial=new URLSearchParams(location.search).get('lang');
let locale: Locale=initial==='ru'||initial==='kk'?initial:'en';
const base=import.meta.env.BASE_URL;
const icon=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
const down=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16M6 14l6 6 6-6"/></svg>`;
const app=document.querySelector<HTMLDivElement>('#app')!;
const motionMedia=window.matchMedia('(prefers-reduced-motion: reduce)');
let reduced=motionMedia.matches;
try{const stored=localStorage.getItem('lumen-reduced');if(stored!==null)reduced=stored==='true';}catch{/* Preferences remain available without storage. */}
let webgl=false;
let sceneStatus:'loading'|'ready'|'failed'='loading';
let scene: Awaited<ReturnType<typeof import('./scene')['createScene']>>|undefined;
let progress=0;
let pending=0;
let measurements={start:0,range:1};
let lastDiagnostics:ReturnType<NonNullable<typeof scene>['render']>|undefined;

function markup(){
  const c=COPY[locale];
  const canvas=document.querySelector<HTMLCanvasElement>('#lens-canvas');
  document.documentElement.lang=locale;document.title=`LUMEN — ${locale==='en'?'Light, in layers.':locale==='ru'?'Свет, по слоям.':'Жарық, қабат-қабат.'}`;
  app.innerHTML=`
    <a class="skip" href="#study">${c.skip}</a>
    <header class="header"><a href="#lens" class="wordmark" aria-label="LUMEN">LUMEN<span class="wordmark-dot"></span></a>
      <nav class="top-nav" aria-label="${locale==='en'?'Main navigation':locale==='ru'?'Навигация':'Навигация'}"><a href="#inside" data-chapter="2">${c.inside}</a><a href="#study">${c.notes}</a></nav>
      <div class="header-actions"><div class="languages" aria-label="Language">${(['en','ru','kk'] as Locale[]).map(l=>`<button type="button" data-locale="${l}" aria-pressed="${l===locale}" lang="${l}">${l==='kk'?'ҚАЗ':l.toUpperCase()}</button>`).join('')}</div><a class="pill header-cta" href="#inside" data-chapter="1">${c.explore}${icon}</a></div>
    </header>
    <main><h1 class="sr-only">LUMEN L–01 — ${c.kicker.split(' · ')[1]}</h1>
      <section class="experience" id="lens" aria-label="L–01"><div class="stage">
        <div class="stage-glow"></div>
        <canvas id="lens-canvas" role="img" aria-label="${c.stageAlt}"></canvas>
        <div class="fallback"><img src="${base}stills/assembled.webp" alt="${c.stageAlt}"/><p>${c.fallback}</p></div>
        <div class="hero chapter" data-panel="0"><p class="eyebrow">${c.kicker}</p><h2 class="hero-title">${c.title}</h2><p class="hero-intro">${c.intro}</p></div>
        ${c.captions.slice(1).map(([title,body],i)=>`<div class="caption chapter caption-${i+1}" data-panel="${i+1}" aria-hidden="true"><p class="eyebrow">0${i+2} / ${c.chapters[i+1]}</p><h2>${title}</h2><p>${body}</p></div>`).join('')}
        <div class="part-labels" aria-hidden="true">${[1,4,8].map((idx,i)=>`<span class="part-label" data-anchor="${i}"><span class="leader"></span><b>0${idx+1}</b>${c.labels[idx]}</span>`).join('')}</div>
        <nav class="chapter-nav" aria-label="${locale==='en'?'Animation chapters':locale==='ru'?'Этапы анимации':'Анимация кезеңдері'}">${c.chapters.map((name,i)=>`<button type="button" data-chapter="${i}" aria-label="0${i+1} — ${name}" ${i===0?'aria-current="step"':''}><span class="nav-name">${name}</span><span class="nav-dot"></span></button>`).join('')}</nav>
        <div class="stage-bottom"><span class="catalogue">L–01 <span>/</span> <span class="chapter-name">${c.chapters[0]}</span></span><a href="#inside" data-chapter="1" class="scroll-prompt">${c.scroll}${down}</a><button type="button" class="motion-toggle" aria-pressed="${reduced}" aria-label="${reduced?c.motionOff:c.motionOn}"><span class="motion-icon"></span>${reduced?c.static:c.motion}</button></div>
        <div class="scroll-progress"><span></span></div>
      </div></section>
      <section class="study content-width" id="study"><div class="study-copy"><p class="eyebrow">${c.storyKicker}</p><h2>${c.storyTitle}</h2><p class="body-copy">${c.storyBody}</p><p class="small-copy">${c.storySmall}</p><dl class="facts">${c.details.map((d,i)=>`<div><dt>0${i+1}</dt><dd>${d}</dd></div>`).join('')}</dl></div><figure class="study-image"><img src="${base}stills/assembled.webp" alt="${c.stageAlt}" loading="lazy" width="1400" height="1200"/><figcaption>LUMEN <i>L–01</i><span>${c.kicker.split(' · ')[1]}</span></figcaption></figure></section>
      <section class="details" id="details"><div class="gallery-heading content-width"><div><p class="eyebrow">${c.galleryKicker}</p><h2>${c.galleryTitle}</h2></div><div class="gallery-controls"><p>${c.galleryHint}</p><button type="button" data-gallery="-1" aria-label="${c.galleryPrev}">${icon}</button><button type="button" data-gallery="1" aria-label="${c.galleryNext}">${icon}</button></div></div>
        <div class="gallery" tabindex="0" role="region" aria-label="${c.galleryKicker}">${c.cards.map(([num,title,desc],i)=>`<article class="detail-card"><div class="detail-art"><img src="${base}stills/${['glass','iris','mount'][i]}.webp" alt="${desc}" loading="lazy" width="1400" height="1200"/></div><div class="card-copy"><span class="eyebrow">${num}</span><h3>${title}</h3><p>${desc}</p></div></article>`).join('')}</div>
        <div class="layer-index content-width">${c.labels.map((l,i)=>`<span><b>${String(i+1).padStart(2,'0')}</b>${l}</span>`).join('')}</div>
      </section>
      <section class="closing content-width"><p class="eyebrow">LUMEN / L–01</p><h2>${c.closing}</h2><img class="closing-lens" src="${base}stills/assembled.webp" alt="${c.stageAlt}" loading="lazy" width="1400" height="1200"/><p>${c.closingBody}</p><a class="pill" href="#lens">${c.replay}${icon}</a></section>
    </main>
    <footer class="footer content-width"><a class="wordmark" href="#lens">LUMEN<span class="wordmark-dot"></span></a><p>${c.footer}</p><span>${c.concept}</span></footer>`;
  if(canvas){canvas.setAttribute('aria-label',c.stageAlt);document.querySelector('#lens-canvas')!.replaceWith(canvas);}
  bind();applyMode();measure();update();
}

function applyMode(){
  document.documentElement.classList.toggle('reduced',reduced);
  document.documentElement.classList.toggle('has-webgl',webgl);
  document.documentElement.classList.toggle('no-webgl',sceneStatus==='failed');
  document.documentElement.classList.toggle('is-loading',sceneStatus==='loading');
  const toggle=document.querySelector<HTMLButtonElement>('.motion-toggle');
  if(toggle){const c=COPY[locale];toggle.setAttribute('aria-pressed',String(reduced));toggle.setAttribute('aria-label',reduced?c.motionOff:c.motionOn);toggle.innerHTML=`<span class="motion-icon"></span>${reduced?c.static:c.motion}`;}
}
function measure(){const exp=document.querySelector<HTMLElement>('.experience')!;measurements={start:exp.getBoundingClientRect().top+window.scrollY,range:exp.offsetHeight-window.innerHeight};scene?.resize();schedule();}
function update(){
  pending=0;
  progress=scrollProgress(window.scrollY,measurements.start,measurements.range);
  const p=reduced||!webgl?0:progress;
  const inView=window.scrollY<=measurements.start+measurements.range+window.innerHeight;
  const diagnostics=scene&&webgl&&inView?scene.render(p,reduced):lastDiagnostics;lastDiagnostics=diagnostics;
  document.querySelectorAll<HTMLElement>('.chapter').forEach(el=>{const idx=Number(el.dataset.panel);const opacity=chapterOpacity(p,idx);el.style.opacity=String(opacity);el.style.transform=`translateY(${(1-opacity)*12}px)`;el.setAttribute('aria-hidden',String(opacity<.35));el.style.visibility=opacity<.001?'hidden':'visible';});
  const chapter=chapterAt(p);
  document.querySelectorAll<HTMLElement>('.chapter-nav button').forEach((button,i)=>{if(i===chapter)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
  const chapterName=document.querySelector('.chapter-name');if(chapterName)chapterName.textContent=COPY[locale].chapters[chapter];
  const bar=document.querySelector<HTMLElement>('.scroll-progress span');if(bar)bar.style.transform=`scaleX(${p})`;
  const prompt=document.querySelector<HTMLElement>('.scroll-prompt');if(prompt)prompt.style.opacity=String(1-smooth(.06,.16,p));
  const labelOpacity=smooth(.44,.49,p)*(1-smooth(.61,.66,p));
  document.querySelectorAll<HTMLElement>('.part-label').forEach((el,i)=>{el.style.opacity=String(labelOpacity);if(diagnostics){el.style.left=`${diagnostics.anchors[i].x}px`;el.style.top=`${diagnostics.anchors[i].y+18}px`;}});
  document.querySelector('.header')?.classList.toggle('scrolled',window.scrollY>32);
}
function schedule(){if(!pending)pending=requestAnimationFrame(update);}
function goChapter(index:number){
  if(reduced||!webgl){document.querySelector(index===0?'#lens':'#details')?.scrollIntoView({behavior:'instant'});return;}
  window.scrollTo({top:measurements.start+CHAPTERS[index]*measurements.range,behavior:reduced?'instant':'smooth'});
}
async function initScene(){
  scene?.dispose();scene=undefined;
  sceneStatus='loading';applyMode();
  const canvas=document.querySelector<HTMLCanvasElement>('#lens-canvas')!;
  try {const mod=await import('./scene');scene=mod.createScene(canvas);webgl=true;sceneStatus='ready';canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();webgl=false;sceneStatus='failed';applyMode();measure();});}catch{webgl=false;sceneStatus='failed';}
  applyMode();measure();update();
}
function bind(){
  document.querySelectorAll<HTMLElement>('[data-chapter]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();goChapter(Number(el.dataset.chapter));}));
  document.querySelectorAll<HTMLButtonElement>('[data-locale]').forEach(btn=>btn.addEventListener('click',()=>{const oldY=window.scrollY;locale=btn.dataset.locale as Locale;const url=new URL(location.href);url.searchParams.set('lang',locale);history.replaceState(null,'',url);markup();window.scrollTo({top:oldY,behavior:'instant'});schedule();}));
  document.querySelector('.motion-toggle')?.addEventListener('click',()=>{const inStage=window.scrollY<measurements.start+measurements.range;reduced=!reduced;try{localStorage.setItem('lumen-reduced',String(reduced));}catch{/* No storage is required. */}applyMode();measure();if(inStage)window.scrollTo({top:measurements.start,behavior:'instant'});update();});
  const gallery=document.querySelector<HTMLDivElement>('.gallery')!;
  gallery.addEventListener('scroll',schedule,{passive:true});
  document.querySelectorAll<HTMLElement>('[data-gallery]').forEach(button=>button.addEventListener('click',()=>gallery.scrollBy({left:Number(button.dataset.gallery)*(gallery.querySelector('.detail-card')!.getBoundingClientRect().width+24),behavior:reduced?'instant':'smooth'})));
  let drag:{x:number;left:number}|undefined;
  gallery.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse')return;drag={x:e.clientX,left:gallery.scrollLeft};gallery.setPointerCapture(e.pointerId);gallery.classList.add('dragging');});
  gallery.addEventListener('pointermove',e=>{if(drag)gallery.scrollLeft=drag.left+drag.x-e.clientX;});
  const end=()=>{drag=undefined;gallery.classList.remove('dragging');};gallery.addEventListener('pointerup',end);gallery.addEventListener('pointercancel',end);
  gallery.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();gallery.scrollBy({left:(e.key==='ArrowRight'?1:-1)*360,behavior:reduced?'instant':'smooth'});}});
}

markup();void initScene();
window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',measure,{passive:true});
motionMedia.addEventListener('change',e=>{reduced=e.matches;applyMode();measure();});
void document.fonts.ready.then(measure);

declare global {interface Window {__LUMEN:{getState:()=>unknown;capture:(kind:'assembled'|'glass'|'iris'|'mount')=>string|undefined;}}}
window.__LUMEN={getState:()=>({progress,webgl,reduced,locale,measurements,diagnostics:lastDiagnostics}),capture:(kind)=>scene?.capture(kind)};
