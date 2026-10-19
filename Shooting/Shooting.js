// キャンバス
const canvas = document.getElementById('mainScreen');
const ctx = canvas.getContext('2d');
const player = { x: canvas.width / 2, y: canvas.height - 30 };  // プレイヤー（砲台）の座標
const speedCoeff = 1.5;     // 敵スピード係数
const bulletSpeed = 10;     // 弾丸スピード
//const colorName = [
//  'yellowgreen', 'plum', 'yellow', 'aqua', 'pink', 'lightskyblue', 
//  'orange', 'springgreen', 'purple', 'peru', 'mistyrose', 'magenta',
//  'sandybrown', 'cadetblue', 'chartreuse', 'orangered', 'olive', 'firebrick', 
//  'indigo', 'crimson', 'mediumseagreen', 'lime', 'steelblue', 'deeppink', 
//  'khaki', 'darkviolet', 'darkgreen', 'navy', 'maroon', 'slategray'
//];
const colorName = [
    'yellowgreen', 'plum', 'yellow', 'aqua', 'pink', 'lightskyblue', 
    'orange', 'springgreen', 'purple', 'peru', 'mistyrose', 'magenta', 
    'sandybrown', 'cadetblue', 'chartreuse', 'orangered', 'olive', 'firebrick', 
    'gold', 'crimson', 'mediumseagreen', 'lime', 'steelblue', 'deeppink', 
    'khaki', 'darkviolet', 'lawngreen', 'cyan', 'fuchsia', 'slategray'
];
const spawnInterval = 2000;    // 2秒
const difficultynterval = 30000;    // 30秒
const highScoreKey = 'numberShooter_highScore';

// タイマーやアニメーションIDを管理する変数
let spawnIntervalId = null;
let difficultyIntervalId = null;
let animFrameId = null;

// 霧機能用の変数
let isFog = false;
let fogTimerId = null;
let fogDurationId = null;

//　スコア
let score = 0;

// ハイスコア
let highScore = 0;

// ゲームオバーフラグ
let gameOver = false;

// 敵（数字）の配列
let enemies = [];
// 弾の配列
let bullets = [];
// パーティクル（破片）の配列
let particles = [];

// 難易度
let diffSpeed = 0;  // 個々のスピードを30秒ごとに早める
let diffInterval = 0;   // 敵の発生間隔を短くする

// Webページのロードが完了した後に呼び出されるロードイベントを設定する
window.addEventListener("load", onLoad, false);

// キー操作イベントリスナー
window.addEventListener('keydown', handleKeyDown);

// ロードイベント関数
function onLoad(){
    // 表示倍率
    //zoomCalc();

    // ボタンアクション設定
    makeButtonAction();
    setupTouchKeyboard();

    // 初期化
    init();
}

// ボタンアクション設定
function makeButtonAction(){
    // やり直す
    let retryButton = document.getElementById('retry');
    retryButton.addEventListener('click', function(event){
        init();
    });
    // ハイスコアリセット
    let highscoreButton = document.getElementById('resetHighScoreBtn');
    highscoreButton.addEventListener('click', function(event){
    if (confirm('ハイスコアをリセットしますか？')) {
            resetHighScore();
        }
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

// テンキー用のイベント登録関数を追加
function setupTouchKeyboard() {
    const keys = document.querySelectorAll('.num-key');
    keys.forEach(key => {
        // pointerdownを使うことで、clickより早いレスポンスを実現
        key.addEventListener('pointerdown', function(event) {
            event.preventDefault(); // ダブルタップズームなどを防止
            if (gameOver) return;
            
            const pressedNum = parseInt(key.getAttribute('data-key'), 10);
            const target = findLowestTarget(pressedNum);
            if (target) {
                spawnBullet(target);
            }
        });
    });
}

// 乱数（min～maxの整数）
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// 初期化
function init(){
    // 進行中のタイマー・ループを一旦すべて停止する（重複防止）
    if (spawnIntervalId) clearInterval(spawnIntervalId);
    if (difficultyIntervalId) clearInterval(difficultyIntervalId);
    if (animFrameId) cancelAnimationFrame(animFrameId);
    if (fogTimerId) clearTimeout(fogTimerId);
    if (fogDurationId) clearTimeout(fogDurationId);

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

    // 難易度設定
    diffSpeed = 0;
    diffInterval = 0;

    // ハイスコア
    highScore = localStorage.getItem(highScoreKey) || 0;

    // 敵の発生タイマー
    spawnIntervalId = setInterval(spawnEnemy, spawnInterval);    // 2秒ごと
    difficultyIntervalId = setInterval(difficultySet, difficultynterval);   // 30秒ごと

    // 霧の発生スケジュールを開始
    scheduleFog();

    // メインループを開始
    mainLoop();
}

// 霧の発生スケジュールを管理する関数
function scheduleFog() {
    // 次の霧発生までの時間（15秒〜30秒の間でランダム）
    const nextFogTime = getRandomInt(15000, 30000);

    fogTimerId = setTimeout(function() {
        if (gameOver) return;

        isFog = true; // 霧発生

        // 10秒後に霧を消す
        fogDurationId = setTimeout(function() {
            isFog = false; // 霧終了
            scheduleFog(); // 次の霧を再予約
        }, 10000);

    }, nextFogTime);
}

// 30秒ごと難易度変更
function difficultySet() {
    diffSpeed += 0.2;   // 個々のスピードをに早める
    diffInterval += 100;    // 敵の発生間隔を短くする
    
    // 敵の発生間隔が短くなりすぎないよう下限を設ける
    const currentInterval = Math.max(500, spawnInterval - diffInterval);

    // 敵の発生タイマーのみを再設定
    if (spawnIntervalId) clearInterval(spawnIntervalId);
    spawnIntervalId = setInterval(spawnEnemy, currentInterval);
}

// 敵の発生
function spawnEnemy() {
    if (gameOver) return;

    const fontSize = 24 * getRandomInt(1, 4);
    enemies.push({
        // 文字幅を考慮して画面端に寄りすぎないように調整
        x: Math.random() * (canvas.width - fontSize) + fontSize / 2,
        y: 0,
        value: getRandomInt(0, 9),
        speed: (1 + diffSpeed) + Math.random() * speedCoeff,
        color: colorName[getRandomInt(0, 29)],
        fontSize: fontSize,
        angle: Math.random() * Math.PI * 2, // 初期角度（ランダム）
        rotationSpeed: (Math.random() - 0.5) * getRandomInt(1, 9) / 10  // 回転速度（正負ランダム） 0.1～0.9大きくると早く回転
    });
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
                // 爆発エフェクト（破片）を生成
                createParticles(b.targetEnemy.x, b.targetEnemy.y, b.targetEnemy.color, b.targetEnemy.value);
                enemies.splice(enemyIdx, 1);
                let baseScore = 100;    // 基本点
                let heightBonus = Math.floor((canvas.height - b.targetEnemy.y) / 10);   // 高さボーナス
                score += baseScore + heightBonus;
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

    // 敵（数字）描画
    ctx.save(); // 現在の描画状態を保存
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    //if (isFog) ctx.filter = 'blur(3.5px)'; // 数字が大きいほど極太に滲んで見分けがつかなくなる(safariでは滲まない)

    for (const enemy of enemies) {
        //ctx.font = 'bold ' + enemy.fontSize.toString() + 'px monospace';
        ctx.font = `bold ${enemy.fontSize}px monospace`;
        ctx.fillStyle = enemy.color;

        // 回転描画の手順
        ctx.save(); // 1敵ごとの状態を保存
        // 座標系の中心を敵の中心 (x, y) に移動
        ctx.translate(enemy.x, enemy.y);
        // 座標系を enemy.angle だけ回転
        ctx.rotate(enemy.angle);
        // 霧の場合
        //if (isFog) {
        //    ctx.globalAlpha = 0.4;
        //    ctx.fillText(enemy.value, -3, -3);
        //    ctx.fillText(enemy.value, 3, 3);
        //    ctx.fillText(enemy.value, -3, 3);
        //    ctx.globalAlpha = 1.0;
        //}
        // 霧（FOG）の時は位置を微妙にずらして重なり描画（残像・手ぶれ効果）
        if (isFog) {
            // 滲み・ブレ描画
            ctx.globalAlpha = 0.35; // 残像を少し薄くして重ねる
            // 上下左右・斜めに大きくオフセットをかけて複数描画
            const spread = 6; // オフセット量（広がり具合）
            // ランダムな揺れを加えて毎フレーム滲み方を変える
            const rx = (Math.random() - 0.5) * 3;
            const ry = (Math.random() - 0.5) * 3;
            ctx.fillText(enemy.value, -spread + rx, -spread + ry);
            ctx.fillText(enemy.value,  spread + rx, -spread + ry);
            ctx.fillText(enemy.value, -spread + rx,  spread + ry);
            ctx.fillText(enemy.value,  spread + rx,  spread + ry);
            ctx.fillText(enemy.value, -spread * 1.2, 0);
            ctx.fillText(enemy.value,  spread * 1.2, 0);
            ctx.globalAlpha = 1.0; // アルファ値をリセット
        }
        // 描画（すでに中心にいるので、座標は (0, 0)）
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

    // 霧の描画処理
    if (isFog) {
        ctx.save();
        // 画面全体に薄いグレーの半透明膜を重ねる
        ctx.fillStyle = 'rgba(200, 200, 200, 0.65)'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // 画面全体に白いランダムドット（ノイズ）を散りばめる
        //ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        //for (let i = 0; i < 150; i++) {
        //    const rx = Math.random() * canvas.width;
        //    const ry = Math.random() * canvas.height;
        //    ctx.fillRect(rx, ry, 3, 3);
        //}
        // 警告メッセージ表示
        ctx.fillStyle = '#ff3333';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('WARNING: FOG!', canvas.width / 2, 30);
        ctx.restore();

    }

    // スコア描画
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText(`SCORE: ${score}`, 10, 25);    // スコア
    ctx.fillText(`HIGH SCORE: ${highScore}`, 10, 50);   // ハイスコア
    //ctx.fillText(`diffSpeed: ${diffSpeed}`, 10, 75);
    //ctx.fillText(`diffInterval: ${diffInterval}`, 10, 100);

    // ハイスコアとゲームオーバー表示
    if (gameOver) {
        // ハイスコア
        if (score > highScore) {
            highScore = score;
            localStorage.setItem(highScoreKey, highScore);
        }
        // ゲームオーバー
        ctx.fillStyle = '#ff0000';
        ctx.font = '36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        return;
    }

    // 次のフレームを呼び出し（IDを保持）
    animFrameId = requestAnimationFrame(mainLoop);
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

// ハイスコア消去関数
function resetHighScore() {
    localStorage.removeItem(highScoreKey); // ストレージから削除
    highScore = 0; // 変数も初期化
    alert('ハイスコアをリセットしました！');
}

// 表示倍率計算
function zoomCalc(){
    // 表示サイズの計算
    let mainScreen = document.getElementById('mainScreen');
    let bw = window.innerWidth;
    let bh = window.innerHeight - 100;
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

