// items.js — item creation and rendering helpers (ES module)
export const ITEM_SIZE = 22;
export const ITEM_TYPES = ['INVINCIBLE','RECOVER','SPEED_UP','SLOW_DOWN','AUTO_HEAL'];

export function createRandomItem(rand, W){
  const type = ITEM_TYPES[Math.floor(rand(0, ITEM_TYPES.length))];
  const x = rand(20, W - 20 - ITEM_SIZE);
  const y = -ITEM_SIZE - Math.floor(rand(0,200));
  return { x, y, w: ITEM_SIZE, h: ITEM_SIZE, type };
}

export function drawItem(ctx, it){
  const color = {
    INVINCIBLE: '#FBBF24',
    RECOVER: '#34D399',
    SPEED_UP: '#60A5FA',
    SLOW_DOWN: '#F87171',
    AUTO_HEAL: '#C084FC'
  }[it.type] || '#9CA3AF';
  ctx.save();
  ctx.translate(it.x, it.y);
  // Draw star for INVINCIBLE, circle for others
  if(it.type === 'INVINCIBLE'){
    const cx = it.w/2, cy = it.h/2;
    const spikes = 5;
    const outer = it.w/2;
    const inner = outer * 0.5;
    ctx.fillStyle = color;
    ctx.beginPath();
    let rot = Math.PI / 2 * 3;
    let x = cx, y = cy;
    for(let i = 0; i < spikes; i++){
      x = cx + Math.cos(rot) * outer;
      y = cy + Math.sin(rot) * outer;
      ctx.lineTo(x, y);
      rot += Math.PI / spikes;
      x = cx + Math.cos(rot) * inner;
      y = cy + Math.sin(rot) * inner;
      ctx.lineTo(x, y);
      rot += Math.PI / spikes;
    }
    ctx.closePath();
    ctx.fill();
    // glow outline
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // small center highlight
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath(); ctx.arc(cx, cy, it.w/8, 0, Math.PI*2); ctx.fill();
  } else {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(it.w/2, it.h/2, it.w/2, 0, Math.PI*2);
    ctx.fill();
    // small inner highlight
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath(); ctx.arc(it.w/2 - 3, it.h/2 - 3, it.w/6, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();
}
