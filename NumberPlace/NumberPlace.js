const OuterThickness = 2;
const DivisionThickness = 7;
const NumberMojiSize = '40';    // CSSで入力セルの縦横を指定しているの調節が必要、1/2くらいが良さそう
const IdSeparator = '#';
const SuccessImageSrc = '../img/Success1.png';

// 問題データ指定
let dataNumber = document.getElementById("dataNumber");
// 問題変更時のイベントリスナー
dataNumber.addEventListener("change", drawingTable);

// 問題データ指定
let spaceNumber = document.getElementById("spaceNumber");
// 問題変更時のイベントリスナー
spaceNumber.addEventListener("change", setSpaceNumber);
let spaceNum = 30;

// 問題番号
let dataNo;

// 問題作成用ベーステンプレート
let numberBaseData = [
    [ 5, 8, 2, 7, 3, 6, 9, 1, 4 ],
    [ 3, 1, 7, 2, 4, 9, 6, 5, 8 ],
    [ 6, 4, 9, 5, 8, 1, 3, 2, 7 ],
    [ 1, 3, 5, 8, 6, 4, 2, 7, 9 ],
    [ 2, 9, 8, 3, 1, 7, 4, 6, 5 ],
    [ 4, 7, 6, 9, 2, 5, 8, 3, 1 ],
    [ 9, 2, 3, 1, 5, 8, 7, 4, 6 ],
    [ 8, 5, 4, 6, 7, 3, 1, 9, 2 ],
    [ 7, 6, 1, 4, 9, 2, 5, 8, 3 ]
];

// 候補データ格納
let optionData = [
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
];

// ズーム値
let zoom = 1.0;

// Webページのロードが完了した後に呼び出されるロードイベントを設定する
window.addEventListener("load", onLoad, false);

// キーが押されたときのリスナー
document.addEventListener('keyup', keyUp, false);

// 問題
let generatorDataArray = [];

// キーが押されたとき
function keyUp(event){
    //alert(event.target.value);
    //alert(event.target.id); //inp0#3
    let idString = event.target.id.substr(3);
    let id = idString.split(IdSeparator);
    numberData[id[0]][id[1]] = Number(event.target.value);

    // 完成チェック
    //alert('numberData= ' + numberData);
    let bool = true;
    for(let i = 0; i < 9; i++){
        let rowData = getRowData(i);
        //alert(i + '   calculation(rowData)= ' + calculation(rowData));
        if(calculation(rowData) != 45){
            bool = false;
        }
    }
    for(let j = 0; j < 9; j++){
        let colData = getColData(j);
        //alert(j + '   calculation(colData)= ' + calculation(colData));
        if(calculation(colData) != 45){
            bool = false;
        }
    }
    for(let i = 0; i < 9; i++){
        for(let j = 0; j < 9; j++){
            let boxData = getBoxData(getBoxNo(i, j));
            if(calculation(boxData) != 45){
                bool = false;
            }
        }
    }
    if(bool){
        let si = document.getElementById('successImage');
        si.style.display = 'block';
    }
}

// 合計を返す
function calculation(nums){
    let cal = 0;
    for(let k = 0; k < 9; k++){
        cal = cal + Number(nums[k]);
    }
    return cal;
}

// 空白数設定
function setSpaceNumber(){
    spaceNum = parseFloat(spaceNumber.value);
}

// 問題を作る（ベースを加工して穴を空ける）
function generator(){
    numberBaseData = [
        [ 7, 2, 9, 6, 1, 8, 3, 5, 4 ],
        [ 1, 6, 4, 7, 3, 5, 2, 9, 8 ],
        [ 3, 5, 8, 9, 4, 2, 1, 7, 6 ],
        [ 5, 4, 1, 3, 2, 7, 6, 8, 9 ],
        [ 6, 3, 7, 5, 8, 9, 4, 1, 2 ],
        [ 8, 9, 2, 1, 6, 4, 5, 3, 7 ],
        [ 4, 1, 3, 8, 7, 6, 9, 2, 5 ],
        [ 9, 8, 6, 2, 5, 1, 7, 4, 3 ],
        [ 2, 7, 5, 4, 9, 3, 8, 6, 1 ]
    ];

    // 数字の入替
    // 行ごとに入れ替えをする
    let loop1 = getRandomInt(2, 8);
    for(let k = 0; k < loop1; k++){
        let no1 = getRandomInt(1, 9);
        let no2 = getRandomInt(1, 9);
        if(no1 == no2){
            k--;
            continue;
        }
        //alert('行入替1：' + no1 + '  入替2：' + no2);
        let indx1;
        let indx2;
        for(let i = 0; i < 9; i++){
            //alert('行入替前：' + getRowBaseData(i));
            for(let j = 0; j < 9; j++){
                if(numberBaseData[i][j] == no1){
                    indx1 = j;
                }
                if(numberBaseData[i][j] == no2){
                    indx2 = j;
                }
            }
            let temp1 = numberBaseData[i][indx1];
            numberBaseData[i][indx1] = numberBaseData[i][indx2];
            numberBaseData[i][indx2] = temp1;
            //alert('行入替後：' + getRowBaseData(i));
        }
    }

    // 列ごとに入れ替えをする
    let loop2 = getRandomInt(2, 8);
    for(let k = 0; k < loop2; k++){
        let no1 = getRandomInt(1, 9);
        let no2 = getRandomInt(1, 9);
        if(no1 == no2){
            k--;
            continue;
        }
        //alert('列入替1：' + no1 + '  入替2：' + no2);
        let indx1;
        let indx2;
        for(let j = 0; j < 9; j++){
            //alert('列入替前：' + getColBaseData(j));
            for(let i = 0; i < 9; i++){
                if(numberBaseData[i][j] == no1){
                    indx1 = i;
                }
                if(numberBaseData[i][j] == no2){
                    indx2 = i;
                }
            }
            let temp1 = numberBaseData[indx1][j];
            numberBaseData[indx1][j] = numberBaseData[indx2][j];
            numberBaseData[indx2][j] = temp1;
            //alert('列入替後：' + getColBaseData(j));
        }
    }

    // 行の交換
    //let loop3 = getRandomInt(2, 8);
    let loop3 = 1;
    let row1;
    let row2;
    //alert('行入替前：' + numberBaseData);
    for(let k = 0; k < loop3; k++){
        let m = -3;
        for(let l = 0; l < 1; l++){
            m = m + 3;
            while(true){
                row1 = getRandomInt(m, m + 2);
                row2 = getRandomInt(m, m + 2);
                if(row1 != row2) break;
            }
            //alert('row1= ' + row1 + '  row2= ' + row2);
            let temp1 = JSON.parse(JSON.stringify(getRowBaseData(row1)));
            let temp2 = JSON.parse(JSON.stringify(getRowBaseData(row2)));
            numberBaseData[row1] = temp2;
            numberBaseData[row2] = temp1;
        }
    }
    //alert('行入替後：' + numberBaseData);

    // 列の交換
    let loop4 = 1;
    let col1;
    let col2;
    //alert('列入替前：' + numberBaseData);
    for(let k = 0; k < loop4; k++){
        let m = -3;
        for(let l = 0; l < 1; l++){
            m = m + 3;
            while(true){
                col1 = getRandomInt(m, m + 2);
                col2 = getRandomInt(m, m + 2);
                if(col1 != col2) break;
            }
            //alert('col1= ' + col1 + '  col2= ' + col2);
            let temp1 = JSON.parse(JSON.stringify(getColBaseData(col1)));
            let temp2 = JSON.parse(JSON.stringify(getColBaseData(col2)));
            //alert('temp1= ' + temp1 + '  temp2= ' + temp2);
            for(let i = 0; i < 9; i++){
                //alert(i + '  numberBaseData[i][col2]= ' + numberBaseData[i][col2] + '  temp1[i]= ' + temp1[i]);
                //alert(i + '  numberBaseData[i][col1]= ' + numberBaseData[i][col1] + '  temp2[i]= ' + temp2[i]);
                numberBaseData[i][col1] = temp2[i];
                numberBaseData[i][col2] = temp1[i];
            }
        }
    }
    //alert('列入替後：' + numberBaseData);
    //si.insertAdjacentHTML("beforeend", "<div>列入替後：" + numberBaseData + "</div>");

    // 問題に穴を空ける
    let copyTemp = [];
    while(true){
        numberData = JSON.parse(JSON.stringify(numberBaseData));
        for(let k = 0; k < spaceNum; k++){
            let row = getRandomInt(0, 8);
            let col = getRandomInt(0, 8);
            if(numberData[row][col] == 0){
                k--;
                continue;
            }
            numberData[row][col] = 0;
        }
        // 解かせる
        copyTemp = JSON.parse(JSON.stringify(numberData));
        if(loopSolver()){
            //alert('〇解ける問題= ' + copyTemp);
            break;
        } else {
            //alert('×解けない問題= ' + copyTemp);
        }
    }
    numberData = JSON.parse(JSON.stringify(copyTemp));

    // 登録後再描画
    reDrawingTable();

}

// ベースデータの指定の行データを返す
function getRowBaseData(row){
    let rowData = [];
    for(let j = 0; j < 9; j++){
        rowData.push(numberBaseData[row][j]);
    }
    return rowData;
}

// ベースデータの指定の列データを返す
function getColBaseData(col){
    let colData = [];
    for(let i = 0; i < 9; i++){
        colData.push(numberBaseData[i][col]);
    }
    return colData;
}

// 乱数（min～maxの整数）
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// ソルバーのループ
function loopSolver(){
    //let counter = 0;
    let fixed;
    while(true){
        //counter = counter + 1;

        // ソルバー
        fixed = solver();
        if(fixed){
            // 修正した
        } else {
            // 修正していない
            break;
        }

        // 完了チェック
        let loop = false;
        for(let i = 0; i < 9; i++){
            for(let j = 0; j < 9; j++){
                if(numberData[i][j] == 0) loop = true;
            }
        }
        if(loop == false) break;
    }
    if(fixed){
        //alert('完了！ ソルバーループ回数= ' + counter);
    } else {
        //alert('これ以上無理 ソルバーループ回数= ' + counter)
    }
    return fixed;
}

// ソルバー問題を解く
/*
パターンA：下のコード（即 return）と組み合わせる場合【おすすめ】
【挙動】きれいに役割分担ができ、1マスずつスマートに解き進む
処理の流れ：
1.loopSolver が solver() を呼ぶ。
2.solver() は盤面を上からスキャンし、最初に見つかった確定できる1マスだけを埋めて、すぐに true を返して終了する。
3.loopSolver の中で fixed が true になるため、次の周回（counter = 2）に入り、また次の1マスを埋めに行く。
これをすべてのマスが埋まるか、手詰まりになるまで繰り返す。

メリット： 無駄なループの二重構造がなく、コードの役割（solver は1マス見つける係、loopSolver はそれを繰り返す係）がキレイに分離されています。
*/
function solver(){
    let fixed = false;

    // 候補値データ設定
    if(resetOptionData() == false) return false;

    // STEP1: 候補が1つのものを「1箇所だけ」確定して即終了
    for(let i = 0; i < 9; i++){
        for(let j = 0; j < 9; j++){
            if(numberData[i][j] !== 0) continue;
            let temp = optionData[i][j].toString().replace(/^,+|,+$/g,'').replace(/,+/g,',');
            optionData[i][j] = temp;
            let op = temp.split(',');
            if(op.length == 1 && op[0] !== ""){
                numberData[i][j] = Number(op[0]);
                fixed = true;
                reDrawingTable();
                return fixed;
            }
        }
    }

    // STEP1 で埋まるマスが「盤面全体に1つもない」場合のみ、STEP2 の解析に進む
    // STEP2: 候補セルを含む他の縦・横・ボックスいずれかの9個のセルに属する空きセルの候補に対して、1箇所にしか存在しない候補値がないか調べる
    //        行・列・ボックス内で「そこにしか入らない」数値を確定させる
    for(let i = 0; i < 9; i++){
        for(let j = 0; j < 9; j++){
            if(numberData[i][j] !== 0) continue;
            let temp = optionData[i][j].toString().replace(/^,+|,+$/g,'').replace(/,+/g,',');
            optionData[i][j] = temp;
            let op = temp.split(',');
            if(op.length != 1){
                for(let k = 0; k < op.length; k++){
                    if(existRowOptionData(i, j, op[k]) == false || 
                       existColOptionData(i, j, op[k]) == false || 
                       existBoxOptionData(i, j, op[k]) == false){
                        numberData[i][j] = Number(op[k]);
                        fixed = true;
                        reDrawingTable();
                        return fixed;
                    }
                }
            }
        }
    }

    // 登録後再描画
    reDrawingTable();
    // どこも確定できなかったら false を返し、loopSolver の while をブレイクさせる
    return fixed;
}

/*
// ソルバー問題を解く
パターンB：上のコード（while ループあり）と組み合わせる場合【過剰ループ】
【挙動】動くが、内部で「ループの渋滞」が起きて無駄な処理が走る

処理の流れ：
1.loopSolver が solver() を呼ぶ。
2.solver() の内部の while(true) により、行けるところまで（何十マスでも）一気に自力で埋め尽くす。
3.完全に手詰まり（これ以上自動で進めない状態）になったら、solver() は fixed = true（または一発も埋まらなければ false）を返して終了する。
4.loopSolver 側は fixed = true を受け取るので、もう1回 solver() を呼び出してしまう。
5.2回目の solver() は、もうすでに限界まで解かれているため、何もできずに false を返す。

デメリット（無駄な動き）：solver() が一撃で盤面の大半を解いてしまうため、loopSolver の while ループは実質2回程度しかまともに機能しません。 また、手詰まりになった後にもう一度無駄な全探索が走るため、効率が少し悪くなります。
function solver() {
    let fixed = false;

    // === Step 1: 候補が1つだけのセルを確定させる ===
    while (true) {
        if (!resetOptionData()) return false;
        
        let changed = false; // この周回で数字が確定したかどうかのフラグ

        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                // すでに数字が入っているマスはスキップ
                if (numberData[i][j] !== 0) continue;

                // カンマの重複や前後のゴミをクリーンアップして配列化
                let cleanOptions = optionData[i][j].toString().replace(/^,+|,+$/g, '').replace(/,+/g, ',');
                optionData[i][j] = cleanOptions;
                let op = cleanOptions.split(',');

                // 候補が1つだけなら数値を確定
                if (op.length === 1 && op[0] !== "") {
                    numberData[i][j] = Number(op[0]);
                    fixed = true;
                    changed = true; // 変更があったのでループを継続させる
                }
            }
        }

        // 1度も変更が起きなければ、Step 1 の無限ループを抜ける
        if (!changed) break;
    }

    // === Step 2: 行・列・ボックス内で「そこにしか入らない」数値を確定させる ===
    while (true) {
        if (!resetOptionData()) return false;

        let changed = false;

        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (numberData[i][j] !== 0) continue;

                let cleanOptions = optionData[i][j].toString().replace(/^,+|,+$/g, '').replace(/,+/g, ',');
                optionData[i][j] = cleanOptions;
                let op = cleanOptions.split(',');

                // 候補が複数ある場合のみチェック
                if (op.length > 1) {
                    for (let k = 0; k < op.length; k++) {
                        let val = op[k];

                        // 行、列、ボックスのいずれかで、その数字を持つ候補セルが他に存在しないか
                        let isUniqueInRow = !existRowOptionData(i, j, val);
                        let isUniqueInCol = !existColOptionData(i, j, val);
                        let isUniqueInBox = !existBoxOptionData(i, j, val);

                        if (isUniqueInRow || isUniqueInCol || isUniqueInBox) {
                            numberData[i][j] = Number(val);
                            fixed = true;
                            changed = true;
                            break; // このマスの探索は終了
                        }
                    }
                }
                if (changed) break; // 1箇所確定したら全体を再評価するため内側ループを抜ける
            }
            if (changed) break; // 外側ループを抜けて while の先頭（resetOptionData）へ
        }

        if (!changed) break;
    }

    // 登録後再描画
    reDrawingTable();

    return fixed;
}
*/

/*
// ソルバー問題を解く
// solver 関数内の step1 や step2 にある while(true) { ... break; } は、
// ループが一回で終わる設定になっていたため、ラベル（step1:）を含めて
// シンプルな記述に整理しました。
// 原因1：ループの最後に必ず break がある
// 原因2：確定時の break step1; は「再実行」ではなく「ループ脱出」になる
// 　　　（break step1;）は、指定したラベルのループを「完全に終了して外に抜ける」 という挙動になります。
function solver(){
    let fixed = false;

    step1 : while(true){
        // 候補値データ設定
        if(resetOptionData() == false) return false;

        // 候補が1つのものを確定　numberData[i][j]に登録する
        // 確定した数値があれば何回もやり直して、確定しない場合には次のステップへ進む
        for(let i = 0; i < 9; i++){
            for(let j = 0; j < 9; j++){
                let temp = optionData[i][j].toString().replace(/^,+|,+$/g,'').replace(/,+/g,',');
                //alert('ひとつ　i=' + i + '   j=' + j + '   optionData[i][j]=' + optionData[i][j] + '   replace=' + temp);
                optionData[i][j] = temp;
                let op = temp.split(',');
                //alert('op.length' + op.length);
                if(op.length == 1 && numberData[i][j] == 0){
                    //alert('ひとつのみ確定 i=' + i + '   j=' + j + '   op=' + op[0] + '   optionData[i][j]=' + optionData[i][j]);
                    numberData[i][j] = Number(op[0]);
                    fixed = true;
                    break step1;    // step1を再実行
                }
            }
        }
        break;
    }
    //alert('step1終了');

    step2 : while(true){
        // 候補値データ設定
        if(resetOptionData() == false) return false;

        // 候補セルを含む他の縦・横・ボックスいずれかの9個のセルに属する空きセルの候補に対して、1箇所にしか存在しない候補値がないか調べる
        // 確定した数値があれば何回もやり直して、確定しない場合には次のステップへ進む
        for(let i = 0; i < 9; i++){
            for(let j = 0; j < 9; j++){
                let temp = optionData[i][j].toString().replace(/^,+|,+$/g,'').replace(/,+/g,',');
                optionData[i][j] = temp;
                let op = temp.split(',');
                if(op.length != 1){
                    //alert('行列ボックス　i=' + i + '   j=' + j + '   optionData[i][j]=' + optionData[i][j]);
                    // このセルに対して、行のその他セルに数値はあるか？
                    for(let k = 0; k < op.length; k++){
                        if(existRowOptionData(i, j, op[k]) == false){
                            //alert('行確定 i=' + i + '   j=' + j + '   op=' + op[k]);
                            numberData[i][j] = Number(op[k]);
                            fixed = true;
                            break step2;    // step2を再実行
                        }
                        if(existColOptionData(i, j, op[k]) == false){
                            //alert('列確定 i=' + i + '   j=' + j + '   op=' + op[k]);
                            numberData[i][j] = Number(op[k]);
                            fixed = true;
                            break step2;    // step2を再実行
                        }
                        if(existBoxOptionData(i, j, op[k]) == false){
                            //alert('ボックス確定 i=' + i + '   j=' + j + '   op=' + op[k]);
                            numberData[i][j] = Number(op[k]);
                            fixed = true;
                            break step2;    // step2を再実行
                        }
                    }
                }
            }
        }
        break;
    }
    //alert('step2終了');

    // 登録後再描画
    reDrawingTable();

    //alert('solver= ' + fixed);
    return fixed;
}
*/

// 候補値リセット
function resetOptionData(){
    optionData = Array.from({length: 9}, () => Array(9).fill(0));

    for(let i = 0; i < 9; i++){
        for(let j = 0; j < 9; j++){
            if(numberData[i][j] == 0){
                let rowData = getRowData(i);
                let rowNothingData = getNothingNum([1,2,3,4,5,6,7,8,9], rowData);
                let colData = getColData(j);
                let colNothingData = getNothingNum(rowNothingData, colData);
                let boxData = getBoxData(getBoxNo(i, j));
                let boxNothingData = getNothingNum(colNothingData, boxData);
                
                // 有効な数値が残っているかチェック
                let validCheck = boxNothingData.filter(v => v !== undefined && v !== null);
                if(validCheck.length === 0){
                    return false;
                }
                optionData[i][j] = boxNothingData;
            } else {
                optionData[i][j] = numberData[i][j];
            }
        }
    }
    return true;
}

/*
// 候補値リセット
function resetOptionData(){
    optionData = [
        [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
        [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
        [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
        [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
        [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
        [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
        [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
        [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
        [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
    ];

    // セルごとに候補値を保管
    for(let i = 0; i < 9; i++){
        for(let j = 0; j < 9; j++){
            //alert('i=' + i + '   j=' + j + '   numberData[i][j]=' + numberData[i][j]);
            if(numberData[i][j] == 0){
                let rowData = getRowData(i);
                let rowNothingData = getNothingNum([1,2,3,4,5,6,7,8,9], rowData);
                let colData = getColData(j);
                let colNothingData = getNothingNum(rowNothingData, colData);
                // iとjでボックス値k
                let boxData = getBoxData(getBoxNo(i, j));
                let boxNothingData = getNothingNum(colNothingData, boxData);
                //alert(boxNothingData);
                if(boxNothingData == ',,,,,,,,'){
                    //alert('i=' + i + '   j=' + j + '   候補なし！');
                    return false;
                }
                optionData[i][j] = boxNothingData;
            } else {
                optionData[i][j] = numberData[i][j];
            }
        }
    }

    return true;
}
*/

// 問題再描画
function reDrawingTable(){
    resetData();

    parent = document.getElementById('mainScreen');
    while(parent.firstChild){
        parent.removeChild(parent.firstChild);
    }
    makeTable('mainScreen');
}

// ボックス番号を返す (0〜8)
function getBoxNo(row, col){
    return Math.floor(row / 3) * 3 + Math.floor(col / 3);
}
/*
// ボックス番号を返す
function getBoxNo(row, col){
    let no;
    if((row == 0 || row == 1 || row == 2) && (col == 0 || col == 1 || col == 2)) no = 0;
    if((row == 0 || row == 1 || row == 2) && (col == 3 || col == 4 || col == 5)) no = 1;
    if((row == 0 || row == 1 || row == 2) && (col == 6 || col == 7 || col == 8)) no = 2;
    if((row == 3 || row == 4 || row == 5) && (col == 0 || col == 1 || col == 2)) no = 3;
    if((row == 3 || row == 4 || row == 5) && (col == 3 || col == 4 || col == 5)) no = 4;
    if((row == 3 || row == 4 || row == 5) && (col == 6 || col == 7 || col == 8)) no = 5;
    if((row == 6 || row == 7 || row == 8) && (col == 0 || col == 1 || col == 2)) no = 6;
    if((row == 6 || row == 7 || row == 8) && (col == 3 || col == 4 || col == 5)) no = 7;
    if((row == 6 || row == 7 || row == 8) && (col == 6 || col == 7 || col == 8)) no = 8;
    return no;
}
*/

// 値が行データに存在するかどうか
function existRowData(row, col, num){
    let rowData = getRowData(row);
    for(let j = 0; j < 9; j++){
        if(j == col) continue;  // 自分自身は飛ばす
        if(rowData[j] == num) return true;
    }
    return false;
}

// 値が列データに存在するかどうか
function existColData(row, col, num){
    let colData = getColData(col);
    for(let i = 0; i < 9; i++){
        if(i == row) continue;  // 自分自身は飛ばす
        if(colData[i] == num) return true;
    }
    return false;
}

// 値がボックスデータに存在するかどうか
function existBoxData(row, col, num){
    let box = getBoxNo(row, col);
    let startRow = Math.floor(box / 3) * 3;
    let startCol = (box % 3) * 3;

    for(let i = startRow; i < startRow + 3; i++){
        for(let j = startCol; j < startCol + 3; j++){
            if(i == row && j == col) continue;
            if(numberData[i][j] == num) return true;
        }
    }
    return false;
}

/*
// 値がボックスデータに存在するかどうか
function existBoxData(row, col, num){
    let bool = false;
    let box = getBoxNo(row, col);
    if(box == 0 || box == 1 || box == 2){
        for(let i = 0; i < 3; i++){
            for(let j = box * 3; j < box * 3 + 3; j++){
                if(i == row && j == col) continue;  // 自分自身は飛ばす
                let boxData = getBoxData(box);
                for(let k = 0; k < boxData.length; k++){
                    if(num == boxData[k]) bool = true;
                }
            }
        }
    }
    if(box == 3 || box == 4 || box == 5){
        for(let i = 3; i < 6; i++){
            for(let j = (box - 3) * 3; j < (box - 3) * 3 + 3; j++){
                if(i == row && j == col) continue;  // 自分自身は飛ばす
                let boxData = getBoxData(box);
                for(let k = 0; k < boxData.length; k++){
                    if(num == boxData[k]) bool = true;
                }
            }
        }
    }
    if(box == 6 || box == 7 || box == 8){
        for(let i = 6; i < 9; i++){
            for(let j = (box - 6) * 3; j < (box - 6) * 3 + 3; j++){
                if(i == row && j == col) continue;  // 自分自身は飛ばす
                let boxData = getBoxData(box);
                for(let k = 0; k < boxData.length; k++){
                    if(num == boxData[k]) bool = true;
                }
            }
        }
    }
    return bool
}
*/

// 値が列データの候補値に存在するかどうか
function existRowOptionData(row, col, num){
    let bool = false;
    for(let j = 0; j < 9; j++){
        let op = optionData[row][j].toString().split(',');
        if(j == col) continue;  // 自分自身は飛ばす
        for(let k = 0; k < op.length; k++){
            if(num == op[k]) bool = true;
        }
    }
    return bool
}

// 値が列データの候補値に存在するかどうか
function existColOptionData(row, col, num){
    let bool = false;
    for(let i = 0; i < 9; i++){
        let op = optionData[i][col].toString().split(',');
        if(i == row) continue;  // 自分自身は飛ばす
        for(let k = 0; k < op.length; k++){
            if(num == op[k]) bool = true;
        }
    }
    return bool
}

// 値がボックスデータの候補値に存在するかどうか
function existBoxOptionData(row, col, num){
    let box = getBoxNo(row, col);
    let startRow = Math.floor(box / 3) * 3;
    let startCol = (box % 3) * 3;

    for(let i = startRow; i < startRow + 3; i++){
        for(let j = startCol; j < startCol + 3; j++){
            if(i == row && j == col) continue;
            if(numberData[i][j] !== 0) continue;
            let op = optionData[i][j].toString().split(',');
            if(op.includes(num.toString())) return true;
        }
    }
    return false;
}

/*
// 値がボックスデータの候補値に存在するかどうか
function existBoxOptionData(row, col, num){
    let bool = false;
    let box = getBoxNo(row, col);
    if(box == 0 || box == 1 || box == 2){
        for(let i = 0; i < 3; i++){
            for(let j = box * 3; j < box * 3 + 3; j++){
                let op = optionData[i][j].toString().split(',');
                if(i == row && j == col) continue;  // 自分自身は飛ばす
                for(let k = 0; k < op.length; k++){
                    if(num == op[k]) bool = true;
                }
            }
        }
    }
    if(box == 3 || box == 4 || box == 5){
        for(let i = 3; i < 6; i++){
            for(let j = (box - 3) * 3; j < (box - 3) * 3 + 3; j++){
                let op = optionData[i][j].toString().split(',');
                if(i == row && j == col) continue;  // 自分自身は飛ばす
                for(let k = 0; k < op.length; k++){
                    if(num == op[k]) bool = true;
                }
            }
        }
    }
    if(box == 6 || box == 7 || box == 8){
        for(let i = 6; i < 9; i++){
            for(let j = (box - 6) * 3; j < (box - 6) * 3 + 3; j++){
                let op = optionData[i][j].toString().split(',');
                if(i == row && j == col) continue;  // 自分自身は飛ばす
                for(let k = 0; k < op.length; k++){
                    if(num == op[k]) bool = true;
                }
            }
        }
    }
    return bool
}
*/

// 無い数字を返す
function getNothingNum(array, check){
    // array = [1,2,3,4,5,6,7,8,9] もしくはその一部
    // check（既に盤面にある数字の配列）に含まれる数字を array から除外（空文字に置換）する
    let currentArray = [...array];
    for(let i = 0; i < check.length; i++){
        let targetNum = check[i];
        if (targetNum > 0) { // 0（空白）は除外対象にしない
            let index = currentArray.indexOf(targetNum);
            if (index !== -1) {
                currentArray[index] = ""; // 空文字に置き換えることで元のカンマ構造を維持
            }
        }
    }
    return currentArray;
}

/*
// 無い数字を返す
function getNothingNum(array, check){
    // array = [1,2,3,4,5,6,7,8,9];
    // checkにある数字をarrayから削除して戻す
    for(i = 0; i < 10; i++){
        delete array[check[i] - 1];
    }
    return array;
}
*/

// 指定の行データを返す
function getRowData(row){
    let rowData = [];
    for(let j = 0; j < 9; j++){
        rowData.push(numberData[row][j]);
    }
    return rowData;
}

// 指定の列データを返す
function getColData(col){
    let colData = [];
    for(let i = 0; i < 9; i++){
        colData.push(numberData[i][col]);
    }
    return colData;
}

// 指定のブロックデータを返す
function getBoxData(box){
    let boxData = [];
    if(box == 0 || box == 1 || box == 2){
        for(let i = 0; i < 3; i++){
            for(let j = box * 3; j < box * 3 + 3; j++){
                boxData.push(numberData[i][j]);
            }
        }
    }
    if(box == 3 || box == 4 || box == 5){
        for(let i = 3; i < 6; i++){
            for(let j = (box - 3) * 3; j < (box - 3) * 3 + 3; j++){
                boxData.push(numberData[i][j]);
            }
        }
    }
    if(box == 6 || box == 7 || box == 8){
        for(let i = 6; i < 9; i++){
            for(let j = (box - 6) * 3; j < (box - 6) * 3 + 3; j++){
                boxData.push(numberData[i][j]);
            }
        }
    }
    return boxData;
}

// グリッドの動的作成
function makeTable(parentId){
    // グリッドの作成開始
    let rows=[];
    let table = document.createElement('table');
    table.setAttribute('id', 'numberplace');

    // 2次元配列の要素を格納
    for(let i = 0; i < 9; i++){
        rows.push(table.insertRow(-1));
        for(let j = 0; j < 9; j++){
            let cell = rows[i].insertCell(-1);
            // 背景色のデータ用と入力位置用id
            let idString = i.toString() + IdSeparator + j.toString();
            // 枠の設定
            cell.style.borderStyle = 'solid';
            cell.style.backgroundColor = 'palegreen';
            cell.style.borderLeftWidth = OuterThickness.toString() + 'px';
            if(j == 0 || j == 3 || j == 6) cell.style.borderLeftWidth = DivisionThickness.toString() + 'px';
            cell.style.borderTopWidth = OuterThickness.toString() + 'px';
            if(i == 0 || i == 3 || i == 6) cell.style.borderTopWidth = DivisionThickness.toString() + 'px';
            cell.style.borderRightWidth = OuterThickness.toString() + 'px';
            if(j == 2 || j == 5 || j == 8) cell.style.borderRightWidth = DivisionThickness.toString() + 'px';
            cell.style.borderBottomWidth = OuterThickness.toString() + 'px';
            if(i == 2 || i == 5 || i == 8) cell.style.borderBottomWidth = DivisionThickness.toString() + 'px';
            cell.style.fontSize = NumberMojiSize.toString() + 'px';
            cell.setAttribute('id', idString);
            let strData = numberData[i][j].toString();
            let intNum = parseInt(strData);
            // 数字を出力するdivタグ
            let numpl = document.createElement('div');
            if(intNum == 0){
                // 0なら入力可能にする
                let inputId = 'inp' + idString;
                let input = document.createElement('input');
                input.type = 'number';
                input.autocomplete = 'off';
                input.min = '1';
                input.max = '9';
                input.style.fontSize = NumberMojiSize.toString() + 'px';
                input.setAttribute('id', inputId);
                input.setAttribute('class', 'input');
                numpl.appendChild(input);
            } else {
                // 数字表示
                numpl.textContent = numberData[i][j];
            }
            cell.appendChild(numpl);
        }
    }
    // 指定した親要素に加える
    document.getElementById(parentId).appendChild(table);
}

// ボタンアクション設定
function makeButtonAction(){
    // やり直す
    let resetButton = document.getElementById('reset');
    resetButton.addEventListener('click', function(event){
        drawingTable();
    });

    // ヒント
    let hintButton = document.getElementById('hint');
    hintButton.addEventListener('click', function(event){
        event.preventDefault();
        solver();
    });

    // ソルバー
    let solverButton = document.getElementById('solver');
    solverButton.addEventListener('click', function(event){
        event.preventDefault();
        loopSolver();
    });

    // ジェネレータ
    let generatorButton = document.getElementById('generator');
    generatorButton.addEventListener('click', function(event){
        event.preventDefault();
        generator();
    })

}

// HTML読み込み後、自動実行
function onLoad(){
    // ビューポートの設定
    //UpdateViewport();

    // 問題選択肢作成
    for(let i = 1; i <= numberDataArray.length; i++){
        let option = document.createElement("option");
        option.text = i;
        option.value = i;
        // selectタグの子要素にoptionタグを追加する
        dataNumber.appendChild(option);
    }

    // グリッドの動的作成
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
    if(isNaN(dataNo)){
        numberData = [
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
        ];
    } else {
        // ポインターコピーなので、元データも書き換わってしまう
        // JavaScriptでは、配列はオブジェクトの一つであり、オブジェクトは参照渡しになるため、配列も参照渡しになります。
        // したがって、変数にはオブジェクトの参照が格納されています。
        // JSON.parse(JSON.stringify(object))は、JavaScriptのオブジェクトをディープコピー（深いコピー）するための一般的な手法
        numberData = JSON.parse(JSON.stringify(numberDataArray[dataNo - 1]));
    }

    // 表示サイズの計算
    zoomCalc();

    // 問題の動的作成
    makeTable('mainScreen');
}

// 初期化
function resetData(){
    // 成功画像非表示
    let si = document.getElementById('successImage');
    si.style.display = 'none';
}

// 表示倍率計算
function zoomCalc(){
    // 表示サイズの計算
    let mainScreen = document.getElementById('mainScreen');
    let bw = window.innerWidth;
    let bh = window.innerHeight - 230;          //230は表題やボタンなどの縦幅による
    let gridw = numberData[0].length * 140;     //140は実際にやってみた感じで
    let gridh = numberData.length * 140;        //140は実際にやってみた感じで
    //alert("numberData[0].length=" + numberData[0].length + "   numberData.length=" + numberData.length)

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
