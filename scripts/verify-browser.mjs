import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const base=process.env.LUMEN_URL||'http://127.0.0.1:5413/';
const out=process.env.LUMEN_EVIDENCE||'../evidence/browser';
const browser=await chromium.launch({headless:true,...(process.platform==='win32'?{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})});
await mkdir(out,{recursive:true});
const records=[];
for(const [name,width,height,lang] of [['desktop',1440,1000,'en'],['laptop',1280,800,'en'],['tablet',768,1024,'ru'],['mobile',390,844,'en'],['small-mobile',320,568,'en'],['mobile-ru',390,844,'ru'],['mobile-kk',390,844,'kk'],['small-mobile-kk',320,568,'kk'],['landscape',844,390,'en']]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:name.includes('mobile'),isMobile:name.includes('mobile')});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(`${base}?lang=${lang}`);assert.equal(response.status(),200);
  await page.waitForFunction(()=>window.__LUMEN?.getState().webgl);await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(200);
  const checks=[];
  for(const p of [0,.08,.17,.255,.30,.38,.52,.65,.755,.87,1,.755,.52,.255,0]){
    await page.evaluate(p=>{const s=window.__LUMEN.getState();window.scrollTo({top:s.measurements.start+s.measurements.range*p,behavior:'instant'});},p);
    await page.waitForTimeout(50);
    const state=await page.evaluate(()=>{
      const s=window.__LUMEN.getState();const canvas=document.querySelector('canvas').getBoundingClientRect();
      const panels=[...document.querySelectorAll('.chapter')].filter(el=>Number(getComputedStyle(el).opacity)>.4).map(el=>{
        const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);const rects=[];let node;
        while((node=walker.nextNode())){if(!node.textContent.trim())continue;const range=document.createRange();range.selectNodeContents(node);rects.push(...range.getClientRects());}
        return {id:el.dataset.panel,rects:rects.map(r=>({left:r.left,right:r.right,top:r.top,bottom:r.bottom})),left:Math.min(...rects.map(r=>r.left)),right:Math.max(...rects.map(r=>r.right)),top:Math.min(...rects.map(r=>r.top)),bottom:Math.max(...rects.map(r=>r.bottom))};
      });
      return {...s,canvas:{width:canvas.width,height:canvas.height},panels,scrollWidth:document.documentElement.scrollWidth};
    });
    assert.equal(state.locale,lang);assert.ok(state.scrollWidth<=width+1,`${name}: horizontal overflow`);
    assert.ok(Math.abs(state.progress-p)<.002,`${name}: scroll mapping ${p}`);
    const b=state.diagnostics.bounds;
    assert.ok(b.left>=8&&b.right<=width-8,`${name} ${p}: object clipped horizontally ${JSON.stringify(b)}`);
    assert.ok(b.top>=80&&b.bottom<=height-62,`${name} ${p}: object clipped vertically ${JSON.stringify(b)}`);
    for(const panel of state.panels){
      assert.ok(panel.left>=16&&panel.right<=width-16,`${name} ${p}: caption clipped ${JSON.stringify(panel)}`);
      const overlap=panel.rects.some(rect=>Math.min(rect.right,b.right)-Math.max(rect.left,b.left)>8&&Math.min(rect.bottom,b.bottom)-Math.max(rect.top,b.top)>8);
      assert.ok(!overlap,`${name} ${p}: caption ${panel.id} overlaps object ${JSON.stringify({panel,b})}`);
    }
    checks.push({p,bounds:b,calls:state.diagnostics.calls,triangles:state.diagnostics.triangles});
    if([0,.255,.52,.755,1].includes(p))await page.screenshot({path:`${out}/${name}-${String(p).replace('.','_')}.png`});
  }
  await page.locator('.chapter-nav button').nth(2).click();
  await page.waitForFunction(()=>Math.abs(window.__LUMEN.getState().progress-.52)<.002,null,{timeout:15000});
  assert.ok(Math.abs((await page.evaluate(()=>window.__LUMEN.getState().progress))-.52)<.002);
  if(name==='mobile'){
    for(const language of ['ru','kk','en']){await page.locator(`[data-locale="${language}"]`).click();await page.waitForTimeout(200);const s=await page.evaluate(()=>window.__LUMEN.getState());assert.equal(s.locale,language);assert.ok(Math.abs(s.progress-.52)<.002);}
  }
  await page.keyboard.press('Home');
  await page.waitForFunction(()=>window.__LUMEN.getState().progress<.002,null,{timeout:15000});
  assert.ok((await page.evaluate(()=>window.__LUMEN.getState().progress))<.002);
  await page.mouse.wheel(0,500);await page.waitForTimeout(150);assert.ok((await page.evaluate(()=>window.__LUMEN.getState().progress))>0);
  if(name==='mobile'){
    const before=await page.evaluate(()=>window.scrollY);const cdp=await context.newCDPSession(page);const y=height*.72;
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:width/2,y}]});
    for(let i=1;i<=12;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:width/2,y:y-i*25}]});await page.waitForTimeout(20);}
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(300);assert.ok(await page.evaluate(()=>window.scrollY)>before);await cdp.detach();
  }
  await page.keyboard.press('PageDown');await page.waitForTimeout(350);
  await page.locator('#study').evaluate(el=>el.scrollIntoView({behavior:'instant'}));await page.waitForTimeout(100);
  await page.screenshot({path:`${out}/${name}-story.png`});
  await page.locator('#details').evaluate(el=>el.scrollIntoView({behavior:'instant'}));await page.waitForTimeout(100);
  const gallery=page.locator('.gallery');const before=await gallery.evaluate(el=>el.scrollLeft);
  await page.locator('[data-gallery="1"]').click();
  await page.waitForFunction(before=>document.querySelector('.gallery').scrollLeft>before,before,{timeout:15000});
  assert.ok(await gallery.evaluate(el=>el.scrollLeft)>before);
  await gallery.focus();await page.keyboard.press('ArrowLeft');await page.waitForTimeout(500);
  await page.screenshot({path:`${out}/${name}-gallery.png`});
  await page.locator('.closing').evaluate(el=>el.scrollIntoView({behavior:'instant'}));await page.waitForTimeout(100);await page.screenshot({path:`${out}/${name}-closing.png`});
  assert.deepEqual(errors,[]);
  const axe=await new AxeBuilder({page}).analyze();assert.deepEqual(axe.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,html:n.html,reason:n.failureSummary}))})),[],`${name}: accessibility violations`);
  records.push({name,width,height,lang,checks,errors:0,axeViolations:0});console.log(`${name}: scroll, bounds, input, gallery and accessibility passed`);
  await context.close();
}
// System reduced motion uses one still stage and ordinary document scrolling.
{
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});await page.goto(base);await page.waitForFunction(()=>window.__LUMEN?.getState().webgl);
  assert.equal(await page.evaluate(()=>window.__LUMEN.getState().reduced),true);
  assert.equal(await page.locator('.chapter-nav').isVisible(),false);
  assert.ok(await page.locator('.experience').evaluate(el=>el.offsetHeight)<900);
  await page.screenshot({path:`${out}/reduced-motion.png`});
  await page.locator('.motion-toggle').click();assert.equal(await page.evaluate(()=>window.__LUMEN.getState().reduced),false);await page.close();records.push({name:'reduced-motion',passed:true});
}
// A failed WebGL context still leaves readable images, notes and navigation.
{
  const page=await browser.newPage({viewport:{width:390,height:844}});await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...rest){if(String(type).startsWith('webgl'))return null;return original.call(this,type,...rest);};});
  await page.goto(base);await page.waitForFunction(()=>window.__LUMEN);await page.waitForTimeout(250);
  assert.equal(await page.evaluate(()=>window.__LUMEN.getState().webgl),false);assert.equal(await page.locator('.fallback').isVisible(),true);
  assert.ok(await page.locator('.fallback img').evaluate(img=>img.complete&&img.naturalWidth>0));
  await page.screenshot({path:`${out}/webgl-fallback.png`});await page.close();records.push({name:'webgl-fallback',passed:true});
}
await writeFile(`${out}/manifest.json`,JSON.stringify({base,capturedAt:new Date().toISOString(),records},null,2));await browser.close();
