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

// モ―ド指定
//let modeNumber = document.getElementById('modeNumber');
// 問題変更時のイベントリスナ―
//modeNumber.addEventListener('change', setMode);
let modeNumber = document.getElementsByName('modeNumber');
let modeRadio3 = document.getElementById('radio3');
modeRadio3.addEventListener('change', setMode);
let modeRadio4 = document.getElementById('radio4');
modeRadio4.addEventListener('change', setMode);

// 桁数
let digitNum;
//　モ―ド
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

    // --- 1. 自分用グリッドの作成 ---
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

    // --- 2. 入力ボックスの作成 ---
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
        });
        inputArea.appendChild(input);
    }
    // 入力エリアをテ―ブルの下に追加
    parent.appendChild(inputArea);

    // --- 3. 相手用グリッドの作成（対戦時・入力ボックスの下に配置） ---
    if(modeNum == 1){
        let oppRows = [];
        let oppTable = document.createElement('table');
        oppTable.setAttribute('id', 'comphistory');

        for(let i = 0; i < HistoryRowMax; i++){
            oppRows.push(oppTable.insertRow(-1));
            for(let j = 0; j < 4; j++){
                let cell = oppRows[i].insertCell(-1);
                // 元の相手用IDに合わせてインデックス（j+5）等の互換性を調整
                // （※ 5=行番号, 6=相手の推理, 7=Hit, 8=Blow）
                let targetJ = j + 5;
                let idString = i.toString() + IdSeparator + targetJ.toString();

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
        // 相手用テ―ブルを一番下に追加
        parent.appendChild(oppTable);
    }
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
        if(modeNum == 1){
            if(!checkInputComplete(QuestionForComp)){
                alert('コンピュ―タに推理させる問題を入力してください！');
                // テ―ブル表示
                drawingTable();
                return;
            }
            // コンピュ―タ推理回答用候補リスト作成
            makeAllNumbers();
        } else {
            // テ―ブル表示
            drawingTable();
        }
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
    let digitRadio3 = document.getElementById('radio3');
    digitRadio3.enabled = true;
    digitRadio3.disabled = false;
    let digitRadio4 = document.getElementById('radio4');
    digitRadio4.enabled = true;
    digitRadio4.disabled = false;
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
    let digitRadio3 = document.getElementById('radio3');
    digitRadio3.enabled = false;
    digitRadio3.disabled = true;
    let digitRadio4 = document.getElementById('radio4');
    digitRadio4.enabled = false;
    digitRadio4.disabled = true;
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
        // 対戦時
        if(modeNum == 1){
            if(checkInputComplete(QuestionForComp)){
                hanteiForComp();
            } else {
                alert('コンピュ―タに推理させる問題を入力してください！');
                // テ―ブル表示
                drawingTable();
            }
        }
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

// コンピュ―タ推理回答用候補リスト作成
// すべてのパタ―ンからダブりの無いものだけをリスト化
function makeAllNumbers() {
    allNumbers = [];
    let loop = 10 ** digitNum;

    for (let k = 0; k < loop; k++) {
        let temp = String(k).padStart(digitNum, '0');
        let set = new Set(temp);

        if (set.size === temp.length) {
            //alert('allNumbers=' + temp);
            allNumbers.push(temp);
        }
    }
}

/*
// コンピュ―タ推理回答用候補リスト作成
function makeAllNumbers(){
    allNumbers = [];
    // すべてのパタ―ンからダブりの無いものだけをリスト化
    let loop = 10 ** digitNum;
    for(let k = 0; k < loop; k++){
        let temp = String(k).padStart(digitNum, '0');
        let bool = true;
        for(let l = 0; l < 10; l++){
            let targetChar = l.toString();
            let count = temp.split(targetChar).length - 1;  // splitで作られる配列の個数で判断する
            if(count > 1){
                bool = false;
                break;
            }
        }
        if(bool){
            //alert('allNumbers=' + temp);
            allNumbers.push(temp);
        }
    }
}
*/

// コンピュ―タ用判定
function hanteiForComp(){
    // コンピュ―タ推理回答作成
    let answerNumberForComp = [];
    let index = getRandomInt(0, allNumbers.length - 1);
    answerNumberForComp = allNumbers[index];
    //alert('コンピュ―タ推理回答：' + answerNumberForComp + '(' + index + ')' + '  候補数：' + allNumbers.length + '\n\r' + allNumbers);
    //alert('分解 ' +answerNumberForComp[0].toString() + ':' + answerNumberForComp[1].toString() + ':' + answerNumberForComp[2].toString());

    // コンピュ―タ用hit&blow判定
    let r = hitblowHantei(answerNumberForComp, QuestionForComp);
    
    // 履歴表示
    //historyRow = historyRow + 1;
    let idString = historyRow.toString() + IdSeparator + '6';
    document.getElementById(idString).textContent = rirekiNumber(answerNumberForComp, null);
    idString = historyRow.toString() + IdSeparator + '7';
    document.getElementById(idString).textContent = r.hit.toString();
    idString = historyRow.toString() + IdSeparator + '8';
    document.getElementById(idString).textContent = r.blow.toString();

    // 正解表示
    if(r.hit === digitNum){
        // ボタン有効
        buttonON();
        alert('コンピュ―タ　正解！');
    } else {
        // コンピュ―タ推理回答用候補リスト再作成
        optionNumbersReMake(answerNumberForComp, r.hit, r.blow);
    }

    //alert('判定後　コンピュ―タ推理回答：' + answerNumberForComp + ' (index:' + index + ')' + '  候補数：' + allNumbers.length + '\n\r' +  'hit=' + hit + '  blow=' + blow + '\n' + allNumbers);

}

// コンピュ―タ推理回答用候補リスト再作成
function optionNumbersReMake(answerNumberForComp, hit, blow){
    //alert('optionNumbersReMake hit=' + hit + '  blow=' + blow);
    let flag = 0;   // 0:強いモ―ド　0以外:そうでもない
    if(flag === 0){
        // 直前の回答と候補を判定させて、hitとblowが同じになる候補を残す方法
        // 候補一覧の数字(checkNum)が正解だと仮定して、answerNumberForCompがhitとblowが同じものを次の候補一覧とする
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
                // 削除せず次へ
                //alert('残す' + allNumbers[m]);
                m = m + 1;
            } else {
                //削除する
                //alert('削除する' + allNumbers[m]);
                allNumbers.splice(m, 1);    // 削除を配列が詰まるのでforル―プは使えない
            }
        }
        //alert('optionNumbersReMake 候補数1：' + allNumbers.length);
    } else {
        // hitとblowから候補を削除する方法
        // hitが0、blowが0の場合
        // 推理したanswerNumberForCompにある数字を含む候補をすべて消す
        if(hit == 0 && blow == 0){
            let m = 0;
            while(true){
                let checkNum = allNumbers[m];
                let del = false;
                for(let l = 0; l < digitNum; l++){
                    if(checkNum.includes(answerNumberForComp[l])){
                        allNumbers.splice(m, 1);    // 削除を配列が詰まるのでforル―プは使えない
                        del = true;
                        break;
                    }
                }
                if(!del) m = m + 1;
                if(m > allNumbers.length - 1) break;
            }
        }
        //alert('optionNumbersReMake 候補数2：' + allNumbers.length);
        // hitが0、blowが1以上の場合
        // 推理したanswerNumberForCompと同じ位置にある数字を含む候補をすべて消す
        if(hit == 0 && blow > 0){
            let m = 0;
            while(true){
                let checkNum = allNumbers[m];
                let del = false;
                for(let l = 0; l < digitNum; l++){
                    if(checkNum[l].toString() == answerNumberForComp[l].toString()){
                        allNumbers.splice(m, 1);    // 削除を配列が詰まるのでforル―プは使えない
                        del = true;
                        //alert('checkNum[l]=' + checkNum[l].toString() + '  answerNumberForComp[l]' + answerNumberForComp[l].toString());
                        break;
                    }
                }
                if(!del) m = m + 1;
                if(m > allNumbers.length - 1) break;
            }
        }
        //alert('optionNumbersReMake 候補数3：' + allNumbers.length);
        // hitが1、blowが0の場合
        // 推理したanswerNumberForCompと同じ位置にある数字を含む候補を残す
        if(hit == 1 && blow == 0){
            let m = 0;
            while(true){
                if(m > allNumbers.length - 1) break;
                let checkNum = allNumbers[m];
                let del = true;
                for(let k = 0; k < digitNum; k++){
                    if(checkNum[k].toString() == answerNumberForComp[k].toString()){
                        del = false;
                        //alert('hit1 checkNum[k]=' + checkNum[k] + '  answerNumberForComp[k]=' + answerNumberForComp[k] + ' allNumbers.length' + allNumbers.length + '  m=' + m);
                        break;
                    }
                }
                if(del) {
                    // 削除
                    allNumbers.splice(m, 1);    // 削除を配列が詰まるのでforル―プは使えない
                } else {
                    // 削除せず次へ
                    m = m + 1;
                }
            }
        }
        //alert('optionNumbersReMake 候補数4：' + allNumbers.length);
        // hitが2、blowが0の場合
        // 推理したanswerNumberForCompと同じ位置にある数字を含む候補を残す
        if(hit == 2 && blow == 0){
            let m = 0;
            while(true){
                if(m > allNumbers.length - 1) break;
                let checkNum = allNumbers[m];
                let del = true;
                c0 = checkNum[0].toString();
                c1 = checkNum[1].toString();
                c2 = checkNum[2].toString();
                a0 = answerNumberForComp[0].toString();
                a1 = answerNumberForComp[1].toString();
                a2 = answerNumberForComp[2].toString();
                if(c0 == a0 && c1 == a1) del = false;
                if(c0 == a0 && c2 == a2) del = false;
                if(c1 == a1 && c2 == a2) del = false;
                if(digitNum == 4){
                    c3 = checkNum[3].toString();
                    a3 = answerNumberForComp[3].toString();
                    if(c0 == a0 && c3 == a3) del = false;
                    if(c1 == a1 && c3 == a3) del = false;
                    if(c2 == a2 && c3 == a3) del = false;
                }
                if(del) {
                    // 削除
                    allNumbers.splice(m, 1);    // 削除を配列が詰まるのでforル―プは使えない
                } else {
                    // 削除せず次へ
                    m = m + 1;
                }
            }
        }
        //alert('optionNumbersReMake 候補数5：' + allNumbers.length);
        // hitが3、blowが0の場合
        // 推理したanswerNumberForCompと同じ位置にある数字を含む候補を残す
        if(hit == 3 && blow == 0 && digitNum == 4){
            let m = 0;
            while(true){
                if(m > allNumbers.length - 1) break;
                let checkNum = allNumbers[m];
                let del = true;
                c0 = checkNum[0].toString();
                c1 = checkNum[1].toString();
                c2 = checkNum[2].toString();
                c3 = checkNum[3].toString();
                a0 = answerNumberForComp[0].toString();
                a1 = answerNumberForComp[1].toString();
                a2 = answerNumberForComp[2].toString();
                a3 = answerNumberForComp[3].toString();
                if(c0 == a0 && c1 == a1 && c2 == a2) del = false;
                if(c0 == a0 && c1 == a1 && c3 == a3) del = false;
                if(c1 == a1 && c2 == a2 && c3 == a3) del = false;
                if(c0 == a0 && c2 == a2 && c3 == a3) del = false;
                if(del) {
                    // 削除
                    allNumbers.splice(m, 1);    // 削除を配列が詰まるのでforル―プは使えない
                } else {
                    // 削除せず次へ
                    m = m + 1;
                }
            }
        }
        alert('optionNumbersReMake 候補数6：' + allNumbers.length);
    }
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

// モ―ド設定
function setMode(){
    // モ―ド設定
    for (let k = 0; k < modeNumber.length; k++){
        if (modeNumber.item(k).checked){
            modeNum = Number(modeNumber.item(k).value);
        }
    }

     // テ―ブル表示
    drawingTable();
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
    let bh = window.innerHeight - 220;      //220は表題やボタンなどの縦幅による
    //let gridw = (CellWidth + CellWidth * 4 + CellWidth + CellWidth) * 2;
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
