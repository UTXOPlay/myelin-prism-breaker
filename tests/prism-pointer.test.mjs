import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PrismPointer} from '../games/arcade/web/prism-pointer.mjs';
import {createPrism,prismStep,paddleHalf} from '../games/arcade/web/prism-engine.mjs';

test('a quick touch drag reaches its destination after release and capture loss',()=>{
 const p=new PrismPointer(),g=createPrism();p.begin(1,200,'touch',g);p.move(1,295,'touch',g);p.end(1);p.cancel(1);
 for(let i=0;i<8;i++)prismStep(g,p.bits(g)||0);
 assert.equal(g.x,595);assert.equal(p.bits(g),0);
});
test('clamped touch reverses immediately instead of consuming overshoot',()=>{
 const p=new PrismPointer(),g=createPrism();p.begin(1,200,'touch',g);p.move(1,2000,'touch',g);
 const edge=985-paddleHalf(g);assert.equal(p.target,edge);p.move(1,1981,'touch',g);assert.equal(p.target,edge-19);
 p.move(1,-2000,'touch',g);const left=paddleHalf(g)+15;assert.equal(p.target,left);p.move(1,-1981,'touch',g);assert.equal(p.target,left+19);
});
test('second fingers cannot steer or release the owning touch',()=>{
 const p=new PrismPointer(),g=createPrism();assert.equal(p.begin(1,200,'touch',g),true);assert.equal(p.begin(2,900,'touch',g),false);
 p.move(2,20,'touch',g);p.end(2);p.cancel(2);assert.equal(p.owner,1);assert.equal(p.target,500);
 p.cancel(1);assert.equal(p.bits(g),null);
});
test('absolute mouse follows the nearest signed tick without jitter or a wide dead zone',()=>{
 const p=new PrismPointer(),g=createPrism();p.move(1,510,'mouse',g);assert.equal(p.bits(g),2);prismStep(g,p.bits(g));assert.equal(g.x,519);
 for(let i=0;i<10;i++){assert.equal(p.bits(g),0);prismStep(g,p.bits(g));}assert.equal(g.x,519);
 p.move(1,200,'mouse',g);assert.equal(p.bits(g),1);p.clear();assert.equal(p.bits(g),null);
});
test('touch pickup is relative; new paddle widths clamp retained targets safely',()=>{
 const p=new PrismPointer(),g=createPrism();p.begin(1,100,'touch',g);assert.equal(p.target,g.x);p.move(1,1000,'touch',g);p.end(1);
 g.wide=100;g.perks[0]=4;p.bits(g);assert.equal(p.target,985-paddleHalf(g));
});

test('one-finger gestures separate a short tap, horizontal steering and upward bends',async()=>{
 const {PrismGestures}=await import('../games/arcade/web/prism-pointer.mjs');const g=new PrismGestures();
 g.begin(1,100,300,'touch',0);assert.equal(g.end(1,103,302,120),16,'tap pulses');
 g.begin(1,100,300,'touch',0);assert.equal(g.move(1,240,295),0);assert.equal(g.end(1,240,295,150),0,'drag never pulses');
 g.begin(1,100,300,'touch',0);assert.equal(g.move(1,70,240),4);assert.equal(g.move(1,40,190),0);assert.equal(g.end(1,40,190,180),0,'bend commits once');
 g.begin(1,100,300,'touch',0);assert.equal(g.move(1,130,240),8);g.cancel(1);assert.equal(g.end(1,130,240,180),0);
 g.begin(1,100,300,'touch',0);assert.equal(g.end(1,100,300,600),0,'long hold is not a tap');
});
test('small jitter, multi-touch and mostly horizontal diagonals do not bend or accidentally pulse',async()=>{
 const {PrismGestures}=await import('../games/arcade/web/prism-pointer.mjs');const g=new PrismGestures();
 g.begin(1,100,300,'touch',0);assert.equal(g.move(1,150,280),0);assert.equal(g.end(1,100,300,200),0,'returning to the starting point remains a drag');
 g.begin(1,100,300,'touch',0);g.begin(2,120,300,'touch',0);assert.equal(g.end(2,120,300,50),0);assert.equal(g.end(1,100,300,100),0);
 g.begin(1,100,300,'mouse',0);assert.equal(g.move(1,130,240),0,'mouse aiming does not cast a touch gesture');
});
