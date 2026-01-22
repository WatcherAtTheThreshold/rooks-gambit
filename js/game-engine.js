// Core chess game logic and rules
// No DOM interactions - pure game state management

class ChessGame {
    constructor() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.gameOver = false;
        this.moveHistory = [];
        this.lastAIMove = null; // Track last AI move for highlighting
        this.enPassantTarget = null;
        this.castlingRights = {
            white: { kingside: true, queenside: true },
            black: { kingside: true, queenside: true }
        };
        this.halfMoveClock = 0;
        this.fullMoveNumber = 1;
        this.gameStarted = false;

        // Chess960 support
        this.isChess960 = false;
        this.initialPositions = {
            white: { king: 4, rookKingside: 7, rookQueenside: 0 },
            black: { king: 4, rookKingside: 7, rookQueenside: 0 }
        };
        this.positionId = null;

        this.pieces = {
            white: {
                king: '♔', queen: '♕', rook: '♖', 
                bishop: '♗', knight: '♘', pawn: '♙'
            },
            black: {
                king: '♚', queen: '♛', rook: '♜', 
                bishop: '♝', knight: '♞', pawn: '♟'
            }
        };
        
        // Piece names for descriptive notation
        this.pieceNames = {
            king: 'King', queen: 'Queen', rook: 'Rook',
            bishop: 'Bishop', knight: 'Knight', pawn: 'Pawn'
        };
    }
    
    initializeBoard() {
        const board = Array(8).fill(null).map(() => Array(8).fill(null));

        // Get back row based on game mode
        let backRow;
        if (this.isChess960) {
            backRow = this.generateChess960Position(this.positionId);
        } else {
            backRow = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
            // Ensure standard positions for castling
            this.initialPositions = {
                white: { king: 4, rookKingside: 7, rookQueenside: 0 },
                black: { king: 4, rookKingside: 7, rookQueenside: 0 }
            };
        }

        for (let col = 0; col < 8; col++) {
            board[0][col] = { type: backRow[col], color: 'black' };
            board[1][col] = { type: 'pawn', color: 'black' };
            board[6][col] = { type: 'pawn', color: 'white' };
            board[7][col] = { type: backRow[col], color: 'white' };
        }

        return board;
    }

    // Generate a Chess960 starting position using the Scharnagl algorithm
    // positionId: 0-959, or null for random
    generateChess960Position(positionId = null) {
        if (positionId === null) {
            positionId = Math.floor(Math.random() * 960);
        }
        this.positionId = positionId;

        const backRow = new Array(8).fill(null);

        // Step 1: Light-square bishop (columns 1, 3, 5, 7)
        const lightSquares = [1, 3, 5, 7];
        const lightBishopIndex = positionId % 4;
        backRow[lightSquares[lightBishopIndex]] = 'bishop';

        // Step 2: Dark-square bishop (columns 0, 2, 4, 6)
        const darkSquares = [0, 2, 4, 6];
        const darkBishopIndex = Math.floor(positionId / 4) % 4;
        backRow[darkSquares[darkBishopIndex]] = 'bishop';

        // Step 3: Queen placement among remaining 6 squares
        const queenIndex = Math.floor(positionId / 16) % 6;
        let emptyCount = 0;
        for (let i = 0; i < 8; i++) {
            if (backRow[i] === null) {
                if (emptyCount === queenIndex) {
                    backRow[i] = 'queen';
                    break;
                }
                emptyCount++;
            }
        }

        // Step 4: Knight placements (lookup table for 5 choose 2 = 10 combinations)
        const knightTable = [
            [0, 1], [0, 2], [0, 3], [0, 4],
            [1, 2], [1, 3], [1, 4],
            [2, 3], [2, 4],
            [3, 4]
        ];
        const knightIndex = Math.floor(positionId / 96);
        const knightPositions = knightTable[knightIndex];

        let emptySquares = [];
        for (let i = 0; i < 8; i++) {
            if (backRow[i] === null) {
                emptySquares.push(i);
            }
        }

        backRow[emptySquares[knightPositions[0]]] = 'knight';
        backRow[emptySquares[knightPositions[1]]] = 'knight';

        // Step 5: Place rooks and king in remaining squares (RKR order)
        emptySquares = [];
        for (let i = 0; i < 8; i++) {
            if (backRow[i] === null) {
                emptySquares.push(i);
            }
        }
        // Remaining 3 squares: first=rook, second=king, third=rook
        backRow[emptySquares[0]] = 'rook';
        backRow[emptySquares[1]] = 'king';
        backRow[emptySquares[2]] = 'rook';

        // Store initial positions for castling
        const kingCol = emptySquares[1];
        const rookQueensideCol = emptySquares[0];
        const rookKingsideCol = emptySquares[2];

        this.initialPositions = {
            white: { king: kingCol, rookKingside: rookKingsideCol, rookQueenside: rookQueensideCol },
            black: { king: kingCol, rookKingside: rookKingsideCol, rookQueenside: rookQueensideCol }
        };

        return backRow;
    }

    // Set Chess960 mode
    setChess960Mode(enabled, positionId = null) {
        this.isChess960 = enabled;
        if (enabled) {
            this.positionId = positionId;
        } else {
            this.positionId = null;
            // Reset to standard positions
            this.initialPositions = {
                white: { king: 4, rookKingside: 7, rookQueenside: 0 },
                black: { king: 4, rookKingside: 7, rookQueenside: 0 }
            };
        }
    }

    isValidMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        if (!piece || piece.color !== this.currentPlayer) return false;
        
        // Check if move is within board
        if (toRow < 0 || toRow >= 8 || toCol < 0 || toCol >= 8) return false;
        
        // Check if target square has same color piece
        const targetPiece = this.board[toRow][toCol];
        if (targetPiece && targetPiece.color === piece.color) return false;
        
        // Check piece-specific movement rules
        if (!this.isPieceMovementValid(piece, fromRow, fromCol, toRow, toCol)) return false;
        
        // Check if move would put own king in check
        const tempBoard = this.copyBoard();
        const tempCastlingRights = JSON.parse(JSON.stringify(this.castlingRights));
        
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        
        // Handle castling rook movement for the check test (Chess960 compatible)
        if (piece.type === 'king') {
            const positions = this.initialPositions[piece.color];
            const isKingsideCastle = toCol === 6 && fromCol === positions.king;
            const isQueensideCastle = toCol === 2 && fromCol === positions.king;

            if (isKingsideCastle || isQueensideCastle) {
                const rookFromCol = isKingsideCastle ? positions.rookKingside : positions.rookQueenside;
                const rookToCol = isKingsideCastle ? 5 : 3;
                const rook = this.board[fromRow][rookFromCol];
                this.board[fromRow][rookToCol] = rook;
                this.board[fromRow][rookFromCol] = null;
            }
        }
        
        const wouldBeInCheck = this.isInCheck(piece.color);
        
        // Restore the board and castling rights
        this.board = tempBoard;
        this.castlingRights = tempCastlingRights;
        
        return !wouldBeInCheck;
    }
    
    isPieceMovementValid(piece, fromRow, fromCol, toRow, toCol) {
        const rowDiff = toRow - fromRow;
        const colDiff = toCol - fromCol;
        const absRowDiff = Math.abs(rowDiff);
        const absColDiff = Math.abs(colDiff);
        
        switch (piece.type) {
            case 'pawn':
                return this.isValidPawnMove(piece, fromRow, fromCol, toRow, toCol);
            case 'rook':
                return (rowDiff === 0 || colDiff === 0) && this.isPathClear(fromRow, fromCol, toRow, toCol);
            case 'bishop':
                return absRowDiff === absColDiff && this.isPathClear(fromRow, fromCol, toRow, toCol);
            case 'queen':
                return ((rowDiff === 0 || colDiff === 0) || (absRowDiff === absColDiff)) && 
                       this.isPathClear(fromRow, fromCol, toRow, toCol);
            case 'knight':
                return (absRowDiff === 2 && absColDiff === 1) || (absRowDiff === 1 && absColDiff === 2);
            case 'king':
                // Normal king move (one square in any direction)
                if (absRowDiff <= 1 && absColDiff <= 1) return true;

                // Castling detection for Chess960 compatibility
                // King moves to g-file (col 6) for kingside, c-file (col 2) for queenside
                const positions = this.initialPositions[piece.color];
                if (absRowDiff === 0 && fromCol === positions.king) {
                    if (toCol === 6) { // Kingside castling destination
                        return this.canCastle(piece.color, true);
                    }
                    if (toCol === 2) { // Queenside castling destination
                        return this.canCastle(piece.color, false);
                    }
                }

                return false;
            default:
                return false;
        }
    }
    
    canCastle(color, kingside) {
        const row = color === 'white' ? 7 : 0;
        const positions = this.initialPositions[color];
        const kingCol = positions.king;
        const rookCol = kingside ? positions.rookKingside : positions.rookQueenside;

        // Check castling rights
        if (!this.castlingRights[color][kingside ? 'kingside' : 'queenside']) {
            return false;
        }

        // Check if king is in check
        if (this.isInCheck(color)) {
            return false;
        }

        // King destination: g-file (col 6) for kingside, c-file (col 2) for queenside
        const kingDestCol = kingside ? 6 : 2;
        // Rook destination: f-file (col 5) for kingside, d-file (col 3) for queenside
        const rookDestCol = kingside ? 5 : 3;

        // Verify king and rook are still in their initial positions
        const king = this.board[row][kingCol];
        const rook = this.board[row][rookCol];

        if (!king || king.type !== 'king' || king.color !== color) {
            return false;
        }
        if (!rook || rook.type !== 'rook' || rook.color !== color) {
            return false;
        }

        // Check path clearance for Chess960
        // All squares that king passes through, rook passes through, or are destinations must be clear
        // (except for the king and rook themselves)
        const minCol = Math.min(kingCol, kingDestCol, rookCol, rookDestCol);
        const maxCol = Math.max(kingCol, kingDestCol, rookCol, rookDestCol);

        for (let col = minCol; col <= maxCol; col++) {
            // Skip the king and rook's current positions
            if (col === kingCol || col === rookCol) continue;

            if (this.board[row][col] !== null) {
                return false;
            }
        }

        // Check that king does not pass through or end in check
        // Test each square the king passes through (including destination)
        const tempBoard = this.copyBoard();
        const step = kingDestCol > kingCol ? 1 : -1;

        for (let col = kingCol + step; ; col += step) {
            // Temporarily move king to this square
            this.board[row][col] = king;
            this.board[row][kingCol] = null;

            if (this.isInCheck(color)) {
                this.board = tempBoard;
                return false;
            }

            // Restore for next iteration
            this.board = tempBoard.map(r => r.map(p => p ? {...p} : null));

            if (col === kingDestCol) break;
        }

        // Restore original board
        this.board = tempBoard;

        return true;
    }
    
    isValidPawnMove(piece, fromRow, fromCol, toRow, toCol) {
        const direction = piece.color === 'white' ? -1 : 1;
        const startRow = piece.color === 'white' ? 6 : 1;
        const rowDiff = toRow - fromRow;
        const colDiff = Math.abs(toCol - fromCol);
        
        // Moving forward
        if (colDiff === 0) {
            if (rowDiff === direction && !this.board[toRow][toCol]) return true;
            if (fromRow === startRow && rowDiff === 2 * direction && !this.board[toRow][toCol]) return true;
        }
        
        // Capturing
        if (colDiff === 1 && rowDiff === direction) {
            if (this.board[toRow][toCol]) return true;
            // En passant
            if (this.enPassantTarget && 
                this.enPassantTarget.row === toRow && 
                this.enPassantTarget.col === toCol) return true;
        }
        
        return false;
    }
    
    isPathClear(fromRow, fromCol, toRow, toCol) {
        const rowStep = toRow === fromRow ? 0 : (toRow > fromRow ? 1 : -1);
        const colStep = toCol === fromCol ? 0 : (toCol > fromCol ? 1 : -1);
        
        let currentRow = fromRow + rowStep;
        let currentCol = fromCol + colStep;
        
        while (currentRow !== toRow || currentCol !== toCol) {
            if (this.board[currentRow][currentCol]) return false;
            currentRow += rowStep;
            currentCol += colStep;
        }
        
        return true;
    }
    
    makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const capturedPiece = this.board[toRow][toCol];
        
        // Handle en passant capture
        if (piece.type === 'pawn' && this.enPassantTarget && 
            toRow === this.enPassantTarget.row && toCol === this.enPassantTarget.col) {
            this.board[fromRow][toCol] = null;
        }
        
        // Handle castling (Chess960 compatible)
        if (piece.type === 'king') {
            const positions = this.initialPositions[piece.color];
            const isKingsideCastle = toCol === 6 && fromCol === positions.king && this.castlingRights[piece.color].kingside;
            const isQueensideCastle = toCol === 2 && fromCol === positions.king && this.castlingRights[piece.color].queenside;

            if (isKingsideCastle || isQueensideCastle) {
                const rookFromCol = isKingsideCastle ? positions.rookKingside : positions.rookQueenside;
                const rookToCol = isKingsideCastle ? 5 : 3;
                const rook = this.board[fromRow][rookFromCol];

                // Clear the rook's original position first (in case king lands there in Chess960)
                this.board[fromRow][rookFromCol] = null;
                // Move the rook to its destination
                this.board[fromRow][rookToCol] = rook;
            }
        }
        
        // Move piece
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        
        // Update castling rights
        this.updateCastlingRights(piece, fromRow, fromCol, toRow, toCol);
        
        // Handle pawn promotion
        if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
            this.board[toRow][toCol] = { type: 'queen', color: piece.color };
        }
        
        // Set en passant target
        this.enPassantTarget = null;
        if (piece.type === 'pawn' && Math.abs(toRow - fromRow) === 2) {
            this.enPassantTarget = { row: fromRow + (toRow - fromRow) / 2, col: toCol };
        }
        
        // Update move counters
        if (piece.type === 'pawn' || capturedPiece) {
            this.halfMoveClock = 0;
        } else {
            this.halfMoveClock++;
        }
        
        if (this.currentPlayer === 'black') {
            this.fullMoveNumber++;
        }
        
        // Record move with descriptive notation
        let moveNotation = this.getDescriptiveNotation(piece, fromRow, fromCol, toRow, toCol, capturedPiece);
        
        // Switch players first to check the opponent's status
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        
        // Add chess conditions (check, checkmate, etc.) after player switch
        moveNotation = this.addMoveConditions(moveNotation, piece);
        
        // Store the move in history
        this.moveHistory.push({
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece: piece,
            captured: capturedPiece,
            notation: moveNotation,
            moveNumber: this.fullMoveNumber,
            player: piece.color
        });
        
        return {
            piece,
            capturedPiece,
            fromRow,
            fromCol,
            toRow,
            toCol,
            moveNotation
        };
    }
    
    updateCastlingRights(piece, fromRow, fromCol, toRow, toCol) {
        // If king moves, lose all castling rights for that color
        if (piece.type === 'king') {
            this.castlingRights[piece.color].kingside = false;
            this.castlingRights[piece.color].queenside = false;
        }

        // If rook moves from starting position, lose castling right for that side
        if (piece.type === 'rook') {
            const positions = this.initialPositions[piece.color];
            const homeRow = piece.color === 'white' ? 7 : 0;

            if (fromRow === homeRow) {
                if (fromCol === positions.rookQueenside) {
                    this.castlingRights[piece.color].queenside = false;
                }
                if (fromCol === positions.rookKingside) {
                    this.castlingRights[piece.color].kingside = false;
                }
            }
        }

        // If rook is captured, lose castling right for that side
        const capturedPiece = this.board[toRow][toCol];
        if (capturedPiece && capturedPiece.type === 'rook') {
            const positions = this.initialPositions[capturedPiece.color];
            const homeRow = capturedPiece.color === 'white' ? 7 : 0;

            if (toRow === homeRow) {
                if (toCol === positions.rookQueenside) {
                    this.castlingRights[capturedPiece.color].queenside = false;
                }
                if (toCol === positions.rookKingside) {
                    this.castlingRights[capturedPiece.color].kingside = false;
                }
            }
        }
    }
    
    isInCheck(color) {
        const kingPosition = this.findKing(color);
        if (!kingPosition) return false;
        
        const opponentColor = color === 'white' ? 'black' : 'white';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === opponentColor) {
                    if (this.isPieceMovementValid(piece, row, col, kingPosition.row, kingPosition.col)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    findKing(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type === 'king' && piece.color === color) {
                    return { row, col };
                }
            }
        }
        return null;
    }
    
    isCheckmate(color) {
        if (!this.isInCheck(color)) return false;
        return this.getAllValidMoves(color).length === 0;
    }
    
    isStalemate(color) {
        if (this.isInCheck(color)) return false;
        return this.getAllValidMoves(color).length === 0;
    }
    
    getAllValidMoves(color) {
        const moves = [];
        
        for (let fromRow = 0; fromRow < 8; fromRow++) {
            for (let fromCol = 0; fromCol < 8; fromCol++) {
                const piece = this.board[fromRow][fromCol];
                if (piece && piece.color === color) {
                    for (let toRow = 0; toRow < 8; toRow++) {
                        for (let toCol = 0; toCol < 8; toCol++) {
                            if (this.isValidMove(fromRow, fromCol, toRow, toCol)) {
                                moves.push({ from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } });
                            }
                        }
                    }
                }
            }
        }
        
        return moves;
    }
    
    copyBoard() {
        return this.board.map(row => row.map(piece => piece ? { ...piece } : null));
    }
    
    coordinateToAlgebraic(row, col) {
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
        return files[col] + ranks[row];
    }
    
    // Enhanced descriptive notation function with chess terminology
    getDescriptiveNotation(piece, fromRow, fromCol, toRow, toCol, capturedPiece) {
        const colorName = piece.color === 'white' ? 'White' : 'Black';
        const pieceName = this.pieceNames[piece.type];
        const toSquare = this.coordinateToAlgebraic(toRow, toCol);
        
        let notation = `${colorName} ${pieceName} moves to ${toSquare}`;
        
        // Add capture information
        if (capturedPiece) {
            const capturedColorName = capturedPiece.color === 'white' ? 'White' : 'Black';
            const capturedPieceName = this.pieceNames[capturedPiece.type];
            notation += ` and takes ${capturedColorName} ${capturedPieceName}`;
        }
        
        // Handle en passant
        if (piece.type === 'pawn' && this.enPassantTarget && 
            toRow === this.enPassantTarget.row && toCol === this.enPassantTarget.col) {
            notation += ' (en passant)';
        }
        
        // Handle pawn promotion
        if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
            notation += ' and promotes to Queen';
        }
        
        // Handle castling (Chess960 compatible - detect by destination)
        if (piece.type === 'king') {
            const positions = this.initialPositions[piece.color];
            if (fromCol === positions.king && toCol === 6) {
                notation = `${colorName} castles kingside`;
            } else if (fromCol === positions.king && toCol === 2) {
                notation = `${colorName} castles queenside`;
            }
        }
        
        return notation;
    }
    
    // Check for special move conditions after a move is made
    addMoveConditions(notation, piece) {
        const opponentColor = piece.color === 'white' ? 'black' : 'white';
        
        // Check for checkmate
        if (this.isCheckmate(opponentColor)) {
            notation += ' - <span class="move-checkmate">Checkmate!</span>';
            return notation;
        }
        
        // Check for stalemate
        if (this.isStalemate(opponentColor)) {
            notation += ' - <span class="move-stalemate">Stalemate!</span>';
            return notation;
        }
        
        // Check for check
        if (this.isInCheck(opponentColor)) {
            notation += ' - <span class="move-check">Check!</span>';
        }
        
        return notation;
    }
    
    // Reset game to initial state
    reset() {
        // For Chess960, generate a new random position on reset
        if (this.isChess960) {
            this.positionId = null; // Will generate new random position in initializeBoard
        }

        this.board = this.initializeBoard();
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.gameOver = false;
        this.moveHistory = [];
        this.lastAIMove = null;
        this.enPassantTarget = null;
        this.castlingRights = {
            white: { kingside: true, queenside: true },
            black: { kingside: true, queenside: true }
        };
        this.halfMoveClock = 0;
        this.fullMoveNumber = 1;
        this.gameStarted = false;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChessGame;
}
