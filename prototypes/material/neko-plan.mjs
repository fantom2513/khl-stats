export function clampNeko(point, viewport) {
  const bound=(n,size)=>Math.min(Math.max(32,n),Math.max(32,size-32));
  return {x:bound(point.x,viewport.width),y:bound(point.y,viewport.height)};
}

export function nekoPlan(index, viewport, toy) {
  const visible=toy&&toy.top>=0&&toy.bottom<=viewport.height&&toy.left>=0&&toy.right<=viewport.width;
  const scene=index%4;
  const plan=scene===1&&visible
    ? {x:(toy.left+toy.right)/2,y:toy.bottom+34,action:'scratchWallN',duration:4500,nudge:true}
    : scene===2
      ? {x:viewport.width*.24,y:viewport.height-40,action:'sleeping',duration:6500,nudge:false}
      : scene===3
        ? {x:viewport.width-40,y:viewport.height*.65,action:'scratchSelf',duration:3200,nudge:false}
        : {x:viewport.width*.6,y:viewport.height-40,action:'idle',duration:1800,nudge:false};
  return {...plan,...clampNeko(plan,viewport)};
}
