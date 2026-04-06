# Game 5: "The Final Piece" — Design Spec

## Context

Fifth game for Project Atlas. Reuses existing games infrastructure. Mystery/investigation theme mixing digital puzzles with real-world scavenger hunts (finding a document on a classroom PC, finding a poster at EOS in the university). Final answer is "ADOLF HITLER", hinted at by 3 fragments: MEINCRAFT (Mein Kampf reference), JUICE (propaganda term), MASSACRE (Holocaust reference). 100 bonus points.

## Design Summary

| Property | Value |
|----------|-------|
| **Name** | The Final Piece |
| **Final Answer** | ADOLF HITLER |
| **Bonus Points** | 100 |
| **Levels** | 4 (3 puzzles + final answer) |
| **Theme** | Mystery / Investigation |

## Clue Fragment System

| Level | Puzzle | Answer | Fragment Revealed |
|-------|--------|--------|-------------------|
| 1 | Piano audio (F-A-C-A-D-E) | FACADE | **MEINCRAFT** |
| 2 | Riddle → find document on classroom PC | BOMB | **JUICE 🧃** |
| 3 | Riddle → find poster at EOS | ATTACK | **MASSACRE** |
| 4 | Final answer | ADOLF HITLER | — |

Fragments: MEINCRAFT — JUICE 🧃 — MASSACRE → ADOLF HITLER

---

## Level 1: The Notes

**Mechanic:** An audio player plays a piano recording. The piano plays the notes F-A-C-A-D-E. Students must identify the notes and realize they spell a word.

**Audio:** `public/audio/piano.mp3` (copied from `Piano.mp3` in project root)

**Question:** "What is the answer?"

**Answer:** **"FACADE"** (case-insensitive, trimmed)

**Penalty:** Wrong answer = 5-minute cooldown

**On completion:** Reveals fragment **"MEINCRAFT"** with Continue button.

**UI Notes:**
- HTML5 audio player with play/pause button
- Dark slate theme consistent with other games
- No hints about what the audio contains

---

## Level 2: The Book

**Mechanic:** A text riddle is displayed. Students must decode the clues, find a physical document hidden on one of the classroom PCs, and determine the answer.

**Riddle displayed:**

> My favorite number is 7. Look into 7, Count from the left. There are, however, 17 of them here. Open the documents, search for my book. I forgot what I had written down. Remind me please.

**Question:** "What is the answer?"

**Answer:** **"BOMB"** (case-insensitive, trimmed)

**Penalty:** Wrong answer = 5-minute cooldown

**On completion:** Reveals fragment **"JUICE 🧃"** with Continue button.

---

## Level 3: The Poster

**Mechanic:** A text riddle is displayed. Students must go to EOS (a physical space in the university where event posters are displayed) and find a poster put up by "Roman" that contains the answer.

**Riddle displayed:**

> There's a new show coming up, I heard my friend "Roman" putting up a poster somewhere. I believe it's where the space is with strict rules.

**Question:** "What is the answer?"

**Answer:** **"ATTACK"** (case-insensitive, trimmed)

**Penalty:** Wrong answer = 5-minute cooldown

**On completion:** Reveals fragment **"MASSACRE"** with Continue button.

---

## Level 4: Final Answer

**Question:** "What is the answer?"

**Answer:** **"ADOLF HITLER"** (case-insensitive, trimmed)

**Attempts:** 3 total. Permanent lockout after 3 failures. No cooldown between attempts.

**Win condition:** First team to submit "ADOLF HITLER" correctly wins **100 bonus points**. Game status changes to 'completed' globally.

**Polling:** 10-second interval to detect if another team wins.

---

## Technical Implementation

### Assets
- Copy `Piano.mp3` from project root to `public/audio/piano.mp3`

### Database
- No schema changes — reuse `games` and `game_attempts` tables
- Seed: `INSERT INTO games (name, answer, bonus_points) SELECT 'The Final Piece', 'ADOLF HITLER', 100 WHERE NOT EXISTS (...)`

### API
- Reuse all existing endpoints
- Client-side cooldowns for Levels 1-3 (5-minute)
- Server-side lockout for Level 4 (existing `is_locked_out` + `final_answer_attempts`)

### New Component
- **File:** `components/games/final-piece-game.tsx`
- Same pattern as previous game components
- Level 1 uses HTML5 `<audio>` element for piano playback
- Levels 2-3 display riddle text + text input
- Continue buttons between levels (no auto-advance)

### Games Page Integration
- Add component mapping in `app/games/page.tsx`: `game.name === 'The Final Piece'` → `<FinalPieceGame />`

### DB Seed
- Add to `scripts/init-db.sql`

---

## Verification

1. `npm run build` succeeds
2. Game appears on `/games` page
3. Level 1: Audio plays, "FACADE" accepted, "MEINCRAFT" revealed
4. Level 2: Riddle displays, "BOMB" accepted, "JUICE 🧃" revealed
5. Level 3: Riddle displays, "ATTACK" accepted, "MASSACRE" revealed
6. Level 4: "ADOLF HITLER" accepted, 100 points awarded
7. 5-minute cooldowns on Levels 1-3
8. 3-attempt lockout on Level 4 (no cooldown)
9. Mobile responsive
10. Push to GitHub
