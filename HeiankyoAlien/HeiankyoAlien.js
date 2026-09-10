// unshift：配列の先頭に追加する
// shift：配列の先頭から除外する
// push：配列末尾に追加する
// pop：配列末尾から除外する

// setTimeout：指定時間経過後、一度だけ関数を実行します。
// setInterval：各実行の間は指定した間隔で、定期的に関数を実行します。
// requestAnimationFrame：ブラウザの描画のタイミングに合わせて指定したコールバック関数を実行します。

const IdSeparator = '#';
const Root = '../img/';
const ClearImageSrc = Root + 'clear.png';
const GameoverImageSrc = Root + 'gameover.png';
const RengaImageSrc = Root + 'renga.png';
const ZombiDogImageSrc = Root + 'zombie_dog.png';
const HoleImageSrc = Root + 'hole.png';
const PlayerRightImageSrc = Root + 'dog_right.png';
const PlayerLeftImageSrc = Root + 'dog_left.png';
const PlayerUpImageSrc = Root + 'dog_back.png';
const PlayerDownImageSrc = Root + 'dog_front.png';
const KeyShift = 'Shift';
const Direction = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'];
const HoleStyle = [
        'width: 10px; height: 10px; top: 40%; left: 40%',
        'width: 20px; height: 20px; top: 30%; left: 30%',
        'width: 30px; height: 30px; top: 20%; left: 20%',
        'width: 40px; height: 40px; top: 10%; left: 10%',
        'width: 50px; height: 50px; top: 0%; left: 0%'
    ];
const GetOutTime = 10;      // 穴から脱出時間
const ExtinctionTime = 15;  // 穴自然消滅時間
const ZombiMovingTimer = 500;   // ゾンビ移動間隔
const PlayerReductionTimer = 200;    // プレーヤー縮小間隔
const PlayerCount = 3;  // プレーヤー数

//0:空間
//1:壁
//2:穴
//3:ゾンビ
//4:プレーヤー
//5:ゾンビ＋穴
// ゾンビ＋穴　時は、ゾンビ画像＋穴画像の二つを表示してそれぞれを縮小させる
const Space = 0;
const RengaWall = 1;
const Hole = 2;
const Zombi = 3;
const Player = 4;
const ZombiHole = Zombi + Hole; // 5

// 初期化用ゼロ
const Zero = 0;

// ゾンビ移動用setInterval ID
let movingZombiId = null;

// 掘れる穴の最大個数
const HoleMax = 10;

// holeIdArray[1] = #1#13  heiankyoDataの座標値から合成できる
// holeSizeArray[1] = 4    最大サイズ
// holeExtinctionTimerArray[1] = 25 初期値でExtinctionTimeを設定、カウントダウンさせて、0になったら穴消滅
// zombiCatchedArray[1] = zonbi2   ゾンビ2が落ちている
// zombiCatchedTimerArray[1] = 15   初期値でGetOutTimeを設定、カウントダウンさせて、0になったら抜けだし

// 穴（10px,20px,30px,40px,50px）
// holeIdArray、holeSizeArray、holeExtinctionTimerArray、zombiCatchedArray、zombiCatchedTimerArrayの配列は、indexで対応している
// 最大10個（0は穴ではない、holeIdを保存、holeIdはheiankyoDataの座標値がIDとなる（例：#1#13））
let holeIdArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
// 穴サイズ（HoleStyleの引数（0～4）、最大4のときにゾンビを捕まえる）
let holeSizeArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
// 穴自然消滅タイマー
let holeExtinctionTimerArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

// 捕まえたゾンビ（0は捕まえていない、zombiIdを保存、例：zomib1～）
let zombiCatchedArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
// 捕まえたゾンビ抜けだしタイマー
let zombiCatchedTimerArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

// ゾンビ残数
let zombiCounter = 0;
// ゲーム開始時ゾンビ数
let zombiInitialvalue = 0;

// プレーヤーがどっち向きか
let playerDirection = Direction[1];     // 'ArrowRight'

// プレーヤー縮小表示用
let playerReduction = HoleStyle.length;
// プレーヤー縮小表示用setInterval ID
let playerReductionId = null;
// プレーヤー移動可否
let playerStop = false;

// 得点
let score = 0;

// プレーヤー数
let playerCounter = PlayerCount;

// 問題データ指定
let dataNumber = document.getElementById("dataNumber");

// 問題変更時のイベントリスナー
dataNumber.addEventListener("change", drawingTable);

// 問題番号
let dataNo;

// 迷路データの個数
let maxRow;
let maxCol;

// ズーム値
let zoom = 1.0;

// Webページのロードが完了した後に呼び出されるロードイベントを設定する
window.addEventListener("load", onLoad, false);

// キーが押されたときのリスナー
document.addEventListener('keydown', keyDown, false);

// 矢印キーアクション
function arrowAction(action){
    // プレーヤー操作不可の場合は何もしない
    if(playerStop) return;

    // 現在のプレーヤーを取得
    let player = document.getElementById('player');
    if(player != null){
        // 現在のプレーヤー位置を取得
        let pTd = player.parentNode;
        let colInx = pTd.cellIndex;
        let pTr = pTd.parentNode;
        let rowInx = pTr.rowIndex;
        let intTarget;
        let intRow;
        let intCol;

        if(action == 'ArrowRight' || action == 'ArrowLeft' || action == 'ArrowUp' || action == 'ArrowDown'){
            // プレーヤー移動処理
            [intRow, intCol, pTr, pTd] = rowcolPosition(action, rowInx, colInx, pTr, pTd);
            // プレーヤー再描画
            if( intRow != -1 && intCol != -1){
                intTarget = heiankyoData[intRow][intCol];
                if(intTarget == Space || intTarget == Zombi){
                    // プレーヤー画像削除
                    player.parentNode.removeChild(player);
                    // 現在のプレーヤー位置を空白にする
                    heiankyoData[rowInx][colInx] = Space;
                    // プレーヤー位置を進める
                    heiankyoData[intRow][intCol] = Player;
                    // プレーヤー再描画
                    let playerImg = document.createElement('img');
                    playerImg.setAttribute('id', 'player');
                    playerImg.setAttribute('class', 'playersg');
                    playerImg.src = actionImage(action);
                    pTd.appendChild(playerImg);
                    playerDirection = action;
                    if(intTarget == Zombi){
                        // 捕まったので、位置はゾンビにする
                        //alert('捕まった４');
                        // ゾンビ移動停止
                        if(movingZombiId != null) clearInterval(movingZombiId);
                        movingZombiId = null;
                        // プレーヤー移動不許可
                        playerStop = true;
                        // 捕まったゾンビ位置を保持
                        heiankyoData[intRow][intCol] = Zombi;
                        // プレーヤー縮小表示
                        if(playerReductionId != null) clearInterval(playerReductionId);
                        playerReductionId = setInterval(playerDead, PlayerReductionTimer);
                    }
                }
            }
        } else if(action == 'a' || action == 'A' || action == 's' || action == 'S'){
            // プレーヤー向き処理
            let playerRotation = Direction.indexOf(playerDirection);
            if(action == 'a' || action == 'A'){
                playerRotation = playerRotation + 1;
                if(playerRotation > 3) playerRotation = 0;
            }
            if(action == 's' || action == 'S'){
                playerRotation = playerRotation - 1;
                if(playerRotation < 0) playerRotation = 3;
            }
            // プレーヤー画像削除
            player.parentNode.removeChild(player);
            // プレーヤー再描画
            let playerImg = document.createElement('img');
            playerImg.setAttribute('id', 'player');
            playerImg.setAttribute('class', 'playersg');
            playerImg.src = actionImage(Direction[playerRotation]);
            pTd.appendChild(playerImg);
            playerDirection = Direction[playerRotation];
        } else if(action == 'x' || action == 'X'){
            // 穴数は10個まで、11個以上は掘らせない
            if(holeIdArray.length > HoleMax) return;
            //alert('穴掘り' + playerDirection);
            // 穴掘り処理
            let holeId;
            let pTdHole;
            [intRow, intCol, pTr, pTdHole] = rowcolPosition(playerDirection, rowInx, colInx, pTr, pTd);
            // 新規穴、継続穴処理
            if( intRow != -1 && intCol != -1){
                intTarget = heiankyoData[intRow][intCol];
                holeId = IdSeparator + intRow.toString() + IdSeparator + intCol.toString();
                if(intTarget == Space){
                    // 穴が掘れる
                    //alert('穴が掘れる！');
                    let newHole = false;
                    for(let i = 0; i < holeIdArray.length; i++){
                        if(holeIdArray[i] == Zero){
                            //holeId = IdSeparator + intRow.toString() + IdSeparator + intCol.toString();
                            holeIdArray[i] = holeId;
                            holeSizeArray[i] = Zero;
                            newHole = true;
                            //alert('穴が掘れる！穴自然消滅タイマー設定 holeIdArray=' + holeIdArray[i]  + '  holeId=' + holeId + '   holeSizeArray=' + holeSizeArray[i]);
                            holeExtinctionTimerArray[i] = ExtinctionTime;
                            break;
                        }
                    }
                    if(newHole){
                        heiankyoData[intRow][intCol] = Hole;
                        let holeImg = document.createElement('img');
                        holeImg.setAttribute('id', holeId);
                        holeImg.setAttribute('class', 'holesg');
                        holeImg.setAttribute('style', HoleStyle[0]);
                        holeImg.src = HoleImageSrc;
                        pTdHole.appendChild(holeImg);
                    }
                } else if(intTarget == Hole){
                    // 前の穴だけ掘る
                    //holeId = IdSeparator + intRow.toString() + IdSeparator + intCol.toString();
                    //alert('穴を掘り続ける！' + holeId);
                    for(let i = 0; i < holeIdArray.length; i++){
                        if(holeIdArray[i] == holeId){
                            let size = holeSizeArray[i];
                            if(size < 4){
                                size = size + 1;
                                holeSizeArray[i] = size;
                                let holeImg = document.getElementById(holeId);
                                holeImg.setAttribute('style', HoleStyle[size]);
                                //alert('穴を掘り続ける！' + holeId + '  size=' + size);
                            }
                            break;
                        }
                    }
                }
            }
        } else if(action == 'z' || action == 'Z'){
            //alert('穴埋め playerDirection=' + playerDirection);
            // 穴埋め処理
            let holeId;
            let pTdHole;
            [intRow, intCol, pTr, pTdHole] = rowcolPosition(playerDirection, rowInx, colInx, pTr, pTd);
            // 穴を埋め処理
            if( intRow != -1 && intCol != -1){
                intTarget = heiankyoData[intRow][intCol];
                holeId = IdSeparator + intRow.toString() + IdSeparator + intCol.toString();
                if(intTarget == ZombiHole){
                    // ゾンビ穴を埋める
                    for(let i = 0; i < holeIdArray.length; i++){
                        if(holeIdArray[i] == holeId){
                            let zombiId = zombiCatchedArray[i];
                            let size = holeSizeArray[i];
                            if(size > 0){
                                size = size - 1;
                                holeSizeArray[i] = size;
                                let holeImg = document.getElementById(holeId);
                                holeImg.setAttribute('style', HoleStyle[size]);
                                let zombi = document.getElementById(zombiId);
                                zombi.setAttribute('style', HoleStyle[size]);
                                //alert('ゾンビ穴を埋める holeId=' + holeId + '  size=' + size + '  zombiId=' + zombiId);
                            } else {
                                // 埋め終わった
                                //alert('ゾンビ穴の削除 holeId=' + holeId + '  size=' + size + '  zombiId=' + zombiId);
                                //穴画像の削除
                                let holeImg = document.getElementById(holeId);
                                holeImg.parentNode.removeChild(holeImg);
                                // ゾンビ画像削除
                                let zombi = document.getElementById(zombiId);
                                zombi.parentNode.removeChild(zombi);
                                // 得点
                                score = score + zombiCatchedTimerArray[i] * 10;
                                let scoreDisplay = document.getElementById('scoreText');
                                scoreDisplay.innerText = "　得点：" + score;
                                // ゾンビ犬減
                                zombiCounter = zombiCounter - 1;
                                let counter = document.getElementById('playerCountText');
                                counter.innerText = "守り犬数：" + playerCounter+ "　ゾンビ犬数：" + zombiCounter;
                                holeIdArray[i] = Zero;
                                holeSizeArray[i] = Zero;
                                holeExtinctionTimerArray[i] = Zero;
                                zombiCatchedArray[i] = Zero;
                                zombiCatchedTimerArray[i] = Zero;
                                heiankyoData[intRow][intCol] = Space;
                                if(zombiCounter <= 0){
                                    //alert('クリア');
                                    // ゾンビ移動停止
                                    if(movingZombiId != null) clearInterval(movingZombiId);
                                    movingZombiId = null;
                                    // プレーヤー移動不許可
                                    playerStop = true;
                                    let ci = document.getElementById('clearImage');
                                    ci.style.display = 'block';
                                    // 次のステージへ
                                    dataNumber.value = Number(dataNumber.value) + 1;
                                    // プレーヤー残数が0ならゲームを開始しない
                                    if(playerCounter > 0){
                                        drawingTable();
                                        if(movingZombiId != null) clearInterval(movingZombiId);
                                        movingZombiId = setInterval(movingZombi, ZombiMovingTimer);
                                    }
                                }
                            }
                            break;
                        }
                    }
                } else if(intTarget == Hole){
                    // 穴を埋める
                    for(let i = 0; i < holeIdArray.length; i++){
                        if(holeIdArray[i] == holeId){
                            let size = holeSizeArray[i];
                            if(size > 0){
                                size = size - 1;
                                holeSizeArray[i] = size;
                                let holeImg = document.getElementById(holeId);
                                holeImg.setAttribute('style', HoleStyle[size]);
                                //alert('穴を埋め続ける！ holeId=' + holeId + '  size=' + size);
                            } else {    // size = 0
                                holeIdArray[i] = Zero;
                                holeSizeArray[i] = Zero;
                                holeExtinctionTimerArray[i] = Zero;
                                heiankyoData[intRow][intCol] = Space;
                                //穴画像の削除
                                let holeImg = document.getElementById(holeId);
                                holeImg.parentNode.removeChild(holeImg);
                                //alert('穴の削除 holeId=' + holeId + '  size=' + size);
                            }
                            break;
                        }
                    }
                }
            }
        }
    }
}

// プレーヤーの画像向き
function actionImage(action){
    let src = "";
    if(action == 'ArrowRight') src = PlayerRightImageSrc;
    if(action == 'ArrowLeft') src = PlayerLeftImageSrc;
    if(action == 'ArrowUp') src = PlayerUpImageSrc;
    if(action == 'ArrowDown') src = PlayerDownImageSrc;
    return src;
}

// 捕まったときのプレーヤー縮小表示
function playerDead(){
    playerReduction = playerReduction - 1;
    //alert('捕まった０ playerReduction=' + playerReduction + '  HoleStyle[playerReduction]=' + HoleStyle[playerReduction]);
    let player = document.getElementById('player');
    player.setAttribute('style', HoleStyle[playerReduction]);
    if(playerReduction == 0){
        // プレーヤー縮小表示停止
        if(playerReductionId != null) clearInterval(playerReductionId);
        playerReductionId = null;
        // プレーヤー画像削除
        let player = document.getElementById('player');
        player.parentNode.removeChild(player);
        // プレーヤー数減
        playerCounter = playerCounter - 1;
        // 残プレーヤー数
        let counter = document.getElementById('playerCountText');
        counter.innerText = "守り犬数：" + playerCounter+ "　ゾンビ犬数：" + zombiCounter;
        if(playerCounter <= 0){
            // ゲームオーバー
            //alert('ゲームオーバー');
            let gi = document.getElementById('gameoverImage');
            gi.style.display = 'block';
            return;
        };
        //alert('捕まった２');
        // プレーヤー画像削除
        //let player = document.getElementById('player');
        //player.parentNode.removeChild(player);
        // 新しいプレーヤーをどこかに設定する
        // どこかの空白にプレーヤー配置
        let k = getRandomInt(1, spaceCounter());
        for(let i = 0; i < maxRow; i++){
            for(let j = 0; j < maxCol; j++){
                if(heiankyoData[i][j] == Space){
                    k = k - 1;
                    if(k == 0){
                        heiankyoData[i][j] = Player;
                        let idString = i.toString() + IdSeparator + j.toString();
                        let cell = document.getElementById(idString);
                        let playerImg = document.createElement('img');
                        playerImg.setAttribute('id', 'player');
                        playerImg.setAttribute('class', 'playersg');
                        playerImg.src = PlayerRightImageSrc;    // 右向き
                        cell.appendChild(playerImg);
                        // プレーヤーがどっち向きか
                        playerDirection = Direction[1];     // 'ArrowRight'
                        //alert('捕まった１');
                        // 再度ゾンビ移動処理開始
                        if(movingZombiId != null) clearInterval(movingZombiId);
                        movingZombiId = setInterval(movingZombi, ZombiMovingTimer);
                        // プレーヤー移動許可
                        playerStop = false;
                        playerReduction = HoleStyle.length;
                        return;
                    }
                }
            }
        }
        return;
    }
}

// 穴自然消滅、ゾンビ移動
function movingZombi(){
    // 穴自然消滅処理
    for(let i = 0; i < maxRow; i++){
        for(let j = 0; j < maxCol; j++){
            let holeId = IdSeparator + i.toString() + IdSeparator + j.toString();
            let holeIndex = holeIdArray.indexOf(holeId);
            if(holeIndex > -1){
                holeExtinctionTimerArray[holeIndex] = holeExtinctionTimerArray[holeIndex] - 1;
                if(holeExtinctionTimerArray[holeIndex] <= Zero){
                    //alert('穴自然消滅 holeId=' + holeId + '  holeIndex=' + holeIndex);
                    holeIdArray[holeIndex] = Zero;
                    holeSizeArray[holeIndex] = Zero;
                    holeExtinctionTimerArray[i] = Zero;
                    heiankyoData[i][j] = Space;
                    //穴画像の削除
                    let holeImg = document.getElementById(holeId);
                    holeImg.parentNode.removeChild(holeImg);
                }
            }
        }
    }
    // ゾンビ移動処理
    for(let k = 1; k <= zombiInitialvalue; k++){
        let zombiId = 'zombi' + k;
        let zombi = document.getElementById(zombiId);   // 無ければnullを返す

        //alert('ゾンビ移動 zombiId=' + zombiId);

        if(zombi != null){
            let pTd = zombi.parentNode;
            let colInx = pTd.cellIndex;
            let pTr = pTd.parentNode;
            let rowInx = pTr.rowIndex;
            let intTarget;
            let intRow;
            let intCol;

            // ゾンビが穴に落ちていたら動かさない
            let zombiIndex = zombiCatchedArray.indexOf(zombiId);
            if(zombiIndex > -1){
                //alert('ゾンビ動かさない' + '  zombiIndex=' + zombiIndex + '  zombiId=' + zombiId);
                // 制限時間で穴から抜け出す処理
                zombiCatchedTimerArray[zombiIndex] = zombiCatchedTimerArray[zombiIndex] - 1;
                if(zombiCatchedTimerArray[zombiIndex] <= Zero){
                    let holeId = IdSeparator + rowInx.toString() + IdSeparator + colInx.toString();
                    //alert('ゾンビ抜けだし！holeId=' + holeId + '  zombiIndex=' + zombiIndex + '  zombiId=' + zombiId);
                    holeIdArray[zombiIndex] = Zero;
                    holeSizeArray[zombiIndex] = Zero;
                    holeExtinctionTimerArray[zombiIndex] = Zero;
                    zombiCatchedArray[zombiIndex] = Zero;
                    zombiCatchedTimerArray[zombiIndex] = Zero;
                    heiankyoData[rowInx][colInx] = Zombi;
                    //穴画像の削除
                    let holeImg = document.getElementById(holeId);
                    holeImg.parentNode.removeChild(holeImg);
                    // ゾンビ大きさを元に戻す
                    //let zombi = document.getElementById(zombiId);
                    zombi.setAttribute('style', HoleStyle[4]);
                } else {
                    continue;
                }
            }

            // ゾンビ移動処理
            let action = whereZombi(zombi);     // 予め動ける方向を決める、動かない場合もあるけど。。。
            if(action == '') continue;  // 移動できないゾンビは飛ばす

            let holeId;
            let pTdZombi;
            [intRow, intCol, pTr, pTdZombi] = rowcolPosition(action, rowInx, colInx, pTr, pTd);
            // ゾンビの移動先がプレーヤー、穴
            if( intRow != -1 && intCol != -1){
                intTarget = heiankyoData[intRow][intCol];
                if(intTarget == Space || intTarget == Player || intTarget == Hole){
                    // 現在のゾンビ位置を空白にする
                    heiankyoData[rowInx][colInx] = Space;
                    // 移動後ゾンビ位置を保存
                    heiankyoData[intRow][intCol] = Zombi;
                    // ゾンビ画像削除
                    zombi.parentNode.removeChild(zombi);
                    // ゾンビ移動可能
                    //alert('ゾンビ移動可能' + action);
                    let zombiImg = document.createElement('img');
                    zombiImg.setAttribute('id', zombiId);
                    zombiImg.setAttribute('class', 'zombisg');
                    zombiImg.src = ZombiDogImageSrc;
                    pTdZombi.appendChild(zombiImg);
                    if(intTarget == Player){
                        //alert('捕まった');
                        // ゾンビ移動停止
                        if(movingZombiId != null) clearInterval(movingZombiId);
                        movingZombiId = null;
                        // プレーヤー移動不許可
                        playerStop = true;
                        // 捕まったゾンビ位置を保持
                        heiankyoData[intRow][intCol] = Zombi;
                        // プレーヤー縮小表示
                        if(playerReductionId != null) clearInterval(playerReductionId);
                        playerReductionId = setInterval(playerDead, PlayerReductionTimer);
                    } else if(intTarget == Hole){
                        //alert('穴！');
                        holeId = IdSeparator + intRow.toString() + IdSeparator + intCol.toString();
                        for(let i = 0; i < holeIdArray.length; i++){
                            if(holeIdArray[i] == holeId){
                                let size = holeSizeArray[i];
                                if(size < 4){
                                    //alert('穴を消す！holeId=' + holeId + '  i=' + i + '  zombiId=' + zombiId);
                                    holeIdArray[i] = Zero;
                                    holeSizeArray[i] = Zero;
                                    holeExtinctionTimerArray[i] = Zero;
                                    // 穴画像削除
                                    let holeImg = document.getElementById(holeId);
                                    holeImg.parentNode.removeChild(holeImg);
                                    break;
                                } else {
                                    //alert('穴に落ちたholeId=' + holeId + '  i=' + i + '  zombiId=' + zombiId);
                                    zombiCatchedArray[i] = zombiId;
                                    zombiCatchedTimerArray[i] = GetOutTime;
                                    heiankyoData[intRow][intCol] = ZombiHole;
                                }
                            }
                        }
                    }
                } else if(intTarget == ZombiHole){
                    //alert('ゾンビ穴！');
                    // ゾンビ救出
                    // ゾンビが進む方向にゾンビ穴があった場合には、穴を消滅させる
                    // 助けた（移動しようとしてる）ゾンビは進ませない
                    holeId = IdSeparator + intRow.toString() + IdSeparator + intCol.toString();
                    //alert('ゾンビ穴！holeId=' + holeId + '  zombiId=' + zombiId + '  holeIdArray=' + holeIdArray);
                    for(let i = 0; i < holeIdArray.length; i++){
                        if(holeIdArray[i] == holeId){
                            //alert('救出！穴を消す！ i=' + i + '  holeId=' + holeId　+ '  zombiId=' + zombiId);
                            holeIdArray[i] = Zero;
                            holeSizeArray[i] = Zero;
                            holeExtinctionTimerArray[i] = Zero;
                            zombiCatchedArray[i] = Zero;
                            zombiCatchedTimerArray[i] = Zero;
                            heiankyoData[intRow][intCol] = Zombi;
                            // 穴画像削除
                            let holeImg = document.getElementById(holeId);
                            holeImg.parentNode.removeChild(holeImg);
                            // ゾンビ大きさを元に戻す
                            zombi.setAttribute('style', HoleStyle[4]);
                        }
                    }
                }
            }
        }
    }
}

// 乱数（min～maxの整数）
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// ゾンビの移動先決定
function whereZombi(zombi){
    let pTd = zombi.parentNode;
    let colInx = pTd.cellIndex;
    let pTr = pTd.parentNode;
    let rowInx = pTr.rowIndex;

    //  自分の周りが、壁またはゾンビで囲まれていたら何もせず抜け出す
    while(true){
        // 右
        if(movingCheck(rowInx, colInx, 0, 1) == true) break;
        // 左
        if(movingCheck(rowInx, colInx, 0, -1) == true) break;
        // 上
        if(movingCheck(rowInx, colInx, -1, 0) == true) break;
        // 下
        if(movingCheck(rowInx, colInx, 1, 0) == true) break;
        // 移動できない状況
        //alert('移動できない！' + zombi);
        return '';
    }
    //let action = 'ArrowRight';
    //for(let i = 0; i<5; i++){
    let action = '';
    while(true){
        let intTarget;
        let intRow = -1;
        let intCol = -1;
        action = Direction[getRandomInt(0, 3)];
        if(action == 'ArrowRight'){
            intRow = rowInx;
            intCol = colInx + 1;
        }
        if(action == 'ArrowLeft'){
            intRow = rowInx;
            intCol = colInx - 1;
        };
        if(action == 'ArrowUp'){
            intRow = rowInx - 1;
            intCol = colInx;
        }
        if(action == 'ArrowDown'){
            intRow = rowInx + 1;
            intCol = colInx;
        }
        // ゾンビの移動先が空間、プレーヤー、穴、ゾンビ穴
        if( intRow != -1 && intCol != -1){
            intTarget = heiankyoData[intRow][intCol];
            if(intTarget == Space || intTarget == Player || intTarget == Hole || intTarget == ZombiHole){
                //return action;
                break;
            }
        }
    }
    return action;
}

// true:移動可能　false:移動不可
function movingCheck(rowInx, colInx, r, c){
    let intRow = rowInx + r;
    let intCol = colInx + c;
    let intTarget = heiankyoData[intRow][intCol];
    if(intTarget == Space || intTarget == Player || intTarget == Hole || intTarget == ZombiHole){
        return true;
    }
    return false;
}

// プレーヤー、ゾンビの移動先位置取得
// ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft']
function rowcolPosition(arrow, rowInx, colInx, pTr, pTd){
    let intRow = -1;
    let intCol = -1;
    //alert('rowcolPosition arrow=' + arrow + '  rowInx=' + rowInx + '  colInx=' + colInx);
    if(arrow == 'ArrowRight'){
        intRow = rowInx;
        intCol = colInx + 1;
        pTd = pTd.nextSibling;
    }
    if(arrow == 'ArrowLeft'){
        intRow = rowInx;
        intCol = colInx - 1;
        pTd = pTd.previousSibling;
    }
    if(arrow == 'ArrowUp'){
        intRow = rowInx - 1;
        intCol = colInx;
        pTr = pTr.previousSibling;
        pTd = pTr.firstChild;
        for(let i=0; i < colInx; i++){
            pTd = pTd.nextSibling;
        }
    }
    if(arrow == 'ArrowDown'){
        intRow = rowInx + 1;
        intCol = colInx;
        pTr = pTr.nextSibling;
        pTd = pTr.firstChild;
        for(let i=0; i < colInx; i++){
            pTd = pTd.nextSibling;
        }
    }
    //alert('rowcolPosition arrow=' + arrow + '  intRow=' + intRow + '  intCol=' + intCol + '  pTr=' +pTr + '   pTd='  + pTd);
    return [intRow, intCol, pTr, pTd];
}

// キーが押されたとき
function keyDown(event){
    let strArrow = event.key;
    //let boolShift = event.shiftKey;
/*
    let message
    message = " | type: " + event.type
    message += " | key: " + event.key
    message += " | code: " + event.code;
    message += " | shiftKey: " + event.shiftKey;
    message += " | ctrlKey: " + event.ctrlKey;
    message += " | altKey: " + event.altKey;
    message += " | metaKey: " + event.metaKey;
    let si = document.getElementById('title_line');
    si.insertAdjacentHTML("afterbegin", "<div>"+message+"</div>");
*/
    //if(boolShift == true){
    //    strArrow = KeyShift + strArrow;
    //}

    event.preventDefault();
    arrowAction(strArrow);
}

// ボタンアクション設定
function makeButtonAction(){
    // スタート
    let startButton = document.getElementById('start');
    startButton.addEventListener('click', function(event){
        // プレーヤー残数が0ならゲームを開始しない
        if(playerCounter > 0){
            drawingTable();
            if(movingZombiId != null) clearInterval(movingZombiId);
            movingZombiId = setInterval(movingZombi, ZombiMovingTimer);
        }
    });

    // やり直す
    let resetButton = document.getElementById('reset');
    resetButton.addEventListener('click', function(event){
        // プレーヤー残数が0ならゲームを開始しない
        if(playerCounter > 0){
            drawingTable();
            if(movingZombiId != null) clearInterval(movingZombiId);
            movingZombiId = setInterval(movingZombi, ZombiMovingTimer);
        }
    });

    // イベント取得用ボタンオブジェクト取得
    let leftButton = document.getElementById('lbtn');
    let upButton = document.getElementById('ubtn');
    let downButton = document.getElementById('dbtn');
    let rightButton = document.getElementById('rbtn');

    // 左
    leftButton.addEventListener('click', function(event){
        arrowAction('ArrowLeft');
    });
    // 上
    upButton.addEventListener('click', function(event){
        arrowAction('ArrowUp');
    });
    // 下
    downButton.addEventListener('click', function(event){
        arrowAction('ArrowDown');
    });
    // 右
    rightButton.addEventListener('click', function(event){
        arrowAction('ArrowRight');
    });

    let digButton = document.getElementById('dig');
    let buryButton = document.getElementById('bury');
    let turnrightButton = document.getElementById('turnright');
    let turnleftButton = document.getElementById('turnleft');

    // 掘る
    digButton.addEventListener('click', function(event){
        arrowAction('X');
    });
    // 埋める
    buryButton.addEventListener('click', function(event){
        arrowAction('Z');
    });
    // 向きを変える（右回り）
    turnrightButton.addEventListener('click', function(event){
        arrowAction('S');
    });
    // 向きを変える（左回り）
    turnleftButton.addEventListener('click', function(event){
        arrowAction('A');
    });

    // チェック
/*
    let checkButton = document.getElementById('check');
    checkButton.addEventListener('click', function(event){
        event.preventDefault();
        checkData();
    });
*/
}

// 平安京の動的作成
function makeTable(parentId){
    // 平安京の作成開始
    let rows=[];
    let table = document.createElement('table');
    table.setAttribute('id', 'heiankyo');

    // 平安京に2次元配列の要素を格納
    let k = 0;
    for(let i = 0; i < maxRow; i++){
        rows.push(table.insertRow(-1));
        for(let j = 0; j < maxCol; j++){
            let cell = rows[i].insertCell(-1);
            // 空間の設定
            let idString = i.toString() + IdSeparator + j.toString();
            cell.setAttribute('id', idString);
            cell.style.backgroundColor = 'lightgray';
            cell.setAttribute('class', 'psg');  //画像表示のため、すべてのセルに設定する

            let intTarget = heiankyoData[i][j];
            // レンガ壁
            if( intTarget == RengaWall){
                let wallImg = document.createElement('img');
                wallImg.setAttribute('class', 'wallsg');
                wallImg.src = RengaImageSrc;
                cell.appendChild(wallImg);
            }
            // ゾンビ
            if( intTarget == Zombi){
                k = k + 1;  // 1から始まる
                let zombiImg = document.createElement('img');
                zombiImg.setAttribute('id', 'zombi' + k.toString());
                zombiImg.setAttribute('class', 'zombisg');
                zombiImg.src = ZombiDogImageSrc;
                cell.appendChild(zombiImg);
                zombiCounter = k;     // ゾンビ残数
                zombiInitialvalue = zombiCounter;   // 開始時ゾンビ数
            }
            // プレーヤー
            if( intTarget == Player){
                let playerImg = document.createElement('img');
                playerImg.setAttribute('id', 'player');
                playerImg.setAttribute('class', 'playersg');
                playerImg.src = PlayerRightImageSrc;    // 右向き
                cell.appendChild(playerImg);
                // プレーヤーがどっち向きか
                playerDirection = Direction[1];     // 'ArrowRight'
            }
        }
    }
    // 指定したdiv要素に迷路を加える
    document.getElementById(parentId).appendChild(table);

    // 得点
    let scoreDisplay = document.getElementById('scoreText');
    scoreDisplay.innerText = "　得点：" + score ;
    // プレーヤー数
    let counter = document.getElementById('playerCountText');
    counter.innerText = "守り犬数：" + playerCounter+ "　ゾンビ犬数：" + zombiCounter;
}

// HTML読み込み後、自動実行
function onLoad(){
    // ビューポートの設定
    //UpdateViewport();

    // 問題選択肢作成
    for(let i = 2; i <= heiankyoDataArray.length; i++){
        let option = document.createElement("option");
        option.text = i;
        option.value = i;
        // selectタグの子要素にoptionタグを追加する
        dataNumber.appendChild(option);
    }

    // ボタンアクション設定
    makeButtonAction();

    // 迷路の動的作成
    //drawingTable();
    if(playerCounter > 0){
        drawingTable();
        if(movingZombiId != null) clearInterval(movingZombiId);
        movingZombiId = setInterval(movingZombi, ZombiMovingTimer);
    }
}

// 問題表示
function drawingTable(){
    // ゲームオーバーイメージエリア削除
    let parent = document.getElementById('gameoverImage');
    while(parent.firstChild){
      parent.removeChild(parent.firstChild);
    }

    // クリアメージエリア削除
    parent = document.getElementById('clearImage');
    while(parent.firstChild){
      parent.removeChild(parent.firstChild);
    }

    // 描画エリア削除
    parent = document.getElementById('mainScreen');
    while(parent.firstChild){
      parent.removeChild(parent.firstChild);
    }

    // 初期化
    resetData();

    // 問題設定
    dataNo = parseFloat (dataNumber.value);
    //heiankyoData = heiankyoData[dataNo - 1];   //これだとheiankyoDataを書き換えると元のデータも書き換わるよ～ディープコピーが必要だ！
    heiankyoData = JSON.parse(JSON.stringify(heiankyoDataArray[dataNo - 1]));
    maxRow = heiankyoData.length;
    maxCol = heiankyoData[0].length;

    //alert('空白の数=' + spaceCounter());

    // 表示サイズの計算
    zoomCalc();

    // 問題の動的作成
    makeTable('mainScreen');

}

// 空間の数
function spaceCounter(){
    let count = 0;
    for(let i = 0; i < maxRow; i++){
        for(let j = 0; j < maxCol; j++){
            if(heiankyoData[i][j] == Space) count = count + 1;
        }
    }
    return count;
}

// 初期化
function resetData(){
    // 得点は全体での得点
    //score = 0;

    // プレーヤー数は全体で3名
    //playerCounter = PlayerCount;

    // ゾンビ移動停止
    if(movingZombiId != null) clearInterval(movingZombiId);
    movingZombiId = null;

    // ゾンビ残数
    zombiCounter = 0;

    // プレーヤーがどっち向きか(画像設定と同じ個所で設定することにした)
    //playerDirection = Direction[1];     // 'ArrowRight'

    // プレーヤー縮小表示停止
    if(playerReductionId != null) clearInterval(playerReductionId);
    playerReductionId = null;
    playerReduction = HoleStyle.length;
    playerStop = false;

    // 穴関連初期化
    holeIdArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    holeSizeArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    holeExtinctionTimerArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    zombiCatchedArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    zombiCatchedTimerArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    // ゲームオーバー画像非表示
    let gi = document.getElementById('gameoverImage');
    gi.style.display = 'none';

    // クリア画像非表示
    let ci = document.getElementById('clearImage');
    ci.style.display = 'none';

    // ボタンの有効化
    let startButton = document.getElementById('start');
    startButton.disabled = false;
}

// 表示倍率計算
function zoomCalc(){
    let cellhaba = 50;
    // 表示サイズの計算
    let mainScreen = document.getElementById('mainScreen');
    let bw = window.innerWidth;
    let bh = window.innerHeight - 200;          //200は表題やボタンなどの縦幅による
    let gridw = (heiankyoData[0].length + 1) * cellhaba;
    let gridh = (heiankyoData.length + 1) * cellhaba;

    // 表示倍率計算
    for(let i = 2; i > 0; i = i - 0.01){
      if( gridw * i < bw && gridh * i < bh){
        zoom = i;
        break;
      }
    }
    if(zoom < 0 || zoom > 1) zoom = 1.0;
    zoom = zoom * 0.9;
    mainScreen.style.transformOrigin = 'top left';
    mainScreen.style.transform ='scale(' + zoom.toString() + ',' + zoom.toString() + ')';
    //alert("bw=" + bw + "  gridw=" + gridw * zoom + "  bh=" + bh + " gridh=" + gridh * zoom + " zoom=" + zoom);
    let subTable = document.getElementById('sub_table');
    let a = (zoom - 1) * 10 * 42;
    subTable.style = 'margin-top: ' + a.toString() + 'px';

    // ゲームオーバーイメージ
    let gameoverImageDiv = document.getElementById('gameoverImage');
    gameoverImageDiv.style.display = 'none';
    let gimg = document.createElement('img');
    gimg.setAttribute('id', 'goimage');
    gimg.src = GameoverImageSrc;
    //gimg.style.height = (gridh * zoom * 0.5).toString() + 'px'
    gimg.style.width = (gridw * zoom * 0.5).toString() + 'px';
    gameoverImageDiv.appendChild(gimg);

    // クリアイメージ
    let clearImageDiv = document.getElementById('clearImage');
    clearImageDiv.style.display = 'none';
    let cimg = document.createElement('img');
    cimg.setAttribute('id', 'cimage');
    cimg.src = ClearImageSrc;
    //cimg.style.height = (gridh * zoom * 0.5).toString() + 'px'
    cimg.style.width = (gridw * zoom * 0.5).toString() + 'px';
    clearImageDiv.appendChild(cimg);
}

// ビューポートの設定
function UpdateViewport() {
    let str_viewport;
    let str_ua = navigator.userAgent.toLowerCase();
    if (str_ua.indexOf('iphone') >= 0 || str_ua.indexOf('ipad') >= 0 || str_ua.indexOf('android') >= 0 && str_ua.indexOf('mobile') >= 0) {
        str_viewport = "width=475px";
    } else {
        str_viewport = "width=device-width";
    }
    document.querySelector("meta[name='viewport']").setAttribute("content", str_viewport);
}

// 平安京エイリアンマップデータ表示(デバッグ用)
function checkData(){
    let si = document.getElementById('checkmap');
    while(si.firstChild){
        si.removeChild(si.firstChild);
    }
    for(let i = maxRow - 1; i >= 0; i--){
        si.insertAdjacentHTML("afterbegin", "<div>" + heiankyoData[i] + "</div>");
    }
    // 穴の画像が残り、データは穴が無いとしている現象
    // heiankyoDataから穴、ゾンビ、プレーヤーの位置を確認し
    // 再表示、それ以外は画像を削除する
    // holeIdArray[1] = #1#13  heiankyoDataの座標値から合成できる
    // holeSizeArray[1] = 4    最大サイズ
    // holeExtinctionTimerArray[1] = 25 初期値でExtinctionTimeを設定、カウントダウンさせて、0になったら穴消滅
    // zombiCatchedArray[1] = zonbi2   ゾンビ2が落ちている
    // zombiCatchedTimerArray[1] = 15   初期値でGetOutTimeを設定、カウントダウンさせて、0になったら抜けだし

    // 穴（10px,20px,30px,40px,50px）
    // holeIdArray、holeSizeArray、holeExtinctionTimerArray、zombiCatchedArray、zombiCatchedTimerArrayの配列は、indexで対応している
    // 最大10個（0は穴ではない、holeIdを保存、holeIdはheiankyoDataの座標値がIDとなる（例：#1#13））
    // let holeIdArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    // 穴サイズ（HoleStyleの引数（0～4）、最大4のときにゾンビを捕まえる）
    // let holeSizeArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    // 穴自然消滅タイマー
    // let holeExtinctionTimerArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    // 捕まえたゾンビ（0は捕まえていない、zombiIdを保存、例：zomib1～）
    // let zombiCatchedArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    // 捕まえたゾンビ抜けだしタイマー
    // let zombiCatchedTimerArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    si.insertAdjacentHTML("beforeend", "<div>" + holeIdArray + "</div>");
    si.insertAdjacentHTML("beforeend", "<div>" + holeSizeArray + "</div>");
    si.insertAdjacentHTML("beforeend", "<div>" + holeExtinctionTimerArray + "</div>");
    si.insertAdjacentHTML("beforeend", "<div>" + zombiCatchedArray + "</div>");
    si.insertAdjacentHTML("beforeend", "<div>" + zombiCatchedTimerArray + "</div>");


//0:空間
//1:壁
//2:穴
//3:ゾンビ
//4:プレーヤー
//5:ゾンビ穴
/*
1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
1,0,0,0,0,3,0,0,0,0,3,0,0,0,0,0,1
1,0,1,0,0,4,1,0,0,0,1,0,0,0,1,0,1
1,0,0,0,0,0,0,0,1,1,1,1,0,1,1,0,1
1,0,0,0,1,0,1,0,0,0,1,0,0,1,1,0,1
1,0,0,0,0,0,1,0,1,0,1,0,3,0,1,0,1
1,0,0,3,1,0,1,0,3,0,0,0,0,0,0,0,1
1,0,1,0,1,0,0,0,0,0,1,1,1,1,0,0,1
1,0,1,0,0,0,1,1,1,0,0,0,0,0,0,1,1
1,3,1,0,1,0,0,0,0,0,0,1,0,1,0,0,1
1,0,0,0,0,0,1,1,0,1,1,1,0,1,1,0,1
1,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,1
1,0,1,0,1,1,1,0,1,1,0,1,1,1,1,0,1
1,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,1
1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
0,0,0,0,0,0,0,0,0,0
0,0,0,0,0,0,0,0,0,0
0,0,0,0,0,0,0,0,0,0
0,0,0,0,0,0,0,0,0,0
0,0,0,0,0,0,0,0,0,0
*/
}
