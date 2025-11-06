import { state, now, setCanvasSize, setBgmVolume, t } from './state.js';
import { startGame, resetGame, applyUpgrade, fireBomb, fireAutoBullet } from './logic.js';
import { drawItem as drawItemModule } from './items.js';
import { render } from './render.js';

// keyboard input
window.addEventListener('keydown',(e)=>{ state.keys[e.key]=true; });
window.addEventListener('keyup',(e)=>{ state.keys[e.key]=false; });

// difficulty select hookup
if(state.difficultySel){
  // ensure select reflects current state initially
  try{ if(state.difficultySel.value !== state.difficulty) state.difficultySel.value = state.difficulty; }catch(e){}
  state.difficultySel.addEventListener('change', (e)=>{ state.difficulty = e.target.value; });
}

// language select hookup
const langSelect = document.getElementById('langSelect');
if(langSelect){
  try{ if(!state.lang) state.lang = 'ko'; langSelect.value = state.lang; }catch(e){}
  langSelect.addEventListener('change', (e)=>{ state.lang = e.target.value; applyTranslations(); renderDifficultyInfo(); });
}

// apply translations to static UI elements
export function applyTranslations(){
  try{
    // header/title
    const h1 = document.querySelector('header h1'); if(h1) h1.textContent = t('title.game');
    // labels
    const labDiff = document.querySelector('label[for="difficulty"]'); if(labDiff) labDiff.textContent = t('label.difficulty');
    const labLang = document.querySelector('label[for="langSelect"]'); if(labLang) labLang.textContent = t('label.language');
    // buttons
    if(state.startBtn) state.startBtn.textContent = t('btn.start');
    if(state.pauseBtn) state.pauseBtn.textContent = t('btn.pause');
    if(state.resetBtn) state.resetBtn.textContent = t('btn.reset');
    const settingsBtnEl = document.getElementById('settingsBtn'); if(settingsBtnEl) settingsBtnEl.textContent = t('btn.settings');
    const infoBtn = document.getElementById('infoToggleBtn'); if(infoBtn) infoBtn.textContent = t('btn.info');
    const centerBtnEl = document.getElementById('centerScreenBtn'); if(centerBtnEl) centerBtnEl.textContent = t('btn.center');
    // HUD labels — update only label/suffix spans, keep value spans intact
    try{
      document.querySelectorAll('[data-i18n]').forEach(el=>{ const key = el.getAttribute('data-i18n'); if(key) el.textContent = t(key); });
      // for spans whose content is a translation key (initial values), update them too
      document.querySelectorAll('[data-i18n-val]').forEach(el=>{ const key = el.getAttribute('data-i18n-val'); if(key) el.textContent = t(key); });
    }catch(e){/* ignore */}
    // settings modal title
    const settingsTitle = document.querySelector('#settingsModal .modal-panel h3'); if(settingsTitle) settingsTitle.textContent = t('settings.title');
    // side panel headings
    const gd = document.querySelector('#gameDescription h3'); if(gd) gd.textContent = t('heading.gameDescription');
    const ii = document.querySelector('#itemInfo h3'); if(ii) ii.textContent = t('heading.itemInfo');
    // localized item list: build items with translated name + description
    try{
      const itemList = document.querySelector('#itemInfo ul.item-list');
      if(itemList){
        const types = ['INVINCIBLE','RECOVER','SPEED_UP','SLOW_DOWN','AUTO_HEAL'];
        const rows = types.map(tp => {
          const name = t(`item.${tp}.name`);
          const desc = t(`item.${tp}.desc`);
          return `<li style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><canvas class="item-icon" data-type="${tp}" width="36" height="36"></canvas><strong>${name}</strong> — ${desc}</li>`;
        });
        itemList.innerHTML = rows.join('\n');
        // re-render icons (they were replaced)
        setTimeout(renderItemIcons, 40);
      }
    }catch(e){/* ignore */}
    // upgrade modal
    const upTitle = document.querySelector('#upgradeModal .modal-panel h3'); if(upTitle) upTitle.textContent = t('upgrade.title');
    const upDesc = document.getElementById('upgradeDesc'); if(upDesc) upDesc.textContent = t('upgrade.choose');
    if(upMax) upMax.textContent = t('upgrade.maxHealth');
    if(upBomb) upBomb.textContent = t('upgrade.bombDmg');
    if(upAuto) upAuto.textContent = t('upgrade.autoAttack');
    if(upCancel) upCancel.textContent = t('upgrade.cancel');
  }catch(e){/* ignore */}
}

// initial apply
setTimeout(()=>{ try{ applyTranslations(); }catch(e){} }, 80);

// UI buttons
if(state.startBtn) state.startBtn.addEventListener('click', ()=>{ startGame(); });
if(state.pauseBtn) state.pauseBtn.addEventListener('click', ()=>{
  if(state.gameState==='RUNNING'){ state.gameState='PAUSED'; if(state.bgmAudio) try{ state.bgmAudio.pause(); }catch(e){} }
  else if(state.gameState==='PAUSED'){ state.gameState='RUNNING'; state.lastSpawn = now(); try{ state.bgmAudio.play().catch(()=>{}); }catch(e){} startGame(); }
});
if(state.resetBtn) state.resetBtn.addEventListener('click', ()=>{ resetGame(); render(); });

// upgrade modal buttons hookup
const upMax = document.getElementById('upgradeMaxHealth');
const upBomb = document.getElementById('upgradeBombDmg');
const upAuto = document.getElementById('upgradeAutoAttack');
const upCancel = document.getElementById('upgradeCancel');
if(upMax) upMax.addEventListener('click', ()=>applyUpgrade('maxHealth'));
if(upBomb) upBomb.addEventListener('click', ()=>applyUpgrade('bombDmg'));
if(upAuto) upAuto.addEventListener('click', ()=>applyUpgrade('autoAttack'));
if(upCancel) upCancel.addEventListener('click', ()=>{ const m=document.getElementById('upgradeModal'); if(m) m.style.display='none'; state.upgradePending=false; state.gameState='RUNNING'; if(state.stateEl) state.stateEl.textContent = t('state.RUNNING'); state.lastSpawn = now(); requestAnimationFrame(()=>{}); });

// Settings modal and file inputs
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const canvasSizeSelect = document.getElementById('canvasSizeSelect');
const customSizeRow = document.getElementById('customSizeRow');
const customWidthInput = document.getElementById('customWidth');
const customHeightInput = document.getElementById('customHeight');
const applySettings = document.getElementById('applySettings');
const closeSettings = document.getElementById('closeSettings');
const bgmVolume = document.getElementById('bgmVolume');
const bgFileInput = document.getElementById('bgFile');
const musicFileInput = document.getElementById('musicFile');
const bgFileName = document.getElementById('bgFileName');
const musicFileName = document.getElementById('musicFileName');
const resetBgBtn = document.getElementById('resetBg');
const resetMusicBtn = document.getElementById('resetMusic');

if(settingsBtn) settingsBtn.addEventListener('click', ()=>{
  if(settingsModal) settingsModal.style.display = 'flex';
  if(bgmVolume) bgmVolume.value = Math.round((state.bgmAudio.volume||0)*100);
  const lbl = document.getElementById('bgmVolumeLabel'); if(lbl) lbl.textContent = Math.round((state.bgmAudio.volume||0)*100) + '%';
  if(canvasSizeSelect){
    const cur = `${state.W}x${state.H}`;
    let found = false;
    for(const opt of canvasSizeSelect.options){ if(opt.value === cur){ canvasSizeSelect.value = cur; found = true; break; } }
    if(!found){ canvasSizeSelect.value = 'custom'; if(customSizeRow) customSizeRow.style.display = 'block'; if(customWidthInput) customWidthInput.value = state.W; if(customHeightInput) customHeightInput.value = state.H; }
  }
  if(canvasSizeSelect){ if(canvasSizeSelect.value === 'custom'){ if(customSizeRow) customSizeRow.style.display = 'block'; } else { if(customSizeRow) customSizeRow.style.display = 'none'; } }
});
if(closeSettings) closeSettings.addEventListener('click', ()=>{ if(settingsModal) settingsModal.style.display = 'none'; });
if(applySettings) applySettings.addEventListener('click', ()=>{
  let v = canvasSizeSelect ? canvasSizeSelect.value : '800x600';
  if(v === 'custom'){
    const w = customWidthInput ? parseInt(customWidthInput.value,10) : NaN;
    const h = customHeightInput ? parseInt(customHeightInput.value,10) : NaN;
    if(!isNaN(w) && !isNaN(h) && w >= 300 && h >= 200){ v = `${w}x${h}`; }
    else { v = `${state.W}x${state.H}`; }
  }
  setCanvasSize(v);
  if(bgmVolume) setBgmVolume(bgmVolume.value);
  if(settingsModal) settingsModal.style.display = 'none';
});
if(bgmVolume) bgmVolume.addEventListener('input', (e)=>{ const v = e.target.value; const lbl = document.getElementById('bgmVolumeLabel'); if(lbl) lbl.textContent = v + '%'; });

// local background file
if(bgFileInput){ bgFileInput.addEventListener('change', (e)=>{ const f = e.target.files && e.target.files[0]; if(!f) return; try{ if(state.currentBgUrl){ URL.revokeObjectURL(state.currentBgUrl); state.currentBgUrl = null; } }catch(e){} const obj = URL.createObjectURL(f); state.currentBgUrl = obj; state.bgImg.src = obj; if(bgFileName) bgFileName.textContent = f.name; }); }
if(resetBgBtn){ resetBgBtn.addEventListener('click', ()=>{ try{ if(state.currentBgUrl){ URL.revokeObjectURL(state.currentBgUrl); state.currentBgUrl = null; } }catch(e){} state.bgImg.src = '../img/background.jpg'; if(bgFileName) bgFileName.textContent = ''; }); }

// local music file
if(musicFileInput){ musicFileInput.addEventListener('change', (e)=>{ const f = e.target.files && e.target.files[0]; if(!f) return; try{ if(state.currentBgmUrl){ URL.revokeObjectURL(state.currentBgmUrl); state.currentBgmUrl = null; } }catch(e){} const obj = URL.createObjectURL(f); state.currentBgmUrl = obj; try{ state.bgmAudio.pause(); state.bgmAudio.src = obj; state.bgmAudio.load(); state.bgmAudio.loop = true; state.bgmAudio.play().catch(()=>{}); }catch(e){} if(musicFileName) musicFileName.textContent = f.name; }); }
if(resetMusicBtn){ resetMusicBtn.addEventListener('click', ()=>{ try{ if(state.currentBgmUrl){ URL.revokeObjectURL(state.currentBgmUrl); state.currentBgmUrl = null; } }catch(e){} try{ state.bgmAudio.pause(); state.bgmAudio.src = '../bgm/bgm.mp3'; state.bgmAudio.load(); }catch(e){} if(musicFileName) musicFileName.textContent = ''; }); }

// center screen button
const centerBtn = document.getElementById('centerScreenBtn'); if(centerBtn){ centerBtn.addEventListener('click', ()=>{ try{ const ga = document.getElementById('game-area'); if(!ga) return; const rect = ga.getBoundingClientRect(); const scrollX = window.scrollX + rect.left - ((window.innerWidth - rect.width)/2); const scrollY = window.scrollY + rect.top - ((window.innerHeight - rect.height)/2); window.scrollTo({ left: Math.max(0, Math.round(scrollX)), top: Math.max(0, Math.round(scrollY)), behavior: 'smooth' }); }catch(e){} }); }

// render difficulty info into the game description area
export function renderDifficultyInfo(){
  try{
    const el = document.getElementById('gameDescText');
    if(!el) return;
    const D = state.DIFFICULTY;
    const rows = [];
    for(const key of ['NORMAL','HARD','EXTREME']){
      const d = D[key];
      const name = t('diff.'+key);
      const spawnMs = d.spawnRate;
      const speed = d.asteroidSpeed;
      const itemPct = Math.round((d.itemChance||0)*100);
      rows.push(`<strong>${name}</strong>: ${t('label.asteroidSpeed')||'asteroidSpeed'} ${speed}, ${t('label.spawnRate')||'spawnRate'} ${spawnMs}ms, ${t('label.itemChance')||'itemChance'} ${itemPct}%`);
    }
    el.innerHTML = `${t('desc.overview')}<br/><br/><em>${t('heading.gameDescription')}</em><br/>` + rows.join('<br/>');
  }catch(e){/* ignore */}
}

// populate difficulty info on load
setTimeout(()=>{ try{ renderDifficultyInfo(); }catch(e){} }, 60);

// fit canvas to container
export function fitCanvasToContainer(){ try{ const header = document.querySelector('header'); const hud = document.getElementById('hud'); const headerH = header ? header.getBoundingClientRect().height : 0; const hudH = hud ? hud.getBoundingClientRect().height : 0; const margin = 24; const newW = Math.max(300, Math.round(window.innerWidth - margin)); const newH = Math.max(300, Math.round(window.innerHeight - headerH - hudH - margin)); if(state.canvas){ state.canvas.width = newW; state.canvas.height = newH; state.W = newW; state.H = newH; if(state.player){ state.player.x = Math.max(0, Math.min(state.W - state.player.w, state.player.x)); state.player.y = Math.max(0, Math.min(state.H - state.player.h, state.player.y)); } if(state.ctx) { state.ctx.clearRect(0,0,state.W,state.H); render(); } if(canvasSizeSelect){ const cur = `${state.W}x${state.H}`; for(const opt of canvasSizeSelect.options){ if(opt.value === cur){ canvasSizeSelect.value = cur; break; } } } renderItemIcons(); } }catch(e){} }

window.addEventListener('resize', ()=>{ fitCanvasToContainer(); });

// side panel toggle
const infoToggle = document.getElementById('infoToggleBtn'); const sidePanel = document.getElementById('sidePanel'); if(infoToggle && sidePanel){ infoToggle.addEventListener('click', ()=>{ sidePanel.classList.toggle('open'); }); }

export function renderItemIcons(){ const canvases = document.querySelectorAll('.item-icon'); canvases.forEach(c=>{ try{ const t = c.dataset.type || 'RECOVER'; const cw = c.width, ch = c.height; const cctx = c.getContext('2d'); cctx.clearRect(0,0,cw,ch); const it = { x: 0, y: 0, w: Math.min(cw,ch), h: Math.min(cw,ch), type: t }; cctx.save(); drawItemModule(cctx, it); cctx.restore(); }catch(e){} }); }

setTimeout(renderItemIcons, 60);

// UI sync
export function syncUI(){
  if(state.healthEl) state.healthEl.textContent = state.health;
  // localized state label
  if(state.stateEl) state.stateEl.textContent = t('state.' + (state.gameState || 'IDLE'));
  // auto attack indicator localized
  const aa = document.getElementById('autoAttack'); if(aa) aa.textContent = state.autoAttackEnabled ? t('value.on') : t('value.off');
  // invincibility HUD timer
  try{
    const invRow = document.getElementById('invincibleHudRow');
    const invEl = state.invincibleEl || document.getElementById('invincibleTimer');
    if(state.isInvincible && state.invincibleUntil && now() < state.invincibleUntil){
      const remaining = Math.max(0, state.invincibleUntil - now());
      const secs = (remaining/1000).toFixed(1);
      if(invEl) invEl.textContent = secs;
      if(invRow) {
        // flash when less than 1s
        if(remaining < 1000){
          const blink = Math.floor(now()/200) % 2 === 0;
          invRow.style.visibility = blink ? 'visible' : 'hidden';
          invRow.style.color = '#ff6b6b';
        } else {
          invRow.style.visibility = 'visible';
          invRow.style.display = '';
          invRow.style.color = '';
        }
      }
    } else {
      if(invRow) { invRow.style.display = 'none'; invRow.style.visibility = 'visible'; invRow.style.color = ''; }
      if(invEl) invEl.textContent = '';
    }
  }catch(e){}
}
setInterval(syncUI,250);
