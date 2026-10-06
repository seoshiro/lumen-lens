import test from 'node:test';
import assert from 'node:assert/strict';
import { BASE_Z, CHAPTERS, chapterAt, chapterOpacity, clamp, sampleTimeline, scrollProgress } from '../src/timeline.ts';

test('scroll bounds and a collapsed experience remain finite',()=>{
  assert.equal(scrollProgress(-100,0,1000),0);assert.equal(scrollProgress(10000,0,1000),1);
  assert.equal(scrollProgress(20,0,0),0);assert.equal(clamp(Number.NaN),0);assert.equal(clamp(Infinity),0);
});
test('all layers assemble at both endpoints and remain ordered throughout',()=>{
  for(const mobile of [false,true]){
    for(const p of [0,1])assert.deepEqual(sampleTimeline(p,mobile).parts.map(v=>v.z),[...BASE_Z]);
    for(let step=0;step<=1000;step++){
      const state=sampleTimeline(step/1000,mobile);assert.ok(Number.isFinite(state.rotY));
      for(let i=1;i<state.parts.length;i++)assert.ok(state.parts[i-1].z>state.parts[i].z);
      assert.ok(state.aperture>=.38&&state.aperture<=.82);assert.ok(state.explode>=0&&state.explode<=1);
    }
  }
});
test('the same scroll position yields the same scene in both directions',()=>{
  const forward=Array.from({length:201},(_,i)=>sampleTimeline(i/200));
  const backward=Array.from({length:201},(_,i)=>sampleTimeline(1-i/200)).reverse();
  forward.forEach((state,i)=>{
    assert.ok(Math.abs(state.rotY-backward[i].rotY)<1e-12);
    state.parts.forEach((part,j)=>assert.ok(Math.abs(part.z-backward[i].parts[j].z)<1e-12));
  });
});
test('chapter anchors reveal their caption and allow semantic navigation',()=>{
  CHAPTERS.forEach((p,i)=>{assert.equal(chapterAt(p),i);assert.ok(chapterOpacity(p,i)>.85);});
  assert.equal(sampleTimeline(.55).explode,1);assert.equal(sampleTimeline(.75).iris,1);
});
test('continuous choreography has no abrupt per-frame displacement',()=>{
  let previous=sampleTimeline(0);
  for(let i=1;i<=2000;i++){
    const next=sampleTimeline(i/2000);
    next.parts.forEach((v,j)=>assert.ok(Math.abs(v.z-previous.parts[j].z)<.023));
    assert.ok(Math.abs(next.rotY-previous.rotY)<.006);previous=next;
  }
});
test('captions fade sequentially without overlapping text',()=>{
  for(let i=0;i<=4000;i++){
    const visible=CHAPTERS.map((_,chapter)=>chapterOpacity(i/4000,chapter)).filter(opacity=>opacity>1e-6);
    assert.ok(visible.length<=1,`overlapping captions at ${i/4000}`);
  }
});

test('the assembled lens responds to the first scroll input without a waiting phase',()=>{
  for(const mobile of [false,true]){
    const start=sampleTimeline(0,mobile),first=sampleTimeline(.01,mobile);
    assert.deepEqual(start.parts.map(part=>part.z),[...BASE_Z]);
    assert.equal(start.explode,0);assert.ok(start.scale>0);
    assert.notEqual(first.rotY,start.rotY);assert.notEqual(first.modelY,start.modelY);
    assert.deepEqual(first.parts.map(part=>part.z),[...BASE_Z]);
  }
});
