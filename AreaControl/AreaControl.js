const OuterThickness = 3;
const InnerThickness = 1;
const NumberMojiSize = '50';
const MessageMojiSize = '25';
const IdSeparator = '#';

// 色の設定
const colorRed = 'red';
const colorBlack = 'black';
const colorWhite = 'white';
const colorName = ['yellowgreen', 'plum', 'yellow', 'aqua', 'pink', 'lightskyblue', 'orange', 'springgreen', 'magenta', 'peru', 'mistyrose',
'steelblue', 'sandybrown', 'cadetblue', 'chartreuse', 'orangered', 'navy', 'firebrick', 'indigo', 'dimgray', 'mediumseagreen',
'olive', 'lime', 'deeppink', 'khaki', 'darkviolet', 'darkgreen', 'maroon', 'purple', 'slategray'];
const PlayId = [1,2,3,4,5,6,7,8,9];   // index 0：プレーヤー　index 1以降：敵
const CellColor = [0,1,2,3,4,5,6,7,8];    // colorNmaeのindexを指定、順番にPlayIdに対応

// 指定したミリ秒だけ待機する関数
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


// 領地数
let score = [1,1,1,1,1,1,1,1,1];

// 総プレーヤー数
let MaxPlayer = 0;

// アクティブプレーヤー
let activePlayer = 0;   // indexが保存される 0：プレーヤー　index 1以降：敵

// 陣地にできるセルIDリスト
let cellslist = [];

// プレイヤー操作可能フラグとゲーム世代管理
let canClick = true;
let gameGeneration = 0;

// 敵移動性格
let enemyPersonality = [];  // index 0：プレーヤー　index 1以降：敵

// 問題データ指定
let dataNumber = document.getElementById("dataNumber");

// 問題変更時のイベントリスナー
dataNumber.addEventListener("change", drawingTable);

// 問題番号
let dataNo;

// データ個数
let maxRow;   //行数
let maxCol;   //列数

// ズーム値
let zoom = 1.0;

// Webページのロードが完了した後に呼び出されるロードイベントを設定する
window.addEventListener("load", onLoad, false);

// 数字グリッドの動的作成
function makeTable(parentId){
    // 数字グリッドの作成開始
    let rows=[];
    let table = document.createElement('table');
    table.setAttribute('id', 'numberGrid');

    // 数字グリッドに2次元配列の要素を格納
    for(let i = 0; i < maxRow; i++){
        rows.push(table.insertRow(-1));
        for(let j = 0; j < maxCol; j++){
            let cell = rows[i].insertCell(-1);
            // 数字グリッドの設定
            cell.style.backgroundColor = colorWhite;
            cell.style.borderStyle = 'solid';
            cell.style.borderLeftWidth = InnerThickness.toString() +  'px';
            if(j == 0) cell.style.borderLeftWidth = OuterThickness.toString() +  'px';
            cell.style.borderTopWidth = InnerThickness.toString() +  'px';
            if(i == 0) cell.style.borderTopWidth = OuterThickness.toString() +  'px';
            cell.style.borderRightWidth = InnerThickness.toString() +  'px';
            if(j == maxCol - 1) cell.style.borderRightWidth = OuterThickness.toString() +  'px';
            cell.style.borderBottomWidth = InnerThickness.toString() +  'px';
            if(i == maxRow - 1) cell.style.borderBottomWidth = OuterThickness.toString() +  'px';
            cell.style.fontSize = NumberMojiSize.toString() + 'px';
            cell.style.borderColor = colorBlack;
            cell.value = numberData[i][j];
            //cell.textContent = numberData[i][j];
            cell.textContent = getPlayerLabel(numberData[i][j]);
            // プレーヤーと敵のセル色
            for(let k = 0; k < PlayId.length ; k++){
                if(cell.value == PlayId[k]){
                    cell.style.backgroundColor = colorName[CellColor[k]];
                    MaxPlayer = MaxPlayer + 1;
                    //alert('MaxPlayer=' + MaxPlayer);
                    enemyPersonality[k] = getRandomInt(1,4);
                }
            }

            // 数字グリッドのセル（tdタグ）にidを割り振る
            let idString = i.toString() + IdSeparator + j.toString();
            cell.setAttribute('id', idString);
            // すべてのセルにタッチイベントとクリック
            cell.addEventListener('click', function(event){
                numberClick(event.target);
            });
        }
    }
    // 指定したdiv要素に迷路を加える
    document.getElementById(parentId).appendChild(table);

    // アクティブプレーヤーの表示
    //activePlayerMessage(0);
    updateStatusDisplay(0);

}

// 表示用ラベルを返す関数を用意する
function getPlayerLabel(index) {
    let label = '';
    if(index == 0){
        label = '';
    } else if(index == 1){
        label = 'P';
    } else if(index >= 2){
        label = 'E' + (index - 1);
    }
    return label;
}
/*
// アクティブプレーヤーの表示
function activePlayerMessage(flag) {
    // 操作順番を表示
    let activePlayerMessageDiv = document.getElementById('activePlayerMessage');
    activePlayerMessageDiv.style.display = 'block';
    activePlayerMessageDiv.style.color = 'black';

    let mes = '';
    if (activePlayer == 0) {
        mes = '手番：P 領地数（' + score[activePlayer].toString() + '）';
    } else {
        let pLabel = getPersonalityLabel(enemyPersonality[activePlayer]);
        mes = '手番：E' + activePlayer.toString() + pLabel + ' 領地数（' + score[activePlayer].toString() + '）';
    }

    // 手詰まり時のメッセージ追記
    if (flag == 1) {
        mes += ' 取る場所がない！';
    }

    activePlayerMessageDiv.textContent = mes;
}
*/
/*
// 敵の性格ラベルを返す関数
function getPersonalityLabel(type) {
    if (type === 1) return '【妨害】';
    if (type === 2) return '【拡大】';
    if (type === 3) return '【バランス】';
    return '【気まま】';
}
*/

// 敵の性格を短い1文字ラベルで返す関数
function getPersonalityShortLabel(type) {
    if (type === 1) return '[妨]'; // 妨害
    if (type === 2) return '[拡]'; // 拡大
    if (type === 3) return '[均]'; // バランス
    return '[気]';                 // 気まま
}

// スコアボード兼ターン表示の更新（flag: 0=通常, 1=手詰まりパス中）
function updateStatusDisplay(flag = 0) {
    let board = document.getElementById('scoreBoard');
    if (!board) return;
    board.innerHTML = '';

    for (let i = 0; i < MaxPlayer; i++) {
        let badge = document.createElement('div');
        let bgColor = colorName[CellColor[i]];

        // 表示テキストの作成（例: "P:5" または "E1[妨]:4"）
        let name = (i === 0) ? 'P' : 'E' + i + getPersonalityShortLabel(enemyPersonality[i]);
        //let name = (i === 0) ? 'P' : 'E' + i + getPersonalityLabel(enemyPersonality[i]);
        let statusText = `${name}:${score[i]}`;

        // 手番のプレイヤーが手詰まり中の場合は「(パス)」を表示
        if (i === activePlayer && flag === 1) {
            statusText += '(パス)';
        }

        badge.textContent = statusText;
        badge.style.backgroundColor = bgColor;
        badge.style.color = 'black';
        badge.style.fontSize = '11px';      // スマホ横幅で2行に収まりやすいサイズ
        badge.style.fontWeight = 'bold';
        badge.style.padding = '2px 6px';
        badge.style.borderRadius = '10px';
        badge.style.lineHeight = '1.2';
        badge.style.whiteSpace = 'nowrap';  // バッジの途中で改行されるのを防ぐ
        badge.style.transition = 'transform 0.15s';

        // 現在手番のプレイヤーを強調
        if (i === activePlayer) {
            badge.style.border = '2px solid black';
            badge.style.boxShadow = '0 1px 4px rgba(0,0,0,0.4)';
            badge.style.transform = 'scale(1.06)';
        } else {
            badge.style.border = '1px solid #888';
            badge.style.opacity = '0.8';
        }

        board.appendChild(badge);
    }
}

// 乱数生成関数
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// 敵AI陣地取得
function enemyAI() {
    // 陣地にできるセルIDリストを初期化
    cellslist = [];

    // 周りに白セルがあるかどうか（この中で cellslist に候補が溜まる）
    if (checkWhiteColor()) {
        let uniqueCells = [...new Set(cellslist)];
        let pos = '';

        if (enemyPersonality[activePlayer] === 4) {
            // 気ままタイプ：評価せず完全ランダムに1つ選ぶ
            pos = uniqueCells[getRandomInt(0, uniqueCells.length - 1)];
        } else {
            // 思考タイプ（1〜3）：マスの価値を計算して最高得点から選ぶ
            let bestScore = -1;
            let bestCells = [];
            // 候補マスを1つずつ評価して最高得点のマスを探す
            for (let cellPos of uniqueCells) {
                let evalScore = evaluateCell(cellPos);

                if (evalScore > bestScore) {
                    bestScore = evalScore;
                    bestCells = [cellPos];  // 最高点を更新したら候補リストを作り直す
                } else if (evalScore === bestScore) {
                    bestCells.push(cellPos);    // 同点なら候補に追加
                }
            }
            // 最高得点の候補の中からランダムに1つ決定
            pos = bestCells[getRandomInt(0, bestCells.length - 1)];
        }
        // 陣地獲得処理
        getArea(pos);
        // 次のプレーヤー
        nextTurn();
    }
}

// 候補マスの価値（点数）を計算する関数
function evaluateCell(pos) {
    let point = 0;
    let rc = pos.split(IdSeparator);
    let row = parseInt(rc[0]);
    let col = parseInt(rc[1]);

    let playerColor = colorName[CellColor[0]];          // プレイヤー(P)の色
    let myColor = colorName[CellColor[activePlayer]];   // 自分の色

    // 敵の性格（重み付け）を変える
    let playerBlockWeight = 2; // プレイヤー妨害の重み
    let expandWeight = 1;      // 空き地拡大の重み
    let enemyCheckWeight = 1;  // 他の敵への牽制の重み

    if(enemyPersonality[activePlayer] === 1){
        // 妨害タイプ（プレイヤーの進路を優先して塞ぐ）
        playerBlockWeight = 4;
        expandWeight = 1;
    } else if(enemyPersonality[activePlayer] === 2){
        // 拡大タイプ（広い空き地へどんどん陣地を広げる）
        playerBlockWeight = 1;
        expandWeight = 3;
    } else {
        // バランス・混戦タイプ（他プレイヤー全般に絡む）
        playerBlockWeight = 3;
        enemyCheckWeight = 2;
    }

    // 上下左右の隣接セルをチェック
    let neighbors = [
        positionCheck(row - 1, col),
        positionCheck(row + 1, col),
        positionCheck(row, col - 1),
        positionCheck(row, col + 1)
    ];

    for (let nPos of neighbors) {
        if (nPos.length === 0) continue; // 盤面外はスキップ

        let nColor = document.getElementById(nPos).style.backgroundColor.toLowerCase();

        if (nColor === playerColor) {
            point += playerBlockWeight; // プレイヤー(P)に隣接
        } else if (nColor === colorWhite) {
            point += expandWeight;      // 未開拓の白マスに隣接
        } else if (nColor !== myColor) {
            point += enemyCheckWeight;  // 他の敵に隣接
        }
    }

    return point;
}

// 数字グリッドクリック
function numberClick(target) {
    // プレイヤーのターンでない、または待機中はクリック無効
    if (activePlayer !== 0 || !canClick) return;

    let cName = target.style.backgroundColor.toLowerCase();
    // 白セルをクリックした時だけ処理を進める
    if (cName == colorWhite) {
        // クリックしたセルの位置取得
        let pos = target.id;
        // 陣地獲得処理
        if (getArea(pos) == false) return;

        canClick = false; // 次のターン処理が終わるまでロック
        nextTurn();
    }
}

// 陣地獲得処理
function getArea(pos) {
    // アクティブプレーヤーの色取得
    let activeColor = colorName[CellColor[activePlayer]];
    // ターゲットセルの取得
    let target = document.getElementById(pos);
    // クリックセルの周りのセル色チェック
    if (checkSideColor(pos) == false) {
        return false;
    }

    // 同じ色が隣あっていれば数値セルの色付けとなる
    target.style.backgroundColor = activeColor;
    // PlayId表示
    //target.textContent = PlayId[activePlayer]; // 自分の番号に書き換え（お好みで '' にしてもOK)
    target.textContent = getPlayerLabel(PlayId[activePlayer]);
    // 領地数カウント
    score[activePlayer] = score[activePlayer] + 1;
    return true;
}

// 次のプレーヤーの表示等
async function nextTurn() {
    let currentGen = gameGeneration; // 現在のゲーム世代を記憶
    let counter = 0;

    // 手詰まりプレーヤーは飛ばす
    while (true) {
        // 次のプレーヤー
        activePlayer = activePlayer + 1;
        if (activePlayer >= MaxPlayer) activePlayer = 0;

        if (checkWhiteColor() == false) {
            // 手詰まり
            counter = counter + 1;
            //activePlayerMessage(1); // 「取る場所がない！」を表示
            updateStatusDisplay(1);

            // 1秒（1000ミリ秒）待機し、画面を描画させる
            await sleep(1000);
            if (currentGen !== gameGeneration) return; // リセットされていたら中断

            if (counter >= MaxPlayer) {
                showResult(); // 勝敗結果を表示
                break;
            }
        } else {
            // アクティブプレーヤーの表示
            //activePlayerMessage(0);
            updateStatusDisplay(0);
            if (activePlayer != 0) {
                await sleep(800); // 敵の思考時間
                if (currentGen !== gameGeneration) return;
                enemyAI();
            } else {
                canClick = true; // プレイヤーのターンになったらクリック許可
            }
            break;
        }
    }
}

// 勝敗結果の表示（リッチモーダル版）
function showResult() {
    let modal = document.getElementById('resultModal');
    let winnerDiv = document.getElementById('resultWinner');
    let rankingDiv = document.getElementById('resultRanking');

    // 全プレイヤーのデータを配列にまとめる
    let results = [];
    for (let i = 0; i < MaxPlayer; i++) {
        let name = (i === 0) ? 'P（あなた）' : 'E' + i + getPersonalityShortLabel(enemyPersonality[i]);
        results.push({
            index: i,
            name: name,
            score: score[i],
            color: colorName[CellColor[i]]
        });
    }

    // 領地数が多い順（降順）にソート
    results.sort((a, b) => b.score - a.score);

    // 優勝者の判定（同点1位にも対応）
    let topScore = results[0].score;
    let winners = results.filter(r => r.score === topScore).map(r => (r.index === 0 ? 'P' : 'E' + r.index));
    winnerDiv.textContent = `優勝：${winners.join('・')}（${topScore}領地）`;

    // 順位表のHTMLを生成
    rankingDiv.innerHTML = '';
    let currentRank = 1;
    for (let i = 0; i < results.length; i++) {
        // 前の人と点数が違う場合のみ順位を更新（同点なら同じ順位）
        if (i > 0 && results[i].score < results[i - 1].score) {
            currentRank = i + 1;
        }

        let row = document.createElement('div');
        row.className = 'rank_row' + (results[i].index === 0 ? ' is_player' : '');

        // 左側：順位・色丸・名前
        let left = document.createElement('div');
        left.className = 'rank_left';
        let medal = (currentRank === 1) ? '1位' : `${currentRank}位`;
        left.innerHTML = `<span style="width:28px;">${medal}</span><span class="rank_color_dot" style="background-color:${results[i].color};"></span><span>${results[i].name}</span>`;

        // 右側：領地数
        let right = document.createElement('div');
        right.textContent = `${results[i].score} 領地`;

        row.appendChild(left);
        row.appendChild(right);
        rankingDiv.appendChild(row);
    }

    // モーダルを表示
    modal.style.display = 'flex';
}

/*
// 勝敗結果の表示
function showResult() {
    let resultText = "ゲーム終了！\n\n";
    let maxScore = -1;
    let winners = [];

    for (let i = 0; i < MaxPlayer; i++) {
        let name = (i === 0) ? "P" : "E " + i;
        resultText += `${name}：${score[i]} 領地\n`;
        if (score[i] > maxScore) {
            maxScore = score[i];
            winners = [name];
        } else if (score[i] === maxScore) {
            winners.push(name);
        }
    }
    resultText += `\n優勝：${winners.join("、")}！`;
    alert(resultText);
}
*/

// 指定セルの周りにアクティブプレーヤーと同じ色があるか（クリックセルが隣り合っているか）
// true:ある　false:ない
function checkSideColor(pos){
    // アクティブプレーヤーの色取得
    let activeColor = colorName[CellColor[activePlayer]];

    // クリックしたセルの位置取得
    let rc = pos.split(IdSeparator);
    let row = parseInt(rc[0]);
    let col = parseInt(rc[1]);

    //上下左右のセル色調査
    let posUp = positionCheck(row - 1, col);
    let posDown = positionCheck(row + 1, col);
    let posLeft = positionCheck(row, col - 1);
    let posRight = positionCheck(row, col + 1);
    let sideFlag = false;

    if(posUp.length > 0){
        let colorUp = document.getElementById(posUp).style.backgroundColor.toLowerCase();
        if(activeColor == colorUp){
            sideFlag = true;
        }
    }
    if(posDown.length > 0){
        let colorDown = document.getElementById(posDown).style.backgroundColor.toLowerCase();
        if(activeColor == colorDown){
            sideFlag = true;
        }
    }
    if(posLeft.length > 0){
        let colorLeft = document.getElementById(posLeft).style.backgroundColor.toLowerCase();
        if(activeColor == colorLeft){
            sideFlag = true;
        }
    }
    if(posRight.length > 0){
        let colorRight = document.getElementById(posRight).style.backgroundColor.toLowerCase();
        if(activeColor == colorRight){
            sideFlag = true;;
        }
    }

    return sideFlag;
}

// アクティブプレーヤー領地の隣に空白があるか
// true:ある　false:ない
function checkWhiteColor(){
    // アクティブプレーヤーの色取得
    let activeColor = colorName[CellColor[activePlayer]];

    let sideFlag = false;
    for(let i = 0; i < maxRow; i++){
        for(let j = 0; j < maxCol; j++){
            let pos = positionCheck(i, j);
            let posColor = document.getElementById(pos).style.backgroundColor.toLowerCase();
            //alert('activeColor:' + activeColor + '   posColor:' + posColor + '  pos:' + pos + '  checkSideColor(pos)' + checkSideColor(pos));
            if(activeColor == posColor && checkSideWhiteColor(pos)) sideFlag = true;
        }
    }
    return sideFlag;
}

// 指定セルの周りに白セルがあるか
// true:ある　false:ない
function checkSideWhiteColor(pos){
    // クリックしたセルの位置取得
    let rc = pos.split(IdSeparator);
    let row = parseInt(rc[0]);
    let col = parseInt(rc[1]);

    //上下左右のセル色調査
    let posUp = positionCheck(row - 1, col);
    let posDown = positionCheck(row + 1, col);
    let posLeft = positionCheck(row, col - 1);
    let posRight = positionCheck(row, col + 1);
    let sideFlag = false;
    if(posUp.length > 0){
        let colorUp = document.getElementById(posUp).style.backgroundColor.toLowerCase();
        if(colorWhite == colorUp){
            sideFlag = true;
            cellslist.push(posUp);
        }
    }
    if(posDown.length > 0){
        let colorDown = document.getElementById(posDown).style.backgroundColor.toLowerCase();
        if(colorWhite == colorDown){
            sideFlag = true;
            cellslist.push(posDown);
        }
    }
    if(posLeft.length > 0){
        let colorLeft = document.getElementById(posLeft).style.backgroundColor.toLowerCase();
        if(colorWhite == colorLeft){
            sideFlag = true;
            cellslist.push(posLeft);
        }
    }
    if(posRight.length > 0){
        let colorRight = document.getElementById(posRight).style.backgroundColor.toLowerCase();
        if(colorWhite == colorRight){
            sideFlag = true;
            cellslist.push(posRight);
        }
    }

    return sideFlag;
}

// 数値グリッドのidを返す
function positionCheck(row, col){
    let pos = '';
    if((row >= 0 && row < maxRow) && (col >= 0 && col < maxCol)){
        pos = row.toString() + IdSeparator + col.toString();
    }
    return pos;
}

function makeButtonAction(){
    // やり直す
    let resetButton = document.getElementById('reset');
    resetButton.addEventListener('click', function(event){
        drawingTable();
    });

    // モーダル「もう一度遊ぶ」ボタン
    let playAgainBtn = document.getElementById('modalPlayAgain');
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', function(){
            document.getElementById('resultModal').style.display = 'none';
            drawingTable();
        });
    }

    // モーダル「盤面を見る」ボタン（ウィンドウだけ閉じる）
    let closeBtn = document.getElementById('modalClose');
    if (closeBtn) {
        closeBtn.addEventListener('click', function(){
            document.getElementById('resultModal').style.display = 'none';
        });
    }
}

// HTML読み込み後、自動実行
function onLoad(){
    // 問題選択肢作成
    for(let i = 2; i <= numberDataArray.length; i++){
        let option = document.createElement("option");
        option.text = i;
        option.value = i;
        // selectタグの子要素にoptionタグを追加する
        dataNumber.appendChild(option);
    }

    // 問題の動的作成
    drawingTable();

    // ボタンアクション
    makeButtonAction();
}

// 問題表示
function drawingTable(){
    // 描画エリア削除
    parent = document.getElementById('mainScreen');
    while(parent.firstChild){
      parent.removeChild(parent.firstChild);
    }

    // 初期化
    resetData();

    // 問題設定
    dataNo = parseFloat (dataNumber.value);
    numberData = numberDataArray[dataNo - 1];
    maxRow = numberData.length;
    maxCol = numberData[0].length;

    // 先に問題の動的作成（この中でスコアボードも作られる）
    makeTable('mainScreen');

    // スコアボードの高さが確定した状態で表示サイズの計算を行う
    zoomCalc();
}

// 初期化
function resetData(){
    // プレイヤー操作可能フラグとゲーム世代管理
    canClick = true;
    gameGeneration++;
    // 総プレーヤー数
    MaxPlayer = 0;
    // アクティブプレーヤー設定
    activePlayer = 0;
    // 領地数
    score = [1,1,1,1,1,1,1,1,1];
    // 陣地にできるセルリスト
    cellslist = [];
    // 敵移動性格
    enemyPersonality = [];

    let modal = document.getElementById('resultModal');
    if (modal) modal.style.display = 'none';
}

// 表示倍率計算
function zoomCalc(){
    // 表示サイズの計算
    let mainScreen = document.getElementById('mainScreen');
    let bw = window.innerWidth;
    let bh = window.innerHeight - 200;              //200は表題やボタンなどの縦幅による
    let gridw = (numberData[0].length + 1) * 100;
    let gridh = (numberData.length + 1) * 100;
    //alert("numberData[0].length=" + numberData[0].length + "   numberData.length=" + numberData.length)

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

/*
// 表示倍率計算
function zoomCalc(){
    // 表示サイズの計算
    let mainScreen = document.getElementById('mainScreen');
    let bw = window.innerWidth - 20;                    // 左右の余白分を引く
    let bh = window.innerHeight - mainScreen.offsetTop - 20; // 上部UIとスコア表の高さを自動で引く
    let gridw = (numberData[0].length + 1) * 100;
    let gridh = (numberData.length + 1) * 100;

    // 表示倍率計算
    for(let i = 2; i > 0; i = i - 0.01){
      if( gridw * i < bw && gridh * i < bh){
        zoom = i;
        break;
      }
    }
    if(zoom < 0 || zoom > 1) zoom = 1.0;    
    mainScreen.style.transformOrigin = 'top left';
    mainScreen.style.transform ='scale(' + zoom.toString() + ',' + zoom.toString() + ')';
}
*/


