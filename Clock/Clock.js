// Webページのロードが完了した後に呼び出されるロードイベント
window.addEventListener("load", onLoad, false);

// グローバル変数
let canvas, ctx, oX, oY;
let show_hour, show_minute, show_second;

const CANVAS_W = 640;
const CANVAS_H = 640;
const jikoku = ['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ','Ⅶ','Ⅷ','Ⅸ','Ⅹ','Ⅺ','Ⅻ'];

function onLoad() {
    // DOM要素の取得
    show_hour = document.getElementById("show_hour");
    show_minute = document.getElementById("show_minute");
    show_second = document.getElementById("show_second");

    // 座標系の初期化
    drawCoord();

    // アニメーションループ開始
    render();
}

function drawCoord() {
    canvas = document.getElementById("coordCanvas");
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    oX = CANVAS_W / 2;
    oY = CANVAS_H / 2;
    ctx = canvas.getContext("2d");
}

// 描画メインループ
function render() {
    let now = new Date();

    // デジタル時計の更新
    updateDigitalClock(now);

    // アナログ時計の描画
    drawClock(now);

    // 次のフレーム描画を予約
    requestAnimationFrame(render);
}

// デジタル時計の更新
function updateDigitalClock(now) {
    let hour = now.getHours();
    let minute = now.getMinutes();
    let second = now.getSeconds();

    show_hour.textContent = String(hour).padStart(2, "0");
    show_minute.textContent = String(minute).padStart(2, "0");
    show_second.textContent = String(second).padStart(2, "0");
}

// アナログ時計の描画
function drawClock(now) {
    // 時計領域クリア
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // 1. 時計盤のベース背景（塗りつぶし円）
    ctx.beginPath();
    ctx.arc(oX, oY, CANVAS_W * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#333333";
    ctx.stroke();

    // 2. 目盛りの描画
    let memoriPos = (CANVAS_W / 2) * 0.86;

    // 1分ごとの細い目盛り
    ctx.lineWidth = 2.0;
    ctx.strokeStyle = "#666666";
    for (let i = 0; i < 60; i++) {
        let radian = (i * Math.PI) / 30;
        let sx = oX + memoriPos * Math.sin(radian);
        let sy = oY - memoriPos * Math.cos(radian);
        let ex = oX + (memoriPos - 10) * Math.sin(radian);
        let ey = oY - (memoriPos - 10) * Math.cos(radian);

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
    }

    // 5分（1時間）ごとの太い目盛り
    ctx.lineWidth = 5.0;
    ctx.strokeStyle = "#000000";
    for (let i = 0; i < 12; i++) {
        let radian = (i * Math.PI) / 6;
        let sx = oX + memoriPos * Math.sin(radian);
        let sy = oY - memoriPos * Math.cos(radian);
        let ex = oX + (memoriPos - 18) * Math.sin(radian);
        let ey = oY - (memoriPos - 18) * Math.cos(radian);

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
    }

    // 3. 時刻（ローマ数字）の描画
    ctx.font = "36px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#000000";

    let jikokuPos = (CANVAS_W / 2) * 0.72;
    for (let i = 0; i < 12; i++) {
        let radian = (i * Math.PI) / 6;
        let x = oX + jikokuPos * Math.sin(radian);
        let y = oY - jikokuPos * Math.cos(radian);

        let text = jikoku[i === 0 ? 11 : i - 1];
        ctx.fillText(text, x, y);
    }

    // 4. 角度計算
    let hour = now.getHours();
    let minute = now.getMinutes();
    let second = now.getSeconds();
    let millisecond = now.getMilliseconds();

    let hourAngle = -90 + hour * 30 + (minute * 30) / 60 + (30 / 3600) * second;
    let minuteAngle = -90 + minute * 6 + (6 / 60) * second;
    let secondAngle = -90 + (second + millisecond / 1000) * 6;

    // 5. 針の描画（プログラムでラインを描画）
    drawHands(hourAngle, minuteAngle, secondAngle);
}

// 針のプログラム描画
function drawHands(hourAngle, minuteAngle, secondAngle) {
    // --- 短針 (Hour Hand) ---
    ctx.save();
    ctx.translate(oX, oY);
    ctx.rotate((hourAngle * Math.PI) / 180);
    ctx.beginPath();
    ctx.moveTo(-15, 0);  // 針の後ろ側（少し突き出す）
    ctx.lineTo(CANVAS_W * 0.22, 0); // 先端
    ctx.lineWidth = 10;
    ctx.strokeStyle = "#333333";
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();

    // --- 長針 (Minute Hand) ---
    ctx.save();
    ctx.translate(oX, oY);
    ctx.rotate((minuteAngle * Math.PI) / 180);
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.lineTo(CANVAS_W * 0.35, 0);
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#333333";
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();

    // --- 秒針 (Second Hand) ---
    ctx.save();
    ctx.translate(oX, oY);
    ctx.rotate((secondAngle * Math.PI) / 180);
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.lineTo(CANVAS_W * 0.38, 0);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#d9534f"; // 赤色
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();

    // --- 中央の軸キャップ ---
    ctx.beginPath();
    ctx.arc(oX, oY, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#d9534f";
    ctx.fill();
}

