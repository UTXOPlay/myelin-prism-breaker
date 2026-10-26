import {paddleHalf} from './prism-engine.mjs';

// Translate pointing into the existing signed left/right input bits. Never move
// the predicted paddle independently of the native simulation.
export class PrismPointer {
  constructor(){this.clear();}
  clear(){this.owner=null;this.target=null;this.lastX=null;this.type=null;}
  clamp(x,game){const half=paddleHalf(game);return Math.max(half+15,Math.min(985-half,x));}
  begin(id,x,type,game){
    if(this.owner!==null)return false;
    this.owner=id;this.type=type;this.lastX=x;
    this.target=this.clamp(type==='mouse'?x:game.x,game);
    return true;
  }
  move(id,x,type,game){
    if(this.owner===null){if(type==='mouse')this.target=this.clamp(x,game);return;}
    if(id!==this.owner)return;
    // Rebase each event, including at the boundary: reversing a finger must
    // respond immediately, without dragging back through an overshoot region.
    this.target=this.clamp(this.type==='mouse'?x:this.target+x-this.lastX,game);
    this.lastX=x;
  }
  end(id){if(id===this.owner){this.owner=null;this.lastX=null;this.type=null;}}
  cancel(id){if(id===this.owner)this.clear();}
  bits(game){
    if(this.target===null)return null;
    this.target=this.clamp(this.target,game);
    const distance=this.target-game.x,direction=distance<0?1:2;
    const next=this.clamp(game.x+(direction===1?-19:19),game);
    // Stop at the nearest reachable position, instead of a large dead zone or
    // oscillating around a target. Release keeps the final target until arrival.
    return Math.abs(this.target-next)<Math.abs(distance)?direction:0;
  }
}

// Screen-space gestures work at the same finger distance on every arena scale.
// Horizontal drags only steer. Short taps pulse; deliberate upward diagonals bend.
export class PrismGestures {
  constructor(){this.clear();}
  clear(){this.owner=null;this.start=null;this.travel=0;this.used=false;}
  begin(id,x,y,type,time){
    if(this.owner!==null){this.used=true;return false;}
    this.owner=id;this.start={x,y,type,time};this.travel=0;this.used=false;return true;
  }
  move(id,x,y){
    if(id!==this.owner||!this.start)return 0;
    const dx=x-this.start.x,dy=y-this.start.y;
    this.travel=Math.max(this.travel,Math.hypot(dx,dy));
    if(!this.used&&this.start.type!=='mouse'&&dy<=-42&&Math.abs(dx)>=18&&-dy>Math.abs(dx)*1.2){this.used=true;return dx<0?4:8;}
    return 0;
  }
  end(id,x,y,time){
    if(id!==this.owner)return 0;
    const bend=this.move(id,x,y),tap=!this.used&&this.travel<=8&&time-this.start.time<=280;
    this.clear();return bend||(tap?16:0);
  }
  cancel(id){if(id===this.owner)this.clear();}
}
