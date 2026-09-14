// グローバル定数
const CANVAS_W = 640; // canvas要素の幅(px)
const CANVAS_H = 480; // canvas要素の高さ(px)
const MAX_WIDTH = 100; // 文字幅
const SX = 30;    // 始点のX値設定
const SY = 10;    // 始点のY値設定
const SLEEP_TIME = 100;   //ミリ秒

// グルーバル変数
let canvas; // canvas要素
let ctx; // 2Dコンテキスト
let oX; // canvas要素の中心 x座標
let oY; // canvas要素の中心 y座標
let n1; // 屈折率
let n2; // 屈折率
let angle1; // 入射角

// Webページのロードが完了した後に呼び出されるロードイベントを設定する
window.addEventListener("load", onLoad, false);

// 入射角が変更になったら描画
let numberText = document.getElementById("numberText");
//numberText.addEventListener("change", drawing);
// 屈折率が変更になったら描画
let refractiveSelect1 = document.getElementById("refractiveSelect1");
//refractiveSelect1.addEventListener("change", drawing);
// 屈折率が変更になったら描画
let refractiveSelect2 = document.getElementById("refractiveSelect2");
//refractiveSelect2.addEventListener("change", drawing);

// **********************
// 開始ボタン
// **********************
function buttonClick(){
  drawing();
}

// **********************
// ロードイベント関数
// **********************
function onLoad(){
  drawCoord();
}

// **********************
// 描画
// イベントが発生したら呼び出される
// **********************
async function drawing(){
  // 座標系描画
  drawCoord();

  // 屈折率
  //n1 = 1.000292;    // 空気
  //n2 = 1.5443;      // 水晶
  //n2 = 2.417;      // ダイアモンド
  //n2 = 1.3334;      //水
  n1 = refractiveSelect1.value;
  n2 = refractiveSelect2.value;
  //alert(n1 + "    " + n2);

  // 度 = 180 / π * ラジアン　　　　ラジアン ＝ π / 180 * 度
  // 入射角（度）
  angle1 = parseInt(numberText.value);
  //angle1 = parseInt(prompt("入射角度を半角数値で入力してください。"));    // 入力値を数値に変換、数字以外は無視
  //alert(angle1);
  // 入力値チェック
  if(angle1 < 0 || 90 < angle1 || isNaN(angle1)){
    alert("正しい角度を入力してください！" + "[" + angle1 + "]");
    return;
  }
  let theta1 = Math.PI / 180 * angle1;   // 入射角をラジアンへ変換
  let sin1 = Math.sin(theta1);

  // 描画のための一次関数傾き(屈折前)
  let tan1 = Math.tan(theta1 + Math.PI / 180 * 90);     // （描画のため）第二象限から入射するので90度を加えて、ラジアンへ変換
  let a1 = tan1;
  //alert("傾きa1：" + a1);

  //　屈折角
  let sin2 = n1 * sin1 / n2;
  //alert("sin2：" + sin2);
  let theta2 = Math.asin(sin2);   // 屈折角をラジアンへ変換
  //alert("theta2：" + theta2);

  // 描画のための一次関数傾き(屈折前)
  let tan2 = Math.tan(theta2 + Math.PI / 180 * 270);   // （描画のため）第四象限の屈折角なので270度分のラジアンを加える
  let a2 = tan2;
  //alert("傾きa2：" + a2);

  // 屈折角（度）
  let angle2 = 180 / Math.PI * theta2;

  // 90 - 反射角（度）ラジアン ＝ π / 180 * 度
  let angle3 = 90 - angle1;
  let theta3 = Math.PI / 180 * angle3;
  let a3 = Math.tan(theta3);

  // 角度表示
  let addText = document.getElementById("addText");
  let ang = Math.round(angle2 * 100) / 100;   // 小数点第３位で四捨五入
  if(ang >= 0 && ang <= 90){
    addText.innerHTML = "入射角度：" + angle1 + "　　　屈折角度：" + ang + "　　　反射角度：" + angle1 + "<br>";
  } else {
    addText.innerHTML = "入射角度：" + angle1 + "　　　屈折角度：なし" + "　　　反射角度：" + angle1 + "<br>";
  }


  // ----------------------------------------
  // 一次関数の無名関数を指定（屈折前）
  let f1 = function(x){
    let y = a1 * x;
    return y;
  };

  // 一次関数の無名関数を指定（屈折後）
  let f2 = function(x){
    let y = a2 * x;
    return y;
  };

  // 一次関数の無名関数を指定（屈折後、反射）
  let f3 = function(x){
    let y = a3 * x;
    return y;
  };

  // 仮想の座標値から実際の座標値に変換無形関数
  // x座標値の変換
  let rx = function(x){
    return (x * 10) + oX;
  };
  // y座標値の変換
  let ry = function(y){
    return (y * 10) * -1 + oY;
  };
  // ----------------------------------------

  // 光を描画する
  ctx.lineWidth = 3;
  //ctx.strokeStyle = "rgb(253, 245, 188)";
  ctx.strokeStyle = "yellow";

  // 仮想の座標系　右上(-32,24)左下(-32,-24)右上(32,24)右下(-32,24)
  // x軸方向を1ずつ増やしながらループする
  let y;
  for(let x = -32; x <= -1; x = x + 1){
    y = f1(x); // 仮想座標値
    if(-30 <= y && y <= 30){
      ctx.beginPath();
      ctx.moveTo(rx(x), ry(y));
      y = f1(x + 1); // 仮想座標値
      ctx.lineTo(rx(x + 1), ry(y));
      ctx.stroke();
      await sleep(SLEEP_TIME);
    }
  }

  for(let x = 0; x <= 31; x = x + 1){
    y = f2(x); // 仮想座標値
    if(-30 <= y && y <= 30){
      ctx.beginPath();
      ctx.moveTo(rx(x), ry(y));
      y = f2(x + 1); // 仮想座標値
      ctx.lineTo(rx(x + 1), ry(y));
      ctx.stroke();
      //await sleep(SLEEP_TIME);
    }
    y = f3(x); // 仮想座標値
    if(-30 <= y && y <= 30){
      ctx.beginPath();
      ctx.moveTo(rx(x), ry(y));
      y = f3(x + 1); // 仮想座標値
      ctx.lineTo(rx(x + 1), ry(y));
      ctx.stroke();
      await sleep(SLEEP_TIME);
    }
  }
  /*
  for(let x = 0; x <= 31; x = x + 1){
    y = f3(x); // 仮想座標値
    if(-30 <= y && y <= 30){
      ctx.beginPath();
      ctx.moveTo(rx(x), ry(y));
      y = f3(x + 1); // 仮想座標値
      ctx.lineTo(rx(x + 1), ry(y));
      ctx.stroke();
      await sleep(SLEEP_TIME);
    }
  }
  */
}

// **********************
// ミリ秒間待機する
// **********************
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
//const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// **********************
// 座標系描画
// **********************
function drawCoord(){
  // canvas要素を取得する
  canvas = document.getElementById("coordCanvas");
  // canvas要素の幅・高さを設定する
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  // canvas要素の中心座標を取得する
  oX = CANVAS_W / 2;
  oY = CANVAS_H / 2;
  // 描画のために2Dコンテキスト取得
  ctx = canvas.getContext("2d");

  // 座標系の初期化
  drawInit();  
}

// **********************
// 座標系の初期化
// **********************
function drawInit() {
  // 一度描画をクリア
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // グリッドの表示
  ctx.lineWidth = 1;
  ctx.strokeStyle = "lightgreen";
  // x軸方向
  ctx.beginPath();
  for(let i = 10; i<CANVAS_W; i=i+10){
    if(i == oX) continue;
    ctx.moveTo(i, 0);
    ctx.lineTo(i, CANVAS_H);
  }

  // y軸方向
  for(let i = 10; i<CANVAS_H; i=i+10){
    if(i == oY) continue;
    ctx.moveTo(0, i);
    ctx.lineTo(CANVAS_W, i);
  }
  ctx.stroke();

  // 座標軸の太さ・色
  ctx.lineWidth = 1;
  ctx.strokeStyle = "black";
  ctx.fillStyle = "black";

  // x座標軸を描画
  ctx.beginPath();
  ctx.moveTo(0, oY);
  ctx.lineTo(CANVAS_W, oY);
  ctx.stroke();
  // x座標軸の矢印を描画
  ctx.beginPath();
  ctx.moveTo(CANVAS_W, oY);
  ctx.lineTo(CANVAS_W - 10, oY - 7);
  ctx.lineTo(CANVAS_W - 10, oY + 7);
  ctx.fill();

  // y座標軸を描画
  ctx.beginPath();
  ctx.moveTo(oX, 0);
  ctx.lineTo(oX, CANVAS_H);
  ctx.stroke();

  // y座標軸の矢印を描画
  ctx.beginPath();
  ctx.moveTo(oX, 0);
  ctx.lineTo(oX - 7, 10);
  ctx.lineTo(oX + 7, 10);
  ctx.fill();
  // 原点を表す文字Ｏを描画
  // ｘ軸、ｙ軸を表す文字を描画
  ctx.beginPath();
  ctx.font = "12px 'Meiryo UI'";
  ctx.textAlign = 'right';
  ctx.fillText('Ｏ', oX - 5, oY + 15, MAX_WIDTH);
  ctx.fillText('ｘ', CANVAS_W - 15, oY + 15, MAX_WIDTH);
  ctx.fillText('ｙ', oX - 15, 10, MAX_WIDTH);
}
