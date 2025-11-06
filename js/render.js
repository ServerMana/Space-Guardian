import { state, now, t } from './state.js';
import { drawItem as drawItemModule } from './items.js';

// drawing functions operate on shared state
export function drawBackground(){
  const ctx = state.ctx; const W = state.W, H = state.H;
  if(!ctx) return;
  if(state.bgImg && state.bgImg.complete && state.bgImg.naturalWidth){
    ctx.drawImage(state.bgImg, 0, 0, W, H);
  } else {
    ctx.fillStyle = '#071022'; ctx.fillRect(0,0,W,H);
    for(let i=0;i<90;i++){
      const x = (i*47)%W, y = (i*83)%H;
      ctx.fillStyle = 'rgba(255,255,255,'+(0.05+((i%7)/20))+')';
      ctx.fillRect((x+((now()/100)%20))-10, y, (i%3)+1, (i%3)+1);
    }
  }
}

export function drawPlayer(){
  const ctx = state.ctx; const player = state.player;
  if(!ctx || !player) return;
  // draw image if loaded, else simple triangle
  if(state.playerImg && state.playerImg.complete && state.playerImg.naturalWidth){
    try{
      ctx.drawImage(state.playerImg, player.x, player.y, player.w, player.h);
      return;
    }catch(e){ /* fallback to vector */ }
  }
  ctx.save();
  ctx.translate(player.x + player.w/2, player.y + player.h/2);
  ctx.fillStyle = state.isInvincible ? 'rgba(255,255,255,0.7)' : 'white';
  ctx.beginPath();
  ctx.moveTo(0, -player.h/2);
  ctx.lineTo(player.w/2, player.h/2);
  ctx.lineTo(-player.w/2, player.h/2);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

export function drawAsteroid(a){
  const ctx = state.ctx; if(!ctx) return;
  if(state.asteroidImg && state.asteroidImg.complete && state.asteroidImg.naturalWidth){
    ctx.drawImage(state.asteroidImg, a.x, a.y, a.w, a.h);
  } else {
    ctx.save(); ctx.translate(a.x, a.y);
    ctx.fillStyle = '#718096'; ctx.beginPath();
    ctx.ellipse(a.w/2, a.h/2, a.w/2, a.h/2, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
  if(a.maxHp && a.maxHp > 1){
    const barW = a.w; const barH = 6;
    const pct = Math.max(0, a.hp) / a.maxHp;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(a.x, a.y - barH - 6, barW, barH);
    ctx.fillStyle = '#f87171';
    ctx.fillRect(a.x, a.y - barH - 6, Math.max(2, barW * pct), barH);
    ctx.fillStyle = '#fff';
    ctx.font = '10px sans-serif';
    ctx.fillText(a.hp + '/' + a.maxHp, a.x + 4, a.y - 10);
  }
}

export function drawBomb(b){
  const ctx = state.ctx; if(!ctx) return;
  ctx.save(); ctx.translate(b.x, b.y);
  ctx.fillStyle = '#FFD166';
  ctx.beginPath(); ctx.ellipse(b.w/2, b.h/2, b.w/2, b.h/2, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(255,210,100,0.6)'; ctx.fillRect(b.w/2 - 2, b.h, 4, 6);
  ctx.restore();
}

export function drawAutoBullet(b){ const ctx = state.ctx; if(!ctx) return; ctx.save(); ctx.translate(b.x, b.y); ctx.fillStyle = '#9AE6B4'; ctx.fillRect(0,0,b.w,b.h); ctx.restore(); }

export function drawBossBullet(bb){ const ctx = state.ctx; if(!ctx) return; ctx.save(); ctx.translate(bb.x, bb.y); ctx.fillStyle = '#FF6B6B'; ctx.beginPath(); ctx.arc(bb.w/2, bb.h/2, bb.w/2, 0, Math.PI*2); ctx.fill(); ctx.restore(); }

export function drawBoss(b){
  const ctx = state.ctx; if(!ctx || !b) return;
  // prefer image sprite if available
  if(state.bossImg && state.bossImg.complete && state.bossImg.naturalWidth){
    try{
      ctx.drawImage(state.bossImg, b.x, b.y, b.w, b.h);
    }catch(e){
      // fallback to vector drawing below
      ctx.save(); ctx.translate(b.x, b.y);
      const grad = ctx.createLinearGradient(0,0,b.w,b.h);
      grad.addColorStop(0, '#6EE7B7'); grad.addColorStop(1, '#3B82F6');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.ellipse(b.w/2, b.h/2, b.w/2, b.h/2, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#0f172a'; ctx.fillRect(b.w/2 - 8, b.h/2 - 6, 6, 6); ctx.fillRect(b.w/2 + 4, b.h/2 - 6, 6, 6);
      ctx.restore();
    }
  } else {
    ctx.save(); ctx.translate(b.x, b.y);
    const grad = ctx.createLinearGradient(0,0,b.w,b.h);
    grad.addColorStop(0, '#6EE7B7'); grad.addColorStop(1, '#3B82F6');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.ellipse(b.w/2, b.h/2, b.w/2, b.h/2, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#0f172a'; ctx.fillRect(b.w/2 - 8, b.h/2 - 6, 6, 6); ctx.fillRect(b.w/2 + 4, b.h/2 - 6, 6, 6);
    ctx.restore();
  }
  // health bar above boss (drawn regardless of image)
  const barW = Math.min(b.w, state.W - 40); const pct = Math.max(0, b.hp) / b.maxHp;
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(b.x - 4, b.y - 12, barW+8, 8);
  ctx.fillStyle = '#f87171'; ctx.fillRect(b.x - 4, b.y - 12, Math.max(2, (barW) * pct), 8);
}

export function drawParticle(p){ const ctx = state.ctx; if(!ctx) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = p.color || '#FFD166'; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill(); ctx.restore(); }

export function render(){
  const ctx = state.ctx; if(!ctx) return;
  // apply screen shake during boss spawn effect
  let shakeX = 0, shakeY = 0;
  if(state.bossSpawnEffect.active){
    const t = now() - state.bossSpawnEffect.start;
    const p = Math.max(0, 1 - t / state.bossSpawnEffect.duration);
    const strength = 12 * p;
    shakeX = (Math.random()*2-1) * strength;
    shakeY = (Math.random()*2-1) * strength;
    ctx.save(); ctx.translate(shakeX, shakeY);
    drawBackground();
    if(state.boss) drawBoss(state.boss);
    state.bossBullets.forEach(drawBossBullet);
    state.asteroids.forEach(drawAsteroid);
    state.items.forEach(it => drawItemModule(ctx, it));
    state.bombs.forEach(drawBomb);
    state.autoBullets.forEach(drawAutoBullet);
    drawPlayer();
    // draw invincible aura overlay and timer above player (so it appears over the sprite)
    if(state.player && state.isInvincible && state.invincibleUntil && now() < state.invincibleUntil){
      const p = state.player;
      const cx = p.x + p.w/2; const cy = p.y + p.h/2;
      const remaining = Math.max(0, state.invincibleUntil - now());
      const pct = Math.min(1, remaining / 2000);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const maxR = Math.max(p.w,p.h) * 2.8;
      const grad = ctx.createRadialGradient(cx, cy, Math.max(4, maxR * (0.2*(1-pct))), cx, cy, maxR);
      grad.addColorStop(0, `rgba(180,220,255,${0.55 * (0.6 + 0.4*pct)})`);
      grad.addColorStop(0.6, `rgba(120,180,255,${0.25 * (0.6 + 0.4*pct)})`);
      grad.addColorStop(1, `rgba(60,120,200,${0.04 * (0.6 + 0.4*pct)})`);
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(cx, cy, maxR, 0, Math.PI*2); ctx.fill();
      ctx.restore();

      // timer text
      const tx = p.x + p.w/2; const ty = p.y - 8;
      const secs = (remaining/1000).toFixed(1);
      try{
        ctx.save(); ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        const isLast = remaining < 1000;
        const showText = !isLast || (Math.floor(now()/200) % 2 === 0);
        if(showText){
          ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillText(`${t('item.INVINCIBLE.name')} ${secs}${t('suffix.seconds')}`, tx+1, ty+1);
          ctx.fillStyle = isLast ? '#FF6B6B' : '#BEE3F8'; ctx.fillText(`${t('item.INVINCIBLE.name')} ${secs}${t('suffix.seconds')}`, tx, ty);
        }
        ctx.restore();
      }catch(e){}
    }
    ctx.restore();
  } else {
    drawBackground();
    if(state.boss) drawBoss(state.boss);
    state.bossBullets.forEach(drawBossBullet);
    state.asteroids.forEach(drawAsteroid);
    state.items.forEach(it => drawItemModule(ctx, it));
    state.bombs.forEach(drawBomb);
    state.autoBullets.forEach(drawAutoBullet);
    drawPlayer();
    // draw invincible aura overlay and timer above player (so it appears over the sprite)
    if(state.player && state.isInvincible && state.invincibleUntil && now() < state.invincibleUntil){
      const p = state.player;
      const cx = p.x + p.w/2; const cy = p.y + p.h/2;
      const remaining = Math.max(0, state.invincibleUntil - now());
      const pct = Math.min(1, remaining / 2000);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const maxR = Math.max(p.w,p.h) * 2.8;
      const grad = ctx.createRadialGradient(cx, cy, Math.max(4, maxR * (0.2*(1-pct))), cx, cy, maxR);
      grad.addColorStop(0, `rgba(180,220,255,${0.55 * (0.6 + 0.4*pct)})`);
      grad.addColorStop(0.6, `rgba(120,180,255,${0.25 * (0.6 + 0.4*pct)})`);
      grad.addColorStop(1, `rgba(60,120,200,${0.04 * (0.6 + 0.4*pct)})`);
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(cx, cy, maxR, 0, Math.PI*2); ctx.fill();
      ctx.restore();

      // timer text
      const tx = p.x + p.w/2; const ty = p.y - 8;
      const remaining2 = Math.max(0, state.invincibleUntil - now());
      const secs2 = (remaining2/1000).toFixed(1);
      try{
        ctx.save(); ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        const isLast2 = remaining2 < 1000;
        const showText2 = !isLast2 || (Math.floor(now()/200) % 2 === 0);
        if(showText2){
          ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillText(`${t('item.INVINCIBLE.name')} ${secs2}${t('suffix.seconds')}`, tx+1, ty+1);
          ctx.fillStyle = isLast2 ? '#FF6B6B' : '#BEE3F8'; ctx.fillText(`${t('item.INVINCIBLE.name')} ${secs2}${t('suffix.seconds')}`, tx, ty);
        }
        ctx.restore();
      }catch(e){}
    }
  }
  // spawn effect overlay and particles
  if(state.bossSpawnEffect.active){
    const t = now() - state.bossSpawnEffect.start;
    const pct = Math.min(1, t / state.bossSpawnEffect.duration);
    const r = state.bossSpawnEffect.maxRadius * pct;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(state.bossSpawnEffect.cx, state.bossSpawnEffect.cy, r*0.1, state.bossSpawnEffect.cx, state.bossSpawnEffect.cy, r);
    g.addColorStop(0, `rgba(255,240,200, ${0.6 * (1-pct)})`);
    g.addColorStop(1, `rgba(255,120,80, ${0.05 * (1-pct)})`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(state.bossSpawnEffect.cx, state.bossSpawnEffect.cy, r, 0, Math.PI*2); ctx.fill();
    state.particles.forEach(drawParticle);
    ctx.restore();
  }
}
