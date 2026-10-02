import { chromium } from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.LUMEN_URL||'http://127.0.0.1:5413/';
const out=process.env.LUMEN_MOTION||'../evidence/motion';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.platform==='win32'?{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})});
const records=[];
for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
  const context=await browser.newContext({viewport:{width,height},recordVideo:{dir:out,size:{width,height}},hasTouch:name==='mobile'});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.waitForFunction(()=>window.__LUMEN?.getState().webgl);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(700);
  const telemetry=await page.evaluate(async()=>{
    const frames=[];
    async function sweep(from,to,duration){
      const start=performance.now();
      return new Promise(resolve=>{
        function tick(now){const t=Math.min(1,(now-start)/duration);const s=window.__LUMEN.getState();const target=from+(to-from)*t;window.scrollTo({top:s.measurements.start+s.measurements.range*target,behavior:'instant'});
          frames.push({time:now-start,direction:to>from?'forward':'reverse',target,actual:s.progress,bounds:s.diagnostics.bounds});
          if(t<1)requestAnimationFrame(tick);else resolve();
        }requestAnimationFrame(tick);
      });
    }
    await sweep(0,1,16000);await new Promise(r=>setTimeout(r,500));await sweep(1,0,16000);return frames;
  });
  await page.locator('#study').evaluate(el=>el.scrollIntoView({behavior:'smooth'}));await page.waitForTimeout(1400);await page.locator('#details').evaluate(el=>el.scrollIntoView({behavior:'smooth'}));await page.waitForTimeout(1400);
  await page.locator('[data-gallery="1"]').click();await page.waitForTimeout(700);await page.locator('[data-gallery="1"]').click();await page.waitForTimeout(700);
  await page.locator('.closing').evaluate(el=>el.scrollIntoView({behavior:'smooth'}));await page.waitForTimeout(1300);
  assert.deepEqual(errors,[]);const video=page.video();await context.close();const path=`${out}/${name}-forward-reverse.webm`;await video.saveAs(path);await video.delete();
  const intervals=telemetry.slice(1).map((f,i)=>f.direction===telemetry[i].direction?f.time-telemetry[i].time:0).filter(t=>t>0);
  records.push({name,width,height,video:path,frames:telemetry.length,averageFrameMs:intervals.reduce((a,b)=>a+b,0)/intervals.length,maxFrameMs:Math.max(...intervals),errors:0});
  await writeFile(`${out}/${name}-telemetry.json`,JSON.stringify(telemetry));console.log(`${name}: continuous forward/reverse video captured (${telemetry.length} sampled frames)`);
}
await writeFile(`${out}/manifest.json`,JSON.stringify({base,capturedAt:new Date().toISOString(),records},null,2));await browser.close();
