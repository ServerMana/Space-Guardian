import { ITEM_SIZE } from './items.js';

// central shared mutable state for the game
export const state = {
  // canvas / ctx — initialized based on DOM
  canvas: document.getElementById('gameCanvas'),
  ctx: null,
  W: 800,
  H: 600,

  // DOM elements (cached)
  startBtn: document.getElementById('startBtn'),
  pauseBtn: document.getElementById('pauseBtn'),
  resetBtn: document.getElementById('resetBtn'),
  difficultySel: document.getElementById('difficulty'),
  healthEl: document.getElementById('health'),
  timeEl: document.getElementById('time'),
  scoreEl: document.getElementById('score'),
  stateEl: document.getElementById('state'),
  invincibleEl: document.getElementById('invincibleTimer'),

  // constants
  PLAYER_W: 30,
  PLAYER_H: 40,
  INITIAL_HEALTH: 3,
  MAX_HEALTH: 3,

  DIFFICULTY: {
    NORMAL: { asteroidSpeed: 3, spawnRate: 900, itemChance: 0.1 },
    HARD: { asteroidSpeed: 4, spawnRate: 650, itemChance: 0.08 },
    EXTREME: { asteroidSpeed: 5, spawnRate: 450, itemChance: 0.05 }
  },

  // runtime state
  gameState: 'IDLE', // IDLE, RUNNING, PAUSED, GAME_OVER
  difficulty: 'NORMAL',
  health: 3,
  playerSpeed: 5,
  isInvincible: false,
  invincibleUntil: 0,

  player: null,
  asteroids: [],
  bombs: [],
  items: [],
  boss: null,
  bossBullets: [],
  particles: [],
  bossSpawnEffect: { active: false, start: 0, duration: 1200, maxRadius: 220, cx: 0, cy: 0 },

  regenActive: false,
  regenUntil: 0,
  lastRegenTick: 0,
  keys: {},

  lastSpawn: 0,
  lastItemSpawn: 0,
  lastBombTime: 0,

  BOMB_COOLDOWN: 300,
  BOMB_SPEED: 8,
  BOMB_W: 8,
  BOMB_H: 12,

  autoBullets: [],
  AUTO_FIRE_INTERVAL: 600,
  lastAutoFire: 0,

  bombDamage: 1,
  autoAttackEnabled: false,
  UPGRADE_THRESHOLDS: [200, 500, 1200],
  nextUpgradeIndex: 0,
  upgradePending: false,
  startTime: 0,
  elapsed: 0,
  score: 0,

  // assets
  asteroidImg: new Image(),
  bgImg: new Image(),
  bgmAudio: new Audio('../bgm/bgm.mp3'),
  // optional artwork — place files at /img/player.png and /img/boss.png to use
  playerImg: new Image(),
  bossImg: new Image(),

  // URL tracking for selected files
  currentBgUrl: null,
  currentBgmUrl: null,
  ITEM_SIZE,
  // language (ko/en/ja) default ko
  lang: 'ko'
};

// initialize canvas context and assets
if(state.canvas){
  state.ctx = state.canvas.getContext('2d');
  state.W = state.canvas.width; state.H = state.canvas.height;
}
state.asteroidImg.src = '../img/a.png';
state.bgImg.src = '../img/background.jpg';
state.bgmAudio.loop = true; state.bgmAudio.volume = 0.5;
state.playerImg.src = '../img/player.png';
state.bossImg.src = '../img/boss.png';

// helpers
export function rand(min,max){return Math.random()*(max-min)+min}
export function now(){return performance.now()}

// mapping for UI label
export function stateLabelToKorean(s){
  const map = { IDLE:'대기', RUNNING:'실행', PAUSED:'일시정지', GAME_OVER:'게임오버' };
  return map[s] || s;
}

// expose a simple setCanvasSize helper here so UI module can call it
export function setCanvasSize(mode){
  const canvas = state.canvas; const ctx = state.ctx;
  if(!canvas) return;
  let newW = 800, newH = 600;
  if(mode === '1024x768'){ newW = 1024; newH = 768; }
  else if(mode === '1280x720'){ newW = 1280; newH = 720; }
  else if(mode === 'fit'){
    newW = Math.max(400, Math.min(window.innerWidth - 80, 1400));
    newH = Math.max(300, Math.min(window.innerHeight - 160, 900));
  } else if(typeof mode === 'string' && mode.indexOf('x')>0){
    const parts = mode.split('x'); newW = parseInt(parts[0])||800; newH = parseInt(parts[1])||600;
  }
  canvas.width = newW; canvas.height = newH; state.W = newW; state.H = newH;
  // clamp player
  if(state.player){ state.player.x = Math.max(0, Math.min(state.W - state.player.w, state.player.x));
    state.player.y = Math.max(0, Math.min(state.H - state.player.h, state.player.y)); }
  if(ctx) { ctx.clearRect(0,0,state.W,state.H); }
}

export function setBgmVolume(percent){ const v = Math.max(0, Math.min(100, Number(percent)))/100; try{ state.bgmAudio.volume = v; }catch(e){} }

// i18n strings
export const i18n = {
  ko: {
    'title.game': '운석 피하기',
    'label.difficulty': '난이도',
    'label.language': '언어',
    'btn.start': '시작',
    'btn.pause': '일시정지',
    'btn.reset': '리셋',
    'btn.settings': '설정',
    'btn.info': '게임정보',
    'btn.center': '중앙 정렬',
    'label.health': '체력',
    'label.time': '시간',
    'suffix.seconds': '초',
    'label.score': '점수',
    'label.bombDamage': '폭탄 피해',
    'label.autoAttack': '자동공격',
    'label.state': '상태',
    'settings.title': '설정',
    'heading.gameDescription': '게임 설명',
    'heading.itemInfo': '아이템 정보',
    'upgrade.title': '업그레이드 획득!',
    'upgrade.choose': '원하는 업그레이드를 선택하세요:',
    'upgrade.maxHealth': '최대 체력 +1',
    'upgrade.bombDmg': '폭탄 피해 +1',
    'upgrade.autoAttack': '자동공격 활성화',
    'upgrade.cancel': '취소'
    ,
    'state.IDLE': '대기',
    'state.RUNNING': '실행',
    'state.PAUSED': '일시정지',
    'state.GAME_OVER': '게임오버',
    'diff.NORMAL': '보통',
    'diff.HARD': '어려움',
    'diff.EXTREME': '극한',
    'desc.overview': '플레이어는 화면 아래에서 우주선을 조종하여 운석을 피하거나 폭탄(Z)으로 파괴합니다. 운석은 여러 번의 공격이 필요한 경우가 있으며, 화면에 떠다니는 아이템을 획득하면 다양한 효과를 얻을 수 있습니다. 점수를 쌓으면 업그레이드 선택 창이 나타나며, 보스를 일정 점수에 맞춰 소환됩니다.'
    ,
    'label.asteroidSpeed': '운석 속도',
    'label.spawnRate': '스폰 간격',
    'label.itemChance': '아이템 출현',
    'value.on': '켜짐',
    'value.off': '꺼짐'
    // item names & descriptions will be added below
  },
  en: {
    'title.game': 'Avoid Asteroids',
    'label.difficulty': 'Difficulty',
    'label.language': 'Language',
    'btn.start': 'Start',
    'btn.pause': 'Pause',
    'btn.reset': 'Reset',
    'btn.settings': 'Settings',
    'btn.info': 'Info',
    'btn.center': 'Center',
    'label.health': 'Health',
    'label.time': 'Time',
    'suffix.seconds': 's',
    'label.score': 'Score',
    'label.bombDamage': 'Bomb Dmg',
    'label.autoAttack': 'Auto Attack',
    'label.state': 'State',
    'settings.title': 'Settings',
    'heading.gameDescription': 'Game Description',
    'heading.itemInfo': 'Item Info',
    'upgrade.title': 'Upgrade Available!',
    'upgrade.choose': 'Choose an upgrade:',
    'upgrade.maxHealth': 'Max Health +1',
    'upgrade.bombDmg': 'Bomb Damage +1',
    'upgrade.autoAttack': 'Enable Auto Attack',
    'upgrade.cancel': 'Cancel'
    ,
    'state.IDLE': 'Idle',
    'state.RUNNING': 'Running',
    'state.PAUSED': 'Paused',
    'state.GAME_OVER': 'Game Over',
    'diff.NORMAL': 'Normal',
    'diff.HARD': 'Hard',
    'diff.EXTREME': 'Extreme',
    'desc.overview': 'Control your ship at the bottom of the screen to dodge or destroy asteroids with bombs (Z). Asteroids may require multiple hits; collect items for various effects. Earn score to choose upgrades and trigger boss spawns.'
    ,
    'label.asteroidSpeed': 'asteroid speed',
    'label.spawnRate': 'spawn rate',
    'label.itemChance': 'item chance',
    'value.on': 'On',
    'value.off': 'Off'
  },
  ja: {
    'title.game': '隕石を避けろ',
    'label.difficulty': '難易度',
    'label.language': '言語',
    'btn.start': '開始',
    'btn.pause': '一時停止',
    'btn.reset': 'リセット',
    'btn.settings': '設定',
    'btn.info': 'ゲーム情報',
    'btn.center': '中央に配置',
    'label.health': '体力',
    'label.time': '時間',
    'suffix.seconds': '秒',
    'label.score': 'スコア',
    'label.bombDamage': '爆弾ダメージ',
    'label.autoAttack': '自動攻撃',
    'label.state': '状態',
    'settings.title': '設定',
    'heading.gameDescription': 'ゲーム説明',
    'heading.itemInfo': 'アイテム情報',
    'upgrade.title': 'アップグレード獲得！',
    'upgrade.choose': 'アップグレードを選んでください:',
    'upgrade.maxHealth': '最大体力 +1',
    'upgrade.bombDmg': '爆弾ダメージ +1',
    'upgrade.autoAttack': '自動攻撃を有効にする',
    'upgrade.cancel': 'キャンセル'
    ,
    'state.IDLE': '待機',
    'state.RUNNING': '実行',
    'state.PAUSED': '一時停止',
    'state.GAME_OVER': 'ゲームオーバー',
    'diff.NORMAL': '普通',
    'diff.HARD': '難しい',
    'diff.EXTREME': '極限',
    'desc.overview': 'プレイヤーは画面下で宇宙船を操作し、隕石を回避または爆弾（Z）で破壊します。隕石は複数回の攻撃が必要な場合があり、アイテムを取るとさまざまな効果を得られます。スコアを稼ぐとアップグレード選択が表示され、一定スコアでボスが出現します。'
    ,
    'label.asteroidSpeed': '隕石の速度',
    'label.spawnRate': '出現間隔',
    'label.itemChance': 'アイテム出現率',
    'value.on': 'オン',
    'value.off': 'オフ'
  }
};

// item translations (per-language)
// Keys: item.<TYPE>.name, item.<TYPE>.desc
i18n.ko['item.INVINCIBLE.name'] = '무적';
i18n.ko['item.INVINCIBLE.desc'] = '일정 시간 무적';
i18n.ko['item.RECOVER.name'] = '회복';
i18n.ko['item.RECOVER.desc'] = '즉시 체력 1 회복';
i18n.ko['item.SPEED_UP.name'] = '속도 증가';
i18n.ko['item.SPEED_UP.desc'] = '속도 증가 (짧음)';
i18n.ko['item.SLOW_DOWN.name'] = '감속';
i18n.ko['item.SLOW_DOWN.desc'] = '운석 속도 감소 (짧음)';
i18n.ko['item.AUTO_HEAL.name'] = '자동 회복';
i18n.ko['item.AUTO_HEAL.desc'] = '초당 자동 회복 (짧음)';

i18n.en['item.INVINCIBLE.name'] = 'Invincible';
i18n.en['item.INVINCIBLE.desc'] = 'Temporary invincibility';
i18n.en['item.RECOVER.name'] = 'Recover';
i18n.en['item.RECOVER.desc'] = 'Recover 1 health instantly';
i18n.en['item.SPEED_UP.name'] = 'Speed Up';
i18n.en['item.SPEED_UP.desc'] = 'Short speed boost';
i18n.en['item.SLOW_DOWN.name'] = 'Slow Down';
i18n.en['item.SLOW_DOWN.desc'] = 'Temporarily slows asteroids';
i18n.en['item.AUTO_HEAL.name'] = 'Auto Heal';
i18n.en['item.AUTO_HEAL.desc'] = 'Heals 1 HP per second for a short time';

i18n.ja['item.INVINCIBLE.name'] = '無敵';
i18n.ja['item.INVINCIBLE.desc'] = '一定時間無敵';
i18n.ja['item.RECOVER.name'] = '回復';
i18n.ja['item.RECOVER.desc'] = '即時に体力1回復';
i18n.ja['item.SPEED_UP.name'] = 'スピードアップ';
i18n.ja['item.SPEED_UP.desc'] = '短時間速度上昇';
i18n.ja['item.SLOW_DOWN.name'] = '減速';
i18n.ja['item.SLOW_DOWN.desc'] = '隕石の速度を短時間低下させる';
i18n.ja['item.AUTO_HEAL.name'] = '自動回復';
i18n.ja['item.AUTO_HEAL.desc'] = '短時間毎秒体力を回復する';

export function t(key){ const lang = state.lang || 'ko'; return (i18n[lang] && i18n[lang][key]) || (i18n['ko'] && i18n['ko'][key]) || key; }
