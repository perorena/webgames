const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const dragGhost = document.getElementById('drag-ghost');
const btnUndo = document.getElementById('btn-undo');
const btnHudUndo = document.getElementById('btn-hud-undo');
const btnBlockDir = document.getElementById('btn-block-dir');
const btnHudDir = document.getElementById('btn-hud-dir');
const dirLabel = document.getElementById('dir-label');
const zoomLevelText = document.getElementById('zoom-level-text');
const pitchSliderEl = document.getElementById('slider-pitch');
const pitchTextEl = document.getElementById('pitch-level-text');
const yawSliderEl = document.getElementById('slider-yaw');
const yawTextEl = document.getElementById('yaw-level-text');

// 論理キャンバス解像度（リサイズ・高DPI対応時に自動更新）
let canvasLogicalW = 1280;
let canvasLogicalH = 860;

// 土台のグリッド数（幅: X, 奥行き: Z）
let gridX = 22;
let gridZ = 22;

// アイソメトリック（等角投影）の1タイルの描画サイズと基準原点
let tileW = 40;
let tileH = 20;
let blockH = 16;
let baseBlockH = 16; // ピッチ角30°基準のブロック高さ
let originX = canvasLogicalW / 2;
let originY = 220;

// --- カメラ角度（X軸チルト／ピッチ角：0°=真横, 30°=標準アイソメ, 90°=真上） ---
let cameraPitchDeg = 30;
const MIN_PITCH_DEG = 0;
const MAX_PITCH_DEG = 90;

// --- カメラ水平回転（Y軸回転／ヨー角：45°=標準アイソメ, 0°〜360°無段階） ---
let cameraYawDeg = 45;

// --- ズーム＆視点移動（パン）状態変数 ---
let zoom = 1.0;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5.0;
let panX = 0;
let panY = 0;
let isPanning = false;
let isTilting = false;
let isSpacePressed = false;
let panStartClient = { x: 0, y: 0 };
let panStartOffset = { x: 0, y: 0 };
let tiltStartClientX = 0;
let tiltStartClientY = 0;
let tiltStartYawDeg = 45;
let tiltStartPitchDeg = 30;

// --- スマホ・タッチ操作用状態変数 ---
let touchMode = 'none'; // 'none' | 'single' | 'pinch'
let touchStartClient = { x: 0, y: 0 };
let touchMoved = false;
let touchPanStartOffset = { x: 0, y: 0 };
let pinchStartDist = 0;
let pinchStartZoom = 1.0;
let pinchStartMidClient = { x: 0, y: 0 };
let pinchStartYawDeg = 45;
let pinchStartPitchDeg = 30;

// --- 1. カラー定義（日本城・海外城向け17色） ---
const PALETTE = {
  white:     { name: '漆喰ホワイト',         top: '#ffffff', left: '#dfe4ea', right: '#b2bec3', chip: '#ffffff', darkText: true },
  sandstone: { name: '砂岩サンドストーン',   top: '#eccc8e', left: '#d4b06a', right: '#b38d46', chip: '#eccc8e', darkText: true },
  gray:      { name: '石垣グレー',           top: '#8395a7', left: '#6d7f91', right: '#526170', chip: '#8395a7', darkText: true },
  mossStone: { name: '苔むし石垣',           top: '#78866b', left: '#616e55', right: '#47523d', chip: '#78866b', darkText: false },

  dark:      { name: 'いぶし銀・黒瓦',       top: '#4b5563', left: '#374151', right: '#1f2937', chip: '#4b5563', darkText: false },
  charcoal:  { name: '焼杉ブラック',         top: '#2f3542', left: '#222630', right: '#15181f', chip: '#222630', darkText: false },
  navy:      { name: '西洋スレート紺',       top: '#3c6382', left: '#2c4a63', right: '#1e3345', chip: '#3c6382', darkText: false },
  patina:    { name: '青銅・緑青屋根',       top: '#55efc4', left: '#26a69a', right: '#00796b', chip: '#26a69a', darkText: false },

  brick:     { name: '赤レンガ・テラコッタ', top: '#c05640', left: '#a3422e', right: '#7d2f1f', chip: '#c05640', darkText: false },
  wood:      { name: '檜・白木ウッド',       top: '#b87d4b', left: '#966134', right: '#704522', chip: '#b87d4b', darkText: false },
  darkWood:  { name: '古木・重厚梁',         top: '#6d4c41', left: '#54382f', right: '#3b251e', chip: '#6d4c41', darkText: false },
  gold:      { name: 'しゃちほこ金',         top: '#fbc531', left: '#e1b12c', right: '#b8860b', chip: '#fbc531', darkText: true },

  red:       { name: '太鼓橋・朱塗り',       top: '#ee5253', left: '#d63031', right: '#9e1c1c', chip: '#ee5253', darkText: false },
  sakura:    { name: '桜ピンク',             top: '#ffb8d1', left: '#f78fb3', right: '#cf6a87', chip: '#ffb8d1', darkText: true },
  green:     { name: '庭園グリーン',         top: '#4cd137', left: '#44bd32', right: '#2f8524', chip: '#4cd137', darkText: true },
  forest:    { name: '深緑・松グリーン',     top: '#2e7d32', left: '#1b5e20', right: '#103b14', chip: '#2e7d32', darkText: false },
  water:     { name: 'お堀・水面ブルー',     top: '#48dbfb', left: '#0abde3', right: '#0082a3', chip: '#48dbfb', darkText: true }
};

// --- 2. ブロック形状定義（1×1基本 ＋ 1×3・1×4横長＆1×3門型アーチ ＋ 胸壁角・高欄角 ＝ 全17種） ---
const SHAPE_DEFS = {
  cube:             { name: '通常ブロック',         badge: '基本・1.0段' },
  tile:             { name: '平ブロック',           badge: '石畳・0.5段' },
  beam3:            { name: '横長ブロック (1×3)',   badge: '1マス空き橋渡し' },
  beam4:            { name: '横長ブロック (1×4)',   badge: '2マス空き大梁' },
  plate3:           { name: '横長平ブロック (1×3)', badge: '橋板・庇 0.5段' },
  plate4:           { name: '横長平ブロック (1×4)', badge: '大橋板・庇 0.5段' },
  slope:            { name: '斜め屋根',             badge: '切妻・瓦屋根' },
  corner:           { name: '出隅屋根（外角）',     badge: '入母屋・隅棟' },
  pyramid:          { name: '尖塔・ピラミッド',     badge: '天守・尖塔頂' },
  battlement:       { name: '胸壁・狭間',           badge: '城壁凸凹・塀' },
  battlementCorner: { name: '胸壁・角（外角）',     badge: '城壁L字コーナー' },
  tower:            { name: '丸塔・太柱',           badge: '西洋丸塔・礎' },
  arch:             { name: 'アーチ・城門 (1×3)',   badge: '両端柱・中央通路' },
  fence:            { name: '高欄・格子柵',         badge: '1×1プレート付' },
  fenceCorner:      { name: '高欄・角（外角）',     badge: '回廊L字コーナー' },
  trunk:            { name: '丸い木（幹）',         badge: '細い丸太' },
  leaf:             { name: '葉っぱ（3段）',        badge: '庭園樹木' }
};

const DIR_NAMES = [
  '手前右 (0°)',
  '奥右 (90°)',
  '奥左 (180°)',
  '手前左 (270°)'
];

let blocks = [];
let history = [];
const MAX_HISTORY = 50;

let selectedColor = 'white';
let selectedShape = null; // 初期状態はニュートラル（未選択）
let selectedDir = 0;
let isDeleteMode = false;
let deleteShapeItem = null;

let draggingShape = null;
let isDragging = false;
let dragStartPos = { x: 0, y: 0 };
let hoverCell = null;

// --- 画面リサイズ・高解像度（Retina）対応 ---
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvasLogicalW = rect.width;
  canvasLogicalH = rect.height;

  canvas.width = Math.round(canvasLogicalW * dpr);
  canvas.height = Math.round(canvasLogicalH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  updateScale();
  render();
}

// --- スマホ用下部タブ切り替え制御 ---
function initMobileTabs() {
  const tabBtns = document.querySelectorAll('.mobile-tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.toggle('active', b === btn));
      tabPanels.forEach(panel => {
        panel.classList.toggle('active', panel.dataset.tabContent === targetTab);
      });
    });
  });
}

// --- 選択状態の見た目とカーソルの一括更新 ---
function updateToolUIState() {
  document.querySelectorAll('.shape-item').forEach(el => {
    const shapeKey = el.dataset.shape;
    if (shapeKey === '__neutral__') {
      el.classList.toggle('active', !isDeleteMode && selectedShape === null);
    } else if (shapeKey === '__delete__') {
      el.classList.toggle('active', isDeleteMode);
      el.style.background = isDeleteMode ? '#e53935' : '';
      el.style.borderColor = isDeleteMode ? '#ff6b6b' : '';
      el.style.color = isDeleteMode ? '#ffffff' : '';
    } else {
      el.classList.toggle('active', !isDeleteMode && shapeKey === selectedShape);
    }
  });

  if (!isPanning && !isTilting) {
    if (isSpacePressed) {
      canvas.style.cursor = 'grab';
    } else if (isDeleteMode) {
      canvas.style.cursor = 'not-allowed';
    } else if (selectedShape === null) {
      canvas.style.cursor = 'default';
    } else {
      canvas.style.cursor = 'crosshair';
    }
  }
}

// --- ニュートラル状態（選択解除）へ戻す ---
function setNeutralMode() {
  isDeleteMode = false;
  selectedShape = null;
  draggingShape = null;
  isDragging = false;
  dragGhost.style.display = 'none';
  updateToolUIState();
  render();
}

// --- 削除モード切り替え制御 ---
function setDeleteMode(active) {
  isDeleteMode = active;
  draggingShape = null;
  isDragging = false;
  dragGhost.style.display = 'none';
  updateToolUIState();
  render();
}

// --- カメラ角度（X軸ピッチ・Y軸水平回転）HUD制御 ---
function initCameraAngleControls() {
  if (pitchSliderEl) {
    pitchSliderEl.addEventListener('input', (e) => {
      setCameraPitch(parseFloat(e.target.value));
    });
  }
  document.querySelectorAll('.btn-pitch-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      setCameraPitch(parseFloat(btn.dataset.pitch));
    });
  });

  if (yawSliderEl) {
    yawSliderEl.addEventListener('input', (e) => {
      setCameraYaw(parseFloat(e.target.value));
    });
  }
  document.querySelectorAll('.btn-yaw-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      setCameraYaw(parseFloat(btn.dataset.yaw));
    });
  });
}

function updatePitchHUD() {
  const rounded = Math.round(cameraPitchDeg);
  if (pitchTextEl) {
    let suffix = '';
    if (rounded === 0) suffix = ' (真横)';
    else if (rounded === 30) suffix = ' (標準)';
    else if (rounded === 90) suffix = ' (真上)';
    pitchTextEl.textContent = `${rounded}°${suffix}`;
  }
  if (pitchSliderEl) {
    pitchSliderEl.value = String(rounded);
  }
}

function setCameraPitch(deg) {
  const clamped = Math.min(MAX_PITCH_DEG, Math.max(MIN_PITCH_DEG, deg));
  if (Math.abs(clamped - cameraPitchDeg) < 1e-4) return;
  cameraPitchDeg = clamped;
  updateScale();
  updatePitchHUD();
  render();
}

function updateYawHUD() {
  const rounded = Math.round(cameraYawDeg) % 360;
  if (yawTextEl) {
    const suffix = (rounded === 45) ? ' (標準)' : '';
    yawTextEl.textContent = `${rounded}°${suffix}`;
  }
  if (yawSliderEl) {
    yawSliderEl.value = String(rounded);
  }
}

function setCameraYaw(deg) {
  const normalized = ((deg % 360) + 360) % 360;
  if (Math.abs(normalized - cameraYawDeg) < 1e-4) return;
  cameraYawDeg = normalized;
  updateScale();
  updateYawHUD();
  render();
}

// --- カラーグリッド＆形状リスト UI の動的生成 ---
function initPaletteUI() {
  const colorGrid = document.getElementById('color-grid');
  Object.entries(PALETTE).forEach(([key, val]) => {
    const btn = document.createElement('div');
    btn.className = 'color-btn' + (key === selectedColor ? ' active' : '');
    btn.style.background = val.chip;
    btn.title = val.name;
    btn.addEventListener('click', () => {
      selectedColor = key;
      document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('selected-color-name').textContent = val.name;
      if (isDeleteMode) setDeleteMode(false);
      render();
    });
    colorGrid.appendChild(btn);
  });

  const shapeList = document.getElementById('shape-list');

  // パーツ形状リストの一番上に「選択解除（ニュートラル）」を追加
  const neutralItem = document.createElement('div');
  neutralItem.className = 'shape-item' + (selectedShape === null ? ' active' : '');
  neutralItem.dataset.shape = '__neutral__';
  neutralItem.style.gridColumn = '1 / -1';
  neutralItem.innerHTML = `<span>🖱️ 選択解除（ニュートラル）</span><span class="shape-badge">移動・閲覧 (Esc)</span>`;
  neutralItem.addEventListener('click', () => {
    setNeutralMode();
  });
  shapeList.appendChild(neutralItem);

  Object.entries(SHAPE_DEFS).forEach(([key, val]) => {
    const item = document.createElement('div');
    item.className = 'shape-item' + (key === selectedShape ? ' active' : '');
    item.dataset.shape = key;
    item.innerHTML = `<span>${val.name}</span><span class="shape-badge">${val.badge}</span>`;

    // タップ・クリックでパーツ選択
    item.addEventListener('click', () => {
      selectedShape = key;
      isDeleteMode = false;
      updateToolUIState();
      render();
    });

    // PC向けドラッグ＆ドロップ配置開始
    item.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;

      selectedShape = key;
      isDeleteMode = false;
      updateToolUIState();
      render();

      draggingShape = key;
      isDragging = false;
      dragStartPos = { x: e.clientX, y: e.clientY };
    });

    shapeList.appendChild(item);
  });

  // パーツ形状リストの一番下に「削除（消しゴム）」を追加
  deleteShapeItem = document.createElement('div');
  deleteShapeItem.className = 'shape-item';
  deleteShapeItem.dataset.shape = '__delete__';
  deleteShapeItem.style.gridColumn = '1 / -1';
  deleteShapeItem.innerHTML = `<span>🗑️ 削除（消しゴム）</span><span class="shape-badge">タップで消去 (D)</span>`;
  deleteShapeItem.addEventListener('click', () => {
    setDeleteMode(!isDeleteMode);
  });
  shapeList.appendChild(deleteShapeItem);

  initMobileTabs();
  initCameraAngleControls();
  updateToolUIState();
}

function updateDragGhost(cx, cy) {
  if (!draggingShape) return;
  const colorInfo = PALETTE[selectedColor];
  const shapeInfo = SHAPE_DEFS[draggingShape];
  const dirArrow = ['↘', '↗', '↖', '↙'][selectedDir];

  dragGhost.textContent = `${shapeInfo.name} (${dirArrow})`;
  dragGhost.style.background = colorInfo.chip;
  dragGhost.style.color = colorInfo.darkText ? '#1e1e24' : '#ffffff';
  dragGhost.style.left = cx + 'px';
  dragGhost.style.top = cy + 'px';
}

// --- Undo（履歴管理）処理 ---
function saveHistory() {
  history.push({
    gridX: gridX,
    gridZ: gridZ,
    blocks: blocks.map(b => ({ ...b }))
  });
  if (history.length > MAX_HISTORY) {
    history.shift();
  }
  updateUndoButton();
}

function undo() {
  if (history.length === 0) return;
  const prevState = history.pop();
  gridX = prevState.gridX;
  gridZ = prevState.gridZ;
  blocks = prevState.blocks;

  document.getElementById('input-grid-x').value = gridX;
  document.getElementById('input-grid-z').value = gridZ;
  updateScale();
  updateUndoButton();
  render();
}

function updateUndoButton() {
  const disabled = history.length === 0;
  if (btnUndo) btnUndo.disabled = disabled;
  if (btnHudUndo) btnHudUndo.disabled = disabled;
}

// --- オートスケーリング＆中央配置（PC横画面・スマホ縦画面の両方に対応） ---
function updateScale() {
  const totalSpan = (gridX + gridZ) / 2;
  const minDim = Math.min(canvasLogicalW * 0.88, canvasLogicalH * 1.15);

  tileW = Math.max(6, Math.floor(minDim / totalSpan));

  // ピッチ角（0°=真横 〜 30°=標準アイソメ 〜 90°=真上）に応じて縦圧縮率と高さを連続変化
  const rad = (cameraPitchDeg * Math.PI) / 180;
  const sinP = Math.sin(rad);
  const cosP = Math.cos(rad);
  const cos30 = Math.cos(Math.PI / 6);

  // 30°のとき tileH = tileW * 0.5、blockH = baseBlockH となり従来の標準表示と完全一致
  tileH = tileW * sinP;
  baseBlockH = Math.max(3, Math.floor(tileW * 0.42));
  blockH = baseBlockH * (cosP / cos30);

  // 盤面中心 ((gridX - 1)/2, (gridZ - 1)/2) が常に画面中央付近に来るように原点を自動配置
  const yawRad = (cameraYawDeg * Math.PI) / 180;
  const cosY = Math.cos(yawRad);
  const sinY = Math.sin(yawRad);
  const unitW = tileW / Math.SQRT2;
  const unitH = tileH / Math.SQRT2;

  const cx = (gridX - 1) / 2;
  const cz = (gridZ - 1) / 2;
  const centerDeltaX = (cx * cosY - cz * sinY) * unitW;
  const centerDeltaY = (cx * sinY + cz * cosY) * unitH;

  const boardPixelHeight = totalSpan * tileH;
  const targetCenterY = (canvasLogicalH * 0.56) + (boardPixelHeight * 0.08 * sinP);

  originX = (canvasLogicalW / 2) - centerDeltaX;
  originY = targetCenterY - centerDeltaY;
}

// --- ズーム＆視点移動制御ヘルパー ---
function updateZoomHUD() {
  zoomLevelText.textContent = `${Math.round(zoom * 100)}%`;
}

function setZoomAtPoint(newZoom, cx, cy) {
  const clampedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
  if (clampedZoom === zoom) return;

  const worldX = (cx - panX) / zoom;
  const worldY = (cy - panY) / zoom;

  zoom = clampedZoom;
  panX = cx - worldX * zoom;
  panY = cy - worldY * zoom;

  updateZoomHUD();
  render();
}

function resetView() {
  zoom = 1.0;
  panX = 0;
  panY = 0;
  cameraPitchDeg = 30;
  cameraYawDeg = 45;
  updateScale();
  updatePitchHUD();
  updateYawHUD();
  updateZoomHUD();
  render();
}

document.getElementById('btn-zoom-in').addEventListener('click', () => {
  setZoomAtPoint(zoom * 1.25, canvasLogicalW / 2, canvasLogicalH / 2);
});
document.getElementById('btn-zoom-out').addEventListener('click', () => {
  setZoomAtPoint(zoom / 1.25, canvasLogicalW / 2, canvasLogicalH / 2);
});
document.getElementById('btn-zoom-reset').addEventListener('click', resetView);

// --- 座標変換（水平回転角 yaw・ピッチ角・ズーム＆パン考慮） ---
// yaw = 45° のとき cos(45°)=sin(45°)=1/√2 となり、従来の (x - z)*(tileW/2), (x + z)*(tileH/2) と完全一致
function getYawBasis() {
  const yawRad = (cameraYawDeg * Math.PI) / 180;
  return {
    cosY: Math.cos(yawRad),
    sinY: Math.sin(yawRad),
    unitW: tileW / Math.SQRT2,
    unitH: tileH / Math.SQRT2
  };
}

function gridToBaseScreen(x, z) {
  const { cosY, sinY, unitW, unitH } = getYawBasis();
  return {
    sx: originX + (x * cosY - z * sinY) * unitW,
    sy: originY + (x * sinY + z * cosY) * unitH
  };
}

function clientToWorldPos(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const rawX = clientX - rect.left;
  const rawY = clientY - rect.top;
  return {
    rawX: rawX,
    rawY: rawY,
    mx: (rawX - panX) / zoom,
    my: (rawY - panY) / zoom
  };
}

function getCanvasMousePos(e) {
  return clientToWorldPos(e.clientX, e.clientY);
}

function screenToGridAtHeight(mx, my, elevY) {
  const { cosY, sinY, unitW } = getYawBasis();
  const unitH = Math.max(0.5, tileH / Math.SQRT2);

  const a = (mx - originX) / unitW;
  const b = ((my + elevY * blockH) - originY) / unitH;

  // 回転行列の逆変換
  const u = a * cosY + b * sinY;
  const v = -a * sinY + b * cosY;

  const gx = Math.round(u);
  const gz = Math.round(v);

  if (gx >= 0 && gx < gridX && gz >= 0 && gz < gridZ) {
    return { x: gx, z: gz };
  }
  return null;
}

function screenToGrid(mx, my) {
  const topHeights = new Set([0]);
  for (const b of blocks) {
    const topY = Math.round((b.y + getBlockHeightUnits(b.shape || 'cube')) * 10) / 10;
    topHeights.add(topY);
  }
  const sortedHeights = Array.from(topHeights).sort((a, b) => b - a);

  for (const h of sortedHeights) {
    if (h === 0) break;
    const cell = screenToGridAtHeight(mx, my, h);
    if (!cell) continue;

    const hasBlockAtTop = blocks.some(b => {
      const bTop = Math.round((b.y + getBlockHeightUnits(b.shape || 'cube')) * 10) / 10;
      if (bTop !== h) return false;
      const bCells = getBlockCells(b.x, b.z, b.shape || 'cube', b.dir || 0);
      return bCells.some(bc => bc.x === cell.x && bc.z === cell.z);
    });

    if (hasBlockAtTop) {
      return cell;
    }
  }

  return screenToGridAtHeight(mx, my, 0);
}

// --- ブロック寸法・占有セル計算（1×1 / 1×3 / 1×4 対応） ---
function getBlockHeightUnits(shape) {
  if (shape === 'tile' || shape === 'plate3' || shape === 'plate4') return 0.5;
  return 1.0;
}

function getBlockSpan(shape) {
  if (shape === 'beam3' || shape === 'plate3' || shape === 'arch') return 3;
  if (shape === 'beam4' || shape === 'plate4') return 4;
  return 1;
}

function getBlockCells(x, z, shape, dir = 0) {
  const span = getBlockSpan(shape);
  if (span === 1) return [{ x, z }];

  const cells = [];
  const alongX = (dir % 2 === 0);

  let startOffset = -1;
  if (alongX) {
    let startX = x + startOffset;
    if (startX < 0) startX = 0;
    if (startX + span > gridX) startX = Math.max(0, gridX - span);
    for (let i = 0; i < span; i++) {
      if (startX + i < gridX) cells.push({ x: startX + i, z });
    }
  } else {
    let startZ = z + startOffset;
    if (startZ < 0) startZ = 0;
    if (startZ + span > gridZ) startZ = Math.max(0, gridZ - span);
    for (let i = 0; i < span; i++) {
      if (startZ + i < gridZ) cells.push({ x, z: startZ + i });
    }
  }
  return cells;
}

function getStackHeightForFootprint(cells) {
  let maxTopY = 0;
  for (const cell of cells) {
    for (const b of blocks) {
      const bCells = getBlockCells(b.x, b.z, b.shape || 'cube', b.dir || 0);
      if (bCells.some(bc => bc.x === cell.x && bc.z === cell.z)) {
        const topY = b.y + getBlockHeightUnits(b.shape || 'cube');
        if (topY > maxTopY) {
          maxTopY = topY;
        }
      }
    }
  }
  return maxTopY;
}

function getStackHeight(x, z, shape = 'cube', dir = 0) {
  const cells = getBlockCells(x, z, shape, dir);
  return getStackHeightForFootprint(cells);
}

function findTopBlockIndexAt(cell) {
  if (!cell) return -1;
  let topIndex = -1;
  let maxTopY = -1;
  blocks.forEach((b, idx) => {
    const bCells = getBlockCells(b.x, b.z, b.shape || 'cube', b.dir || 0);
    if (bCells.some(bc => bc.x === cell.x && bc.z === cell.z)) {
      const topY = b.y + getBlockHeightUnits(b.shape || 'cube');
      if (topY >= maxTopY) {
        maxTopY = topY;
        topIndex = idx;
      }
    }
  });
  return topIndex;
}

function deleteTopBlockAt(cell) {
  const topIndex = findTopBlockIndexAt(cell);
  if (topIndex !== -1) {
    saveHistory();
    blocks.splice(topIndex, 1);
    render();
    return true;
  }
  return false;
}

// --- 描画ヘルパー ---
// 1セル(1x1)のローカル座標 (u, v, w) をスクリーン座標へ変換（u,v: 0〜1, w: 高さ比率）
function projLocal(baseSx, baseSy, h, u, v, w) {
  const { cosY, sinY, unitW, unitH } = getYawBasis();
  const du = u - 0.5;
  const dv = v - 0.5;
  return {
    x: baseSx + (du * cosY - dv * sinY) * unitW,
    y: baseSy + (du * sinY + dv * cosY) * unitH - (w * h)
  };
}

// 側面(4面)を視線方向（奥→手前）にソートして描画する汎用直方体描画（360°回転対応）
function drawLocalSubBox(baseSx, baseSy, h, u0, v0, w0, u1, v1, w1, colors) {
  const b00 = projLocal(baseSx, baseSy, h, u0, v0, w0);
  const b10 = projLocal(baseSx, baseSy, h, u1, v0, w0);
  const b11 = projLocal(baseSx, baseSy, h, u1, v1, w0);
  const b01 = projLocal(baseSx, baseSy, h, u0, v1, w0);

  const t00 = projLocal(baseSx, baseSy, h, u0, v0, w1);
  const t10 = projLocal(baseSx, baseSy, h, u1, v0, w1);
  const t11 = projLocal(baseSx, baseSy, h, u1, v1, w1);
  const t01 = projLocal(baseSx, baseSy, h, u0, v1, w1);

  if (h > 0.3) {
    const { sinY, cosY } = getYawBasis();
    // 画面下方向(+Y)に対する外向き法線の内積が大きい面が手前（可視）になる
    const faces = [
      { pts: [t01, t11, b11, b01], color: colors.left,  depth: cosY },   // +Z面
      { pts: [t11, t10, b10, b11], color: colors.right, depth: sinY },   // +X面
      { pts: [t10, t00, b00, b10], color: colors.left,  depth: -cosY },  // -Z面
      { pts: [t00, t01, b01, b00], color: colors.right, depth: -sinY }   // -X面
    ];
    // 手前に向いている面（depth > -1e-4）のみ奥から手前へ描画
    faces
      .filter(f => f.depth > -1e-4)
      .sort((a, b) => a.depth - b.depth)
      .forEach(f => fillPolygon(f.pts, f.color));
  }

  if (tileH > 0.3) {
    fillPolygon([t00, t10, t11, t01], colors.top);
  }
}

function drawBaseGrid() {
  const plateThickness = Math.max(2, Math.floor(blockH * 0.4));

  if (plateThickness > 0 && blockH > 0.5) {
    const { sinY, cosY } = getYawBasis();
    const p00 = projLocal(gridToBaseScreen(0, 0).sx, gridToBaseScreen(0, 0).sy, 0, 0, 0, 0);
    const p10 = projLocal(gridToBaseScreen(gridX - 1, 0).sx, gridToBaseScreen(gridX - 1, 0).sy, 0, 1, 0, 0);
    const p11 = projLocal(gridToBaseScreen(gridX - 1, gridZ - 1).sx, gridToBaseScreen(gridX - 1, gridZ - 1).sy, 0, 1, 1, 0);
    const p01 = projLocal(gridToBaseScreen(0, gridZ - 1).sx, gridToBaseScreen(0, gridZ - 1).sy, 0, 0, 1, 0);

    const sideEdges = [
      { a: p01, b: p11, color: '#3b4252', depth: cosY },
      { a: p11, b: p10, color: '#2e3440', depth: sinY },
      { a: p10, b: p00, color: '#3b4252', depth: -cosY },
      { a: p00, b: p01, color: '#2e3440', depth: -sinY }
    ];

    sideEdges
      .filter(e => e.depth > -1e-4)
      .sort((a, b) => a.depth - b.depth)
      .forEach(e => {
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.moveTo(e.a.x, e.a.y);
        ctx.lineTo(e.b.x, e.b.y);
        ctx.lineTo(e.b.x, e.b.y + plateThickness);
        ctx.lineTo(e.a.x, e.a.y + plateThickness);
        ctx.closePath();
        ctx.fill();
      });
  }

  const activeShape = draggingShape || selectedShape;
  const hoveredSet = new Set();
  if (!isPanning && !isTilting && touchMode === 'none' && hoverCell) {
    if (isDeleteMode) {
      const targetIdx = findTopBlockIndexAt(hoverCell);
      if (targetIdx !== -1) {
        const tb = blocks[targetIdx];
        getBlockCells(tb.x, tb.z, tb.shape || 'cube', tb.dir || 0)
          .forEach(c => hoveredSet.add(`${c.x},${c.z}`));
      }
    } else if (activeShape) {
      const previewCells = getBlockCells(hoverCell.x, hoverCell.z, activeShape, selectedDir);
      previewCells.forEach(c => hoveredSet.add(`${c.x},${c.z}`));
    } else {
      // ニュートラル時はカーソル位置の1マスのみ控えめに表示
      hoveredSet.add(`${hoverCell.x},${hoverCell.z}`);
    }
  }

  const effectiveTileW = tileW * zoom;
  for (let x = 0; x < gridX; x++) {
    for (let z = 0; z < gridZ; z++) {
      const { sx, sy } = gridToBaseScreen(x, z);
      const isHovered = hoveredSet.has(`${x},${z}`);
      const isNeutralHover = isHovered && !isDeleteMode && !activeShape;

      const c00 = projLocal(sx, sy, 0, 0, 0, 0);
      const c10 = projLocal(sx, sy, 0, 1, 0, 0);
      const c11 = projLocal(sx, sy, 0, 1, 1, 0);
      const c01 = projLocal(sx, sy, 0, 0, 1, 0);

      ctx.beginPath();
      ctx.moveTo(c00.x, c00.y);
      ctx.lineTo(c10.x, c10.y);
      ctx.lineTo(c11.x, c11.y);
      ctx.lineTo(c01.x, c01.y);
      ctx.closePath();

      if (isHovered) {
        if (isDeleteMode) {
          ctx.fillStyle = 'rgba(238, 82, 83, 0.35)';
        } else if (isNeutralHover) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
        } else {
          ctx.fillStyle = 'rgba(251, 197, 49, 0.35)';
        }
      } else {
        ctx.fillStyle = (x + z) % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.09)';
      }
      if (tileH > 0.5) {
        ctx.fill();
      }

      ctx.strokeStyle = isHovered
        ? (isDeleteMode
            ? 'rgba(238, 82, 83, 0.9)'
            : (isNeutralHover ? 'rgba(255, 255, 255, 0.45)' : 'rgba(251, 197, 49, 0.85)'))
        : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = (isHovered ? 1.5 : 1) / zoom;
      if (effectiveTileW >= 5 || isHovered) {
        ctx.stroke();
      }
    }
  }
}

function fillPolygon(points, fillStyle, strokeStyle = null) {
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
  ctx.fill();
  if (strokeStyle !== 'none') {
    ctx.stroke();
  }
}

// すべての回転パーツで統一した反時計回りのUV回転（dir: 0=右辺, 1=奥辺, 2=左辺, 3=手前辺）
function rotUV(u, v, dir) {
  if (dir === 0) return [u, v];
  if (dir === 1) return [v, 1 - u];
  if (dir === 2) return [1 - u, 1 - v];
  return [1 - v, u];
}

function drawRotatedSubBox(baseSx, baseSy, h, u0, v0, w0, u1, v1, w1, dir, colors) {
  const [ru0, rv0] = rotUV(u0, v0, dir);
  const [ru1, rv1] = rotUV(u1, v1, dir);
  drawLocalSubBox(
    baseSx, baseSy, h,
    Math.min(ru0, ru1), Math.min(rv0, rv1), w0,
    Math.max(ru0, ru1), Math.max(rv0, rv1), w1,
    colors
  );
}

// 複数のサブボックスを回転後、現在のカメラ水平角に合わせて奥→手前・下→上の順にソートして描画
function drawSortedRotatedSubBoxes(baseSx, baseSy, h, boxes, dir, colors) {
  const { sinY, cosY } = getYawBasis();
  const rotated = boxes.map(([u0, v0, w0, u1, v1, w1]) => {
    const [ru0, rv0] = rotUV(u0, v0, dir);
    const [ru1, rv1] = rotUV(u1, v1, dir);
    return {
      u0: Math.min(ru0, ru1),
      v0: Math.min(rv0, rv1),
      w0: w0,
      u1: Math.max(ru0, ru1),
      v1: Math.max(rv0, rv1),
      w1: w1
    };
  });

  rotated.sort((a, b) => {
    if (Math.abs(a.w0 - b.w0) > 1e-6) return a.w0 - b.w0;
    const depthA = ((a.u0 + a.u1) * sinY) + ((a.v0 + a.v1) * cosY);
    const depthB = ((b.u0 + b.u1) * sinY) + ((b.v0 + b.v1) * cosY);
    return depthA - depthB;
  });

  for (const b of rotated) {
    drawLocalSubBox(baseSx, baseSy, h, b.u0, b.v0, b.w0, b.u1, b.v1, b.w1, colors);
  }
}

function drawMiniBox(baseSx, bottomCenterY, scaleW, boxH, boxColors) {
  const half = scaleW / 2;
  drawLocalSubBox(baseSx, bottomCenterY, boxH, 0.5 - half, 0.5 - half, 0, 0.5 + half, 0.5 + half, 1, boxColors);
}

function drawCylinder(baseSx, bottomCenterY, topCenterY, radiusRatio, colors, drawShadow = false) {
  const rx = tileW * radiusRatio;
  const ry = Math.max(0.2, tileH * radiusRatio);
  const cylH = bottomCenterY - topCenterY;

  if (drawShadow && tileH > 0.5) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(baseSx, bottomCenterY + (tileH * 0.05), rx * 1.15, ry * 1.15, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (cylH > 0.3) {
    ctx.fillStyle = colors.left;
    ctx.beginPath();
    ctx.ellipse(baseSx, bottomCenterY, rx, ry, 0, Math.PI * 0.5, Math.PI);
    ctx.lineTo(baseSx - rx, topCenterY);
    ctx.ellipse(baseSx, topCenterY, rx, ry, 0, Math.PI, Math.PI * 0.5, true);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = colors.right;
    ctx.beginPath();
    ctx.ellipse(baseSx, bottomCenterY, rx, ry, 0, 0, Math.PI * 0.5);
    ctx.lineTo(baseSx, topCenterY + ry);
    ctx.ellipse(baseSx, topCenterY, rx, ry, 0, Math.PI * 0.5, 0, true);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(baseSx, bottomCenterY, rx, ry, 0, 0, Math.PI);
    ctx.lineTo(baseSx - rx, topCenterY);
    ctx.ellipse(baseSx, topCenterY, rx, ry, 0, Math.PI, 0, true);
    ctx.closePath();
    ctx.stroke();
  }

  if (tileH > 0.3) {
    ctx.fillStyle = colors.top;
    ctx.beginPath();
    ctx.ellipse(baseSx, topCenterY, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

function drawStud(cx, topY, colors) {
  const studRx = tileW * 0.22;
  const studRy = Math.max(0.2, tileH * 0.22);
  const studH = blockH * 0.24;

  if (studH > 0.3) {
    ctx.fillStyle = colors.right;
    ctx.beginPath();
    ctx.ellipse(cx, topY, studRx, studRy, 0, 0, Math.PI);
    ctx.lineTo(cx - studRx, topY - studH);
    ctx.ellipse(cx, topY - studH, studRx, studRy, 0, Math.PI, 0, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  if (tileH > 0.3) {
    ctx.fillStyle = colors.top;
    ctx.beginPath();
    ctx.ellipse(cx, topY - studH, studRx, studRy, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

const DELETE_HIGHLIGHT_COLORS = {
  top: '#ff6b6b',
  left: '#ee5253',
  right: '#c23616'
};

// --- 1セル単位のブロック描画関数（360°水平回転・ピッチ角対応） ---
function drawBlockPart(item, occupiedBottoms = new Set()) {
  const { x, y, z, shape, dir, partIdx, spanLen, isGhost, isDeleteTarget } = item;
  const colors = isDeleteTarget
    ? DELETE_HIGHLIGHT_COLORS
    : (PALETTE[item.colorKey] || PALETTE.white);

  const base = gridToBaseScreen(x, z);
  const bottomCenterY = base.sy - (y * blockH);
  const hh = tileH / 2;

  const h = blockH * getBlockHeightUnits(shape);
  const topCenterY = bottomCenterY - h;

  ctx.save();
  if (isGhost) ctx.globalAlpha = 0.45;

  const effectiveTileW = tileW * zoom;
  ctx.lineWidth = (isDeleteTarget ? 2 : (effectiveTileW >= 12 ? 1 : 0.6)) / zoom;
  ctx.strokeStyle = isDeleteTarget ? '#ffffff' : 'rgba(0, 0, 0, 0.32)';

  if (shape === 'beam3' || shape === 'beam4' || shape === 'plate3' || shape === 'plate4') {
    drawLocalSubBox(base.sx, bottomCenterY, h, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0, colors);

    const topYKeyNum = Math.round((y + getBlockHeightUnits(shape)) * 10);
    if (!occupiedBottoms.has(`${x},${z},${topYKeyNum}`) && effectiveTileW >= 10) {
      drawStud(base.sx, topCenterY, colors);
    }

  } else if (shape === 'arch') {
    const alongX = (dir % 2 === 0);
    const isPillar = (partIdx === 0 || partIdx === spanLen - 1);

    if (isPillar) {
      drawLocalSubBox(base.sx, bottomCenterY, h, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0, colors);
    } else {
      if (alongX) {
        drawSortedRotatedSubBoxes(base.sx, bottomCenterY, h, [
          [0.0,  0.0, 0.48, 0.25, 1.0, 0.68],
          [0.75, 0.0, 0.48, 1.0,  1.0, 0.68]
        ], 0, colors);
      } else {
        drawSortedRotatedSubBoxes(base.sx, bottomCenterY, h, [
          [0.0, 0.0,  0.48, 1.0, 0.25, 0.68],
          [0.0, 0.75, 0.48, 1.0, 1.0,  0.68]
        ], 0, colors);
      }
      drawLocalSubBox(base.sx, bottomCenterY, h, 0.0, 0.0, 0.68, 1.0, 1.0, 1.0, colors);
    }

    const topYKeyNum = Math.round((y + getBlockHeightUnits(shape)) * 10);
    if (!occupiedBottoms.has(`${x},${z},${topYKeyNum}`) && effectiveTileW >= 10) {
      drawStud(base.sx, topCenterY, colors);
    }

  } else if (shape === 'fence') {
    // 1×1土台プレート
    drawLocalSubBox(base.sx, bottomCenterY, h, 0.0, 0.0, 0.0, 1.0, 1.0, 0.22, colors);

    // rotUV統一：dir=0(右辺), 1(奥辺), 2(左辺), 3(手前辺) ＋ 奥→手前ソート描画
    drawSortedRotatedSubBoxes(base.sx, bottomCenterY, h, [
      [0.74, 0.08, 0.22, 0.94, 0.28, 0.76],
      [0.74, 0.72, 0.22, 0.94, 0.92, 0.76],
      [0.72, 0.0,  0.76, 0.96, 1.0,  0.96]
    ], dir, colors);

  } else if (shape === 'fenceCorner') {
    // 1×1土台プレート
    drawLocalSubBox(base.sx, bottomCenterY, h, 0.0, 0.0, 0.0, 1.0, 1.0, 0.22, colors);

    // 外周2辺に沿ったL字の手すり・角柱（回転後に奥→手前ソートして描画）
    drawSortedRotatedSubBoxes(base.sx, bottomCenterY, h, [
      [0.72, 0.72, 0.22, 0.96, 0.96, 0.76], // 角の親柱（下部）
      [0.74, 0.08, 0.22, 0.94, 0.28, 0.76], // 辺1の中間束柱
      [0.08, 0.74, 0.22, 0.28, 0.94, 0.76], // 辺2の中間束柱
      [0.72, 0.0,  0.76, 0.96, 0.96, 0.96], // 辺1の笠木（角まで通し）
      [0.0,  0.72, 0.76, 0.72, 0.96, 0.96]  // 辺2の笠木
    ], dir, colors);

  } else if (shape === 'shachihoko') {
    // 棟ブロック（tile）の天面にぴったり接地するよう基準位置を描画（反り頭が外を向くよう奥→手前ソート）
    drawSortedRotatedSubBoxes(base.sx, bottomCenterY, h, [
      [0.25, 0.32, 0.0,  0.75, 0.68, 0.42],
      [0.18, 0.36, 0.42, 0.56, 0.64, 0.82],
      [0.10, 0.38, 0.82, 0.44, 0.62, 1.15]
    ], dir, colors);

  } else if (shape === 'trunk') {
    drawCylinder(base.sx, bottomCenterY, topCenterY, 0.22, colors, y === 0);

  } else if (shape === 'tower') {
    drawCylinder(base.sx, bottomCenterY, topCenterY, 0.46, colors, y === 0);

  } else if (shape === 'leaf') {
    const tier1H = h * 0.48;
    const tier2H = h * 0.44;
    const tier3H = h * 0.38;

    drawMiniBox(base.sx, bottomCenterY, 1.04, tier1H, colors);
    const tier2BottomY = bottomCenterY - (tier1H * 0.78);
    drawMiniBox(base.sx, tier2BottomY, 0.76, tier2H, colors);
    const tier3BottomY = tier2BottomY - (tier2H * 0.78);
    drawMiniBox(base.sx, tier3BottomY, 0.46, tier3H, colors);

  } else if (shape === 'pyramid') {
    const b00 = projLocal(base.sx, bottomCenterY, h, 0, 0, 0);
    const b10 = projLocal(base.sx, bottomCenterY, h, 1, 0, 0);
    const b11 = projLocal(base.sx, bottomCenterY, h, 1, 1, 0);
    const b01 = projLocal(base.sx, bottomCenterY, h, 0, 1, 0);

    if (tileH > 0.3 && h <= 0.3) {
      fillPolygon([b00, b10, b11, b01], colors.top);
      ctx.beginPath();
      ctx.moveTo(b00.x, b00.y); ctx.lineTo(b11.x, b11.y);
      ctx.moveTo(b10.x, b10.y); ctx.lineTo(b01.x, b01.y);
      ctx.stroke();
    } else {
      const { sinY, cosY } = getYawBasis();
      const apex = { x: base.sx, y: topCenterY - (hh * 0.35) };
      const pyrFaces = [
        { pts: [apex, b11, b01], color: colors.left,  depth: cosY },
        { pts: [apex, b10, b11], color: colors.right, depth: sinY },
        { pts: [apex, b00, b10], color: colors.left,  depth: -cosY },
        { pts: [apex, b01, b00], color: colors.right, depth: -sinY }
      ];
      pyrFaces
        .filter(f => f.depth > -1e-4)
        .sort((a, b) => a.depth - b.depth)
        .forEach(f => fillPolygon(f.pts, f.color));
    }

  } else if (shape === 'slope') {
    // ローカルUV空間で回転後に投影するため360°どの水平回転でも正確に描画
    const { sinY, cosY } = getYawBasis();
    const rotPt = (u, v, w) => {
      const [ru, rv] = rotUV(u, v, dir);
      return projLocal(base.sx, bottomCenterY, h, ru, rv, w);
    };
    const [nX, nZ] = rotUV(1, 0, dir); // 傾斜下り方向ベクトル
    const slopeFacing = (nX - 0.5) * sinY + (nZ - 0.5) * cosY;

    const p00 = rotPt(0, 0, 1);
    const p01 = rotPt(0, 1, 1);
    const p10 = rotPt(1, 0, 0);
    const p11 = rotPt(1, 1, 0);
    const b00 = rotPt(0, 0, 0);
    const b01 = rotPt(0, 1, 0);

    // 背面・両脇の垂直三角形／矩形面を可視判定付きで描画
    const [bx, bz] = rotUV(0, 0.5, dir);
    const backDepth = (bx - 0.5) * sinY + (bz - 0.5) * cosY;
    const [sx1, sz1] = rotUV(0.5, 1, dir);
    const side1Depth = (sx1 - 0.5) * sinY + (sz1 - 0.5) * cosY;
    const [sx2, sz2] = rotUV(0.5, 0, dir);
    const side2Depth = (sx2 - 0.5) * sinY + (sz2 - 0.5) * cosY;

    const subFaces = [];
    if (h > 0.3) {
      if (backDepth > -1e-4)  subFaces.push({ pts: [b00, b01, p01, p00], color: colors.left,  depth: backDepth });
      if (side1Depth > -1e-4) subFaces.push({ pts: [b01, p11, p01],      color: colors.left,  depth: side1Depth });
      if (side2Depth > -1e-4) subFaces.push({ pts: [p10, b00, p00],      color: colors.right, depth: side2Depth });
    }
    const slopeShade = slopeFacing >= 0 ? colors.top : colors.left;
    subFaces.push({ pts: [p00, p10, p11, p01], color: slopeShade, depth: slopeFacing + 0.1 });

    subFaces
      .sort((a, b) => a.depth - b.depth)
      .forEach(f => fillPolygon(f.pts, f.color));

  } else if (shape === 'corner') {
    // 出隅屋根（外角）：dir=0(手前右外角)を基準にUV回転＋視線ソート描画
    const { sinY, cosY } = getYawBasis();
    const rotPt = (u, v, w) => {
      const [ru, rv] = rotUV(u, v, dir);
      return projLocal(base.sx, bottomCenterY, h, ru, rv, w);
    };
    const apex = rotPt(0, 0, 1);
    const b00  = rotPt(0, 0, 0);
    const b10  = rotPt(1, 0, 0);
    const b11  = rotPt(1, 1, 0);
    const b01  = rotPt(0, 1, 0);

    const calcDepth = (u, v) => {
      const [ru, rv] = rotUV(u, v, dir);
      return (ru - 0.5) * sinY + (rv - 0.5) * cosY;
    };

    const cornerFaces = [
      { pts: [apex, b01, b11], color: colors.top,   depth: calcDepth(0.5, 1.0) + 0.1 },
      { pts: [apex, b11, b10], color: colors.right, depth: calcDepth(1.0, 0.5) + 0.1 }
    ];
    if (h > 0.3) {
      const dBackZ = calcDepth(0.5, 0.0);
      const dBackX = calcDepth(0.0, 0.5);
      if (dBackZ > -1e-4) cornerFaces.push({ pts: [apex, b10, b00], color: colors.left,  depth: dBackZ });
      if (dBackX > -1e-4) cornerFaces.push({ pts: [apex, b00, b01], color: colors.right, depth: dBackX });
    }

    cornerFaces
      .sort((a, b) => a.depth - b.depth)
      .forEach(f => fillPolygon(f.pts, f.color));

  } else if (shape === 'battlement') {
    // 腰壁（下半分の土台）
    drawLocalSubBox(base.sx, bottomCenterY, h, 0.0, 0.0, 0.0, 1.0, 1.0, 0.55, colors);

    // rotUV統一：dir=0(右辺), 1(奥辺), 2(左辺), 3(手前辺) ＋ 奥→手前ソート描画
    drawSortedRotatedSubBoxes(base.sx, bottomCenterY, h, [
      [0.56, 0.06, 0.55, 1.0, 0.42, 1.0],
      [0.56, 0.58, 0.55, 1.0, 0.94, 1.0]
    ], dir, colors);

  } else if (shape === 'battlementCorner') {
    // 腰壁（下半分の土台）
    drawLocalSubBox(base.sx, bottomCenterY, h, 0.0, 0.0, 0.0, 1.0, 1.0, 0.55, colors);

    // 外周2辺に沿ったL字の凸部（回転後に奥→手前ソートして描画）
    drawSortedRotatedSubBoxes(base.sx, bottomCenterY, h, [
      [0.56, 0.56, 0.55, 1.0, 1.0,  1.0], // 外角の隅凸
      [0.56, 0.06, 0.55, 1.0, 0.42, 1.0], // 辺1の凸
      [0.06, 0.56, 0.55, 0.42, 1.0, 1.0]  // 辺2の凸
    ], dir, colors);

  } else {
    drawLocalSubBox(base.sx, bottomCenterY, h, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0, colors);

    const topYKey = `${x},${z},${Math.round((y + getBlockHeightUnits(shape)) * 10)}`;
    const hasBlockAbove = occupiedBottoms.has(topYKey);

    if (!hasBlockAbove && (shape === 'cube' || shape === 'tile') && effectiveTileW >= 10) {
      drawStud(base.sx, topCenterY, colors);
    }
  }

  ctx.restore();
}

function render() {
  ctx.clearRect(0, 0, canvasLogicalW, canvasLogicalH);

  ctx.save();
  ctx.translate(panX, panY);
  ctx.scale(zoom, zoom);

  drawBaseGrid();

  const deleteTargetIdx = (!isPanning && !isTilting && touchMode === 'none' && isDeleteMode && hoverCell)
    ? findTopBlockIndexAt(hoverCell)
    : -1;

  const renderParts = [];

  const pushBlockParts = (b, isGhost, isDeleteTarget = false) => {
    const shape = b.shape || 'cube';
    const dir = b.dir || 0;
    const cells = getBlockCells(b.x, b.z, shape, dir);
    cells.forEach((c, idx) => {
      renderParts.push({
        x: c.x,
        y: b.y,
        z: c.z,
        colorKey: b.colorKey,
        shape: shape,
        dir: dir,
        partIdx: idx,
        spanLen: cells.length,
        isGhost: isGhost,
        isDeleteTarget: isDeleteTarget
      });
    });
  };

  blocks.forEach((b, idx) => {
    pushBlockParts(b, false, idx === deleteTargetIdx);
  });

  // パーツ選択中（またはドラッグ中）のみゴーストプレビューを表示
  const activeShape = draggingShape || selectedShape;
  if (!isPanning && !isTilting && touchMode === 'none' && !isDeleteMode && hoverCell && selectedColor && activeShape) {
    const nextY = getStackHeight(hoverCell.x, hoverCell.z, activeShape, selectedDir);
    pushBlockParts({
      x: hoverCell.x,
      y: nextY,
      z: hoverCell.z,
      colorKey: selectedColor,
      shape: activeShape,
      dir: selectedDir
    }, true, false);
  }

  // 360°水平回転角(yaw)に応じたペインターズアルゴリズム（奥→手前ソート）
  const { sinY, cosY } = getYawBasis();
  renderParts.sort((a, b) => {
    const depthA = a.x * sinY + a.z * cosY;
    const depthB = b.x * sinY + b.z * cosY;
    if (Math.abs(depthA - depthB) > 1e-5) return depthA - depthB;
    if (a.y !== b.y) return a.y - b.y;
    return (a.isGhost ? 1 : 0) - (b.isGhost ? 1 : 0);
  });

  const occupiedBottoms = new Set();
  for (const b of blocks) {
    const bCells = getBlockCells(b.x, b.z, b.shape || 'cube', b.dir || 0);
    const yKey = Math.round(b.y * 10);
    for (const c of bCells) {
      occupiedBottoms.add(`${c.x},${c.z},${yKey}`);
    }
  }

  for (const part of renderParts) {
    drawBlockPart(part, occupiedBottoms);
  }

  ctx.restore();
}

// --- 4. お城プリセット（日本城・西洋城サンプル生成） ---
function buildJapaneseCastleBlocks() {
  const list = [];
  const add = (x, y, z, colorKey, shape = 'cube', dir = 0) => {
    list.push({ x, y, z, colorKey, shape, dir });
  };

  const addRoofRing = (y, xMin, xMax, zMin, zMax, colorKey = 'dark') => {
    const rx0 = xMin - 1;
    const rx1 = xMax + 1;
    const rz0 = zMin - 1;
    const rz1 = zMax + 1;

    for (let x = xMin; x <= xMax; x++) {
      add(x, y, rz1, colorKey, 'slope', 3); // 手前辺
      add(x, y, rz0, colorKey, 'slope', 1); // 奥辺
    }
    for (let z = zMin; z <= zMax; z++) {
      add(rx1, y, z, colorKey, 'slope', 0); // 右辺
      add(rx0, y, z, colorKey, 'slope', 2); // 左辺
    }
    add(rx1, y, rz1, colorKey, 'corner', 0);
    add(rx1, y, rz0, colorKey, 'corner', 1);
    add(rx0, y, rz0, colorKey, 'corner', 2);
    add(rx0, y, rz1, colorKey, 'corner', 3);
  };

  for (let x = 0; x < 22; x++) {
    for (let z = 0; z < 22; z++) {
      const isOuterGrass = (x === 0 || x === 21 || z === 0 || z === 21);
      const isMoat = (x === 1 || x === 2 || x === 19 || x === 20 || z === 1 || z === 2 || z === 19 || z === 20);
      if (isOuterGrass) {
        add(x, 0, z, 'green', 'cube');
      } else if (isMoat) {
        add(x, 0, z, 'water', 'tile');
      }
    }
  }

  for (let x = 3; x <= 18; x++) {
    for (let z = 3; z <= 18; z++) {
      const stone1 = (x + z) % 3 === 0 ? 'mossStone' : 'gray';
      const stone2 = (x + z + 1) % 3 === 0 ? 'mossStone' : 'gray';
      add(x, 0, z, stone1, 'cube');
      add(x, 1, z, stone2, 'cube');
    }
  }
  for (let x = 4; x <= 17; x++) {
    for (let z = 4; z <= 17; z++) {
      const stone = (x * 2 + z) % 3 === 0 ? 'mossStone' : 'gray';
      add(x, 2, z, stone, 'cube');
    }
  }
  // 本丸の白漆喰胸壁（四隅は胸壁・角パーツでL字接続）
  add(18, 2, 18, 'white', 'battlementCorner', 0); // 手前右コーナー
  add(3,  2, 18, 'white', 'battlementCorner', 3); // 手前左コーナー
  add(3,  2, 3,  'white', 'battlementCorner', 2); // 奥左コーナー
  add(18, 2, 3,  'white', 'battlementCorner', 1); // 奥右コーナー
  for (let i = 4; i <= 17; i++) {
    if (i < 9 || i > 11) {
      add(i, 2, 18, 'white', 'battlement', 3); // 手前辺
    }
    add(18, 2, i, 'white', 'battlement', 0); // 右辺
    add(i, 2, 3, 'white', 'battlement', 1);  // 奥辺
    add(3, 2, i, 'white', 'battlement', 2);  // 左辺
  }

  for (let x = 5; x <= 15; x++) {
    for (let z = 5; z <= 15; z++) {
      const stone = (x + z) % 2 === 0 ? 'gray' : 'mossStone';
      add(x, 3, z, stone, 'cube');
    }
  }
  // 天守台回廊の高欄（四隅は高欄・角パーツでL字接続）
  add(15, 4, 15, 'darkWood', 'fenceCorner', 0); // 手前右コーナー
  add(5,  4, 15, 'darkWood', 'fenceCorner', 3); // 手前左コーナー
  add(5,  4, 5,  'darkWood', 'fenceCorner', 2); // 奥左コーナー
  add(15, 4, 5,  'darkWood', 'fenceCorner', 1); // 奥右コーナー
  for (let i = 6; i <= 14; i++) {
    add(15, 4, i, 'darkWood', 'fence', 0); // 右辺
    add(5,  4, i, 'darkWood', 'fence', 2); // 左辺
    if (i < 9 || i > 11) {
      add(i, 4, 15, 'darkWood', 'fence', 3); // 手前辺
    }
    add(i, 4, 5, 'darkWood', 'fence', 1);  // 奥辺
  }

  // 天守 1層目（5×5）
  for (let x = 8; x <= 12; x++) {
    for (let z = 8; z <= 12; z++) {
      add(x, 4, z, 'white', 'cube');
    }
  }
  addRoofRing(4, 8, 12, 8, 12, 'dark');

  for (let x = 8; x <= 12; x++) {
    for (let z = 8; z <= 12; z++) {
      const wall = (x === 8 || x === 12 || z === 8 || z === 12) ? 'white' : 'charcoal';
      add(x, 5, z, wall, 'cube');
    }
  }

  // 天守 2層目（3×3）
  for (let x = 9; x <= 11; x++) {
    for (let z = 9; z <= 11; z++) {
      add(x, 6, z, 'white', 'cube');
    }
  }
  addRoofRing(6, 9, 11, 9, 11, 'dark');

  for (let x = 9; x <= 11; x++) {
    for (let z = 9; z <= 11; z++) {
      const wall = (x === 9 || x === 11 || z === 9 || z === 11) ? 'white' : 'charcoal';
      add(x, 7, z, wall, 'cube');
    }
  }

  // 天守 3層目（最上階：3×3の漆喰白壁にして大屋根をしっかり支える）
  addRoofRing(8, 9, 11, 9, 11, 'dark');
  for (let x = 9; x <= 11; x++) {
    for (let z = 9; z <= 11; z++) {
      add(x, 8, z, 'white', 'cube');
      const wall = (x === 9 || x === 11 || z === 9 || z === 11) ? 'white' : 'charcoal';
      add(x, 9, z, wall, 'cube');
    }
  }

  // 最上階の入母屋風大屋根（斜め屋根＋中央棟）＋両端に外向きの金のしゃちほこ一対
  for (let z = 9; z <= 11; z++) {
    add(11, 10, z, 'dark', 'slope', 0);
    add(9,  10, z, 'dark', 'slope', 2);
    add(10, 10, z, 'dark', 'tile', 0);
  }
  add(10, 10.5, 11, 'gold', 'shachihoko', 1); // 手前左端（外向き・+Z方向へ反り立つ）
  add(10, 10.5, 9,  'gold', 'shachihoko', 3); // 奥右端（外向き・-Z方向へ反り立つ）

  for (let z = 19; z <= 21; z++) {
    add(10, 1, z, 'red', 'arch', 0);
  }

  const gardenTrees = [
    { x: 4,  z: 16, y: 3, leaf: 'sakura' },
    { x: 16, z: 4,  y: 3, leaf: 'sakura' },
    { x: 16, z: 16, y: 3, leaf: 'forest' },
    { x: 4,  z: 4,  y: 3, leaf: 'forest' },
    { x: 0,  z: 15, y: 1, leaf: 'sakura' },
    { x: 0,  z: 6,  y: 1, leaf: 'forest' },
    { x: 15, z: 21, y: 1, leaf: 'sakura' },
    { x: 6,  z: 21, y: 1, leaf: 'forest' }
  ];
  gardenTrees.forEach(t => {
    add(t.x, t.y,     t.z, 'darkWood', 'trunk');
    add(t.x, t.y + 1, t.z, 'darkWood', 'trunk');
    add(t.x, t.y + 2, t.z, t.leaf, 'leaf');
  });

  return list;
}

function buildWesternCastleBlocks() {
  const list = [];
  const add = (x, y, z, colorKey, shape = 'cube', dir = 0) => {
    list.push({ x, y, z, colorKey, shape, dir });
  };

  // 中庭の石畳（池の4マスは水面を地面高さ y=0 に直接配置して浮きを解消）
  for (let x = 3; x <= 12; x++) {
    for (let z = 3; z <= 12; z++) {
      const isPond = (x >= 9 && x <= 10 && z >= 9 && z <= 10);
      if (isPond) {
        add(x, 0, z, 'water', 'tile');
      } else {
        add(x, 0, z, (x + z) % 2 === 0 ? 'gray' : 'sandstone', 'tile');
      }
    }
  }

  for (let i = 3; i <= 12; i++) {
    if (i > 3 && i < 12) {
      add(i, 0.5, 3, 'sandstone', 'cube');
      add(i, 1.5, 3, 'sandstone', 'battlement', 1); // 奥辺

      add(3, 0.5, i, 'sandstone', 'cube');
      add(3, 1.5, i, 'sandstone', 'battlement', 2); // 左辺

      if (i === 6 || i === 7 || i === 8) {
        if (i === 7) {
          add(12, 0.5, 7, 'darkWood', 'arch', 1);
        }
        add(12, 1.5, i, 'sandstone', 'battlement', 0); // 右辺
      } else {
        add(12, 0.5, i, 'sandstone', 'cube');
        add(12, 1.5, i, 'sandstone', 'battlement', 0); // 右辺
      }

      add(i, 0.5, 12, 'sandstone', 'cube');
      add(i, 1.5, 12, 'sandstone', 'battlement', 3); // 手前辺
    }
  }

  const corners = [
    { x: 3, z: 3 },
    { x: 12, z: 3 },
    { x: 3, z: 12 },
    { x: 12, z: 12 }
  ];
  corners.forEach(c => {
    add(c.x, 0.5, c.z, 'sandstone', 'tower');
    add(c.x, 1.5, c.z, 'sandstone', 'tower');
    add(c.x, 2.5, c.z, 'sandstone', 'tower');
    add(c.x, 3.5, c.z, 'patina', 'pyramid');
  });

  // 天守塔（四隅は胸壁・角パーツでL字接続）
  for (let x = 5; x <= 7; x++) {
    for (let z = 5; z <= 7; z++) {
      add(x, 0.5, z, 'brick', 'cube');
      add(x, 1.5, z, 'brick', 'cube');
      add(x, 2.5, z, 'sandstone', 'cube');
    }
  }
  add(7, 3.5, 7, 'sandstone', 'battlementCorner', 0); // 手前右コーナー
  add(5, 3.5, 7, 'sandstone', 'battlementCorner', 3); // 手前左コーナー
  add(5, 3.5, 5, 'sandstone', 'battlementCorner', 2); // 奥左コーナー
  add(7, 3.5, 5, 'sandstone', 'battlementCorner', 1); // 奥右コーナー
  add(7, 3.5, 6, 'sandstone', 'battlement', 0); // 右辺
  add(6, 3.5, 7, 'sandstone', 'battlement', 3); // 手前辺
  add(5, 3.5, 6, 'sandstone', 'battlement', 2); // 左辺
  add(6, 3.5, 5, 'sandstone', 'battlement', 1); // 奥辺

  add(6, 3.5, 6, 'white', 'tower');
  add(6, 4.5, 6, 'navy', 'pyramid');

  add(14, 0, 5, 'darkWood', 'trunk');
  add(14, 1, 5, 'green', 'leaf');
  add(14, 0, 9, 'darkWood', 'trunk');
  add(14, 1, 9, 'green', 'leaf');

  return list;
}

function applyCastlePreset(type) {
  saveHistory();

  if (type === 'jp') {
    gridX = 22;
    gridZ = 22;
    blocks = buildJapaneseCastleBlocks();
  } else {
    gridX = 16;
    gridZ = 16;
    blocks = buildWesternCastleBlocks();
  }

  document.getElementById('input-grid-x').value = gridX;
  document.getElementById('input-grid-z').value = gridZ;
  updateScale();
  resetView();
}

document.getElementById('btn-preset-jp').addEventListener('click', () => applyCastlePreset('jp'));
document.getElementById('btn-preset-eu').addEventListener('click', () => applyCastlePreset('eu'));

// --- ブロック配置・回転・ズーム＆パン・イベント制御 ---
function placeBlock(x, z, colorKey, shapeKey) {
  if (!shapeKey) return;
  saveHistory();
  const nextY = getStackHeight(x, z, shapeKey, selectedDir);
  blocks.push({
    x: x,
    y: nextY,
    z: z,
    colorKey: colorKey,
    shape: shapeKey,
    dir: selectedDir
  });
  render();
}

function rotateBlockDirection() {
  selectedDir = (selectedDir + 1) % 4;
  if (dirLabel) {
    dirLabel.textContent = `現在の向き: ${DIR_NAMES[selectedDir]}`;
  }
  if (isDragging && draggingShape) {
    updateDragGhost(parseFloat(dragGhost.style.left), parseFloat(dragGhost.style.top));
  }
  render();
}

if (btnBlockDir) btnBlockDir.addEventListener('click', rotateBlockDirection);
if (btnHudDir) btnHudDir.addEventListener('click', rotateBlockDirection);

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const { rawX, rawY } = getCanvasMousePos(e);
  const zoomFactor = e.deltaY < 0 ? 1.15 : (1 / 1.15);
  setZoomAtPoint(zoom * zoomFactor, rawX, rawY);
}, { passive: false });

canvas.addEventListener('mousemove', (e) => {
  if (isPanning || isTilting) return;
  const { mx, my } = getCanvasMousePos(e);
  const cell = screenToGrid(mx, my);

  if (
    (cell && !hoverCell) ||
    (!cell && hoverCell) ||
    (cell && hoverCell && (cell.x !== hoverCell.x || cell.z !== hoverCell.z))
  ) {
    hoverCell = cell;
    render();
  }
});

canvas.addEventListener('mouseleave', () => {
  if (!isDragging && !isPanning && !isTilting) {
    hoverCell = null;
    render();
  }
});

canvas.addEventListener('mousedown', (e) => {
  // Shift + 左ドラッグで水平回転(Y軸)＆見下ろし角度(X軸)のフリーカメラ回転
  if (e.button === 0 && e.shiftKey) {
    e.preventDefault();
    isTilting = true;
    tiltStartClientX = e.clientX;
    tiltStartClientY = e.clientY;
    tiltStartYawDeg = cameraYawDeg;
    tiltStartPitchDeg = cameraPitchDeg;
    canvas.style.cursor = 'move';
    render();
    return;
  }

  if (e.button === 1 || (e.button === 0 && isSpacePressed)) {
    e.preventDefault();
    isPanning = true;
    panStartClient = { x: e.clientX, y: e.clientY };
    panStartOffset = { x: panX, y: panY };
    canvas.style.cursor = 'grabbing';
    render();
    return;
  }

  if (e.button === 0) {
    const { mx, my } = getCanvasMousePos(e);
    const cell = screenToGrid(mx, my);
    if (!cell) return;

    if (isDeleteMode) {
      deleteTopBlockAt(cell);
    } else if (selectedColor && selectedShape) {
      placeBlock(cell.x, cell.z, selectedColor, selectedShape);
    }
  }
});

// --- スマホ・タッチジェスチャー制御（1本指タップ配置/パン、2本指ピンチズーム/回転） ---
function getTouchDistance(t1, t2) {
  return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
}

function getTouchMidpoint(t1, t2) {
  return {
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2
  };
}

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  hoverCell = null;

  if (e.touches.length === 1) {
    const t = e.touches[0];
    touchMode = 'single';
    touchStartClient = { x: t.clientX, y: t.clientY };
    touchMoved = false;
    touchPanStartOffset = { x: panX, y: panY };
  } else if (e.touches.length >= 2) {
    const t1 = e.touches[0];
    const t2 = e.touches[1];
    touchMode = 'pinch';
    touchMoved = true;
    pinchStartDist = Math.max(10, getTouchDistance(t1, t2));
    pinchStartZoom = zoom;
    pinchStartMidClient = getTouchMidpoint(t1, t2);
    pinchStartYawDeg = cameraYawDeg;
    pinchStartPitchDeg = cameraPitchDeg;
    render();
  }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();

  if (touchMode === 'single' && e.touches.length === 1) {
    const t = e.touches[0];
    const dx = t.clientX - touchStartClient.x;
    const dy = t.clientY - touchStartClient.y;

    if (Math.hypot(dx, dy) > 8) {
      touchMoved = true;
    }

    // ニュートラル（選択解除）状態での1本指ドラッグはパン移動
    if (touchMoved && !isDeleteMode && selectedShape === null) {
      panX = touchPanStartOffset.x + dx;
      panY = touchPanStartOffset.y + dy;
      render();
    }
  } else if (e.touches.length >= 2) {
    const t1 = e.touches[0];
    const t2 = e.touches[1];

    if (touchMode !== 'pinch') {
      touchMode = 'pinch';
      pinchStartDist = Math.max(10, getTouchDistance(t1, t2));
      pinchStartZoom = zoom;
      pinchStartMidClient = getTouchMidpoint(t1, t2);
      pinchStartYawDeg = cameraYawDeg;
      pinchStartPitchDeg = cameraPitchDeg;
      return;
    }

    // 2本指ピンチでズーム
    const curDist = Math.max(10, getTouchDistance(t1, t2));
    const curMid = getTouchMidpoint(t1, t2);
    const rect = canvas.getBoundingClientRect();
    const targetZoom = pinchStartZoom * (curDist / pinchStartDist);
    setZoomAtPoint(targetZoom, curMid.x - rect.left, curMid.y - rect.top);

    // 2本指ドラッグで水平回転＆見下ろし角度を同時操作
    const deltaMidX = curMid.x - pinchStartMidClient.x;
    const deltaMidY = curMid.y - pinchStartMidClient.y;
    setCameraYaw(pinchStartYawDeg + deltaMidX * 0.45);
    setCameraPitch(pinchStartPitchDeg + deltaMidY * 0.35);
  }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();

  // 1本指で指を動かさずに離した場合のみ「タップ配置／削除」を実行
  if (touchMode === 'single' && !touchMoved && e.changedTouches.length > 0) {
    const t = e.changedTouches[0];
    const { mx, my } = clientToWorldPos(t.clientX, t.clientY);
    const cell = screenToGrid(mx, my);

    if (cell) {
      if (isDeleteMode) {
        deleteTopBlockAt(cell);
      } else if (selectedColor && selectedShape) {
        placeBlock(cell.x, cell.z, selectedColor, selectedShape);
      }
    }
  }

  if (e.touches.length === 0) {
    touchMode = 'none';
    touchMoved = false;
    render();
  }
}, { passive: false });

window.addEventListener('mousemove', (e) => {
  if (isTilting) {
    // 左右ドラッグで水平回転（Y軸）、上下ドラッグで見下ろし角度（X軸）を同時操作
    const deltaX = e.clientX - tiltStartClientX;
    const deltaY = e.clientY - tiltStartClientY;
    setCameraYaw(tiltStartYawDeg + deltaX * 0.45);
    setCameraPitch(tiltStartPitchDeg + deltaY * 0.35);
    return;
  }

  if (isPanning) {
    panX = panStartOffset.x + (e.clientX - panStartClient.x);
    panY = panStartOffset.y + (e.clientY - panStartClient.y);
    render();
    return;
  }

  if (!draggingShape || isDeleteMode) return;

  const dist = Math.hypot(e.clientX - dragStartPos.x, e.clientY - dragStartPos.y);
  if (dist > 5) {
    isDragging = true;
    updateDragGhost(e.clientX, e.clientY);
    dragGhost.style.display = 'block';

    const { mx, my } = getCanvasMousePos(e);
    hoverCell = screenToGrid(mx, my);
    render();
  }
});

window.addEventListener('mouseup', () => {
  if (isTilting) {
    isTilting = false;
    updateToolUIState();
    render();
    return;
  }

  if (isPanning) {
    isPanning = false;
    updateToolUIState();
    render();
    return;
  }

  if (!draggingShape) return;

  if (isDragging && hoverCell && !isDeleteMode) {
    placeBlock(hoverCell.x, hoverCell.z, selectedColor, draggingShape);
  }

  draggingShape = null;
  isDragging = false;
  dragGhost.style.display = 'none';
  render();
});

// キャンバス上の右クリック・長押しメニュー抑止（誤削除防止）
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

if (btnUndo) btnUndo.addEventListener('click', undo);
if (btnHudUndo) btnHudUndo.addEventListener('click', undo);

window.addEventListener('keydown', (e) => {
  if (document.activeElement.tagName === 'INPUT') return;

  if (e.code === 'Space') {
    e.preventDefault();
    if (!isSpacePressed) {
      isSpacePressed = true;
      updateToolUIState();
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    setCameraPitch(cameraPitchDeg + 5);
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    setCameraPitch(cameraPitchDeg - 5);
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    setCameraYaw(cameraYawDeg - 5);
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    setCameraYaw(cameraYawDeg + 5);
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    undo();
  } else if (e.key.toLowerCase() === 'r') {
    e.preventDefault();
    rotateBlockDirection();
  } else if (e.key.toLowerCase() === 'd' || e.key.toLowerCase() === 'x') {
    e.preventDefault();
    setDeleteMode(!isDeleteMode);
  } else if (e.key === 'Escape') {
    e.preventDefault();
    setNeutralMode();
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'Space') {
    isSpacePressed = false;
    updateToolUIState();
  }
});

window.addEventListener('resize', resizeCanvas);

// --- セーブ機能（JSONダウンロード） ---
document.getElementById('btn-save').addEventListener('click', () => {
  const saveData = {
    version: 48,
    savedAt: new Date().toISOString(),
    gridX: gridX,
    gridZ: gridZ,
    blocks: blocks
  };

  const jsonStr = JSON.stringify(saveData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const timestamp = now.getFullYear() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') + '-' +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0');

  const a = document.createElement('a');
  a.href = url;
  a.download = `castle-${timestamp}.json`;
  a.click();

  URL.revokeObjectURL(url);
});

// --- ロード機能（JSON読み込み） ---
const fileInput = document.getElementById('file-input');

document.getElementById('btn-load').addEventListener('click', () => {
  fileInput.value = '';
  fileInput.click();
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      if (!data || !Array.isArray(data.blocks)) {
        throw new Error('無効なJSONフォーマットです');
      }

      const loadedX = Math.min(64, Math.max(4, parseInt(data.gridX, 10) || 16));
      const loadedZ = Math.min(64, Math.max(4, parseInt(data.gridZ, 10) || 16));

      const validShapes = [...Object.keys(SHAPE_DEFS), 'shachihoko'];
      const validBlocks = data.blocks
        .map(b => ({
          ...b,
          colorKey: b.colorKey === 'brown' ? 'wood' : b.colorKey
        }))
        .filter(b =>
          typeof b.x === 'number' &&
          typeof b.y === 'number' &&
          typeof b.z === 'number' &&
          b.x >= 0 && b.x < loadedX &&
          b.z >= 0 && b.z < loadedZ &&
          b.y >= 0 &&
          PALETTE[b.colorKey]
        )
        .map(b => ({
          x: b.x,
          y: b.y,
          z: b.z,
          colorKey: b.colorKey,
          shape: validShapes.includes(b.shape) ? b.shape : 'cube',
          dir: (typeof b.dir === 'number' && b.dir >= 0 && b.dir <= 3) ? b.dir : 0
        }));

      saveHistory();
      gridX = loadedX;
      gridZ = loadedZ;
      document.getElementById('input-grid-x').value = gridX;
      document.getElementById('input-grid-z').value = gridZ;
      blocks = validBlocks;

      updateScale();
      resetView();
    } catch (err) {
      alert('ファイルの読み込みに失敗しました。\n正しいブロックデータ（JSON）か確認してください。');
      console.error(err);
    }
  };
  reader.readAsText(file);
});

// --- 任意サイズ適用ボタン（最大64×64対応） ---
document.getElementById('btn-apply-size').addEventListener('click', () => {
  const inputX = document.getElementById('input-grid-x');
  const inputZ = document.getElementById('input-grid-z');

  const newX = Math.min(64, Math.max(4, parseInt(inputX.value, 10) || 16));
  const newZ = Math.min(64, Math.max(4, parseInt(inputZ.value, 10) || 16));
  inputX.value = newX;
  inputZ.value = newZ;

  if (newX === gridX && newZ === gridZ) return;

  saveHistory();
  const offsetX = Math.floor((newX - gridX) / 2);
  const offsetZ = Math.floor((newZ - gridZ) / 2);

  blocks = blocks
    .map(b => ({
      ...b,
      x: b.x + offsetX,
      y: b.y,
      z: b.z + offsetZ
    }))
    .filter(b => b.x >= 0 && b.x < newX && b.z >= 0 && b.z < newZ);

  gridX = newX;
  gridZ = newZ;
  updateScale();
  resetView();
});

// --- クリア ---
document.getElementById('btn-clear').addEventListener('click', () => {
  if (blocks.length === 0) return;
  if (!confirm('配置したブロックをすべてクリアしますか？')) return;

  saveHistory();
  blocks = [];
  render();
});

// --- 初期化（初期起動時は日本城サンプルを表示） ---
initPaletteUI();
document.getElementById('input-grid-x').value = gridX;
document.getElementById('input-grid-z').value = gridZ;
blocks = buildJapaneseCastleBlocks();
updatePitchHUD();
updateYawHUD();
updateZoomHUD();
resizeCanvas();
