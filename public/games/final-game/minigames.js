// =============================================================
// FINAL GAME — Phase 3 mini-games registry
// Each entry exports { title, desc, run(ctx) }.
// `ctx` is provided by index.html (buildGameCtx) and exposes:
//   ctx.stage, ctx.W (800), ctx.H (570)
//   ctx.setTimer(text), ctx.setScore(text)
//   ctx.interval(fn, ms), ctx.timeout(fn, ms), ctx.clearInterval/Timeout
//   ctx.loop(fn(dt))   — RAF loop (dt in seconds)
//   ctx.on(target, type, fn[, opts])   — auto-removed listener
//   ctx.el(tag, attrs, ...children)    — DOM helper
//   ctx.banner(text, kind)             — flash WIN/FAIL banner
//   ctx.win() / ctx.lose()             — call exactly once when over
// =============================================================
(function () {
    'use strict';

    // ---------------- shared helpers ----------------
    const rand = (a, b) => Math.random() * (b - a) + a;
    const randInt = (a, b) => Math.floor(rand(a, b + 1));
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
    const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));

    // shared mini audio context (independent of the main game's audio)
    let _ac = null;
    function ac() {
        try {
            if (!_ac) {
                const A = window.AudioContext || window.webkitAudioContext;
                if (!A) return null;
                _ac = new A();
            }
            if (_ac.state === 'suspended') _ac.resume();
            return _ac;
        } catch (e) { return null; }
    }
    function beep(freq = 440, dur = 0.08, type = 'square', vol = 0.05) {
        const a = ac(); if (!a) return;
        try {
            const o = a.createOscillator(), g = a.createGain();
            o.type = type; o.frequency.value = freq;
            g.gain.setValueAtTime(vol, a.currentTime);
            g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
            o.connect(g); g.connect(a.destination);
            o.start(); o.stop(a.currentTime + dur + 0.02);
        } catch (e) {}
    }
    const sfx = {
        hit:  () => beep(880, 0.05, 'square', 0.04),
        ok:   () => beep(660, 0.1,  'triangle', 0.05),
        bad:  () => beep(140, 0.18, 'sawtooth', 0.06),
        tick: () => beep(420, 0.04, 'square', 0.025),
        win:  () => { beep(660, 0.1); setTimeout(() => beep(880, 0.15), 110); },
        lose: () => { beep(220, 0.15, 'sawtooth'); setTimeout(() => beep(110, 0.3, 'sawtooth'), 160); },
    };

    // Make a canvas that fills the stage; return { c, g }.
    function mkCanvas(ctx, w, h) {
        w = w || ctx.W; h = h || ctx.H;
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.style.cssText = `display:block; width:${w}px; height:${h}px; image-rendering:pixelated;`;
        ctx.stage.appendChild(c);
        const g = c.getContext('2d');
        g.imageSmoothingEnabled = false;
        return { c, g };
    }

    // Countdown helper. Calls opts.onZero when it hits 0.
    function countdown(ctx, secs, label = 'TIME', onZero) {
        let t = secs;
        ctx.setTimer(`${label} ${t}`);
        const id = ctx.interval(() => {
            t--;
            ctx.setTimer(`${label} ${Math.max(0, t)}`);
            if (t <= 0) { ctx.clearInterval(id); if (onZero) onZero(); }
        }, 1000);
        return { add: (s) => { t += s; }, get: () => t, stop: () => ctx.clearInterval(id) };
    }

    // Centered text blob inside the stage.
    function makeCenter(ctx, html, opts = {}) {
        const div = document.createElement('div');
        div.innerHTML = html;
        Object.assign(div.style, {
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
            color: '#fff', fontFamily: 'VT323, monospace', fontSize: '28px',
            textAlign: 'center', padding: '20px', boxSizing: 'border-box',
        }, opts);
        ctx.stage.appendChild(div);
        return div;
    }

    // Pixel-art rounded button (used by many games for choice UI).
    function pxBtn(text, onclick) {
        const b = document.createElement('button');
        b.className = 'px-btn';
        b.textContent = text;
        b.onclick = onclick;
        return b;
    }

    // =============================================================
    // REGISTRY
    // =============================================================
    const M = {};

    // -------------------- REFLEX (10) --------------------

    // 1. Flappy Bird
    M.flappy_bird = {
        title: 'FLAPPY BIRD',
        desc: 'Score 20+ in 60 seconds. TAP / SPACE to flap.',
        run(ctx) {
            const { c, g } = mkCanvas(ctx);
            let by = 200, vy = 0, gravity = 900, jump = -340;
            const pipes = []; let spawnT = 0; let score = 0;
            let dead = false;
            const cd = countdown(ctx, 60, 'TIME', () => { if (!dead) finish(); });
            ctx.setScore(`SCORE 0`);
            function flap() { if (!dead) { vy = jump; sfx.tick(); } }
            ctx.on(ctx.stage, 'pointerdown', flap);
            ctx.on(window, 'keydown', (e) => { if (e.code === 'Space') flap(); });
            function spawnPipe() {
                const gap = 160; const top = randInt(60, ctx.H - gap - 60);
                pipes.push({ x: ctx.W + 20, top, w: 70 });
            }
            function finish() {
                dead = true;
                cd.stop();
                ctx.timeout(() => { score >= 20 ? ctx.win() : ctx.lose(); }, 400);
            }
            ctx.loop((dt) => {
                if (dead) return;
                vy += gravity * dt; by += vy * dt;
                spawnT -= dt; if (spawnT <= 0) { spawnPipe(); spawnT = 1.4; }
                // move pipes
                for (const p of pipes) p.x -= 220 * dt;
                while (pipes.length && pipes[0].x + pipes[0].w < 0) { pipes.shift(); score++; ctx.setScore(`SCORE ${score}`); sfx.hit(); }
                // collide
                if (by < 0 || by > ctx.H - 20) { sfx.lose(); finish(); }
                for (const p of pipes) {
                    if (180 + 20 > p.x && 180 < p.x + p.w && (by < p.top || by + 20 > p.top + 160)) { sfx.lose(); finish(); break; }
                }
                // draw
                g.fillStyle = '#0a1424'; g.fillRect(0, 0, ctx.W, ctx.H);
                // pixel ground
                g.fillStyle = '#2a3320'; g.fillRect(0, ctx.H - 20, ctx.W, 20);
                // pipes (chunky pixel)
                for (const p of pipes) {
                    g.fillStyle = '#3aa84a'; g.fillRect(p.x, 0, p.w, p.top);
                    g.fillRect(p.x, p.top + 160, p.w, ctx.H - p.top - 160);
                    g.fillStyle = '#2a7a36';
                    g.fillRect(p.x, p.top - 18, p.w, 18); g.fillRect(p.x, p.top + 160, p.w, 18);
                }
                // bird (pixel block)
                g.fillStyle = '#ffcc33'; g.fillRect(180, by, 20, 20);
                g.fillStyle = '#000'; g.fillRect(192, by + 4, 4, 4);
                g.fillStyle = '#cc7700'; g.fillRect(200, by + 8, 4, 4);
            });
        }
    };

    // 2. Piano Tiles
    M.piano_tiles = {
        title: 'PIANO TILES',
        desc: 'Tap black tiles only. Survive 45 seconds.',
        run(ctx) {
            const cols = 4; const colW = 800 / cols; const tileH = 110;
            const tiles = []; // {x, y, col, hit}
            let speed = 160; let t = 0; let lastSpawnRow = -1;
            let dead = false;
            const cd = countdown(ctx, 45, 'TIME', () => { if (!dead) { dead = true; ctx.timeout(() => ctx.win(), 200); } });
            const { c, g } = mkCanvas(ctx);
            for (let i = 0; i < 4; i++) tiles.push({ y: -tileH * (i+1), col: randInt(0, cols-1), hit: false });
            ctx.on(c, 'pointerdown', (e) => {
                if (dead) return;
                const r = c.getBoundingClientRect();
                const cx = (e.clientX - r.left) * (c.width / r.width);
                const cy = (e.clientY - r.top) * (c.height / r.height);
                // find lowest unhit tile in that column intersecting cy
                for (let i = tiles.length - 1; i >= 0; i--) {
                    const tt = tiles[i];
                    if (tt.col !== Math.floor(cx / colW) || tt.hit) continue;
                    if (cy >= tt.y && cy <= tt.y + tileH) { tt.hit = true; sfx.hit(); return; }
                }
                // tapped a blank space → fail
                sfx.lose(); dead = true; ctx.timeout(() => ctx.lose(), 300);
            });
            ctx.loop((dt) => {
                if (dead) return;
                t += dt; speed = 160 + t * 5;
                for (const tt of tiles) tt.y += speed * dt;
                // spawn new at top
                while (tiles[tiles.length - 1].y > -tileH * 0.2) {
                    tiles.push({ y: tiles[tiles.length - 1].y - tileH, col: randInt(0, cols-1), hit: false });
                }
                // any unhit tile that fully exits the bottom = fail
                for (const tt of tiles) {
                    if (!tt.hit && tt.y > ctx.H) { sfx.lose(); dead = true; ctx.timeout(() => ctx.lose(), 300); break; }
                }
                while (tiles.length && tiles[0].y > ctx.H + tileH) tiles.shift();
                // draw
                g.fillStyle = '#f4f0e6'; g.fillRect(0, 0, ctx.W, ctx.H);
                g.strokeStyle = '#bbb'; g.lineWidth = 2;
                for (let i = 1; i < cols; i++) { g.beginPath(); g.moveTo(i * colW, 0); g.lineTo(i * colW, ctx.H); g.stroke(); }
                for (const tt of tiles) {
                    g.fillStyle = tt.hit ? '#666' : '#111';
                    g.fillRect(tt.col * colW + 4, tt.y, colW - 8, tileH - 4);
                }
                ctx.setScore(`SPD ${Math.round(speed)}`);
            });
        }
    };

    // 3. Whack-a-Mole with color rules
    M.whack_color = {
        title: 'COLOR WHACK',
        desc: '60s. Hit only the AI-called color. Rules shift every 10s.',
        run(ctx) {
            const colors = [
                { id: 'r', hex: '#e23a3a', name: 'RED' },
                { id: 'b', hex: '#3a72e2', name: 'BLUE' },
                { id: 'g', hex: '#3ae26a', name: 'GREEN' },
                { id: 'y', hex: '#e2c83a', name: 'YELLOW' },
            ];
            let target = pick(colors);
            let score = 0; let need = 12;
            const callout = ctx.el('div', { style: { position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: '32px', fontFamily: 'VT323, monospace', letterSpacing: '4px' }, text: `HIT ${target.name}` });
            ctx.stage.appendChild(callout);
            ctx.setScore(`HITS 0/${need}`);
            const grid = ctx.el('div', { style: { position: 'absolute', inset: '90px 80px 30px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gridTemplateRows: 'repeat(3,1fr)', gap: '12px' } });
            const cells = []; for (let i = 0; i < 12; i++) { const cell = ctx.el('div', { style: { background: '#1a1408', border: '3px solid #2a1f10', position: 'relative' } }); cells.push(cell); grid.appendChild(cell); }
            ctx.stage.appendChild(grid);
            let mole = null;
            function clearMole() { if (mole) mole.remove(); mole = null; }
            function spawn() {
                clearMole();
                const cell = pick(cells); const col = pick(colors);
                mole = ctx.el('button', { style: { position: 'absolute', inset: '12%', background: col.hex, border: '4px solid rgba(0,0,0,0.4)', cursor: 'pointer' }, onclick: () => {
                    if (mole.dataset.hit) return; mole.dataset.hit = '1';
                    if (col.id === target.id) { score++; sfx.hit(); ctx.setScore(`HITS ${score}/${need}`); if (score >= need) { ctx.win(); return; } }
                    else { score = Math.max(0, score - 1); sfx.bad(); ctx.setScore(`HITS ${score}/${need}`); }
                    clearMole();
                } });
                cell.appendChild(mole);
            }
            spawn();
            ctx.interval(spawn, 700);
            ctx.interval(() => { target = pick(colors); callout.textContent = `HIT ${target.name}`; callout.style.color = target.hex; }, 10000);
            countdown(ctx, 60, 'TIME', () => { score >= need ? ctx.win() : ctx.lose(); });
        }
    };

    // 4. Fruit Ninja
    M.fruit_ninja = {
        title: 'FRUIT NINJA',
        desc: 'Slice 30 fruits in 45s. Avoid bombs.',
        run(ctx) {
            const { c, g } = mkCanvas(ctx);
            const items = []; // {x,y,vx,vy,kind,r,sliced}
            let score = 0; let need = 30; let dead = false;
            ctx.setScore(`SLICED 0/${need}`);
            let lastP = null;
            ctx.on(c, 'pointermove', (e) => {
                const r = c.getBoundingClientRect();
                const x = (e.clientX - r.left) * (c.width / r.width);
                const y = (e.clientY - r.top) * (c.height / r.height);
                if (lastP) {
                    for (const it of items) {
                        if (it.sliced) continue;
                        const dx = it.x - x, dy = it.y - y;
                        if (Math.hypot(dx, dy) < it.r + 6) {
                            it.sliced = true;
                            if (it.kind === 'bomb') { sfx.lose(); dead = true; ctx.timeout(() => ctx.lose(), 400); return; }
                            score++; sfx.hit(); ctx.setScore(`SLICED ${score}/${need}`);
                            if (score >= need) { dead = true; ctx.timeout(() => ctx.win(), 200); return; }
                        }
                    }
                }
                lastP = { x, y };
            });
            ctx.on(c, 'pointerup', () => { lastP = null; });
            function spawn() {
                if (dead) return;
                const isBomb = Math.random() < 0.12;
                items.push({ x: rand(80, ctx.W - 80), y: ctx.H + 30, vx: rand(-90, 90), vy: rand(-680, -540), kind: isBomb ? 'bomb' : pick(['apple','watermelon','lime','orange']), r: 28, sliced: false });
            }
            ctx.interval(spawn, 700);
            countdown(ctx, 45, 'TIME', () => { if (!dead) { dead = true; ctx.timeout(() => score >= need ? ctx.win() : ctx.lose(), 200); } });
            ctx.loop((dt) => {
                if (dead) return;
                for (const it of items) { it.vy += 980 * dt; it.x += it.vx * dt; it.y += it.vy * dt; }
                while (items.length && items[0].y > ctx.H + 60) items.shift();
                g.fillStyle = '#1c0a18'; g.fillRect(0, 0, ctx.W, ctx.H);
                for (const it of items) {
                    if (it.kind === 'bomb') { g.fillStyle = '#222'; g.fillRect(it.x - it.r, it.y - it.r, it.r*2, it.r*2); g.fillStyle = '#ff3a3a'; g.fillRect(it.x - 6, it.y - it.r - 8, 12, 8); }
                    else { const col = { apple: '#e23a3a', watermelon: '#3ae26a', lime: '#bff03a', orange: '#ff9933' }[it.kind] || '#fff'; g.fillStyle = it.sliced ? '#888' : col; g.fillRect(it.x - it.r, it.y - it.r, it.r * 2, it.r * 2); }
                }
            });
        }
    };

    // 5. Mole Rush — fast tap (replaces old reflex_tap)
    M.mole_rush = {
        title: 'MOLE RUSH',
        desc: 'Smash 25 moles in 20 seconds.',
        run(ctx) {
            let score = 0;
            ctx.setScore(`SCORE 0/25`);
            const grid = ctx.el('div', { style: { position: 'absolute', inset: '40px 100px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gridTemplateRows: 'repeat(3,1fr)', gap: '12px' } });
            const cells = []; for (let i = 0; i < 9; i++) { const cell = ctx.el('div', { style: { background: '#1a1408', border: '4px solid #2a1f10', position: 'relative' } }); cells.push(cell); grid.appendChild(cell); }
            ctx.stage.appendChild(grid);
            let activeIdx = -1, mole = null;
            function spawn() {
                if (mole) { mole.remove(); mole = null; }
                let i; do { i = randInt(0, 8); } while (i === activeIdx);
                activeIdx = i;
                mole = ctx.el('button', { style: { position: 'absolute', inset: '15%', background: '#8b3a1f', border: '4px solid #c95a2f', cursor: 'pointer' }, onclick: () => {
                    if (mole.dataset.hit) return; mole.dataset.hit = '1';
                    score++; sfx.hit(); ctx.setScore(`SCORE ${score}/25`);
                    if (score >= 25) { ctx.win(); return; }
                    if (mole) mole.remove(); mole = null;
                } });
                cells[i].appendChild(mole);
            }
            spawn();
            const spawner = ctx.interval(spawn, 420);
            countdown(ctx, 20, 'TIME', () => { ctx.clearInterval(spawner); score >= 25 ? ctx.win() : ctx.lose(); });
        }
    };

    // 6. Falling Blocks — survive 45s, blocks must not stack to ceiling
    M.falling_blocks = {
        title: 'FALLING BLOCKS',
        desc: 'Tap blocks before they stack to the top. Survive 45 seconds.',
        run(ctx) {
            const { c, g } = mkCanvas(ctx);
            const cols = 8; const colW = ctx.W / cols; const ceil = 30;
            const stacks = new Array(cols).fill(0); // pixel height stacked per col
            const falling = []; // {col, y, h}
            let dead = false; let speed = 90;
            ctx.setScore(`STACK 0`);
            ctx.on(c, 'pointerdown', (e) => {
                if (dead) return;
                const r = c.getBoundingClientRect();
                const x = (e.clientX - r.left) * (c.width / r.width);
                const y = (e.clientY - r.top) * (c.height / r.height);
                for (let i = falling.length - 1; i >= 0; i--) {
                    const b = falling[i];
                    if (x >= b.col * colW && x <= (b.col + 1) * colW && y >= b.y && y <= b.y + b.h) {
                        falling.splice(i, 1); sfx.hit(); return;
                    }
                }
            });
            countdown(ctx, 45, 'TIME', () => { if (!dead) ctx.win(); });
            ctx.interval(() => { if (!dead) falling.push({ col: randInt(0, cols-1), y: -40, h: 36 }); }, 600);
            ctx.loop((dt) => {
                if (dead) return;
                speed += dt * 4;
                for (const b of falling) b.y += speed * dt;
                // landing
                for (let i = falling.length - 1; i >= 0; i--) {
                    const b = falling[i];
                    const top = ctx.H - stacks[b.col];
                    if (b.y + b.h >= top) { stacks[b.col] += b.h; falling.splice(i, 1); }
                }
                const max = Math.max(...stacks);
                ctx.setScore(`STACK ${max}`);
                if (max >= ctx.H - ceil) { dead = true; sfx.lose(); ctx.timeout(() => ctx.lose(), 400); return; }
                // draw
                g.fillStyle = '#0a0a0a'; g.fillRect(0, 0, ctx.W, ctx.H);
                g.fillStyle = '#3a3a3a'; g.fillRect(0, ceil, ctx.W, 4);
                for (let i = 0; i < cols; i++) {
                    g.fillStyle = '#5a3a8a'; g.fillRect(i * colW + 4, ctx.H - stacks[i], colW - 8, stacks[i]);
                }
                for (const b of falling) {
                    g.fillStyle = '#e2c83a'; g.fillRect(b.col * colW + 6, b.y, colW - 12, b.h);
                }
            });
        }
    };

    // 7. Bug Smash — 20 bugs cross L→R, smash before any escape
    M.bug_smash = {
        title: 'BUG SMASH',
        desc: 'Smash all 20 bugs before any reach the right side.',
        run(ctx) {
            const { c, g } = mkCanvas(ctx);
            const bugs = []; let spawned = 0; let killed = 0; const total = 20; let dead = false;
            ctx.setScore(`SMASHED 0/${total}`);
            ctx.on(c, 'pointerdown', (e) => {
                if (dead) return;
                const r = c.getBoundingClientRect();
                const x = (e.clientX - r.left) * (c.width / r.width);
                const y = (e.clientY - r.top) * (c.height / r.height);
                for (let i = bugs.length - 1; i >= 0; i--) {
                    const b = bugs[i];
                    if (Math.abs(x - b.x) < 22 && Math.abs(y - b.y) < 22) {
                        bugs.splice(i, 1); killed++; sfx.hit(); ctx.setScore(`SMASHED ${killed}/${total}`);
                        if (killed >= total) { dead = true; ctx.timeout(() => ctx.win(), 200); }
                        return;
                    }
                }
            });
            const sp = ctx.interval(() => {
                if (spawned >= total) { ctx.clearInterval(sp); return; }
                bugs.push({ x: -30, y: rand(40, ctx.H - 40), v: rand(50, 110), wig: 0 });
                spawned++;
            }, 700);
            ctx.loop((dt) => {
                if (dead) return;
                for (const b of bugs) { b.x += b.v * dt; b.wig += dt * 8; }
                if (bugs.some(b => b.x > ctx.W)) { dead = true; sfx.lose(); ctx.timeout(() => ctx.lose(), 300); return; }
                if (spawned >= total && bugs.length === 0) { dead = true; ctx.timeout(() => ctx.win(), 200); return; }
                g.fillStyle = '#0a1208'; g.fillRect(0, 0, ctx.W, ctx.H);
                for (const b of bugs) {
                    const sy = b.y + Math.sin(b.wig) * 3;
                    g.fillStyle = '#222'; g.fillRect(b.x - 16, sy - 10, 32, 20);
                    g.fillStyle = '#8b3a1f'; g.fillRect(b.x - 12, sy - 6, 24, 12);
                    g.fillStyle = '#ff3a3a'; g.fillRect(b.x - 10, sy - 4, 4, 4); g.fillRect(b.x + 6, sy - 4, 4, 4);
                }
                g.fillStyle = '#5a1010'; g.fillRect(ctx.W - 6, 0, 6, ctx.H);
            });
        }
    };

    // 8. Balloon Pop
    M.balloon_pop = {
        title: 'BALLOON POP',
        desc: 'Pop all 20 balloons before any escape the top.',
        run(ctx) {
            const { c, g } = mkCanvas(ctx);
            const balloons = []; let spawned = 0; let popped = 0; const total = 20; let dead = false;
            ctx.setScore(`POPPED 0/${total}`);
            ctx.on(c, 'pointerdown', (e) => {
                if (dead) return;
                const r = c.getBoundingClientRect();
                const x = (e.clientX - r.left) * (c.width / r.width);
                const y = (e.clientY - r.top) * (c.height / r.height);
                for (let i = balloons.length - 1; i >= 0; i--) {
                    const b = balloons[i];
                    if (Math.abs(x - b.x) < 30 && Math.abs(y - b.y) < 36) {
                        balloons.splice(i, 1); popped++; sfx.hit(); ctx.setScore(`POPPED ${popped}/${total}`);
                        if (popped >= total) { dead = true; ctx.timeout(() => ctx.win(), 200); }
                        return;
                    }
                }
            });
            let interval = 900;
            const sp = ctx.interval(() => {
                if (spawned >= total) { ctx.clearInterval(sp); return; }
                balloons.push({ x: rand(60, ctx.W - 60), y: ctx.H + 40, v: rand(60, 110) + spawned * 4, color: pick(['#e23a3a','#3a72e2','#3ae26a','#e2c83a','#cc3aee']) });
                spawned++;
            }, interval);
            ctx.loop((dt) => {
                if (dead) return;
                for (const b of balloons) b.y -= b.v * dt;
                if (balloons.some(b => b.y < -40)) { dead = true; sfx.lose(); ctx.timeout(() => ctx.lose(), 300); return; }
                if (spawned >= total && balloons.length === 0) { dead = true; ctx.timeout(() => ctx.win(), 200); return; }
                g.fillStyle = '#0a1424'; g.fillRect(0, 0, ctx.W, ctx.H);
                for (const b of balloons) {
                    g.fillStyle = b.color; g.fillRect(b.x - 22, b.y - 28, 44, 44);
                    g.fillStyle = '#fff'; g.fillRect(b.x - 14, b.y - 22, 6, 6);
                    g.fillStyle = '#888'; g.fillRect(b.x - 1, b.y + 16, 2, 30);
                }
            });
        }
    };

    // 9. Tap the Number
    M.tap_number = {
        title: 'TAP THE NUMBER',
        desc: 'Tap numbers 1 to 20 in order, as fast as you can.',
        run(ctx) {
            const N = 20;
            const positions = [];
            // Place non-overlapping
            for (let i = 1; i <= N; i++) {
                let p, ok = false, tries = 0;
                while (!ok && tries < 200) {
                    p = { x: rand(40, ctx.W - 40), y: rand(40, ctx.H - 40) };
                    ok = positions.every(q => Math.hypot(p.x - q.x, p.y - q.y) > 70);
                    tries++;
                }
                positions.push(p);
            }
            let next = 1;
            ctx.setScore(`NEXT ${next}`);
            const btns = [];
            for (let i = 0; i < N; i++) {
                const n = i + 1;
                const b = ctx.el('button', { style: { position: 'absolute', left: (positions[i].x - 28) + 'px', top: (positions[i].y - 28) + 'px', width: '56px', height: '56px', background: '#1a1a1a', border: '3px solid #555', color: '#fff', fontFamily: 'VT323, monospace', fontSize: '28px', cursor: 'pointer' }, text: String(n), onclick: () => {
                    if (n === next) {
                        b.style.background = '#3ae26a'; b.style.borderColor = '#3ae26a'; b.disabled = true; sfx.hit();
                        next++; ctx.setScore(next > N ? 'DONE' : `NEXT ${next}`);
                        if (next > N) ctx.win();
                    } else {
                        sfx.bad(); b.style.background = '#5a1010';
                        ctx.timeout(() => { b.style.background = '#1a1a1a'; }, 200);
                    }
                } });
                btns.push(b); ctx.stage.appendChild(b);
            }
            countdown(ctx, 30, 'TIME', () => ctx.lose());
        }
    };

    // 10. Red Light / Green Light
    M.red_green = {
        title: 'RED / GREEN LIGHT',
        desc: 'HOLD the screen on GREEN, RELEASE on RED. Survive 10 rounds.',
        run(ctx) {
            let round = 0; const total = 10; let phase = 'WAIT'; // WAIT | GREEN | RED | DONE
            let holding = false; let dead = false;
            const light = ctx.el('div', { style: { position: 'absolute', top: '60px', left: '50%', transform: 'translateX(-50%)', width: '180px', height: '180px', borderRadius: '90px', background: '#222', border: '8px solid #444' } });
            const msg = ctx.el('div', { style: { position: 'absolute', top: '270px', width: '100%', textAlign: 'center', color: '#fff', fontFamily: 'VT323, monospace', fontSize: '40px', letterSpacing: '4px' }, text: 'GET READY' });
            const pad = ctx.el('div', { style: { position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', width: '300px', height: '120px', background: '#1a1a1a', border: '4px solid #555', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontFamily: 'VT323, monospace', fontSize: '28px', cursor: 'pointer', userSelect: 'none', touchAction: 'none' }, text: 'HOLD' });
            ctx.stage.appendChild(light); ctx.stage.appendChild(msg); ctx.stage.appendChild(pad);
            ctx.setScore(`ROUND 0/${total}`);
            ctx.on(pad, 'pointerdown', () => { holding = true; pad.style.background = '#2a2a2a'; check(); });
            ctx.on(pad, 'pointerup', () => { holding = false; pad.style.background = '#1a1a1a'; check(); });
            ctx.on(pad, 'pointerleave', () => { holding = false; pad.style.background = '#1a1a1a'; check(); });
            function check() {
                if (dead) return;
                if (phase === 'GREEN' && !holding) { fail('LET GO ON GREEN'); return; }
                if (phase === 'RED' && holding) { fail('HELD ON RED'); return; }
            }
            function fail(reason) { dead = true; phase = 'DONE'; light.style.background = '#5a1010'; msg.textContent = reason; sfx.lose(); ctx.timeout(() => ctx.lose(), 700); }
            function nextRound() {
                if (dead) return;
                if (round >= total) { ctx.win(); return; }
                round++; ctx.setScore(`ROUND ${round}/${total}`);
                phase = 'GREEN'; light.style.background = '#3ae26a'; msg.textContent = 'GO!'; sfx.ok();
                ctx.timeout(() => {
                    if (dead) return;
                    if (!holding) { fail('LET GO ON GREEN'); return; }
                    phase = 'RED'; light.style.background = '#e23a3a'; msg.textContent = 'STOP!'; sfx.bad();
                    ctx.timeout(() => {
                        if (dead) return;
                        if (holding) { fail('HELD ON RED'); return; }
                        phase = 'WAIT'; light.style.background = '#222'; msg.textContent = 'WAIT...';
                        ctx.timeout(nextRound, rand(400, 900));
                    }, rand(900, 1600));
                }, rand(900, 2200));
            }
            ctx.timeout(nextRound, 1000);
        }
    };

    // -------------------- AIM / POWER (10) --------------------

    // 11. Basketball — angle slider + power meter, 5/10
    M.basketball = {
        title: 'BASKETBALL',
        desc: 'Adjust angle and power. Score 5 of 10 shots.',
        run(ctx) {
            const { c, g } = mkCanvas(ctx);
            let shots = 0, scored = 0; const total = 10, need = 5;
            const HOOP = { x: 700, y: 240, w: 60, h: 8 };
            let angle = 50, power = 600;
            let ball = null;
            ctx.setScore(`HITS 0/${need}`);
            const ui = ctx.el('div', { style: { position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(0,0,0,0.5)', padding: '8px 14px', borderRadius: '4px', color: '#fff', fontFamily: 'VT323, monospace', fontSize: '20px' }, html: `ANGLE <input id="ang" type="range" min="20" max="80" value="50" style="width:140px"> POWER <input id="pwr" type="range" min="400" max="900" value="600" style="width:140px"> <button class="px-btn" style="font-size:18px;padding:4px 12px">SHOOT</button>` });
            ctx.stage.appendChild(ui);
            ctx.on(ui.querySelector('#ang'), 'input', (e) => { angle = +e.target.value; });
            ctx.on(ui.querySelector('#pwr'), 'input', (e) => { power = +e.target.value; });
            ctx.on(ui.querySelector('button'), 'click', () => {
                if (ball || shots >= total) return;
                const rad = angle * Math.PI / 180;
                ball = { x: 100, y: 480, vx: Math.cos(rad) * power, vy: -Math.sin(rad) * power };
                shots++;
            });
            ctx.loop((dt) => {
                g.fillStyle = '#1a2e3a'; g.fillRect(0, 0, ctx.W, ctx.H);
                g.fillStyle = '#3a3a3a'; g.fillRect(0, 510, ctx.W, 60);
                g.fillStyle = '#e2c83a'; g.fillRect(HOOP.x, HOOP.y, HOOP.w, HOOP.h);
                g.fillStyle = '#fff'; g.fillRect(HOOP.x + HOOP.w - 4, HOOP.y - 60, 4, 60);
                g.fillStyle = '#3a3a3a'; g.fillRect(HOOP.x + HOOP.w, HOOP.y - 60, 4, 80);
                // aim guide
                if (!ball) {
                    g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 2;
                    g.beginPath(); g.moveTo(100, 480);
                    let tx = 100, ty = 480, tvx = Math.cos(angle * Math.PI / 180) * power, tvy = -Math.sin(angle * Math.PI / 180) * power;
                    for (let i = 0; i < 30; i++) { tvy += 980 * 0.05; tx += tvx * 0.05; ty += tvy * 0.05; if (ty > 510) break; g.lineTo(tx, ty); }
                    g.stroke();
                }
                if (ball) {
                    ball.vy += 980 * dt; ball.x += ball.vx * dt; ball.y += ball.vy * dt;
                    g.fillStyle = '#ff9933'; g.fillRect(ball.x - 12, ball.y - 12, 24, 24);
                    // hoop check (passing through above the rim)
                    if (ball.x >= HOOP.x && ball.x <= HOOP.x + HOOP.w && ball.y >= HOOP.y && ball.y <= HOOP.y + 18 && ball.vy > 0) {
                        scored++; sfx.win(); ctx.setScore(`HITS ${scored}/${need}`); ball = null;
                        if (scored >= need) { ctx.timeout(() => ctx.win(), 600); return; }
                        if (shots >= total) { ctx.timeout(() => ctx.lose(), 600); return; }
                    } else if (ball && (ball.y > 540 || ball.x > ctx.W + 40)) {
                        sfx.bad(); ball = null;
                        if (shots >= total) { ctx.timeout(() => scored >= need ? ctx.win() : ctx.lose(), 600); return; }
                    }
                }
                ctx.setTimer(`SHOT ${shots}/${total}`);
            });
        }
    };

    // 12. Archery — moving target, hit 3/5
    M.archery = {
        title: 'ARCHERY',
        desc: 'Hit the moving target 3 of 5 times. Click to shoot.',
        run(ctx) {
            const { c, g } = mkCanvas(ctx);
            let arrows = 5, hits = 0;
            const target = { x: ctx.W - 80, y: 300, r: 36, vy: 130, dir: 1 };
            let arrow = null;
            ctx.setScore(`HITS 0/${arrows}`);
            ctx.on(c, 'pointerdown', (e) => {
                if (arrow || arrows <= 0) return;
                const r = c.getBoundingClientRect();
                const cx = (e.clientX - r.left) * (c.width / r.width);
                const cy = (e.clientY - r.top) * (c.height / r.height);
                arrow = { x: 60, y: 480, vx: 700, vy: -((480 - cy) / 0.7), gravity: 250 };
            });
            ctx.loop((dt) => {
                target.y += target.vy * target.dir * dt;
                if (target.y < 90 || target.y > 480) target.dir *= -1;
                if (arrow) {
                    arrow.vy += arrow.gravity * dt; arrow.x += arrow.vx * dt; arrow.y += arrow.vy * dt;
                    if (Math.hypot(arrow.x - target.x, arrow.y - target.y) < target.r) {
                        hits++; arrows--; sfx.win(); arrow = null; ctx.setScore(`HITS ${hits}/5`);
                        if (hits >= 3) { ctx.timeout(() => ctx.win(), 500); return; }
                        if (arrows <= 0) { ctx.timeout(() => ctx.lose(), 500); return; }
                    } else if (arrow && (arrow.x > ctx.W || arrow.y > ctx.H)) {
                        arrows--; sfx.bad(); arrow = null;
                        if (arrows <= 0) { ctx.timeout(() => hits >= 3 ? ctx.win() : ctx.lose(), 500); return; }
                    }
                }
                g.fillStyle = '#162a16'; g.fillRect(0, 0, ctx.W, ctx.H);
                g.fillStyle = '#3a3a1a'; g.fillRect(0, 510, ctx.W, 60);
                // target rings
                g.fillStyle = '#fff'; g.fillRect(target.x - target.r, target.y - target.r, target.r*2, target.r*2);
                g.fillStyle = '#e23a3a'; g.fillRect(target.x - 24, target.y - 24, 48, 48);
                g.fillStyle = '#fff'; g.fillRect(target.x - 12, target.y - 12, 24, 24);
                g.fillStyle = '#e23a3a'; g.fillRect(target.x - 4, target.y - 4, 8, 8);
                // archer
                g.fillStyle = '#8b3a1f'; g.fillRect(40, 460, 30, 50);
                if (arrow) { g.fillStyle = '#e2c83a'; g.fillRect(arrow.x - 12, arrow.y - 2, 24, 4); g.fillStyle = '#fff'; g.fillRect(arrow.x + 8, arrow.y - 4, 4, 8); }
                ctx.setTimer(`ARROWS ${arrows}`);
            });
        }
    };

    // 13. Angry Birds — slingshot, knock all blocks in 3 shots
    M.angry_birds = {
        title: 'ANGRY BIRDS',
        desc: 'Drag back to aim. Knock down all blocks in 3 shots.',
        run(ctx) {
            const { c, g } = mkCanvas(ctx);
            const sling = { x: 110, y: 460 };
            let bird = null, shots = 3;
            const blocks = []; // {x,y,w,h,alive}
            // pyramid
            const baseX = 620, baseY = 510;
            for (let r = 0; r < 4; r++) for (let i = 0; i <= r; i++) {
                blocks.push({ x: baseX - r * 22 + i * 44, y: baseY - (3 - r) * 44, w: 40, h: 40, alive: true });
            }
            let dragging = false; let dragV = { x: 0, y: 0 };
            ctx.setScore(`SHOTS ${shots}`);
            ctx.on(c, 'pointerdown', (e) => {
                if (bird) return;
                const r = c.getBoundingClientRect();
                const cx = (e.clientX - r.left) * (c.width / r.width);
                const cy = (e.clientY - r.top) * (c.height / r.height);
                if (Math.hypot(cx - sling.x, cy - sling.y) < 60) dragging = true;
            });
            ctx.on(c, 'pointermove', (e) => {
                if (!dragging) return;
                const r = c.getBoundingClientRect();
                const cx = (e.clientX - r.left) * (c.width / r.width);
                const cy = (e.clientY - r.top) * (c.height / r.height);
                dragV = { x: clamp(sling.x - cx, -100, 100), y: clamp(sling.y - cy, -100, 100) };
            });
            ctx.on(c, 'pointerup', () => {
                if (!dragging) return; dragging = false;
                bird = { x: sling.x, y: sling.y, vx: dragV.x * 8, vy: dragV.y * 8 };
                dragV = { x: 0, y: 0 }; shots--; ctx.setScore(`SHOTS ${shots}`);
            });
            ctx.loop((dt) => {
                if (bird) {
                    bird.vy += 800 * dt; bird.x += bird.vx * dt; bird.y += bird.vy * dt;
                    for (const b of blocks) {
                        if (!b.alive) continue;
                        if (bird.x > b.x && bird.x < b.x + b.w && bird.y > b.y && bird.y < b.y + b.h) { b.alive = false; sfx.hit(); bird.vx *= 0.6; bird.vy = -200; }
                    }
                    if (bird.y > 530 || bird.x > ctx.W || bird.x < 0) {
                        bird = null;
                        if (blocks.every(b => !b.alive)) { ctx.timeout(() => ctx.win(), 400); return; }
                        if (shots <= 0) { ctx.timeout(() => ctx.lose(), 400); return; }
                    }
                }
                g.fillStyle = '#83a8f0'; g.fillRect(0, 0, ctx.W, ctx.H);
                g.fillStyle = '#5a8a3a'; g.fillRect(0, 530, ctx.W, 40);
                // sling
                g.fillStyle = '#5a3a1f'; g.fillRect(sling.x - 4, sling.y - 10, 8, 60);
                if (dragging) {
                    g.fillStyle = '#e23a3a'; g.fillRect(sling.x - dragV.x - 12, sling.y - dragV.y - 12, 24, 24);
                    g.strokeStyle = '#5a3a1f'; g.lineWidth = 3; g.beginPath(); g.moveTo(sling.x, sling.y); g.lineTo(sling.x - dragV.x, sling.y - dragV.y); g.stroke();
                }
                // blocks
                for (const b of blocks) if (b.alive) { g.fillStyle = '#a87a3a'; g.fillRect(b.x, b.y, b.w, b.h); g.fillStyle = '#5a3a1f'; g.fillRect(b.x, b.y, b.w, 4); }
                // bird
                if (bird) { g.fillStyle = '#e23a3a'; g.fillRect(bird.x - 12, bird.y - 12, 24, 24); g.fillStyle = '#000'; g.fillRect(bird.x + 4, bird.y - 4, 4, 4); }
                ctx.setTimer(`BLOCKS ${blocks.filter(b=>b.alive).length}`);
            });
        }
    };

    // 14. Paper Toss
    M.paper_toss = {
        title: 'PAPER TOSS',
        desc: 'Flick paper into the bin. Land 5 of 8.',
        run(ctx) {
            const { c, g } = mkCanvas(ctx);
            let shots = 8, hits = 0; let ball = null; let dragging = false; let drag = { x: 0, y: 0 };
            const wind = { v: rand(-40, 40) };
            const bin = { x: 600, y: 470, w: 80, h: 60 };
            ctx.setScore(`HITS 0/5`);
            ctx.on(c, 'pointerdown', (e) => {
                if (ball || shots <= 0) return;
                const r = c.getBoundingClientRect();
                drag = { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
                dragging = true;
            });
            ctx.on(c, 'pointermove', (e) => {
                if (!dragging) return;
                const r = c.getBoundingClientRect();
                drag.cx = (e.clientX - r.left) * (c.width / r.width);
                drag.cy = (e.clientY - r.top) * (c.height / r.height);
            });
            ctx.on(c, 'pointerup', () => {
                if (!dragging) return; dragging = false;
                if (drag.cx == null) return;
                const dx = drag.cx - drag.x, dy = drag.cy - drag.y;
                ball = { x: 200, y: 480, vx: dx * 4, vy: dy * 4 };
                shots--; wind.v = rand(-50, 50);
            });
            ctx.loop((dt) => {
                if (ball) {
                    ball.vy += 700 * dt; ball.vx += wind.v * dt; ball.x += ball.vx * dt; ball.y += ball.vy * dt;
                    if (ball.y > bin.y && ball.x > bin.x + 6 && ball.x < bin.x + bin.w - 6 && ball.vy > 0) {
                        hits++; sfx.win(); ball = null; ctx.setScore(`HITS ${hits}/5`);
                        if (hits >= 5) { ctx.timeout(() => ctx.win(), 400); return; }
                        if (shots <= 0) { ctx.timeout(() => ctx.lose(), 400); return; }
                    } else if (ball && ball.y > 540) {
                        sfx.bad(); ball = null;
                        if (hits >= 5) { ctx.timeout(() => ctx.win(), 400); return; }
                        if (shots <= 0) { ctx.timeout(() => ctx.lose(), 400); return; }
                    }
                }
                g.fillStyle = '#2a2422'; g.fillRect(0, 0, ctx.W, ctx.H);
                g.fillStyle = '#3a3024'; g.fillRect(0, 540, ctx.W, 30);
                // bin
                g.fillStyle = '#222'; g.fillRect(bin.x, bin.y, bin.w, bin.h); g.fillStyle = '#444'; g.fillRect(bin.x, bin.y, bin.w, 6);
                // paper
                g.fillStyle = '#fff'; g.fillRect(190, 470, 20, 20);
                if (ball) { g.fillStyle = '#fff'; g.fillRect(ball.x - 10, ball.y - 10, 20, 20); }
                // wind indicator
                g.fillStyle = '#aaa'; g.font = '20px VT323, monospace'; g.fillText(`WIND ${wind.v >= 0 ? '→' : '←'} ${Math.abs(Math.round(wind.v))}`, 20, 30);
                ctx.setTimer(`SHOTS ${shots}`);
            });
        }
    };

    // 15. Cannon
    M.cannon = {
        title: 'CANNON',
        desc: 'Hit the small target across the screen, 3 of 5.',
        run(ctx) {
            const { c, g } = mkCanvas(ctx);
            let shots = 5, hits = 0; let ball = null; let angle = 45, power = 700;
            const tgt = { x: rand(550, 720), y: rand(150, 480), w: 50, h: 50 };
            ctx.setScore(`HITS 0/3`);
            const ui = ctx.el('div', { style: { position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(0,0,0,0.5)', padding: '8px 14px', color: '#fff', fontFamily: 'VT323, monospace', fontSize: '20px' }, html: `ANGLE <input id="a" type="range" min="10" max="80" value="45" style="width:120px"> POWER <input id="p" type="range" min="500" max="950" value="700" style="width:120px"> <button class="px-btn" style="font-size:18px;padding:4px 12px">FIRE</button>` });
            ctx.stage.appendChild(ui);
            ctx.on(ui.querySelector('#a'), 'input', e => angle = +e.target.value);
            ctx.on(ui.querySelector('#p'), 'input', e => power = +e.target.value);
            ctx.on(ui.querySelector('button'), 'click', () => {
                if (ball || shots <= 0) return;
                const r = angle * Math.PI / 180;
                ball = { x: 80, y: 510, vx: Math.cos(r) * power, vy: -Math.sin(r) * power };
                shots--;
            });
            ctx.loop((dt) => {
                if (ball) {
                    ball.vy += 980 * dt; ball.x += ball.vx * dt; ball.y += ball.vy * dt;
                    if (ball.x > tgt.x && ball.x < tgt.x + tgt.w && ball.y > tgt.y && ball.y < tgt.y + tgt.h) {
                        hits++; sfx.win(); ball = null; ctx.setScore(`HITS ${hits}/3`);
                        tgt.x = rand(550, 720); tgt.y = rand(150, 480);
                        if (hits >= 3) { ctx.timeout(() => ctx.win(), 400); return; }
                        if (shots <= 0) { ctx.timeout(() => ctx.lose(), 400); return; }
                    } else if (ball && (ball.y > 530 || ball.x > ctx.W)) {
                        sfx.bad(); ball = null;
                        if (shots <= 0) { ctx.timeout(() => hits >= 3 ? ctx.win() : ctx.lose(), 400); return; }
                    }
                }
                g.fillStyle = '#1a2030'; g.fillRect(0, 0, ctx.W, ctx.H);
                g.fillStyle = '#3a3a1a'; g.fillRect(0, 530, ctx.W, 40);
                g.fillStyle = '#444'; g.fillRect(40, 500, 60, 30);
                g.save(); g.translate(80, 510); g.rotate(-angle * Math.PI / 180); g.fillStyle = '#222'; g.fillRect(0, -10, 60, 20); g.restore();
                g.fillStyle = '#e23a3a'; g.fillRect(tgt.x, tgt.y, tgt.w, tgt.h);
                g.fillStyle = '#fff'; g.fillRect(tgt.x + 18, tgt.y + 18, 14, 14);
                if (ball) { g.fillStyle = '#000'; g.fillRect(ball.x - 8, ball.y - 8, 16, 16); }
                ctx.setTimer(`SHOTS ${shots}`);
            });
        }
    };

    // 16. Darts
    M.darts = {
        title: 'DARTS',
        desc: 'Land 3 darts on the moving bullseye. Click to throw.',
        run(ctx) {
            const { c, g } = mkCanvas(ctx);
            let darts = 6, hits = 0; const bull = { x: 400, y: 250, r: 26, vx: 180, vy: 110 };
            ctx.setScore(`BULLS 0/3`);
            ctx.on(c, 'pointerdown', (e) => {
                if (darts <= 0) return;
                darts--;
                const r = c.getBoundingClientRect();
                const cx = (e.clientX - r.left) * (c.width / r.width);
                const cy = (e.clientY - r.top) * (c.height / r.height);
                const d = Math.hypot(cx - bull.x, cy - bull.y);
                const stick = ctx.el('div', { style: { position: 'absolute', left: (cx-3)+'px', top: (cy-3)+'px', width:'6px', height:'6px', background:'#ff3a3a' } });
                ctx.stage.appendChild(stick);
                if (d < bull.r) { hits++; sfx.win(); ctx.setScore(`BULLS ${hits}/3`); if (hits >= 3) { ctx.timeout(() => ctx.win(), 500); return; } }
                else { sfx.bad(); }
                if (darts <= 0) { ctx.timeout(() => hits >= 3 ? ctx.win() : ctx.lose(), 500); }
            });
            ctx.loop((dt) => {
                bull.x += bull.vx * dt; bull.y += bull.vy * dt;
                if (bull.x < bull.r + 30 || bull.x > ctx.W - bull.r - 30) bull.vx *= -1;
                if (bull.y < bull.r + 60 || bull.y > ctx.H - bull.r - 30) bull.vy *= -1;
                g.fillStyle = '#1a1a1a'; g.fillRect(0, 0, ctx.W, ctx.H);
                g.fillStyle = '#fff'; g.fillRect(bull.x - 50, bull.y - 50, 100, 100);
                g.fillStyle = '#e23a3a'; g.fillRect(bull.x - 30, bull.y - 30, 60, 60);
                g.fillStyle = '#fff'; g.fillRect(bull.x - 16, bull.y - 16, 32, 32);
                g.fillStyle = '#e23a3a'; g.fillRect(bull.x - 6, bull.y - 6, 12, 12);
                ctx.setTimer(`DARTS ${darts}`);
            });
        }
    };

    // 17. Penalty Kick
    M.penalty_kick = {
        title: 'PENALTY KICK',
        desc: 'Pick a side and power. Score 3 of 5. The keeper guesses random.',
        run(ctx) {
            let shots = 5, scored = 0;
            const stage = ctx.stage;
            const goal = ctx.el('div', { style: { position: 'absolute', top: '60px', left: '160px', width: '480px', height: '180px', background: '#1a1a1a', border: '6px solid #fff' } });
            const keeper = ctx.el('div', { style: { position: 'absolute', top: '120px', width: '60px', height: '120px', background: '#3a72e2', border: '3px solid #fff', transition: 'left 0.18s' } });
            const ball = ctx.el('div', { style: { position: 'absolute', bottom: '40px', left: '380px', width: '40px', height: '40px', background: '#fff', border: '4px solid #000', borderRadius: '20px', transition: 'all 0.4s' } });
            stage.appendChild(goal); stage.appendChild(keeper); stage.appendChild(ball);
            const choices = ctx.el('div', { style: { position: 'absolute', bottom: '100px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '16px' } });
            ['LEFT','CENTER','RIGHT'].forEach((label, i) => {
                const b = pxBtn(label, () => shoot(i));
                b.dataset.dir = i; choices.appendChild(b);
            });
            stage.appendChild(choices);
            ctx.setScore(`SCORED 0/${shots}`);
            keeper.style.left = '350px';
            function shoot(dir) {
                if (shots <= 0) return;
                const keeperDir = randInt(0, 2);
                const targetLeft = [200, 380, 560][dir];
                ball.style.left = (targetLeft - 20) + 'px';
                ball.style.bottom = '180px';
                keeper.style.left = ([200, 380, 560][keeperDir] - 30) + 'px';
                shots--;
                ctx.timeout(() => {
                    if (dir === keeperDir) { sfx.bad(); }
                    else { scored++; sfx.win(); ctx.setScore(`SCORED ${scored}/${shots+scored}`); }
                    if (scored >= 3) { ctx.timeout(() => ctx.win(), 400); return; }
                    if (shots <= 0) { ctx.timeout(() => scored >= 3 ? ctx.win() : ctx.lose(), 400); return; }
                    ball.style.transition = 'none';
                    ball.style.left = '380px'; ball.style.bottom = '40px';
                    ctx.timeout(() => { ball.style.transition = 'all 0.4s'; }, 50);
                }, 450);
            }
        }
    };

    // 18. Bowling
    M.bowling = {
        title: 'BOWLING',
        desc: 'Aim and roll. Knock 15+ pins across 3 frames.',
        run(ctx) {
            const { c, g } = mkCanvas(ctx);
            let frame = 0, total = 0;
            let pins = []; // {x,y,alive}
            let aiming = true; let aimX = 400; let aimDir = 1; let ball = null;
            ctx.setScore(`PINS 0`);
            function setupPins() {
                pins = []; const baseX = 400, baseY = 100;
                for (let r = 0; r < 4; r++) for (let i = 0; i <= r; i++) pins.push({ x: baseX - r * 22 + i * 44, y: baseY + r * 36, alive: true });
            }
            setupPins();
            ctx.on(c, 'pointerdown', () => {
                if (!aiming || ball) return;
                aiming = false; ball = { x: aimX, y: 540, vy: -700 };
            });
            ctx.loop((dt) => {
                if (aiming) { aimX += aimDir * 240 * dt; if (aimX < 200 || aimX > 600) aimDir *= -1; }
                if (ball) {
                    ball.y += ball.vy * dt;
                    for (const p of pins) {
                        if (!p.alive) continue;
                        if (Math.hypot(ball.x - p.x, ball.y - p.y) < 20) { p.alive = false; sfx.hit(); ball.vy *= 0.95; }
                    }
                    if (ball.y < 60) {
                        const knocked = pins.filter(p => !p.alive).length;
                        total += knocked; ctx.setScore(`PINS ${total}`); frame++;
                        ball = null;
                        if (frame >= 3) { ctx.timeout(() => total >= 15 ? ctx.win() : ctx.lose(), 600); return; }
                        ctx.timeout(() => { setupPins(); aiming = true; }, 800);
                    }
                }
                g.fillStyle = '#3a2418'; g.fillRect(0, 0, ctx.W, ctx.H);
                g.fillStyle = '#a07a44'; g.fillRect(180, 50, 440, 500);
                for (const p of pins) if (p.alive) { g.fillStyle = '#fff'; g.fillRect(p.x - 8, p.y - 12, 16, 24); g.fillStyle = '#e23a3a'; g.fillRect(p.x - 8, p.y - 6, 16, 4); }
                if (aiming) {
                    g.strokeStyle = '#3ae26a'; g.lineWidth = 2; g.setLineDash([6, 6]);
                    g.beginPath(); g.moveTo(aimX, 540); g.lineTo(aimX, 60); g.stroke(); g.setLineDash([]);
                    g.fillStyle = '#000'; g.fillRect(aimX - 18, 530, 36, 36);
                }
                if (ball) { g.fillStyle = '#000'; g.fillRect(ball.x - 18, ball.y - 18, 36, 36); }
                ctx.setTimer(`FRAME ${frame+1}/3`);
            });
        }
    };

    // 19. Pool
    M.pool = {
        title: 'POOL',
        desc: 'Sink 3 balls in 5 shots. Drag from the cue ball to aim & power.',
        run(ctx) {
            const { c, g } = mkCanvas(ctx);
            const W = ctx.W, H = ctx.H;
            const cue = { x: 200, y: 285, vx: 0, vy: 0, r: 14, color: '#fff' };
            const balls = [cue];
            for (let i = 0; i < 6; i++) balls.push({ x: 500 + (i % 3) * 30, y: 220 + Math.floor(i / 3) * 30, vx: 0, vy: 0, r: 14, color: pick(['#e23a3a','#3a72e2','#3ae26a','#e2c83a','#cc3aee','#ff9933']) });
            const pockets = [{x:30,y:30},{x:W-30,y:30},{x:30,y:H-30},{x:W-30,y:H-30},{x:W/2,y:30},{x:W/2,y:H-30}];
            let shots = 5, sunk = 0, dragging = false, dragP = null;
            ctx.setScore(`SUNK 0/3`);
            ctx.on(c, 'pointerdown', (e) => {
                if (cue.vx || cue.vy) return;
                const r = c.getBoundingClientRect();
                const x = (e.clientX - r.left) * (c.width / r.width);
                const y = (e.clientY - r.top) * (c.height / r.height);
                if (Math.hypot(x - cue.x, y - cue.y) < 30) { dragging = true; dragP = { x, y }; }
            });
            ctx.on(c, 'pointermove', (e) => { if (!dragging) return; const r = c.getBoundingClientRect(); dragP.cx = (e.clientX - r.left) * (c.width / r.width); dragP.cy = (e.clientY - r.top) * (c.height / r.height); });
            ctx.on(c, 'pointerup', () => {
                if (!dragging) return; dragging = false;
                if (dragP.cx == null) return;
                cue.vx = (cue.x - dragP.cx) * 5; cue.vy = (cue.y - dragP.cy) * 5;
                shots--;
            });
            ctx.loop((dt) => {
                for (const b of balls) {
                    b.x += b.vx * dt; b.y += b.vy * dt;
                    b.vx *= 0.985; b.vy *= 0.985;
                    if (Math.abs(b.vx) < 5 && Math.abs(b.vy) < 5) { b.vx = 0; b.vy = 0; }
                    if (b.x < 30 + b.r) { b.x = 30 + b.r; b.vx *= -0.8; }
                    if (b.x > W - 30 - b.r) { b.x = W - 30 - b.r; b.vx *= -0.8; }
                    if (b.y < 30 + b.r) { b.y = 30 + b.r; b.vy *= -0.8; }
                    if (b.y > H - 30 - b.r) { b.y = H - 30 - b.r; b.vy *= -0.8; }
                }
                // collide
                for (let i = 0; i < balls.length; i++) for (let j = i+1; j < balls.length; j++) {
                    const a = balls[i], b = balls[j];
                    const dx = b.x - a.x, dy = b.y - a.y; const d = Math.hypot(dx, dy);
                    if (d < a.r + b.r) {
                        const nx = dx/d, ny = dy/d; const dvx = b.vx - a.vx, dvy = b.vy - a.vy;
                        const sp = dvx * nx + dvy * ny; if (sp > 0) continue;
                        a.vx += sp * nx; a.vy += sp * ny; b.vx -= sp * nx; b.vy -= sp * ny;
                        const overlap = (a.r + b.r - d) / 2; a.x -= nx * overlap; a.y -= ny * overlap; b.x += nx * overlap; b.y += ny * overlap;
                    }
                }
                // pockets
                for (let i = balls.length - 1; i >= 0; i--) {
                    const b = balls[i];
                    for (const p of pockets) if (Math.hypot(b.x - p.x, b.y - p.y) < 24) {
                        if (b === cue) { cue.x = 200; cue.y = 285; cue.vx = 0; cue.vy = 0; }
                        else { balls.splice(i, 1); sunk++; sfx.win(); ctx.setScore(`SUNK ${sunk}/3`); }
                        break;
                    }
                }
                if (sunk >= 3) { ctx.timeout(() => ctx.win(), 600); return; }
                const allStop = balls.every(b => b.vx === 0 && b.vy === 0);
                if (allStop && shots <= 0) { ctx.timeout(() => sunk >= 3 ? ctx.win() : ctx.lose(), 600); return; }
                g.fillStyle = '#3a2418'; g.fillRect(0, 0, W, H);
                g.fillStyle = '#1a6a3a'; g.fillRect(30, 30, W - 60, H - 60);
                for (const p of pockets) { g.fillStyle = '#000'; g.fillRect(p.x - 18, p.y - 18, 36, 36); }
                for (const b of balls) { g.fillStyle = b.color; g.fillRect(b.x - b.r, b.y - b.r, b.r*2, b.r*2); }
                if (dragging && dragP.cx != null) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(cue.x, cue.y); g.lineTo(dragP.cx, dragP.cy); g.stroke(); }
                ctx.setTimer(`SHOTS ${shots}`);
            });
        }
    };

    // 20. Bottle Flip
    M.bottle_flip = {
        title: 'BOTTLE FLIP',
        desc: 'Flick up to flip the bottle. Land upright 3 of 5.',
        run(ctx) {
            const { c, g } = mkCanvas(ctx);
            let flips = 5, ok = 0; let bottle = { x: 400, y: 480, vy: 0, rot: 0, vrot: 0, settled: true };
            let dragStart = null;
            ctx.setScore(`UPRIGHT 0/3`);
            ctx.on(c, 'pointerdown', (e) => {
                if (!bottle.settled || flips <= 0) return;
                const r = c.getBoundingClientRect();
                dragStart = { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height), t: performance.now() };
            });
            ctx.on(c, 'pointerup', (e) => {
                if (!dragStart || !bottle.settled) return;
                const r = c.getBoundingClientRect();
                const x = (e.clientX - r.left) * (c.width / r.width);
                const y = (e.clientY - r.top) * (c.height / r.height);
                const dy = dragStart.y - y; const dt = (performance.now() - dragStart.t) / 1000;
                bottle.vy = -clamp(dy / Math.max(0.05, dt) * 0.6, 200, 900);
                bottle.vrot = -bottle.vy / 100;
                bottle.settled = false; flips--;
                dragStart = null;
            });
            ctx.loop((dt) => {
                if (!bottle.settled) {
                    bottle.vy += 1100 * dt; bottle.y += bottle.vy * dt; bottle.rot += bottle.vrot * dt;
                    if (bottle.y > 480) {
                        bottle.y = 480; bottle.vy = 0; bottle.settled = true;
                        // Normalize rotation to 0..2π
                        const r = ((bottle.rot % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
                        const upright = r < 0.45 || r > Math.PI * 2 - 0.45;
                        if (upright) { ok++; sfx.win(); ctx.setScore(`UPRIGHT ${ok}/3`); }
                        else { sfx.bad(); }
                        bottle.rot = upright ? 0 : Math.PI;
                        if (ok >= 3) { ctx.timeout(() => ctx.win(), 500); return; }
                        if (flips <= 0) { ctx.timeout(() => ok >= 3 ? ctx.win() : ctx.lose(), 500); return; }
                    }
                }
                g.fillStyle = '#1a2418'; g.fillRect(0, 0, ctx.W, ctx.H);
                g.fillStyle = '#3a2418'; g.fillRect(0, 510, ctx.W, 60);
                g.save(); g.translate(bottle.x, bottle.y); g.rotate(bottle.rot);
                g.fillStyle = '#3aa84a'; g.fillRect(-12, -50, 24, 50);
                g.fillStyle = '#2a7a36'; g.fillRect(-8, -64, 16, 14);
                g.restore();
                ctx.setTimer(`FLIPS ${flips}`);
            });
        }
    };

    // -------------------- MEMORY (10) --------------------

    // 21. Simon Says (extended to length 8)
    M.simon_says = {
        title: 'SIMON SAYS',
        desc: 'Watch the sequence, then repeat. Reach length 8.',
        run(ctx) {
            const seq = []; let pStep = 0; const TARGET = 8; let watching = true;
            const colors = ['#e23a3a', '#3a72e2', '#3ae26a', '#e2c83a'];
            const grid = ctx.el('div', { style: { position: 'absolute', top: '110px', left: '50%', transform: 'translateX(-50%)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' } });
            const msg = ctx.el('div', { style: { position: 'absolute', top: '40px', width: '100%', textAlign: 'center', color: '#fff', fontFamily: 'VT323, monospace', fontSize: '36px', letterSpacing: '4px' }, text: 'WATCH' });
            const btns = colors.map((col, i) => {
                const b = ctx.el('button', { style: { width: '170px', height: '170px', background: col, opacity: 0.4, border: 'none', cursor: 'pointer', transition: 'opacity 0.1s' }, onclick: () => onTap(i) });
                grid.appendChild(b); return b;
            });
            ctx.stage.appendChild(grid); ctx.stage.appendChild(msg);
            ctx.setScore(`LEN 0/${TARGET}`);
            function flash(i) { btns[i].style.opacity = 1; ctx.timeout(() => { btns[i].style.opacity = 0.4; }, 280); beep(220 + i * 110, 0.18, 'square', 0.05); }
            function play() {
                watching = true; msg.textContent = 'WATCH'; pStep = 0;
                seq.push(randInt(0, 3));
                ctx.setScore(`LEN ${seq.length-1}/${TARGET}`);
                let i = 0;
                const id = ctx.interval(() => {
                    if (i < seq.length) { flash(seq[i]); i++; }
                    else { ctx.clearInterval(id); ctx.timeout(() => { watching = false; msg.textContent = 'REPEAT'; }, 300); }
                }, 600);
            }
            function onTap(i) {
                if (watching) return; flash(i);
                if (i === seq[pStep]) {
                    pStep++;
                    if (pStep === seq.length) {
                        if (seq.length >= TARGET) { ctx.timeout(() => ctx.win(), 400); return; }
                        ctx.timeout(play, 700);
                    }
                } else { sfx.lose(); ctx.timeout(() => ctx.lose(), 400); }
            }
            play();
        }
    };

    // 22. Memory Match (4x4)
    M.memory_match = {
        title: 'MEMORY MATCH',
        desc: 'Match all 8 pairs in 60 seconds.',
        run(ctx) {
            const symbols = ['◆','▲','●','★','♥','♣','■','✚'];
            const deck = shuffle([...symbols, ...symbols]);
            const grid = ctx.el('div', { style: { position: 'absolute', inset: '40px 100px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gridTemplateRows: 'repeat(4,1fr)', gap: '10px' } });
            const cards = []; let first = null; let lock = false; let matches = 0;
            for (let i = 0; i < 16; i++) {
                const card = ctx.el('button', { style: { background: '#3a3a8a', color: '#3a3a8a', border: '3px solid #555', fontFamily: 'VT323, monospace', fontSize: '40px', cursor: 'pointer' }, text: deck[i], onclick: () => flip(i) });
                cards.push({ el: card, sym: deck[i], matched: false, shown: false });
                grid.appendChild(card);
            }
            ctx.stage.appendChild(grid);
            ctx.setScore(`MATCHES 0/8`);
            function show(c, on) { c.shown = on; c.el.style.color = on ? '#fff' : '#3a3a8a'; c.el.style.background = on ? '#1a1a4a' : '#3a3a8a'; }
            function flip(i) {
                if (lock) return;
                const c = cards[i]; if (c.matched || c.shown) return;
                show(c, true); sfx.tick();
                if (!first) { first = c; return; }
                if (first.sym === c.sym) {
                    first.matched = true; c.matched = true; sfx.win();
                    matches++; ctx.setScore(`MATCHES ${matches}/8`);
                    first = null;
                    if (matches >= 8) ctx.timeout(() => ctx.win(), 400);
                } else {
                    lock = true;
                    ctx.timeout(() => { show(first, false); show(c, false); first = null; lock = false; }, 700);
                }
            }
            countdown(ctx, 60, 'TIME', () => matches >= 8 ? ctx.win() : ctx.lose());
        }
    };

    // 23. Sequence Recall — flash 10 digits, type back
    M.sequence_recall = {
        title: 'SEQUENCE RECALL',
        desc: 'Memorize 10 digits in 5 seconds. Type them back.',
        run(ctx) {
            const seq = Array.from({ length: 10 }, () => randInt(0, 9));
            const display = ctx.el('div', { style: { position: 'absolute', top: '90px', width: '100%', textAlign: 'center', color: '#fff', fontFamily: 'VT323, monospace', fontSize: '72px', letterSpacing: '12px' }, text: seq.join(' ') });
            ctx.stage.appendChild(display);
            ctx.setScore('STUDY');
            ctx.timeout(() => {
                display.textContent = '';
                ctx.setScore('TYPE IT');
                const input = ctx.el('div', { style: { position: 'absolute', top: '90px', width: '100%', textAlign: 'center', color: '#3ae26a', fontFamily: 'VT323, monospace', fontSize: '64px', letterSpacing: '12px', minHeight: '70px' } });
                const pad = ctx.el('div', { style: { position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', display: 'grid', gridTemplateColumns: 'repeat(5,80px)', gap: '8px' } });
                ctx.stage.appendChild(input); ctx.stage.appendChild(pad);
                let entered = '';
                for (let n = 1; n <= 10; n++) {
                    const num = n % 10; // 1..9, then 0
                    const b = pxBtn(String(num), () => {
                        if (entered.length >= 10) return;
                        entered += num; input.textContent = entered.split('').join(' '); sfx.tick();
                        if (entered.length === 10) {
                            if (entered === seq.join('')) ctx.win(); else ctx.lose();
                        }
                    });
                    b.style.fontSize = '32px'; pad.appendChild(b);
                }
            }, 5000);
        }
    };

    // 24. Cup Shuffle
    M.cup_shuffle = {
        title: 'CUP SHUFFLE',
        desc: 'Watch where the ball goes. 5 rounds, each faster.',
        run(ctx) {
            let round = 0; const total = 5;
            const cups = []; let ballAt = 0; let shuffling = false;
            ctx.setScore(`ROUND 0/${total}`);
            const row = ctx.el('div', { style: { position: 'absolute', top: '180px', width: '100%', display: 'flex', justifyContent: 'center', gap: '40px' } });
            for (let i = 0; i < 3; i++) {
                const cup = ctx.el('div', { style: { width: '120px', height: '160px', background: '#a83a3a', borderTop: '8px solid #5a1010', cursor: 'pointer', position: 'relative' } });
                cups.push(cup); row.appendChild(cup);
            }
            ctx.stage.appendChild(row);
            const status = ctx.el('div', { style: { position: 'absolute', top: '60px', width: '100%', textAlign: 'center', color: '#fff', fontFamily: 'VT323, monospace', fontSize: '36px' }, text: 'GET READY' });
            ctx.stage.appendChild(status);
            // ballAt = identity of the cup holding the ball (a fixed cup id 0..2)
            // posMap[positionIndex] = cup id currently at that position
            let posMap = [0, 1, 2];
            function guess(positionClicked) {
                if (shuffling) return;
                const cupAtPos = posMap[positionClicked];
                if (cupAtPos === ballAt) { sfx.win(); round++; ctx.setScore(`ROUND ${round}/${total}`); status.textContent = 'YES!'; if (round >= total) { ctx.timeout(() => ctx.win(), 600); return; } ctx.timeout(nextRound, 800); }
                else { sfx.lose(); ctx.timeout(() => ctx.lose(), 500); }
            }
            // Rewire cup clicks to use position index in posMap.
            cups.forEach((cup, originalIdx) => {
                cup.onclick = null;
                ctx.on(cup, 'click', () => {
                    if (shuffling) return;
                    guess(posMap.indexOf(originalIdx));
                });
            });
            function nextRound() {
                shuffling = true;
                ballAt = randInt(0, 2);
                posMap = [0, 1, 2];
                // Reset DOM order to canonical [0,1,2]
                row.innerHTML = '';
                cups.forEach(c => { c.style.transform = ''; c.style.transition = 'none'; row.appendChild(c); });
                cups.forEach((c, i) => c.style.background = i === ballAt ? '#3ae26a' : '#a83a3a');
                status.textContent = 'WATCH';
                ctx.timeout(() => {
                    cups.forEach(c => c.style.background = '#a83a3a');
                    const n = 6 + round * 2;
                    const speed = Math.max(120, 380 - round * 50);
                    function step(left) {
                        if (left <= 0) { shuffling = false; status.textContent = 'PICK'; return; }
                        const i = randInt(0, 1); const j = i + 1;
                        const cupA = cups[posMap[i]], cupB = cups[posMap[j]];
                        const ar = cupA.getBoundingClientRect(), br = cupB.getBoundingClientRect();
                        const dx = br.left - ar.left;
                        cupA.style.transition = `transform ${speed}ms`; cupB.style.transition = `transform ${speed}ms`;
                        cupA.style.transform = `translateX(${dx}px)`;
                        cupB.style.transform = `translateX(${-dx}px)`;
                        ctx.timeout(() => {
                            cupA.style.transition = 'none'; cupB.style.transition = 'none';
                            cupA.style.transform = ''; cupB.style.transform = '';
                            // Reorder DOM so positions match posMap
                            row.insertBefore(cupB, cupA);
                            [posMap[i], posMap[j]] = [posMap[j], posMap[i]];
                            step(left - 1);
                        }, speed + 30);
                    }
                    step(n);
                }, 1100);
            }
            ctx.timeout(nextRound, 1000);
        }
    };

    // 25. Pattern Flash — 3x3 lit pattern, reproduce, 10 rounds
    M.pattern_flash = {
        title: 'PATTERN FLASH',
        desc: 'Reproduce the lit 3x3 pattern. 10 rounds, increasing complexity.',
        run(ctx) {
            let round = 0; const total = 10;
            const grid = ctx.el('div', { style: { position: 'absolute', inset: '60px 220px 80px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gridTemplateRows: 'repeat(3,1fr)', gap: '10px' } });
            const status = ctx.el('div', { style: { position: 'absolute', top: '15px', width: '100%', textAlign: 'center', color: '#fff', fontFamily: 'VT323, monospace', fontSize: '32px' }, text: 'WATCH' });
            const cells = [];
            for (let i = 0; i < 9; i++) {
                const c = ctx.el('button', { style: { background: '#1a1a1a', border: '4px solid #555', cursor: 'pointer' }, onclick: () => onTap(i) });
                cells.push(c); grid.appendChild(c);
            }
            ctx.stage.appendChild(grid); ctx.stage.appendChild(status);
            const submitBtn = pxBtn('SUBMIT', () => check());
            submitBtn.style.cssText += 'position:absolute;bottom:20px;left:50%;transform:translateX(-50%)';
            ctx.stage.appendChild(submitBtn);
            ctx.setScore(`ROUND 0/${total}`);
            let target = []; let user = []; let watching = true;
            function show() {
                target = []; user = [];
                const n = clamp(3 + Math.floor(round / 2), 3, 7);
                while (target.length < n) { const i = randInt(0, 8); if (!target.includes(i)) target.push(i); }
                cells.forEach(c => c.style.background = '#1a1a1a');
                target.forEach(i => cells[i].style.background = '#3ae26a');
                watching = true; status.textContent = 'WATCH';
                ctx.timeout(() => { cells.forEach(c => c.style.background = '#1a1a1a'); watching = false; status.textContent = 'REPRODUCE'; }, Math.max(700, 1600 - round * 120));
            }
            function onTap(i) {
                if (watching) return;
                if (user.includes(i)) { user = user.filter(x => x !== i); cells[i].style.background = '#1a1a1a'; }
                else { user.push(i); cells[i].style.background = '#3ae26a'; sfx.tick(); }
            }
            function check() {
                if (watching) return;
                if (user.length === target.length && target.every(i => user.includes(i))) {
                    sfx.win(); round++; ctx.setScore(`ROUND ${round}/${total}`);
                    if (round >= total) { ctx.timeout(() => ctx.win(), 400); return; }
                    ctx.timeout(show, 600);
                } else { sfx.lose(); ctx.timeout(() => ctx.lose(), 400); }
            }
            show();
        }
    };

    // 26. Odd One Out
    M.odd_one_out = {
        title: 'ODD ONE OUT',
        desc: 'Spot the difference between two images. 5 rounds, 3s each.',
        run(ctx) {
            let round = 0; const total = 5;
            const wrap = ctx.el('div', { style: { position: 'absolute', inset: '60px 40px 60px', display: 'flex', gap: '20px' } });
            const left = ctx.el('div', { style: { flex: 1, position: 'relative', background: '#222', border: '3px solid #555' } });
            const right = ctx.el('div', { style: { flex: 1, position: 'relative', background: '#222', border: '3px solid #555' } });
            wrap.appendChild(left); wrap.appendChild(right); ctx.stage.appendChild(wrap);
            ctx.setScore(`ROUND 0/${total}`);
            let target = null; // {x,y} relative to either side
            let timer = null;
            function buildSide(side, hide) {
                side.innerHTML = '';
                for (let i = 0; i < 12; i++) {
                    const x = randInt(20, 280), y = randInt(20, 380);
                    const sh = ctx.el('div', { style: { position: 'absolute', left: x+'px', top: y+'px', width: '24px', height: '24px', background: pick(['#e23a3a','#3a72e2','#3ae26a','#e2c83a','#cc3aee']), border: '2px solid #000' } });
                    side.appendChild(sh);
                }
                if (!hide) {
                    target = { x: randInt(20, 280), y: randInt(20, 380) };
                    const star = ctx.el('div', { style: { position: 'absolute', left: target.x+'px', top: target.y+'px', width: '36px', height: '36px', background: '#fff', border: '3px solid #ff3a3a', cursor: 'pointer' }, onclick: () => onFound() });
                    side.appendChild(star);
                }
            }
            function onFound() {
                if (timer) ctx.clearTimeout(timer);
                sfx.win(); round++; ctx.setScore(`ROUND ${round}/${total}`);
                if (round >= total) { ctx.timeout(() => ctx.win(), 400); return; }
                ctx.timeout(start, 500);
            }
            function start() {
                buildSide(left, true); buildSide(right, false);
                timer = ctx.timeout(() => { sfx.lose(); ctx.lose(); }, 3000);
            }
            start();
        }
    };

    // 27. Story Recall
    M.story_recall = {
        title: 'STORY RECALL',
        desc: 'Read the story carefully. You have 30 seconds. Then answer 5 questions (need 4+).',
        run(ctx) {
            const stories = [
                { story: "MARA found a brass key under the third floor stairs at 4:45 PM. The key opened a red door behind the BOILER ROOM, where she discovered a ledger listing 12 names and a SILVER coin dated 1947. She hid the coin in her left coat pocket and ran to find her brother NOAH.", q: [
                    { q: "Whose name was the protagonist?", a: ["MARA","NOAH","ASYLBI","THE GIRL"], c: 0 },
                    { q: "What time did she find the key?", a: ["4:00 PM","4:45 PM","5:15 PM","6:30 PM"], c: 1 },
                    { q: "How many names were in the ledger?", a: ["8","10","12","20"], c: 2 },
                    { q: "What year was the coin dated?", a: ["1939","1947","1953","1962"], c: 1 },
                    { q: "Where did she hide the coin?", a: ["Right pocket","Left pocket","Her shoe","A drawer"], c: 1 },
                ]},
            ];
            const s = pick(stories);
            const story = ctx.el('div', { style: { position: 'absolute', inset: '20px 30px 70px', color: '#e0d0b0', fontFamily: 'VT323, monospace', fontSize: '24px', lineHeight: 1.4, padding: '20px', background: '#1a1408', border: '3px solid #3a2418', overflow: 'auto' }, text: s.story });
            ctx.stage.appendChild(story);
            ctx.setScore('READING');
            let t = 30; ctx.setTimer(`TIME ${t}`);
            const id = ctx.interval(() => { t--; ctx.setTimer(`TIME ${Math.max(0,t)}`); if (t <= 0) { ctx.clearInterval(id); ask(); } }, 1000);
            const skip = pxBtn('I REMEMBER', () => { ctx.clearInterval(id); ask(); });
            skip.style.cssText += 'position:absolute;bottom:15px;left:50%;transform:translateX(-50%)';
            ctx.stage.appendChild(skip);
            function ask() {
                ctx.stage.innerHTML = '';
                let i = 0, ok = 0;
                function next() {
                    if (i >= s.q.length) { ok >= 4 ? ctx.win() : ctx.lose(); return; }
                    const item = s.q[i];
                    const wrap = ctx.el('div', { style: { position: 'absolute', inset: '40px 50px', display: 'flex', flexDirection: 'column', justifyContent: 'center' } });
                    const ql = ctx.el('div', { style: { color: '#fff', fontFamily: 'VT323, monospace', fontSize: '32px', textAlign: 'center', marginBottom: '24px' }, text: item.q });
                    const opts = ctx.el('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' } });
                    item.a.forEach((a, k) => {
                        const b = pxBtn(a, () => { if (k === item.c) ok++; sfx.tick(); i++; ctx.stage.innerHTML = ''; next(); });
                        opts.appendChild(b);
                    });
                    wrap.appendChild(ql); wrap.appendChild(opts); ctx.stage.appendChild(wrap);
                    ctx.setScore(`Q ${i+1}/${s.q.length}`);
                }
                next();
            }
        }
    };

    // 28. Sound Sequence — beeps + buttons
    M.sound_sequence = {
        title: 'SOUND SEQUENCE',
        desc: 'Listen to 5 tones. Reproduce by tapping the numbered keys.',
        run(ctx) {
            const tones = [262, 330, 392, 494, 587]; // C E G B D
            const seq = Array.from({ length: 5 }, () => randInt(0, 4));
            const status = ctx.el('div', { style: { position: 'absolute', top: '60px', width: '100%', textAlign: 'center', color: '#fff', fontFamily: 'VT323, monospace', fontSize: '40px' }, text: 'LISTEN' });
            ctx.stage.appendChild(status);
            const grid = ctx.el('div', { style: { position: 'absolute', top: '180px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '14px' } });
            const btns = [];
            for (let i = 0; i < 5; i++) {
                const b = ctx.el('button', { style: { width: '110px', height: '180px', background: '#3a72e2', border: '4px solid #1a4a9a', color: '#fff', fontFamily: 'VT323, monospace', fontSize: '40px', cursor: 'pointer' }, text: String(i + 1), onclick: () => onTap(i) });
                btns.push(b); grid.appendChild(b);
            }
            ctx.stage.appendChild(grid);
            ctx.setScore(`STEP 0/5`);
            let watching = true; let p = 0;
            function flashI(i) { btns[i].style.background = '#3ae26a'; ctx.timeout(() => { btns[i].style.background = '#3a72e2'; }, 280); beep(tones[i], 0.25, 'sine', 0.06); }
            let i = 0;
            const id = ctx.interval(() => {
                if (i < seq.length) { flashI(seq[i]); i++; }
                else { ctx.clearInterval(id); ctx.timeout(() => { watching = false; status.textContent = 'REPEAT'; }, 400); }
            }, 600);
            function onTap(i) {
                if (watching) return;
                flashI(i);
                if (i === seq[p]) { p++; ctx.setScore(`STEP ${p}/5`); if (p >= seq.length) ctx.timeout(() => ctx.win(), 400); }
                else { sfx.lose(); ctx.timeout(() => ctx.lose(), 400); }
            }
        }
    };

    // 29. Color Memory
    M.color_memory = {
        title: 'COLOR MEMORY',
        desc: 'Watch 8 colors, reproduce them in exact order.',
        run(ctx) {
            const palette = [
                { id: 0, hex: '#e23a3a', name: 'RED' },
                { id: 1, hex: '#3a72e2', name: 'BLUE' },
                { id: 2, hex: '#3ae26a', name: 'GREEN' },
                { id: 3, hex: '#e2c83a', name: 'YELLOW' },
                { id: 4, hex: '#cc3aee', name: 'PURPLE' },
                { id: 5, hex: '#ff9933', name: 'ORANGE' },
            ];
            const seq = Array.from({ length: 8 }, () => randInt(0, palette.length - 1));
            const status = ctx.el('div', { style: { position: 'absolute', top: '40px', width: '100%', textAlign: 'center', color: '#fff', fontFamily: 'VT323, monospace', fontSize: '40px' }, text: 'WATCH' });
            const big = ctx.el('div', { style: { position: 'absolute', top: '110px', left: '50%', transform: 'translateX(-50%)', width: '240px', height: '240px', background: '#222', border: '6px solid #555' } });
            ctx.stage.appendChild(status); ctx.stage.appendChild(big);
            ctx.setScore(`STEP 0/8`);
            let i = 0;
            const id = ctx.interval(() => {
                if (i < seq.length) { big.style.background = palette[seq[i]].hex; ctx.timeout(() => { big.style.background = '#222'; }, 400); i++; }
                else { ctx.clearInterval(id); ctx.timeout(repeat, 600); }
            }, 700);
            let p = 0;
            function repeat() {
                status.textContent = 'TAP IN ORDER'; big.remove();
                const grid = ctx.el('div', { style: { position: 'absolute', top: '110px', left: '50%', transform: 'translateX(-50%)', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' } });
                palette.forEach(p => {
                    const b = ctx.el('button', { style: { width: '120px', height: '120px', background: p.hex, border: '4px solid #555', cursor: 'pointer' }, onclick: () => onTap(p.id) });
                    grid.appendChild(b);
                });
                ctx.stage.appendChild(grid);
            }
            function onTap(c) {
                if (c === seq[p]) { p++; ctx.setScore(`STEP ${p}/8`); sfx.tick(); if (p >= seq.length) ctx.timeout(() => ctx.win(), 400); }
                else { sfx.lose(); ctx.timeout(() => ctx.lose(), 400); }
            }
        }
    };

    // 30. Word Recall
    M.word_recall = {
        title: 'WORD RECALL',
        desc: 'Memorize 12 words in 10 seconds. Pick at least 8 from a 24-word grid.',
        run(ctx) {
            const all = ['BREAD','ANCHOR','PRISM','MEADOW','LANTERN','WHISPER','MARBLE','HARBOR','THUNDER','CIPHER','ORCHID','VELVET','PEBBLE','HORIZON','MIRROR','EMBER','RIVER','SHADOW','COMPASS','FROST','CRIMSON','SPIRAL','MOSAIC','LATTICE','PEPPER','BISON','CACTUS','DAGGER','EAGLE','FOREST'];
            shuffle(all);
            const target = all.slice(0, 12); const distract = all.slice(12, 24);
            const display = ctx.el('div', { style: { position: 'absolute', inset: '40px 60px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', alignContent: 'center' } });
            target.forEach(w => display.appendChild(ctx.el('div', { style: { color: '#3ae26a', fontFamily: 'VT323, monospace', fontSize: '34px', textAlign: 'center', padding: '8px', background: '#1a2418', border: '2px solid #2a4a2a' }, text: w })));
            ctx.stage.appendChild(display);
            ctx.setScore('STUDY');
            let t = 10; ctx.setTimer(`TIME ${t}`);
            const id = ctx.interval(() => { t--; ctx.setTimer(`TIME ${Math.max(0,t)}`); if (t <= 0) { ctx.clearInterval(id); pick(); } }, 1000);
            function pick() {
                ctx.stage.innerHTML = '';
                ctx.setScore('PICKED 0/12');
                const all24 = shuffle([...target, ...distract]);
                const grid = ctx.el('div', { style: { position: 'absolute', inset: '20px 30px 70px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gridTemplateRows: 'repeat(6,1fr)', gap: '6px' } });
                const picked = new Set();
                all24.forEach(w => {
                    const b = ctx.el('button', { style: { background: '#1a1a1a', color: '#fff', border: '2px solid #555', fontFamily: 'VT323, monospace', fontSize: '20px', cursor: 'pointer' }, text: w, onclick: () => {
                        if (picked.has(w)) { picked.delete(w); b.style.background = '#1a1a1a'; b.style.borderColor = '#555'; }
                        else { picked.add(w); b.style.background = '#1a3a1a'; b.style.borderColor = '#3ae26a'; }
                        ctx.setScore(`PICKED ${picked.size}/12`);
                    } });
                    grid.appendChild(b);
                });
                ctx.stage.appendChild(grid);
                const submit = pxBtn('SUBMIT', () => {
                    let correct = 0; for (const w of picked) if (target.includes(w)) correct++;
                    correct >= 8 ? ctx.win() : ctx.lose();
                });
                submit.style.cssText += 'position:absolute;bottom:15px;left:50%;transform:translateX(-50%)';
                ctx.stage.appendChild(submit);
            }
        }
    };

    // -------------------- PATTERN RECOGNITION (10) --------------------

    // 31. Color Rules — tap shapes that match shifting rule
    M.color_rules = {
        title: 'COLOR RULES',
        desc: 'Tap shapes matching the current rule. Rule shifts after every 5 hits.',
        run(ctx) {
            const colors = [{n:'RED',h:'#e23a3a'},{n:'BLUE',h:'#3a72e2'},{n:'GREEN',h:'#3ae26a'},{n:'YELLOW',h:'#e2c83a'}];
            const shapes = ['SQUARE','CIRCLE','TRIANGLE'];
            let rule = randomRule(); let score = 0; let need = 15; let lastShift = 0;
            const ruleEl = ctx.el('div', { style: { position: 'absolute', top: '20px', width: '100%', textAlign: 'center', color: '#fff', fontFamily: 'VT323, monospace', fontSize: '28px', letterSpacing: '4px' } });
            ctx.stage.appendChild(ruleEl);
            const board = ctx.el('div', { style: { position: 'absolute', inset: '70px 30px 30px', position: 'absolute' } });
            ctx.stage.appendChild(board);
            ctx.setScore(`HITS 0/${need}`);
            function randomRule() { return Math.random() < 0.5 ? { type: 'color', val: pick(colors) } : { type: 'shape', val: pick(shapes) }; }
            function refreshRule() { ruleEl.textContent = rule.type === 'color' ? `TAP ${rule.val.n}` : `TAP ${rule.val}`; ruleEl.style.color = rule.type === 'color' ? rule.val.h : '#fff'; }
            refreshRule();
            function refresh() {
                board.innerHTML = '';
                for (let i = 0; i < 12; i++) {
                    const col = pick(colors); const sh = pick(shapes);
                    const matches = (rule.type === 'color' && col.n === rule.val.n) || (rule.type === 'shape' && sh === rule.val);
                    const x = randInt(20, 720), y = randInt(20, 440);
                    const el = ctx.el('button', { style: { position: 'absolute', left: x+'px', top: y+'px', width: '60px', height: '60px', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 } });
                    el.appendChild(drawShape(sh, col.h));
                    ctx.on(el, 'click', () => {
                        if (matches) { score++; sfx.hit(); ctx.setScore(`HITS ${score}/${need}`); el.remove(); if (score >= need) ctx.timeout(() => ctx.win(), 300); else if (score - lastShift >= 5) { lastShift = score; rule = randomRule(); refreshRule(); refresh(); } }
                        else { sfx.lose(); ctx.timeout(() => ctx.lose(), 400); }
                    });
                    board.appendChild(el);
                }
            }
            function drawShape(sh, hex) {
                const c = document.createElement('div'); c.style.cssText = `width:60px;height:60px;background:${hex};`;
                if (sh === 'CIRCLE') c.style.borderRadius = '50%';
                if (sh === 'TRIANGLE') { c.style.background = 'transparent'; c.style.borderLeft = '30px solid transparent'; c.style.borderRight = '30px solid transparent'; c.style.borderBottom = `60px solid ${hex}`; c.style.height = '0'; c.style.width = '0'; }
                return c;
            }
            refresh();
            countdown(ctx, 60, 'TIME', () => score >= need ? ctx.win() : ctx.lose());
        }
    };

    // 32. Math Sprint
    M.math_sprint = {
        title: 'MATH SPRINT',
        desc: 'Solve 15 problems in 60 seconds. Wrong = -3 seconds.',
        run(ctx) {
            let score = 0; const need = 15;
            const probEl = ctx.el('div', { style: { position: 'absolute', top: '120px', width: '100%', textAlign: 'center', color: '#fff', fontFamily: 'VT323, monospace', fontSize: '72px' } });
            const opts = ctx.el('div', { style: { position: 'absolute', top: '280px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '20px' } });
            ctx.stage.appendChild(probEl); ctx.stage.appendChild(opts);
            ctx.setScore(`SOLVED 0/${need}`);
            const cd = countdown(ctx, 60, 'TIME', () => score >= need ? ctx.win() : ctx.lose());
            function next() {
                if (score >= need) { ctx.timeout(() => ctx.win(), 400); return; }
                const op = pick(['+','-','×']);
                let a, b, ans;
                if (op === '+') { a = randInt(2, 50); b = randInt(2, 50); ans = a + b; }
                else if (op === '-') { a = randInt(20, 80); b = randInt(2, a - 1); ans = a - b; }
                else { a = randInt(2, 12); b = randInt(2, 12); ans = a * b; }
                probEl.textContent = `${a} ${op} ${b}`;
                const wrong = new Set();
                while (wrong.size < 3) { const d = randInt(-8, 8); if (d === 0) continue; const v = ans + d; if (v < 0 || v === ans) continue; wrong.add(v); }
                const choices = shuffle([ans, ...wrong]);
                opts.innerHTML = '';
                choices.forEach(v => {
                    const b = pxBtn(String(v), () => {
                        if (v === ans) { score++; sfx.hit(); ctx.setScore(`SOLVED ${score}/${need}`); next(); }
                        else { cd.add(-3); sfx.bad(); }
                    });
                    b.style.fontSize = '28px';
                    opts.appendChild(b);
                });
            }
            next();
        }
    };

    // 33. Spot the Imposter — 20 icons grid, find odd one
    M.spot_imposter = {
        title: 'SPOT THE IMPOSTER',
        desc: 'One icon differs from the other 19. Find it. 5 rounds.',
        run(ctx) {
            let round = 0; const total = 5;
            const grid = ctx.el('div', { style: { position: 'absolute', inset: '40px 80px', display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gridTemplateRows: 'repeat(4,1fr)', gap: '8px' } });
            ctx.stage.appendChild(grid);
            ctx.setScore(`ROUND 0/${total}`);
            function start() {
                grid.innerHTML = '';
                const baseColor = pick(['#e23a3a','#3a72e2','#3ae26a','#e2c83a','#cc3aee']);
                const altColor = baseColor === '#e23a3a' ? '#cc2828' : '#e23a3a'; // close shade for easy difficulty
                const oddIdx = randInt(0, 19);
                for (let i = 0; i < 20; i++) {
                    const isOdd = i === oddIdx;
                    const c = ctx.el('button', { style: { background: isOdd ? altColor : baseColor, border: '3px solid #1a1a1a', cursor: 'pointer' }, onclick: () => {
                        if (isOdd) { sfx.win(); round++; ctx.setScore(`ROUND ${round}/${total}`); if (round >= total) { ctx.timeout(() => ctx.win(), 400); return; } ctx.timeout(start, 400); }
                        else { sfx.lose(); ctx.timeout(() => ctx.lose(), 400); }
                    } });
                    grid.appendChild(c);
                }
            }
            start();
            countdown(ctx, 60, 'TIME', () => round >= total ? ctx.win() : ctx.lose());
        }
    };

    // 34. Sequence Completion
    M.sequence_completion = {
        title: 'SEQUENCE COMPLETION',
        desc: 'Pick the next term. 5 sequences in 90s.',
        run(ctx) {
            const probs = [
                { seq: '2 4 6 8 ?', ans: '10', wrong: ['9','12','14','16'] },
                { seq: '1 1 2 3 5 ?', ans: '8', wrong: ['6','7','9','13'] },
                { seq: '3 6 12 24 ?', ans: '48', wrong: ['36','40','30','60'] },
                { seq: '1 4 9 16 ?', ans: '25', wrong: ['20','22','30','36'] },
                { seq: '100 81 64 49 ?', ans: '36', wrong: ['25','40','35','42'] },
                { seq: '2 3 5 7 11 ?', ans: '13', wrong: ['12','15','17','9'] },
                { seq: '1 2 4 7 11 ?', ans: '16', wrong: ['14','15','17','18'] },
                { seq: '5 10 20 40 ?', ans: '80', wrong: ['60','70','100','45'] },
            ];
            shuffle(probs);
            let i = 0, ok = 0; const need = 5;
            ctx.setScore(`SOLVED 0/${need}`);
            const probEl = ctx.el('div', { style: { position: 'absolute', top: '120px', width: '100%', textAlign: 'center', color: '#fff', fontFamily: 'VT323, monospace', fontSize: '56px', letterSpacing: '8px' } });
            const opts = ctx.el('div', { style: { position: 'absolute', top: '270px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '14px' } });
            ctx.stage.appendChild(probEl); ctx.stage.appendChild(opts);
            countdown(ctx, 90, 'TIME', () => ok >= need ? ctx.win() : ctx.lose());
            function next() {
                if (ok >= need) { ctx.timeout(() => ctx.win(), 400); return; }
                if (i >= probs.length) { ctx.timeout(() => ctx.lose(), 400); return; }
                const p = probs[i]; i++;
                probEl.textContent = p.seq;
                const choices = shuffle([p.ans, ...p.wrong.slice(0, 3)]);
                opts.innerHTML = '';
                choices.forEach(v => {
                    const b = pxBtn(v, () => {
                        if (v === p.ans) { ok++; sfx.win(); ctx.setScore(`SOLVED ${ok}/${need}`); next(); }
                        else { sfx.bad(); ctx.timeout(() => ctx.lose(), 400); }
                    });
                    b.style.fontSize = '28px'; opts.appendChild(b);
                });
            }
            next();
        }
    };

    // 35. Symbol Decoder
    M.symbol_decoder = {
        title: 'SYMBOL DECODER',
        desc: 'Use the key to decode 3 short messages.',
        run(ctx) {
            const symbols = ['▲','●','■','◆','★','♥','♣','✚','◀','▶'];
            // Build random key A..J → symbols
            const letters = ['A','B','C','D','E','F','G','H','I','J'];
            shuffle(symbols);
            const key = {}; letters.forEach((l, i) => key[l] = symbols[i]);
            const messages = ['CAGE','DEAD','FACE','HEAD','BEAD','HIDE','BAGE','FADE'];
            shuffle(messages);
            const targets = messages.slice(0, 3);
            let i = 0; let ok = 0;
            const keyEl = ctx.el('div', { style: { position: 'absolute', top: '20px', left: '20px', right: '20px', display: 'grid', gridTemplateColumns: 'repeat(10,1fr)', gap: '4px', color: '#fff', fontFamily: 'VT323, monospace', fontSize: '24px', textAlign: 'center' } });
            for (const l of letters) keyEl.appendChild(ctx.el('div', { style: { padding: '4px', background: '#1a1a1a', border: '2px solid #444' }, html: `${l}<br/>${key[l]}` }));
            ctx.stage.appendChild(keyEl);
            const probEl = ctx.el('div', { style: { position: 'absolute', top: '180px', width: '100%', textAlign: 'center', color: '#3ae26a', fontFamily: 'VT323, monospace', fontSize: '64px', letterSpacing: '14px' } });
            const opts = ctx.el('div', { style: { position: 'absolute', top: '300px', left: '50%', transform: 'translateX(-50%)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' } });
            ctx.stage.appendChild(probEl); ctx.stage.appendChild(opts);
            ctx.setScore(`DECODED 0/3`);
            function next() {
                if (i >= 3) { ok >= 3 ? ctx.win() : ctx.lose(); return; }
                const m = targets[i]; i++;
                probEl.textContent = m.split('').map(l => key[l]).join(' ');
                const choices = shuffle([m, ...messages.filter(x => x !== m).slice(0, 3)]);
                opts.innerHTML = '';
                choices.forEach(v => {
                    const b = pxBtn(v, () => { if (v === m) { ok++; sfx.win(); ctx.setScore(`DECODED ${ok}/3`); next(); } else { sfx.bad(); ctx.timeout(() => ctx.lose(), 400); } });
                    b.style.fontSize = '28px'; opts.appendChild(b);
                });
            }
            next();
        }
    };

    // 36. Sorting — falling items into 3 bins
    M.sorting = {
        title: 'SORTING',
        desc: 'Tap each falling item with its matching colored bin button. 60s, 25 needed.',
        run(ctx) {
            const colors = [{n:'R',h:'#e23a3a'},{n:'B',h:'#3a72e2'},{n:'G',h:'#3ae26a'}];
            const items = []; let score = 0; const need = 25; let speed = 60; let dead = false;
            ctx.setScore(`SORTED 0/${need}`);
            const board = ctx.el('div', { style: { position: 'absolute', inset: '0 0 80px 0', overflow: 'hidden' } });
            ctx.stage.appendChild(board);
            const bins = ctx.el('div', { style: { position: 'absolute', bottom: '0', width: '100%', display: 'flex', justifyContent: 'space-around', height: '70px' } });
            colors.forEach(c => {
                const b = ctx.el('button', { style: { width: '180px', background: c.h, border: '4px solid #000', color: '#000', fontFamily: 'VT323, monospace', fontSize: '32px', cursor: 'pointer' }, text: c.n + ' BIN', onclick: () => sortNow(c.n) });
                bins.appendChild(b);
            });
            ctx.stage.appendChild(bins);
            function sortNow(col) {
                if (dead) return;
                // sort the lowest item — must match
                if (!items.length) return;
                const it = items[0];
                if (it.col === col) { score++; sfx.hit(); ctx.setScore(`SORTED ${score}/${need}`); items.shift(); it.el.remove(); if (score >= need) { dead = true; ctx.timeout(() => ctx.win(), 200); } }
                else { sfx.lose(); dead = true; ctx.timeout(() => ctx.lose(), 300); }
            }
            ctx.interval(() => {
                if (dead) return;
                const c = pick(colors);
                const x = randInt(40, 720);
                const el = ctx.el('div', { style: { position: 'absolute', left: x+'px', top: '-40px', width: '40px', height: '40px', background: c.h, border: '3px solid #000' } });
                board.appendChild(el);
                items.push({ el, col: c.n, x, y: -40 });
            }, 900);
            countdown(ctx, 60, 'TIME', () => score >= need ? ctx.win() : ctx.lose());
            ctx.loop((dt) => {
                if (dead) return;
                speed += dt * 4;
                for (const it of items) { it.y += speed * dt; it.el.style.top = it.y + 'px'; }
                if (items.length && items[0].y > 480) { dead = true; sfx.lose(); ctx.timeout(() => ctx.lose(), 300); }
            });
        }
    };

    // 37. Flow Connect — drag colored dots to pair, no crossing
    M.flow_connect = {
        title: 'FLOW CONNECT',
        desc: 'Drag from each dot to its same-color pair. No crossing lines. 5 puzzles.',
        run(ctx) {
            // Each puzzle: 3 colors, 6 dots placed; player draws lines; we just check pairs were each drawn.
            let round = 0; const total = 5;
            ctx.setScore(`PUZZLE 0/${total}`);
            const { c, g } = mkCanvas(ctx);
            let pairs = [], paths = []; // paths[i] = [{x,y},...]
            let drawing = null; // {color, idx, points}
            function makePuzzle() {
                pairs = []; paths = [];
                const colors = ['#e23a3a','#3a72e2','#3ae26a'];
                colors.forEach((col, i) => {
                    const a = { x: randInt(60, 740), y: randInt(60, 510), color: col, group: i };
                    let b; do { b = { x: randInt(60, 740), y: randInt(60, 510), color: col, group: i }; } while (Math.hypot(a.x - b.x, a.y - b.y) < 200);
                    pairs.push(a, b);
                    paths.push(null); // path for group i
                });
                draw();
            }
            function draw() {
                g.fillStyle = '#0a0a0a'; g.fillRect(0, 0, ctx.W, ctx.H);
                for (let i = 0; i < paths.length; i++) {
                    const p = paths[i]; if (!p || p.length < 2) continue;
                    const col = pairs[i*2].color;
                    g.strokeStyle = col; g.lineWidth = 8; g.beginPath();
                    g.moveTo(p[0].x, p[0].y); for (let k = 1; k < p.length; k++) g.lineTo(p[k].x, p[k].y); g.stroke();
                }
                for (const d of pairs) { g.fillStyle = d.color; g.fillRect(d.x - 18, d.y - 18, 36, 36); g.strokeStyle = '#fff'; g.lineWidth = 3; g.strokeRect(d.x - 18, d.y - 18, 36, 36); }
                if (drawing) {
                    const col = pairs[drawing.idx * 2].color;
                    g.strokeStyle = col; g.lineWidth = 8; g.beginPath();
                    g.moveTo(drawing.points[0].x, drawing.points[0].y);
                    for (let k = 1; k < drawing.points.length; k++) g.lineTo(drawing.points[k].x, drawing.points[k].y);
                    g.stroke();
                }
            }
            ctx.on(c, 'pointerdown', (e) => {
                const r = c.getBoundingClientRect();
                const x = (e.clientX - r.left) * (c.width / r.width); const y = (e.clientY - r.top) * (c.height / r.height);
                for (let i = 0; i < pairs.length; i++) {
                    if (Math.abs(x - pairs[i].x) < 22 && Math.abs(y - pairs[i].y) < 22) {
                        drawing = { idx: pairs[i].group, points: [{ x: pairs[i].x, y: pairs[i].y }], startDot: i };
                        return;
                    }
                }
            });
            ctx.on(c, 'pointermove', (e) => {
                if (!drawing) return;
                const r = c.getBoundingClientRect();
                const x = (e.clientX - r.left) * (c.width / r.width); const y = (e.clientY - r.top) * (c.height / r.height);
                drawing.points.push({ x, y }); draw();
            });
            ctx.on(c, 'pointerup', (e) => {
                if (!drawing) return;
                const r = c.getBoundingClientRect();
                const x = (e.clientX - r.left) * (c.width / r.width); const y = (e.clientY - r.top) * (c.height / r.height);
                // find target dot of same group, not the start dot
                const targetIdx = pairs.findIndex((d, k) => k !== drawing.startDot && d.group === drawing.idx && Math.abs(x - d.x) < 30 && Math.abs(y - d.y) < 30);
                if (targetIdx >= 0) { drawing.points.push({ x: pairs[targetIdx].x, y: pairs[targetIdx].y }); paths[drawing.idx] = drawing.points; sfx.hit(); }
                else { sfx.bad(); }
                drawing = null; draw();
                if (paths.every(p => p && p.length >= 2)) {
                    sfx.win(); round++; ctx.setScore(`PUZZLE ${round}/${total}`);
                    if (round >= total) { ctx.timeout(() => ctx.win(), 400); return; }
                    ctx.timeout(makePuzzle, 500);
                }
            });
            countdown(ctx, 90, 'TIME', () => round >= total ? ctx.win() : ctx.lose());
            makePuzzle();
        }
    };

    // 38. Grid Logic — 4x4 Latin square
    M.grid_logic = {
        title: 'GRID LOGIC',
        desc: 'Fill the 4x4 grid: numbers 1-4, no repeats per row or column. 60s.',
        run(ctx) {
            // Generate solved Latin square
            const sol = [[1,2,3,4],[2,1,4,3],[3,4,1,2],[4,3,2,1]];
            shuffle(sol); // shuffle rows
            const cols = [0,1,2,3]; shuffle(cols);
            const arr = sol.map(r => cols.map(c => r[c]));
            const given = arr.map(r => r.map(v => Math.random() < 0.4 ? v : 0));
            const grid = ctx.el('div', { style: { position: 'absolute', top: '40px', left: '50%', transform: 'translateX(-50%)', display: 'grid', gridTemplateColumns: 'repeat(4,80px)', gap: '4px' } });
            const cells = []; let selected = null;
            for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
                const fixed = given[r][c] !== 0;
                const cell = ctx.el('button', { style: { width: '80px', height: '80px', background: fixed ? '#3a3a8a' : '#1a1a1a', color: '#fff', border: '3px solid #555', fontFamily: 'VT323, monospace', fontSize: '40px', cursor: fixed ? 'default' : 'pointer' }, text: fixed ? String(given[r][c]) : '', onclick: () => { if (!fixed) { selected = { r, c, el: cell }; cells.forEach(x => x.el.style.borderColor = '#555'); cell.style.borderColor = '#3ae26a'; } } });
                cells.push({ r, c, el: cell, fixed, val: fixed ? given[r][c] : 0 });
                grid.appendChild(cell);
            }
            ctx.stage.appendChild(grid);
            const pad = ctx.el('div', { style: { position: 'absolute', bottom: '60px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px' } });
            for (let n = 1; n <= 4; n++) {
                const b = pxBtn(String(n), () => {
                    if (!selected) return;
                    selected.el.textContent = String(n);
                    const cell = cells.find(c => c.r === selected.r && c.c === selected.c);
                    cell.val = n; sfx.tick();
                });
                b.style.fontSize = '28px'; pad.appendChild(b);
            }
            const submit = pxBtn('SUBMIT', () => {
                // valid? check rows/cols
                const M2 = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
                for (const c of cells) M2[c.r][c.c] = c.val;
                if (M2.flat().includes(0)) { sfx.bad(); return; }
                for (let r = 0; r < 4; r++) { const s = new Set(M2[r]); if (s.size !== 4) { sfx.lose(); ctx.timeout(() => ctx.lose(), 400); return; } }
                for (let c = 0; c < 4; c++) { const s = new Set([0,1,2,3].map(r => M2[r][c])); if (s.size !== 4) { sfx.lose(); ctx.timeout(() => ctx.lose(), 400); return; } }
                ctx.win();
            });
            submit.style.cssText += 'position:absolute;bottom:10px;left:50%;transform:translateX(-50%)';
            pad.appendChild(submit);
            ctx.stage.appendChild(pad);
            ctx.setScore('LATIN SQUARE');
            countdown(ctx, 60, 'TIME', () => ctx.lose());
        }
    };

    // 39. Analogy Sprint — 10 analogies in 60s
    M.analogy_sprint = {
        title: 'ANALOGY SPRINT',
        desc: 'Solve 10 analogies in 60 seconds.',
        run(ctx) {
            const probs = [
                { q: 'CAT : KITTEN :: DOG : ?', a: 'PUPPY', w: ['HORSE','PONY','CALF'] },
                { q: 'HOT : COLD :: UP : ?', a: 'DOWN', w: ['LEFT','OVER','SIDE'] },
                { q: 'HAND : GLOVE :: FOOT : ?', a: 'SHOE', w: ['SOCK','BOOT','HAT'] },
                { q: 'BIRD : SKY :: FISH : ?', a: 'WATER', w: ['LAND','TREE','NEST'] },
                { q: 'PEN : WRITE :: KNIFE : ?', a: 'CUT', w: ['DRAW','SHARP','STAB'] },
                { q: 'KEY : LOCK :: KEY : ?', a: 'PIANO', w: ['DOOR','RING','LATCH'] },
                { q: 'DOCTOR : HOSPITAL :: TEACHER : ?', a: 'SCHOOL', w: ['STORE','OFFICE','GYM'] },
                { q: 'WHEEL : CAR :: WING : ?', a: 'PLANE', w: ['BIKE','SHIP','SLED'] },
                { q: 'EAR : HEAR :: EYE : ?', a: 'SEE', w: ['LOOK','SHUT','BLINK'] },
                { q: 'SECOND : MINUTE :: MINUTE : ?', a: 'HOUR', w: ['DAY','WEEK','MONTH'] },
                { q: 'WET : DRY :: NIGHT : ?', a: 'DAY', w: ['DARK','MOON','LATE'] },
                { q: 'PAGE : BOOK :: SCENE : ?', a: 'PLAY', w: ['SHOW','SCRIPT','ACT'] },
            ];
            shuffle(probs);
            let i = 0, ok = 0; const need = 8;
            ctx.setScore(`SOLVED 0/${need}`);
            const probEl = ctx.el('div', { style: { position: 'absolute', top: '110px', width: '100%', textAlign: 'center', color: '#fff', fontFamily: 'VT323, monospace', fontSize: '32px' } });
            const opts = ctx.el('div', { style: { position: 'absolute', top: '230px', left: '50%', transform: 'translateX(-50%)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' } });
            ctx.stage.appendChild(probEl); ctx.stage.appendChild(opts);
            countdown(ctx, 60, 'TIME', () => ok >= need ? ctx.win() : ctx.lose());
            function next() {
                if (ok >= need) { ctx.timeout(() => ctx.win(), 400); return; }
                if (i >= probs.length) { ctx.timeout(() => ctx.lose(), 400); return; }
                const p = probs[i]; i++;
                probEl.textContent = p.q;
                const choices = shuffle([p.a, ...p.w.slice(0, 3)]);
                opts.innerHTML = '';
                choices.forEach(v => {
                    const b = pxBtn(v, () => {
                        if (v === p.a) { ok++; sfx.hit(); ctx.setScore(`SOLVED ${ok}/${need}`); next(); }
                        else { sfx.bad(); ctx.timeout(() => ctx.lose(), 400); }
                    });
                    b.style.fontSize = '24px'; opts.appendChild(b);
                });
            }
            next();
        }
    };

    // 40. Password Crack — Mastermind
    M.password_crack = {
        title: 'PASSWORD CRACK',
        desc: 'Guess the 4-digit code in 6 tries. ● = right digit + spot, ○ = right digit, wrong spot.',
        run(ctx) {
            const code = []; while (code.length < 4) { const d = randInt(0, 9); if (!code.includes(d)) code.push(d); }
            const guesses = [];
            const board = ctx.el('div', { style: { position: 'absolute', top: '20px', left: '20px', right: '20px', display: 'flex', flexDirection: 'column', gap: '6px', color: '#fff', fontFamily: 'VT323, monospace', fontSize: '28px' } });
            ctx.stage.appendChild(board);
            const guessEl = ctx.el('div', { style: { position: 'absolute', bottom: '120px', width: '100%', textAlign: 'center', color: '#3ae26a', fontFamily: 'VT323, monospace', fontSize: '60px', letterSpacing: '14px', minHeight: '70px' } });
            const pad = ctx.el('div', { style: { position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '600px' } });
            ctx.stage.appendChild(guessEl); ctx.stage.appendChild(pad);
            let cur = '';
            for (let n = 0; n < 10; n++) {
                const b = pxBtn(String(n), () => { if (cur.length < 4) { cur += n; guessEl.textContent = cur; sfx.tick(); } });
                b.style.fontSize = '24px'; pad.appendChild(b);
            }
            const back = pxBtn('←', () => { cur = cur.slice(0, -1); guessEl.textContent = cur; });
            back.style.fontSize = '24px'; pad.appendChild(back);
            const submit = pxBtn('GUESS', () => {
                if (cur.length !== 4) return;
                const digs = cur.split('').map(Number);
                let exact = 0, partial = 0;
                for (let i = 0; i < 4; i++) if (digs[i] === code[i]) exact++;
                for (const d of new Set(digs)) if (code.includes(d)) partial++;
                partial -= exact;
                guesses.push({ guess: cur, exact, partial });
                board.innerHTML = '';
                for (const g of guesses) board.appendChild(ctx.el('div', { html: `${g.guess.split('').join(' ')} &nbsp;&nbsp; <span style="color:#3ae26a">${'●'.repeat(g.exact)}</span><span style="color:#e2c83a">${'○'.repeat(g.partial)}</span>` }));
                if (exact === 4) { sfx.win(); ctx.timeout(() => ctx.win(), 400); return; }
                if (guesses.length >= 6) { sfx.lose(); ctx.timeout(() => ctx.lose(), 400); return; }
                cur = ''; guessEl.textContent = '';
                ctx.setScore(`TRIES ${6 - guesses.length}`);
            });
            submit.style.fontSize = '24px'; pad.appendChild(submit);
            ctx.setScore(`TRIES 6`);
        }
    };

    // -------------------- LEGACY ORIGINALS (3) --------------------
    // The original Phase 3 had three minigames. They are kept here as
    // distinct, faster/simpler variants alongside the extended versions
    // above so the full registry stays at 43 entries.

    // L1. Reflex Tap (classic) — 10 hits in 10s, single mole roams
    M.reflex_tap = {
        title: 'REFLEX TAP',
        desc: 'Tap 10 moles in 10 seconds. They keep moving.',
        run(ctx) {
            let score = 0; const need = 10;
            ctx.setScore(`SCORE 0/${need}`);
            const area = ctx.el('div', { style: { position: 'absolute', inset: '20px', background: '#1a1408', border: '4px solid #2a1f10' } });
            ctx.stage.appendChild(area);
            let mole = null;
            function spawn() {
                if (mole) mole.remove();
                mole = ctx.el('button', { style: { position: 'absolute', left: rand(20, 700) + 'px', top: rand(20, 480) + 'px', width: '60px', height: '60px', background: '#8b3a1f', border: '4px solid #c95a2f', cursor: 'pointer' }, onclick: () => {
                    if (mole.dataset.hit) return; mole.dataset.hit = '1';
                    score++; sfx.hit(); ctx.setScore(`SCORE ${score}/${need}`);
                    if (score >= need) { ctx.win(); return; }
                    spawn();
                } });
                area.appendChild(mole);
            }
            spawn();
            countdown(ctx, 10, 'TIME', () => score >= need ? ctx.win() : ctx.lose());
        }
    };

    // L2. Math Sprint (classic) — 5 problems, 15s, wrong answer = lose
    M.math_sprint_classic = {
        title: 'MATH SPRINT (CLASSIC)',
        desc: 'Solve 5 problems in 15 seconds. One wrong answer ends it.',
        run(ctx) {
            let score = 0; const need = 5;
            const probEl = ctx.el('div', { style: { position: 'absolute', top: '140px', width: '100%', textAlign: 'center', color: '#fff', fontFamily: 'VT323, monospace', fontSize: '64px' } });
            const opts = ctx.el('div', { style: { position: 'absolute', top: '290px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '20px' } });
            ctx.stage.appendChild(probEl); ctx.stage.appendChild(opts);
            ctx.setScore(`SOLVED 0/${need}`);
            countdown(ctx, 15, 'TIME', () => score >= need ? ctx.win() : ctx.lose());
            function next() {
                if (score >= need) { ctx.timeout(() => ctx.win(), 300); return; }
                const a = randInt(0, 19), b = randInt(0, 19); const ans = a + b;
                probEl.textContent = `${a} + ${b} = ?`;
                const wrongs = new Set();
                while (wrongs.size < 2) { const d = randInt(-5, 5); if (d === 0) continue; wrongs.add(ans + d); }
                const choices = shuffle([ans, ...wrongs]);
                opts.innerHTML = '';
                choices.forEach(v => {
                    const b = pxBtn(String(v), () => {
                        if (v === ans) { score++; sfx.hit(); ctx.setScore(`SOLVED ${score}/${need}`); next(); }
                        else { sfx.lose(); ctx.timeout(() => ctx.lose(), 300); }
                    });
                    b.style.fontSize = '32px'; opts.appendChild(b);
                });
            }
            next();
        }
    };

    // L3. Simon Says (classic) — 4 rounds (length 4)
    M.simon_says_classic = {
        title: 'SIMON SAYS (CLASSIC)',
        desc: 'Watch the sequence, then repeat. 4 rounds.',
        run(ctx) {
            const seq = []; let pStep = 0; const TARGET = 4; let watching = true;
            const colors = ['#e23a3a', '#3a72e2', '#3ae26a', '#e2c83a'];
            const grid = ctx.el('div', { style: { position: 'absolute', top: '120px', left: '50%', transform: 'translateX(-50%)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' } });
            const msg = ctx.el('div', { style: { position: 'absolute', top: '50px', width: '100%', textAlign: 'center', color: '#fff', fontFamily: 'VT323, monospace', fontSize: '36px', letterSpacing: '4px' }, text: 'WATCH' });
            const btns = colors.map((col, i) => {
                const b = ctx.el('button', { style: { width: '170px', height: '170px', background: col, opacity: 0.4, border: 'none', cursor: 'pointer', transition: 'opacity 0.1s' }, onclick: () => onTap(i) });
                grid.appendChild(b); return b;
            });
            ctx.stage.appendChild(grid); ctx.stage.appendChild(msg);
            ctx.setScore(`ROUND 0/${TARGET}`);
            function flash(i) { btns[i].style.opacity = 1; ctx.timeout(() => { btns[i].style.opacity = 0.4; }, 300); beep(220 + i * 110, 0.2, 'square', 0.05); }
            function play() {
                watching = true; msg.textContent = 'WATCH'; pStep = 0;
                seq.push(randInt(0, 3));
                ctx.setScore(`ROUND ${seq.length-1}/${TARGET}`);
                let i = 0;
                const id = ctx.interval(() => {
                    if (i < seq.length) { flash(seq[i]); i++; }
                    else { ctx.clearInterval(id); ctx.timeout(() => { watching = false; msg.textContent = 'REPEAT'; }, 300); }
                }, 700);
            }
            function onTap(i) {
                if (watching) return; flash(i);
                if (i === seq[pStep]) {
                    pStep++;
                    if (pStep === seq.length) {
                        if (seq.length >= TARGET) { ctx.timeout(() => ctx.win(), 400); return; }
                        ctx.timeout(play, 800);
                    }
                } else { sfx.lose(); ctx.timeout(() => ctx.lose(), 400); }
            }
            play();
        }
    };

    // -------------------- expose --------------------
    window.MINIGAMES = M;
})();
