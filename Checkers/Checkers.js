window.addEventListener("load", onLoad, false);

const boardElement = document.getElementById('board');
const turnIndicator = document.getElementById('turn-indicator');

// 0: 空, 1: 赤（プレイヤー）, 2: 黒（CPU）, 3: 赤キング, 4: 黒キング
let boardState = [];
let currentTurn = 1; // 1: プレイヤー(赤), 2: CPU(黒)
let selectedPiece = null; 
let mustJump = false; 
let jumpingPiece = null; 
let isGameOver = false;
let isCpuThinking = false; // CPUの計算中にプレイヤーの操作をブロックするフラグ
// CPUの難易度設定: 'easy'（最弱・ランダム）, 'normal'（普通）, 'hard'（少し賢い）
let cpuDifficulty = 'normal'; 

// ★追加：CPUの思考タイマーを保持する変数（リセット時にタイマーを解除するため）
let cpuTimer = null;

// ズーム値
let zoom = 1.0;

function gameInitial() {
    // ★追加：すでに発火待ちのCPU思考タイマーがあれば解除する
    if (cpuTimer) {
        clearTimeout(cpuTimer);
        cpuTimer = null;
    }

    boardState = [
        [0, 2, 0, 2, 0, 2, 0, 2],
        [2, 0, 2, 0, 2, 0, 2, 0],
        [0, 2, 0, 2, 0, 2, 0, 2],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 1, 0, 1, 0, 1, 0],
        [0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0]
    ];

    currentTurn = 1; 
    selectedPiece = null; 
    mustJump = false; 
    jumpingPiece = null; 
    isGameOver = false;
    isCpuThinking = false;
    
    if (turnIndicator) {
        turnIndicator.textContent = "あなた（赤）の番です";
    }
}

// 盤面の描画
function createBoard() {
    if (!boardElement) return;
    boardElement.innerHTML = '';
    
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.classList.add((r + c) % 2 === 0 ? 'light' : 'dark');
            cell.dataset.row = r;
            cell.dataset.col = c;

            const pieceType = boardState[r][c];
            if (pieceType !== 0) {
                const piece = document.createElement('div');
                piece.classList.add('piece');
                
                if (pieceType === 1 || pieceType === 3) piece.classList.add('player1');
                if (pieceType === 2 || pieceType === 4) piece.classList.add('player2');
                if (pieceType === 3 || pieceType === 4) piece.classList.add('king');

                if (selectedPiece && selectedPiece.row === r && selectedPiece.col === c) {
                    piece.classList.add('selected');
                }
                if (jumpingPiece && jumpingPiece.row === r && jumpingPiece.col === c) {
                    piece.classList.add('jumping'); 
                }
                cell.appendChild(piece);
            }

            cell.addEventListener('click', handleCellClick);
            boardElement.appendChild(cell);
        }
    }
}

// 単一のジャンプ判定ヘルパー
function isValidJump(fromRow, fromCol, toRow, toCol) {
    if (toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) return false;
    if (boardState[toRow][toCol] !== 0) return false;

    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;
    const pieceType = boardState[fromRow][fromCol];
    const isKing = (pieceType === 3 || pieceType === 4);

    if (Math.abs(rowDiff) !== 2 || Math.abs(colDiff) !== 2) return false;

    if (!isKing) {
        if (currentTurn === 1 && rowDiff !== -2) return false;
        if (currentTurn === 2 && rowDiff !== 2) return false;
    }

    const midRow = (fromRow + toRow) / 2;
    const midCol = (fromCol + toCol) / 2;
    const targetPiece = boardState[midRow][midCol];

    if (currentTurn === 1) {
        return targetPiece === 2 || targetPiece === 4;
    } else {
        return targetPiece === 1 || targetPiece === 3;
    }
}

// 盤面全体でジャンプ可能な駒があるか確認
function checkAllJumps() {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (isOwnPiece(boardState[r][c])) {
                if (canPieceJump(r, c)) return true;
            }
        }
    }
    return false;
}

// 特定の駒がジャンプ可能か確認
function canPieceJump(row, col) {
    const directions = [
        { dr: -2, dc: -2 }, { dr: -2, dc: 2 },
        { dr: 2, dc: -2 }, { dr: 2, dc: 2 }
    ];
    for (let d of directions) {
        if (isValidJump(row, col, row + d.dr, col + d.dc)) {
            return true;
        }
    }
    return false;
}

// 自分の駒かどうかを判定するヘルパー
function isOwnPiece(pieceType) {
    if (currentTurn === 1) return pieceType === 1 || pieceType === 3;
    if (currentTurn === 2) return pieceType === 2 || pieceType === 4;
    return false;
}

// 移動全体のルール判定（修正版）
function isValidMove(fromRow, fromCol, toRow, toCol) {
    // ★追加：移動先が盤面の外（0〜7マス目以外）なら一律で移動不可にする
    if (toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) {
        return false;
    }

    if (jumpingPiece && (jumpingPiece.row !== fromRow || jumpingPiece.col !== fromCol)) {
        return false;
    }

    if (isValidJump(fromRow, fromCol, toRow, toCol)) {
        return { type: 'jump' };
    }

    if (mustJump) return false; 

    const rowDiff = toRow - fromRow;
    const colDiff = Math.abs(toCol - fromCol);
    const pieceType = boardState[fromRow][fromCol];
    const isKing = (pieceType === 3 || pieceType === 4);

    if (colDiff === 1) {
        if (isKing && Math.abs(rowDiff) === 1) return { type: 'normal' };
        if (!isKing && currentTurn === 1 && rowDiff === -1) return { type: 'normal' };
        if (!isKing && currentTurn === 2 && rowDiff === 1) return { type: 'normal' };
    }

    return false;
}

// クリック時の処理
function handleCellClick(e) {
    if (isGameOver || isCpuThinking) return; // CPUの手番や終了時は操作不可
    if (currentTurn === 2) return; // CPUのターンはクリック無視

    const cell = e.currentTarget;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    const clickedPiece = boardState[row][col];

    if (!jumpingPiece) {
        mustJump = checkAllJumps();
    }

    // 自分の駒を選択した場合
    if (isOwnPiece(clickedPiece)) {
        if (jumpingPiece && (jumpingPiece.row !== row || jumpingPiece.col !== col)) {
            return; 
        }
        selectedPiece = { row, col };
        createBoard();
        return;
    }

    // 移動先の空マスをクリックした場合
    if (selectedPiece && clickedPiece === 0) {
        const move = isValidMove(selectedPiece.row, selectedPiece.col, row, col);
        if (move) {
            executeMove(selectedPiece.row, selectedPiece.col, row, col, move.type);
        }
    }
}

// キングへの昇格をチェックする関数
function checkAndPromote(row, col) {
    const pieceType = boardState[row][col];
    if (pieceType === 1 && row === 0) {
        boardState[row][col] = 3; 
        return true;
    }
    if (pieceType === 2 && row === 7) {
        boardState[row][col] = 4; 
        return true;
    }
    return false;
}

// 現在の手番のプレイヤーが、盤面上で動かせる駒を1つでも持っているか（手詰まりになっていないか）
function hasAnyValidMoves() {
    // 1. まずジャンプできる手があるかチェック
    if (checkAllJumps()) {
        return true;
    }

    // 2. ジャンプできる手がない場合、通常移動ができる駒があるかチェック
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (isOwnPiece(boardState[r][c])) {
                const pieceType = boardState[r][c];
                const isKing = (pieceType === 3 || pieceType === 4);
                
                // 通常移動の候補4方向
                const normalDirs = [
                    { dr: -1, dc: -1 }, { dr: -1, dc: 1 },
                    { dr: 1, dc: -1 },  { dr: 1, dc: 1 }
                ];

                for (let d of normalDirs) {
                    const nextR = r + d.dr;
                    const nextC = c + d.dc;

                    // 盤面外ならスキップ
                    if (nextR < 0 || nextR > 7 || nextC < 0 || nextC > 7) continue;
                    // 移動先が空いていないならスキップ
                    if (boardState[nextR][nextC] !== 0) continue;

                    // 移動方向の制限チェック（キング以外）
                    if (!isKing) {
                        if (currentTurn === 1 && d.dr === 1) continue;  // 赤（プレイヤー）は下方向不可
                        if (currentTurn === 2 && d.dr === -1) continue; // 黒（CPU）は上方向不可
                    }

                    // 1つでも動かせる移動があれば手詰まりではない
                    return true;
                }
            }
        }
    }

    return false;
}

// ターン終了処理
function endTurn() {
    // 1. まず手番を次のプレイヤーに交代する
    currentTurn = currentTurn === 1 ? 2 : 1;

    // 2. 次のプレイヤーの視点でジャンプ義務があるかを更新
    mustJump = checkAllJumps();

    // 3. 交代後のプレイヤーの駒数をカウント
    let pieceCount = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (isOwnPiece(boardState[r][c])) {
                pieceCount++;
            }
        }
    }

    // 駒が0個、または動かせる手がない（手詰まり）場合は交代後のプレイヤーが敗北
    if (pieceCount === 0 || !hasAnyValidMoves()) {
        isGameOver = true;
        
        // currentTurn が敗北した側の手番になっているため、勝者は反対側
        const winner = (currentTurn === 1) ? 'コンピュータ（黒）' : 'あなた（赤）';
        const reason = (pieceCount === 0) ? '全滅しました！' : '手詰まりです！';
        
        turnIndicator.textContent = `ゲーム終了！ ${reason} ${winner}の勝ちです！`;
        selectedPiece = null;
        jumpingPiece = null;
        mustJump = false;
        createBoard();
        return;
    }

    // 通常のターン継続処理
    selectedPiece = null;
    jumpingPiece = null;
    createBoard();

    if (currentTurn === 2) {
        turnIndicator.textContent = "コンピュータ（黒）が考えています...";
        isCpuThinking = true;
        // ★修正：タイマーIDを変数に保持
        cpuTimer = setTimeout(makeCpuMove, 800); 
    } else {
        turnIndicator.textContent = "あなた（赤）の番です";
        isCpuThinking = false;
    }
}

// CPUの思考・行動ロジック（強さ調整版）
function makeCpuMove() {
    if (isGameOver) return;

    let availableMoves = [];
    
    // 1. 連続ジャンプ中・通常手番の選択肢リストアップ（その駒の次のジャンプだけを探す）
    if (jumpingPiece) {
        const directions = [{ dr: -2, dc: -2 }, { dr: -2, dc: 2 }, { dr: 2, dc: -2 }, { dr: 2, dc: 2 }];
        for (let d of directions) {
            if (isValidJump(jumpingPiece.row, jumpingPiece.col, jumpingPiece.row + d.dr, jumpingPiece.col + d.dc)) {
                availableMoves.push({
                    fromRow: jumpingPiece.row, fromCol: jumpingPiece.col,
                    toRow: jumpingPiece.row + d.dr, toCol: jumpingPiece.col + d.dc,
                    type: 'jump'
                });
            }
        }
    } else {
        // 通常の手番：まず盤面全体で「ジャンプできる駒があるか」を調べる
        mustJump = checkAllJumps();
        // 盤面を走査して駒を探す
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (isOwnPiece(boardState[r][c])) {
                    if (mustJump) {
                        // 【ルートA】ジャンプできる駒があるなら、ジャンプの手だけをリストアップする
                        const jumpDirs = [{ dr: -2, dc: -2 }, { dr: -2, dc: 2 }, { dr: 2, dc: -2 }, { dr: 2, dc: 2 }];
                        for (let d of jumpDirs) {
                            if (isValidJump(r, c, r + d.dr, c + d.dc)) {
                                availableMoves.push({ fromRow: r, fromCol: c, toRow: r + d.dr, toCol: c + d.dc, type: 'jump' });
                            }
                        }
                    } else {
                        // 【ルートB】ジャンプできる駒が一切ないなら、通常移動の手だけをリストアップする
                        const normalDirs = [{ dr: -1, dc: -1 }, { dr: -1, dc: 1 }, { dr: 1, dc: -1 }, { dr: 1, dc: 1 }];
                        const isKing = (boardState[r][c] === 3 || boardState[r][c] === 4);
                        for (let d of normalDirs) {
                            const nextR = r + d.dr;
                            const nextC = c + d.dc;
                            // 盤面の外ならスキップ
                            if (nextR < 0 || nextR > 7 || nextC < 0 || nextC > 7) continue;
                            // 移動先が空いていないならスキップ
                            if (boardState[nextR][nextC] !== 0) continue;
                            // 通常の黒ポーン（キング以外）は後ろ（上方向 dr: -1）には戻れない
                            if (!isKing && currentTurn === 2 && d.dr === -1) continue;
                            // 通常の赤ポーン（キング以外）は後ろ（下方向 dr: 1）には戻れない
                            if (!isKing && currentTurn === 1 && d.dr === 1) continue;
                            availableMoves.push({ fromRow: r, fromCol: c, toRow: nextR, toCol: nextC, type: 'normal' });
                        }
                    }
                }
            }
        }
    }

    if (availableMoves.length === 0) return;

    // 2. ★ 難易度に応じた「手の選択」ロジック ★
    let chosenMove = null;

    if (cpuDifficulty === 'easy') {
        // 【初級】完全ランダム（これまでの挙動）
        chosenMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    } 
    else if (cpuDifficulty === 'normal') {
        // 【中級】50%の確率で賢い手を選び、50%の確率でランダムに選ぶ（たまにミスをする人間らしさ）
        if (Math.random() < 0.5) {
            chosenMove = getBestMove(availableMoves);
        } else {
            chosenMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        }
    } 
    else if (cpuDifficulty === 'hard') {
        // 【上級】常に一番点数が高い「最善の手」を選ぶ
        chosenMove = getBestMove(availableMoves);
    }

    // 3. 選択した手を実行
    if (chosenMove) {
        selectedPiece = { row: chosenMove.fromRow, col: chosenMove.fromCol };
        createBoard();

        // ★修正：タイマーIDを変数に保持
        cpuTimer = setTimeout(() => {
            executeMove(chosenMove.fromRow, chosenMove.fromCol, chosenMove.toRow, chosenMove.toCol, chosenMove.type);
        }, 300);
    }
}

// 実際に盤面上の駒を動かす共通処理
function executeMove(fromRow, fromCol, toRow, toCol, moveType) {
    const movingPieceType = boardState[fromRow][fromCol];
    boardState[fromRow][fromCol] = 0;
    
    if (moveType === 'jump') {
        const midRow = (fromRow + toRow) / 2;
        const midCol = (fromCol + toCol) / 2;
        boardState[midRow][midCol] = 0; // 挟んだ駒を消す

        boardState[toRow][toCol] = movingPieceType;
        const becameKing = checkAndPromote(toRow, toCol);

        // ★修正：キングへの昇格が起きて「おらず（!becameKing）」、かつ連続ジャンプが可能な場合のみ継続
        // チェッカー規則：ジャンプ途中で最奥列に到達して昇格した場合、そのターンは即時終了となる
        if (!becameKing && canPieceJump(toRow, toCol)) {
            jumpingPiece = { row: toRow, col: toCol };
            selectedPiece = jumpingPiece;
            mustJump = true;
            createBoard();
            
            // CPUが連続ジャンプ可能な場合は、再度CPUの行動を呼び出す
            if (currentTurn === 2) {
                // プレイヤーの操作ブロックを維持したまま、次のジャンプへ
                isCpuThinking = true; 
                // 次の1手（連続ジャンプ用のロジック）を呼び出す（タイマーIDを保持）
                cpuTimer = setTimeout(makeCpuMove, 600);
            }
            return; // ターンは交代せずにここで終了
        }
    } else {
        boardState[toRow][toCol] = movingPieceType;
        checkAndPromote(toRow, toCol);
    }

    // 連続ジャンプがない場合は正常にターン終了
    endTurn();
}

// 全ての選択肢の中から、盤面を評価して一番良い手（高得点の手）を返すヘルパー関数
function getBestMove(moves) {
    let bestScore = -Infinity;
    let bestMoves = [];

    for (let move of moves) {
        // 仮想的に駒を動かしてみる前の、盤面の状態をコピー
        let backupBoard = boardState.map(row => [...row]);
        
        // 脳内で1手動かしてみる
        const movingPieceType = boardState[move.fromRow][move.fromCol];
        boardState[move.fromRow][move.fromCol] = 0;
        if (move.type === 'jump') {
            const midRow = (move.fromRow + move.toRow) / 2;
            const midCol = (move.fromCol + move.toCol) / 2;
            boardState[midRow][midCol] = 0;
        }
        boardState[move.toRow][move.toCol] = movingPieceType;

        // 動かした後の盤面の「良さ」を計算する
        let score = evaluateBoard();

        // 脳内テストが終わったので盤面を元に戻す
        boardState = backupBoard;

        // 最高得点の手を更新
        if (score > bestScore) {
            bestScore = score;
            bestMoves = [move]; // 新しい最高得点の手
        } else if (score === bestScore) {
            bestMoves.push(move); // 同点なら候補に追加
        }
    }

    // 最高得点の手が複数あれば、その中からランダムに1つ選ぶ
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

// 現在の盤面をCPU（黒）の視点で点数化する関数
function evaluateBoard() {
    let score = 0;

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = boardState[r][c];
            
            // 自分の駒（黒）のプラス評価
            if (piece === 2) {
                score += 10; // 通常の駒は10点
                if (c === 0 || c === 7) score += 2; // 端にいる駒は安全なので+2点
            } else if (piece === 4) {
                score += 15; // キングは強いので15点
                if (c === 0 || c === 7) score += 2;
            }
            
            // 相手の駒（赤）のマイナス評価（相手の駒が減る＝自分が有利）
            else if (piece === 1) {
                score -= 10;
            } else if (piece === 3) {
                score -= 15;
            }
        }
    }
    return score;
}

// ボタンやメニューのアクション設定（修正版）
function makeButtonAction(){
    // やり直すボタンの処理
    let resetButton = document.getElementById('reset');
    if (resetButton) {
        resetButton.addEventListener('click', function(event){
            event.preventDefault();
            gameInitial();
            createBoard();
        });
    }

    // ★追加：難易度選択メニューの連動処理
    let difficultySelect = document.getElementById('difficulty-select');
    if (difficultySelect) {
        // 画面がロードされた時の初期値を反映
        cpuDifficulty = difficultySelect.value;

        // メニューが変更されたら変数を書き換える
        difficultySelect.addEventListener('change', function(e) {
            cpuDifficulty = e.target.value;
        });
    }
}

// 開始
function onLoad(){
    gameInitial();
    createBoard();
    zoomCalc();
    makeButtonAction();
}

// 表示倍率計算
function zoomCalc(){
    // 表示サイズの計算
    let mainScreen = document.getElementById('board');
    let bw = window.innerWidth;
    let bh = window.innerHeight - 200;          //200は表題やボタンなどの縦幅による
    // ★補足：8マス×1マスの標準サイズ（仮に1マス60px前後の想定など）に合わせて調整が必要な箇所です
    let gridw = 5 * 100;      //5はいろいろ試した結果
    let gridh = 5 * 100;      //5はいろいろ試した結果

    // 表示倍率計算
    for(let i = 2; i > 0; i = i - 0.01){
      if( gridw * i < bw && gridh * i < bh){
        zoom = i;
        break;
      }
    }
    //alert("bw=" + bw + "  gridw=" + gridw * zoom + "  bh=" + bh + " gridh=" + gridh * zoom + " zoom=" + zoom);
    if(zoom < 0 || zoom > 1) zoom = 1.0;
    mainScreen.style.transformOrigin = 'top left';
    mainScreen.style.transform ='scale(' + zoom.toString() + ',' + zoom.toString() + ')';
}

