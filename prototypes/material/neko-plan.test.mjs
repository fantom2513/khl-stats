import test from 'node:test';
import assert from 'node:assert/strict';
import {nekoPlan, clampNeko} from './neko-plan.mjs';

test('every autonomous destination stays inside a phone viewport',()=>{
  const viewport={width:390,height:844};
  const plans=Array.from({length:12},(_,i)=>nekoPlan(i,viewport,null));
  assert.ok(plans.every(p=>p.x>=32&&p.x<=358&&p.y>=32&&p.y<=812));
});
test('the cat can play at a visible button without changing its state',()=>{
  const toy={left:900,right:1000,top:20,bottom:56};
  const plan=nekoPlan(1,{width:1200,height:900},toy);
  assert.deepEqual([plan.action,plan.nudge],['scratchWallN',true]);
});
test('a button above the viewport is not a destination',()=>{
  const toy={left:900,right:1000,top:-80,bottom:-40};
  const plan=nekoPlan(1,{width:1200,height:900},toy);
  assert.equal(plan.nudge,false);
});
test('resizing clamps an existing cat back into the visible area',()=>{
  const position=clampNeko({x:1800,y:1000},{width:390,height:844});
  assert.deepEqual(position,{x:358,y:812});
});
