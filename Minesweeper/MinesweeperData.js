//0：クリック前、安全地帯、背景灰色
//1～8：クリック前、周りの地雷数表示しない、背景灰色
//9：地雷、画像はめ込み、背景灰色
//-1～-8：クリック後、周りの地雷数表示する、数字ごとに色を変える、背景白色
//-9：クリック後、安全地帯、背景白色
//gridDataを毎回再表示する
/*
gridData = [
    [0,1,9,1,1,1,1,0,0],
    [0,2,2,2,1,9,1,0,0],
    [0,1,9,2,2,1,1,0,0],
    [0,1,-2,9,2,1,0,0,0],
    [0,0,2,-3,9,1,0,1,1],
    [0,0,1,9,3,2,1,1,9],
    [0,0,1,1,2,9,2,2,2],
    [0,1,1,-1,-1,1,2,9,1],
    [0,1,9,1,-9,-9,1,1,1]
];
*/

let gridRowColArray = [];
let gridDataArray = [];
let jiraiNumberArray = [];
let gridRowCol;
let gridData = [];
let jiraiNumber;
//-------------------------------------------------------------------------------
// No.1（4 x 4マス、地雷2個）
// データ
gridRowCol = 4;
gridData = [];
for(let i = 0; i < gridRowCol; i++){
    gridData[i] = [];
    for(let j = 0; j < gridRowCol; j++){
        gridData[i][j] = 0;
    }
}
// 地雷の個数
jiraiNumber = 2;
// 配列に登録
gridRowColArray.push(gridRowCol);
gridDataArray.push(gridData);
jiraiNumberArray.push(jiraiNumber);

//-------------------------------------------------------------------------------
// No.2（5 x 5マス、地雷3個）
// データ
gridRowCol = 5;
gridData = [];
for(let i = 0; i < gridRowCol; i++){
    gridData[i] = [];
    for(let j = 0; j < gridRowCol; j++){
        gridData[i][j] = 0;
    }
}
// 地雷の個数
jiraiNumber = 3;
// 配列に登録
gridRowColArray.push(gridRowCol);
gridDataArray.push(gridData);
jiraiNumberArray.push(jiraiNumber);

//-------------------------------------------------------------------------------
// No.3（6 x 6マス、地雷5個）
// データ
gridRowCol = 6;
gridData = [];
for(let i = 0; i < gridRowCol; i++){
    gridData[i] = [];
    for(let j = 0; j < gridRowCol; j++){
        gridData[i][j] = 0;
    }
}
// 地雷の個数
jiraiNumber = 5;
// 配列に登録
gridRowColArray.push(gridRowCol);
gridDataArray.push(gridData);
jiraiNumberArray.push(jiraiNumber);

//-------------------------------------------------------------------------------
// No.4（7 x 7マス、地雷7個）
// データ
gridRowCol = 7;
gridData = [];
for(let i = 0; i < gridRowCol; i++){
    gridData[i] = [];
    for(let j = 0; j < gridRowCol; j++){
        gridData[i][j] = 0;
    }
}
// 地雷の個数
jiraiNumber = 7;
// 配列に登録
gridRowColArray.push(gridRowCol);
gridDataArray.push(gridData);
jiraiNumberArray.push(jiraiNumber);

//-------------------------------------------------------------------------------
// No.5（8 x 8マス、地雷8個）
// データ
gridRowCol = 8;
gridData = [];
for(let i = 0; i < gridRowCol; i++){
    gridData[i] = [];
    for(let j = 0; j < gridRowCol; j++){
        gridData[i][j] = 0;
    }
}
// 地雷の個数
jiraiNumber = 8;
// 配列に登録
gridRowColArray.push(gridRowCol);
gridDataArray.push(gridData);
jiraiNumberArray.push(jiraiNumber);

//-------------------------------------------------------------------------------
// No.6（9 x 9マス、地雷10個）
// データ
gridRowCol = 9;
gridData = [];
for(let i = 0; i < gridRowCol; i++){
    gridData[i] = [];
    for(let j = 0; j < gridRowCol; j++){
        gridData[i][j] = 0;
    }
}
// 地雷の個数
jiraiNumber = 10;
// 配列に登録
gridRowColArray.push(gridRowCol);
gridDataArray.push(gridData);
jiraiNumberArray.push(jiraiNumber);

//-------------------------------------------------------------------------------
// No.7（16 x 16マス、地雷40個）
// データ
gridRowCol = 16;
gridData = [];
for(let i = 0; i < gridRowCol; i++){
    gridData[i] = [];
    for(let j = 0; j < gridRowCol; j++){
        gridData[i][j] = 0;
    }
}
// 地雷の個数
jiraiNumber = 40;
// 配列に登録
gridRowColArray.push(gridRowCol);
gridDataArray.push(gridData);
jiraiNumberArray.push(jiraiNumber);

//-------------------------------------------------------------------------------
// No.8（22 x 22マス、地雷99個）
// データ
gridRowCol = 22;
gridData = [];
for(let i = 0; i < gridRowCol; i++){
    gridData[i] = [];
    for(let j = 0; j < gridRowCol; j++){
        gridData[i][j] = 0;
    }
}
// 地雷の個数
jiraiNumber = 99;
// 配列に登録
gridRowColArray.push(gridRowCol);
gridDataArray.push(gridData);
jiraiNumberArray.push(jiraiNumber);

//-------------------------------------------------------------------------------
// No.9（50 x 50マス、地雷500個）
// データ
gridRowCol = 50;
gridData = [];
for(let i = 0; i < gridRowCol; i++){
    gridData[i] = [];
    for(let j = 0; j < gridRowCol; j++){
        gridData[i][j] = 0;
    }
}
// 地雷の個数
jiraiNumber = 500;
// 配列に登録
gridRowColArray.push(gridRowCol);
gridDataArray.push(gridData);
jiraiNumberArray.push(jiraiNumber);

//-------------------------------------------------------------------------------
// No.10（100 x 100マス、地雷2000個）
// データ
gridRowCol = 100;
gridData = [];
for(let i = 0; i < gridRowCol; i++){
    gridData[i] = [];
    for(let j = 0; j < gridRowCol; j++){
        gridData[i][j] = 0;
    }
}
// 地雷の個数
jiraiNumber = 2000;
// 配列に登録
gridRowColArray.push(gridRowCol);
gridDataArray.push(gridData);
jiraiNumberArray.push(jiraiNumber);
