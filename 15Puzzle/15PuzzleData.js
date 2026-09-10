//0：空き
//1～：数字タイル
//gridDataを毎回再表示する

let gridRowColArray = [];
let gridDataArray = [];
let gridRowCol;
let gridData = [];


const sizes = [3, 4, 5, 6, 7, 8, 9, 10]; // No.1(3x3) 〜 No.8(10x10)

// ループで綺麗にデータを初期化
sizes.forEach(size => {
    let data = [];
    for(let i = 0; i < size; i++){
        data[i] = [];
        for(let j = 0; j < size; j++){
            data[i][j] = 0;
        }
    }
    gridRowColArray.push(size);
    gridDataArray.push(data);
});


/*
//-------------------------------------------------------------------------------
// No.1初級（3 x 3マス）
// データ
gridRowCol = 3;
gridData = [];
for(let i = 0; i < gridRowCol; i++){
    gridData[i] = [];
    for(let j = 0; j < gridRowCol; j++){
        gridData[i][j] = 0;
    }
}
// 配列に登録
gridRowColArray.push(gridRowCol);
gridDataArray.push(gridData);

//-------------------------------------------------------------------------------
// No.2中級（4 x 4マス）
// データ
gridRowCol = 4;
gridData = [];
for(let i = 0; i < gridRowCol; i++){
    gridData[i] = [];
    for(let j = 0; j < gridRowCol; j++){
        gridData[i][j] = 0;
    }
}
// 配列に登録
gridRowColArray.push(gridRowCol);
gridDataArray.push(gridData);

//-------------------------------------------------------------------------------
// No.3上級（5 x 5マス）
// データ
gridRowCol = 5;
gridData = [];
for(let i = 0; i < gridRowCol; i++){
    gridData[i] = [];
    for(let j = 0; j < gridRowCol; j++){
        gridData[i][j] = 0;
    }
}
// 配列に登録
gridRowColArray.push(gridRowCol);
gridDataArray.push(gridData);

//-------------------------------------------------------------------------------
// No.4超上級（6 x 6マス）
// データ
gridRowCol = 6;
gridData = [];
for(let i = 0; i < gridRowCol; i++){
    gridData[i] = [];
    for(let j = 0; j < gridRowCol; j++){
        gridData[i][j] = 0;
    }
}
// 配列に登録
gridRowColArray.push(gridRowCol);
gridDataArray.push(gridData);

//-------------------------------------------------------------------------------
// No.5スーパー（7 x 7マス）
// データ
gridRowCol = 7;
gridData = [];
for(let i = 0; i < gridRowCol; i++){
    gridData[i] = [];
    for(let j = 0; j < gridRowCol; j++){
        gridData[i][j] = 0;
    }
}
// 配列に登録
gridRowColArray.push(gridRowCol);
gridDataArray.push(gridData);

//-------------------------------------------------------------------------------
// No.6超スーパー（8 x 8マス）
// データ
gridRowCol = 8;
gridData = [];
for(let i = 0; i < gridRowCol; i++){
    gridData[i] = [];
    for(let j = 0; j < gridRowCol; j++){
        gridData[i][j] = 0;
    }
}
// 配列に登録
gridRowColArray.push(gridRowCol);
gridDataArray.push(gridData);

//-------------------------------------------------------------------------------
// No.7ウルトラスーパー（9 x 9マス）
// データ
gridRowCol = 9;
gridData = [];
for(let i = 0; i < gridRowCol; i++){
    gridData[i] = [];
    for(let j = 0; j < gridRowCol; j++){
        gridData[i][j] = 0;
    }
}
// 配列に登録
gridRowColArray.push(gridRowCol);
gridDataArray.push(gridData);

//-------------------------------------------------------------------------------
// No.8ウルトラスーパー（10 x 10マス）
// データ
gridRowCol = 10;
gridData = [];
for(let i = 0; i < gridRowCol; i++){
    gridData[i] = [];
    for(let j = 0; j < gridRowCol; j++){
        gridData[i][j] = 0;
    }
}
// 配列に登録
gridRowColArray.push(gridRowCol);
gridDataArray.push(gridData);
*/
