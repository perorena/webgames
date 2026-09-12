const IdSeparator = '#';
const Root = '../img/';
const SuccessImageSrc = Root + 'clear.png';
const RengaImageSrc = Root + 'renga.png';
const BoxImageSrc = Root + 'box1.png';
const BoxFixImageSrc = Root + 'box2.png';
const PlayerRightImageSrc = Root + 'dog_right.png';
const PlayerLeftImageSrc = Root + 'dog_left.png';
const PlayerUpImageSrc = Root + 'dog_back.png';
const PlayerDownImageSrc = Root + 'dog_front.png';

//0:空間
//1:壁
//2:置き場所
//3:荷物
//4:プレーヤー
//5:置き場所 + 荷物
const Space = 0;
const RengaWall = 1;
const StoragePlace = 2;
const Box = 3;
const Player = 4;
const StoragePlaceBox = StoragePlace + Box;

// 置き場所データ
let storagePlaceDataArray = [];

// 荷物ID用カウンター
let boxCounter;

// 問題データ指定
let dataNumber = document.getElementById("dataNumber");

// 問題変更時のイベントリスナー
dataNumber.addEventListener("change", drawingTable);

// 問題番号
let dataNo;

// 迷路データの個数
let maxRow;
let maxCol;

// ズーム値
let zoom = 1.0;

// Webページのロードが完了した後に呼び出されるロードイベントを設定する
window.addEventListener("load", onLoad, false);

// キーが押されたときのリスナー
document.addEventListener('keydown', keyDown, false);

// 矢印キーアクション
function arrowAction(action){
    let player = document.getElementById('player');
    if(player != null){
        let pTd = player.parentNode;
        let colInx = pTd.cellIndex;
        let pTr = pTd.parentNode;
        let rowInx = pTr.rowIndex;

        // プレーや画像削除
        player.parentNode.removeChild(player);

        if(action == 'ArrowRight' && colInx < maxCol){
            let intTarget = soukoData[rowInx][colInx + 1];
            if(intTarget == Space || intTarget == StoragePlace){
                // 押した側の隣のセルが「空間」か「置き場所」の場合
                pTd = pTd.nextSibling;
            } else if(intTarget == Box){
                // 押した側の隣のセルが「荷物」の場合
                let ret = boxMove(rowInx, colInx + 1, rowInx, colInx + 2, Space);
                if(ret == Space || ret == StoragePlace) pTd = pTd.nextSibling;
            } else if(intTarget == StoragePlaceBox){
                // 押した側の隣のセルが「置き場所 + 荷物」の場合
                let ret = boxMove(rowInx, colInx + 1, rowInx, colInx + 2, StoragePlace);
                if(ret == Space || ret == StoragePlace) pTd = pTd.nextSibling;
            }
        }
        if(action == 'ArrowLeft' && colInx > 0){
            let intTarget = soukoData[rowInx][colInx - 1];
            if(intTarget == Space || intTarget == StoragePlace){
                pTd = pTd.previousSibling;
            } else if(intTarget == Box){
                let ret = boxMove(rowInx, colInx - 1, rowInx, colInx - 2, Space);
                if(ret == Space || ret == StoragePlace) pTd = pTd.previousSibling;
            } else if(intTarget == StoragePlaceBox){
                let ret = boxMove(rowInx, colInx - 1, rowInx, colInx - 2, StoragePlace);
                if(ret == Space || ret == StoragePlace) pTd = pTd.previousSibling;
            }
        }
        if(action == 'ArrowDown' && rowInx < maxRow){
            let intTarget = soukoData[rowInx + 1][colInx];
            if(intTarget == Space || intTarget == StoragePlace){
                pTr = pTr.nextSibling;
                pTd = pTr.firstChild;
                for(let i=0; i < colInx; i++){
                    pTd = pTd.nextSibling;
                }
            } else if(intTarget == Box){
                let ret = boxMove(rowInx + 1, colInx, rowInx + 2, colInx, Space);
                if(ret == Space || ret == StoragePlace){
                    pTr = pTr.nextSibling;
                    pTd = pTr.firstChild;
                    for(let i=0; i < colInx; i++){
                        pTd = pTd.nextSibling;
                    }
                }
            } else if(intTarget == StoragePlaceBox){
                let ret = boxMove(rowInx + 1, colInx, rowInx + 2, colInx, StoragePlace);
                if(ret == Space || ret == StoragePlace){
                    pTr = pTr.nextSibling;
                    pTd = pTr.firstChild;
                    for(let i=0; i < colInx; i++){
                        pTd = pTd.nextSibling;
                    }
                }
            }
        }
        if(action == 'ArrowUp' && rowInx > 0){
            let intTarget = soukoData[rowInx - 1][colInx];
            if(intTarget == Space || intTarget == StoragePlace){
                pTr = pTr.previousSibling;
                pTd = pTr.firstChild;
                for(let i=0; i < colInx; i++){
                    pTd = pTd.nextSibling;
                }
            } else if(intTarget == Box){
                let ret = boxMove(rowInx - 1, colInx, rowInx - 2, colInx, Space);
                if(ret == Space || ret == StoragePlace){
                    pTr = pTr.previousSibling;
                    pTd = pTr.firstChild;
                    for(let i=0; i < colInx; i++){
                        pTd = pTd.nextSibling;
                    }
                }
            } else if(intTarget == StoragePlaceBox){
                let ret = boxMove(rowInx - 1, colInx, rowInx - 2, colInx, StoragePlace);
                if(ret == Space || ret == StoragePlace){
                    pTr = pTr.previousSibling;
                    pTd = pTr.firstChild;
                    for(let i=0; i < colInx; i++){
                        pTd = pTd.nextSibling;
                    }
                }
            }
        }
        // 再描画
        if(pTd != null){
            // プレーヤー
            let img = document.createElement('img');
            img.setAttribute('id', 'player');
            img.setAttribute('class', 'sg');
            img.src = PlayerRightImageSrc;
            if(action == 'ArrowRight') img.src = PlayerRightImageSrc;
            if(action == 'ArrowLeft') img.src = PlayerLeftImageSrc;
            if(action == 'ArrowUp') img.src = PlayerUpImageSrc;
            if(action == 'ArrowDown') img.src = PlayerDownImageSrc;
            pTd.appendChild(img);
        }
        // クリア判定
        let clearFlag = true;
        for(let l = 0; l < storagePlaceDataArray.length; l++){
            let rc = storagePlaceDataArray[l].split(IdSeparator);
            let i = parseInt(rc[0]);
            let j = parseInt(rc[1]);
            let box = soukoData[i][j];
            if(box != StoragePlaceBox) clearFlag = false;
        }
        if(clearFlag){
            let si = document.getElementById('successImage');
            si.style.display = 'block';
            let resetButton = document.getElementById('reset');
            resetButton.disabled = true;
            let leftButton = document.getElementById('lbtn');
            leftButton.disabled = true;
            let upButton = document.getElementById('ubtn');
            upButton.disabled = true;
            let downButton = document.getElementById('dbtn');
            downButton.disabled = true;
            let rightButton = document.getElementById('rbtn');
            rightButton.disabled = true;
        }
    }
}

// 荷物移動
// 修正したコードで正常動作するならば、引数dataはいらないな
function boxMove(rowNext, colNext, rowTwoAhead, colTwoAhead, data){
    // 押した側の隣のセルが「置き場所 + 荷物」の場合
    let intTwoAhead = soukoData[rowTwoAhead][colTwoAhead];
    //alert('intTwoAhead=' + intTwoAhead);
    if(intTwoAhead == Space || intTwoAhead == StoragePlace){
        // 荷物を移動
        let idString = rowNext.toString() + IdSeparator + colNext.toString();
        let boxCell = document.getElementById(idString);
        //let cnt = boxCell.childElementCount; //子要素の数。テキストノード、コメントノードはカウントしない。
        let cnt = boxCell.childNodes.length;
        //alert('cnt=' + cnt);
        let boxImg = boxCell.firstChild;
        // nodeType 1:要素ノード 2:属性ノード 3:テキストノード ...
        //if(boxImg.tagName == 'undefined' || boxImg.nodeType == 3) boxImg = boxImg.nextSibling;
        for(let i=0; i < cnt; i++){
            if(boxImg.tagName == 'IMG'){
                break;
            }
            boxImg = boxImg.nextSibling;
        }
        if(boxImg != null){
            // 荷物のIDを取得
            let imgID = boxImg.getAttribute('id').toString()
            //alert('imgID=' + imgID);
            // 荷物画像削除
            boxImg.parentNode.removeChild(boxImg);
            // 移動先のセルの取得
            let idNewString = rowTwoAhead.toString() + IdSeparator + colTwoAhead.toString();
            //alert('idNewString=' + idNewString);
            let boxNewCell = document.getElementById(idNewString);
            let img = document.createElement('img');
            img.setAttribute('id', imgID);
            img.setAttribute('class', 'sg');
            img.src = BoxImageSrc;
            if(StoragePlace == soukoData[rowTwoAhead][colTwoAhead]) img.src = BoxFixImageSrc;   //2つ先が保管場所なら木箱の色を変える
            boxNewCell.appendChild(img);
            // 倉庫データの更新　下記だと荷物が保管場所に重なった時に保管場所データが消えてしまう
            //soukoData[rowNext][colNext] = data;   //これでも動作する
            // 【修正】現在のセルから荷物(Box=3)を引く（元が5なら2になり保管場所が残る、元が3なら0になり空間になる）
            soukoData[rowNext][colNext] = soukoData[rowNext][colNext] - Box;
            //alert('押した側の隣のセルが「置き場所 + 荷物」の場合 soukoData[rowInx][colInx + 1]' + soukoData[rowInx][colInx + 1].toString());
            // 【修正】2つ先のセルに荷物(Box=3)を加算する
            soukoData[rowTwoAhead][colTwoAhead] = soukoData[rowTwoAhead][colTwoAhead] + Box;
            //alert('押した側の隣のセルが「置き場所 + 荷物」の場合 soukoData[rowInx][colInx + 2]' + soukoData[rowInx][colInx + 2].toString());
        }
    }
    return intTwoAhead;
}

// キーが押されたとき
function keyDown(event){
    let strArrow = event.key;
    // BackSpace 8 Enter 13 テンキー 96～105 数字 48～57
    if(event.keyCode === 8 || event.keyCode === 13 ||
      (48 <= event.keyCode && event.keyCode <= 57) ||
      (96 <= event.keyCode && event.keyCode <= 105)) {
      return;
    }

    // ie11対応
    switch(event.key){
        case 'Left':
            strArrow = 'ArrowLeft';
            break;
        case 'Up':
            strArrow = 'ArrowUp';
            break;
        case 'Down':
            strArrow = 'ArrowDown';
            break;
        case 'Right':
            strArrow = 'ArrowRight';
            break;
    }
    event.preventDefault();
    arrowAction(strArrow);
}

// ボタンアクション設定
function makeButtonAction(){
    // イベント取得用ボタンオブジェクト取得
    let leftButton = document.getElementById('lbtn');
    let upButton = document.getElementById('ubtn');
    let downButton = document.getElementById('dbtn');
    let rightButton = document.getElementById('rbtn');

    // 左
    leftButton.addEventListener('click', function(event){
        arrowAction('ArrowLeft');
    });
    // 上
    upButton.addEventListener('click', function(event){
        arrowAction('ArrowUp');
    });
    // 下
    downButton.addEventListener('click', function(event){
        arrowAction('ArrowDown');
    });
    // 右
    rightButton.addEventListener('click', function(event){
        arrowAction('ArrowRight');
    });

    // やり直す
    let resetButton = document.getElementById('reset');
     resetButton.addEventListener('click', function(event){
        drawingTable();
    });
}

// 倉庫の動的作成
function makeTable(parentId){
    // 倉庫の作成開始
    let rows=[];
    let table = document.createElement('table');
    table.setAttribute('id', 'souko');

    // 倉庫に2次元配列の要素を格納
    for(let i = 0; i < maxRow; i++){
        rows.push(table.insertRow(-1));
        for(let j = 0; j < maxCol; j++){
            let cell = rows[i].insertCell(-1);
            // 空間の設定
            let idString = i.toString() + IdSeparator + j.toString();
            cell.setAttribute('id', idString);
            cell.style.backgroundColor = 'lightgray';
            cell.setAttribute('class', 'psg');  //画像表示のため、すべてのセルに設定する

            let intTarget = soukoData[i][j];
            // レンガ壁
            if( intTarget == RengaWall){
                let img = document.createElement('img');
                img.setAttribute('class', 'sg');
                img.src = RengaImageSrc;
                cell.appendChild(img);
            }
            // 置き場所
            if( intTarget == StoragePlace){
                cell.style.fontSize = '25px'    //CELL幅の半分
                cell.style.color = 'yellow';
                cell.textContent = '●';
                storagePlaceDataArray.push(idString);
            }
            // 荷物
            if( intTarget == Box){
                let img = document.createElement('img');
                boxCounter = boxCounter + 1;
                img.setAttribute('id', 'box' + boxCounter.toString());
                img.setAttribute('class', 'sg');
                img.src = BoxImageSrc;
                cell.appendChild(img);
            }
            // プレーヤー
            if( intTarget == Player){
                let img = document.createElement('img');
                img.setAttribute('id', 'player');
                img.setAttribute('class', 'sg');
                img.src = PlayerRightImageSrc;
                cell.appendChild(img);
                // 現在のプレーヤー位置を空間にする
                // プレーヤーは最初の表示だけに倉庫データを利用し、その後は倉庫データでは管理しない
                soukoData[i][j] = Space;
            }
        }
    }

    // 指定したdiv要素に迷路を加える
    document.getElementById(parentId).appendChild(table);
}

// HTML読み込み後、自動実行
function onLoad(){
    // 問題選択肢作成
    for(let i = 2; i <= soukoDataArray.length; i++){
        let option = document.createElement("option");
        option.text = i;
        option.value = i;
        // selectタグの子要素にoptionタグを追加する
        dataNumber.appendChild(option);
    }

    // 迷路の動的作成
    drawingTable();

    // ボタンアクション設定
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
    //soukoData = soukoDataArray[dataNo - 1];   //これだとsoukoDataを書き換えると元のデータも書き換わるよ～ディープコピーが必要だ！
    soukoData = JSON.parse(JSON.stringify(soukoDataArray[dataNo - 1]));
    maxRow = soukoData.length;
    maxCol = soukoData[0].length;

    // 置き場所データ初期化
    storagePlaceDataArray = [];

    // 表示サイズの計算
    zoomCalc();

    // 問題の動的作成
    makeTable('mainScreen');
}

// 初期化
function resetData(){
    // 荷物ID用カウンター
    boxCounter = 0;

    // 成功画像非表示
    let si = document.getElementById('successImage');
    si.style.display = 'none';

    // ボタンの有効化
    let resetButton = document.getElementById('reset');
    resetButton.disabled = false;
    let leftButton = document.getElementById('lbtn');
    leftButton.disabled = false;
    let upButton = document.getElementById('ubtn');
    upButton.disabled = false;
    let downButton = document.getElementById('dbtn');
    downButton.disabled = false;
    let rightButton = document.getElementById('rbtn');
    rightButton.disabled = false;
}

// 表示倍率計算
function zoomCalc(){
    let cellhaba = 50;
    // 表示サイズの計算
    let mainScreen = document.getElementById('mainScreen');
    let bw = window.innerWidth;
    let bh = window.innerHeight - 230;          //200は表題やボタンなどの縦幅による
    let gridw = (soukoData[0].length + 1) * cellhaba;
    let gridh = (soukoData.length + 1) * cellhaba;

    // 表示倍率計算
    for(let i = 2; i > 0; i = i - 0.01){
      if( gridw * i < bw && gridh * i < bh){
        zoom = i;
        break;
      }
    }
    if(zoom < 0 || zoom > 1) zoom = 1.0;
    mainScreen.style.transformOrigin = 'top left';
    mainScreen.style.transform ='scale(' + zoom.toString() + ',' + zoom.toString() + ')';
    //alert("bw=" + bw + "  gridw=" + gridw * zoom + "  bh=" + bh + " gridh=" + gridh * zoom + " zoom=" + zoom);

    // 成功イメージ
    let successImageDiv = document.getElementById('successImage');
    successImageDiv.style.display = 'none';
    let img = document.createElement('img');
    img.setAttribute('id', 'simage');
    img.src = SuccessImageSrc;
    img.style.height = (gridh * zoom * 0.17 * 1.5).toString() + 'px';
    img.style.width = (gridw * zoom  * 0.3 * 1.5).toString() + 'px';
    successImageDiv.appendChild(img);

}
