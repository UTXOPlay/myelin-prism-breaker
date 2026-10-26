import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sameGameState} from '../games/arcade/web/state-equal.mjs';

test('native key sorting of a new pickup does not reset an active drag',()=>{
 const browser={x:500,pickups:[{x:100,y:300,vx:0,vy:4,tag:1}]};
 const native={pickups:[{tag:1,vx:0,vy:4,x:100,y:300}],x:500};
 assert.equal(sameGameState(native,browser),true);
 native.pickups[0].y++;assert.equal(sameGameState(native,browser),false);
});
test('state equality retains array order, field presence and JSON types',()=>{
 for(const [a,b]of [[[1,2],[2,1]],[{}, {x:null}],[{x:0},{x:false}],[[],{}],[null,{}]])assert.equal(sameGameState(a,b),false);
 assert.equal(sameGameState({a:[null,1,true]},{a:[null,1,true]}),true);
});
