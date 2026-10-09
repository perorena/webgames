// キャンバス
const canvas = document.getElementById('mainScreen');
const ctx = canvas.getContext('2d');
// プレイヤー（砲台）の座標
const player = { x: canvas.width / 2, y: canvas.height - 30 };
const speedCoeff = 1.5;
const bulletSpeed = 10;
const colorName = ['yellowgreen', 'plum', 'yellow', 'aqua', 'pink', 'lightskyblue', 'orange', 'springgreen', 'purple', 'peru', 'mistyrose',
'magenta', 'sandybrown', 'cadetblue', 'chartreuse', 'orangered', 'olive', 'firebrick', 'indigo', 'dimgray', 'mediumseagreen',
'lime', 'steelblue', 'deeppink', 'khaki', 'darkviolet', 'darkgreen', 'navy', 'maroon', 'slategray'];

// タイマーやアニメーションIDを管理する変数
let spawnIntervalId = null;
let animFrameId = null;

let score = 0;
let gameOver = false;

// 敵（数字）の配列
let enemies = [];
// 弾の配列
let bullets = [];
// パーティクル（破片）の配列
let particles = [];

// Webページのロードが完了した後に呼び出されるロードイベントを設定する
window.addEventListener("load", onLoad, false);

// イベントリスナー登録（アロー関数を使わない）
window.addEventListener('keydown', handleKeyDown);

// ロードイベント関数
function onLoad(){
    //表示倍率
    //zoomCalc();

    //ボタンアクション設定
    makeButtonAction();
    setupTouchKeyboard();

    // 初期化
    init();
}

// ボタンアクション設定
function makeButtonAction(){
    // やり直す
    let resetButton = document.getElementById('reset');
    resetButton.addEventListener('click', function(event){
        init();
  });
}

// テンキー用のイベント登録関数を追加
function setupTouchKeyboard() {
    const keys = document.querySelectorAll('.num-key');
    keys.forEach(key => {
        // pointerdownを使うことで、clickより早いレスポンスを実現
        key.addEventListener('pointerdown', (e) => {
            e.preventDefault(); // ダブルタップズームなどを防止
            if (gameOver) return;
            
            const pressedNum = parseInt(key.getAttribute('data-key'), 10);
            const target = findLowestTarget(pressedNum);
            if (target) {
                spawnBullet(target);
            }
        });
    });
}

// 初期化
function init(){
    // 進行中のタイマー・ループを一旦すべて停止する（重複防止）
    if (spawnIntervalId) clearInterval(spawnIntervalId);
    if (animFrameId) cancelAnimationFrame(animFrameId);

    // 描画設定のリセット（文字位置を左揃えに戻す）
    ctx.textAlign = 'left';
    //ctx.textBaseline = 'alphabetic';

    // キャンバス描画クリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // データクリア
    score = 0;
    gameOver = false;
    enemies = [];
    bullets = [];

    // タイマーおよびメインループを開始
    spawnIntervalId = setInterval(spawnEnemy, 2000);
    mainLoop();
}

function spawnEnemy() {
    if (gameOver) return;

    const fontSize = 24 * getRandomInt(1, 4);
    enemies.push({
        // 文字幅を考慮して画面端に寄りすぎないように調整
        x: Math.random() * (canvas.width - fontSize) + fontSize / 2,
        y: 0,
        value: getRandomInt(0, 9),
        speed: 1 + Math.random() * speedCoeff,
        color: colorName[getRandomInt(0, 29)],
        fontSize: fontSize,
        angle: Math.random() * Math.PI * 2, // 初期角度（ランダム）
        //rotationSpeed: (Math.random() - 0.5) * 0.1 // 回転速度（正負ランダムでゆっくり） 0.1を大きくると早く回転
        rotationSpeed: (Math.random() - 0.5) * getRandomInt(1, 9) / 10
    });
}

// キーボードイベントハンドラー
function handleKeyDown(e) {
    if (gameOver) return;

    if (e.key >= '0' && e.key <= '9') {
        const pressedNum = parseInt(e.key, 10);
        const target = findLowestTarget(pressedNum);

        if (target) {
            spawnBullet(target);
        }
    }
}

// 乱数（min～maxの整数）
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// 押された数字に対応する最も下の敵を探す関数
function findLowestTarget(pressedNum) {
    let target = null;
    let maxY = -1;

    for (const enemy of enemies) {
        if (enemy.value === pressedNum && enemy.y > maxY) {
          maxY = enemy.y;
          target = enemy;
        }
    }

    return target;
}

// ターゲットに向けて未来位置（偏差）を計算して弾を生成する関数
function spawnBullet(target) {
    // 縦方向（Y）の移動スピードを bulletSpeed で一定にする
    const vy = bulletSpeed; 
    
    // 縦方向の接近速度（弾の縦速度 + 敵の下降速度）
    const closingSpeed = vy + target.speed;
    
    // 砲台から敵までの現在のY方向距離
    const currentDy = Math.abs(player.y - target.y);
    
    // 正確な着弾までの時間（フレーム数）
    const t = currentDy / closingSpeed;

    // 着弾時点での敵の未来のY座標
    const predictedY = target.y + (target.speed * t);

    bullets.push({
        x: player.x,
        y: player.y,
        targetX: target.x,
        targetY: predictedY,    // 計算した未来の座標を目指す
        targetEnemy: target,
        vy: vy // Y方向の固定速度
    });
}

// ゲームのメインループ
function mainLoop() {
    if (gameOver) return;

    // 敵の移動・判定
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.y += enemy.speed;   // スピード
        enemy.angle += enemy.rotationSpeed; // 角度
        // 画面一番下まで到達したらゲームオーバー
        if (enemy.y >= canvas.height - 20) {
            gameOver = true;
        }
    }

    // 弾の移動・着弾判定
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        
        const dx = b.targetX - b.x;
        const dy = b.targetY - b.y; // 目的地までの残りY距離（負の値）
        
        // 目的地（Y座標）に到達したか判定
        if (Math.abs(dy) <= b.vy) {
            // 着弾時：敵を配列から削除しスコア加算
            const enemyIdx = enemies.indexOf(b.targetEnemy);
            if (enemyIdx !== -1) {
                // [追加] 爆発エフェクト（破片）を生成
                // （敵の色をそのまま使いたい場合は、RGB管理が必要ですが、ここでは白で代用）
                //createParticles(b.targetEnemy.x, b.targetEnemy.y, '255, 255, 255', b.targetEnemy.value);
                createParticles(b.targetEnemy.x, b.targetEnemy.y, b.targetEnemy.color, b.targetEnemy.value);

                enemies.splice(enemyIdx, 1);
                score += 100;
            }
            bullets.splice(i, 1);
        } else {
            // Y方向は常に一定速度 b.vy で上に進む
            b.y -= b.vy;
            // X方向は Yが進む割合と同じ比率（相似）で進めることで、まっすぐ目標へ向かう
            b.x += (dx / Math.abs(dy)) * b.vy;
        }
    }

    // パーティクルの移動・フェードアウト判定
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; // X移動
        p.y += p.vy; // Y移動
        p.opacity -= 0.03; // フェードアウト（毎フレーム透明度を下げる）

        // 完全に透明になったら削除
        if (p.opacity <= 0) {
            particles.splice(i, 1);
        }
    }

    // すべての描画を削除
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 砲台描画
    ctx.fillStyle = '#0f0';
    ctx.fillRect(player.x - 15, player.y, 30, 20);

    // 敵（数字）描画getRandomInt
    //ctx.fillStyle = '#f00';
    //ctx.font = 'bold 24px monospace';
    //ctx.font = 'bold ' + (24 * getRandomInt(1,4)).toString() + 'px monospace';
    ctx.save(); // 現在の描画状態を保存
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const enemy of enemies) {
        //ctx.font = 'bold ' + enemy.fontSize.toString() + 'px monospace';
        ctx.font = `bold ${enemy.fontSize}px monospace`;
        ctx.fillStyle = enemy.color;

        // --- [回転描画の手順] ---
        ctx.save(); // 1敵ごとの状態を保存
        // 1. 座標系の中心を敵の中心 (x, y) に移動
        ctx.translate(enemy.x, enemy.y);
        // 2. 座標系を enemy.angle だけ回転
        ctx.rotate(enemy.angle);
        // 3. 描画（すでに中心にいるので、座標は (0, 0)）
        ctx.fillText(enemy.value, 0, 0);
        ctx.restore(); // 1敵ごとの状態を元に戻す（translate/rotateのリセット）

        //ctx.fillText(enemy.value, enemy.x, enemy.y);
    }
    ctx.restore(); // 保存した描画状態に戻す（textAlignが元の状態に戻る）

    // パーティクル（破片）を描画
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const p of particles) {
        // 小さな文字として描画（透明度を反映）
        ctx.font = `${p.fontSize}px monospace`;
        ctx.fillStyle = `rgba(${p.colorRgb}, ${p.opacity})`; 
        ctx.fillText(p.value, p.x, p.y);
    }
    ctx.restore();

    // 弾描画
    ctx.fillStyle = '#fff';
    for (const b of bullets) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // スコア描画
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText(`SCORE: ${score}`, 10, 25);

    // ゲームオーバー表示
    if (gameOver) {
        ctx.fillStyle = '#ff0000';
        ctx.font = '36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        return;
    }

    // 次のフレームを呼び出し（IDを保持）
    animFrameId = requestAnimationFrame(mainLoop);
}

// [追加] 数字の破片（パーティクル）を生成する関数
function createParticles(x, y, colorRgb, value) {
    const particleCount = 10; // 生成する破片の数

    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2; // ランダムな方向
        const speed = 1 + Math.random() * 4; // ランダムな速度
        const fontSize = 8 + Math.random() * 10; // ランダムなフォントサイズ（小さめ）

        particles.push({
            x: x, // 数字の中心座標
            y: y,
            vx: Math.cos(angle) * speed, // X方向の速度
            vy: Math.sin(angle) * speed, // Y方向の速度
            opacity: 1, // 初期透明度
            colorRgb: colorRgb, // 数字の色（RGB形式文字列）
            value: value, // 数字そのもの（文字として描画）
            fontSize: fontSize // フォントサイズ
        });
    }
}

// 数字の破片（パーティクル）を生成する関数
function createParticles(x, y, colorStr, value) {
    const particleCount = 10;
    const colorRgb = colorToRgb(colorStr); // 数字の色を RGB 文字列に変換

    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 4;
        const fontSize = 8 + Math.random() * 10;

        particles.push({
            x: x, // 数字の中心座標
            y: y,
            vx: Math.cos(angle) * speed, // X方向の速度
            vy: Math.sin(angle) * speed, // Y方向の速度
            opacity: 1, // 初期透明度
            colorRgb: colorRgb, // 数字の色（RGB形式文字列）
            value: value, // 数字そのもの（文字として描画）
            fontSize: fontSize // フォントサイズ
        });
    }
}

// カラー名（またはHEX）を "r, g, b" の文字列に変換する関数
function colorToRgb(colorStr) {
    const helperCtx = document.createElement('canvas').getContext('2d');
    helperCtx.fillStyle = colorStr;
    const hex = helperCtx.fillStyle; // Canvasが自動的に #rrggbb 形式に変換してくれる
    
    // #rrggbb から 10進数 RGB に変換
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
}

// 表示倍率計算
function zoomCalc(){
    // 表示サイズの計算
    let mainScreen = document.getElementById('mainScreen');
    let bw = window.innerWidth;
    let bh = window.innerHeight - 210;
    let gridw = 750;
    let gridh = 800;

    // 表示倍率計算
    for(let i = 2; i > 0; i = i - 0.01){
      if( gridw * i < bw && gridh * i < bh){
        zoom = i;
        break;
      }
    }
    //alert("bw=" + bw + "  gridw=" + gridw * zoom + "  bh=" + bh + " gridh=" + gridh * zoom + " zoom=" + zoom);
    if(zoom < 0 || zoom > 1) zoom = 1.0;

    mainScreen.style.transformOrigin = 'top left';
    mainScreen.style.transform ='scale(' + zoom.toString() + ',' + zoom.toString() + ')';
}

