let gridRowColArray = [];
let gridDataArray = [];
let gridRowCol;


//-------------------------------------------------------------------------------
// No.1初級（4 x 4マス）
// データ
gridRowCol = 4;
let gridData = [];
for(let i = 0; i < gridRowCol; i++){
    gridData[i] = [];
    for(let j = 0; j < gridRowCol; j++){
        gridData[i][j] = 0;
    }
}
// 配列に登録
gridRowColArray.push(gridRowCol);
gridDataArray.push(gridData);
