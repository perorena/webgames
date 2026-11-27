const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const dragGhost = document.getElementById('drag-ghost');
const btnUndo = document.getElementById('btn-undo');
const btnBlockDir = document.getElementById('btn-block-dir');
const dirLabel = document.getElementById('dir-label');
const zoomLevelText = document.getElementById('zoom-level-text');

// 土台のグリッド数（幅: X, 奥行き: Z）
let gridX = 22;
let gridZ = 22;

// アイソメトリック（等角投影）の1タイルの描画サイズと基準原点
let tileW = 40;
let tileH = 20;
let blockH = 16;
let originX = canvas.width / 2;
let originY = 220;

// --- ズーム＆視点移動（パン）状態変数 ---
let zoom = 1.0;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5.0;
let panX = 0;
let panY = 0;
let isPanning = false;
let isSpacePressed = false;
let panStartClient = { x: 0, y: 0 };
let panStartOffset = { x: 0, y: 0 };

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

// --- 2. ブロック形状定義（1×1基本 ＋ 1×3・1×4横長＆1×3門型アーチ ＝ 全15種） ---
const SHAPE_DEFS = {
  cube:       { name: '通常ブロック',         badge: '基本・1.0段' },
  tile:       { name: '平ブロック',           badge: '石畳・0.5段' },
  beam3:      { name: '横長ブロック (1×3)',   badge: '1マス空き橋渡し' },
  beam4:      { name: '横長ブロック (1×4)',   badge: '2マス空き大梁' },
  plate3:     { name: '横長平ブロック (1×3)', badge: '橋板・庇 0.5段' },
  plate4:     { name: '横長平ブロック (1×4)', badge: '大橋板・庇 0.5段' },
  slope:      { name: '斜め屋根',             badge: '切妻・瓦屋根' },
  corner:     { name: '出隅屋根（外角）',     badge: '入母屋・隅棟' },
  pyramid:    { name: '尖塔・ピラミッド',     badge: '天守・尖塔頂' },
  battlement: { name: '胸壁・狭間',           badge: '城壁凸凹・塀' },
  tower:      { name: '丸塔・太柱',           badge: '西洋丸塔・礎' },
  arch:       { name: 'アーチ・城門 (1×3)',   badge: '両端柱・中央通路' },
  fence:      { name: '高欄・格子柵',         badge: '1×1プレート付' },
  trunk:      { name: '丸い木（幹）',         badge: '細い丸太' },
  leaf:       { name: '葉っぱ（3段）',        badge: '庭園樹木' }
};

const DIR_NAMES = [
  '手前右 (0°)',
  '手前左 (90°)',
  '奥左 (180°)',
  '奥右 (270°)'
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

  if (!isPanning) {
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
  neutralItem.innerHTML = `<span>🖱️ 選択解除（ニュートラル）</span><span class="shape-badge">配置オフ・閲覧 (Esc)</span>`;
  neutralItem.addEventListener('click', () => {
    setNeutralMode();
  });
  shapeList.appendChild(neutralItem);

  Object.entries(SHAPE_DEFS).forEach(([key, val]) => {
    const item = document.createElement('div');
    item.className = 'shape-item' + (key === selectedShape ? ' active' : '');
    item.dataset.shape = key;
    item.innerHTML = `<span>${val.name}</span><span class="shape-badge">${val.badge}</span>`;

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
  deleteShapeItem.innerHTML = `<span>🗑️ 削除（消しゴム）</span><span class="shape-badge">クリックで消去</span>`;
  deleteShapeItem.addEventListener('click', () => {
    setDeleteMode(!isDeleteMode);
  });
  shapeList.appendChild(deleteShapeItem);

  updateToolUIState();
}

function updateDragGhost(cx, cy) {
  if (!draggingShape) return;
  const colorInfo = PALETTE[selectedColor];
  const shapeInfo = SHAPE_DEFS[draggingShape];
  const dirArrow = ['↘', '↙', '↖', '↗'][selectedDir];

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
  btnUndo.disabled = history.length === 0;
}

// --- オートスケーリング＆中央配置（最大64×64対応） ---
function updateScale() {
  const totalSpan = (gridX + gridZ) / 2;
  const maxBoardWidth = canvas.width * 0.85;

  tileW = Math.max(6, Math.floor(maxBoardWidth / totalSpan));
  tileH = Math.max(3, Math.floor(tileW * 0.5));
  blockH = Math.max(3, Math.floor(tileW * 0.42));

  const centerOffsetX = (gridZ - gridX) * (tileW / 4);
  const boardPixelHeight = totalSpan * tileH;

  originX = (canvas.width / 2) + centerOffsetX;
  originY = Math.max(210, (canvas.height - boardPixelHeight) * 0.72);
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
  updateZoomHUD();
  render();
}

document.getElementById('btn-zoom-in').addEventListener('click', () => {
  setZoomAtPoint(zoom * 1.25, canvas.width / 2, canvas.height / 2);
});
document.getElementById('btn-zoom-out').addEventListener('click', () => {
  setZoomAtPoint(zoom / 1.25, canvas.width / 2, canvas.height / 2);
});
document.getElementById('btn-zoom-reset').addEventListener('click', resetView);

// --- 座標変換（ズーム＆パン考慮） ---
function gridToBaseScreen(x, z) {
  return {
    sx: originX + (x - z) * (tileW / 2),
    sy: originY + (x + z) * (tileH / 2)
  };
}

function getCanvasMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const rawX = (e.clientX - rect.left) * scaleX;
  const rawY = (e.clientY - rect.top) * scaleY;
  return {
    rawX: rawX,
    rawY: rawY,
    mx: (rawX - panX) / zoom,
    my: (rawY - panY) / zoom
  };
}

function screenToGridAtHeight(mx, my, elevY) {
  const hw = tileW / 2;
  const hh = tileH / 2;
  const dx = mx - originX;
  const dy = (my + elevY * blockH) - originY;

  const u = (dx / hw + dy / hh) / 2;
  const v = (dy / hh - dx / hw) / 2;

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
function drawBaseGrid() {
  const hw = tileW / 2;
  const hh = tileH / 2;
  const plateThickness = Math.max(4, Math.floor(blockH * 0.4));

  const rightTile  = gridToBaseScreen(gridX - 1, 0);
  const bottomTile = gridToBaseScreen(gridX - 1, gridZ - 1);
  const leftTile   = gridToBaseScreen(0, gridZ - 1);

  const rightPt  = { sx: rightTile.sx + hw,  sy: rightTile.sy };
  const bottomPt = { sx: bottomTile.sx,      sy: bottomTile.sy + hh };
  const leftPt   = { sx: leftTile.sx - hw,   sy: leftTile.sy };

  ctx.fillStyle = '#3b4252';
  ctx.beginPath();
  ctx.moveTo(leftPt.sx, leftPt.sy);
  ctx.lineTo(bottomPt.sx, bottomPt.sy);
  ctx.lineTo(bottomPt.sx, bottomPt.sy + plateThickness);
  ctx.lineTo(leftPt.sx, leftPt.sy + plateThickness);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#2e3440';
  ctx.beginPath();
  ctx.moveTo(bottomPt.sx, bottomPt.sy);
  ctx.lineTo(rightPt.sx, rightPt.sy);
  ctx.lineTo(rightPt.sx, rightPt.sy + plateThickness);
  ctx.lineTo(bottomPt.sx, bottomPt.sy + plateThickness);
  ctx.closePath();
  ctx.fill();

  const activeShape = draggingShape || selectedShape;
  const hoveredSet = new Set();
  if (!isPanning && hoverCell) {
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

      ctx.beginPath();
      ctx.moveTo(sx, sy - hh);
      ctx.lineTo(sx + hw, sy);
      ctx.lineTo(sx, sy + hh);
      ctx.lineTo(sx - hw, sy);
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
      ctx.fill();

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

function projLocal(baseSx, baseSy, h, u, v, w) {
  const du = u - 0.5;
  const dv = v - 0.5;
  return {
    x: baseSx + (du - dv) * (tileW / 2),
    y: baseSy + (du + dv) * (tileH / 2) - (w * h)
  };
}

function drawLocalSubBox(baseSx, baseSy, h, u0, v0, w0, u1, v1, w1, colors) {
  const bE = projLocal(baseSx, baseSy, h, u1, v0, w0);
  const bS = projLocal(baseSx, baseSy, h, u1, v1, w0);
  const bW = projLocal(baseSx, baseSy, h, u0, v1, w0);

  const tN = projLocal(baseSx, baseSy, h, u0, v0, w1);
  const tE = projLocal(baseSx, baseSy, h, u1, v0, w1);
  const tS = projLocal(baseSx, baseSy, h, u1, v1, w1);
  const tW = projLocal(baseSx, baseSy, h, u0, v1, w1);

  fillPolygon([tW, tS, bS, bW], colors.left);
  fillPolygon([tS, tE, bE, bS], colors.right);
  fillPolygon([tN, tE, tS, tW], colors.top);
}

function rotUV(u, v, dir) {
  if (dir === 0) return [u, v];
  if (dir === 1) return [1 - v, u];
  if (dir === 2) return [1 - u, 1 - v];
  return [v, 1 - u];
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

function drawMiniBox(cx, bottomY, scaleW, boxH, boxColors) {
  const hw = (tileW * scaleW) / 2;
  const hh = (tileH * scaleW) / 2;
  const topY = bottomY - boxH;

  const bE = { x: cx + hw, y: bottomY };
  const bS = { x: cx,      y: bottomY + hh };
  const bW = { x: cx - hw, y: bottomY };

  const tN = { x: cx,      y: topY - hh };
  const tE = { x: cx + hw, y: topY };
  const tS = { x: cx,      y: topY + hh };
  const tW = { x: cx - hw, y: topY };

  fillPolygon([tW, tS, bS, bW], boxColors.left);
  fillPolygon([tS, tE, bE, bS], boxColors.right);
  fillPolygon([tN, tE, tS, tW], boxColors.top);
}

function drawCylinder(baseSx, bottomCenterY, topCenterY, radiusRatio, colors, drawShadow = false) {
  const rx = tileW * radiusRatio;
  const ry = tileH * radiusRatio;

  if (drawShadow) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(baseSx, bottomCenterY + (tileH * 0.05), rx * 1.15, ry * 1.15, 0, 0, Math.PI * 2);
    ctx.fill();
  }

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

  ctx.fillStyle = colors.top;
  ctx.beginPath();
  ctx.ellipse(baseSx, topCenterY, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawStud(cx, topY, colors) {
  const studRx = tileW * 0.22;
  const studRy = tileH * 0.22;
  const studH = Math.max(1.5, blockH * 0.24);

  ctx.fillStyle = colors.right;
  ctx.beginPath();
  ctx.ellipse(cx, topY, studRx, studRy, 0, 0, Math.PI);
  ctx.lineTo(cx - studRx, topY - studH);
  ctx.ellipse(cx, topY - studH, studRx, studRy, 0, Math.PI, 0, true);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = colors.top;
  ctx.beginPath();
  ctx.ellipse(cx, topY - studH, studRx, studRy, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

const DELETE_HIGHLIGHT_COLORS = {
  top: '#ff6b6b',
  left: '#ee5253',
  right: '#c23616'
};

// --- 1セル単位のブロック描画関数 ---
function drawBlockPart(item, occupiedBottoms = new Set()) {
  const { x, y, z, shape, dir, partIdx, spanLen, isGhost, isDeleteTarget } = item;
  const colors = isDeleteTarget
    ? DELETE_HIGHLIGHT_COLORS
    : (PALETTE[item.colorKey] || PALETTE.white);

  const base = gridToBaseScreen(x, z);
  const bottomCenterY = base.sy - (y * blockH);
  const hw = tileW / 2;
  const hh = tileH / 2;

  const h = blockH * getBlockHeightUnits(shape);
  const topCenterY = bottomCenterY - h;

  const bN = { x: base.sx,      y: bottomCenterY - hh };
  const bE = { x: base.sx + hw, y: bottomCenterY };
  const bS = { x: base.sx,      y: bottomCenterY + hh };
  const bW = { x: base.sx - hw, y: bottomCenterY };

  const tN = { x: base.sx,      y: topCenterY - hh };
  const tE = { x: base.sx + hw, y: topCenterY };
  const tS = { x: base.sx,      y: topCenterY + hh };
  const tW = { x: base.sx - hw, y: topCenterY };

  ctx.save();
  if (isGhost) ctx.globalAlpha = 0.45;

  const effectiveTileW = tileW * zoom;
  ctx.lineWidth = (isDeleteTarget ? 2 : (effectiveTileW >= 12 ? 1 : 0.6)) / zoom;
  ctx.strokeStyle = isDeleteTarget ? '#ffffff' : 'rgba(0, 0, 0, 0.32)';

  if (shape === 'beam3' || shape === 'beam4' || shape === 'plate3' || shape === 'plate4') {
    fillPolygon([tW, tS, bS, bW], colors.left);
    fillPolygon([tS, tE, bE, bS], colors.right);
    fillPolygon([tN, tE, tS, tW], colors.top);

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
        drawLocalSubBox(base.sx, bottomCenterY, h, 0.0,  0.0, 0.48, 0.25, 1.0, 0.68, colors);
        drawLocalSubBox(base.sx, bottomCenterY, h, 0.75, 0.0, 0.48, 1.0,  1.0, 0.68, colors);
      } else {
        drawLocalSubBox(base.sx, bottomCenterY, h, 0.0, 0.0,  0.48, 1.0, 0.25, 0.68, colors);
        drawLocalSubBox(base.sx, bottomCenterY, h, 0.0, 0.75, 0.48, 1.0, 1.0,  0.68, colors);
      }
      drawLocalSubBox(base.sx, bottomCenterY, h, 0.0, 0.0, 0.68, 1.0, 1.0, 1.0, colors);
    }

    const topYKeyNum = Math.round((y + getBlockHeightUnits(shape)) * 10);
    if (!occupiedBottoms.has(`${x},${z},${topYKeyNum}`) && effectiveTileW >= 10) {
      drawStud(base.sx, topCenterY, colors);
    }

  } else if (shape === 'fence') {
    drawLocalSubBox(base.sx, bottomCenterY, h, 0.0, 0.0, 0.0, 1.0, 1.0, 0.22, colors);

    if (dir === 0) {
      drawLocalSubBox(base.sx, bottomCenterY, h, 0.74, 0.08, 0.22, 0.94, 0.28, 0.76, colors);
      drawLocalSubBox(base.sx, bottomCenterY, h, 0.74, 0.72, 0.22, 0.94, 0.92, 0.76, colors);
      drawLocalSubBox(base.sx, bottomCenterY, h, 0.72, 0.0,  0.76, 0.96, 1.0,  0.96, colors);
    } else if (dir === 1) {
      drawLocalSubBox(base.sx, bottomCenterY, h, 0.08, 0.74, 0.22, 0.28, 0.94, 0.76, colors);
      drawLocalSubBox(base.sx, bottomCenterY, h, 0.72, 0.74, 0.22, 0.92, 0.94, 0.76, colors);
      drawLocalSubBox(base.sx, bottomCenterY, h, 0.0,  0.72, 0.76, 1.0,  0.96, 0.96, colors);
    } else if (dir === 2) {
      drawLocalSubBox(base.sx, bottomCenterY, h, 0.06, 0.08, 0.22, 0.26, 0.28, 0.76, colors);
      drawLocalSubBox(base.sx, bottomCenterY, h, 0.06, 0.72, 0.22, 0.26, 0.92, 0.76, colors);
      drawLocalSubBox(base.sx, bottomCenterY, h, 0.04, 0.0,  0.76, 0.28, 1.0,  0.96, colors);
    } else {
      drawLocalSubBox(base.sx, bottomCenterY, h, 0.08, 0.06, 0.22, 0.28, 0.26, 0.76, colors);
      drawLocalSubBox(base.sx, bottomCenterY, h, 0.72, 0.06, 0.22, 0.92, 0.26, 0.76, colors);
      drawLocalSubBox(base.sx, bottomCenterY, h, 0.0,  0.04, 0.76, 1.0,  0.28, 0.96, colors);
    }

  } else if (shape === 'shachihoko') {
    // 屋根頂点の少し上に綺麗に座るよう高さオフセットを調整
    const shachiBaseY = bottomCenterY - (hh * 0.2);
    drawRotatedSubBox(base.sx, shachiBaseY, h, 0.25, 0.32, 0.0,  0.75, 0.68, 0.42, dir, colors);
    drawRotatedSubBox(base.sx, shachiBaseY, h, 0.18, 0.36, 0.42, 0.56, 0.64, 0.82, dir, colors);
    drawRotatedSubBox(base.sx, shachiBaseY, h, 0.10, 0.38, 0.82, 0.44, 0.62, 1.15, dir, colors);

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
    const apex = { x: base.sx, y: topCenterY - (hh * 0.35) };
    fillPolygon([apex, bS, bW], colors.left);
    fillPolygon([apex, bE, bS], colors.right);

  } else if (shape === 'slope') {
    let pN, pE, pS, pW;
    if (dir === 0) {
      pN = tN; pW = tW; pE = bE; pS = bS;
    } else if (dir === 1) {
      pN = tN; pE = tE; pW = bW; pS = bS;
    } else if (dir === 2) {
      pE = tE; pS = tS; pN = bN; pW = bW;
    } else {
      pW = tW; pS = tS; pN = bN; pE = bE;
    }

    if (pW.y < bW.y || pS.y < bS.y) {
      fillPolygon([bW, bS, pS, pW], colors.left);
    }
    if (pS.y < bS.y || pE.y < bE.y) {
      fillPolygon([bS, bE, pE, pS], colors.right);
    }

    const slopeShade = (dir === 0 || dir === 1) ? colors.top : colors.left;
    fillPolygon([pN, pE, pS, pW], slopeShade);

  } else if (shape === 'corner') {
    if (dir === 0) {
      fillPolygon([tS, bW, bN], colors.left);
      fillPolygon([tS, bN, bE], colors.left);
      fillPolygon([bW, bS, tS], colors.left);
      fillPolygon([bS, bE, tS], colors.right);
    } else if (dir === 1) {
      fillPolygon([tW, bN, bE], colors.left);
      fillPolygon([tW, bE, bS], colors.top);
      fillPolygon([bW, bS, tW], colors.left);
    } else if (dir === 2) {
      fillPolygon([tN, bS, bW], colors.top);
      fillPolygon([tN, bE, bS], colors.right);
    } else {
      fillPolygon([tE, bW, bN], colors.left);
      fillPolygon([tE, bS, bW], colors.top);
      fillPolygon([bS, bE, tE], colors.right);
    }

  } else if (shape === 'battlement') {
    drawLocalSubBox(base.sx, bottomCenterY, h, 0.0, 0.0, 0.0, 1.0, 1.0, 0.55, colors);

    if (dir === 0) {
      drawLocalSubBox(base.sx, bottomCenterY, h, 0.56, 0.06, 0.55, 1.0, 0.42, 1.0, colors);
      drawLocalSubBox(base.sx, bottomCenterY, h, 0.56, 0.58, 0.55, 1.0, 0.94, 1.0, colors);
    } else if (dir === 1) {
      drawLocalSubBox(base.sx, bottomCenterY, h, 0.06, 0.56, 0.55, 0.42, 1.0, 1.0, colors);
      drawLocalSubBox(base.sx, bottomCenterY, h, 0.58, 0.56, 0.55, 0.94, 1.0, 1.0, colors);
    } else if (dir === 2) {
      drawLocalSubBox(base.sx, bottomCenterY, h, 0.0, 0.06, 0.55, 0.44, 0.42, 1.0, colors);
      drawLocalSubBox(base.sx, bottomCenterY, h, 0.0, 0.58, 0.55, 0.44, 0.94, 1.0, colors);
    } else {
      drawLocalSubBox(base.sx, bottomCenterY, h, 0.06, 0.0, 0.55, 0.42, 0.44, 1.0, colors);
      drawLocalSubBox(base.sx, bottomCenterY, h, 0.58, 0.0, 0.55, 0.94, 0.44, 1.0, colors);
    }

  } else {
    fillPolygon([tW, tS, bS, bW], colors.left);
    fillPolygon([tS, tE, bE, bS], colors.right);
    fillPolygon([tN, tE, tS, tW], colors.top);

    const topYKey = `${x},${z},${Math.round((y + getBlockHeightUnits(shape)) * 10)}`;
    const hasBlockAbove = occupiedBottoms.has(topYKey);

    if (!hasBlockAbove && (shape === 'cube' || shape === 'tile') && effectiveTileW >= 10) {
      drawStud(base.sx, topCenterY, colors);
    }
  }

  ctx.restore();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(panX, panY);
  ctx.scale(zoom, zoom);

  drawBaseGrid();

  const deleteTargetIdx = (!isPanning && isDeleteMode && hoverCell)
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
  if (!isPanning && !isDeleteMode && hoverCell && selectedColor && activeShape) {
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

  renderParts.sort((a, b) => {
    const depthA = a.x + a.z;
    const depthB = b.x + b.z;
    if (depthA !== depthB) return depthA - depthB;
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
      add(x, y, rz1, colorKey, 'slope', 1);
      add(x, y, rz0, colorKey, 'slope', 3);
    }
    for (let z = zMin; z <= zMax; z++) {
      add(rx1, y, z, colorKey, 'slope', 0);
      add(rx0, y, z, colorKey, 'slope', 2);
    }
    add(rx1, y, rz1, colorKey, 'corner', 2);
    add(rx1, y, rz0, colorKey, 'corner', 1);
    add(rx0, y, rz1, colorKey, 'corner', 3);
    add(rx0, y, rz0, colorKey, 'corner', 0);
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
  for (let i = 3; i <= 18; i++) {
    if (i < 9 || i > 11) {
      add(i, 2, 18, 'white', 'battlement', 1);
    }
    add(18, 2, i, 'white', 'battlement', 0);
    add(i, 2, 3, 'white', 'battlement', 3);
    add(3, 2, i, 'white', 'battlement', 2);
  }

  for (let x = 5; x <= 15; x++) {
    for (let z = 5; z <= 15; z++) {
      const stone = (x + z) % 2 === 0 ? 'gray' : 'mossStone';
      add(x, 3, z, stone, 'cube');
    }
  }
  for (let i = 5; i <= 15; i++) {
    add(15, 4, i, 'darkWood', 'fence', 0);
    add(5,  4, i, 'darkWood', 'fence', 2);
  }
  for (let i = 6; i <= 14; i++) {
    if (i < 9 || i > 11) {
      add(i, 4, 15, 'darkWood', 'fence', 1);
    }
    add(i, 4, 5, 'darkWood', 'fence', 3);
  }

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

  add(10, 8, 10, 'white', 'cube');
  addRoofRing(8, 10, 10, 10, 10, 'dark');

  add(10, 9, 10, 'white', 'cube');

  // 最上階の屋根ピラミッド＋金のしゃちほこ
  add(10, 10, 10, 'dark', 'pyramid');
  add(10, 11, 10, 'gold', 'shachihoko', 0);

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

  for (let x = 3; x <= 12; x++) {
    for (let z = 3; z <= 12; z++) {
      add(x, 0, z, (x + z) % 2 === 0 ? 'gray' : 'sandstone', 'tile');
    }
  }
  add(9, 0.5, 9, 'water', 'tile');
  add(10, 0.5, 9, 'water', 'tile');
  add(9, 0.5, 10, 'water', 'tile');
  add(10, 0.5, 10, 'water', 'tile');

  for (let i = 3; i <= 12; i++) {
    if (i > 3 && i < 12) {
      add(i, 0.5, 3, 'sandstone', 'cube');
      add(i, 1.5, 3, 'sandstone', 'battlement', 3);

      add(3, 0.5, i, 'sandstone', 'cube');
      add(3, 1.5, i, 'sandstone', 'battlement', 2);

      if (i === 6 || i === 7 || i === 8) {
        if (i === 7) {
          add(12, 0.5, 7, 'darkWood', 'arch', 1);
        }
        add(12, 1.5, i, 'sandstone', 'battlement', 0);
      } else {
        add(12, 0.5, i, 'sandstone', 'cube');
        add(12, 1.5, i, 'sandstone', 'battlement', 0);
      }

      add(i, 0.5, 12, 'sandstone', 'cube');
      add(i, 1.5, 12, 'sandstone', 'battlement', 1);
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

  for (let x = 5; x <= 7; x++) {
    for (let z = 5; z <= 7; z++) {
      add(x, 0.5, z, 'brick', 'cube');
      add(x, 1.5, z, 'brick', 'cube');
      add(x, 2.5, z, 'sandstone', 'cube');
      if (x === 5 || x === 7 || z === 5 || z === 7) {
        const bDir = (x === 7) ? 0 : (z === 7) ? 1 : (x === 5) ? 2 : 3;
        add(x, 3.5, z, 'sandstone', 'battlement', bDir);
      }
    }
  }
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

if (btnBlockDir) {
  btnBlockDir.addEventListener('click', rotateBlockDirection);
}

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const { rawX, rawY } = getCanvasMousePos(e);
  const zoomFactor = e.deltaY < 0 ? 1.15 : (1 / 1.15);
  setZoomAtPoint(zoom * zoomFactor, rawX, rawY);
}, { passive: false });

canvas.addEventListener('mousemove', (e) => {
  if (isPanning) return;
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
  if (!isDragging && !isPanning) {
    hoverCell = null;
    render();
  }
});

canvas.addEventListener('mousedown', (e) => {
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

window.addEventListener('mousemove', (e) => {
  if (isPanning) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    panX = panStartOffset.x + (e.clientX - panStartClient.x) * scaleX;
    panY = panStartOffset.y + (e.clientY - panStartClient.y) * scaleY;
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

// キャンバス上の右クリックメニュー抑止（誤削除防止のため削除機能は廃止）
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

btnUndo.addEventListener('click', undo);

window.addEventListener('keydown', (e) => {
  if (document.activeElement.tagName === 'INPUT') return;

  if (e.code === 'Space') {
    e.preventDefault();
    if (!isSpacePressed) {
      isSpacePressed = true;
      updateToolUIState();
    }
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

// --- セーブ機能（JSONダウンロード） ---
document.getElementById('btn-save').addEventListener('click', () => {
  const saveData = {
    version: 36,
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

// --- 視点90度回転（1×3・1×4横長＆1×3アーチの基準セル補正込み） ---
document.getElementById('btn-rotate').addEventListener('click', () => {
  saveHistory();

  blocks = blocks.map(b => {
    const shape = b.shape || 'cube';
    const dir = b.dir || 0;
    const span = getBlockSpan(shape);

    if (span > 1) {
      const cells = getBlockCells(b.x, b.z, shape, dir);
      const rotatedCells = cells.map(c => ({ x: c.z, z: gridX - 1 - c.x }));
      const newDir = (dir + 3) % 4;
      let anchor = rotatedCells[0];
      for (const rc of rotatedCells) {
        const testCells = getBlockCells(rc.x, rc.z, shape, newDir);
        if (
          testCells.length === rotatedCells.length &&
          testCells.every(tc => rotatedCells.some(r => r.x === tc.x && r.z === tc.z))
        ) {
          anchor = rc;
          break;
        }
      }
      return {
        ...b,
        x: anchor.x,
        y: b.y,
        z: anchor.z,
        dir: newDir
      };
    }

    return {
      ...b,
      x: b.z,
      y: b.y,
      z: gridX - 1 - b.x,
      dir: (dir + 3) % 4
    };
  });

  [gridX, gridZ] = [gridZ, gridX];
  document.getElementById('input-grid-x').value = gridX;
  document.getElementById('input-grid-z').value = gridZ;
  updateScale();
  render();
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
updateScale();
updateZoomHUD();
render();
