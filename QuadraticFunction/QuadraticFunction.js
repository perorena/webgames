// グローバル定数
const ASPECT_RATIO = 4 / 3; // キャンバスの標準アスペクト比（幅:高さ = 4:3）
const MAX_WIDTH = 100; // 文字幅

// グローバル変数
let canvas;
let ctx;
let CANVAS_W = 640; // canvas要素の幅(px) - 画面幅に応じて動的に可変
let CANVAS_H = 480; // canvas要素の高さ(px) - 画面幅に応じて動的に可変
let oX; // canvas要素の中心 x座標
let oY; // canvas要素の中心 y座標
let animationFrameId = null; // requestAnimationFrameのID（連打・中断管理用）

window.addEventListener("load", onLoad, false);
// スマホの画面回転やウィンドウサイズ変更時に自動再描画するイベント
window.addEventListener("resize", handleResize, false);

function buttonClick() {
    drawing();
}

function onLoad() {
    canvas = document.getElementById("coordCanvas");
    ctx = canvas.getContext("2d");
    updateCanvasSize(); // スマホのピクセル密度・表示幅に合わせてキャンバス内部解像度を決定
    drawCoord(10); // 初期スケール: 10px = 1単位
}

// 画面サイズ変更時のリサイズ処理
function handleResize() {
    // 進行中のアニメーションを停止
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    updateCanvasSize(); // 新しい表示サイズに合わせてキャンバス解像度を再設定
    drawing(); // 新しいサイズで再描画
}

// スマホの高解像度ディスプレイ（Retina等）に対応するためのサイズ調整関数
function updateCanvasSize() {
    const dpr = window.devicePixelRatio || 1; // 高解像度ディスプレイの倍率を取得
    const rect = canvas.getBoundingClientRect(); // 実際に画面表示されている物理サイズを取得
    
    CANVAS_W = rect.width || 640;
    CANVAS_H = CANVAS_W / ASPECT_RATIO;

    // キャンバス内部のピクセル解像度を高密度の倍率に拡大設定（これで線や文字が鮮明になる）
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;

    // 描画コンテキストのスケールを高解像度用に合わせる
    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    // 中心座標を再計算
    oX = CANVAS_W / 2;
    oY = CANVAS_H / 2;
}

// 描画メイン処理（requestAnimationFrame版）
function drawing() {
    // すでにアニメーションが動いている場合はキャンセルの上再描画（連打対策）
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    let coefA = parseFloat(document.getElementById("coefficienA").value);
    let coefB = parseFloat(document.getElementById("coefficienB").value);
    let coefC = parseFloat(document.getElementById("coefficienC").value);

    if (isNaN(coefA) || isNaN(coefB) || isNaN(coefC)) {
        alert("正しい値を入力してください！");
        return;
    }

    // 数式表示
    document.getElementById("addText").innerHTML = buildFormulaString(coefA, coefB, coefC);

    // 関数定義
    let f = function(x) {
        return coefA * Math.pow(x, 2) + coefB * x + coefC;
    };

    // 自動スケール計算（原点は(0,0)中央固定）
    let scale = 10;
    if (coefA !== 0) {
        let p = -coefB / (2 * coefA); // 頂点X
        let q = f(p);                 // 頂点Y
        let maxY = Math.max(Math.abs(q), Math.abs(coefC), 10);
        let maxX = Math.max(Math.abs(p), 10);
        
        let scaleY = (oY * 0.7) / maxY;
        let scaleX = (oX * 0.7) / maxX;
        scale = Math.min(scaleX, scaleY);
        scale = Math.min(Math.max(scale, 0.5), 20); // スケール範囲制限
    }

    // 決定したスケールで背景の座標系を描画
    drawCoord(scale);

    // 仮想座標から実際の描画座標への変換関数
    let rx = function(x) {
        return (x * scale) + oX;
    };
    let ry = function(y) {
        return -1 * (y * scale) + oY;
    };

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "blue";

    let xLimit = oX / scale + 5; // 画面端＋少し外側まで計算
    let delta = 0.1;            // 描画の細かさ
    let speed = 0.6;            // 1フレームあたりの進む量（アニメーション速度）
    let currentX = -xLimit;
    let isPlotting = false;

    // アニメーションループ関数
    function animate() {
        let targetX = currentX + speed;

        // 1フレームの中で speed 分だけステップを進めて描画
        while (currentX <= targetX && currentX <= xLimit) {
            let y = f(currentX);
            let canvasY = ry(y);

            // 枠の上下外側まで滑らかに描画を継続
            if (canvasY >= -50 && canvasY <= CANVAS_H + 50) {
                ctx.beginPath();
                if (!isPlotting) {
                    ctx.moveTo(rx(currentX), ry(y));
                    isPlotting = true;
                } else {
                    let prevX = currentX - delta;
                    ctx.moveTo(rx(prevX), ry(f(prevX)));
                    ctx.lineTo(rx(currentX), ry(y));
                }
                ctx.stroke();
            } else {
                isPlotting = false;
            }

            currentX += delta;
        }

        // 端に達していなければ次のフレームを予約
        if (currentX <= xLimit) {
            animationFrameId = requestAnimationFrame(animate);
        } else {
            animationFrameId = null;
        }
    }

    // アニメーション開始
    animationFrameId = requestAnimationFrame(animate);
}

// ----------------------------------------
// 座標系描画
// ----------------------------------------
function drawCoord(scale) {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    let maxX = oX / scale;
    let step = calculateStepSize(maxX);

    // 1. グリッド線（緑の破線）
    ctx.lineWidth = 1;
    ctx.strokeStyle = "lightgreen";

    // X軸方向破線
    for (let x = step; x <= maxX; x += step) {
        let px1 = oX + x * scale;
        let px2 = oX - x * scale;

        ctx.beginPath(); ctx.setLineDash([4, 4]);
        ctx.moveTo(px1, 0); ctx.lineTo(px1, CANVAS_H); ctx.stroke();

        ctx.beginPath(); ctx.setLineDash([4, 4]);
        ctx.moveTo(px2, 0); ctx.lineTo(px2, CANVAS_H); ctx.stroke();
    }

    // Y軸方向破線
    let maxY = oY / scale;
    for (let y = step; y <= maxY; y += step) {
        let py1 = oY - y * scale;
        let py2 = oY + y * scale;

        ctx.beginPath(); ctx.setLineDash([4, 4]);
        ctx.moveTo(0, py1); ctx.lineTo(CANVAS_W, py1); ctx.stroke();

        ctx.beginPath(); ctx.setLineDash([4, 4]);
        ctx.moveTo(0, py2); ctx.lineTo(CANVAS_W, py2); ctx.stroke();
    }

    ctx.setLineDash([]); // 破線解除

    // 2. 座標軸 (黒線)
    ctx.lineWidth = 1;
    ctx.strokeStyle = "black";
    ctx.fillStyle = "black";

    // X軸
    ctx.beginPath(); ctx.moveTo(0, oY); ctx.lineTo(CANVAS_W, oY); ctx.stroke();
    // X軸矢印
    ctx.beginPath(); ctx.moveTo(CANVAS_W, oY); ctx.lineTo(CANVAS_W - 10, oY - 7); ctx.lineTo(CANVAS_W - 10, oY + 7); ctx.fill();

    // Y軸
    ctx.beginPath(); ctx.moveTo(oX, 0); ctx.lineTo(oX, CANVAS_H); ctx.stroke();
    // Y軸矢印
    ctx.beginPath(); ctx.moveTo(oX, 0); ctx.lineTo(oX - 7, 10); ctx.lineTo(oX + 7, 10); ctx.fill();

    // 3. ラベル・目盛り数字
    ctx.font = "12px 'Meiryo UI', sans-serif";
    ctx.textAlign = 'right';

    ctx.fillText('Ｏ', oX - 5, oY + 15, MAX_WIDTH);
    ctx.fillText('ｘ', CANVAS_W - 5, oY + 20, MAX_WIDTH);
    ctx.fillText('ｙ', oX - 20, 10, MAX_WIDTH);

    // X軸の目盛り数値
    for (let x = step; x <= maxX; x += step) {
        ctx.fillText(cleanNum(x), oX + (x * scale) + 5, oY + 15, MAX_WIDTH);
        ctx.fillText(cleanNum(-x), oX - (x * scale) + 5, oY + 15, MAX_WIDTH);
    }

    // Y軸の目盛り数値
    for (let y = step; y <= maxY; y += step) {
        ctx.fillText(cleanNum(y), oX - 10, oY - (y * scale) + 5, MAX_WIDTH);
        ctx.fillText(cleanNum(-y), oX - 10, oY + (y * scale) + 5, MAX_WIDTH);
    }
}

function cleanNum(num) {
    return parseFloat(num.toFixed(2));
}

function calculateStepSize(maxVal) {
    let rawStep = maxVal / 6;
    let magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    let residual = rawStep / magnitude;

    if (residual < 1.5) return 1 * magnitude;
    if (residual < 3.5) return 2 * magnitude;
    if (residual < 7.5) return 5 * magnitude;
    return 10 * magnitude;
}

function buildFormulaString(a, b, c) {
    let siki = "";
    if (a !== 0) {
        if (a === 1) siki += "x<sup>2</sup>";
        else if (a === -1) siki += "-x<sup>2</sup>";
        else siki += `${a}x<sup>2</sup>`;
    }
    if (b !== 0) {
        let sign = b > 0 ? (siki ? "+" : "") : "-";
        let absB = Math.abs(b);
        siki += `${sign}${absB === 1 ? "" : absB}x`;
    }
    if (c !== 0) {
        let sign = c > 0 ? (siki ? "+" : "") : "-";
        siki += `${sign}${Math.abs(c)}`;
    }
    if (!siki) siki = "0";
    return `y = ${siki}`;
}

