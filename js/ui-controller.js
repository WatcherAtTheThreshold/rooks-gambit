// UI Controller - Board and UI rendering, interactions
// Handles all DOM manipulations and visual updates

class UIController {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.boardElement = document.getElementById('chessBoard');
        this.statusElement = document.getElementById('gameStatus');
        this.historyElement = document.getElementById('moveHistory');
        this.showLastMoveBtn = document.getElementById('showLastMoveBtn');
        
        // Track current AI move highlighting for smart persistence
        this.currentAIHighlight = {
            fromSquare: null,
            toSquare: null,
            active: false
        };
    }
    
    createBoard() {
        this.boardElement.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.row = row;
                square.dataset.col = col;
                this.boardElement.appendChild(square);
            }
        }
    }
    
    updateDisplay() {
        const squares = document.querySelectorAll('.square');
        squares.forEach(square => {
            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);
            const piece = this.gameEngine.board[row][col];
            
            square.innerHTML = '';
            
            // Preserve highlighting states, but be smart about AI highlights
            const wasAIFrom = square.classList.contains('ai-from');
            const wasAITo = square.classList.contains('ai-to');
            const wasSelected = square.classList.contains('selected');
            const wasValidMove = square.classList.contains('valid-move');
            const wasInCheck = square.classList.contains('check');
            
            // Reset base square styling
            square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
            
            // Only restore AI highlights if there's actually a current AI move to highlight
            // This prevents restoring highlights after they've been intentionally cleared (e.g., during undo)
            const shouldRestoreAIHighlights = this.gameEngine.lastAIMove && 
                                            this.currentAIHighlight.active &&
                                            ((wasAIFrom && row === this.gameEngine.lastAIMove.from.row && col === this.gameEngine.lastAIMove.from.col) ||
                                             (wasAITo && row === this.gameEngine.lastAIMove.to.row && col === this.gameEngine.lastAIMove.to.col));
            
            // Restore special highlighting states
            if (shouldRestoreAIHighlights && wasAIFrom) square.classList.add('ai-from');
            if (shouldRestoreAIHighlights && wasAITo) square.classList.add('ai-to');
            if (wasSelected) square.classList.add('selected');
            if (wasValidMove) square.classList.add('valid-move');
            if (wasInCheck) square.classList.add('check');
            
            if (piece) {
                const pieceElement = document.createElement('span');
                pieceElement.className = `piece ${piece.color}`;
                pieceElement.textContent = this.gameEngine.pieces[piece.color][piece.type];
                square.appendChild(pieceElement);
            }
        });
        
        this.updateGameStatus();
    }
    
    updateGameStatus() {
        if (this.gameEngine.gameOver) {
            if (this.gameEngine.isCheckmate(this.gameEngine.currentPlayer)) {
                this.statusElement.textContent = `Checkmate! ${this.gameEngine.currentPlayer === 'white' ? 'Black' : 'White'} wins!`;
                this.showOverlay('Checkmate', 'checkmate', 3000);
            } else if (this.gameEngine.isStalemate(this.gameEngine.currentPlayer)) {
                this.statusElement.textContent = 'Stalemate! Draw!';
                this.showOverlay('Stalemate', 'checkmate', 3000);
            }
        } else if (this.gameEngine.isInCheck(this.gameEngine.currentPlayer)) {
            this.statusElement.textContent = `${this.gameEngine.currentPlayer === 'white' ? 'White' : 'Black'} is in check!`;
            this.highlightKingInCheck();
            this.showOverlay('Check', 'check', 1800);
        } else {
            this.statusElement.textContent = `${this.gameEngine.currentPlayer === 'white' ? 'White' : 'Black'} to move`;
        }
    }
    
    highlightKingInCheck() {
        const kingPosition = this.gameEngine.findKing(this.gameEngine.currentPlayer);
        if (kingPosition) {
            const square = document.querySelector(`[data-row="${kingPosition.row}"][data-col="${kingPosition.col}"]`);
            square.classList.add('check');
        }
    }
    
    clearHighlights() {
        document.querySelectorAll('.square').forEach(sq => {
            sq.classList.remove('selected', 'valid-move', 'check');
            // NOTE: We deliberately don't clear 'ai-from' and 'ai-to' here
            // Those are managed separately by the AI highlighting system
        });
    }
    
    // Clear ONLY AI move highlights (for internal use)
    clearAIHighlights() {
        if (this.currentAIHighlight.active) {
            if (this.currentAIHighlight.fromSquare) {
                this.currentAIHighlight.fromSquare.classList.remove('ai-from');
            }
            if (this.currentAIHighlight.toSquare) {
                this.currentAIHighlight.toSquare.classList.remove('ai-to');
            }
            
            // Reset tracking
            this.currentAIHighlight = {
                fromSquare: null,
                toSquare: null,
                active: false
            };
            
            console.log('UIController: AI highlights cleared');
        }
    }
    
    highlightSquare(row, col, className) {
        const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (square) {
            square.classList.add(className);
        }
    }
    
    highlightValidMoves(row, col) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.gameEngine.isValidMove(row, col, r, c)) {
                    const square = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                    square.classList.add('valid-move');
                }
            }
        }
    }
    
    // ENHANCED: Smart AI move highlighting that persists until next AI move
    highlightAIMove(fromRow, fromCol, toRow, toCol) {
        console.log('UIController: Highlighting new AI move from', fromRow, fromCol, 'to', toRow, toCol);
        
        // Clear any existing AI highlights first
        this.clearAIHighlights();
        
        // Get the new squares to highlight
        const fromSquare = document.querySelector(`[data-row="${fromRow}"][data-col="${fromCol}"]`);
        const toSquare = document.querySelector(`[data-row="${toRow}"][data-col="${toCol}"]`);
        
        if (fromSquare && toSquare) {
            // Apply the new AI highlighting
            fromSquare.classList.add('ai-from');
            toSquare.classList.add('ai-to');
            
            // Track the current highlights for future clearing
            this.currentAIHighlight = {
                fromSquare: fromSquare,
                toSquare: toSquare,
                active: true
            };
            
            console.log('UIController: AI move highlighted persistently (will clear on next AI move)');
            
            // Optional: Add a subtle animation pulse on initial highlight
            fromSquare.style.animation = 'aiMoveHighlight 1s ease-out';
            toSquare.style.animation = 'aiMoveHighlight 1s ease-out';
            
            // Remove the animation after it completes to avoid interfering with CSS
            setTimeout(() => {
                if (fromSquare.style) fromSquare.style.animation = '';
                if (toSquare.style) toSquare.style.animation = '';
            }, 1000);
        } else {
            console.warn('UIController: Could not find squares for AI move highlighting');
        }
    }
    
    showLastAIMove() {
        if (!this.gameEngine.lastAIMove) {
            console.log('UIController: No last AI move to show');
            return;
        }
        
        console.log('UIController: Showing last AI move');
        
        // Re-highlight the last AI move (this will clear any existing highlights first)
        this.highlightAIMove(
            this.gameEngine.lastAIMove.from.row,
            this.gameEngine.lastAIMove.from.col,
            this.gameEngine.lastAIMove.to.row,
            this.gameEngine.lastAIMove.to.col
        );
        
        // Add a brief flash effect to draw attention
        if (this.currentAIHighlight.active) {
            const squares = [this.currentAIHighlight.fromSquare, this.currentAIHighlight.toSquare];
            squares.forEach(square => {
                if (square) {
                    square.style.transform = 'scale(1.1)';
                    square.style.transition = 'transform 0.3s ease';
                    
                    setTimeout(() => {
                        if (square.style) {
                            square.style.transform = '';
                            square.style.transition = '';
                        }
                    }, 600);
                }
            });
        }
    }
    
    updateMoveHistory() {
        if (this.gameEngine.moveHistory.length === 0) {
            this.historyElement.innerHTML = '<p><em>Move history will appear here...</em></p>';
            return;
        }
        
        let historyHTML = '<div style="font-family: \'Source Sans Pro\', sans-serif; line-height: 1.8; font-size: 0.9rem;">';
        
        for (let i = 0; i < this.gameEngine.moveHistory.length; i++) {
            const move = this.gameEngine.moveHistory[i];
            const moveNumber = Math.floor(i / 2) + 1;
            
            historyHTML += `<div style="margin-bottom: 0.5rem; padding: 0.3rem; background: rgba(255,255,255,0.05); border-radius: 4px; border-left: 3px solid ${move.player === 'white' ? 'rgba(222,184,135,0.6)' : 'rgba(138,43,226,0.6)'};">`;
            historyHTML += `<span style="color: rgba(255,255,255,0.5); font-weight: bold; margin-right: 0.5rem;">${moveNumber}.</span>`;
            historyHTML += `<span style="color: ${move.player === 'white' ? 'rgba(255,255,255,0.9)' : 'rgba(180,120,255,1)'};">${move.notation}</span>`;
            historyHTML += `</div>`;
        }
        
        historyHTML += '</div>';
        this.historyElement.innerHTML = historyHTML;
        
        // Auto-scroll to bottom
        this.historyElement.scrollTop = this.historyElement.scrollHeight;
    }
    
    // Game overlay functions
    showOverlay(text, className = '', duration = 3000) {
        const overlay = document.getElementById('gameOverlay');
        const overlayText = document.getElementById('overlayText');
        
        overlayText.textContent = text;
        overlayText.className = `overlay-text ${className}`;
        overlay.classList.add('show');
        
        if (duration > 0) {
            setTimeout(() => {
                overlay.classList.remove('show');
            }, duration);
        }
    }
    
    hideOverlay() {
        const overlay = document.getElementById('gameOverlay');
        overlay.classList.remove('show');
    }
    
    showBeginGameOverlay() {
        setTimeout(() => {
            this.showOverlay('Begin Game', 'begin', 2500);
        }, 500);
    }
    
    updateButtonStates() {
        // Enable/disable show last move button
        if (this.showLastMoveBtn) {
            this.showLastMoveBtn.disabled = !this.gameEngine.lastAIMove;
        }
    }
    
    showAIThinking(message = "AI is thinking...") {
        this.statusElement.textContent = message;
    }
    
    // Initialize the UI
    init() {
        this.createBoard();
        this.updateDisplay();
        this.updateMoveHistory();
        this.updateButtonStates();
        this.showBeginGameOverlay();
    }
    
    // ENHANCED: Reset UI for new game - includes clearing AI highlights
    reset() {
        this.hideOverlay();
        this.clearHighlights();
        this.clearAIHighlights(); // Important: Clear persistent AI highlights on new game
        this.updateDisplay();
        this.updateMoveHistory();
        this.updateButtonStates();
        this.showBeginGameOverlay();
        
        console.log('UIController: Full reset completed including AI highlights');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIController;
}