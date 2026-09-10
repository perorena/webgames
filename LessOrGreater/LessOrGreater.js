const OuterThickness = 1;
const NumberMojiSize = '50';
const MessageMojiSize = '25';
const IdSeparator = '#';
const SuccessImageSrc = '../img/Success1.png';

// 問題データ指定
let dataNumber = document.getElementById("dataNumber");

// 問題変更時のイベントリスナー
dataNumber.addEventListener("change", drawingTable);

// 問題番号
let dataNo;

// データの個数
let maxRow;
let maxCol;

// 不等号背景表示用
let inequalityView;

// 入力ボックスのid保持用リスト
let inputList = [];
let inputListCount;

// 入力最大値
let inputMax;

// ズーム値
let zoom = 1.0;

// Webページのロードが完了した後に呼び出されるロードイベントを設定する
window.addEventListener("load", onLoad, false);

// キーが押されたときのリスナー
document.addEventListener('keyup', keyUp, false);

// 不等号正解チェック
function inequalityDataCheck(){
    let intAllClear = 0;

    // 不等号に2次元配列の要素を格納
   for(let i = 0; i < maxRow; i = i + 2){
        for(let j = 0; j < maxCol - 2; j = j + 2){
            let strData1 = inequalityData[i][j].toString();
            let strInequality = inequalityData[i][j + 1].toString();
            let strData2 = inequalityData[i][j + 2].toString();
            let intData1 = parseInt(strData1);
            let intData2 = parseInt(strData2);
            // テーブルのセル（tdタグ）を取り出す
            let idString = i.toString() + IdSeparator + (j + 1).toString();

            // 入力セル
            if(strData1 == "0" || strData2 == "0"){
                // 不等号背景を白
                let cell = document.getElementById(idString);
                cell.style.backgroundColor = 'White';
                continue;
            }
            // 数字ではない
            if(isNaN(intData1) || isNaN(intData2)){
                let cell = document.getElementById(idString);
                cell.style.backgroundColor = 'White';
                continue;
            }
            // 1～5以外
            if(intData1 < 0 || intData1 > inputMax){
                // 不等号背景を白
                let cell = document.getElementById(idString);
                cell.style.backgroundColor = 'White';
                continue;
            }
            // 1～5以外
            if(intData2 < 0 || intData2 > inputMax){
                // 不等号背景を白
                let cell = document.getElementById(idString);
                cell.style.backgroundColor = 'White';
               continue;
            }
            // 数値の大小チェック
            let flag = false;
            switch(strInequality){
                case "L":
                    if (intData1 > intData2) flag = true;
                    break;
                case "R":
                    if (intData1 < intData2) flag = true;
                    break;
            }
            // 正解の不等号背景を青色へ
            if(flag){
                // 不等号背景を青
                let cell = document.getElementById(idString);
                cell.style.backgroundColor = 'LightBlue';
                intAllClear = intAllClear + 1;
            } else {
                // 不等号背景を白
                let cell = document.getElementById(idString);
                cell.style.backgroundColor = 'White';
            }
        }
    }

    // 列方向チェック（iは行を変える、jは列を変える）
    for(let i = 0; i < maxRow - 2; i = i + 2){
        for(let j = 0; j < maxCol; j = j + 2){
            let strData1 = inequalityData[i][j].toString();
            let strInequality = inequalityData[i + 1][j].toString();
            let strData2 = inequalityData[i + 2][j].toString();
            let intData1 = parseInt(strData1);
            let intData2 = parseInt(strData2);
            // テーブルのセル（tdタグ）を取り出す
            let idString = (i + 1).toString() + IdSeparator + j.toString();

            // 入力セル
            if(strData1 == "0" || strData2 == "0"){
                // 不等号背景を白
                let cell = document.getElementById(idString);
                cell.style.backgroundColor = 'White';
                continue;
            }
            // 数字ではない
            if(isNaN(intData1) || isNaN(intData2)){
                // 不等号背景を白
                let cell = document.getElementById(idString);
                cell.style.backgroundColor = 'White';
                continue;
            }
            // 1～5以外
            if(intData1 < 0 || intData1 > inputMax){
                // 不等号背景を白
                let cell = document.getElementById(idString);
                cell.style.backgroundColor = 'White';
                continue;
            }
            // 1～5以外
            if(intData2 < 0 || intData2 > inputMax){
                // 不等号背景を白
                let cell = document.getElementById(idString);
                cell.style.backgroundColor = 'White';
                continue;
            }
            // 数値の大小チェック
            let flag = false;
            switch(strInequality){
                case "U":
                    if (intData1 > intData2) flag = true;
                    break;
                case "D":
                    if (intData1 < intData2) flag = true;
                    break;
            }

            if(flag){
                // 不等号背景を青
                let cell = document.getElementById(idString);
                cell.style.backgroundColor = 'LightBlue';
                intAllClear = intAllClear + 1;
            } else {
                // 不等号背景を白
                let cell = document.getElementById(idString);
                cell.style.backgroundColor = 'White';
            }
        }
    }

    //各行、各列で同じ数字が使われていないかチェック
    let hintMessageDiv = document.getElementById('hintMessage');
    hintMessageDiv.style.display = 'none';

    let hasDuplicate = false; // 重複フラグを導入（即リターンせず、最後まで処理を通すため）

    // 隣同士の数字しかチェックしていないのでダメ！
    // 行方向チェック（iは行を変える、jkは列を変える）
    for(let i = 0; i < maxRow; i = i + 2){
        for(let j = 0; j < maxCol; j = j + 2){
            let strCheckData = inequalityData[i][j].toString();
            if(strCheckData == "0") continue;
            let intCheckData = parseInt(strCheckData);
            if(!isNaN(intCheckData)){
                for(let k = 0; k < inequalityData[0].length; k = k + 2){
                    if(j == k) continue;
                    let strData1 = inequalityData[i][k].toString();
                    if(strData1 == "0") continue;
                    let intData1 = parseInt(strData1);
                    if(!isNaN(intData1)){
                        if(intData1 == intCheckData){
                            hasDuplicate = true; // フラグを立てる
                        }
                    }
                }
            }
        }
    }
    // 列方向チェック（iは行を変える、jは列を変える）
    for(let j = 0; j < maxCol; j = j + 2){
        for(let i = 0; i < maxRow; i = i + 2){
            let strCheckData = inequalityData[i][j].toString();
            if(strCheckData == "0") continue;
            let intCheckData = parseInt(strCheckData);
            if(!isNaN(intCheckData)){
                for(let k = 0; k < inequalityData.length; k = k + 2){
                    if(i == k) continue;
                    let strData1 = inequalityData[k][j].toString();
                    if(strData1 == "0") continue;
                    let intData1 = parseInt(strData1);
                    if(!isNaN(intData1)){
                        if (intData1 == intCheckData)
                        {
                            hasDuplicate = true; // フラグを立てる
                        }
                    }
                }
            }
        }
    }

    // 重複があった場合のメッセージ表示
    if (hasDuplicate) {
        hintMessageDiv.style.display = 'block';
        return; // 重複がある場合はクリア判定へ進まない
    }

    /*
    // 隣同士の数字しかチェックしていないのでダメ！
    // 行方向チェック（iは行を変える、jkは列を変える）
    for(let i = 0; i < maxRow; i = i + 2){
        for(let j = 0; j < maxCol; j = j + 2){
            let strCheckData = inequalityData[i][j].toString();
            if(strCheckData == "0") continue;
            let intCheckData = parseInt(strCheckData);
            if(!isNaN(intCheckData)){
                for(let k = 0; k < inequalityData[0].length; k = k + 2){
                    if(j == k) continue;
                    let strData1 = inequalityData[i][k].toString();
                    if(strData1 == "0") continue;
                    let intData1 = parseInt(strData1);
                    if(!isNaN(intData1)){
                        if(intData1 == intCheckData){
                            hintMessageDiv.style.display = 'block';
                            return;
                        }
                    }
                }
            }
        }
    }
    // 列方向チェック（iは行を変える、jは列を変える）
    for(let j = 0; j < maxCol; j = j + 2){
        for(let i = 0; i < maxRow; i = i + 2){
            let strCheckData = inequalityData[i][j].toString();
            if(strCheckData == "0") continue;
            let intCheckData = parseInt(strCheckData);
            if(!isNaN(intCheckData)){
                for(let k = 0; k < inequalityData.length; k = k + 2){
                    if(i == k) continue;
                    let strData1 = inequalityData[k][j].toString();
                    if(strData1 == "0") continue;
                    let intData1 = parseInt(strData1);
                    if(!isNaN(intData1)){
                        if (intData1 == intCheckData)
                        {
                            hintMessageDiv.style.display = 'block';
                            return;
                        }
                    }
                }
            }
        }
    }
    */

    // 判定
    if(intAllClear == inequalityNum){
        let si = document.getElementById('successImage');
        si.style.display = 'block';
        //let resetButton = document.getElementById('reset');
        //resetButton.disabled = true;
    }
}

// キーが押されたとき
function keyUp(event){
    for(let i = 0; i < inputList.length; i++){
        // 半角数字のみ入力可能
        let inpData = parseInt(document.getElementById(inputList[i]).value);
        if(isNaN(inpData) || inpData < 1 || inpData > inputMax){
            // 数字以外、範囲外数字(0や22など)の制限が必要、
            document.getElementById(inputList[i]).value = '';
        }
        // 入力データをInequalityDataに反映
        let idString = inputList[i].substr(3);
        let id = idString.split(IdSeparator);
        if(document.getElementById(inputList[i]).value == ''){
            inequalityData[id[0]][id[1]] = '0';
        } else {
            inequalityData[id[0]][id[1]] = document.getElementById(inputList[i]).value;
        }
    }
    // 不等号正解チェック
    inequalityDataCheck();
}

// 不等号グリッドの動的作成
function makeTable(parentId){
    // 不等号グリッドの作成開始inequalityGrid
    let rows=[];
    let table = document.createElement('table');
    table.setAttribute('id', 'inequality');

    // 不等号に2次元配列の要素を格納
    for(let i = 0; i < maxRow; i++){
        rows.push(table.insertRow(-1));
        for(let j = 0; j < maxCol; j++){
            let cell = rows[i].insertCell(-1);
            // 不等号背景色のデータ用と入力位置用id
            let idString = i.toString() + IdSeparator + j.toString();
            // 枠の設定
            cell.style.borderStyle = 'solid';
            cell.style.borderLeftWidth = '0px';
            cell.style.borderTopWidth = '0px';
            cell.style.borderRightWidth = '0px';
            cell.style.borderBottomWidth = '0px';
            cell.setAttribute('id', idString);
            let strData = inequalityData[i][j].toString();
            let intNum = parseInt(strData);
            cell.style.fontSize = NumberMojiSize.toString() + 'px';
            // 不等号や数字などを出力するdivタグ
            let inequality = document.createElement('div');
            if(isNaN(intNum)){
                // 不等号
                if(strData != ' '){
                    // 不等号の背景色の管理
                    inequalityView[idString] = 'White';
                    // 不等号の表示
                    if(strData == 'L'){
                        inequality.textContent = '>';
                    }
                    if(strData == 'R'){
                        inequality.textContent = '<';
                    }
                    if(strData == 'U'){
                        inequality.textContent = '>';
                        inequality.style.transform = 'rotate(90deg)';
                    }
                    if(strData == 'D'){
                        inequality.textContent = '<';
                        inequality.style.transform = 'rotate(90deg)';
                    }
                } else {
                    // 空白部分
                    cell.style.backgroundColor = 'white';
                }
            } else {
                cell.style.backgroundColor = 'palegreen';
                cell.style.borderLeftWidth = OuterThickness.toString() + 'px';
                cell.style.borderTopWidth = OuterThickness.toString() + 'px';
                cell.style.borderRightWidth = OuterThickness.toString() + 'px';
                cell.style.borderBottomWidth = OuterThickness.toString() + 'px';
                if(intNum == 0){
                    // 0なら入力可能にする
                    let inputId = 'inp' + idString;
                    let input = document.createElement('input');
                    input.type = 'number';
                    input.autocomplete = 'off';
                    input.min = '1';
                    input.max = inputMax;
                    input.style.fontSize = NumberMojiSize.toString() + 'px';
                    input.setAttribute('id', inputId);
                    input.setAttribute('class', 'input');
                    inequality.appendChild(input);
                    // idをリストに保持する
                    inputList[inputListCount] = inputId;
                    inputListCount = inputListCount + 1;
                } else {
                    // 数字表示
                    inequality.textContent = inequalityData[i][j];
                }
            }
            cell.appendChild(inequality);
        }
    }
    // 指定したdiv要素に迷路を加える
    document.getElementById(parentId).appendChild(table);
    // 不等号正解チェック
    inequalityDataCheck();
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
    for(let i = 2; i <= inequalityDataArray.length; i++){
        let option = document.createElement("option");
        option.text = i;
        option.value = i;
        // selectタグの子要素にoptionタグを追加する
        dataNumber.appendChild(option);
    }

    // ヒントメッセージ
    let hintMessageDiv = document.getElementById('hintMessage');
    hintMessageDiv.style.display = 'none';
    hintMessageDiv.style.color = 'red';
    hintMessageDiv.textContent = '間違いがあります。確認しましょう！';

    // 不等号グリッドの動的作成
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
    // ポインターコピーなので、元データも書き換わってしまう
    // JavaScriptでは、配列はオブジェクトの一つであり、オブジェクトは参照渡しになるため、配列も参照渡しになります。
    // したがって、変数にはオブジェクトの参照が格納されています。
    // × inequalityData = inequalityDataArray[dataNo - 1];
    // × inequalityData = inequalityDataArray[dataNo - 1].slice();
    // ◎ inequalityData = copyMatrix(inequalityDataArray[dataNo - 1]);
    inequalityData = JSON.parse(JSON.stringify(inequalityDataArray[dataNo - 1]));
    inequalityNum = inequalityNumArray[dataNo - 1];
    maxRow = inequalityData.length;
    maxCol = inequalityData[0].length;

    // 入力最大値
    inputMax = 3;
    if(inequalityNum == 24){
        inputMax = 4;
    } else if(inequalityNum == 40){
        inputMax = 5;
    } else if(inequalityNum == 60){
        inputMax = 6;
    } else if(inequalityNum == 84){
        inputMax = 7;
    } else if(inequalityNum == 112){
        inputMax = 8;
    } else if(inequalityNum == 144){
        inputMax = 9;
    }

    // 表示サイズの計算
    zoomCalc();

    // 問題の動的作成
    makeTable('mainScreen');
}

// 初期化
function resetData(){
    // 不等号背景表示用
    inequalityView = [];

    // 入力ボックスのid保持用リスト
    inputList = [];
    inputListCount = 0;

    // 成功画像非表示
    let si = document.getElementById('successImage');
    si.style.display = 'none';
}

// 二次元配列をコピーする
function copyMatrix(base) {
  const result = [];
  for (const line of base) {
    result.push([...line]);   // spread演算子 スプレッド構文 (...)
  }
  return result;
}

// 表示倍率計算
function zoomCalc(){
    // 表示サイズの計算
    let mainScreen = document.getElementById('mainScreen');
    let bw = window.innerWidth;
    let bh = window.innerHeight - 200;          //200は表題やボタンなどの縦幅による
    let gridw = (inequalityData[0].length + 1) * 100;
    let gridh = (inequalityData.length + 1) * 100;
    //alert("inequalityData[0].length=" + inequalityData[0].length + "   inequalityData.length=" + inequalityData.length)

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
