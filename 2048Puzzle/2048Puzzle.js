const OuterThickness = 3;
const InnerThickness = 1;
const NumberMojiSize = '50';
const MessageMojiSize = '25';
const IdSeparator = '#';

// 色の設定
const colorGray = 'gray';
const colorBlack = 'black';
const colorWhite = 'white';
const colorName = ['yellow', 'slategray', 'yellowgreen', 'aqua', 'pink', 'lightskyblue', 'orange', 'springgreen', 'plum', 'peru', 'mistyrose',
'magenta', 'sandybrown', 'cadetblue', 'chartreuse', 'orangered', 'olive', 'firebrick', 'indigo', 'dimgray', 'mediumseagreen',
'lime', 'steelblue', 'deeppink', 'khaki', 'darkviolet', 'darkgreen', 'navy', 'maroon', 'purple'];

// 得点
let score;

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
    // alert("arrowAction action = " + action);

    // すでにゲームオーバー等でボタンが押せない状態なら処理しない
    if (document.getElementById('lbtn').disabled) return;

    // 移動前の盤面を記録（空振り時タイルの発生を防ぐ用）
    let beforeGrid = JSON.stringify(gridData);

    // 1. まず、すべて指定方向へ移動する（隙間を詰める）
    while(true){
        let ct = 0;
        for(let i = 0; i < maxRow; i++){
            for(let j = 0; j < maxCol; j++){
                if(moveTile(i, j, action)){
                    ct++;
                }
            }
        }
        if(ct == 0) break;
    }

    // 2. 優先度を考慮して、足し算する（【修正】whileループを撤廃！）
    // 元の calculateTile の仕様（手前から引っ張る）に合わせ、移動方向の「奥」から順に1度だけ走査します
    if (action == 'ArrowUp') {
        // 上移動：一番上の行（0）から下に向かってスキャン
        for (let i = 0; i < maxRow; i++) {
            for (let j = 0; j < maxCol; j++) {
                calculateTile(i, j, action);
            }
        }
    } 
    else if (action == 'ArrowDown') {
        // 下移動：一番下の行（maxRow-1）から上に向かってスキャン
        for (let i = maxRow - 1; i >= 0; i--) {
            for (let j = 0; j < maxCol; j++) {
                calculateTile(i, j, action);
            }
        }
    } 
    else if (action == 'ArrowLeft') {
        // 左移動：一番左の列（0）から右に向かってスキャン
        for (let i = 0; i < maxRow; i++) {
            for (let j = 0; j < maxCol; j++) {
                calculateTile(i, j, action);
            }
        }
    } 
    else if (action == 'ArrowRight') {
        // 右移動：一番右の列（maxCol-1）から左に向かってスキャン
        // ※ 列(j)のループも後ろから回す必要があります
        for (let i = 0; i < maxRow; i++) {
            for (let j = maxCol - 1; j >= 0; j--) {
                calculateTile(i, j, action);
            }
        }
    }

    // 3. 再度、すべて指定方向へ移動する（合体でできた隙間を詰める）
    while(true){
        let ct = 0;
        for(let i = 0; i < maxRow; i++){
            for(let j = 0; j < maxCol; j++){
                if(moveTile(i, j, action)){
                    ct++;
                }
            }
        }
        if(ct == 0) break;
    }

    // 移動前と後で盤面に変化があった場合のみ新しいタイルを発生させる
    let afterGrid = JSON.stringify(gridData);
    if (beforeGrid !== afterGrid) {
        // 新たなタイルの発生（タイル表示も行っている）
        makeNumber();
    }

    // クリア判定
    if (checkClear()) {
        let si = document.getElementById('successImage');
        si.innerText = "GAME CLEAR! 🎉";
        si.style.display = 'block';

        // 操作ボタンをすべて無効化する
        document.getElementById('lbtn').disabled = true;
        document.getElementById('ubtn').disabled = true;
        document.getElementById('dbtn').disabled = true;
        document.getElementById('rbtn').disabled = true;
    }

    // ゲームオーバー判定
    if (checkGameOver()) {
        let si = document.getElementById('successImage');
        si.innerText = "GAME OVER... 😢";
        si.style.display = 'block';
        
        // 操作ボタンをすべて無効化する
        document.getElementById('lbtn').disabled = true;
        document.getElementById('ubtn').disabled = true;
        document.getElementById('dbtn').disabled = true;
        document.getElementById('rbtn').disabled = true;
    }
}


// 【追加】クリア判定用の関数
function checkClear() {
    for (let i = 0; i < maxRow; i++) {
        for (let j = 0; j < maxCol; j++) {
            if (gridData[i][j] === 2048) {
                return true; // 2048のタイルがあればクリア
            }
        }
    }
    return false;
}

// 【追加】ゲームオーバー判定用の関数
function checkGameOver() {
    // 条件1: 空白のマスがあるかチェック
    for (let i = 0; i < maxRow; i++) {
        for (let j = 0; j < maxCol; j++) {
            if (gridData[i][j] === 0) {
                return false; // 空白があればまだ動かせる
            }
        }
    }

    // 条件2: 隣り合うマスで合体できる場所があるかチェック
    for (let i = 0; i < maxRow; i++) {
        for (let j = 0; j < maxCol; j++) {
            let current = gridData[i][j];
            // 右隣と比較
            if (j + 1 < maxCol && current === gridData[i][j + 1]) {
                return false;
            }
            // 下隣と比較
            if (i + 1 < maxRow && current === gridData[i + 1][j]) {
                return false;
            }
        }
    }

    // 空白がなく、上下左右どこにも合体できないならゲームオーバー
    return true;
}


/*
1回の移動で「2回連続」で合体してしまうバグ
現在、arrowAction 内で合体処理（calculatTitle）を while(true) で繰り返しています。
これにより、例えば [4, 2, 2, 0] という並びのときに上へ移動させると、以下のような挙動になります。

1.最初の移動で [4, 2, 2, 0]
2.1回目の合体ループで 2 と 2 が合体して [4, 4, 0, 0] になる
3.2回目の合体ループが走り、先ほどできた 4 と元からあった 4 がさらに合体して [8, 0, 0, 0] になってしまう

本家の2048では、「1回の操作で合体できるのは各タイル1回まで」というルールがあるため、[4, 4, 0, 0] で止まるのが正解です。
合体処理の while(true) ループは削除し、1マスにつき1度だけスキャンするように変更することをおすすめします。
*/
/*
// 矢印キーアクション
// 現在アクティブのブロック操作
function arrowAction(action){
    //alert("arrowAction action = " + action);
    // まず、すべて指定方向へ移動する
    while(true){
        let ct = 0;
        for(let i = 0; i < maxRow; i++){
            for(let j = 0; j < maxCol; j++){
                if(moveTile(i, j, action)){
                    ct++;
                }
            }
        }
        if(ct == 0) break;
    }

    // 優先度を考慮して、足し算する
    while(true){
        let ct = 0;
        if(action == 'ArrowDown' || action == 'ArrowRight'){
            // 下・右
            for(let i = maxRow - 1; i >= 0; i--){
                for(let j = 0; j < maxCol; j++){
                    //alert("i=" + i.toString() + "  j=" + j.toString() + "  gridData[i][j]=" + gridData[i][j]);
                    if(calculateTile(i, j, action)){
                        ct++;
                    }
                }
            }
        } else {
            // 上・左
            for(let i = 0; i < maxRow; i++){
                for(let j = 0; j < maxCol; j++){
                    if(calculateTile(i, j, action)){
                        ct++;
                    }
                }
            }
        }
        if(ct == 0) break;
    }

    // 再度、すべて指定方向へ移動する
    while(true){
        let ct = 0;
        for(let i = 0; i < maxRow; i++){
            for(let j = 0; j < maxCol; j++){
                if(moveTile(i, j, action)){
                    ct++;
                }
            }
        }
        if(ct == 0) break;
    }

    // 新たなタイルの発生（タイル表示も行っている）
    makeNumber();

    // クリア判定
    let clearFlag = true;

}
*/


// 優先順位を考えて足し算する
// i：行、j：列
function calculateTile(i, j, action){
    //alert("calculateTile action = " + action);
    // 計算を行ったかどうか
    let flag = false;
    //周辺セル調査
    let up = i - 1;
    let down = i + 1;
    let left = j - 1;
    let right = j + 1;
    //alert("i=" + i.toString() + "  j=" + j.toString() + "  gridData[i][j]=" + gridData[i][j]);

    // 自分が空白は計算外
    if(gridData[i][j] == 0) return flag;

    // 移動先が空白ならば空白と入れ替える
    if(action == 'ArrowUp'){
        //上
        if(down < gridRowCol){
            //alert('ArrowUp gridData[i][j] ' + gridData[i][j] + '  gridData[down][j] ' + gridData[down][j]);
            if(gridData[down][j] == 0) return flag;
            if(gridData[i][j] == gridData[down][j]){
                gridData[i][j] = gridData[i][j] + gridData[down][j];
                gridData[down][j] = 0;
                score = score + gridData[i][j];
                flag = true;
            }
        }
    }
    if(action == 'ArrowDown'){
        //下
        if(up >= 0){
            if(gridData[up][j] == 0) return flag;
            if(gridData[i][j] == gridData[up][j]){
                gridData[i][j] = gridData[i][j] + gridData[up][j];
                gridData[up][j] = 0;
                score = score + gridData[i][j];
                flag = true;
            }
        }
    }

    if(action == 'ArrowLeft'){
        //左
        if(right < gridRowCol){
            //alert(action + " i=" + i.toString() + "  j=" + j.toString() + ' gridData[i][j] ' + gridData[i][j] + '  gridData[i][right] ' + gridData[i][right]);
            if(gridData[i][right] == 0) return flag;
            if(gridData[i][j] == gridData[i][right]){
                gridData[i][j] = gridData[i][j] + gridData[i][right];
                gridData[i][right] = 0;
                score = score + gridData[i][j];
                flag = true;
            }
        }
    }

    if(action == 'ArrowRight'){
        //右
        if(left >= 0){
            //alert(action + " i=" + i.toString() + "  j=" + j.toString() + ' gridData[i][j] ' + gridData[i][j] + '  gridData[i][left] ' + gridData[i][left]);
            if(gridData[i][left] == 0) return flag;
            if(gridData[i][j] == gridData[i][left]){
                gridData[i][j] = gridData[i][j] + gridData[i][left];
                gridData[i][left] = 0;
                score = score + gridData[i][j];
                flag = true;
            }
        }
    }

    return flag;
}


// 上下左右の空白タイルを探して、指定したタイルと入れ替える
function moveTile(i, j, direct){
    // 移動したかどうか
    let flag = false;
    //周辺セル調査
    let up = i - 1;
    let down = i + 1;
    let left = j - 1;
    let right = j + 1;
    //alert("i=" + i.toString() + "  j=" + j.toString());

    // 自分が空白は動かさない
    if(gridData[i][j] == 0) return flag;

    // 移動先が空白ならば空白と入れ替える
    if(up >= 0 && direct == 'ArrowUp'){
        //上
        if(gridData[up][j] == 0){
            gridData[up][j] = gridData[i][j];
            gridData[i][j] = 0;
            flag = true;
            //alert("上　up=" + up.toString() + "  j=" + j.toString() + " 値：" + gridData[up][j].toString());
        }
    }
    if(down < gridRowCol && direct == 'ArrowDown'){
        //下
        if(gridData[down][j] == 0){
            gridData[down][j] = gridData[i][j];
            gridData[i][j] = 0;
            flag = true;
            //alert("下　down=" + up.toString() + "  right=" + right.toString() + " 値：" + gridData[down][j].toString());
        }
    }

    if(left >= 0 && direct == 'ArrowLeft'){
        //左
        if(gridData[i][left] == 0){
            gridData[i][left] = gridData[i][j];
            gridData[i][j] = 0;
            flag = true;
            //alert("左　i=" + i.toString() + "  left=" + left.toString() + " 値：" + gridData[i][left].toString());
        }
    }

    if(right < gridRowCol && direct == 'ArrowRight'){
        //右
        if(gridData[i][right] == 0){
            gridData[i][right] = gridData[i][j];
            gridData[i][j] = 0;
            flag = true;
            //alert("右　i=" + i.toString() + "  right=" + right.toString() + " 値：" + gridData[i][right].toString());
        }
    }

    return flag;
}

// キーが押されたとき
function keyDown(event){
    let strArrow = event.key;
    // BackSpace 8 Enter 13 テンキー 96～105 数字 48～57
    if(event.keyCode === 8 || event.keyCode === 13 ||
      (48 <= event.keyCode && event.keyCode <= 57) ||
      (96 <= event.keyCode && event.keyCode <= 105)) {
      return;
    }

    // ie11対応
    switch(event.key){
        case 'Up':
            strArrow = 'ArrowUp';
            break;
        case 'Down':
            strArrow = 'ArrowDown';
            break;
        case 'Left':
            strArrow = 'ArrowLeft';
            break;
        case 'Right':
            strArrow = 'ArrowRight';
            break;
    }
    event.preventDefault();
    arrowAction(strArrow);
}

// ボタンアクション設定
function makeButtonAction(){
    // イベント取得用ボタンオブジェクト取得
    let upButton = document.getElementById('ubtn');
    let downButton = document.getElementById('dbtn');
    let leftButton = document.getElementById('lbtn');
    let rightButton = document.getElementById('rbtn');

    // 上
    upButton.addEventListener('click', function(event){
        arrowAction('ArrowUp');
    });
    // 下
    downButton.addEventListener('click', function(event){
        arrowAction('ArrowDown');
    });
    // 左
    leftButton.addEventListener('click', function(event){
        arrowAction('ArrowLeft');
    });
    // 右
    rightButton.addEventListener('click', function(event){
        arrowAction('ArrowRight');
    });

    // やり直す
    let resetButton = document.getElementById('reset');
    resetButton.addEventListener('click', function(event){
        drawingTable();
    });
}

// タイルグリッドの動的作成
function makeTable(parentId){
    // タイルグリッドの作成開始
    let rows=[];
    let table = document.createElement('table');
    table.setAttribute('id', 'tileGrid');

    // タイルグリッドのセル作成
    for(let i = 0; i < maxRow; i++){
        rows.push(table.insertRow(-1));
        for(let j = 0; j < maxCol; j++){
            let cell = rows[i].insertCell(-1);
            // タイルグリッドの設定
            cell.style.backgroundColor = colorWhite;
            //cell.style.backgroundColor = colorGray;
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

            // タイルグリッドのセル（tdタグ）にidを割り振る
            let idString = i.toString() + IdSeparator + j.toString();
            cell.setAttribute('id', idString);

        }
    }

    // 指定したdiv要素に迷路を加える
    document.getElementById(parentId).appendChild(table);
}

// 新たなタイルの発生（フリーズ対策・完全版）
// 先に空白のマスだけをリストアップする方法
// スペースに2または4を発生させる
// 最後にタイル表示も行っている
function makeNumber(){
    // 1. 今画面にある「空白のマス（値が0のマス）」の位置をすべて洗い出す
    let emptyCells = [];
    for(let i = 0; i < maxRow; i++){
        for(let j = 0; j < maxCol; j++){
            if(gridData[i][j] == 0){
                // 空白マスの座標 {row: 行, col: 列} を配列に保存
                emptyCells.push({row: i, col: j});
            }
        }
    }

    // 2. もし空白のマスが1つもなければ、新しいタイルは置けないので処理を終わる
    // (これがゲームオーバー判定のフックにも使えます)
    if(emptyCells.length === 0) {
        return; 
    }

    // 3. 空白マスのリストの中から、ランダムで1つだけ選ぶ（絶対に被らない！）
    let randomIndex = getRandomInt(0, emptyCells.length - 1);
    let targetCell = emptyCells[randomIndex];

    // 4. 選ばれたマスに 2 または 4 を配置する（2:90%, 4:10%）
    if(getRandomInt(1, 10) == 10){
        gridData[targetCell.row][targetCell.col] = 4;
    } else {
        gridData[targetCell.row][targetCell.col] = 2;
    }

    // タイル表示
    tileGridView();
}

/*
function makeNumber(){
    let flag = true;
    let ct = 0;
    let totalCells = maxRow * maxCol; // 16で固定せず盤面の総数にする

    while(flag){
        let i = getRandomInt(0, maxRow - 1);
        let j = getRandomInt(0, maxCol - 1);
        let cellValue = gridData[i][j];
        
        if(cellValue == 0){
            gridData[i][j] = (getRandomInt(1, 10) == 10) ? 4 : 2;
            flag = false;
        } else {
            ct++;
        }
        
        if(ct >= totalCells * 2) { // 安全策として総マスの2倍以上被ったらブレイク
            break; 
        }
    }

    // タイル表示
    tileGridView();
}

function makeNumber(){
    // ループフラグ（falseでループから抜け出す）
    let flag = true;
    let ct = 0;
    while(flag){
        let i = getRandomInt(0, gridRowCol - 1);
        let j = getRandomInt(0, gridRowCol - 1);
        let cellValue = gridData[i][j];
        if(cellValue == 0){
            // 2:90% 4:10%
            if(getRandomInt(1, 10) == 10){
                gridData[i][j] = 4;
                flag = false;
            } else {
                gridData[i][j] = 2;
                flag = false;
            }
        } else {
            ct++;
        }
        // もう空白が無い場合には抜け出す
        //if(ct == 16) break;
        if(ct == maxRow * maxCol) break;
    }

    // タイル表示
    tileGridView();
}
*/


// 乱数（min～maxの整数）
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// タイルグリッド表示
// gridDataをもとに再表示
function tileGridView(){
    for(let i = 0; i < gridRowCol; i++){
        for(let j = 0; j < gridRowCol; j++){
            let idString = i.toString() + IdSeparator + j.toString();
            let cell = document.getElementById(idString);
            let cellValue = gridData[i][j];
            if(cellValue == 0){
                cell.style.backgroundColor = colorWhite;
                cell.textContent = "";
                //cell.style.backgroundColor = colorWhite;
                //cell.textContent = cellValue;
            } else {
                let cName = colorName[0];
                if(cellValue == 2) cName = colorName[0];
                if(cellValue == 4) cName = colorName[1];
                if(cellValue == 8) cName = colorName[2];
                if(cellValue == 16) cName = colorName[3];
                if(cellValue == 32) cName = colorName[4];
                if(cellValue == 64) cName = colorName[5];
                if(cellValue == 128) cName = colorName[6];
                if(cellValue == 256) cName = colorName[7];
                if(cellValue == 512) cName = colorName[8];
                if(cellValue == 1024) cName = colorName[9];
                if(cellValue == 2048) cName = colorName[10];
                cell.style.backgroundColor = cName;
                cell.style.color = colorBlack
                cell.textContent = cellValue;
            }
        }
    }

    // 得点
    let counter = document.getElementById('scoreText');
    counter.innerText = "　　得点：　" + score;
}

// HTML読み込み後、自動実行
function onLoad(){
    // ビューポートの設定
    //UpdateViewport();

    // 迷路の動的作成
    drawingTable();

    // ボタンアクション設定
    makeButtonAction();
}

// 問題表示
function drawingTable(){
    // 描画エリア削除
    let parent = document.getElementById('mainScreen');
    while(parent.firstChild){
      parent.removeChild(parent.firstChild);
    }

    // 初期化
    resetData();

    // 問題設定
    dataNo = 1;
    gridRowCol = gridRowColArray[dataNo - 1];
    gridData = gridDataArray[dataNo - 1];
    maxRow = gridData.length;
    maxCol = gridData[0].length;
    //alert("No." + dataNo.toString() + "  + "  gridRowCol=" + gridRowCol.toString());
    for(let i = 0; i < gridRowCol; i++){
        gridData[i] = [];
        for(let j = 0; j < gridRowCol; j++){
            gridData[i][j] = 0;
        }
    }

    // 表示サイズの計算
    zoomCalc();

    // 問題の動的作成
    makeTable('mainScreen');

    // 初期問題
    for(let i = 0; i < 2; i++){
        makeNumber();
    }
}

// 初期化
function resetData(){
    // 成功画像非表示
    let si = document.getElementById('successImage');
    si.style.display = 'none';

    // 得点
    score = 0;

    // ボタンの有効化
    let resetButton = document.getElementById('reset');
    resetButton.disabled = false;
    let leftButton = document.getElementById('lbtn');
    leftButton.disabled = false;
    let upButton = document.getElementById('ubtn');
    upButton.disabled = false;
    let downButton = document.getElementById('dbtn');
    downButton.disabled = false;
    let rightButton = document.getElementById('rbtn');
    rightButton.disabled = false;

}

// 表示倍率計算
function zoomCalc(){
    // 表示サイズの計算
    let mainScreen = document.getElementById('mainScreen');
    let bw = window.innerWidth;
    let bh = window.innerHeight - 165;          //165は表題やボタンなどの縦幅による
    let gridw = (gridData[0].length + 1) * 100;
    let gridh = (gridData.length + 1) * 100;

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
    //alert("bw=" + bw + "  gridw=" + gridw * zoom + "  bh=" + bh + " gridh=" + gridh * zoom + " zoom=" + zoom);

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
