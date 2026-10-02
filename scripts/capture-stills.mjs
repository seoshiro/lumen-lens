import { chromium } from '@playwright/test';
import { mkdir,writeFile } from 'node:fs/promises';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
await page.goto('http://127.0.0.1:5413/');
await page.waitForFunction(()=>window.__LUMEN?.getState().webgl);
await page.evaluate(()=>document.fonts.ready);
await mkdir('public/stills',{recursive:true});
for(const kind of ['assembled','glass','iris','mount']){
  const data=await page.evaluate(kind=>window.__LUMEN.capture(kind),kind);
  await writeFile(`public/stills/${kind}.webp`,Buffer.from(data.split(',')[1],'base64'));
}
await page.reload();await page.waitForFunction(()=>window.__LUMEN?.getState().webgl);
await mkdir('../evidence/first-pass',{recursive:true});
await page.screenshot({path:'../evidence/first-pass/desktop-hero.png'});
for(const [name,p] of [['reveal',.255],['exploded',.52],['iris',.755],['assembled',1]]){
  await page.evaluate(p=>{const s=window.__LUMEN.getState();window.scrollTo({top:s.measurements.start+s.measurements.range*p,behavior:'instant'});},p);
  await page.waitForTimeout(120);await page.screenshot({path:`../evidence/first-pass/desktop-${name}.png`});
}
await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(200);
await page.screenshot({path:'../evidence/first-pass/mobile-hero.png'});
await page.evaluate(()=>{const s=window.__LUMEN.getState();window.scrollTo({top:s.measurements.range*.52,behavior:'instant'});});await page.waitForTimeout(150);
await page.screenshot({path:'../evidence/first-pass/mobile-exploded.png'});
console.log('Captured four original model stills and seven first-pass frames.');await browser.close();
