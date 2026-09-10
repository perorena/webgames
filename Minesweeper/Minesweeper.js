const OuterThickness = 3;
const InnerThickness = 1;
const NumberMojiSize = '50';
const IdSeparator = '#';
const Root = '../img/';
const JiraiImageSrc = Root + 'jirai.png';
const FlagImageSrc = Root + 'flag_rainbow.png';

// 色の設定
const colorGray = 'gray';
const colorBlack = 'black';
const colorWhite = 'white';
const colorName = ['yellow', 'slategray', 'yellowgreen', 'aqua', 'pink', 'lightskyblue', 'orange', 'springgreen', 'plum', 'peru', 'mistyrose',
'magenta', 'sandybrown', 'cadetblue', 'chartreuse', 'orangered', 'olive', 'firebrick', 'indigo', 'dimgray', 'mediumseagreen',
'lime', 'steelblue', 'deeppink', 'khaki', 'darkviolet', 'darkgreen', 'navy', 'maroon', 'purple'];

// 1回目クリックフラグ
let firstClick = true;

// ゲームオーバーフラグ
let gameOver = false;

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

// 長押し制御用
let longPushId;
let longPushCount = 0;
const LongPushTime = 20;    // カウンター判定用
const IntervalTime = 10;    // ミリ秒

// 地雷グリッドの動的作成
function makeTable(parentId){
    // 地雷グリッドの作成開始
    let rows=[];
    let table = document.createElement('table');
    table.setAttribute('id', 'jiraiGrid');

    // 地雷グリッドのセル作成
    for(let i = 0; i < maxRow; i++){
        rows.push(table.insertRow(-1));
        for(let j = 0; j < maxCol; j++){
            let cell = rows[i].insertCell(-1);
            // 地雷グリッドの設定
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

            // 地雷グリッドのセル（tdタグ）にidを割り振る
            let idString = i.toString() + IdSeparator + j.toString();
            cell.setAttribute('id', 'cell-' + idString);

            // --- PC用のイベント ---
            // マウスの左クリックでセルを開く
            cell.addEventListener('click', function(event){
                event.preventDefault();
                jiraiClick(event.target);
            });
            // マウスの右クリックで旗を立てる
            cell.addEventListener('contextmenu', function(event){
                event.preventDefault();
                jiraiLongClick(event.target);
            });

            // --- スマホ用の長押し（タッチ）イベント ---
            cell.addEventListener('touchstart', function(event){
                event.preventDefault();
                longPushId = setInterval(pushStart, IntervalTime);
            });
            cell.addEventListener('touchend', function(event){
                event.preventDefault();
                pushEnd(event.target);
            });
        }
    }
    // 指定したdiv要素に迷路を加える
    document.getElementById(parentId).appendChild(table);

}

// セルを押した
function pushStart(){
    longPushCount = longPushCount + 1;
}

// セルから離れた
function pushEnd(target){
    // タイマー解除とカウントリセット
    clearInterval(longPushId);
    
    // ターゲットが画像（旗）だった場合、親要素のセルを取得する
    let cellElement = target;
    if (target.tagName.toLowerCase() === 'img') {
        cellElement = target.parentNode;
    }

    if(longPushCount > LongPushTime){
        longPushCount = 0;
        jiraiLongClick(cellElement);
    } else {
        longPushCount = 0;
        if (cellElement.firstChild === null) {
            jiraiClick(cellElement);
        }
    }
}

// 地雷グリッドクリック
function jiraiClick(target){
    // 画像をクリックしてしまった場合でもセルのIDを取得できるように修正
    let targetId = target.id.startsWith('cell-') ? target.id : target.parentNode.id;
    let pos = targetId.replace('cell-', ''); // 座標文字列の取り出し
    let rc = pos.split(IdSeparator);
    let i = parseInt(rc[0]);
    let j = parseInt(rc[1]);
    let cellValue = gridData[i][j];

    // すでに開いている、または旗がある場合は何もしない
    let cell = document.getElementById(targetId);
    if (cellValue < 0 || cell.firstChild !== null) return;

    if(cellValue == 0){
        if(firstClick == true){
            // 地雷作成
            makeJirai(i, j);
            firstClick = false;
            let answerButton = document.getElementById('answer');
            // 【修正】標準プロパティのdisabledのみに統一
            answerButton.disabled = false;
            // １回目のクリックセル表示
            cellValue = gridData[i][j];
            if(cellValue == 0){
                gridData[i][j] = -9;
                // 一気に開く
                openSafetyCell(i,j);
            } else if(1 <= cellValue && cellValue <= 8){
                gridData[i][j] = -1 * cellValue;
            }
        } else {
            gridData[i][j] = -9;
            // 一気に開く
            openSafetyCell(i,j);
        }
    } else if(1 <= cellValue && cellValue <= 8){
        gridData[i][j] = -1 * cellValue;
    } else if(cellValue == 9){
        gameOver = true;
    }
    // 地雷グリッド表示
    jiraiGridView();
}

// 地雷グリッド長押し（または右クリック）で旗設置と旗削除
function jiraiLongClick(target){
    // 画像クリック時でも親のセルIDを正しく見るように統一
    let targetId = target.id.startsWith('cell-') ? target.id : target.parentNode.id;
    let pos = targetId.replace('cell-', '');
    let rc = pos.split(IdSeparator);
    let i = parseInt(rc[0]);
    let j = parseInt(rc[1]);
    let cellValue = gridData[i][j];
    
    // すでに開かれているマスには旗を立てられないようにする
    if (cellValue < 0) return;

    let cell = document.getElementById(targetId);
    // 長押しセルに既に旗がなければ追加、あれば削除
    if(cell.firstChild == null){
        let img = document.createElement('img');
        img.setAttribute('class', 'sg');
        img.src = FlagImageSrc;
        img.style.zIndex = 2; // 【修正】旗の zIndex を高めにして上に重なるように
        cell.setAttribute('class', 'psg');
        cell.appendChild(img);
    } else {
        // すでに旗がある状態で右クリック/長押しされたら、旗を削除する（imageClickの役割を統合）
        cell.removeChild(cell.firstChild);
    }
}

// 地雷作成
function makeJirai(fi, fj){
    // 地雷の配置
    let counter = jiraiNumber;
    while(true){
        let i = getRandomInt(maxRow);
        let j = getRandomInt(maxCol);
        if(fi == i && fj == j) continue;
        if(gridData[i][j] != 9){
            gridData[i][j] = 9;
            counter = counter - 1;
        }
        if(counter <= 0) break;
    }

    // 地雷周辺情報作成
    for(let i = 0; i < maxRow; i++){
        for(let j = 0; j < maxCol; j++){
            //周辺セル調査
            if(gridData[i][j] == 9){
                let up = i - 1;
                let down = i + 1;
                let left = j - 1;
                let right = j + 1;

                if(up >= 0){
                    //上
                    if(gridData[up][j] != 9){
                        gridData[up][j] = gridData[up][j] + 1;
                    }
                    //右上
                    if(right < maxCol){
                        if(gridData[up][right] != 9){
                            gridData[up][right] = gridData[up][right] + 1;
                        }
                    }
                    //左上
                    if(left >= 0){
                        if(gridData[up][left] != 9){
                            gridData[up][left] = gridData[up][left] + 1;
                        }
                    }
                }
                if(down < maxRow){
                    //下
                    if(gridData[down][j] != 9){
                        gridData[down][j] = gridData[down][j] + 1;
                    }
                    if(right < maxCol){
                        //右下
                        if(gridData[down][right] != 9){
                            gridData[down][right] = gridData[down][right] + 1;
                        }
                    }
                    if(left >= 0){
                        //左下
                        if(gridData[down][left] != 9){
                            gridData[down][left] = gridData[down][left] + 1;
                        }
                    }
                }

                if(right < maxCol){
                    //右
                    if(gridData[i][right] != 9){
                        gridData[i][right] = gridData[i][right] + 1;
                    }
                }

                if(left >= 0){
                    //左
                    if(gridData[i][left] != 9){
                        gridData[i][left] = gridData[i][left] + 1;
                    }
                }
            }
        }
    }
}

// 乱数
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

// 地雷グリッド表示
function jiraiGridView(){
    for(let i = 0; i < maxRow; i++){
        for(let j = 0; j < maxCol; j++){
            let idString = i.toString() + IdSeparator + j.toString();
            let cell = document.getElementById('cell-' + idString);
            let cellValue = gridData[i][j];
            
            // 開いたときに中身の旗があれば消去する処理を追加
            if (cellValue < 0 && cell.firstChild) {
                cell.removeChild(cell.firstChild);
            }

            if(cellValue == 0){
                cell.style.backgroundColor = colorGray;
            } else if(1 <= cellValue && cellValue <= 8){
                cell.style.backgroundColor = colorGray;
            } else if(cellValue == 9){
                if(gameOver){
                    cell.style.backgroundColor = colorWhite;
                    
                    // 【修正】もしすでに地雷画像がある場合はスキップ（重複防止）
                    // 旗がある場合は、その旗を残したまま、奥（最初）に地雷画像を挿入する
                    let hasJirai = false;
                    for(let child of cell.children) {
                        if(child.src && child.src.includes('jirai.png')) {
                            hasJirai = true;
                            break;
                        }
                    }

                    if(!hasJirai) {
                        // 地雷画像を生成
                        let jiraiImg = document.createElement('img');
                        jiraiImg.setAttribute('class', 'sg');
                        jiraiImg.src = JiraiImageSrc;
                        jiraiImg.style.zIndex = 1; // 旗(zIndex=2)より下に配置
                        cell.setAttribute('class', 'psg');

                        // すでに旗がある場合は、旗の手前（セルの最初）に地雷を挿入することで重ねる
                        if(cell.firstChild) {
                            cell.insertBefore(jiraiImg, cell.firstChild);
                            // 【修正】エラー防止のため、確実に要素が存在する場合のみスタイルを適用
                            if (cell.firstChild.nextSibling && cell.firstChild.nextSibling.style) {
                                cell.firstChild.nextSibling.style.marginTop = `-${NumberMojiSize}px`;
                            }
                        } else {
                            cell.appendChild(jiraiImg);
                        }
                    }
                } else {
                    cell.style.backgroundColor = colorGray;
                }
            } else if(-8 <= cellValue && cellValue <= -1){
                cell.style.backgroundColor = colorWhite;
                cell.style.color = colorName[Math.abs(cellValue)];
                cell.textContent = Math.abs(cellValue);
            } else if(cellValue == -9){
                cell.style.backgroundColor = colorWhite;
                cell.textContent = ""; // 0のときは文字を空に
            }
        }
    }
}

// 一気に開く
function openSafetyCell(i, j){
    // 周辺8方向のオフセット定義
    const directions = [
        [-1, 0], [1, 0], [0, -1], [0, 1],   // 上下左右
        [-1, -1], [-1, 1], [1, -1], [1, 1]  // 斜め4方向
    ];

    for (let [di, dj] of directions) {
        let ni = i + di;
        let nj = j + dj;

        // 盤面内かどうかのチェック
        if (ni >= 0 && ni < maxRow && nj >= 0 && nj < maxCol) {
            let val = gridData[ni][nj];

            // まだ開いていない安全地帯(0)の場合
            if (val === 0) {
                gridData[ni][nj] = -9;
                openSafetyCell(ni, nj); // 再帰呼出し
            } 
            // 隣接する数字セル(1〜8)も1マスだけ一緒に開く
            else if (1 <= val && val <= 8) {
                gridData[ni][nj] = -1 * val;
            }
        }
    }
}

// 地雷グリッドのidを返す
function positionCheck(row, col){
    let pos = '';
    if((row >= 0 && row < maxRow) && (col >= 0 && col < maxCol)){
        pos = row.toString() + IdSeparator + col.toString();
    }
    return pos;
}

// ボタンアクション設定
function makeButtonAction(){
    // やり直す
    let resetButton = document.getElementById('reset');
    resetButton.addEventListener('click', function(event){
        drawingTable();
    });
    // 回答
    let answerButton = document.getElementById('answer');
    answerButton.addEventListener('click', function(event){
        gameOver = true;
        jiraiGridView();
    });
}


// HTML読み込み後、自動実行
function onLoad(){
    // 問題選択肢作成
    for(let i = 2; i <= jiraiNumberArray.length; i++){
        let option = document.createElement("option");
        option.text = i;
        option.value = i;
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

    // 初期化
    firstClick = true;
    gameOver = false;

    // 回答ボタン
    let answerButton = document.getElementById('answer');
    // 【修正】標準プロパティのdisabledのみに統一
    answerButton.disabled = true;

    // 問題設定
    dataNo = parseFloat (dataNumber.value);
    
    // 元の配列の大きさを取得し、新しく空の2次元配列として初期化（元データの破壊を防ぐ）
    let targetTemplate = gridDataArray[dataNo - 1];
    maxRow = targetTemplate.length;
    maxCol = targetTemplate[0].length;
    
    gridData = [];
    for(let i = 0; i < maxRow; i++){
        gridData[i] = [];
        for(let j = 0; j < maxCol; j++){
            gridData[i][j] = 0;
        }
    }

    jiraiNumber = jiraiNumberArray[dataNo - 1];

    // 表示サイズの計算
    zoomCalc();

    // 問題の動的作成
    makeTable('mainScreen');  
}

// 表示倍率計算
function zoomCalc(){
    let mainScreen = document.getElementById('mainScreen');
    zoom = 0.5;
    mainScreen.style.transformOrigin = 'top left';
    mainScreen.style.transform ='scale(' + zoom.toString() + ',' + zoom.toString() + ')';
}