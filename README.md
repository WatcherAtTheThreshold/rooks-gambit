# Chess Game JavaScript Modules

This directory contains the modularized JavaScript files for the Rook's Gambit chess game. Each module has a specific responsibility and maintains clean separation of concerns.

## Module Overview

### `game-engine.js`
**Core game logic and rules**
- Contains the `ChessGame` class
- Handles all chess rules, move validation, and game state
- No DOM interactions - pure game logic
- **Public API:**
  - `ChessGame()` - Constructor
  - `isValidMove(fromRow, fromCol, toRow, toCol)` - Validates moves
  - `makeMove(fromRow, fromCol, toRow, toCol)` - Executes moves
  - `isInCheck(color)`, `isCheckmate(color)`, `isStalemate(color)` - Game state checks
  - `reset()` - Resets game to initial state

### `ui-controller.js`
**Board and UI rendering**
- Contains the `UIController` class
- Handles all DOM manipulations and visual updates
- Manages board rendering, highlighting, and status updates
- **Public API:**
  - `UIController(gameEngine)` - Constructor taking game engine reference
  - `updateDisplay()` - Refreshes visual board state
  - `highlightSquare(row, col, className)` - Adds visual highlights
  - `updateMoveHistory()` - Updates move history display
  - `showOverlay(text, className, duration)` - Shows game overlays

### `ai-player.js`
**AI move selection and strategy**
- Contains the `AIPlayer` class
- Implements basic AI logic with move evaluation
- Integrates with game engine and triggers UI animations
- **Public API:**
  - `AIPlayer(gameEngine, uiController)` - Constructor
  - `makeMove()` - Triggers AI move calculation and execution
  - `reset()` - Resets AI state

### `particle-effects.js`
**Visual feedback and animations**
- Contains the `ParticleEffects` class  
- Handles move sparkles, capture bursts, checkmate explosions
- Self-contained DOM manipulations for visual effects
- **Public API:**
  - `ParticleEffects()` - Constructor
  - `createMoveParticles(row, col)` - Creates move sparkle effect
  - `createCaptureParticles(row, col)` - Creates capture burst effect
  - `createCheckmateExplosion()` - Creates screen-wide explosion
  - `clearAllParticles()` - Removes all particle effects

### `audio-manager.js`
**Music and sound control**
- Contains the `AudioManager` class
- Manages music playback, volume control, and audio events
- Self-contained audio functionality
- **Public API:**
  - `AudioManager()` - Constructor
  - `toggleMusic()` - Plays/pauses background music
  - `setVolume(value)` - Sets audio volume (0-100)
  - `fadeIn(duration)`, `fadeOut(duration)` - Audio fading effects

### `main.js`
**Entry point and module coordinator**
- Initializes all modules and coordinates their interactions
- Handles game control functions (New Game, Undo, etc.)
- Sets up event listeners and manages game flow
- **Key Functions:**
  - `initializeGame()` - Initializes all modules
  - `newGame()` - Starts a new game
  - `undoMove()` - Undoes the last move pair
  - `showLastAIMove()` - Highlights the AI's previous move

## Module Dependencies

```
main.js (coordinator)
├── game-engine.js (pure logic)
├── ui-controller.js (depends on game-engine)
├── ai-player.js (depends on game-engine, ui-controller)
├── particle-effects.js (independent)
└── audio-manager.js (independent)
```

## Loading Order

The modules must be loaded in dependency order in the HTML:

```html
<script src="js/game-engine.js"></script>
<script src="js/ui-controller.js"></script>
<script src="js/ai-player.js"></script>
<script src="js/particle-effects.js"></script>
<script src="js/audio-manager.js"></script>
<script src="js/main.js"></script>
```

## Development Notes

- All modules use vanilla JavaScript (no external dependencies)
- Error handling is centralized in `main.js`
- Particle effects are made globally available via `window.particleEffects`
- Legacy `onclick` attributes have been replaced with proper event listeners
- Each module can be developed and tested independently
- Console logging is used for debugging and can be removed in production

## Future Enhancements

- Convert to ES6 modules using `import/export`
- Add comprehensive error handling class
- Implement EventBus pattern for loose coupling
- Add unit tests for each module
- Add TypeScript definitions
- Implement more sophisticated AI algorithms in `ai-player.js`
- Add sound effects to `audio-manager.js`
