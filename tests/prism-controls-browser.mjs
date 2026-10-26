// Run against an isolated standalone host: STORE_URL=... PLAYWRIGHT_ENTRY=... node tests/prism-controls-browser.mjs
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const {chromium}=await import(process.env.PLAYWRIGHT_ENTRY||'playwright');
const base=process.env.STORE_URL||'http://127.0.0.1:19887';
const out=process.env.CONTROL_ARTIFACTS||'/tmp/prism-controls/browser';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const results=[];
const sizes=process.env.CONTROL_VIEWPORTS?JSON.parse(process.env.CONTROL_VIEWPORTS):[[1920,1080],[2560,1080],[2560,1440],[3840,2160],[390,844],[844,390]];
try{for(const [width,height]of sizes){
 const context=await browser.newContext({viewport:{width,height},hasTouch:width<900,isMobile:width<900});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/_arcade/app.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+`\nglobalThis.controlTest={get game(){return structuredClone(predicted)},get pointer(){return {owner:prismPointer.owner,target:prismPointer.target}},get saves(){return confirmed.session.actions},notice:toast};`});});
 await page.goto(base+'/games/prism-breaker/');await page.locator('#launch:not([disabled])').waitFor();await page.locator('#launch').click();await page.waitForFunction(()=>document.querySelector('#countdown').hidden);
 const v=await page.evaluate(async()=>{const {viewport}=await import('./_arcade/viewport.mjs');return viewport(innerWidth,innerHeight,'prism-breaker',matchMedia('(pointer:coarse)').matches);});
 const point=(x,y)=>({x:v.x+x*v.scale,y:v.y+y*v.scale});
 const x=()=>page.evaluate(()=>controlTest.game.x);
 await page.mouse.move(point(650,560).x,point(650,560).y);await page.waitForFunction(()=>Math.abs(controlTest.game.x-650)<=9.5,null,{timeout:5000});
 await page.mouse.down();await page.mouse.move(point(450,560).x,point(450,560).y);await page.mouse.up();await page.waitForFunction(()=>Math.abs(controlTest.game.x-450)<=9.5,null,{timeout:5000});

 const cdp=await context.newCDPSession(page),start=await x(),touch={x:width/2,y:point(500,600).y,id:1};
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...touch,x:touch.x+95*v.scale}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await page.waitForFunction(target=>Math.abs(controlTest.game.x-target)<=9.5,start+95,{timeout:5000});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...touch,x:width-2}]});await page.evaluate(()=>new Promise(requestAnimationFrame));
 const edge=await page.evaluate(()=>controlTest.pointer.target),saves=await page.evaluate(()=>controlTest.saves);
 await page.waitForFunction(n=>controlTest.saves>n,saves,{timeout:5000});assert.notEqual((await page.evaluate(()=>controlTest.pointer)).owner,null,'saving must not interrupt a held drag');
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...touch,x:width-2-19*v.scale}]});
 await page.evaluate(()=>new Promise(requestAnimationFrame));assert.ok(Math.abs((await page.evaluate(()=>controlTest.pointer.target))-(edge-19))<.1,'edge reversal');
 await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.equal((await page.evaluate(()=>controlTest.pointer)).target,null);
 await page.mouse.move(point(600,550).x,point(600,550).y);await page.keyboard.down('ArrowLeft');assert.equal((await page.evaluate(()=>controlTest.pointer)).target,null,'keyboard takes control');await page.keyboard.up('ArrowLeft');
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await page.waitForFunction(()=>controlTest.game.cooldown>0,null,{timeout:5000});
 const beforeBend=await page.evaluate(()=>controlTest.game.refractions),direction=width%3===0?-1:1;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...touch,x:touch.x+30*direction,y:touch.y-70}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await page.waitForFunction(n=>controlTest.game.refractions===n+1,beforeBend,{timeout:5000});
 assert.equal(await page.evaluate(()=>controlTest.game.refract_dir),direction,'one-finger diagonal bends the correct way');
 await page.evaluate(()=>controlTest.notice('LONGBOARD · paddle widened'));
 const geometry=await page.evaluate(v=>{
  const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom};};
  const controls=[...document.querySelectorAll('.signature-actions button,#prism-pulse')].filter(e=>e.getBoundingClientRect().width).map(rect);
  const notice=rect(document.querySelector('#notice'));
  const unobstructed=[100,500,900].every(x=>document.elementFromPoint(v.x+x*v.scale,v.y+563*v.scale)?.tagName==='CANVAS');
  return {controls,notice,unobstructed,overflow:document.documentElement.scrollWidth>innerWidth,lensInMenu:!!document.querySelector('#prism-lens')?.closest('#game-menu')};
 },v);
 assert.ok(geometry.unobstructed,'paddle line must not have a DOM overlay');assert.ok(geometry.lensInMenu);assert.ok(!geometry.overflow);
 assert.ok(geometry.notice.bottom<=v.y+1,'notice is above the field');if(width<900)assert.equal(geometry.controls.length,0,'touch has no skill buttons covering the field');
 for(const r of geometry.controls){assert.ok(r.y>=v.y+625*v.scale,'abilities are below the field');assert.ok(r.height>=44&&r.width>=44,'touch target size');assert.ok(r.x>=0&&r.x+r.width<=width&&r.bottom<=height);}
 await page.screenshot({path:out+`/${width}x${height}.png`});
 await page.keyboard.press('KeyP');await page.waitForTimeout(250);
 const replay=await context.request.post(base+'/games/prism-breaker/api/replay',{headers:{Origin:base},data:{}});assert.equal(replay.status(),200);assert.equal((await replay.json()).verified,true);
 await page.setViewportSize({width:height,height:width});
 await page.waitForFunction(()=>controlTest.pointer.target===null);
 const mapping=await page.evaluate(async()=>{const {viewport,pointerInViewport}=await import('./_arcade/viewport.mjs'),c=document.querySelector('canvas').getBoundingClientRect(),coarse=matchMedia('(pointer:coarse)').matches,v=viewport(c.width,c.height,'prism-breaker',coarse);return pointerInViewport(c.left+v.x+500*v.scale,c.top+v.y+563*v.scale,c,'prism-breaker',coarse);});assert.ok(Math.abs(mapping.x-500)<.001&&Math.abs(mapping.y-563)<.001,'rotated pointer inverse');
 assert.deepEqual(errors,[]);results.push({width,height,mouse:true,touch:true,layout:true,nativeReplay:true});console.log(width,height,'mouse/touch/overlay/native replay passed');await context.close();
}}finally{await browser.close();writeFileSync(out+'/results.json',JSON.stringify(results,null,2));}
