const OuterThickness = 3;
const InnerThickness = 1;
const NumberMojiSize = '50';
const MessageMojiSize = '25';
const IdSeparator = '#';
const SuccessImageSrc = '../img/Success2.png';

// 色の設定
const colorRed = 'red';
const colorBlack = 'black';
const colorWhite = 'white';
const colorName = ['yellowgreen', 'plum', 'yellow', 'aqua', 'pink', 'lightskyblue', 'orange', 'springgreen', 'purple', 'peru', 'mistyrose',
'magenta', 'sandybrown', 'cadetblue', 'chartreuse', 'orangered', 'olive', 'firebrick', 'indigo', 'dimgray', 'mediumseagreen',
'lime', 'steelblue', 'deeppink', 'khaki', 'darkviolet', 'darkgreen', 'navy', 'maroon', 'slategray'];

// 問題データ指定
let dataNumber = document.getElementById("dataNumber");

// 問題変更時のイベントリスナー
dataNumber.addEventListener("change", drawingTable);

// 問題番号
let dataNo;

// データ個数
let maxRow;   //行数
let maxCol;   //列数

// カウント
let numberCounter;
let tenCounter;
let overFlag;
let minusFlag;
// 塗りつぶす色
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
            cell.style.borderColor = colorBlack;
            cell.value = numberData[i][j];
            if(numberData[i][j] < 0){
                // 赤文字
                cell.style.color = colorRed;
                //cell.textContent = String(numberData[i][j]).substring(1);
                cell.textContent = numberData[i][j];
            } else {
                cell.textContent = numberData[i][j];
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
    let cName = target.style.backgroundColor.toLowerCase();
    if(cName == colorWhite){
        if(numberCounter % 10 != 0){
            // クリックしたセルの位置取得
            let pos = target.id;
            let rc = pos.split(IdSeparator);
            let row = parseInt(rc[0]);
            let col = parseInt(rc[1]);

            //上下左右のセル
            let posUp = positionCheck(row - 1, col);
            let posDown = positionCheck(row + 1, col);
            let posLeft = positionCheck(row, col - 1);
            let posRight = positionCheck(row, col + 1);
            let sideFlag = false;
            if(posUp.length > 0){
                let colorUp = document.getElementById(posUp).style.backgroundColor.toLowerCase();
                if(fillColor == colorUp){
                    sideFlag = true;
                }
            }
            if(posDown.length > 0){
                let colorDown = document.getElementById(posDown).style.backgroundColor.toLowerCase();
                if(fillColor == colorDown){
                    sideFlag = true;
                }
            }
            if(posLeft.length > 0){
                let colorLeft = document.getElementById(posLeft).style.backgroundColor.toLowerCase();
                if(fillColor == colorLeft){
                    sideFlag = true;
                }
            }
            if(posRight.length > 0){
                let colorRight = document.getElementById(posRight).style.backgroundColor.toLowerCase();
                if(fillColor == colorRight){
                    sideFlag = true;;
                 }
            }

            if (sideFlag == false){
                target.style.backgroundColor = colorWhite;
                return;
            }
        }

        // 同じ色での足し算
        let num = target.value;
        if (num < 0) minusFlag = true;
        tenCounter = tenCounter + parseInt(num);
        if (tenCounter > 10){
            overFlag = true;
            tenCounter = tenCounter - parseInt(num);
            return;
        } else {
            overFlag = false;
        }
/*
        if (tenCounter > 19){ //次の色に行く前に強制離脱か？
            tenCounter = tenCounter - parseInt(num);
            overFlag = true;
            return;
        } else if (tenCounter > 10){
            overFlag = true;
            if(dataNo < 51){
                tenCounter = tenCounter - parseInt(num);
                return;
            }
        } else {
            overFlag = false;
        }
*/
        numberCounter = numberCounter + parseInt(num);

        // 数値セルの色付け
        target.style.backgroundColor = fillColor;

        for(let k = 1; k < colorName.length; k++){
            if (numberCounter == k * 10) fillColor = colorName[k];
        }
        if (numberCounter % 10 == 0 && tenCounter != 0){
            tenCounter = 0;
            minusFlag = false;
        }

        // 完成！
        if (numberCounter == groupNumber * 10){
            let si = document.getElementById('successImage');
            si.style.display = 'block';
            //let resetButton = document.getElementById('reset');
            //resetButton.disabled = true;
            let undoButton = document.getElementById('undo');
            undoButton.disabled = true;
        }
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
    //直前の塗り潰しを白にする
    if(numberCounter == 0) return;
    let target = Math.ceil(numberCounter / 10.0) - 1;
    if(tenCounter <= 0 && minusFlag == true){
        target = target + 1;
    }
    if(overFlag == true){
        overFlag = false;
        target = target - 1;
    }
    numberCounter = target * 10;
    tenCounter = 0;
    if( minusFlag == true)  minusFlag = false;
    if(numberCounter == 10 * target) fillColor = colorName[target];
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
        //location.reload();
        //google.script.run
        //  .withSuccessHandler(registSuccess)
        //  .withFailureHandler(registFailure)
        //  .getAppUrl();
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

    // 問題の動的作成
    //makeTable('mainScreen');
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
    numberCounter = 0;
    tenCounter = 0;
    overFlag = false;
    minusFlag = false;

    // 塗りつぶす初期色 YellowGreen
    fillColor = colorName[0];

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
