const OuterThickness = 3;
const InnerThickness = 1;
const NumberMojiSize = '50';
const IdSeparator = '#';

// 色の設定
const colorGray = 'gray';
const colorBlack = 'black';
const colorWhite = 'white';
const colorName = ['yellow', 'slategray', 'yellowgreen', 'aqua', 'pink', 'lightskyblue', 'orange', 'springgreen', 'plum', 'peru', 'mistyrose',
'magenta', 'sandybrown', 'cadetblue', 'chartreuse', 'orangered', 'olive', 'firebrick', 'indigo', 'dimgray', 'mediumseagreen',
'lime', 'steelblue', 'deeppink', 'khaki', 'darkviolet', 'darkgreen', 'navy', 'maroon', 'purple']; //30個

// 操作回数
let operationsNumber;

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
            //cell.style.backgroundColor = colorWhite;
            cell.style.backgroundColor = colorGray;
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
            // すべてのセルにタッチイベントとクリック
            //cell.addEventListener('touchend', function(event){
            //    event.preventDefault();
            //    tileClick(event.target);
            //});
            cell.addEventListener('click', function(event){
            //    event.preventDefault();
                tileClick(event.target);
            });
        }
    }
    // 指定したdiv要素に迷路を加える
    document.getElementById(parentId).appendChild(table);

    // タイルグリッド表示
    tileGridView();
}

// 乱数（min～maxの整数）
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

//0：空き
//1～：数字タイル
//gridDataを毎回再表示する
function tileGridView(){
    for(let i = 0; i < gridRowCol; i++){
        for(let j = 0; j < gridRowCol; j++){
            let idString = i.toString() + IdSeparator + j.toString();
            let cell = document.getElementById(idString);
            let cellValue = gridData[i][j];
            if(cellValue == 0){
                cell.style.backgroundColor = colorGray;
                cell.textContent = "";
                //cell.style.backgroundColor = colorWhite;
                //cell.textContent = cellValue;
            } else {
                cell.style.backgroundColor = colorWhite;
                //cell.style.color = colorName[getRandomInt(0, 30)];
                cell.style.color = colorBlack
                cell.textContent = cellValue;
            }
        }
    }
}

// タイルグリッドクリック
function tileClick(target){
    let pos = target.id;
    let rc = pos.split(IdSeparator);
    let i = parseInt(rc[0]);
    let j = parseInt(rc[1]);
    let cellValue = gridData[i][j];
    //alert("pos=" + pos + "  cellValue=" + cellValue);

    if(cellValue == 0){
        // 空白なら何もしない
    } else {
        // 上下左右に空白があればそちらにタイルを移動
        if(searchSpaceTitle(i, j)){
            operationsNumber = operationsNumber + 1;
            let counter = document.getElementById('operationsNumber');
            counter.innerText = "操作回数：　" + operationsNumber;
        }
    }
    // タイルグリッド表示
    tileGridView();
}


// 指定したタイルの周囲に空白があるか探し、あれば入れ替える
function searchSpaceTitle(i, j){
    let flag = false;
    let directions = [
        { r: i - 1, c: j }, // 上
        { r: i + 1, c: j }, // 下
        { r: i, c: j - 1 }, // 左
        { r: i, c: j + 1 }  // 右
    ];

    for (let dir of directions) {
        // グリッドの範囲内かチェック
        if (dir.r >= 0 && dir.r < gridRowCol && dir.c >= 0 && dir.c < gridRowCol) {
            if (gridData[dir.r][dir.c] == 0) {
                // 空白セルを発見したら入れ替え
                gridData[dir.r][dir.c] = gridData[i][j];
                gridData[i][j] = 0;
                flag = true;
                break; // 1つ見つかれば終了
            }
        }
    }
    return flag;
}
/*
// 上下左右の空白タイルを探して、指定したタイルと入れ替える
function searchSpaceTitle(i, j){
    // 操作回数を増やすかどうか
    let flag = false;
    //周辺セル調査
    let up = i - 1;
    let down = i + 1;
    let left = j - 1;
    let right = j + 1;
    //alert("i=" + i.toString() + "  j=" + j.toString());

    if(up >= 0){
        //上
        if(gridData[up][j] == 0){
            gridData[up][j] = gridData[i][j];
            gridData[i][j] = 0;
            flag = true;
            //alert("上　up=" + up.toString() + "  j=" + j.toString() + " 値：" + gridData[up][j].toString());
        }
    }
    if(down < gridRowCol){
        //下
        if(gridData[down][j] == 0){
            gridData[down][j] = gridData[i][j];
            gridData[i][j] = 0;
            flag = true;
            //alert("右上　up=" + up.toString() + "  right=" + right.toString() + " 値：" + gridData[down][j].toString());
        }
    }

    if(right < gridRowCol){
        //右
        if(gridData[i][right] == 0){
            gridData[i][right] = gridData[i][j];
            gridData[i][j] = 0;
            flag = true;
            //alert("右　i=" + i.toString() + "  right=" + right.toString() + " 値：" + gridData[i][right].toString());
        }
    }

    if(left >= 0){
        //左
        if(gridData[i][left] == 0){
            gridData[i][left] = gridData[i][j];
            gridData[i][j] = 0;
            flag = true;
            //alert("左　i=" + i.toString() + "  left=" + left.toString() + " 値：" + gridData[i][left].toString());
        }
    }

    return flag;
}
*/

// タイルシャッフル NG
// 無作為に入れ替える（この場合には、解けないパズルを作ってしまう可能性がある）
/*
function shuffleTile(){
    let loop = gridRowCol * gridRowCol;
    for(let i = 0; i < loop; i++){
        let cell1 = getRandomInt(0, gridRowCol - 1);
        let cell2 = getRandomInt(0, gridRowCol - 1);
        let cell3 = getRandomInt(0, gridRowCol - 1);
        let cell4 = getRandomInt(0, gridRowCol - 1);
        //alert("cell1=" + cell1.toString() + " cell2=" + cell2.toString() + " cell3=" + cell3.toString() + " cell4=" + cell4.toString());
        let cellValue1 = gridData[cell1][cell2];
        let cellValue2 = gridData[cell3][cell4];
        //alert("cellValue1=" + cellValue1.toString() + " cellValue2=" + cellValue2.toString());
        gridData[cell1][cell2] = cellValue2;
        gridData[cell3][cell4] = cellValue1;
    }

    // 操作回数初期化
    operationsNumber = 0;
    let counter = document.getElementById('operationsNumber');
    counter.innerText = "操作回数：　" + operationsNumber;

    // タイルグリッド表示
    tileGridView();
}
*/

// 空白セルを探す
// 周りの数値セルのいずれかと交換する
// 繰り返す
// タイルシャッフル
// 答えから逆算して問題を作る
function shuffleTile(){
    // 大元のループ回数は何となく3乗で
    for(let k = 0; k < Math.pow(gridRowCol, 3); k++){
        for(let i = 0; i < gridRowCol; i++){
            for(let j = 0; j < gridRowCol; j++){
                let cellValue = gridData[i][j];
                if(cellValue == 0){
                    // 空白セル発見！
                    // 上下左右のどれかと交換
                    searchNumberTitle(i, j);
                }
            }
        }
    }

    // 操作回数初期化
    operationsNumber = 0;
    let counter = document.getElementById('operationsNumber');
    counter.innerText = "操作回数：　" + operationsNumber;

    // タイルグリッド表示
    tileGridView();
}

// 上下左右の数字タイルを探して、指定したタイルと入れ替える
function searchNumberTitle(i, j){
    //周辺セル調査
    let up = i - 1;
    let down = i + 1;
    let left = j - 1;
    let right = j + 1;
    //alert("空白タイル位置：  i=" + i.toString() + "  j=" + j.toString());

    // ループフラグ（falseでループから抜け出す）
    let flag = true;
    while(flag){
        // どの方向のものを入れ替えるか
        let witch = getRandomInt(1, 4);
        if(up >= 0 && witch == 1){
            //上
            if(gridData[up][j] > 0){
                gridData[i][j] = gridData[up][j];
                gridData[up][j] = 0;
                flag = false;
                //alert("上　up=" + up.toString() + "  j=" + j.toString() + " 値：" + gridData[up][j].toString());
            }
        }
        if(down < gridRowCol && witch == 2){
            //下
            if(gridData[down][j] > 0){
                gridData[i][j] = gridData[down][j];
                gridData[down][j] = 0;
                flag = false;
                //alert("右上　up=" + up.toString() + "  right=" + right.toString() + " 値：" + gridData[down][j].toString());
            }
        }
    
        if(right < gridRowCol && witch == 3){
            //右
            if(gridData[i][right] > 0){
                gridData[i][j] = gridData[i][right];
                gridData[i][right] = 0;
                flag = false;
                //alert("右　i=" + i.toString() + "  right=" + right.toString() + " 値：" + gridData[i][right].toString());
            }
        }
    
        if(left >= 0 && witch == 4){
            //左
            if(gridData[i][left] > 0){
                gridData[i][j] = gridData[i][left];
                gridData[i][left] = 0;
                flag = false;
                //alert("左　i=" + i.toString() + "  left=" + left.toString() + " 値：" + gridData[i][left].toString());
            }
        }
    }
}

// ボタンアクション設定
function makeButtonAction(){
    // やり直す
    let resetButton = document.getElementById('reset');
    resetButton.addEventListener('click', function(event){
        drawingTable();
    });

    // シャッフル
    let shuffleButton = document.getElementById('shuffle');
    shuffleButton.addEventListener('click', function(event){
        shuffleTile();
    });
}


// HTML読み込み後、自動実行
function onLoad(){
    // ビューポートの設定
    //UpdateViewport();

    // 問題選択肢作成
    for(let i = 2; i <= gridDataArray.length; i++){
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
    let parent = document.getElementById('mainScreen');
    while(parent.firstChild){
      parent.removeChild(parent.firstChild);
    }

    // 操作回数初期化
    operationsNumber = 0;
    let counter = document.getElementById('operationsNumber');
    counter.innerText = "操作回数：　" + operationsNumber;

    // 問題設定
    dataNo = parseFloat (dataNumber.value);
    gridRowCol = gridRowColArray[dataNo - 1];
    gridData = gridDataArray[dataNo - 1];
    maxRow = gridData.length;
    maxCol = gridData[0].length;
    let ct = 0;
    for(let i = 0; i < gridRowCol; i++){
        gridData[i] = [];
        for(let j = 0; j < gridRowCol; j++){
            ct = ct + 1;
            if(ct == gridRowCol * gridRowCol){
                gridData[i][j] = 0;
            } else {
                gridData[i][j] = ct;
            }
        }
    }

    // 表示サイズの計算
    zoomCalc();

    // 問題の動的作成
    makeTable('mainScreen');  
}

// 表示倍率計算
function zoomCalc(){
    // 表示サイズの計算
    let mainScreen = document.getElementById('mainScreen');
    let bw = window.innerWidth;
    let bh = window.innerHeight - 230;          //230は表題やボタンなどの縦幅による
    let gridw = (gridData[0].length + 1) * 100;
    let gridh = (gridData.length + 1) * 100;
    //alert("gridData[0].length=" + gridData[0].length + "   gridData.length=" + gridData.length);

    // 表示倍率計算
    for(let i = 2; i > 0; i = i - 0.01){
      if( gridw * i < bw && gridh * i < bh){
        zoom = i;
        break;
      }
    }
    //alert("bw=" + bw + "  gridw=" + gridw * zoom + "  bh=" + bh + " gridh=" + gridh * zoom + " zoom=" + zoom);
    if(zoom < 0 || zoom > 1) zoom = 1.0;

    //zoom = 2.0;
    mainScreen.style.transformOrigin = 'top left';
    mainScreen.style.transform ='scale(' + zoom.toString() + ',' + zoom.toString() + ')';

    //alert("zoom=" + zoom.toString());

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
