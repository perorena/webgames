const OuterThickness = 3;
const InnerThickness = 1;
const NumberMojiSize = '50';
const MessageMojiSize = '25';
const IdSeparator = '#';
const SuccessImageSrc = '../img/Success2.png';

// 色の設定
const colorWhite = 'white';
const colorName = ['yellowgreen', 'plum', 'yellow', 'aqua', 'pink', 'lightskyblue', 'orange', 'springgreen', 'purple', 'peru',
'mistyrose', 'magenta', 'sandybrown', 'cadetblue', 'chartreuse', 'orangered', 'olive', 'firebrick', 'indigo', 'dimgray',
'mediumseagreen', 'lavender', 'darkkhaki', 'blue', 'darkslategray'];

// 問題データ指定
let dataNumber = document.getElementById("dataNumber");

// 問題変更時のイベントリスナー
dataNumber.addEventListener("change", drawingTable);

// 問題番号
let dataNo;

// データの個数
let maxRow;
let maxCol;

// 塗りつぶし色
let fillColor;

// 選択色
let selectedColor;

// 確定色変更カウント
let colorCounter;

// 範囲位置
let areaClickFlag;
let clickStart;
let clickEnd;
let colClickStart;
let rowClickStart;
let colClickEnd;
let rowClickEnd;

// 選択可能フラグ（true:OK   flase:NG）
let selectedFlag;

// セル色保存用（連想配列）、直前の背景色を保存
let buttonColor = {};

// ズーム値（タッチ操作で利用）
let zoom = 1.0;
let tableX = 0.0;
let tableY = 0.0;

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
            let cell = rows[i].insertCell(-1)
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
            if(numberData[i][j] != 0) cell.textContent = numberData[i][j];

            // 数字グリッドのセル（tdタグ）にidを割り振る
            let idString = i.toString() + IdSeparator + j.toString();
            cell.setAttribute('id', idString);
            // すべてのセルにタッチイベントとクリック
            cell.addEventListener('touchstart', function(event){
                let clientX = event.changedTouches[0].clientX;
                let clientY = event.changedTouches[0].clientY;
                event.preventDefault();
                numberGridStart(event.target, getCellId(clientX, clientY));
            });
            cell.addEventListener('touchmove', function(event){
                let clientX = event.changedTouches[0].clientX;
                let clientY = event.changedTouches[0].clientY;
                event.preventDefault();
                numberGridMove(event.target, getCellId(clientX, clientY));
            });
            cell.addEventListener('touchend', function(event){
                let clientX = event.changedTouches[0].clientX;
                let clientY = event.changedTouches[0].clientY;
                event.preventDefault();
                numberGridEnd(event.target, getCellId(clientX, clientY));
            });
            cell.addEventListener('mousedown', function(event){
                let clientX = event.clientX;
                let clientY = event.clientY;
                event.preventDefault();
                numberGridStart(event.target, event.target.id);
            });
            cell.addEventListener('mousemove', function(event){
                let clientX = event.clientX;
                let clientY = event.clientY;
                event.preventDefault();
                numberGridMove(event.target, event.target.id);
            });
            cell.addEventListener('mouseup', function(event){
                let clientX = event.clientX;
                let clientY = event.clientY;
                event.preventDefault();
                numberGridEnd(event.target, event.target.id);
            });
        }
    }
    // 指定したdiv要素に迷路を加える
    document.getElementById(parentId).appendChild(table);
    let pos = document.getElementById('numberGrid');
    //tableX = pos.getBoundingClientRect().left * zoom;
    //tableY = pos.getBoundingClientRect().top * zoom;
    tableX = pos.getBoundingClientRect().left;
    tableY = pos.getBoundingClientRect().top;
}

// セル位置（タッチ操作時に利用）
function getCellId(x, y){
    //let w = 100 * zoom;
    //let h = 100 * zoom;
    let w = 100;
    let h = 100;
    let row = '';
    let col = '';
    let pos = '';
    for(let i = 0; i < maxRow; i++){
        for(let j = 0; j < maxCol; j++){
            if((tableX + 2 + w * j) < x && x < (tableX + 2 + w * (j + 1))){
                col = j;
            }
            if((tableY + 2 + h * i) < y && y < (tableY + 2 + h * (i + 1))){
                row = i;
            }
        }
    }
    pos = row.toString() + IdSeparator + col.toString();
    return pos;
}

// 選択開始
function numberGridStart(target, targetId){
    // ターゲット背景色
    let cName = target.style.backgroundColor.toLowerCase();     // 小文字へ変換

    if(areaClickFlag){
        // マウス利用時の選択終了
    } else if(areaClickFlag == false && cName == colorWhite){
        // 選択開始処理（白セルにしか処理を行わない）
        // 選択開始位置保持
        clickStart = targetId;
        let start = clickStart.split(IdSeparator);
        rowClickStart = parseInt(start[0]);
        colClickStart = parseInt(start[1]);

        // 選択開始時の色を保持
        for(let i = 0; i < maxRow; i++){
            for(let j = 0; j < maxCol; j++){
                let pos = i.toString() + IdSeparator + j.toString();
                let beforeColor = document.getElementById(pos).style.backgroundColor.toLowerCase();
                buttonColor[pos] = beforeColor;
            }
        }
        // 選択開始
        areaClickFlag = true;
    }
}

// 選択中
function numberGridMove(target, targetId){
    if(areaClickFlag == true){
        // 範囲内のセル数
        let areaCellCounter = 0;

        // 範囲内の数値設定
        let areaNumber = 0;

        // 全体をエリア選択直前の色に変える、選択フラグも可能にする
        allAreaBeforeColor();

        // 選択エリアに色を付ける
        clickEnd = targetId;
        let end = clickEnd.split(IdSeparator);
        rowClickEnd = parseInt(end[0]);
        colClickEnd = parseInt(end[1]);

        let colStart = colClickStart;
        let colEnd = colClickEnd;
        let rowStart = rowClickStart;
        let rowEnd = rowClickEnd;

        if(colClickStart > colClickEnd){
            colStart = colClickEnd;
            colEnd = colClickStart;
        }
        if(rowClickStart > rowClickEnd){
            rowStart = rowClickEnd;
            rowEnd = rowClickStart;
        }

        for(let i = rowStart; i < rowEnd + 1; i++){
            for(let j = colStart; j < colEnd + 1; j++){
                let pos = i.toString() + IdSeparator + j.toString();
                let checkColor = document.getElementById(pos).style.backgroundColor.toLowerCase();
                if(checkColor == colorWhite || checkColor == selectedColor){
                    areaCellCounter = areaCellCounter + 1;
                    document.getElementById(pos).style.backgroundColor = selectedColor;
                } else {
                    // 白以外の色を選択した場合はNG
                    selectedFlag = false;
                }
                // 選択範囲に数字があるか
                // 数字は一つだけか
                let num = document.getElementById(pos).textContent;
                if (num == null) num = "0";
                let checkNum = parseInt(num);
                if(checkNum > 0){
                    if(areaNumber > 0){
                        // 範囲内に数字だ２個以上
                        selectedFlag = false;
                    } else {
                        areaNumber = checkNum;
                    }
                }
            }
        }
        // 範囲内に数字がない
        if(areaNumber == 0) selectedFlag = false;

        // 範囲内の数字と選択セル数が同じかどうか
        if(selectedFlag == true)
        {
            if(areaCellCounter != areaNumber) selectedFlag = false;
        }
    }
}

// 選択終了
function numberGridEnd(target, targetId){
    // ターゲット背景色
    let cName = target.style.backgroundColor.toLowerCase();     // 小文字へ変換

    if(areaClickFlag == true){
        // 選択確定処理
        if(selectedFlag == false){
            // 選択ができない場合の処理
            // 全体をエリア選択直前の色に変える
            allAreaBeforeColor();
        } else {
            // 確定色の設定
            for(let k = 1; k < colorName.length; k++){
                if (colorCounter == k) fillColor = colorName[k];
            }

            // 選択したをエリアを確定色にする
            for(let i = 0; i < maxRow; i++){
                for(let j = 0; j < maxCol; j++){
                    let pos = i.toString() + IdSeparator + j.toString();
                    let beforeColor = document.getElementById(pos).style.backgroundColor.toLowerCase();
                    if(beforeColor == selectedColor){
                        buttonColor[pos] = fillColor;
                        document.getElementById(pos).style.backgroundColor = fillColor;
                    }
                }
            }
            // 次の色のためのカウント
            colorCounter = colorCounter + 1;
        }
        // 選択解除
        areaClickFlag = false;

        // 完成！
        if(successCheck() == true){
            let simg = document.getElementById('simage');
            let si = document.getElementById('successImage');
            si.style.display = 'block';
            //let resetButton = document.getElementById('reset');
            //resetButton.disabled = true;
            let undoButton = document.getElementById('undo');
            undoButton.disabled = true;
        }
    }
}

// 全体をエリア選択直前の色に変える
function allAreaBeforeColor(){
    selectedFlag = true;    // 選択可能フラグを可能にする
    for(let i = 0; i < maxRow; i++){
        for(let j = 0; j < maxCol; j++){
            let pos = i.toString() + IdSeparator + j.toString();
            let beforeColor = document.getElementById(pos).style.backgroundColor.toLowerCase();
            document.getElementById(pos).style.backgroundColor = buttonColor[pos];
        }
    }
}

// すべてのセルが白で無くなったとき完成
function successCheck()
{
    let check = true;
    for(let i = 0; i < maxRow; i++){
        for(let j = 0; j < maxCol; j++){
            let pos = i.toString() + IdSeparator + j.toString();
            let color = document.getElementById(pos).style.backgroundColor.toLowerCase();
            if (color == colorWhite) check = false;
        }
    }
    return check;
}

// 元に戻す
function undoCommand(){
    // 表示セルを白にする
    // fillColor(塗り潰し色)と同じだったら白くする
    if(colorCounter == 0) return;
    colorCounter = colorCounter - 1;
    fillColor = colorName[colorCounter];
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
    // やり直し
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
    maxRow = numberData.length;
    maxCol = numberData[0].length;

    // 表示サイズの計算
    zoomCalc();

    // 問題の動的作成
    makeTable('mainScreen');  
}

// 初期化
function resetData(){
    // 塗りつぶす初期色 YellowGreen
    fillColor = colorName[0];

    // 選択色
    selectedColor = 'lightgray';

    // 確定色変更カウント
    colorCounter = 0;

    // 範囲位置
    areaClickFlag = false;
    clickStart = '';
    clickEnd = '';
    colClickStart = 0;
    rowClickStart = 0;
    colClickEnd = 0;
    rowClickEnd = 0;

    // 選択可能フラグ（true:OK   flase:NG）
    selectedFlag = true;

    // セル色保存用（連想配列）、直前の背景色を保存
    buttonColor = {};

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
    let bh = window.innerHeight - 200;          //200は表題やボタンなどの縦幅による
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
