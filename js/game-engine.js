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
        
        // Place pieces in starting positions
        const backRow = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
        
        for (let col = 0; col < 8; col++) {
            board[0][col] = { type: backRow[col], color: 'black' };
            board[1][col] = { type: 'pawn', color: 'black' };
            board[6][col] = { type: 'pawn', color: 'white' };
            board[7][col] = { type: backRow[col], color: 'white' };
        }
        
        return board;
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
        
        // Handle castling rook movement for the check test
        if (piece.type === 'king' && Math.abs(toCol - fromCol) === 2) {
            const rookFromCol = toCol > fromCol ? 7 : 0;
            const rookToCol = toCol > fromCol ? 5 : 3;
            const rook = this.board[fromRow][rookFromCol];
            this.board[fromRow][rookToCol] = rook;
            this.board[fromRow][rookFromCol] = null;
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
                
                // Castling (king moves 2 squares horizontally)
                if (absRowDiff === 0 && absColDiff === 2) {
                    return this.canCastle(piece.color, toCol > fromCol);
                }
                
                return false;
            default:
                return false;
        }
    }
    
    canCastle(color, kingside) {
        const row = color === 'white' ? 7 : 0;
        const kingCol = 4;
        const rookCol = kingside ? 7 : 0;
        
        // Check castling rights
        if (!this.castlingRights[color][kingside ? 'kingside' : 'queenside']) {
            return false;
        }
        
        // Check if king is in check
        if (this.isInCheck(color)) {
            return false;
        }
        
        // Check if path is clear
        const startCol = Math.min(kingCol, rookCol);
        const endCol = Math.max(kingCol, rookCol);
        
        for (let col = startCol + 1; col < endCol; col++) {
            if (this.board[row][col] !== null) {
                return false;
            }
        }
        
        // Check if king passes through or ends up in check
        const kingDestCol = kingside ? 6 : 2;
        const passThroughCol = kingside ? 5 : 3;
        
        // Test if king would be in check on the square it passes through
        const tempBoard = this.copyBoard();
        this.board[row][passThroughCol] = this.board[row][kingCol];
        this.board[row][kingCol] = null;
        
        const passesThroughCheck = this.isInCheck(color);
        
        // Test if king would be in check on the destination square
        this.board[row][kingDestCol] = this.board[row][passThroughCol];
        this.board[row][passThroughCol] = null;
        
        const endsInCheck = this.isInCheck(color);
        
        // Restore board
        this.board = tempBoard;
        
        return !passesThroughCheck && !endsInCheck;
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
        
        // Handle castling
        if (piece.type === 'king' && Math.abs(toCol - fromCol) === 2) {
            const rookFromCol = toCol > fromCol ? 7 : 0;
            const rookToCol = toCol > fromCol ? 5 : 3;
            const rook = this.board[fromRow][rookFromCol];
            
            // Move the rook
            this.board[fromRow][rookToCol] = rook;
            this.board[fromRow][rookFromCol] = null;
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
            if (piece.color === 'white' && fromRow === 7) {
                if (fromCol === 0) this.castlingRights.white.queenside = false;
                if (fromCol === 7) this.castlingRights.white.kingside = false;
            } else if (piece.color === 'black' && fromRow === 0) {
                if (fromCol === 0) this.castlingRights.black.queenside = false;
                if (fromCol === 7) this.castlingRights.black.kingside = false;
            }
        }
        
        // If rook is captured, lose castling right for that side
        const capturedPiece = this.board[toRow][toCol];
        if (capturedPiece && capturedPiece.type === 'rook') {
            if (capturedPiece.color === 'white' && toRow === 7) {
                if (toCol === 0) this.castlingRights.white.queenside = false;
                if (toCol === 7) this.castlingRights.white.kingside = false;
            } else if (capturedPiece.color === 'black' && toRow === 0) {
                if (toCol === 0) this.castlingRights.black.queenside = false;
                if (toCol === 7) this.castlingRights.black.kingside = false;
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
        
        // Handle castling
        if (piece.type === 'king' && Math.abs(toCol - fromCol) === 2) {
            if (toCol > fromCol) {
                notation = `${colorName} castles kingside`;
            } else {
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
