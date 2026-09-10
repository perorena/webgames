const OuterThickness = 3;
const InnerThickness = 1;
const NumberMojiSize = '50';
const MessageMojiSize = '25';
const IdSeparator = '#';
//const Root = '../../';
//const SuccessImageSrc = Root + 'img/Success2.png';
const SuccessImageSrc = '../img/Success2.png';

// 色の設定
const colorBlack = 'black';
const colorWhite = 'white';
const colorName = ['yellowgreen', 'plum', 'yellow', 'aqua', 'pink', 'lightskyblue', 'orange', 'springgreen', 'purple', 'peru', 'mistyrose'];

// 問題データ指定
let dataNumber = document.getElementById("dataNumber");

// 問題変更時のイベントリスナー
dataNumber.addEventListener("change", drawingTable);

// 問題番号
let dataNo;

// データ個数
let maxRow;   //行数
let maxCol;   //列数

// 塗りつぶしカウント
let clickCounter;

// 塗りつぶし色
let fillColor;

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
            cell.textContent = numberData[i][j];
            if(numberData[i][j] == 0){
                // 黒壁
                cell.style.backgroundColor = 'black';
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
}

// 数字グリッドクリック
function numberClick(target){
    if(target.textContent == 0) return;
    let cName = target.style.backgroundColor.toLowerCase();
    if(cName == colorWhite){
        let num = target.textContent;
        let index = parseInt(num) - 1;
        for(let k = 0; k < groupNumber; k++){
            if(fillColor == colorName[k]){
                let chkNum = checkBox[k][index];
                if (chkNum == 1) return;
                checkBox[k][index] = 1;
            }
        }

        // 数値セルの色付け
        target.style.backgroundColor = fillColor;

        // クリック回数による塗りつぶし色の変更(次回の)
        clickCounter = clickCounter + 1;
        for(let k = 1; k < groupNumber; k++){
            if(clickCounter == 5 * k) fillColor = colorName[k];
        }
    }

    // 色ごとの接続面数の保持
    let numberSideCounter = {'yellowgreen':0, 'plum':0, 'yellow':0, 'aqua':0, 'pink':0, 'lightskyblue':0, 'orange':0, 'springgreen':0, 'purple':0, 'peru':0, 'mistyrose':0};
    // 完成チェックフラグ
    let completeFlag = {};
    // 判定前処理
    for(let i = 0; i < maxRow; i++){
        for(let j = 0; j < maxCol; j++){
            // チェックターゲット
            let pos = i.toString() + IdSeparator + j.toString();
            completeFlag[pos] = false;
            let colorCheck = document.getElementById(pos).style.backgroundColor.toLowerCase();
            // チェックターゲットが白なら判定外
            if (colorCheck == colorWhite) continue;
            // チェックターゲットが黒ならtrue
            if (colorCheck == colorBlack){
                completeFlag[pos] = true;
                continue;
            }
            //上下左右のセル
            let posUp = positionCheck(i - 1, j );
            let posDown = positionCheck(i + 1, j);
            let posLeft = positionCheck(i, j - 1);
            let posRight = positionCheck(i, j + 1);
            // 数値を保持しているセルだけチェック
            if(posUp.length > 0){
                let colorUp = document.getElementById(posUp).style.backgroundColor.toLowerCase();
                if(colorCheck == colorUp){
                    completeFlag[pos] = true;
                    numberSideCounter[colorCheck] = numberSideCounter[colorCheck] + 1;
                }
            }
            if(posDown.length > 0){
                let colorDown = document.getElementById(posDown).style.backgroundColor.toLowerCase();
                if(colorCheck == colorDown){
                    completeFlag[pos] = true;
                    numberSideCounter[colorCheck] = numberSideCounter[colorCheck] + 1;
                }
            }
            if(posLeft.length > 0){
                let colorLeft = document.getElementById(posLeft).style.backgroundColor.toLowerCase();
                if(colorCheck == colorLeft){
                    completeFlag[pos] = true;
                    numberSideCounter[colorCheck] = numberSideCounter[colorCheck] + 1;
                }
            }
            if(posRight.length > 0){
                let colorRight = document.getElementById(posRight).style.backgroundColor.toLowerCase();
                if(colorCheck == colorRight){
                    completeFlag[pos] = true;
                    numberSideCounter[colorCheck] = numberSideCounter[colorCheck] + 1;
                 }
            }
        }
    }

    // 判定
    // チェックフラグ（true:完成 false:未完成）
    let checkFlag = true;
    for(let i = 0; i < maxRow; i++){
        for(let j = 0; j < maxCol; j++){
            // チェックターゲット
            let pos = i.toString() + IdSeparator + j.toString();
            let flag = completeFlag[pos];
            if (flag == false) checkFlag = false;
        }
    }
    let sideFlag = true;
    for(let k = 0; k < groupNumber; k++){
        if(numberSideCounter[colorName[k]] != 8 && numberSideCounter[colorName[k]] != 10){
            sideFlag = false;
        }
    }
    // 完成！
    if(checkFlag == true && sideFlag == true){
        let si = document.getElementById('successImage');
        si.style.display = 'block';
        //let resetButton = document.getElementById('reset');
        //resetButton.disabled = true;
        let undoButton = document.getElementById('undo');
        undoButton.disabled = true;
    }
}

// 数値グリッドのidを返す
function positionCheck(row, col){
    let pos = '';
    if((row >= 0 && row < maxRow) && (col >= 0 && col < maxCol)){
        pos = row.toString() + IdSeparator + col.toString();
    }
    return pos;
}

// 元に戻す
function undoCommand(){
    if(clickCounter == 0) return;
    let targetIndex = Math.ceil(clickCounter / 5.0) - 1;
    for(let i = 0; i < 5; i++){
        checkBox[targetIndex][i] = 0;
    }
    // clickCounterを調整する
    clickCounter = targetIndex * 5;
    // 表示セルを白にする
    if(clickCounter == 5 * targetIndex) fillColor = colorName[targetIndex];
    for(let i = 0; i < maxRow; i++){
        for(let j = 0; j < maxCol; j++){
            // チェックターゲット
            let pos = i.toString() + IdSeparator + j.toString();
            let colorCheck = document.getElementById(pos).style.backgroundColor.toLowerCase();
            if(colorCheck == fillColor){
                document.getElementById(pos).style.backgroundColor = colorWhite;
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

    // 元に戻す
    let undoButton = document.getElementById('undo');
    undoButton.addEventListener('click', function(event){
        undoCommand();
    });
}


// HTML読み込み後、自動実行
function onLoad(){
    // ビューポートの設定
    //UpdateViewport();

    // 問題選択肢作成
    for(let i = 2; i <= numberDataArray.length; i++){
        let option = document.createElement("option");
        option.text = i;
        option.value = i;
        // selectタグの子要素にoptionタグを追加する
        dataNumber.appendChild(option);
    }

    // 迷路の動的作成
    drawingTable();

    // ボタンアクション
    makeButtonAction();
}

// 問題表示
function drawingTable(){
    // 成功イメージエリア削除
    let parent = document.getElementById('successImage');
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
    numberData = numberDataArray[dataNo - 1];
    checkBox = checkBoxArray[dataNo - 1];
    groupNumber = groupNumberArray[dataNo - 1];
    maxRow = numberData.length;
    maxCol = numberData[0].length;

    // 表示サイズの計算
    zoomCalc();

    // 問題の動的作成
    makeTable('mainScreen');
}

// 初期化
function resetData(){
    // カウント
    clickCounter = 0;

    // 塗りつぶす初期色 YellowGreen
    fillColor = colorName[0];

    // チェックボックス
    for(let i = 0; i < groupNumber; i++){
      for(let j = 0; j < 5; j++){
          checkBox[i][j] = 0;
      }
    }

    // 成功画像非表示
    let si = document.getElementById('successImage');
    si.style.display = 'none';

    // undoボタン有効化
    let undoButton = document.getElementById('undo');
    undoButton.disabled = false;
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

    // 成功イメージ
    let successImageDiv = document.getElementById('successImage');
    successImageDiv.style.display = 'none';
    let img = document.createElement('img');
    img.setAttribute('id', 'simage');
    img.src = SuccessImageSrc;
    img.style.height = (gridw * zoom * 0.5).toString() + 'px';
    img.style.width = (gridw * zoom * 0.5).toString() + 'px';
    successImageDiv.appendChild(img);
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
