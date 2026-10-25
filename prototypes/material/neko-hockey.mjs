import {clampNeko} from './neko-plan.mjs';

export function puckPlayPlan(index,viewport,from) {
  const stops=[[.82,.78],[.22,.3],[.76,.18],[.28,.76],[.85,.48],[.18,.5]];
  const point=([x,y])=>clampNeko({x:x*viewport.width,y:y*viewport.height},viewport);
  const puckStart=from?clampNeko(from,viewport):point(stops[index%stops.length]);
  const puckEnd=point(stops[(index+1)%stops.length]);
  const dx=puckEnd.x-puckStart.x,dy=puckEnd.y-puckStart.y;
  const distance=Math.hypot(dx,dy)||1;
  const behind=offset=>clampNeko({x:puckStart.x-dx/distance*offset,y:puckStart.y-dy/distance*offset},viewport);
  return {puckStart,puckEnd,catStart:behind(34),catEnd:clampNeko({x:puckEnd.x-dx/distance*26,y:puckEnd.y-dy/distance*26},viewport)};
}

export function cursorChaseTarget(cat,pointer,viewport,now) {
  if(!pointer||now-pointer.at>1800)return null;
  const dx=pointer.x-cat.x,dy=pointer.y-cat.y,distance=Math.hypot(dx,dy);
  if(distance<=54)return {...cat};
  return clampNeko({x:pointer.x-dx/distance*54,y:pointer.y-dy/distance*54},viewport);
}

export function pointerPuckKick(puck,pointer,viewport) {
  const dx=puck.x-pointer.x,dy=puck.y-pointer.y,distance=Math.hypot(dx,dy);
  if(distance>44)return null;
  const away=distance>0?{x:dx,y:dy}:{x:pointer.dx||0,y:pointer.dy||0};
  const length=Math.hypot(away.x,away.y);
  if(!length)return null;
  return clampNeko({x:puck.x+away.x/length*150,y:puck.y+away.y/length*150},viewport);
}

export function goalMoment(elapsed,reduced=false) {
  const phase=elapsed<650?'notice':elapsed<1000?'hop':elapsed<3100?'stare':elapsed<3900?'settle':'done';
  return {phase,action:reduced?'idle':phase==='notice'?'alert':phase==='settle'?'tired':'idle',hop:!reduced&&phase==='hop',done:phase==='done'};
}
