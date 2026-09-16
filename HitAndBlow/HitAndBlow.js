const OuterThickness = 2;
const DivisionThickness = 7;
const NumberMojiSize = '35';
const IdSeparator = '#';
const CellWidth = 50;
const CellHeight = 50;
const QuestionForComp = 'que';      // コンピュ―タ―への問題入力
const MyAnswer = 'ans';             // 解答入力
const NumberButton = 'num';
const HistoryRowMax = 12;

// 桁数指定
//let digitNumber = document.getElementById('digitNumber');
// 問題変更時のイベントリスナ―
//digitNumber.addEventListener('change', drawingTable);
let digitNumber = document.getElementsByName('digitNumber');
let digitRadio1 = document.getElementById('radio1');
digitRadio1.addEventListener('change', drawingTable);
let digitRadio2 = document.getElementById('radio2');
digitRadio2.addEventListener('change', drawingTable);

// 桁数
let digitNum;
//　モ―ド
let modeNum = 0;;

// コンピュ―タが作った問題
let questionNumber = [];

// コンピュ―タ推理回答用
let allNumbers = [];

// アクティブinput要素
let activeInputId = '';

// 履歴表示行
let historyRow;

// ズ―ム値
let zoom = 1.0;

// Webペ―ジのロ―ドが完了した後に呼び出されるロ―ドイベントを設定する
window.addEventListener("load", onLoad, false);

// キ―が押されたときのリスナ―
document.addEventListener('keyup', keyUp, false);

// キ―が押されたとき
function keyUp(event){
    //alert(event.target.value);
    //alert(event.target.id); //inp0 or questionforcomp0
    activeInputId = event.target.id;
    if(activeInputId.slice(0,3) == MyAnswer) setNumber(event.target.value);
    if(activeInputId.slice(0,3) == QuestionForComp) checkQuestionNumber(event.target.value);
}

// グリッドの動的作成
function makeTable(parentId){
    // 描画エリア削除
    let parent = document.getElementById(parentId);
    while(parent.firstChild){
      parent.removeChild(parent.firstChild);
    }

    // --- 1. 入力ボックスの作成 ---
    let inputArea = document.createElement('div');
    inputArea.setAttribute('id', 'inputArea');
    for(let k = 0; k < digitNum; k++){
        let inputId = MyAnswer + k.toString();
        let input = document.createElement('input');
        input.type = 'number';
        input.autocomplete = 'off';
        input.min = '0';
        input.max = '9';
        input.setAttribute('id', inputId);
        input.setAttribute('class', 'input');
        input.addEventListener('click', function(event){
            activeInputId = inputId;
        });
        input.addEventListener('input', function() {
            if (this.value.length > 1) {
                this.value = this.value.slice(0, 1);
            }
            // スクロール位置が飛ぶのを強制リセット
            window.scrollTo(0, 0);
        });
        inputArea.appendChild(input);
    }
    // 入力エリアをテ―ブルの下に追加
    parent.appendChild(inputArea);

    // --- 2. 自分用グリッドの作成 ---
    let rows = [];
    let table = document.createElement('table');
    table.setAttribute('id', 'numberhistory');

    for(let i = 0; i < HistoryRowMax; i++){
        rows.push(table.insertRow(-1));
        // 自分履歴
        for(let j = 0; j < 4; j++){
            let cell = rows[i].insertCell(-1);
            let idString = i.toString() + IdSeparator + j.toString();
            
            // 枠の設定
            cell.style.borderStyle = 'solid';
            cell.style.borderLeftWidth = OuterThickness.toString() + 'px';
            cell.style.borderTopWidth = OuterThickness.toString() + 'px';
            cell.style.borderRightWidth = OuterThickness.toString() + 'px';
            cell.style.borderBottomWidth = OuterThickness.toString() + 'px';
            cell.style.fontSize = NumberMojiSize.toString() + 'px';
            cell.style.height = CellHeight.toString() + 'px';
            cell.style.width = (CellWidth * 2).toString() + 'px';
            if(j == 1) cell.style.width = (CellWidth * 6).toString() + 'px';

            if(i == 0){
                cell.style.height = (CellHeight + 30).toString() + 'px';
                if(j == 0) cell.textContent = '';
                if(j == 1){
                    cell.textContent = '―　―　―';
                    if(digitNum == 4) cell.textContent = '―　―　―　―';
                }
                if(j == 2) cell.textContent = '';
                if(j == 3) cell.textContent = '';
            } else if(i == 1){
                cell.style.backgroundColor = 'cornflowerblue';
                if(j == 0) cell.textContent = '';
                if(j == 1) cell.textContent = 'あなたの推理';
                if(j == 2) cell.textContent = 'Hit';
                if(j == 3) cell.textContent = 'Blow';
            } else {
                if(j == 0) cell.textContent = (i - 1).toString();
            }

            cell.setAttribute('id', idString);
        }
    }
    // 自分用テ―ブルを追加
    parent.appendChild(table);

}

// ボタンアクション設定
function makeButtonAction(){
    // スタ―ト
    let startButton = document.getElementById('start');
    startButton.addEventListener('click', function(event){
        startAct();
    });
    // ギブアップ
    let giveupButton = document.getElementById('giveup');
    giveupButton.addEventListener('click', function(event){
        giveupAct();
    });
}

// スタ―トアクション
function startAct(){
    if(historyRow > 1){
        // テ―ブル表示
        drawingTable();
    } else {
        // テ―ブル表示
        drawingTable();
        // 問題作成
        makeNumber();
        // ボタン無効
        buttonOFF();
    }
}

// ギブアップアクション
function giveupAct(){
    // 正解表示
    let idString = '0#1';
    let cell = document.getElementById(idString);
    cell.textContent = '';
    for(let k = 0; k < digitNum; k++){
        cell.textContent = cell.textContent + questionNumber[k].toString() + '　';
    }
    // ボタン有効
    buttonON();
}

// ボタンON
function buttonON(){
    let startButton = document.getElementById('start');
    startButton.enabled = true;
    startButton.disabled = false;
    let digitRadio1 = document.getElementById('radio1');
    digitRadio1.enabled = true;
    digitRadio1.disabled = false;
    let digitRadio2 = document.getElementById('radio2');
    digitRadio2.enabled = true;
    digitRadio2.disabled = false;
    //　ギブアップはON,OFF逆
    let giveupButton = document.getElementById('giveup');
    giveupButton.enabled = false;
    giveupButton.disabled = true;
}

// ボタンOFF
function buttonOFF(){
    let startButton = document.getElementById('start');
    startButton.enabled = false;
    startButton.disabled = true;
    let digitRadio1 = document.getElementById('radio1');
    digitRadio1.enabled = false;
    digitRadio1.disabled = true;
    let digitRadio2 = document.getElementById('radio2');
    digitRadio2.enabled = false;
    digitRadio2.disabled = true;
    //　ギブアップはON,OFF逆
    let giveupButton = document.getElementById('giveup');
    giveupButton.enabled = true;
    giveupButton.disabled = false;
}

// 問題作成
function makeNumber(){
    //alert('digitNum=' + digitNum);
    questionNumber = [];
    while(true){
        let num = getRandomInt(0,9);
        if(!questionNumber.includes(num)){
            questionNumber.push(num);
            if(questionNumber.length == digitNum) break;
        }
    }
    //alert('自分が解く問題：' + questionNumber);

    // 正解仮表示
    let idString = '0#1';
    let cell = document.getElementById(idString);
    cell.textContent = '';
    for(let k = 0; k < digitNum; k++){
        //cell.textContent = cell.textContent + questionNumber[k].toString() + '　';
        cell.textContent = cell.textContent + '＊　';
    }
}

// 乱数（min～maxの整数）
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// 推理数字の設定
// 入力完了後自動判定
function setNumber(num){
    if(questionNumber.length != digitNum){
        alert('スタ―トボタンをクリックして、自分が解く問題を作成してください！');
        clearInputBox(MyAnswer);
        return;
    }
    //alert('setNumber activeInputId=' + activeInputId);
    if(activeInputId == '') return;
    // 入力チェック
    for(let k = 0; k < digitNum; k++){
        let inputId = MyAnswer + k.toString();
        //alert('activeInputId=' + activeInputId + '  inputId=' + inputId);
        if(activeInputId == inputId) continue;
        let check = document.getElementById(inputId).value;
        //alert('document.getElementById(inputId).value=' + check);
        if(check != '' && check == num){
            //alert('同じ数字！');
            document.getElementById(activeInputId).value = '';
            return;
        }
    }
    document.getElementById(activeInputId).value = num;

    // 判定
    if(checkInputComplete(MyAnswer)){
        hantei();
    }
}

// hit&blow判定
// questionNumber, MyAnswer
// answerNumberForComp, QuestionForComp
function hitblowHantei(number, inputPrefix) {
    let hit = 0;
    let blow = 0;
    for(let k = 0; k < digitNum; k++){
        for(let l = 0; l < digitNum; l++){
            let inputId = inputPrefix + l.toString();
            if(number[k].toString() == document.getElementById(inputId).value.toString()){
                if(k == l){
                    hit = hit + 1;
                } else {
                    blow = blow + 1;
                }
            }
        }
    }
    //alert('comp hit=' + hit + '  blow=' + blow);
    return { hit: hit, blow: blow };
}

// 履歴表示数字用
// 呼び出し側がnullを使ったりしてなんか嫌だな
function rirekiNumber(number, inputPrefix) {
    let rirekiNumber = '';
    for(let k = 0; k < digitNum; k++){
        if(inputPrefix === MyAnswer) {
            let inputId = inputPrefix + k.toString();
            rirekiNumber = rirekiNumber + '　' + document.getElementById(inputId).value.toString();
        } else {
            rirekiNumber = rirekiNumber + '　' + number[k].toString();
        }
        
    }

    return rirekiNumber;
}

// 判定
function hantei(){
    // hit&blow判定
    let r = hitblowHantei(questionNumber, MyAnswer);

    // 履歴表示
    historyRow = historyRow + 1;
    let idString = historyRow.toString() + IdSeparator + '1';
    document.getElementById(idString).textContent = rirekiNumber(null, MyAnswer);
    idString = historyRow.toString() + IdSeparator + '2';
    document.getElementById(idString).textContent = r.hit.toString();
    idString = historyRow.toString() + IdSeparator + '3';
    document.getElementById(idString).textContent = r.blow.toString();

    // 入力ボックスクリア
    clearInputBox(MyAnswer);

    // 正解表示
    if(r.hit === digitNum){
        buttonON();
        alert('あなた　正解！');
    }

}

// 入力ボックスクリア
function clearInputBox(strid){
    for(let k = 0; k < digitNum; k++){
        let inputId = strid + k.toString();
        document.getElementById(inputId).value = '';
    }
}

// コンピュ―タに推理させる問題数字チェック
function checkQuestionNumber(num){
    if(activeInputId == '') return;
    // 入力チェック
    for(let k = 0; k < digitNum; k++){
        let inputId = QuestionForComp + k.toString();
        //alert('activeInputId=' + activeInputId + '  inputId=' + inputId);
        if(activeInputId == inputId) continue;
        let check = document.getElementById(inputId).value;
        //alert('document.getElementById(inputId).value=' + check);
        if(check != '' && check == num){
            //alert('同じ数字！');
            document.getElementById(activeInputId).value = '';
            return;
        }
    }
    document.getElementById(activeInputId).value = num;
}

// 入力済みかどうか
function checkInputComplete(strid){
    let bool = true;
    for(let k = 0; k < digitNum; k++){
        let inputId = strid + k.toString();
        //alert('checkInputComplete inputId=' + inputId);
        let check = document.getElementById(inputId).value;
        if(check == '') bool = false;
    }
    return bool;
}

// HTML読み込み後、自動実行
function onLoad(){
    // グリッドの動的作成
    drawingTable();

    // ボタンアクション
    makeButtonAction();
}

// テ―ブル表示
function drawingTable(){
    // 初期化
    resetData();

    // ボタン有効
    buttonON();

    // 表示サイズの計算
    zoomCalc();

    // 問題の動的作成
    makeTable('mainScreen');
}

// 初期化
function resetData(){
    // アクティブinput
    activeInputId = '';

    // 問題
    questionNumber = [];

    // 履歴表示行
    historyRow = 1;

    // 桁数設定
    for (let k = 0; k < digitNumber.length; k++){
        if (digitNumber.item(k).checked){
            digitNum = Number(digitNumber.item(k).value);
        }
    }
}

// 表示倍率計算
function zoomCalc(){
    // 表示サイズの計算
    let mainScreen = document.getElementById('mainScreen');
    let bw = window.innerWidth;
    let bh = window.innerHeight - 200;      //200は表題やボタンなどの縦幅による
    let gridw = CellWidth + CellWidth * 4 + CellWidth + CellWidth;
    let gridh = (CellHeight + 20) * HistoryRowMax + 85;     // 20は行間など

    // 表示倍率計算
    for(let i = 2; i > 0; i = i - 0.01){
      if( gridw * i < bw && gridh * i < bh){
        zoom = i;
        break;
      }
    }
    if(zoom < 0 || zoom > 1) zoom = 1.0;
    //alert("bw=" + bw + "  gridw=" + gridw * zoom + "  bh=" + bh + " gridh=" + gridh * zoom + " zoom=" + zoom);
    mainScreen.style.transformOrigin = 'top left';
    mainScreen.style.transform ='scale(' + zoom.toString() + ',' + zoom.toString() + ')';
}
