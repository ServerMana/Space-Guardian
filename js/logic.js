import { state, rand, now, setCanvasSize, t } from './state.js';
import { createRandomItem } from './items.js';
import { render } from './render.js';

// collision helper
export function rectsOverlap(a,b){ return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h); }

export function spawnAsteroid(){
  const w = Math.floor(rand(36, 72));
  const h = Math.floor(w/2);
  const x = rand(0, state.W - w);
  const y = -h - rand(0,200);
  const dx = rand(-0.3,0.3);
  const baseHp = Math.max(1, Math.round((w / 40) + state.DIFFICULTY[state.difficulty].asteroidSpeed / 2));
  state.asteroids.push({x,y,w,h,dx, hp: baseHp, maxHp: baseHp});
}
export function spawnItem(){ const it = createRandomItem(rand, state.W); state.items.push(it); }

export function spawnBoss(){
  const w = 140, h = 80;
  state.boss = { x: state.W/2 - w/2, y: -h - 20, targetY: 60, w, h, dx: 2.2, hp: 120, maxHp: 120, alive: true };
  state.bossBullets = [];
  state.lastBossShoot = now();
  triggerBossSpawnEffect(state.boss);
}

export function triggerBossSpawnEffect(b){ if(!b) return; state.bossSpawnEffect.active = true; state.bossSpawnEffect.start = now(); state.bossSpawnEffect.cx = b.x + b.w/2; state.bossSpawnEffect.cy = b.y + b.h/2; state.particles = []; for(let i=0;i<40;i++){ const angle = Math.random()*Math.PI*2; const speed = 1.2 + Math.random()*3.4; state.particles.push({ x: state.bossSpawnEffect.cx, y: state.bossSpawnEffect.cy, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed, life: 600 + Math.random()*800, size: 2 + Math.random()*4, color: `hsl(${Math.floor(Math.random()*50)+10}, 90%, ${50+Math.random()*20}%)` }); } }

export function fireBomb(){
  const t = now(); if(t - state.lastBombTime < state.BOMB_COOLDOWN) return; state.lastBombTime = t;
  const bx = state.player.x + state.player.w/2 - state.BOMB_W/2;
  const by = state.player.y - state.BOMB_H - 4;
  state.bombs.push({x: bx, y: by, w: state.BOMB_W, h: state.BOMB_H, dy: -state.BOMB_SPEED, dmg: state.bombDamage});
}

export function fireAutoBullet(){ const bx = state.player.x + state.player.w/2 - 3; const by = state.player.y - 6; state.autoBullets.push({x: bx, y: by, w: 6, h: 10, dy: -10, dmg: 1}); }

export function applyItem(it){
  if(it.type==='INVINCIBLE'){ state.isInvincible = true; state.invincibleUntil = now() + 5000; }
  else if(it.type==='RECOVER'){ state.health = Math.min(state.MAX_HEALTH, state.health + 1); if(state.healthEl) state.healthEl.textContent = state.health; }
  else if(it.type==='SPEED_UP'){ state.playerSpeed = 8; setTimeout(()=>state.playerSpeed=5,5000); }
  else if(it.type==='SLOW_DOWN'){ state.asteroids.forEach(a=>a.slowUntil = now()+5000); }
  else if(it.type==='AUTO_HEAL'){ state.regenActive = true; state.regenUntil = now() + 6000; state.lastRegenTick = now(); }
}

export function applyUpgrade(choice){
  if(choice === 'maxHealth'){
    state.MAX_HEALTH = Math.min(9, state.MAX_HEALTH + 1);
    const el = document.getElementById('maxHealth'); if(el) el.textContent = state.MAX_HEALTH;
    state.health = Math.min(state.MAX_HEALTH, state.health + 1); if(state.healthEl) state.healthEl.textContent = state.health;
  } else if(choice === 'bombDmg'){ state.bombDamage = (state.bombDamage || 1) + 1; const el = document.getElementById('bombDmg'); if(el) el.textContent = state.bombDamage; }
  else if(choice === 'autoAttack'){ state.autoAttackEnabled = true; const el = document.getElementById('autoAttack'); if(el) el.textContent = t('value.on'); }
  state.nextUpgradeIndex++; state.upgradePending = false; const modal = document.getElementById('upgradeModal'); if(modal) modal.style.display = 'none'; state.gameState = 'RUNNING'; if(state.stateEl) state.stateEl.textContent = t('state.RUNNING'); state.lastSpawn = now(); state.lastItemSpawn = now(); state.lastAutoFire = now(); requestAnimationFrame(loop);
}

// game control
export function startGame(){ if(state.gameState==='RUNNING') return; if(state.gameState==='IDLE' || state.gameState==='GAME_OVER') resetGame(); state.gameState='RUNNING'; if(state.stateEl) state.stateEl.textContent = t('state.RUNNING'); state.startTime = now(); state.lastSpawn = now(); state.lastItemSpawn = now(); try{ state.bgmAudio.currentTime = 0; state.bgmAudio.play().catch(()=>{}); }catch(e){} requestAnimationFrame(loop); }

export function resetGame(){ state.gameState='IDLE'; if(state.stateEl) state.stateEl.textContent = t('state.IDLE'); state.health = state.INITIAL_HEALTH; if(state.healthEl) state.healthEl.textContent = state.health; state.MAX_HEALTH = state.INITIAL_HEALTH; const mh = document.getElementById('maxHealth'); if(mh) mh.textContent = state.MAX_HEALTH; state.player = { x: state.W/2 - state.PLAYER_W/2, y: state.H - state.PLAYER_H - 20, w: state.PLAYER_W, h: state.PLAYER_H }; state.asteroids = []; state.items = []; state.isInvincible=false; state.invincibleUntil=0; state.score=0; if(state.scoreEl) state.scoreEl.textContent = state.score; state.elapsed=0; if(state.timeEl) state.timeEl.textContent = (state.elapsed/1000).toFixed(1); state.bombs = []; state.autoBullets = []; state.bombDamage = 1; const bd = document.getElementById('bombDmg'); if(bd) bd.textContent = state.bombDamage; state.autoAttackEnabled = false; const aa = document.getElementById('autoAttack'); if(aa) aa.textContent = t('value.off'); state.nextUpgradeIndex = 0; state.lastAutoFire = now(); state.lastBombTime = 0; try{ state.bgmAudio.pause(); state.bgmAudio.currentTime = 0; }catch(e){} }

export function gameOver(){ state.gameState='GAME_OVER'; if(state.stateEl) state.stateEl.textContent = t('state.GAME_OVER'); try{ state.bgmAudio.pause(); }catch(e){} }

// update loop
let lastFrame = now();
export function loop(){ if(state.gameState !== 'RUNNING') return; const t = now(); const dt = t - lastFrame; lastFrame = t; update(dt); if(state.ctx) state.ctx.clearRect(0,0,state.W,state.H); render(); if(state.gameState==='RUNNING') requestAnimationFrame(loop); }

export function update(dt){
  // input
  if(state.keys['ArrowLeft']||state.keys['a']||state.keys['A']) state.player.x -= state.playerSpeed;
  if(state.keys['ArrowRight']||state.keys['d']||state.keys['D']) state.player.x += state.playerSpeed;
  if(state.keys['ArrowUp']||state.keys['w']||state.keys['W']) state.player.y -= state.playerSpeed;
  if(state.keys['ArrowDown']||state.keys['s']||state.keys['S']) state.player.y += state.playerSpeed;
  state.player.x = Math.max(0, Math.min(state.W - state.player.w, state.player.x)); state.player.y = Math.max(0, Math.min(state.H - state.player.h, state.player.y));

  const settings = state.DIFFICULTY[state.difficulty];
  if(now() - state.lastSpawn > settings.spawnRate){ state.lastSpawn = now(); spawnAsteroid(); }
  if(now() - state.lastItemSpawn > 1500){ state.lastItemSpawn = now(); if(Math.random() < settings.itemChance) spawnItem(); }

  // boss
  if(state.boss){ if(state.boss.y < state.boss.targetY) state.boss.y += 1.2; state.boss.x += state.boss.dx; if(state.boss.x < 10 || state.boss.x + state.boss.w > state.W - 10) state.boss.dx *= -1; if(now() - (state.lastBossShoot||0) > 700){ state.lastBossShoot = now(); const bx = state.boss.x + state.boss.w/2; const by = state.boss.y + state.boss.h; for(let s=-1;s<=1;s++){ const angle = Math.atan2((state.player.y + state.player.h/2) - by, (state.player.x + state.player.w/2) - bx) + s*0.18; const vx = Math.cos(angle) * 2.2; const vy = Math.sin(angle) * 2.2 + 4; state.bossBullets.push({x: bx - 6, y: by, w: 12, h: 12, vx, vy}); } } }

  // asteroids
  for(let i=state.asteroids.length-1;i>=0;i--){ const a = state.asteroids[i]; const baseSpeed = settings.asteroidSpeed; let speed = baseSpeed; if(a.slowUntil && now() < a.slowUntil) speed *= 0.6; a.y += speed; a.x += a.dx*6; if(a.y > state.H + 100) state.asteroids.splice(i,1); else { if(!state.isInvincible && rectsOverlap(state.player, a)){ state.health -= 1; if(state.healthEl) state.healthEl.textContent = state.health; state.isInvincible = true; state.invincibleUntil = now() + 1500; state.player.y = Math.min(state.H - state.player.h, state.player.y + 10); if(state.health <= 0){ gameOver(); } } } }

  // items
  for(let i=state.items.length-1;i>=0;i--){ const it = state.items[i]; it.y += 2.5; if(it.y > state.H + 50){ state.items.splice(i,1); continue; } if(rectsOverlap(state.player, it)){ applyItem(it); state.items.splice(i,1); state.score += 10; if(state.scoreEl) state.scoreEl.textContent = state.score; } }

  // bombs
  for(let i=state.bombs.length-1;i>=0;i--){ const b = state.bombs[i]; b.y += b.dy; if(b.y + b.h < -50){ state.bombs.splice(i,1); continue; } if(state.boss && rectsOverlap(b, state.boss)){ state.boss.hp -= (b.dmg || 1); state.bombs.splice(i,1); if(state.boss.hp <= 0){ const bossCenterX = state.boss.x + (state.boss.w/2); const bossCenterY = state.boss.y + (state.boss.h/2); state.boss.alive = false; state.boss = null; state.bossBullets = []; for(let k=0;k<5;k++){ const it = createRandomItem(rand, state.W); it.x = Math.max(10, Math.min(state.W-state.ITEM_SIZE-10, bossCenterX + rand(-50,50))); it.y = Math.max(-20, bossCenterY + rand(-20,20)); state.items.push(it); } state.score += 1000; if(state.scoreEl) state.scoreEl.textContent = state.score; continue; } else { state.score += 30; if(state.scoreEl) state.scoreEl.textContent = state.score; continue; } } for(let j=state.asteroids.length-1;j>=0;j--){ const a = state.asteroids[j]; if(rectsOverlap(b,a)){ a.hp -= (b.dmg || 1); state.bombs.splice(i,1); if(a.hp <= 0){ state.asteroids.splice(j,1); state.score += 20; } else { state.score += 8; } if(state.scoreEl) state.scoreEl.textContent = state.score; break; } } }

  // auto bullets
  for(let i=state.autoBullets.length-1;i>=0;i--){ const b = state.autoBullets[i]; b.y += b.dy; if(b.y + b.h < -50){ state.autoBullets.splice(i,1); continue; } if(state.boss && rectsOverlap(b, state.boss)){ state.boss.hp -= (b.dmg || 1); state.autoBullets.splice(i,1); if(state.boss.hp <= 0){ const bossCenterX = state.boss.x + (state.boss.w/2); const bossCenterY = state.boss.y + (state.boss.h/2); state.boss.alive = false; state.boss = null; state.bossBullets = []; for(let k=0;k<5;k++){ const it = createRandomItem(rand, state.W); it.x = Math.max(10, Math.min(state.W-state.ITEM_SIZE-10, bossCenterX + rand(-50,50))); it.y = Math.max(-20, bossCenterY + rand(-20,20)); state.items.push(it); } state.score += 1000; } else { state.score += 15; } if(state.scoreEl) state.scoreEl.textContent = state.score; continue; } for(let j=state.asteroids.length-1;j>=0;j--){ const a = state.asteroids[j]; if(rectsOverlap(b,a)){ a.hp -= (b.dmg || 1); state.autoBullets.splice(i,1); if(a.hp <= 0){ state.asteroids.splice(j,1); state.score += 15; } else { state.score += 5; } if(state.scoreEl) state.scoreEl.textContent = state.score; break; } } }

  if(state.isInvincible && now() > state.invincibleUntil){ state.isInvincible = false; }

  if(state.regenActive){ if(now() > state.regenUntil){ state.regenActive = false; } else if(now() - state.lastRegenTick > 1000){ state.lastRegenTick = now(); if(state.health < state.MAX_HEALTH){ state.health = Math.min(state.MAX_HEALTH, state.health + 1); if(state.healthEl) state.healthEl.textContent = state.health; } } }

  state.elapsed = now() - state.startTime; if(state.timeEl) state.timeEl.textContent = (state.elapsed/1000).toFixed(1);
  state.score += Math.floor(dt*0.01); if(state.scoreEl) state.scoreEl.textContent = state.score;

  // boss bullets
  for(let i=state.bossBullets.length-1;i>=0;i--){ const bb = state.bossBullets[i]; bb.x += bb.vx; bb.y += bb.vy; if(bb.y > state.H + 50 || bb.x < -50 || bb.x > state.W + 50){ state.bossBullets.splice(i,1); continue; } if(!state.isInvincible && rectsOverlap(bb, state.player)){ state.bossBullets.splice(i,1); state.health -= 1; if(state.healthEl) state.healthEl.textContent = state.health; state.isInvincible = true; state.invincibleUntil = now() + 1500; if(state.health <= 0){ gameOver(); } } }

  if(!state.boss && state.score >= 1500){ spawnBoss(); }

  if(state.bossSpawnEffect.active){ const t = now() - state.bossSpawnEffect.start; for(let i=state.particles.length-1;i>=0;i--){ const p = state.particles[i]; p.x += p.vx * (dt/16); p.y += p.vy * (dt/16); p.life -= dt; p.size = Math.max(0, p.size - (dt/400)); if(p.life <= 0 || p.size <= 0) state.particles.splice(i,1); } if(t > state.bossSpawnEffect.duration){ state.bossSpawnEffect.active = false; state.particles = []; } }

  if((state.keys['z'] || state.keys['Z'])){ fireBomb(); }
  if(state.autoAttackEnabled && now() - state.lastAutoFire > state.AUTO_FIRE_INTERVAL){ state.lastAutoFire = now(); fireAutoBullet(); }

  checkUpgrades();
}

export function checkUpgrades(){ if(state.nextUpgradeIndex >= state.UPGRADE_THRESHOLDS.length) return; if(state.score >= state.UPGRADE_THRESHOLDS[state.nextUpgradeIndex] && !state.upgradePending){ state.upgradePending = true; const modal = document.getElementById('upgradeModal'); if(modal){ modal.style.display = 'flex'; } state.gameState = 'PAUSED'; if(state.stateEl) state.stateEl.textContent = t('state.PAUSED'); } }
