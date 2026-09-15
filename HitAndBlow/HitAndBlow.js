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

// 表示モード状態管理用変数（'vertical' または 'horizontal'）
let currentLayoutMode = 'vertical';

// 桁数指定
let digitNumber = document.getElementsByName('digitNumber');
let digitRadio1 = document.getElementById('radio1');
digitRadio1.addEventListener('change', drawingTable);
let digitRadio2 = document.getElementById('radio2');
digitRadio2.addEventListener('change', drawingTable);

// モ―ド指定
let modeNumber = document.getElementsByName('modeNumber');
let modeRadio3 = document.getElementById('radio3');
modeRadio3.addEventListener('change', setMode);
let modeRadio4 = document.getElementById('radio4');
modeRadio4.addEventListener('change', setMode);

// 桁数
let digitNum;
// モ―ド
let modeNum;

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

// 画面サイズ変更時・向き変更時にも倍率を再計算するよう追加
window.addEventListener('resize', zoomCalc);
window.addEventListener('orientationchange', zoomCalc);

// キ―が押されたとき
function keyUp(event){
    activeInputId = event.target.id;
    if(activeInputId.slice(0,3) == MyAnswer) setNumber(event.target.value);
    if(activeInputId.slice(0,3) == QuestionForComp) checkQuestionNumber(event.target.value);
}

// グリッドおよび動的エリア構造の作成
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
            window.scrollTo(0, 0);
        });
        inputArea.appendChild(input);
    }
    // 入力エリアを追加
    parent.appendChild(inputArea);

    // ゲーム・履歴領域を囲むコンテナ構造を動的作成
    let gameArea = document.createElement('div');
    gameArea.setAttribute('id', 'game_area');
    gameArea.setAttribute('class', currentLayoutMode); // 保持しているレイアウトクラスを付与

    let playerSection = document.createElement('div');
    playerSection.setAttribute('class', 'player_section');

    let compSection = document.createElement('div');
    compSection.setAttribute('class', 'comp_section');

    // --- 2. 自分用グリッドの作成 ---
    let rows = [];
    let table = document.createElement('table');
    table.setAttribute('id', 'numberhistory');

    for(let i = 0; i < HistoryRowMax; i++){
        rows.push(table.insertRow(-1));
        for(let j = 0; j < 4; j++){
            let cell = rows[i].insertCell(-1);
            let idString = i.toString() + IdSeparator + j.toString();
            
            cell.style.borderStyle = 'solid';
            cell.style.borderLeftWidth = OuterThickness.toString() + 'px';
            cell.style.borderTopWidth = OuterThickness.toString() + 'px';
            cell.style.borderRightWidth = OuterThickness.toString() + 'px';
            cell.style.borderBottomWidth = OuterThickness.toString() + 'px';
            cell.style.fontSize = NumberMojiSize.toString() + 'px';
            cell.style.height = CellHeight.toString() + 'px';
            /* 新規削除: JSでの幅設定（cell.style.width）を削除してCSS側での制御に変更。幅崩れを防止 */

            if(i == 0){
                cell.style.height = (CellHeight + 30).toString() + 'px';
                if(j == 0) cell.textContent = '';
                if(j == 1){
                    cell.textContent = '― ― ―';
                    if(digitNum == 4) cell.textContent = '― ― ― ―';
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
    playerSection.appendChild(table);
    gameArea.appendChild(playerSection);

    // --- 3. 相手用グリッドの作成（対戦時） ---
    if(modeNum == 1){
        let oppRows = [];
        let oppTable = document.createElement('table');
        oppTable.setAttribute('id', 'comphistory');

        for(let i = 0; i < HistoryRowMax; i++){
            oppRows.push(oppTable.insertRow(-1));
            for(let j = 0; j < 4; j++){
                let cell = oppRows[i].insertCell(-1);
                let targetJ = j + 5;
                let idString = i.toString() + IdSeparator + targetJ.toString();

                cell.style.borderStyle = 'solid';
                cell.style.borderLeftWidth = OuterThickness.toString() + 'px';
                cell.style.borderTopWidth = OuterThickness.toString() + 'px';
                cell.style.borderRightWidth = OuterThickness.toString() + 'px';
                cell.style.borderBottomWidth = OuterThickness.toString() + 'px';
                cell.style.fontSize = NumberMojiSize.toString() + 'px';
                cell.style.height = CellHeight.toString() + 'px';
                /* 新規削除: JSでの幅設定（cell.style.width）を削除してCSS側での制御に変更。幅崩れを防止 */

                if(i == 0){
                    cell.style.height = (CellHeight + 30).toString() + 'px';
                    if(j == 0) cell.textContent = '';
                    if(j == 1){
                        for(let k = 0; k < digitNum; k++){
                            let inputId = QuestionForComp + k.toString();
                            let input = document.createElement('input');
                            input.type = 'number';
                            input.autocomplete = 'off';
                            input.min = '0';
                            input.max = '9';
                            input.setAttribute('id', inputId);
                            input.setAttribute('class', 'questionforcomp');
                            input.addEventListener('click', function(event){
                                activeInputId = inputId;
                            });
                            input.addEventListener('input', function() {
                                if (this.value.length > 1) {
                                    this.value = this.value.slice(0, 1);
                                }
                            });
                            cell.appendChild(input);
                        }
                    }
                    if(j == 2) cell.textContent = '';
                    if(j == 3) cell.textContent = '';
                } else if(i == 1){
                    cell.style.backgroundColor = 'cornflowerblue';
                    if(j == 0) cell.textContent = '';
                    if(j == 1) cell.textContent = '相手の推理';
                    if(j == 2) cell.textContent = 'Hit';
                    if(j == 3) cell.textContent = 'Blow';
                } else {
                    if(j == 0) cell.textContent = (i - 1).toString();
                }

                cell.setAttribute('id', idString);
            }
        }
        compSection.appendChild(oppTable);
        gameArea.appendChild(compSection);
    }

    // parentにgameAreaを追加
    parent.appendChild(gameArea);
}

// ボタンアクション設定
function makeButtonAction(){
    let startButton = document.getElementById('start');
    startButton.addEventListener('click', function(event){
        startAct();
    });
    let giveupButton = document.getElementById('giveup');
    giveupButton.addEventListener('click', function(event){
        giveupAct();
    });
}

// スタ―トアクション
function startAct(){
    if(historyRow > 1){
        drawingTable();
    } else {
        if(modeNum == 1){
            if(!checkInputComplete(QuestionForComp)){
                alert('コンピュ―タに推理させる問題を入力してください！');
                drawingTable();
                return;
            }
            makeAllNumbers();
        } else {
            drawingTable();
        }
        makeNumber();
        buttonOFF();
    }
}

// ギブアップアクション
function giveupAct(){
    let idString = '0#1';
    let cell = document.getElementById(idString);
    cell.textContent = '';
    for(let k = 0; k < digitNum; k++){
        cell.textContent = cell.textContent + questionNumber[k].toString() + ' ';
    }
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
    let digitRadio3 = document.getElementById('radio3');
    digitRadio3.enabled = true;
    digitRadio3.disabled = false;
    let digitRadio4 = document.getElementById('radio4');
    digitRadio4.enabled = true;
    digitRadio4.disabled = false;
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
    digitRadio1.disabled = false;
    let digitRadio2 = document.getElementById('radio2');
    digitRadio2.enabled = false;
    digitRadio2.disabled = true;
    let digitRadio3 = document.getElementById('radio3');
    digitRadio3.enabled = false;
    digitRadio3.disabled = true;
    let digitRadio4 = document.getElementById('radio4');
    digitRadio4.enabled = false;
    digitRadio4.disabled = true;
    let giveupButton = document.getElementById('giveup');
    giveupButton.enabled = true;
    giveupButton.disabled = false;
}

// 問題作成
function makeNumber(){
    questionNumber = [];
    while(true){
        let num = getRandomInt(0,9);
        if(!questionNumber.includes(num)){
            questionNumber.push(num);
            if(questionNumber.length == digitNum) break;
        }
    }

    let idString = '0#1';
    let cell = document.getElementById(idString);
    cell.textContent = '';
    for(let k = 0; k < digitNum; k++){
        cell.textContent = cell.textContent + '＊ ';
    }
}

// 乱数（min～maxの整数）
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// 推理数字の設定
function setNumber(num){
    if(questionNumber.length != digitNum){
        alert('スタ―トボタンをクリックして、自分が解く問題を作成してください！');
        clearInputBox(MyAnswer);
        return;
    }
    if(activeInputId == '') return;
    for(let k = 0; k < digitNum; k++){
        let inputId = MyAnswer + k.toString();
        if(activeInputId == inputId) continue;
        let check = document.getElementById(inputId).value;
        if(check != '' && check == num){
            document.getElementById(activeInputId).value = '';
            return;
        }
    }
    document.getElementById(activeInputId).value = num;

    if(checkInputComplete(MyAnswer)){
        hantei();
        if(modeNum == 1){
            if(checkInputComplete(QuestionForComp)){
                hanteiForComp();
            } else {
                alert('コンピュ―タに推理させる問題を入力してください！');
                drawingTable();
            }
        }
    }
}

// hit&blow判定
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
    return { hit: hit, blow: blow };
}

// 履歴表示数字用
function rirekiNumber(number, inputPrefix) {
    let rirekiNumber = '';
    for(let k = 0; k < digitNum; k++){
        if(inputPrefix === MyAnswer) {
            let inputId = inputPrefix + k.toString();
            rirekiNumber = rirekiNumber + ' ' + document.getElementById(inputId).value.toString();
        } else {
            rirekiNumber = rirekiNumber + ' ' + number[k].toString();
        }
    }
    return rirekiNumber;
}

// 判定
function hantei(){
    let r = hitblowHantei(questionNumber, MyAnswer);

    historyRow = historyRow + 1;
    let idString = historyRow.toString() + IdSeparator + '1';
    document.getElementById(idString).textContent = rirekiNumber(null, MyAnswer);
    idString = historyRow.toString() + IdSeparator + '2';
    document.getElementById(idString).textContent = r.hit.toString();
    idString = historyRow.toString() + IdSeparator + '3';
    document.getElementById(idString).textContent = r.blow.toString();

    clearInputBox(MyAnswer);

    if(r.hit === digitNum){
        buttonON();
        alert('あなた 正解！');
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
    for(let k = 0; k < digitNum; k++){
        let inputId = QuestionForComp + k.toString();
        if(activeInputId == inputId) continue;
        let check = document.getElementById(inputId).value;
        if(check != '' && check == num){
            document.getElementById(activeInputId).value = '';
            return;
        }
    }
    document.getElementById(activeInputId).value = num;
}

// コンピュ―タ推理回答用候補リスト作成
function makeAllNumbers() {
    allNumbers = [];
    let loop = 10 ** digitNum;

    for (let k = 0; k < loop; k++) {
        let temp = String(k).padStart(digitNum, '0');
        let set = new Set(temp);

        if (set.size === temp.length) {
            allNumbers.push(temp);
        }
    }
}

// コンピュ―タ用判定
function hanteiForComp(){
    let answerNumberForComp = [];
    let index = getRandomInt(0, allNumbers.length - 1);
    answerNumberForComp = allNumbers[index];

    let r = hitblowHantei(answerNumberForComp, QuestionForComp);
    
    let idString = historyRow.toString() + IdSeparator + '6';
    document.getElementById(idString).textContent = rirekiNumber(answerNumberForComp, null);
    idString = historyRow.toString() + IdSeparator + '7';
    document.getElementById(idString).textContent = r.hit.toString();
    idString = historyRow.toString() + IdSeparator + '8';
    document.getElementById(idString).textContent = r.blow.toString();

    if(r.hit === digitNum){
        buttonON();
        alert('コンピュ―タ 正解！');
    } else {
        optionNumbersReMake(answerNumberForComp, r.hit, r.blow);
    }
}

// コンピュ―タ推理回答用候補リスト再作成
function optionNumbersReMake(answerNumberForComp, hit, blow){
    let flag = 0;
    if(flag === 0){
        let m = 0;
        while(true){
            if(m > allNumbers.length - 1) break;
            let checkNum = allNumbers[m];
            let chit = 0;
            let cblow = 0;
            for(let k = 0; k < digitNum; k++){
                for(let l = 0; l < digitNum; l++){
                    if(checkNum[k].toString() == answerNumberForComp[l].toString()){
                        if(k == l){
                            chit = chit + 1;
                        } else {
                            cblow = cblow + 1;
                        }
                    }
                }
            }
            if(hit == chit && blow == cblow){
                m = m + 1;
            } else {
                allNumbers.splice(m, 1);
            }
        }
    }
}

// 入力済みかどうか
function checkInputComplete(strid){
    let bool = true;
    for(let k = 0; k < digitNum; k++){
        let inputId = strid + k.toString();
        let check = document.getElementById(inputId).value;
        if(check == '') bool = false;
    }
    return bool;
}

// HTML読み込み後、自動実行
function onLoad(){
    drawingTable();
    makeButtonAction();
}

// モ―ド設定
function setMode(){
    for (let k = 0; k < modeNumber.length; k++){
        if (modeNumber.item(k).checked){
            modeNum = Number(modeNumber.item(k).value);
            let toggleLayout = document.getElementById("toggleLayout");
            if(modeNum == 1) {
                toggleLayout.disabled = false;
            } else {
                currentLayoutMode = 'vertical';
                toggleLayout.innerHTML = "<ruby>横表示<rt>よこひょうじ</rt></ruby>へ"
                toggleLayout.disabled = true;
            }
        }
    }
    drawingTable();
}

// テ―ブル表示
function drawingTable(){
    resetData();
    buttonON();
    makeTable('mainScreen');
    zoomCalc();
}

// 初期化
function resetData(){
    activeInputId = '';
    questionNumber = [];
    historyRow = 1;

    for (let k = 0; k < digitNumber.length; k++){
        if (digitNumber.item(k).checked){
            digitNum = Number(digitNumber.item(k).value);
        }
    }
}

// 表示倍率計算
function zoomCalc(){
    let mainScreen = document.getElementById('mainScreen');
    if (!mainScreen) return;

    let bw = window.innerWidth;
    let bh = window.innerHeight - 220;
    let gridw = 600;
    let gridh = (CellHeight + 20) * HistoryRowMax + 85;

    /* 新規変更: 実際のテーブル幅1020pxに合わせて縮小率を正しく指定 */
    if (currentLayoutMode === 'horizontal' && modeNum == 1) {
        gridw = 1230; // 1020px + マージン
        gridh = (CellHeight + 20) * HistoryRowMax + 85;
    } else {
        gridw = 600;
        gridh = (CellHeight + 20) * HistoryRowMax + 85;
    }

    zoom = 1.0;
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

// 縦表示と横表示を交互に切り替え（状態変数 currentLayoutMode も同時更新）
function toggleLayout() {
    let gameArea = document.getElementById('game_area');
    let toggleLayout = document.getElementById("toggleLayout");
    if (currentLayoutMode === 'vertical') {
        currentLayoutMode = 'horizontal';
        //toggleLayout.textContent = "縦表示へ";
        toggleLayout.innerHTML = "<ruby>縦表示<rt>たてひょうじ</rt></ruby>へ";
        if (gameArea) {
            gameArea.classList.remove('vertical');
            gameArea.classList.add('horizontal');
        }
    } else {
        currentLayoutMode = 'vertical';
        //toggleLayout.textContent = "横表示へ";
        toggleLayout.innerHTML = "<ruby>横表示<rt>よこひょうじ</rt></ruby>へ";
        if (gameArea) {
            gameArea.classList.remove('horizontal');
            gameArea.classList.add('vertical');
        }
    }
    zoomCalc();
}
