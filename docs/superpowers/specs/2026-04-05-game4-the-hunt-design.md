# Game 4: "The Hunt" — Design Spec

## Context

Fourth game for Project Atlas. Reuses existing games infrastructure (DB schema, API endpoints, component pattern). Scavenger hunt theme — each level sends teams to a different external website to solve a puzzle. Final answer is "KRATOS" (God of War), hinted at by 3 fragments: DAUGHTER (Calliope), HATRED (his rage), VENGEANCE (his quest). 50 bonus points.

## Design Summary

| Property | Value |
|----------|-------|
| **Name** | The Hunt |
| **Final Answer** | KRATOS |
| **Bonus Points** | 50 |
| **Levels** | 4 (3 puzzles + final answer) |
| **Theme** | Scavenger Hunt — external websites |

## Clue Fragment System

| Level | External Site | Answer | Fragment Revealed |
|-------|--------------|--------|-------------------|
| 1 | floor796.com | GUTS | **DAUGHTER** |
| 2 | Google Docs | RESIDENT EVIL REQUIEM | **HATRED** |
| 3 | Akinator | ERMAC | **VENGEANCE** |
| 4 | — | KRATOS | — |

Fragments: DAUGHTER — HATRED — VENGEANCE → Kratos (God of War)

---

## Level 1: The Floor

**Mechanic:** Teams open floor796.com (a massive animated pixel art scene) and follow a riddle poem to locate a specific character within the scene.

**External link:** https://floor796.com/ (opens in new tab)

**Riddle displayed in-game:**

> Find the character:
> It was a freezing day, winter and blizzard was hitting me
> Celebration of birthday they said,
> I did not mind the cold, I did not stay there for long,
> I was better underneath.
> Where I could see the gate to the multiverse.
> A more scientifically advanced place, it was no place for me, as well
> Though better than the cold.
> Two of them were looking at the gate, one was writing down something
> Looking out for the creature that was coming out from the gate.
> I exited and went outside, they were shooting the zombies.
> That was being observed by the man in a suit.
> I noticed him staring and glaring.
> Giggling and fixing his suit.
> Hanging man however, that was behind him is what caught my eyes
> With his little helper, he was striving to survive.
> Maybe that was what he had been doing all this time.

**Question:** "What is the answer?"

**Answer:** **"GUTS"** (case-insensitive, trimmed)

**Penalty:** Wrong answer = 5-minute cooldown

**On completion:** Reveals fragment **"DAUGHTER"** with Continue button.

---

## Level 2: The Document

**Mechanic:** Teams open a Google Doc and search through it to find the answer to a specific question.

**External link:** https://docs.google.com/document/d/17kMlYw3zOUp40Hb8EhZmTT5ySFrFODU6/edit?usp=sharing&ouid=116328290851788719389&rtpof=true&sd=true (opens in new tab)

**Question:** "What's Mr. Asylbi's Most favorite Recent game?"

**Answer:** **"RESIDENT EVIL REQUIEM"** (case-insensitive, trimmed)

**Penalty:** Wrong answer = 5-minute cooldown

**On completion:** Reveals fragment **"HATRED"** with Continue button.

---

## Level 3: The Oracle

**Mechanic:** Teams open Akinator and play through using a provided set of answer clues to identify a specific character.

**External link:** https://en.akinator.com/ (opens in new tab)

**Clues displayed in-game:**

> If you play this game and choose these answers, what character will you get?
>
> Not a real person, Male character, Wears shoes, From a game, Doesn't use guns, Doesn't wear a hat, Unknown if he has dark hair, Not from a horror game, Wears a mask, Probably from a mobile game, He's a ninja, Not connected with fire, Doesn't wear blue, Doesn't wear just black, Not linked with water, His username is not linked with Animals, Controls souls

**Question:** "What is the answer?"

**Answer:** **"ERMAC"** (case-insensitive, trimmed)

**Penalty:** Wrong answer = 5-minute cooldown

**On completion:** Reveals fragment **"VENGEANCE"** with Continue button.

---

## Level 4: Final Answer

**Display:** DAUGHTER — HATRED — VENGEANCE

**Question:** "What is the answer?"

**Answer:** **"KRATOS"** (case-insensitive, trimmed)

**Attempts:** 3 total. Permanent lockout after 3 failures. No cooldown between attempts.

**Win condition:** First team to submit "KRATOS" correctly wins **50 bonus points**. Game status changes to 'completed' globally.

**Polling:** 10-second interval to detect if another team wins.

---

## Technical Implementation

### Database
- No schema changes — reuse `games` and `game_attempts` tables
- Seed: `INSERT INTO games (name, answer, bonus_points) SELECT 'The Hunt', 'KRATOS', 50 WHERE NOT EXISTS (...)`

### API
- Reuse all existing endpoints
- Client-side cooldowns for Levels 1-3 (5-minute)
- Server-side lockout for Level 4 (existing `is_locked_out` + `final_answer_attempts`)

### New Component
- **File:** `components/games/hunt-game.tsx`
- Same pattern as previous game components
- Each level: external link button (opens new tab) + clue text + text input
- Continue buttons between levels (no auto-advance)

### Games Page Integration
- Add component mapping in `app/games/page.tsx`: `game.name === 'The Hunt'` -> `<HuntGame />`

### DB Seed
- Add to `scripts/init-db.sql`

---

## Verification

1. `npm run build` succeeds
2. Game appears on `/games` page
3. Level 1: floor796.com link works, "GUTS" accepted, "DAUGHTER" revealed
4. Level 2: Google Doc link works, "RESIDENT EVIL REQUIEM" accepted, "HATRED" revealed
5. Level 3: Akinator link works, "ERMAC" accepted, "VENGEANCE" revealed
6. Level 4: "KRATOS" accepted, 50 points awarded
7. 5-minute cooldowns on Levels 1-3
8. 3-attempt lockout on Level 4 (no cooldown)
9. Mobile responsive
10. Push to GitHub
