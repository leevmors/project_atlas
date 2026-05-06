const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');

const scoreRoute = readFileSync('app/api/games/campus-survivor/score/route.ts', 'utf8');
const shopRoute = readFileSync('app/api/games/campus-survivor/shop/route.ts', 'utf8');
const gameHtml = readFileSync('public/games/campus-survivor/index.html', 'utf8');
const initSql = readFileSync('scripts/init-db.sql', 'utf8');

test('score route persists earned gold atomically and idempotently per client run', () => {
  assert.match(scoreRoute, /client_run_id/);
  assert.match(scoreRoute, /gold_earned/);
  assert.match(scoreRoute, /BEGIN/);
  assert.match(scoreRoute, /ON CONFLICT\s*\(team_id,\s*client_run_id\)\s*DO NOTHING/i);
  assert.match(scoreRoute, /campus_survivor_shop\.gold\s*\+\s*EXCLUDED\.gold/i);
  assert.match(scoreRoute, /shop_gold/);
  assert.match(scoreRoute, /duplicate/);
});

test('score route exposes additive before and after coin totals', () => {
  assert.match(scoreRoute, /previous_shop_gold/);
  assert.match(scoreRoute, /coins_saved:\s*!duplicate/);
  assert.match(scoreRoute, /gold_earned:\s*duplicate\s*\?\s*0\s*:\s*goldEarned/);
  assert.match(scoreRoute, /previousShopGold/);
});

test('score route has fallback coin crediting for unmigrated score tables', () => {
  assert.match(scoreRoute, /isMissingCampusScoreRunColumns/);
  assert.match(scoreRoute, /INSERT INTO campus_survivor_scores\s*\([^)]*team_id,\s*score,\s*kills,\s*time_survived,\s*level_reached[^)]*\)/i);
  assert.match(scoreRoute, /creditShopGold/);
});

test('campus survivor schema supports run gold and client-run idempotency', () => {
  assert.match(initSql, /gold_earned\s+integer\s+NOT NULL\s+DEFAULT\s+0/i);
  assert.match(initSql, /client_run_id\s+varchar\(80\)/i);
  assert.match(initSql, /UNIQUE INDEX IF NOT EXISTS campus_survivor_scores_team_client_run_idx/i);
});

test('game client submits earned gold through the score endpoint and syncs returned shop gold', () => {
  assert.match(gameHtml, /currentRunId\s*=/);
  assert.match(gameHtml, /gold_earned:\s*Math\.floor\(run\.gold_earned\s*\|\|\s*0\)/);
  assert.match(gameHtml, /client_run_id:\s*run\.client_run_id/);
  assert.match(gameHtml, /shop_gold/);
  assert.doesNotMatch(gameHtml, /globalGold\s*\+=\s*player\.gold;\s*[\r\n\s]*saveShopToServer\(\);/);
});

test('game client displays additive coin save result from server response', () => {
  assert.match(gameHtml, /Coins saved:/);
  assert.match(gameHtml, /previous_shop_gold/);
  assert.match(gameHtml, /gold_earned/);
  assert.match(gameHtml, /shop_gold/);
  assert.match(gameHtml, /Coins not saved/);
});

test('shop endpoint and client use explicit account credentials and return authoritative shop state', () => {
  assert.match(shopRoute, /RETURNING gold, stats/i);
  assert.match(shopRoute, /gold:\s*row\?\.gold/);
  assert.match(gameHtml, /credentials:\s*'include'/);
});

test('early game balance gives no-upgrade teams a 90-120 second ramp', () => {
  assert.match(gameHtml, /baseSpawnRate:\s*1000/);
  assert.match(gameHtml, /spawnRateDecay:\s*0\.985/);
  assert.match(gameHtml, /EARLY_RAMP_MS\s*=\s*90_000/);
  assert.match(gameHtml, /FULL_STRENGTH_MS\s*=\s*180_000/);
  assert.match(gameHtml, /EARLY_FULL_STRENGTH_MS\s*=\s*600_000/);
  assert.match(gameHtml, /EARLY_ONE_HIT_MS\s*=\s*60_000/);
  assert.match(gameHtml, /EARLY_ENEMY_HP_START_MULT\s*=\s*0\.28/);
  assert.match(gameHtml, /EARLY_ENEMY_HP_ONE_HIT_CAP\s*=\s*0\.31/);
  assert.match(gameHtml, /EARLY_ENEMY_THREAT_START_MULT\s*=\s*0\.55/);
  assert.match(gameHtml, /earlyEnemyHpMult/);
  assert.match(gameHtml, /earlyEnemyThreatMult/);
  assert.match(gameHtml, /if\s*\(gameTime\s*<\s*EARLY_RAMP_MS\)\s*{\s*type\s*=\s*0;\s*}/);
  // stat ramps now use the 10-minute horizon
  assert.match(gameHtml, /clamp\(gameTime\s*\/\s*EARLY_FULL_STRENGTH_MS,\s*0,\s*1\)/);
});

test('first basic mobs die within one starter whip hit during the opening window', () => {
  const startMult = Number(gameHtml.match(/EARLY_ENEMY_HP_START_MULT\s*=\s*([0-9.]+)/)?.[1]);
  const oneHitCap = Number(gameHtml.match(/EARLY_ENEMY_HP_ONE_HIT_CAP\s*=\s*([0-9.]+)/)?.[1]);
  const firstBasicBaseHp = 20 + (1 * 15);
  const starterWhipMinDamage = 8 + (1 * 3);

  assert.ok(firstBasicBaseHp * startMult <= starterWhipMinDamage);
  assert.ok(firstBasicBaseHp * oneHitCap <= starterWhipMinDamage);
  assert.match(gameHtml, /if\s*\(gameTime\s*<\s*EARLY_ONE_HIT_MS\s*&&\s*enemyType\s*===\s*0\s*&&\s*enemyLevel\s*===\s*1\)/);
  assert.match(gameHtml, /return\s+Math\.min\(ramped,\s*EARLY_ENEMY_HP_ONE_HIT_CAP\)/);
});

test('opening spawn density is busier but still ramps predictably', () => {
  assert.match(gameHtml, /baseSpawnRate:\s*1000/);
  assert.match(gameHtml, /EARLY_SPAWN_RATE_START_MULT\s*=\s*0\.60/);
  assert.match(gameHtml, /EARLY_BURST_CAP_MS\s*=\s*480_000/);
  assert.match(gameHtml, /function\s+earlySpawnRateMult\(\)/);
  assert.match(gameHtml, /CONFIG\.baseSpawnRate\s*\*\s*earlySpawnRateMult\(\)\s*\*\s*Math\.pow\(CONFIG\.spawnRateDecay/);
  assert.match(gameHtml, /function\s+getSpawnBurst\(\)/);
  assert.match(gameHtml, /if\s*\(gameTime\s*<\s*EARLY_BURST_CAP_MS\)\s*return\s*2/);
  assert.match(gameHtml, /if\s*\(gameTime\s*<\s*EARLY_FULL_STRENGTH_MS\)\s*return\s*3/);
  assert.doesNotMatch(gameHtml, /EARLY_BURST_STEP_MS/);
  assert.doesNotMatch(gameHtml, /if\s*\(gameTime\s*<\s*EARLY_BURST_STEP_MS\)\s*return\s*1/);
});

test('spawn distance uses close-spawn padding and not the far diagonal formula', () => {
  assert.match(gameHtml, /SPAWN_DISTANCE_PADDING\s*=\s*20/);
  assert.match(gameHtml, /Math\.max\(width,\s*height\)\s*\*\s*0\.45\s*\+\s*SPAWN_DISTANCE_PADDING/);
  assert.doesNotMatch(gameHtml, /Math\.sqrt\(\(width\/2\)\*\*2\s*\+\s*\(height\/2\)\*\*2\)\s*\+\s*50/);
});

test('enemy level is staged during first 10 minutes', () => {
  assert.match(gameHtml, /if\s*\(mins\s*<\s*3\)\s*\{\s*enemyLevel\s*=\s*1;\s*\}/);
  assert.match(gameHtml, /else\s+if\s*\(mins\s*<\s*6\)\s*\{\s*enemyLevel\s*=\s*2;\s*\}/);
  assert.match(gameHtml, /else\s+if\s*\(mins\s*<\s*10\)\s*\{\s*enemyLevel\s*=\s*3;\s*\}/);
  assert.doesNotMatch(gameHtml, /const\s+enemyLevel\s*=\s*1\s*\+\s*mins/);
});

test('initial XP is 10 and first 5 levels use the easier 1.30 multiplier', () => {
  assert.match(gameHtml, /this\.xpNeeded\s*=\s*10/);
  assert.match(gameHtml, /function\s+getNextXpNeeded\(current,\s*nextLevel\)/);
  assert.match(gameHtml, /if\s*\(nextLevel\s*<=\s*5\)\s*return\s*Math\.floor\(current\s*\*\s*1\.30\)/);
  assert.match(gameHtml, /if\s*\(nextLevel\s*<=\s*10\)\s*return\s*Math\.floor\(current\s*\*\s*1\.45\)/);
  assert.match(gameHtml, /return\s*Math\.floor\(current\s*\*\s*1\.60\)/);
  assert.match(gameHtml, /this\.xpNeeded\s*=\s*getNextXpNeeded\(this\.xpNeeded,\s*this\.level\)/);
  assert.doesNotMatch(gameHtml, /this\.xpNeeded\s*=\s*Math\.floor\(this\.xpNeeded\s*\*\s*1\.6\)/);
});

test('single flame aura skill replaces separate ground aoe skills', () => {
  assert.match(gameHtml, /flame:\s*\{[^}]*id:\s*'flame'[^}]*type:\s*'active'[^}]*name:\s*'Flame'/s);
  assert.doesNotMatch(gameHtml, /garlic:\s*\{[^}]*type:\s*'active'/s);
  assert.doesNotMatch(gameHtml, /flames:\s*\{[^}]*type:\s*'active'/s);
  assert.doesNotMatch(gameHtml, /sludge:\s*\{[^}]*type:\s*'active'/s);
  assert.doesNotMatch(gameHtml, /class\s+PersistentAoeField/);
  assert.doesNotMatch(gameHtml, /function\s+addPersistentAoeField\(/);

  assert.match(gameHtml, /class\s+FlameAuraEffect/);
  assert.match(gameHtml, /this\.timers\s*=\s*\{[^}]*flame:/s);
  assert.match(gameHtml, /this\.actives\.flame/);
  assert.match(gameHtml, /new\s+FlameAuraEffect\(\)/);
  assert.match(gameHtml, /const\s+baseDmg\s*=\s*1\s*\+\s*Math\.floor\(lvl\s*\/\s*4\)/);
  assert.match(gameHtml, /this\.x\s*=\s*player\.x;\s*this\.y\s*=\s*player\.y/);
  assert.match(gameHtml, /return\s+!!player\?\.actives\?\.flame/);
});

test('chest drop rate is flat (no ramp)', () => {
  assert.match(gameHtml, /CHEST_CHANCE_NORMAL\s*=\s*0\.005/);
  assert.match(gameHtml, /CHEST_CHANCE_ELITE\s*=\s*0\.025/);
  assert.doesNotMatch(gameHtml, /CHEST_RAMP_MS/);
  assert.doesNotMatch(gameHtml, /NORMAL_CHEST_START_CHANCE/);
  assert.doesNotMatch(gameHtml, /ELITE_CHEST_START_CHANCE/);
  assert.match(gameHtml, /function\s+getChestDropChance\(enemy\)/);
  assert.match(gameHtml, /return\s+isElite\s*\?\s*CHEST_CHANCE_ELITE\s*:\s*CHEST_CHANCE_NORMAL/);
  assert.match(gameHtml, /if\s*\(Math\.random\(\)\s*<\s*getChestDropChance\(this\)\)\s*items\.push\(new\s+Pickup\(this\.x,\s*this\.y,\s*'chest'\)\)/);
});
