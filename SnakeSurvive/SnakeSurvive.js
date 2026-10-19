// ==========================================
// キャンバス・ゲーム基本設定
// ==========================================
const canvas = document.getElementById('mainScreen');
const ctx = canvas.getContext('2d');
const GRID_SIZE = 15;                        // 1マスのサイズ（15px：26x26マス構成）
const TILE_COUNT = canvas.width / GRID_SIZE; // 405 / 15 = 27マス
const LOOP_INTERVAL = 200;                  // メインループの間隔（ms）
const GOAL_INTERVAL = 5000;                 // ゴール移動の間隔（ms）
const HIGH_SCORE_KEY = 'snakeSurvive_highScore';

// タイマーID
let loopIntervalId = null;
let goalIntervalId = null;

// ゲーム状態フラグ
let isGameOver = false;

// ステージ数
let stage = 1;

// プレイヤー
let player = [];
let playerDir = null;

// 敵の配列
let enemies = [];

// 千切れた胴体（障害物）
let obstacles = [];

// ゴール地点
let goal = null;

// スコア・ハイスコア
let score = 0;
let highScore = 0;

// 撃破演出用の変数
let killMessageText = "";      // 表示するメッセージ
let killMessageTimer = 0;      // 表示用タイマー（フレーム数）

// ランダムで表示されるメッセージリスト
const killMessages = [
    "撃破！ 見事なり！",
    "ナイス！ 素晴らしい攻撃！",
    "敵蛇、沈黙！",
    "やったぜ！ ボーナス獲得！",
    "スーパープレイ！",
    "一撃必殺！"
];

// ==========================================
// イベントリスナーと初期化
// ==========================================
// Webページのロード完了時に初期化
window.addEventListener("load", onLoad, false);

// キーボード操作リスナー
window.addEventListener('keydown', handleKeyDown);

// ロードイベント関数
function onLoad() {
    makeButtonAction();
    setupTouchKeyboard();
    
    // ゲーム全体の初回起動（ステージ1からスタート）
    stage = 1;
    score = 0;
    init();
}

// ボタン設定
function makeButtonAction() {
    // やり直す
    let retryButton = document.getElementById('retry');
    if (retryButton) {
        retryButton.addEventListener('click', function(event) {
            stage = 1;
            score = 0;
            init();
        });
    }
    // ハイスコアリセット
    let highscoreButton = document.getElementById('resetHighScoreBtn');
    highscoreButton.addEventListener('click', function(event){
    if (confirm('ハイスコアをリセットしますか？')) {
            resetHighScore();
        }
    });
}

// キーボード操作処理
function handleKeyDown(e) {
    if (isGameOver) return;

    // 180度反対方向への折返し入力を防止
    if (e.key === 'ArrowUp' && playerDir.y === 0) playerDir = { x: 0, y: -1 };
    if (e.key === 'ArrowDown' && playerDir.y === 0) playerDir = { x: 0, y: 1 };
    if (e.key === 'ArrowLeft' && playerDir.x === 0) playerDir = { x: -1, y: 0 };
    if (e.key === 'ArrowRight' && playerDir.x === 0) playerDir = { x: 1, y: 0 };
}

// スマホ用タッチ操作キーボード設定
function setupTouchKeyboard() {
    const keys = document.querySelectorAll('.arrow-key');
    keys.forEach(key => {
        key.addEventListener('pointerdown', function(event) {
            event.preventDefault();
            if (isGameOver) return;

            const dataKey = key.getAttribute('data-key');
            if (dataKey === 'ArrowUp' && playerDir.y === 0) playerDir = { x: 0, y: -1 };
            if (dataKey === 'ArrowDown' && playerDir.y === 0) playerDir = { x: 0, y: 1 };
            if (dataKey === 'ArrowLeft' && playerDir.x === 0) playerDir = { x: -1, y: 0 };
            if (dataKey === 'ArrowRight' && playerDir.x === 0) playerDir = { x: 1, y: 0 };
        });
    });
}

// ハイスコア消去関数
function resetHighScore() {
    localStorage.removeItem(HIGH_SCORE_KEY); // ストレージから削除
    highScore = 0; // 変数も初期化
    alert('ハイスコアをリセットしました！');
}

// ==========================================
// ゲーム制御関数（初期化・生成・ループ）
// ==========================================
// ゲーム初期化（ステージ開始時）
function init() {
    stopTimers();
    isGameOver = false;

    // ローカルストレージからハイスコア取得
    highScore = localStorage.getItem(HIGH_SCORE_KEY) || 0;

    // 撃破メッセージリセット
    killMessageText = "";
    killMessageTimer = 0;

    // プレイヤーの初期設定
    player = [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
        { x: 3, y: 5 },
        { x: 2, y: 5 },
        { x: 1, y: 5 }
    ];
    playerDir = { x: 1, y: 0 };

    // 障害物の初期化
    obstacles = [];

    // ステージ数に応じた数の敵を生成（安全距離判定付き）
    enemies = generateEnemies(2 + stage);

    // ゴール初期位置（右下付近）
    goal = { x: TILE_COUNT - 3, y: TILE_COUNT - 3 };

    // タイマーセット
    goalIntervalId = setInterval(goalMove, GOAL_INTERVAL);
    loopIntervalId = setInterval(mainLoop, LOOP_INTERVAL);

    draw();
}

// ステージに応じた敵を動的生成する関数（プレイヤー・敵同士・障害物から離れた位置に生成）
function generateEnemies(count) {
    const newEnemies = [];
    const pHead = player[0] || { x: 5, y: 5 };
    const SAFE_DIST_PLAYER = 8; // プレイヤーの頭から離す最小距離（マス）
    const SAFE_DIST_ENEMY = 6;  // 敵同士の頭から離す最小距離（マス）

    for (let i = 0; i < count; i++) {
        let rx, ry;
        let isSafe = false;
        let attempts = 0;

        while (!isSafe && attempts < 100) {
            attempts++;
            
            rx = getRandomInt(4, TILE_COUNT - 2);
            ry = getRandomInt(1, TILE_COUNT - 2);

            // 1. プレイヤーとの距離チェック
            const distToPlayer = Math.abs(rx - pHead.x) + Math.abs(ry - pHead.y);
            if (distToPlayer < SAFE_DIST_PLAYER) continue;

            // 2. 既に生成済みの「他の敵」との距離チェック
            let tooCloseToOtherEnemy = false;
            for (let existingEnemy of newEnemies) {
                const eHead = existingEnemy.body[0];
                const distToEnemy = Math.abs(rx - eHead.x) + Math.abs(ry - eHead.y);
                if (distToEnemy < SAFE_DIST_ENEMY) {
                    tooCloseToOtherEnemy = true;
                    break;
                }
            }
            if (tooCloseToOtherEnemy) continue;

            // 3. 障害物と被っていないかチェック
            let overlapObstacle = false;
            for (let obs of obstacles) {
                if (Math.abs(rx - obs.x) + Math.abs(ry - obs.y) < 2) {
                    overlapObstacle = true;
                    break;
                }
            }
            if (overlapObstacle) continue;

            isSafe = true;
        }

        newEnemies.push({
            body: [
                { x: rx, y: ry },
                { x: rx - 1, y: ry },
                { x: rx - 2, y: ry },
                { x: rx - 3, y: ry },
                { x: rx - 4, y: ry }
            ],
            dir: { x: -1, y: 0 },
            speedInterval: getRandomInt(1, 3), // 1:等速, 2:半分の速さ, 3:1/3の速さ
            moveCounter: 0
        });
    }

    return newEnemies;
}

// タイマー停止関数
function stopTimers() {
    if (loopIntervalId) clearInterval(loopIntervalId);
    if (goalIntervalId) clearInterval(goalIntervalId);
    loopIntervalId = null;
    goalIntervalId = null;
}

// ゴールランダム移動（四隅付近へ）
function goalMove() {
    const margin = 2; // 端からの余白（マス数）
    const minPos = margin; // 2マス目
    const maxPos = TILE_COUNT - margin - 1; // 27 - 2 - 1 = 24マス目（画面内に完全に入る）

    const locations = [
        { x: maxPos, y: maxPos }, // 右下 (24, 24)
        { x: minPos, y: maxPos }, // 左下 (2, 24)
        { x: minPos, y: minPos }, // 左上 (2, 2)
        { x: maxPos, y: minPos }  // 右上 (24, 2)
    ];
    let flag = getRandomInt(0, 3);
    goal = locations[flag];
}

// 乱数生成関数
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// メインゲームループ
function mainLoop() {
    if (isGameOver) return;

    // プレイヤーの移動
    moveSnake(player, playerDir);

    // 敵の移動処理（スピード判定付き）
    enemies.forEach(enemy => {
        if (enemy.body.length === 0) return;

        enemy.moveCounter++;

        if (enemy.moveCounter >= enemy.speedInterval) {
            enemy.moveCounter = 0;

            let newDir;
            let flag = Math.random();
            if (flag < 0.4) {
                newDir = homingSnake(enemy);  // 追尾
            } else if (flag < 0.9) {
                newDir = randomSnake(enemy);  // ランダム
            } else {
                return; // 1回休み
            }

            if (newDir.x !== -enemy.dir.x || newDir.y !== -enemy.dir.y) {
                enemy.dir = newDir;
            }

            enemy.dir = getSafeEnemyDir(enemy);

            moveSnake(enemy.body, enemy.dir);
        }
    });

    // 当たり判定
    checkCollisions();

    // 描画
    draw();
}

// ==========================================
// 移動AI・思考ロジック
// ==========================================
// 敵が自分の体や障害物に突っ込まないよう安全な方向を探す関数
function getSafeEnemyDir(enemy) {
    if (enemy.body.length === 0) return enemy.dir;

    const head = enemy.body[0];
    const dirs = [
        { x: 0, y: -1 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
        { x: 1, y: 0 }
    ];

    function getNextPos(currentHead, d) {
        let nx = currentHead.x + d.x;
        let ny = currentHead.y + d.y;
        if (nx < 0) nx = TILE_COUNT - 1;
        if (nx >= TILE_COUNT) nx = 0;
        if (ny < 0) ny = TILE_COUNT - 1;
        if (ny >= TILE_COUNT) ny = 0;
        return { x: nx, y: ny };
    }

    function isBlockAt(pos) {
        for (let i = 1; i < enemy.body.length; i++) {
            if (enemy.body[i].x === pos.x && enemy.body[i].y === pos.y) return true;
        }
        for (let obs of obstacles) {
            if (obs.x === pos.x && obs.y === pos.y) return true;
        }
        return false;
    }

    const currentNextPos = getNextPos(head, enemy.dir);
    if (!isBlockAt(currentNextPos)) {
        return enemy.dir;
    }

    for (let d of dirs) {
        if (d.x === -enemy.dir.x && d.y === -enemy.dir.y) continue;
        const candidatePos = getNextPos(head, d);
        if (!isBlockAt(candidatePos)) {
            return d;
        }
    }

    return enemy.dir;
}

// 蛇の移動処理
function moveSnake(snakeArray, dir) {
    if (snakeArray.length === 0) return;
    let newX = snakeArray[0].x + dir.x;
    let newY = snakeArray[0].y + dir.y;

    // 画面端ループ
    if (newX < 0) newX = TILE_COUNT - 1;
    if (newX >= TILE_COUNT) newX = 0;
    if (newY < 0) newY = TILE_COUNT - 1;
    if (newY >= TILE_COUNT) newY = 0;

    const head = { x: newX, y: newY };
    snakeArray.unshift(head);
    snakeArray.pop();
}

// 追尾型AI
function homingSnake(enemy) {
    if (enemy.body.length === 0) return enemy.dir;
    const head = enemy.body[0];
    const target = player[0];

    let dx = Math.sign(target.x - head.x);
    let dy = Math.sign(target.y - head.y);

    if (dx !== 0 && Math.random() < 0.5) {
        return { x: dx, y: 0 };
    } else if (dy !== 0) {
        return { x: 0, y: dy };
    }
    return enemy.dir;
}

// ランダム型AI
function randomSnake(enemy) {
    const dirs = [
        { x: 0, y: -1 }, { x: 0, y: 1 },
        { x: -1, y: 0 }, { x: 1, y: 0 }
    ];
    if (Math.random() < 0.3) {
        return dirs[Math.floor(Math.random() * dirs.length)];
    }
    return enemy.dir;
}

// 撃破メッセージ発動関数
function triggerKillMessage(msgText) {
    killMessageText = msgText || killMessages[Math.floor(Math.random() * killMessages.length)];
    killMessageTimer = 6; // 約1.2秒間表示
}

// ==========================================
// 当たり判定処理
// ==========================================
// [0:頭] - [1:首/胴体先頭] - [2:中央] - [3:尻尾手前] - [4:尻尾先端]
function checkCollisions() {
    const pHead = player[0];

    // ゴール判定（ステージクリア処理）
    if (pHead.x === goal.x && pHead.y === goal.y) {
        stopTimers();
        isGameOver = true;

        if (score > highScore) {
            highScore = score;
            localStorage.setItem(HIGH_SCORE_KEY, highScore);
        }

        stage++;
        setTimeout(() => {
            alert(`STAGE ${stage - 1} CLEAR！\n次のステージ（敵: ${2 + stage}匹）へ進みます！`);
            init();
        }, 10);
        return;
    }

    // プレイヤーの自滅判定
    for (let i = 1; i < player.length; i++) {
        if (pHead.x === player[i].x && pHead.y === player[i].y) {
            triggerGameOver("GAME OVER（自分の体に衝突！）");
            return;
        }
    }

    // 障害物への激突判定
    for (let obs of obstacles) {
        if (pHead.x === obs.x && pHead.y === obs.y) {
            triggerGameOver("GAME OVER（障害物に激突！）");
            return;
        }
    }

    // プレイヤー vs 敵 の判定処理
    for (let enemyIndex = enemies.length - 1; enemyIndex >= 0; enemyIndex--) {
        const enemy = enemies[enemyIndex];
        if (enemy.body.length === 0) continue;
        const eHead = enemy.body[0];

        // 頭同士の衝突判定
        if (pHead.x === eHead.x && pHead.y === eHead.y) {
            if (playerDir.x === -enemy.dir.x && playerDir.y === -enemy.dir.y) {
                triggerGameOver("GAME OVER（敵の頭と正面衝突！）");
                return;
            } else {
                // 敵撃退
                obstacles.push(...enemy.body);
                enemies.splice(enemyIndex, 1);
                score += player.length * 20;
                triggerKillMessage();
                continue; 
            }
        }

        // プレイヤーが敵を噛んだ（胴体攻撃判定）
        let bittenEnemyBody = false;
        for (let i = 1; i < enemy.body.length; i++) {
            if (pHead.x === enemy.body[i].x && pHead.y === enemy.body[i].y) {
                const cut = enemy.body.splice(i);
                obstacles.push(...cut);
                score += player.length * cut.length * 10;
                bittenEnemyBody = true;
                break;
            }
        }

        if (bittenEnemyBody) continue;

        // プレイヤーが敵に嚙まれた
        for (let i = 1; i < player.length; i++) {
            if (eHead.x === player[i].x && eHead.y === player[i].y) {
                const cut = player.splice(i);
                obstacles.push(...cut);
                score -= enemy.body.length * cut.length * 10;
                break;
            }
        }
    }

    // 敵が全滅したかの判定
    if (enemies.length === 0) {
        if (!goal) {
            goal = { x: TILE_COUNT - 3, y: TILE_COUNT - 3 };
        }
    }

    // 敵 vs 敵 の判定処理
    for (let a = enemies.length - 1; a >= 0; a--) {
        if (enemies[a].body.length === 0) continue;
        const headA = enemies[a].body[0];

        for (let b = enemies.length - 1; b >= 0; b--) {
            if (a === b || enemies[b].body.length === 0) continue;
            const headB = enemies[b].body[0];
            // 共食い
            if (headA.x === headB.x && headA.y === headB.y) {
                if (!(enemies[a].dir.x === -enemies[b].dir.x && enemies[a].dir.y === -enemies[b].dir.y)) {
                    obstacles.push(...enemies[b].body);
                    enemies.splice(b, 1);
                    if (b < a) a--;
                    triggerKillMessage("敵同士が共食い！");
                    break;
                }
            }
            // 敵同士の食い千切り
            for (let j = 1; j < enemies[b].body.length; j++) {
                if (headA.x === enemies[b].body[j].x && headA.y === enemies[b].body[j].y) {
                    const cut = enemies[b].body.splice(j);
                    obstacles.push(...cut);
                    break;
                }
            }
        }
    }
}

// ゲームオーバー処理
function triggerGameOver(message) {
    stopTimers();
    isGameOver = true;
    setTimeout(() => alert(message), 10);
}

// ==========================================
// 描画処理
// ==========================================
function draw() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 情報UI描画
    ctx.fillStyle = '#fff';
    ctx.font = '13px sans-serif';
    ctx.fillText(`STAGE: ${stage}`, 10, 18);
    ctx.fillText(`SCORE: ${score}`, 10, 36);
    ctx.fillText(`HIGH SCORE: ${highScore}`, 10, 54);

    ctx.fillText(`ENEMIES: ${enemies.length}`, canvas.width - 100, 18);

    // ゴール（緑）
    if (goal) {
        ctx.fillStyle = '#00ff66';
        ctx.fillRect(goal.x * GRID_SIZE, goal.y * GRID_SIZE, GRID_SIZE - 1, GRID_SIZE - 1);
    }

    // 千切れた障害物（灰色）
    ctx.fillStyle = '#777777';
    obstacles.forEach(obs => {
        ctx.fillRect(obs.x * GRID_SIZE, obs.y * GRID_SIZE, GRID_SIZE - 1, GRID_SIZE - 1);
    });

    // プレイヤー（青）
    player.forEach((segment, index) => {
        ctx.fillStyle = (index === 0) ? '#00ccff' : '#0055aa';
        ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE - 1, GRID_SIZE - 1);

        // プレイヤーの目の描画（15px用にスケール微調整）
        if (index === 0) {
            ctx.fillStyle = '#000000';
            const gx = segment.x * GRID_SIZE;
            const gy = segment.y * GRID_SIZE;
            const eyeSize = 2; // 15pxグリッド用に2px

            if (playerDir.x === 1) {        // 右
                ctx.fillRect(gx + 10, gy + 3, eyeSize, eyeSize);
                ctx.fillRect(gx + 10, gy + 9, eyeSize, eyeSize);
            } else if (playerDir.x === -1) { // 左
                ctx.fillRect(gx + 3, gy + 3, eyeSize, eyeSize);
                ctx.fillRect(gx + 3, gy + 9, eyeSize, eyeSize);
            } else if (playerDir.y === -1) { // 上
                ctx.fillRect(gx + 3, gy + 3, eyeSize, eyeSize);
                ctx.fillRect(gx + 9, gy + 3, eyeSize, eyeSize);
            } else if (playerDir.y === 1) {  // 下
                ctx.fillRect(gx + 3, gy + 9, eyeSize, eyeSize);
                ctx.fillRect(gx + 9, gy + 9, eyeSize, eyeSize);
            }
        }
    });

    // 敵たち（赤）
    enemies.forEach(enemy => {
        enemy.body.forEach((segment, index) => {
            if (index === 0) {
                if (enemy.body.length === 1 && Math.floor(Date.now() / 200) % 2 === 0) {
                    ctx.fillStyle = '#ff9999';
                } else {
                    ctx.fillStyle = '#ff3333';
                }
                
                ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE - 1, GRID_SIZE - 1);

                // 敵の目の描画
                ctx.fillStyle = '#000000';
                const gx = segment.x * GRID_SIZE;
                const gy = segment.y * GRID_SIZE;
                const eyeSize = 2;

                if (enemy.dir.x === 1) {        // 右
                    ctx.fillRect(gx + 10, gy + 3, eyeSize, eyeSize);
                    ctx.fillRect(gx + 10, gy + 9, eyeSize, eyeSize);
                } else if (enemy.dir.x === -1) { // 左
                    ctx.fillRect(gx + 3, gy + 3, eyeSize, eyeSize);
                    ctx.fillRect(gx + 3, gy + 9, eyeSize, eyeSize);
                } else if (enemy.dir.y === -1) { // 上
                    ctx.fillRect(gx + 3, gy + 3, eyeSize, eyeSize);
                    ctx.fillRect(gx + 9, gy + 3, eyeSize, eyeSize);
                } else if (enemy.dir.y === 1) {  // 下
                    ctx.fillRect(gx + 3, gy + 9, eyeSize, eyeSize);
                    ctx.fillRect(gx + 9, gy + 9, eyeSize, eyeSize);
                }
            } else {
                ctx.fillStyle = '#aa0000';
                ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE - 1, GRID_SIZE - 1);
            }
        });
    });

    // 撃破メッセージ表示
    if (killMessageTimer > 0) {
        ctx.save();
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillText(killMessageText, canvas.width / 2 + 2, canvas.height / 2 + 2);

        ctx.fillStyle = '#ffff00';
        ctx.fillText(killMessageText, canvas.width / 2, canvas.height / 2);

        ctx.restore();
        killMessageTimer--;
    }
}


