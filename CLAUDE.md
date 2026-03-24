# Rook's Gambit — Claude Code Guide

## What This Is

A fully playable chess game with AI opponent, supporting Standard Chess and Chess960 (Fischer Random). Three difficulty levels, particle effects, dynamic music. Vanilla JS with class-based architecture, no build step, hosted on GitHub Pages.

---

## Tech Stack

- Vanilla JavaScript (ES6 classes, no modules — script tag loading in dependency order)
- HTML/CSS (single page, glassmorphism + neon glow aesthetic)
- No framework, no build step, no external libraries
- Web Audio API for background music
- GitHub Pages hosting

---

## File Structure

```
rooks-gambit/
  index.html                    — entry point, loads scripts in order
  css/
    chess.css                   — single stylesheet (1392 lines)
  js/
    game-engine.js              — pure chess logic, zero DOM coupling (655 lines)
    ui-controller.js            — board rendering, highlighting, move history (313 lines)
    ai-player.js                — AI with difficulty personalities (517 lines)
    main.js                     — orchestrator, event binding, game flow (715 lines)
    particle-effects.js         — visual feedback (sparkles, bursts, explosions) (214 lines)
    audio-manager.js            — music playback, volume, fade transitions (447 lines)
  assets/
    images/
      mist-overlay.png          — atmospheric overlay
    sounds/
      mysticChess.mp3           — background music track
  README.md                     — module API documentation
  rooks-gambit-review.md        — technical patterns & design review
```

---

## Architecture

### Module Dependency Order (load order matters)
```
game-engine.js    → pure logic, no dependencies
ui-controller.js  → depends on gameEngine
ai-player.js      → depends on gameEngine + uiController
particle-effects.js → independent
audio-manager.js    → independent
main.js           → orchestrates all of the above
```

### Class-Based Design
- **ChessGame** (`game-engine.js`) — authoritative game state, move validation, check/checkmate/stalemate detection, castling, en passant. Zero DOM awareness.
- **UIController** (`ui-controller.js`) — board rendering, square highlighting, move history display. Reads from gameEngine.
- **AIPlayer** (`ai-player.js`) — difficulty-based move selection with weighted evaluation. Queries gameEngine for valid moves.
- **Main** (`main.js`) — event delegation, game control buttons, difficulty switching, coordinates all modules.
- **ParticleEffects** (`particle-effects.js`) — self-contained visual effects (move sparkles, capture bursts, checkmate explosions, ambient particles).
- **AudioManager** (`audio-manager.js`) — self-contained music control with fade transitions.

### Event Flow
- Single event listener on board via event delegation (1 listener for 64 squares)
- Click → square detection → move validation → gameEngine → uiController.updateDisplay()
- AI triggers after player turn with artificial thinking delay

### State
- `gameEngine` owns all authoritative state (board array, currentPlayer, castlingRights, enPassantTarget, moveHistory)
- UI reads from gameEngine to render — no separate UI state
- Data attributes on DOM elements (`data-row`, `data-col`, `data-difficulty`, `data-mode`)

---

## Game Modes

### Standard Chess
- Traditional 8x8 starting position
- Full rules: castling, en passant, pawn promotion

### Chess960 (Fischer Random)
- Scharnagl algorithm generates 960 possible starting positions
- Stores `initialPositions` per color for castling validation
- Castling destination squares are standard (king to g1/c1) regardless of starting position

---

## AI Difficulty System

| Aspect | Novice | Knight | Grandmaster |
|--------|--------|--------|-------------|
| Random moves | 25% | 5% | 0% |
| Miss captures | 15% | 2% | 0% |
| Think time | 500-1200ms | 800-2300ms | 1500-4000ms |
| Evaluation | Basic + high noise | Balanced + development | Tactical + positional |

Move evaluation is weighted scoring: piece captures, center control, development bonuses, pawn advancement, king safety. Difficulty adjusts noise level and which factors are considered.

---

## Move Validation Pipeline

1. `isValidMove()` — entry point, checks ownership and bounds
2. `isPieceMovementValid()` — piece-specific rules (pawn, rook, bishop, etc.)
3. `isPathClear()` — sliding piece obstruction checks
4. Temporary board copy → test if move leaves own king in check
5. Return `!wouldBeInCheck`

Castling has additional checks: rights flag, king not in check, path clear, no passing through check. Chess960-compatible with variable king/rook starting positions.

---

## Coding Conventions

- ES6 classes (not modules — loaded via script tags in order)
- Kebab-case filenames: `game-engine.js`, `ui-controller.js`
- BEM-inspired CSS: `.board-coordinates`, `.difficulty-btn`, `.move-particle`
- Semantic state classes: `.selected`, `.valid-move`, `.check`, `.ai-from`, `.ai-to`
- Board is an 8x8 array of strings (`'wp'` = white pawn, `'bk'` = black king, `null` = empty)

---

## Key Constraints

- Scripts must load in dependency order (game-engine → ui-controller → ai-player → main) — no ES6 module imports
- game-engine.js must remain DOM-free — all rendering goes through ui-controller.js
- Board state uses a copied array for move testing — never mutate the real board during validation
- Castling logic stores initial king/rook positions per color — any board setup changes must update these
- AI move stored as `gameEngine.lastAIMove` for the "Show Last Move" UI highlight
- Particle effects are absolute-positioned relative to the board container — board layout changes affect particle positioning
