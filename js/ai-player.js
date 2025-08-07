// AI Player - AI move selection with difficulty-based personalities
// Integration with game state and animation triggers

class AIPlayer {
    constructor(gameEngine, uiController) {
        this.gameEngine = gameEngine;
        this.uiController = uiController;
        this.isThinking = false;
        this.difficulty = 'novice'; // Default difficulty
        
        // Difficulty-specific settings
        this.difficultySettings = {
            novice: {
                name: '🛡️ Novice',
                randomMoveChance: 0.25, // 25% chance of random move
                thinkingTimeMin: 500,
                thinkingTimeMax: 1200,
                missedCaptureChance: 0.15, // 15% chance to miss obvious captures
                personality: 'cautious'
            },
            knight: {
                name: '⚔️ Knight', 
                randomMoveChance: 0.05, // 5% chance of random move
                thinkingTimeMin: 800,
                thinkingTimeMax: 2300,
                missedCaptureChance: 0.02, // 2% chance to miss captures
                personality: 'balanced'
            },
            grandmaster: {
                name: '👑 Grandmaster',
                randomMoveChance: 0.0, // No random moves
                thinkingTimeMin: 1500,
                thinkingTimeMax: 4000,
                missedCaptureChance: 0.0, // Never misses captures
                personality: 'aggressive'
            }
        };
    }
    
    // Set difficulty level
    setDifficulty(difficulty) {
        if (this.difficultySettings[difficulty]) {
            this.difficulty = difficulty;
            console.log(`AI difficulty set to: ${this.difficultySettings[difficulty].name}`);
        } else {
            console.warn('Invalid difficulty:', difficulty);
        }
    }
    
    makeMove() {
        if (this.gameEngine.gameOver || this.gameEngine.currentPlayer !== 'black' || this.isThinking) {
            return;
        }
        
        const moves = this.gameEngine.getAllValidMoves('black');
        if (moves.length === 0) {
            this.gameEngine.gameOver = true;
            this.uiController.updateDisplay();
            return;
        }
        
        this.isThinking = true;
        
        // Get difficulty-specific thinking time
        const settings = this.difficultySettings[this.difficulty];
        const thinkingTime = Math.random() * (settings.thinkingTimeMax - settings.thinkingTimeMin) + settings.thinkingTimeMin;
        
        // Show AI is thinking with personality flair
        this.showThinkingMessage();
        
        setTimeout(() => {
            const bestMove = this.selectBestMove(moves);
            
            // Store this move as the last AI move for UI highlighting
            this.gameEngine.lastAIMove = {
                from: { row: bestMove.from.row, col: bestMove.from.col },
                to: { row: bestMove.to.row, col: bestMove.to.col }
            };
            
            // Make the move
            const moveResult = this.gameEngine.makeMove(
                bestMove.from.row, 
                bestMove.from.col, 
                bestMove.to.row, 
                bestMove.to.col
            );
            
            // ENHANCED: Handle move result with smart highlighting
            this.handleMoveResult(moveResult, bestMove);
            
            // Check for game over
            if (this.gameEngine.isCheckmate('white')) {
                this.gameEngine.gameOver = true;
            } else if (this.gameEngine.isStalemate('white')) {
                this.gameEngine.gameOver = true;
            }
            
            this.uiController.updateDisplay();
            this.uiController.updateMoveHistory();
            this.uiController.updateButtonStates();
            
            this.isThinking = false;
        }, thinkingTime);
    }
    
    showThinkingMessage() {
        const settings = this.difficultySettings[this.difficulty];
        const messages = {
            novice: ["AI is learning...", "Studying the board...", "Thinking carefully..."],
            knight: ["AI is calculating...", "Evaluating options...", "Planning strategy..."],
            grandmaster: ["AI is analyzing deeply...", "Computing tactical lines...", "Seeking the perfect move..."]
        };
        
        const messageList = messages[this.difficulty] || messages.knight;
        const randomMessage = messageList[Math.floor(Math.random() * messageList.length)];
        this.uiController.showAIThinking(randomMessage);
    }
    
    selectBestMove(moves) {
        const settings = this.difficultySettings[this.difficulty];
        
        // Random move chance (for learning/variety)
        if (Math.random() < settings.randomMoveChance) {
            console.log(`${settings.name} making random move`);
            return moves[Math.floor(Math.random() * moves.length)];
        }
        
        // Difficulty-specific move selection
        switch (this.difficulty) {
            case 'novice':
                return this.selectNoviceMove(moves);
            case 'knight':
                return this.selectKnightMove(moves);
            case 'grandmaster':
                return this.selectGrandmasterMove(moves);
            default:
                return this.selectKnightMove(moves);
        }
    }
    
    selectNoviceMove(moves) {
        const settings = this.difficultySettings.novice;
        let bestMove = moves[0];
        let bestScore = -1000;
        
        for (const move of moves) {
            let score = Math.random() * 15; // Higher randomness
            
            // Basic evaluation with chance to miss captures
            const targetPiece = this.gameEngine.board[move.to.row][move.to.col];
            if (targetPiece) {
                // Sometimes misses captures
                if (Math.random() > settings.missedCaptureChance) {
                    score += this.getPieceValue(targetPiece.type) * 0.8; // Reduced capture value
                }
            }
            
            // Simple center preference
            if ((move.to.row >= 3 && move.to.row <= 4) && (move.to.col >= 3 && move.to.col <= 4)) {
                score += 5;
            }
            
            // Avoid moving into obvious danger (basic safety)
            if (this.isSquareUnderAttack(move.to.row, move.to.col, 'white')) {
                score -= 10;
            }
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove;
    }
    
    selectKnightMove(moves) {
        // Current balanced AI logic
        let bestMove = moves[0];
        let bestScore = -1000;
        
        for (const move of moves) {
            let score = Math.random() * 10; // Base randomness
            
            // Evaluate the move with current logic
            score += this.evaluateMove(move);
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove;
    }
    
    selectGrandmasterMove(moves) {
        let bestMove = moves[0];
        let bestScore = -1000;
        
        for (const move of moves) {
            let score = Math.random() * 5; // Reduced randomness
            
            // Enhanced evaluation
            score += this.evaluateGrandmasterMove(move);
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove;
    }
    
    evaluateMove(move) {
        // Current knight-level evaluation
        let score = 0;
        const targetPiece = this.gameEngine.board[move.to.row][move.to.col];
        const movingPiece = this.gameEngine.board[move.from.row][move.from.col];
        
        // Prefer captures - weighted by piece value
        if (targetPiece) {
            score += this.getPieceValue(targetPiece.type);
        }
        
        // Prefer center control
        if ((move.to.row >= 3 && move.to.row <= 4) && (move.to.col >= 3 && move.to.col <= 4)) {
            score += 10;
        }
        
        // Prefer piece development
        if (movingPiece && move.from.row === 0 && (movingPiece.type === 'knight' || movingPiece.type === 'bishop')) {
            score += 15;
        }
        
        // Prefer pawn advancement
        if (movingPiece && movingPiece.type === 'pawn') {
            score += (7 - move.to.row) * 2;
        }
        
        // Avoid moving same piece repeatedly
        if (this.gameEngine.moveHistory.length > 0) {
            const lastMove = this.gameEngine.moveHistory[this.gameEngine.moveHistory.length - 1];
            if (lastMove.player === 'black' && 
                lastMove.to.row === move.from.row && 
                lastMove.to.col === move.from.col) {
                score -= 5;
            }
        }
        
        // Check bonus
        if (this.wouldGiveCheck(move)) {
            score += 20;
        }
        
        // Avoid moving into attack
        if (this.isSquareUnderAttack(move.to.row, move.to.col, 'white')) {
            score -= this.getPieceValue(movingPiece.type) / 2;
        }
        
        return score;
    }
    
    evaluateGrandmasterMove(move) {
        // Enhanced evaluation for grandmaster level
        let score = this.evaluateMove(move); // Start with knight evaluation
        
        const targetPiece = this.gameEngine.board[move.to.row][move.to.col];
        const movingPiece = this.gameEngine.board[move.from.row][move.from.col];
        
        // Enhanced capture evaluation
        if (targetPiece) {
            score += this.getPieceValue(targetPiece.type) * 1.5; // Increased capture value
            
            // Bonus for capturing with lower value piece
            if (this.getPieceValue(movingPiece.type) < this.getPieceValue(targetPiece.type)) {
                score += 15;
            }
        }
        
        // Advanced positional bonuses
        score += this.getPositionalValue(movingPiece, move.to.row, move.to.col);
        
        // Aggressive play - prefer attacks near enemy king
        const whiteKing = this.gameEngine.findKing('white');
        if (whiteKing) {
            const distanceToKing = Math.abs(move.to.row - whiteKing.row) + Math.abs(move.to.col - whiteKing.col);
            if (distanceToKing <= 3) {
                score += (4 - distanceToKing) * 5; // Closer to king = higher score
            }
        }
        
        // Tactical bonuses
        if (this.createsFork(move)) score += 25;
        if (this.createsPin(move)) score += 20;
        if (this.createsSkewer(move)) score += 30;
        
        // Opening principles (first 10 moves)
        if (this.gameEngine.fullMoveNumber <= 5) {
            score += this.getOpeningBonus(movingPiece, move);
        }
        
        // Endgame considerations (few pieces left)
        const totalPieces = this.countTotalPieces();
        if (totalPieces <= 12) {
            score += this.getEndgameBonus(movingPiece, move);
        }
        
        return score;
    }
    
    getPositionalValue(piece, row, col) {
        // Piece-specific positional bonuses
        const pieceSquareTables = {
            pawn: [
                [0,  0,  0,  0,  0,  0,  0,  0],
                [5, 10, 10,-20,-20, 10, 10,  5],
                [5, -5,-10,  0,  0,-10, -5,  5],
                [0,  0,  0, 20, 20,  0,  0,  0],
                [5,  5, 10, 25, 25, 10,  5,  5],
                [10,10, 20, 30, 30, 20, 10, 10],
                [50,50, 50, 50, 50, 50, 50, 50],
                [0,  0,  0,  0,  0,  0,  0,  0]
            ],
            knight: [
                [-50,-40,-30,-30,-30,-30,-40,-50],
                [-40,-20,  0,  5,  5,  0,-20,-40],
                [-30,  5, 10, 15, 15, 10,  5,-30],
                [-30,  0, 15, 20, 20, 15,  0,-30],
                [-30,  5, 15, 20, 20, 15,  5,-30],
                [-30,  0, 10, 15, 15, 10,  0,-30],
                [-40,-20,  0,  0,  0,  0,-20,-40],
                [-50,-40,-30,-30,-30,-30,-40,-50]
            ]
        };
        
        if (pieceSquareTables[piece.type]) {
            return pieceSquareTables[piece.type][row][col] / 10; // Scale down
        }
        
        return 0;
    }
    
    createsFork(move) {
        // Simplified fork detection (attacks 2+ pieces)
        const movingPiece = this.gameEngine.board[move.from.row][move.from.col];
        if (movingPiece.type !== 'knight' && movingPiece.type !== 'pawn') return false;
        
        let attacks = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.gameEngine.board[row][col];
                if (piece && piece.color === 'white') {
                    if (this.gameEngine.isPieceMovementValid(movingPiece, move.to.row, move.to.col, row, col)) {
                        attacks++;
                    }
                }
            }
        }
        return attacks >= 2;
    }
    
    createsPin(move) {
        // Simplified pin detection
        return Math.random() < 0.1; // 10% chance (placeholder)
    }
    
    createsSkewer(move) {
        // Simplified skewer detection  
        return Math.random() < 0.05; // 5% chance (placeholder)
    }
    
    getOpeningBonus(piece, move) {
        let bonus = 0;
        
        // Develop knights and bishops
        if ((piece.type === 'knight' || piece.type === 'bishop') && move.from.row === 0) {
            bonus += 20;
        }
        
        // Castle early
        if (piece.type === 'king' && Math.abs(move.to.col - move.from.col) === 2) {
            bonus += 30;
        }
        
        // Control center with pawns
        if (piece.type === 'pawn' && (move.to.col === 3 || move.to.col === 4)) {
            bonus += 15;
        }
        
        return bonus;
    }
    
    getEndgameBonus(piece, move) {
        let bonus = 0;
        
        // King activity in endgame
        if (piece.type === 'king') {
            bonus += 10;
        }
        
        // Pawn promotion threats
        if (piece.type === 'pawn' && move.to.row >= 5) {
            bonus += (move.to.row - 4) * 10;
        }
        
        return bonus;
    }
    
    countTotalPieces() {
        let count = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.gameEngine.board[row][col]) count++;
            }
        }
        return count;
    }
    
    getPieceValue(pieceType) {
        const values = {
            pawn: 10,
            knight: 30,
            bishop: 30,
            rook: 50,
            queen: 90,
            king: 1000
        };
        return values[pieceType] || 0;
    }
    
    wouldGiveCheck(move) {
        // Temporarily make the move
        const originalPiece = this.gameEngine.board[move.to.row][move.to.col];
        const movingPiece = this.gameEngine.board[move.from.row][move.from.col];
        
        this.gameEngine.board[move.to.row][move.to.col] = movingPiece;
        this.gameEngine.board[move.from.row][move.from.col] = null;
        
        const givesCheck = this.gameEngine.isInCheck('white');
        
        // Restore the board
        this.gameEngine.board[move.from.row][move.from.col] = movingPiece;
        this.gameEngine.board[move.to.row][move.to.col] = originalPiece;
        
        return givesCheck;
    }
    
    isSquareUnderAttack(row, col, byColor) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.gameEngine.board[r][c];
                if (piece && piece.color === byColor) {
                    if (this.gameEngine.isPieceMovementValid(piece, r, c, row, col)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    // ENHANCED: Smart move result handling with persistent highlighting
    handleMoveResult(moveResult, bestMove) {
        console.log('AIPlayer: Handling move result with smart highlighting');
        
        // Trigger particle effects first
        if (moveResult.capturedPiece) {
            this.triggerCaptureEffect(bestMove.to.row, bestMove.to.col);
        } else {
            this.triggerMoveEffect(bestMove.to.row, bestMove.to.col);
        }
        
        // ENHANCED: Apply persistent AI move highlighting
        // This will automatically clear any previous AI highlights and set new ones
        this.uiController.highlightAIMove(
            bestMove.from.row,
            bestMove.from.col,
            bestMove.to.row,
            bestMove.to.col
        );
        
        // Handle pawn promotion effect
        if (moveResult.piece.type === 'pawn' && (bestMove.to.row === 0 || bestMove.to.row === 7)) {
            setTimeout(() => {
                this.triggerMoveEffect(bestMove.to.row, bestMove.to.col);
            }, 200);
        }
        
        console.log('AIPlayer: Move result handled with persistent highlighting until next AI move');
    }
    
    triggerMoveEffect(row, col) {
        if (window.particleEffects) {
            window.particleEffects.createMoveParticles(row, col);
        }
    }
    
    triggerCaptureEffect(row, col) {
        if (window.particleEffects) {
            window.particleEffects.createCaptureParticles(row, col);
        }
    }
    
    // Reset AI state for new game
    reset() {
        this.isThinking = false;
        // Keep difficulty setting through resets
        console.log('AIPlayer: Reset completed, difficulty preserved:', this.difficulty);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIPlayer;
}
