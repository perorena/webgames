/*
checkRoyalFlush
30点：ロイヤルフラッシュ：同じスート（柄）で10・J・Q・K・Aの5枚が連続して揃った役

checkStraightFlush
25点：ストレートフラッシュ：同じスートで連続する5枚の数字が揃った役（ロイヤルフラッシュを除く）

checkFourKind
20点：フォーカード：同じ数字が4枚揃った役

checkFullHouse
15点：フルハウス：同じ数字が3枚（スリーカード）と、別の同じ数字が2枚（ワンペア）の組み合わせ

checkFlush
10点：フラッシュ：数字に関係なく、同じスート（柄）のカード5枚が揃った役

checkStraight
6点：ストレート：数字が連続している5枚のカードが揃った役（スートは問わない）

checkThreeKind
4点：スリーカード：同じ数字が3枚揃った役

checkTwoPair
2点：ツーペア：同じ数字のペアが2組ある役

checkOnePair
1点：ワンペア：同じ数字が2枚揃った役
*/

const CrLf = '\n\r';
const GameoverImageSrc = 'img/gameover.png';
const ClearImageSrc = 'img/clear.png';

// グローバル定数
class Config{
    static CARD_W = 40;  // カード画像の幅px
    static CARD_H = 60;  // カード画像の高さpx
    static SCREEN_W = 200;  // CARD_W * 5 cssのmainScreen widthと同じ数値に
    static SCREEN_H = 420;  // CARD_H * 7 cssのmainScreen heightと同じ数値に
    static FALLING = 'falling';
    static FIXED = 'fixed';
    static MAX_CARD = 53;   // 利用するカード数 51:数字カードのみ 52:ジョーカー含む  53:ジョーカーと裏含む
    static SPACE = -1;  // スペース
    static COL_MAX = 4; // 5 - 1
    static ROW_MAX = 6; // 7 - 1
}

/*
imgsrc 画像イメージ
x,y 画像位置
suit Spade,Heart,Diamond,Club,Joker,Back
*/
class Card{
    constructor(suit, number, no){
        // イメージファイル名を作成する
        let imgsrc = 'img/' + 'card_' + suit + '_' + number + '.png';
        if(number == '00') imgsrc = 'img/' + 'card_' + suit + '.png';
        this.imgsrc = imgsrc;
        this.suit = suit;
        this.number = number;
        this.x = null;
        this.y = null;
        this.status = null;
        this.card_no = no;
    }
}

// カードデータ Spade,Heart,Diamond,Club,Joker,Back
let CardSuit = ['spade', 'heart', 'diamond' , 'club', 'joker', 'back'];
let CardDataArray = [];  // カードクラスを保管（52枚、ジョーカー、裏）
let CardList = [];  // 表示中または表示したカード番号リスト（0～51,52,53）maxのlength値：54
                    // spade：0～12 heart：13～25 diamond：26～38 club：39～51 の値が保存される
                    // カード番号は、カードオブジェクトのcard_noにも保持している（CardDataArrayのインデックスと同じ値になる）
let ActiveCardNumber = null;  // アクティブのカード番号（0～51,52,53）
let ShuffleCardList = [];       // 表示するカード順序
let ShuffleCardListIndex = -1;

// アクティブカードの現在列
let ActiveCardColumn = 2;
let ActiveCardRow = 0;

// 落下して固定されたカード番号リスト
//[-1,-1,-1,-1,-1],
FixedCardList = [
    [Config.SPACE,Config.SPACE,Config.SPACE,Config.SPACE,Config.SPACE],
    [Config.SPACE,Config.SPACE,Config.SPACE,Config.SPACE,Config.SPACE],
    [Config.SPACE,Config.SPACE,Config.SPACE,Config.SPACE,Config.SPACE],
    [Config.SPACE,Config.SPACE,Config.SPACE,Config.SPACE,Config.SPACE],
    [Config.SPACE,Config.SPACE,Config.SPACE,Config.SPACE,Config.SPACE],
    [Config.SPACE,Config.SPACE,Config.SPACE,Config.SPACE,Config.SPACE],
    [Config.SPACE,Config.SPACE,Config.SPACE,Config.SPACE,Config.SPACE]
];

// 削除カード
let DeleteCardList;

// アニメーションID
let RequestAnimationFrameID = null;

// 得点
let score = 0;

// ズーム値
let zoom = 1.0;

// 落下速度と加速
let dropSpeed = 1.0;
let acceleration = 1.0;

// Webページのロードが完了した後に呼び出されるロードイベントを設定する
window.addEventListener("load", onLoad, false);

// キーが押されたときのリスナー
document.addEventListener('keydown', keyDown, false);
document.addEventListener('keyup', keyUp, false);


// **********************
// ロードイベント関数
// **********************
function onLoad(){
    // ゲームオーバーイメージ
    let gameoverImageDiv = document.getElementById('gameoverImage');
    gameoverImageDiv.style.display = 'none';
    let gimg = document.createElement('img');
    gimg.setAttribute('id', 'goimage');
    gimg.src = GameoverImageSrc;
    gimg.style.top = '100px';
    gimg.style.left = '20px';
    gimg.style.width = (Config.SCREEN_W * 0.8).toString() + 'px';
    gameoverImageDiv.appendChild(gimg);

    // クリアイメージ
    let clearImageDiv = document.getElementById('clearImage');
    clearImageDiv.style.display = 'none';
    let cimg = document.createElement('img');
    cimg.setAttribute('id', 'cimage');
    cimg.src = ClearImageSrc;
    cimg.style.top = '100px';
    cimg.style.left = '20px';
    cimg.style.width = (Config.SCREEN_W * 0.8).toString() + 'px';
    clearImageDiv.appendChild(cimg);
/*
    // カードクラス配列
    let card = null;
    for(let i = 0; i < 4; i++){
        for(let j = 0; j < 13; j++){
            card = new Card(CardSuit[i], (j+1).toString().padStart(2, '0'));
            CardDataArray.push(card);
            let k = i * 13 + j;
            ShuffleCardList[k] = k;
        }
    }
    // joker
    card = new Card(CardSuit[4], '00');
    CardDataArray.push(card);
    // back
    card = new Card(CardSuit[5], '00');
    CardDataArray.push(card);
*/
    //表示倍率
    zoomCalc();

    // 初期化
    init();

    // メインループ
    mainLoop();


    //ボタンアクション設定
    makeButtonAction();

/*
    alert('FixedCardList.length=' + FixedCardList.length);
    for(let i = 0; i < FixedCardList.length; i++){
        //FixedCardList[i] = [];
        alert('FixedCardList[i].length=' + FixedCardList[i].length);
        for(let j = 0; j < FixedCardList[i].length; j++){
            alert('i=' + i + '   j=' + j + '  ' + FixedCardList[i][j]);
        }
    }
*/

/*
    // 左下から右へサーチ
    for(let i = FixedCardList.length - 1; 0 <= i; i--){
        for(let j = 0; j < FixedCardList[i].length; j++){
            alert('i=' + i + '   j=' + j + '  ' + FixedCardList[i][j]);
        }
    }
*/
}

// 乱数（min～maxの整数）
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// 初期化
function init(){
    // ゲームオーバーイメージ
    let gameoverImageDiv = document.getElementById('gameoverImage');
    gameoverImageDiv.style.display = 'none';

        // クリアイメージ
    let clearImageDiv = document.getElementById('clearImage');
    clearImageDiv.style.display = 'none';

    // 描画エリアの指定
    let parent = document.getElementById('mainScreen');
    // 描画エリア削除
    while(parent.firstChild){
        parent.removeChild(parent.firstChild);
    }

    // カードクラスを保管（52枚、ジョーカー、裏）
    CardDataArray = [];
    // 表示中または表示したカード番号リスト（0～51,52,53）maxのlength値：54
    // spade：0～12 heart：13～25 diamond：26～38 club：39～51 の値が保存される
    CardList = [];
    // アクティブのカード番号（0～51,52,53）
    ActiveCardNumber = null;
    // 表示するカード順序
    ShuffleCardList = [];
    ShuffleCardListIndex = -1;

    // カードクラス配列
    let card = null;
    for(let i = 0; i < 4; i++){
        for(let j = 0; j < 13; j++){
            let k = i * 13 + j;
            ShuffleCardList[k] = k;
            card = new Card(CardSuit[i], (j+1).toString().padStart(2, '0'), k);
            CardDataArray.push(card);
        }
    }
    // joker
    card = new Card(CardSuit[4], '00');
    CardDataArray.push(card);
    // back
    card = new Card(CardSuit[5], '00');
    CardDataArray.push(card);

    // 最初に一度、カードをシャッフルしてそれを順番に表示しれば無駄なループがなくなる
    // 0～51,52枚をシャッフル
    // 表示順決定シャッフル、何回回すか？
    for(let i = 0; i < ShuffleCardList.length * 2; i++){
        let card1 = getRandomInt(0, 51);
        let card2 = getRandomInt(0, 51);
        let temp = ShuffleCardList[card1];
        ShuffleCardList[card1] = ShuffleCardList[card2];
        ShuffleCardList[card2] = temp;
    }

    // アクティブカードの現在列
    ActiveCardColumn = 2;
    ActiveCardRow = 0;

    // 落下して固定されたカード番号リスト
    //[-1,-1,-1,-1,-1],
    FixedCardList = [
        [Config.SPACE,Config.SPACE,Config.SPACE,Config.SPACE,Config.SPACE],
        [Config.SPACE,Config.SPACE,Config.SPACE,Config.SPACE,Config.SPACE],
        [Config.SPACE,Config.SPACE,Config.SPACE,Config.SPACE,Config.SPACE],
        [Config.SPACE,Config.SPACE,Config.SPACE,Config.SPACE,Config.SPACE],
        [Config.SPACE,Config.SPACE,Config.SPACE,Config.SPACE,Config.SPACE],
        [Config.SPACE,Config.SPACE,Config.SPACE,Config.SPACE,Config.SPACE],
        [Config.SPACE,Config.SPACE,Config.SPACE,Config.SPACE,Config.SPACE]
    ];

    // アニメーションID
    RequestAnimationFrameID = null;

    // 落下速度と加速
    dropSpeed = 1.0;
    acceleration = 1.0;

    // 得点
    score = 0;
}

// メインループ
function mainLoop(){
    // すべてのカードを表示したら、クリアとする
    if(CardList.length > Config.MAX_CARD){
        //alert('クリア！');
        let ci = document.getElementById('clearImage');
        ci.style.display = 'block';
        return;
    }
    // ゲームオーバーまでループ
    // アクティブなカードがあるか
    if(activeCard() == false){
        // ない
        // 同じ番号は使わない
        ShuffleCardListIndex = ShuffleCardListIndex + 1;
        ActiveCardNumber = ShuffleCardList[ShuffleCardListIndex];
        // 新しいカードの追加
        CardList.push(ActiveCardNumber);

        // img要素作成
        let img = document.createElement('img');
        let id = CardDataArray[ActiveCardNumber].suit + CardDataArray[ActiveCardNumber].number;
        img.setAttribute('id', id);
        img.setAttribute('class', 'card_size');
        img.style.position = 'absolute';
        img.style.top = '0px';
        ActiveCardColumn = 2;
        setActiveCardX(img, ActiveCardColumn);
        //img.style.left = (Config.CARD_W * 2).toString() + 'px';
        img.src = CardDataArray[ActiveCardNumber].imgsrc;
        CardDataArray[ActiveCardNumber].status = Config.FALLING;
        //alert('cardDrawing  status = ' + CardDataArray[ActiveCardNumber].status + '  suit = ' + CardDataArray[ActiveCardNumber].suit + '  number = ' + CardDataArray[ActiveCardNumber].number + '  ActiveCardNumber= ' + ActiveCardNumber);

        // 指定したdiv要素にカードを加える
        let parent = document.getElementById('mainScreen');
        parent.appendChild(img);
    } else {
        // ある
    }
    // 落下
    cardDropping();

    // 処理を繰り返す
    if(RequestAnimationFrameID == null){
        RequestAnimationFrameID = requestAnimationFrame(mainLoop);  // 1/60秒後にもう一度呼び出す
        //alert('RequestAnimationFrameID=' + RequestAnimationFrameID);
    } else {
        cancelAnimationFrame(RequestAnimationFrameID);
        RequestAnimationFrameID = null;
        RequestAnimationFrameID = requestAnimationFrame(mainLoop);  // 1/60秒後もう一度呼び出す
        //alert('RequestAnimationFrameID=' + RequestAnimationFrameID);
    }
}

// アクティブカードがあるかどうか
function activeCard(){
    for(let i = 0; i < CardList.length; i++){
        let cn = CardList[i];
        if(CardDataArray[cn].status == Config.FALLING) return true;
    }
    return false;
}

// 落下
// (x,y) x:j   y:i
function cardDropping(){
    // 落とす
    let id = CardDataArray[ActiveCardNumber].suit + CardDataArray[ActiveCardNumber].number;
    let img = document.getElementById(id);
    let y = parseFloat(img.style.top.replace('px',''));  // 文字列を数値に変換
    //let x = parseFloat(img.style.left.replace('px',''));  // 文字列を数値に変換
    ActiveCardRow = getActiveCardRow(y);

    if(y > (Config.SCREEN_H - Config.CARD_H)){
        // アクティブカードが最後まで落ちたとき 6行目
        //alert('LINE4 :: ActiveCardRow=' + ActiveCardRow + '   ActiveCardColumn=' + ActiveCardColumn + '  ' + FixedCardList[ActiveCardRow][ActiveCardColumn]);
        //alert('cardDrawing  status = ' + CardDataArray[ActiveCardNumber].status + '  suit = ' + CardDataArray[ActiveCardNumber].suit + '  number = ' + CardDataArray[ActiveCardNumber].number + '  ActiveCardNumber= ' + ActiveCardNumber);
        CardDataArray[ActiveCardNumber].status = Config.FIXED;
        //CardDataArray[ActiveCardNumber].fixedrow = ActiveCardRow;
        //CardDataArray[ActiveCardNumber].fixedcol = ActiveCardColumn;
        FixedCardList[ActiveCardRow][ActiveCardColumn] = ActiveCardNumber;
        // 行固定
        setActiveCardY(img, ActiveCardRow);
        // 列固定
        setActiveCardX(img, ActiveCardColumn);
        // カード落下を止める
        if(RequestAnimationFrameID != null){
            cancelAnimationFrame(RequestAnimationFrameID);
            RequestAnimationFrameID = null;
        }
        // 役のチェック
        lineYaku();
        // メインループ
        mainLoop();
        return;
    } else if(ActiveCardRow < Config.ROW_MAX){
        // アクティブカードが5行目～0行目のとき
        // 真下の行にカードがあれば固定
        for(let i = Config.ROW_MAX; i > 0; i--){
            if(FixedCardList[i][ActiveCardColumn] > -1 && y >= Config.CARD_H * (i - 1)){
                //alert('LINE :: ActiveCardRow=' + ActiveCardRow + '   ActiveCardColumn=' + ActiveCardColumn + '  ' + FixedCardList[ActiveCardRow][ActiveCardColumn]);
                //alert('cardDrawing  status = ' + CardDataArray[ActiveCardNumber].status + '  suit = ' + CardDataArray[ActiveCardNumber].suit + '  number = ' + CardDataArray[ActiveCardNumber].number + '  ActiveCardNumber= ' + ActiveCardNumber);
                CardDataArray[ActiveCardNumber].status = Config.FIXED;
                //CardDataArray[ActiveCardNumber].fixedrow = ActiveCardRow;
                //CardDataArray[ActiveCardNumber].fixedcol = ActiveCardColumn;
                FixedCardList[ActiveCardRow][ActiveCardColumn] = ActiveCardNumber;
                // 行固定
                setActiveCardY(img, ActiveCardRow);
                // 列固定
                setActiveCardX(img, ActiveCardColumn);

                // カード落下を止める
                if(RequestAnimationFrameID != null){
                    cancelAnimationFrame(RequestAnimationFrameID);
                    RequestAnimationFrameID = null;
                }
                // 役のチェック
                lineYaku();
                if(ActiveCardRow == 0){
                    let str = "";
                    for(let i = 0; i < FixedCardList.length; i++){
                        //alert('FixedCardList[i].length=' + FixedCardList[i].length);
                        str = str + FixedCardList[i] + CrLf;
                        //for(let j = 0; j < FixedCardList[i].length; j++){
                        //    alert('i=' + i + '   j=' + j + '  ' + FixedCardList[i][j]);
                        //}
                    }
                    //alert('ゲームオーバー' + CrLf + str);
                    let gi = document.getElementById('gameoverImage');
                    gi.style.display = 'block';
                    return;
                }
                // メインループ
                mainLoop();
                return;
            }
        }
    }
    // アクティブカードを落とす
    // 落下速度
    let dy = dropSpeed * acceleration;
    img.style.top = (y + dy).toString() + 'px';

    // 得点表示
    let check = document.getElementById('checkText');
    check.innerText = 'カード数：' + CardList.length + '     得点：' + score;

}

// キーが戻ったとき
function keyUp(event){
    acceleration = 1.0;
}

// キーが押されたとき
function keyDown(event){
    let strArrow = event.key;
/*
    let message
    message = " | type: " + event.type
    message += " | key: " + event.key
    message += " | code: " + event.code;
    message += " | shiftKey: " + event.shiftKey;
    message += " | ctrlKey: " + event.ctrlKey;
    message += " | altKey: " + event.altKey;
    message += " | metaKey: " + event.metaKey;
    let si = document.getElementById('title_line');
    si.insertAdjacentHTML("afterbegin", "<div>"+message+"</div>");
*/
    event.preventDefault();
    arrowAction(strArrow);
}

// ボタンアクション設定
function makeButtonAction(){
    // イベント取得用ボタンオブジェクト取得
    let leftButton = document.getElementById('lbtn');
    let downButton = document.getElementById('dbtn');
    let rightButton = document.getElementById('rbtn');

    // 左
    leftButton.addEventListener('click', function(event){
        arrowAction('ArrowLeft');
    });
    // 下 mousedown → mouseup → click の順番でイベント発生
    downButton.addEventListener('touchstart', function(event){
        event.preventDefault();
        acceleration = 2.0;
    });
    downButton.addEventListener('touchend', function(event){
        event.preventDefault();
        acceleration = 1.0;
    });
    downButton.addEventListener('mousedown', function(event){
        event.preventDefault();
        acceleration = 2.0;
    });
    downButton.addEventListener('mouseup', function(event){
        event.preventDefault();
        acceleration = 1.0;
    });
    // 右
    rightButton.addEventListener('click', function(event){
        arrowAction('ArrowRight');
    });

    // やり直す
    let resetButton = document.getElementById('reset');
    resetButton.addEventListener('click', function(event){
        RequestAnimationFrameID = null;
        init();
        mainLoop();
    });
}

// 矢印アクション
// 左右の動きは、列ごとに移動させる
function arrowAction(action){
    let id = CardDataArray[ActiveCardNumber].suit + CardDataArray[ActiveCardNumber].number;
    let img = document.getElementById(id);
    let y = parseFloat(img.style.top.replace('px',''));  // 文字列を数値に変換
    //let x = parseFloat(img.style.left.replace('px',''));  // 文字列を数値に変換
    ActiveCardRow = getActiveCardRow(y);

    switch(action){
        case 'ArrowRight':
            if(ActiveCardColumn < Config.COL_MAX){
                //if(FixedCardList[ActiveCardRow][ActiveCardColumn + 1] > 0){
                //    //alert('右にカードがある');
                //    break;
                //}
                if(FixedCardList[ActiveCardRow][ActiveCardColumn + 1] === Config.SPACE){
                    ActiveCardColumn = ActiveCardColumn + 1;
                    setActiveCardX(img, ActiveCardColumn);
                }
            }
            break;
        case 'ArrowLeft':
            if(ActiveCardColumn > 0){
                //if(FixedCardList[ActiveCardRow][ActiveCardColumn - 1] > 0){
                //    //alert('左にカードがある');
                //    break;
                //}
                if(FixedCardList[ActiveCardRow][ActiveCardColumn - 1] === Config.SPACE){
                    ActiveCardColumn = ActiveCardColumn - 1;
                    setActiveCardX(img, ActiveCardColumn);
                }
            }
            break;
        case 'ArrowDown':
            acceleration = 2.0;
            break;
        case 'ArrowUp':
            lineYaku();
            break;
    }
}

// カード（画像）の列決定
function setActiveCardX(img, col){
    //if(col == 0) img.style.left = '0px';      // 0列
    //if(col == 1) img.style.left = '40px';     // 1列
    //if(col == 2) img.style.left = '80px';     // 2列
    //if(col == 3) img.style.left = '120px';    // 3列
    //if(col == 4) img.style.left = '160px';    // 4列
    for(let i = 0; i <= Config.COL_MAX; i++){
        if(col == i){
            img.style.left = (i * Config.CARD_W).toString() + 'px';
            return;
        }
    }
}

// カード（画像）の行決定
function setActiveCardY(img, row){
    //if(row == 0) img.style.top = '0px';       // 0行
    //if(row == 1) img.style.top = '60px';      // 1行
    //if(row == 2) img.style.top = '120px';     // 2行
    //if(row == 3) img.style.top = '180px';     // 3行
    //if(row == 4) img.style.top = '240px';     // 4行
    //if(row == 5) img.style.top = '300px';     // 5行
    //if(row == 6) img.style.top = '360px';     // 6行
    for(let i = 0; i <= Config.ROW_MAX; i++){
        if(row == i){
            img.style.top = (i * Config.CARD_H).toString() + 'px';
            return;
        }
    }
}

// カード（画像）の行を返す
// カードが少しでも次の行に入ったら、その行とする
// yはtop座標値
function getActiveCardRow(y){
    //let i = 6;
    //if(y <= Config.CARD_H * 6) i = 6;
    //if(y <= Config.CARD_H * 5) i = 5;
    //if(y <= Config.CARD_H * 4) i = 4;
    //if(y <= Config.CARD_H * 3) i = 3;
    //if(y <= Config.CARD_H * 2) i = 2;
    //if(y <= Config.CARD_H) i = 1;
    //if(y == 0) i = 0;
    //return i;
    let j = 6;
    for(let i = Config.ROW_MAX; i >= 0; i--){
        if(y <= Config.CARD_H * i) j = i;
    }
    return j;
}

// どこかの1行が5枚になったタイミングでその行の役をチェックする
function lineYaku(){
    // テストデータ作成
    /*
    let testdata = [];
    testdata = [];
    testdata.push(CardDataArray[9]);
    testdata.push(CardDataArray[10]);
    testdata.push(CardDataArray[11]);
    testdata.push(CardDataArray[12]);
    testdata.push(CardDataArray[0]);
    //highCard(testdata);
    alert('RoyalFlush : ' + checkRoyalFlush(testdata));
    testdata = [];
    testdata.push(CardDataArray[9]);
    testdata.push(CardDataArray[10]);
    testdata.push(CardDataArray[11]);
    testdata.push(CardDataArray[12]);
    testdata.push(CardDataArray[3]);
    alert('RoyalFlush : ' + checkRoyalFlush(testdata));
    testdata = [];
    testdata.push(CardDataArray[13]);
    testdata.push(CardDataArray[14]);
    testdata.push(CardDataArray[15]);
    testdata.push(CardDataArray[16]);
    testdata.push(CardDataArray[17]);
    highCard(testdata);
    alert('StraightFlush : ' + checkStraightFlush(testdata));
    testdata = [];
    testdata.push(CardDataArray[16]);
    testdata.push(CardDataArray[14]);
    testdata.push(CardDataArray[17]);
    testdata.push(CardDataArray[13]);
    testdata.push(CardDataArray[15]);
    highCard(testdata);
    alert('StraightFlush : ' + checkStraightFlush(testdata));
    testdata = [];
    testdata.push(CardDataArray[16]);
    testdata.push(CardDataArray[14]);
    testdata.push(CardDataArray[30]);
    testdata.push(CardDataArray[13]);
    testdata.push(CardDataArray[15]);
    highCard(testdata);
    alert('StraightFlush : ' + checkStraightFlush(testdata));
    testdata = [];
    testdata.push(CardDataArray[12]);
    testdata.push(CardDataArray[25]);
    testdata.push(CardDataArray[51]);
    testdata.push(CardDataArray[13]);
    testdata.push(CardDataArray[38]);
    highCard(testdata);
    alert('FourKind : ' + checkFourKind(testdata));
    //let temp = checkSameNumber(testdata);
    //for(let j = 0; j < 13; j++){
    //    alert('数字=' + (j + 1) + ' 枚数=' + temp[j]);
    //}
    testdata = [];
    testdata.push(CardDataArray[12]);
    testdata.push(CardDataArray[13]);
    testdata.push(CardDataArray[51]);
    testdata.push(CardDataArray[26]);
    testdata.push(CardDataArray[39]);
    highCard(testdata);
    alert('FullHouse : ' + checkFullHouse(testdata));
    testdata = [];
    testdata.push(CardDataArray[28]);
    testdata.push(CardDataArray[30]);
    testdata.push(CardDataArray[27]);
    testdata.push(CardDataArray[26]);
    testdata.push(CardDataArray[38]);
    highCard(testdata);
    alert('Flush : ' + checkFlush(testdata));
    testdata = [];
    testdata.push(CardDataArray[48]);
    testdata.push(CardDataArray[6]);
    testdata.push(CardDataArray[34]);
    testdata.push(CardDataArray[18]);
    testdata.push(CardDataArray[20]);
    highCard(testdata);
    alert('Straight : ' + checkStraight(testdata));
    testdata = [];
    testdata.push(CardDataArray[14]);
    testdata.push(CardDataArray[6]);
    testdata.push(CardDataArray[40]);
    testdata.push(CardDataArray[18]);
    testdata.push(CardDataArray[19]);
    highCard(testdata);
    alert('TwoPair : ' + checkTwoPair(testdata));
    */

    // 【解説】最下行（インデックス6）から上に向かって、各行に5枚のカードが揃っているかを1列ずつスキャンします。
    // 左下から右へサーチ
    for(let i = FixedCardList.length - 1; 0 <= i; i--){
        let checkData = [];
        DeleteCardList = [];
        for(let j = 0; j < FixedCardList[i].length; j++){
            let k = FixedCardList[i][j];
            //alert('i=' + i + '   j=' + j + '   card=' + k);
            //if(k != Config.SPACE) alert('cardDrawing  status = ' + CardDataArray[k].status + '  suit = ' + CardDataArray[k].suit + '  number = ' + CardDataArray[k].number);
            if(k != Config.SPACE){
                checkData.push(CardDataArray[k]);
            } else {
                break;
            }
        }
        // 【解説】横一列に5枚すべての隙間が埋まっていた場合、高得点のポーカー役から順番にチェックをかけます。
        if(checkData.length == 5){
            if(checkRoyalFlush(checkData)){
                //alert('RoyalFlush');
                score = score + 30;
                checkDeleteCard();
            } else if(checkStraightFlush(checkData)){
                //alert('StraightFlush');
                score = score + 25;
                checkDeleteCard();
            } else if(checkFourKind(checkData)){
                //alert('Four of a Kind');
                score = score + 20;
                checkDeleteCard();
            } else if(checkFullHouse(checkData)){
                //alert('FullHouse');
                score = score + 15;
                checkDeleteCard();
            } else if(checkFlush(checkData)){
                //alert('Flush');
                score = score + 10;
                checkDeleteCard();
            } else if(checkStraight(checkData)){
                //alert('Straight');
                score = score + 6;
                checkDeleteCard();
            } else if(checkThreeKind(checkData)){
                //alert('Three of a Kind');
                score = score + 4;
                checkDeleteCard();
            } else if(checkTwoPair(checkData)){
                //alert('TwoPair');
                score = score + 2;
                checkDeleteCard();
            } else if(checkOnePair(checkData)){
                //alert('OnePair');
                score = score + 1;
                checkDeleteCard();
            }
            else {
                //highCard(checkData);
            }
        }
    }
}

// ハイカード：役なしの状態
function highCard(cards){
    // 表示
    //alert('cards len = ' + cards.length);
    for(let i = 0; i < cards.length; i++){
        alert('highCard ' + i + '  status = ' + cards[i].status + '  suit = ' + cards[i].suit + '  number = ' + cards[i].number);
    }

}


// 指定した数字があるかどうか
function checkNumber(cards, number){
    for(let i = 0; i < cards.length; i++){
        if(cards[i].number == number) return true;
    }
    return false;
}

// 連番かどうか
function checkConsecutiveNumbers(cards){
    let copycards = cards.slice(0, cards.length);   // コピー
    //alert('ソート前');
    //highCard(copycards);
    copycards.sort(compareFunc);    // 昇順ソート
    //alert('ソート後');
    //highCard(copycards);
    for(let i = 0; i < copycards.length - 1; i++){
        // 【解説】ソートされた状態で、隣り合うカードの数字の差がすべて「1」であるかを確認します。
        if( Number(copycards[i + 1].number) - Number(copycards[i].number) != 1) return false;
    }
    return true;
}

// オブジェクトのnumberで数値ソートするための関数・昇順
function compareFunc(a, b) {
  return Number(a.number) - Number(b.number);
}

// すべて同じスートかどうか
function checkSameSuit(cards){
    let bool = true;
    for(let i = 0; i < cards.length - 1; i++){
        if(cards[i].suit != cards[i + 1].suit) bool = false;
    }
    return bool;
}

// 同じ数字が何枚あるか
function checkSameNumber(cards){
    // 【解説】1〜13のそれぞれの数字が横1列の中に何枚含まれているかを格納するカウンター配列（要素数13）です。
    let count = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for(let i = 0; i < cards.length; i++){
        for(let j = 0; j < 13; j++){
            if(Number(cards[i].number) == (j + 1)){
                count[j] = count[j] + 1;
            }
        }
    }
    return count;
}

// 役を作ったカードをDeleteCardListに登録しなければならない！

// ロイヤルフラッシュ：同じスート（柄）で10・J・Q・K・Aの5枚が連続して揃った役
function checkRoyalFlush(cards){
    if(checkNumber(cards, '10') && checkNumber(cards, '11') && checkNumber(cards, '12') && checkNumber(cards, '13') && checkNumber(cards, '01') && checkSameSuit(cards)){
        // 5枚全部消す
        setDeleteCardListAll(cards);
        return true;
    }
    return false;
}

// ストレートフラッシュ：同じスートで連続する5枚の数字が揃った役（ロイヤルフラッシュを除く）
function checkStraightFlush(cards){
    if(checkConsecutiveNumbers(cards) && checkSameSuit(cards)){
        // 5枚全部消す
        setDeleteCardListAll(cards);
        return true;
    }
    return false;

}

// フォーカード：同じ数字が4枚揃った役
function checkFourKind(cards){
    let count = checkSameNumber(cards);
    for(let i = 0; i < 13; i++){
        if(count[i] == 4){
            // 【解説】フォーカードを構成する4枚のみを特定して削除用リストへ追加します。
            setDeleteCardList(cards, i);
            return true;
        }
    }
    return false;
}

// フルハウス：同じ数字が3枚（スリーカード）と、別の同じ数字が2枚（ワンペア）の組み合わせ
function checkFullHouse(cards){
    // 5枚全部消す
    let bool1 = false;
    let bool2 = false;
    let count = checkSameNumber(cards);
    for(let i = 0; i < 13; i++){
        if(count[i] == 3) bool1 = true;
        if(count[i] == 2) bool2 = true;
    }
    if(bool1 && bool2) setDeleteCardListAll(cards);
    return bool1 && bool2;
}

// フラッシュ：数字に関係なく、同じスート（柄）のカード5枚が揃った役
function checkFlush(cards){
    // 5枚全部消す
    let bool = checkSameSuit(cards);
    if(bool) setDeleteCardListAll(cards);
    return bool;
}

// ストレート：数字が連続している5枚のカードが揃った役（スートは問わない）
function checkStraight(cards){
    // 5枚全部消す
    let bool = checkConsecutiveNumbers(cards);
    if(bool) setDeleteCardListAll(cards);
    return bool;
}

// スリーカード：同じ数字が3枚揃った役
function checkThreeKind(cards){
    let count = checkSameNumber(cards);
    for(let i = 0; i < 13; i++){
        if(count[i] == 3){
            // 【解説】スリーカードに該当する3枚のみを特定して削除用リストへ追加します。
            setDeleteCardList(cards, i);
            return true;
        }
    }
    return false;
}

// ツーペア：同じ数字のペアが2組ある役
function checkTwoPair(cards){
    let count = checkSameNumber(cards);
    let ct = 0;
    for(let i = 0; i < 13; i++){
        if(count[i] == 2){
            ct = ct + 1;
        }
    }
    if(ct == 2){
        // 【解説】ツーペアを構成する2組（合計4枚）のペアをそれぞれ削除リストに蓄積させます。
        for(let i = 0; i < 13; i++){
            if(count[i] == 2){
                setDeleteCardList(cards, i);
            }
        }
        return true;
    }

    return false;
}

// ワンペア：同じ数字が2枚揃った役
function checkOnePair(cards){
    let count = checkSameNumber(cards);
    for(let i = 0; i < 13; i++){
        // i+1 がカードの数字
        // i+1とcards.numberを比較して、カード番号を探し出す
        if(count[i] == 2){
            // 【解説】ワンペアに該当する2枚のみを特定して削除用リストへ追加します。
            setDeleteCardList(cards, i);
            return true;
        }
    }
    return false;
}

// 指定カードを削除リストへ登録
function setDeleteCardList(cards, no){
    for(let j = 0; j < cards.length; j++){
        if(Number(cards[j].number) == (no + 1)){
            DeleteCardList.push(cards[j].card_no);
        }
    }
}

// 5枚削除リストへ登録
function setDeleteCardListAll(cards){
    for(let j = 0; j < cards.length; j++){
        DeleteCardList.push(cards[j].card_no);
    }
}

// 固定カードを削除、得点加算
function checkDeleteCard(){
    // 役のカード削除
    if(DeleteCardList.length > 0){
        //alert("checkDeleteCard DeleteCardList : " + DeleteCardList + '    length:' + DeleteCardList.length);
        // 左下から右へサーチ
        for(let i = FixedCardList.length - 1; 0 <= i; i--){
            for(let j = 0; j < FixedCardList[i].length; j++){
                for(let k = 0; k < DeleteCardList.length; k++){
                    if(DeleteCardList[k] == FixedCardList[i][j]){
                        // カード画像削除
                        let id = CardDataArray[FixedCardList[i][j]].suit + CardDataArray[FixedCardList[i][j]].number;
                        let element = document.getElementById(id);
                        element.remove();
                        //alert('固定カードから削除 Suit i=' + i + '   j=' + j + '  ' + FixedCardList[i][j]);
                        // 固定カードから削除
                        FixedCardList[i][j] = Config.SPACE;
                    }
                }
            }
        }
    }

    // 下に落ちるカードの処理
    // 【解説】パズルゲームにおいて最重要となる、カード消滅後の「重力詰め処理」です。
    // 空白（Config.SPACE）を見つけたら、その直上にある固定カードを引きずり下ろし、盤面上の整合性を保ちます。
    // 「flag」変数を用いたこのアプローチは、複数段にまたがる連鎖落下も綺麗にスキャンし切ることができます。
    let flag = true;
    while (flag){
        flag = false;
        for(let i = FixedCardList.length - 1; 0 <= i; i--){
            for(let j = 0; j < FixedCardList[i].length; j++){
                if(FixedCardList[i][j] == Config.SPACE){
                    if(i - 1 > 0){
                        if(FixedCardList[i - 1][j] > Config.SPACE){
                            // 上にカードがあったら交換
                            FixedCardList[i][j] = FixedCardList[i - 1][j];
                            FixedCardList[i - 1][j] = Config.SPACE;
                            flag = true;
                            // 画像を移動
                            let id = CardDataArray[FixedCardList[i][j]].suit + CardDataArray[FixedCardList[i][j]].number;
                            let img = document.getElementById(id);
                            setActiveCardY(img, i);
                        }
                    }
                }
            }
        }
    }
}

// 表示倍率計算
function zoomCalc(){
    // 表示サイズの計算
    let mainScreen = document.getElementById('mainScreen');
    let bw = window.innerWidth;
    let bh = window.innerHeight - 165;      //165は表題やボタンなどの縦幅による
    let gridw = 200;
    let gridh = 420;

    // 表示倍率計算
    for(let i = 2; i > 0; i = i - 0.01){
      if( gridw * i < bw && gridh * i < bh){
        zoom = i;
        break;
      }
    }
    //alert("bw=" + bw + "  gridw=" + gridw * zoom + "  bh=" + bh + " gridh=" + gridh * zoom + " zoom=" + zoom);
    //if(zoom < 0 || zoom > 1) zoom = 1.0;
    zoom = zoom * 0.9;
    mainScreen.style.transformOrigin = 'top left';
    mainScreen.style.transform ='scale(' + zoom.toString() + ',' + zoom.toString() + ')';
    let subTable = document.getElementById('sub_table');
    let a = (zoom - 1) * 10 * 42;
    subTable.style = 'margin-top: ' + a.toString() + 'px';
}

/*
// カードマークを返す
function cardSuitCheck(number){
    let suit = '';
    if(0 <= number && number <= 12) suit = 'spade';
    if(13 <= number && number <= 25) suit = 'heart';
    if(26 <= number && number <= 38) suit = 'diamond';
    if(39 <= number && number <= 51) suit = 'club';
    return suit;
}

// カードの数字
function cardNumberCheck(number){
    let surplus = number % 13;
    return surplus + 1;
}
*/
