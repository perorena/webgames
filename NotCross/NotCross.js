const OuterThickness = 3;
const InnerThickness = 1;
const NumberMojiSize = '50';
const MessageMojiSize = '25';
const IdSeparator = '#';
const SuccessImageSrc = '../img/Success2.png';

// 色の設定
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
// ルートナンバー
let rootNumber;

// ズーム値
let zoom = 1.0;

// Webページのロードが完了した後に呼び出されるロードイベントを設定する
window.addEventListener("load", onLoad, false);

// グリッドの動的作成
function makeTable(parentId){
    // グリッドの作成開始
    let rows=[];
    let table = document.createElement('table');
    table.setAttribute('id', 'numberGrid');

    // グリッドに2次元配列の要素を格納（i:Row j:Col）
    for(let i = 0; i < maxRow; i++){
        rows.push(table.insertRow(-1));  // -1を指定すると最終行に追加する tr
        for(let j = 0; j < maxCol; j++){
            let cell = rows[i].insertCell(-1);  // -1を指定すると最終セルに追加する td
            //cell.appendChild(document.createTextNode(numberData[i][j]));  // 表示文字設定
            // グリッドの設定
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
            cell.style.fontSize = NumberMojiSize.toString() + 'px';   // 文字サイズ
            //cell.textContent = numberData[i][j];
            
            // 【修正】標準でvalueを持たないtd要素で安全に値を保持するため dataset を使用
            cell.dataset.value = numberData[i][j];

            // 開始セルや壁の設定
            let sg = numberData[i][j].substr(0,1);
            if(sg == 'S' || sg == 'G'){
                let colorIndex = parseInt(numberData[i][j].substr(1,1));
                cell.style.backgroundColor = colorName[colorIndex - 1];
                checkBox[i][j] = numberData[i][j];
                cell.textContent = sg;
            } else if(sg == '0'){
                cell.style.backgroundColor = 'black';
            }

            // グリッドのセル（tdタグ）にidを割り振る
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

// グリッドクリック
function numberClick(target){
    //let sg = target.textContent.substr(0,1);
    // 【修正】target.value から target.dataset.value に変更
    //console.log('>>>>>target value:[' + target.dataset.value + ']');
    let sg = target.dataset.value.substr(0,1);
    if( sg == '0') return;
    let pos = target.id.split(IdSeparator);
    let cName = target.style.backgroundColor.toLowerCase();     // 小文字へ変換
    if(sg == 'S' || sg == 'G'){
        fillColor = cName;
        // 【修正】target.value から target.dataset.value に変更
        rootNumber = target.dataset.value.substr(1,1);
    }
    //console.log('target text:[' + target.dataset.value + ']');
    //console.log('クリックしたセルの色:' + cName + '  :' + target.id);
    //console.log('ルート(選択)色:' + fillColor + ' ルートナンバー:' + rootNumber);
    // 白セルにしか処理を行わない
    if(cName == colorWhite){
        //console.log('pos:[' + pos + ']');
        // ルートナンバー
        checkBox[pos[0]][pos[1]] = rootNumber;
        // 数値セルの色付け
        target.style.backgroundColor = fillColor;
    }

    //console.log('checkBox__:' + checkBox);
    //console.log('numberData:' + numberData);
    // 判定
    // チェックフラグ（true:完成 false:未完成）
    let checkFlag = true;
    for(let i = 0; i < maxRow; i++){
        for(let j = 0; j < maxCol; j++){
            // チェック
            if (numberData[i][j] != checkBox[i][j]){
                checkFlag = false;
                //console.log('[i][j]:' + i + '   ' + j);
                //console.log('numberData[i][j]:' + numberData[i][j]);
                //console.log('checkBox[i][j]:' + checkBox[i][j]);
            }
        }
    }

    // 完成！
    if(checkFlag == true){
        let simg = document.getElementById('simage');
        let si = document.getElementById('successImage');
        si.style.display = 'block';
        //let resetButton = document.getElementById('reset');
        //resetButton.disabled = true;
    }
}

// ボタンアクション設定
function makeButtonAction(){
    // やり直す
    let resetButton = document.getElementById('reset');
    resetButton.addEventListener('click', function(event){
        drawingTable();
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

    // 問題設定
    dataNo = parseFloat (dataNumber.value);
    numberData = numberDataArray[dataNo - 1];
    checkBox = checkBoxArray[dataNo - 1];
    maxRow = numberData.length;
    maxCol = numberData[0].length;

    // 初期化
    resetData();

    // 表示サイズの計算
    zoomCalc();

    // 問題の動的作成
    makeTable('mainScreen');  
}

// 初期化
function resetData(){
    // 塗りつぶしカウント
    clickCounter = 0;
    // 塗りつぶす初期色 White
    fillColor = colorWhite;
    // ルートナンバー初期値
    rootNumber = 0;

    // チェックボックス
    for(let i = 0; i < maxRow; i++){
      for(let j = 0; j < maxCol; j++){
          checkBox[i][j] = 0;
      }
    }

    // 成功画像非表示
    let si = document.getElementById('successImage');
    si.style.display = 'none';
}

// 表示倍率計算
function zoomCalc(){
    // 表示サイズの計算
    let mainScreen = document.getElementById('mainScreen');
    let bw = window.innerWidth;
    let bh = window.innerHeight - 180;
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
