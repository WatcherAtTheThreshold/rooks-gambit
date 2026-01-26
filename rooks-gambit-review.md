# Rook's Gambit - Technical Patterns & Decisions

> Chess game with AI opponent, particle effects, and Chess960 support.

---

## Game Overview
- **Genre/Type:** Strategy / Board Game (Chess)
- **Core Mechanics:**
  - Turn-based chess gameplay (Player vs AI)
  - Three difficulty levels with distinct AI personalities
  - Chess960 (Fischer Random) variant support
  - Win condition: Checkmate opponent's king
  - Draw condition: Stalemate
- **Tech Stack:**
  - Vanilla JavaScript (ES6 classes, no framework)
  - CSS3 with animations and glassmorphism
  - No build tools (direct script loading)
  - No external libraries

## Architecture Patterns

### Module/File Structure
```
js/game-engine.js (650 lines) - Pure chess logic, no DOM
js/ui-controller.js (314 lines) - DOM rendering and highlights
js/ai-player.js (517 lines) - AI with difficulty-based evaluation
js/main.js (716 lines) - Orchestrator and event handling
js/particle-effects.js (215 lines) - Visual feedback particles
js/audio-manager.js (448 lines) - Music with fade transitions
css/chess.css (1393 lines) - Full styling with animations
```

### Separation of Concerns
| Module | Responsibility |
|--------|----------------|
| game-engine.js | Chess rules, move validation, game state (zero DOM) |
| ui-controller.js | Board rendering, highlights, move history display |
| ai-player.js | Move selection, evaluation, difficulty personalities |
| main.js | Module coordination, user input, game controls |
| particle-effects.js | Visual feedback (moves, captures, checkmate) |
| audio-manager.js | Background music, volume, fade transitions |

### State Management Pattern
- **Pattern used:** Distributed state with single orchestrator
- **How state flows:**
  - `main.js` coordinates all modules
  - `gameEngine` owns authoritative game state
  - `uiController` reads from `gameEngine` to render
  - `aiPlayer` queries `gameEngine` for valid moves
- **Key state variables:**
  - `board[8][8]` - piece positions
  - `currentPlayer` - 'white' or 'black'
  - `castlingRights` - per-color, per-side
  - `gameState.difficulty` - persists across games
  - `gameState.gameMode` - 'standard' or 'chess960'

## Design

### Core Game System
```javascript
// Class-based modules with dependency injection
class ChessGame { /* pure logic */ }
class UIController {
    constructor(gameEngine) { this.gameEngine = gameEngine; }
}
class AIPlayer {
    constructor(gameEngine, uiController) { /* uses both */ }
}

// Orchestrator creates and wires modules
gameEngine = new ChessGame();
uiController = new UIController(gameEngine);
aiPlayer = new AIPlayer(gameEngine, uiController);
```

**Key Design Decisions:**
- Pure game engine with no UI coupling - testable, reusable
- Single-listener event delegation for 64 board squares
- AI evaluation returns numeric scores for move comparison
- Difficulty settings modify AI behavior, not chess rules

### Data-Driven Elements
- **Piece values:** `{ pawn: 10, knight: 30, bishop: 30, rook: 50, queen: 90, king: 1000 }`
- **Difficulty configs:** Random move chance, missed captures, thinking time ranges
- **Chess960:** Scharnagl algorithm generates positions from ID 0-959
- **Piece-square tables:** Positional bonuses for pawns/knights by square

### UI/Game Phase Management
- Single-screen game (no routing)
- Game phases managed via state flags (`gameOver`, `currentPlayer`)
- Overlay system for checkmate/stalemate announcements
- Status bar updates reflect current game state
- Difficulty/mode changes show temporary feedback messages

## Sound

### Audio Architecture
- **Music system:** Single background track with loop
- **SFX system:** Placeholder methods ready (`playMoveSound`, `playCaptureSound`, etc.)
- **Transitions:** 2-second fade in/out with 20-step interpolation

### Audio Files/Formats
```
assets/sounds/mysticChess.mp3 - Background music (looped)
```

## Browser Compatibility

- **Target browsers:** Modern browsers (ES6 required)
- **Module loading:** Script tags in order (no bundler, no ES6 modules)
- **Responsive approach:** Media queries at 1200px, 768px, 480px breakpoints
- **Mobile considerations:**
  - Touch input works via click events
  - `user-scalable=no` viewport meta
  - Smaller board (45px squares on mobile)

---

## What Works Well
- **Pure game engine separation:** Can swap UI or test logic independently
- **Difficulty personality system:** Each level feels distinct, not just slower/faster
- **Event delegation:** Single click listener handles all 64 squares efficiently
- **Particle feedback:** Captures and checkmate feel impactful without being excessive
- **Chess960 integration:** Full Scharnagl algorithm, castling works correctly
- **State preservation:** Difficulty and mode persist across new games

## What We'd Do Differently
- **No undo for castling/en passant:** Current undo doesn't restore special move state
- **AI depth:** Single-ply evaluation limits tactical strength
- **Sound effects:** Placeholder methods but no actual SFX implemented
- **No FEN/PGN export:** Move history is display-only
- **Bundling:** Script tag ordering is fragile; modules would be cleaner

---

## Key Implementation Details

### Chess960 Position Generation
- **Approach:** Scharnagl algorithm - deterministic mapping from ID (0-959) to position
- **Why this way:** Standard algorithm, reproducible positions, covers all 960 arrangements
- **Gotchas/Lessons:**
  - Must store initial king/rook positions for castling validation
  - Castling destinations are always g1/c1, but starting positions vary
  - Path clearance check must span entire king-rook range

### AI Move Selection
- **Approach:** Single-ply evaluation with difficulty-based scoring
- **Why this way:** Fast enough for browser, personality differences are noticeable
- **Gotchas/Lessons:**
  - Random base score prevents perfectly predictable play
  - Thinking time creates illusion of deliberation
  - Must re-apply difficulty after new game (state can get lost)

### Particle Effects System
- **Approach:** Fixed-position divs with CSS animations, auto-removed via setTimeout
- **Why this way:** No canvas overhead, CSS handles animation smoothly
- **Gotchas/Lessons:**
  - Must clear particles on new game to prevent memory leak
  - Z-index layering critical for particles over board
  - getBoundingClientRect() for square-relative positioning

---

## Reusable Code Patterns

### Event Delegation for Grid
```javascript
boardElement.addEventListener('click', (e) => {
    const square = e.target.closest('.square');
    if (!square) return;
    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);
    handleSquareClick(row, col);
});
```

### Board Copy for Move Testing
```javascript
copyBoard() {
    return this.board.map(row =>
        row.map(piece => piece ? { ...piece } : null)
    );
}
```

### Fade Transition with Lock
```javascript
async fadeOut() {
    if (this.fadeTransitionActive) return;
    this.fadeTransitionActive = true;

    const steps = 20;
    const stepDuration = 100;
    const volumeStep = this.getVolume() / steps;

    for (let i = 0; i < steps; i++) {
        await new Promise(r => setTimeout(r, stepDuration));
        this.setVolume(Math.max(0, this.getVolume() - volumeStep));
    }

    this.audio.pause();
    this.fadeTransitionActive = false;
}
```

### Status Message with Auto-Restore
```javascript
function showTemporaryMessage(message, color, duration = 3000) {
    statusElement.textContent = message;
    statusElement.style.color = color;

    setTimeout(() => {
        uiController.updateGameStatus(); // restore normal status
        statusElement.style.color = '';
    }, duration);
}
```

### CSS Patterns
```css
/* Glassmorphism container */
.game-container {
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 20px;
}

/* Neon glow effect */
.chess-board {
    box-shadow:
        0 0 30px rgba(138, 43, 226, 0.8),
        0 0 60px rgba(138, 43, 226, 0.6),
        inset 0 0 30px rgba(138, 43, 226, 0.3);
}

/* Particle with glow */
.particle {
    background: radial-gradient(circle, #color 0%, transparent 70%);
    box-shadow: 0 0 10px #color, 0 0 20px #color;
}
```

---

## Performance Considerations

### What Mattered
- **Event delegation:** 1 listener vs 64 - noticeable on mobile
- **Particle cleanup:** Auto-remove prevents DOM bloat during long games
- **Board copy optimization:** Only copy when testing for check, not every validation

### What Didn't Matter
- **AI search depth:** Single-ply is fine for casual play; minimax would be overkill
- **Virtual DOM:** Direct DOM updates are fast enough for 64 squares
- **Web Workers:** AI thinking time is artificial anyway; no real computation bottleneck

---

## Development Workflow Notes

### Build Process
- No build step - open index.html directly
- Files must load in order (game-engine → ui-controller → ai-player → main)
- Local server recommended for audio (file:// has CORS issues)

### File Organization
```
rooks-gambit/
├── index.html
├── css/
│   └── chess.css
├── js/
│   ├── game-engine.js
│   ├── ui-controller.js
│   ├── ai-player.js
│   ├── main.js
│   ├── particle-effects.js
│   └── audio-manager.js
└── assets/
    └── sounds/
        └── mysticChess.mp3
```

### Debugging Tips
- `window.gameModules` exposes all module instances
- `gameModules.gameEngine().board` - inspect current position
- `gameModules.aiPlayer().difficulty` - check AI settings
- `getCurrentDifficulty()` / `getCurrentGameMode()` - global helpers
- Console shows all difficulty changes and AI decisions

---

## Quick Reference: Extending the Game

### Adding New Difficulty Levels
1. Add config to `difficultySettings` in ai-player.js
2. Add button in index.html with `data-difficulty="newlevel"`
3. Add color theme in chess.css (`.difficulty-btn[data-difficulty="newlevel"]`)
4. Add display info in `getDifficultyDisplayInfo()` in main.js

### Adding Sound Effects
1. Add audio file to assets/sounds/
2. Create Audio element or use Web Audio API in audio-manager.js
3. Implement the placeholder methods (`playMoveSound`, etc.)
4. Call from main.js after move execution

### Adding New Game Modes
1. Add mode to `gameState` in main.js
2. Add UI toggle following Chess960 pattern
3. Modify `initializeBoard()` in game-engine.js for new rules
4. Update any affected validation logic

---

## Reference: Previous Reviews

| Game | Genre | Key Patterns | Link |
|------|-------|--------------|------|
| Shadows of the Deck | Deck-builder | Declarative effects, Phase-based state, ES6 modules | [shadows-of-the-deck-review.md](shadows-of-the-deck-review.md) |
| Rook's Gambit | Chess | Pure logic separation, Difficulty personalities, Event delegation | (this file) |
