import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { CASE, makePresentationCase } from '../src/presentation-case.ts';
import { sampleTimeline } from '../src/timeline.ts';

test('the rear-hinged lid stays above every case wall for the full opening and reverse sweep', () => {
  const { box, lid } = makePresentationCase(new THREE.MeshBasicMaterial(), new THREE.MeshBasicMaterial());
  for (const steps of [Array.from({length:401},(_,i)=>i/400),Array.from({length:401},(_,i)=>1-i/400)]) {
    for (const p of steps) {
      lid.rotation.x=sampleTimeline(p).lidAngle;box.updateMatrixWorld(true);
      const lower=new THREE.Box3().setFromObject(lid).min.y;
      assert.ok(lower>CASE.rim+.004,`lid intersects rim at ${p}: ${lower}`);
      assert.ok(lid.rotation.x<=0,'lid must open upward from the rear hinge');
    }
  }
});

test('opening keeps the case stationary and scales its seating height for mobile', () => {
  for (const mobile of [false,true]) {
    const start=sampleTimeline(0,mobile);
    for (let i=0;i<=210;i++) assert.equal(sampleTimeline(i/1000,mobile).boxY,start.boxY);
    assert.ok(start.lidAngle===0);
    assert.equal(sampleTimeline(.12,mobile).lidAngle,-2.04);
    assert.equal(sampleTimeline(.21,mobile).boxOpacity,0);
  }
});
