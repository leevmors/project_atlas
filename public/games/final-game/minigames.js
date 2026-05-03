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
        let t = secs; let done = false;
        ctx.setTimer(`${label} ${t}`);
        function fire() { if (done) return; done = true; ctx.clearInterval(id); if (onZero) onZero(); }
        const id = ctx.interval(() => {
            if (done) return;
            t--;
            ctx.setTimer(`${label} ${Math.max(0, t)}`);
            if (t <= 0) fire();
        }, 1000);
        return { add: (s) => { if (done) return; t += s; ctx.setTimer(`${label} ${Math.max(0, t)}`); if (t <= 0) fire(); }, get: () => t, stop: () => { done = true; ctx.clearInterval(id); }, isDone: () => done };
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
    // PIXEL SPRITE SYSTEM
    // Each sprite is a small grid of chars; chars index a palette.
    // '.' = transparent. Cached as offscreen canvas + data URL.
    // =============================================================
    const SPR_DEFS = {
        // ---- creatures ----
        bird: { pal: { '.': null, y: '#ffcc33', o: '#cc7700', k: '#000', w: '#fff', r: '#e23a3a' }, rows: [
            '....yyyyy...',
            '...yywwwwy..',
            '..yywkwwwy..',
            'yyyyywwwyooo',
            'yyyyyyyyyoor',
            'yyyyyyyyyooo',
            '.yyyyyyyy...',
            '..oooooo....',
            '....oo......',
        ]},
        abird: { pal: { '.': null, r: '#e23a3a', d: '#8a1010', k: '#000', w: '#fff', y: '#ffcc33' }, rows: [
            '...rrrrrr...',
            '..rrrrrrrr..',
            '.rrwwrrwwrr.',
            '.rrwkrrwkrr.',
            'rrrrrrrrrrry',
            'rrrrrrrrrrry',
            'rdrrrrrrrrd.',
            '.dddrrrdddd.',
            '..dd.....d..',
            '...d........',
        ]},
        mole: { pal: { '.': null, b: '#5a2a10', l: '#8b3a1f', t: '#c95a2f', k: '#000', w: '#fff', p: '#ff70a0' }, rows: [
            '...llllll...',
            '..lltttttl..',
            '.lltttttttl.',
            'llttttttttll',
            'lltwktttkwll',
            'lltttpptttll',
            'lltttbttttll',
            'lltttttttttl',
            '.lllllllllll',
            '..bb....bb..',
            '..bb....bb..',
        ]},
        bug: { pal: { '.': null, k: '#1a1a1a', b: '#3a1a08', d: '#5a2a10', r: '#e23a3a' }, rows: [
            'k...kk...k..',
            '.kkkbbkk.k..',
            '..kbbbbk....',
            '.kdrbbrdk...',
            'kdrbbbbrdk..',
            'kdrbbbbrdk..',
            '.kdbbbbdk...',
            '..kbbbbk....',
            '.k.kbbk.k...',
            'k...kk...k..',
        ]},
        // ---- food / fruit ----
        apple: { pal: { '.': null, r: '#e23a3a', d: '#8a1010', g: '#3aa84a', l: '#ff7070', s: '#5a2a10' }, rows: [
            '......s.....',
            '.....sg.....',
            '....rrrrr...',
            '..rrlrrrrr..',
            '.rrlrrrrrrr.',
            'rrlrrrrrrrrr',
            'rrlrrrrrrrrr',
            'rrrrrrrrrrdd',
            '.rrrrrrrrdd.',
            '..rrrrrrdd..',
            '...rrrrdd...',
            '....rrrr....',
        ]},
        watermelon: { pal: { '.': null, g: '#1a4a1a', l: '#3aa84a', p: '#ff5a78', d: '#c93050', k: '#000', w: '#fff' }, rows: [
            '..............',
            '....pppppp....',
            '..pppwppwppp..',
            '.ppwpkpkpppppd',
            'pppppppppppppd',
            'ppppkpppkppppd',
            'lppppppppppppd',
            'glllllllllldd.',
            'gggggggggggg..',
            '..............',
        ]},
        lime: { pal: { '.': null, g: '#3aa84a', l: '#5fdf6a', d: '#1a4a1a', w: '#bfffaa' }, rows: [
            '....dggdd...',
            '...dgggggdd.',
            '..dggwgggggd',
            '.dggwlllgggd',
            '.dgwlllllgdd',
            'dgglllllggdd',
            'dgglllllggdd',
            'dgglllllgddd',
            '.dgggggggdd.',
            '.ddggggggdd.',
            '..dddgggdd..',
            '....dddd....',
        ]},
        orange: { pal: { '.': null, o: '#ff9933', d: '#cc6600', l: '#ffcc77', g: '#3aa84a', s: '#5a2a10' }, rows: [
            '....sgg.....',
            '...sggg.....',
            '..oolllooo..',
            '.oloolloldo.',
            'oollloolldoo',
            'oolllooolldo',
            'oollooolldoo',
            'olloollolldo',
            '.oollllllod.',
            '..oddddddo..',
            '...ddooddd..',
            '.....dd.....',
        ]},
        bomb: { pal: { '.': null, k: '#1a1a1a', d: '#3a3a3a', s: '#5a5a5a', y: '#ffcc33', r: '#ff3a3a', o: '#ff7700' }, rows: [
            '......yyy...',
            '.....ryory..',
            '......yyy...',
            '....kkkkkk..',
            '...kkkksskk.',
            '..kkdkkksskk',
            '..kkkksskkkk',
            '..kkkkkkkkkk',
            '..kkkkkkkkkk',
            '...kkkkkkkk.',
            '....kkkkkk..',
            '............',
        ]},
        // ---- balloon ----
        balloon: { pal: { '.': null, b: '#000', a: '#e23a3a', l: '#ff8a8a', d: '#a01010' }, rows: [
            '...aaaaaa...',
            '..allaaaaa..',
            '.allaaaaaad.',
            'allaaaaaaaad',
            'aalaaaaaaaad',
            'aaaaaaaaaaad',
            'aaaaaaaaaaad',
            'aaaaaaaaaadd',
            '.aaaaaaaadd.',
            '.aaaaaaadd..',
            '..aaaaadd...',
            '...aaaad....',
            '....aaa.....',
            '.....b......',
            '....b.......',
            '...b........',
            '....b.......',
            '.....b......',
        ]},
        // ---- objects ----
        woodblock: { pal: { '.': null, l: '#c8924a', m: '#a87a3a', d: '#5a3a1f', k: '#3a2010' }, rows: [
            'kkkkkkkkkkkkkkkk',
            'kdmmmmmmmmmmmmdk',
            'kdlmmlmmmmlmmmdk',
            'kdmmmlmmmlmmmmdk',
            'kdmmmmllmmmmmmdk',
            'kdlmmmmmmmlmmmdk',
            'kdmmmlmmmmmlmmdk',
            'kdmmmmmmlmmmmmdk',
            'kdmlmmmmmlmmmmdk',
            'kdmmmmllmmmmmmdk',
            'kdmmmlmmmmmmlmdk',
            'kdmmlmmmmmlmmmdk',
            'kdmmmmmmmmmmmmdk',
            'kdlmmmmmlmmmlmdk',
            'kddddddddddddddk',
            'kkkkkkkkkkkkkkkk',
        ]},
        brick: { pal: { '.': null, l: '#7a4a8a', m: '#5a3a8a', d: '#3a1a5a', k: '#1a0a30' }, rows: [
            'kkkkkkkkkkkkkkkk',
            'kllmmmmmmmmmmllk',
            'kdmmmmmmmmmmmmdk',
            'kdmmmmmmmmmmmmdk',
            'kdmmmmmmmmmmmmdk',
            'kdmmmmmmmmmmmmdk',
            'kdmmmmmmmmmmmmdk',
            'kkkkkkkkkkkkkkkk',
        ]},
        bball: { pal: { '.': null, o: '#ff9933', d: '#cc5500', k: '#1a1a1a' }, rows: [
            '...oooooo...',
            '..ookoooooo.',
            '.oookoooooko',
            'ooookooooooo',
            'oookkkkkkooo',
            'okoookoooooo',
            'okoooookoooo',
            'oookkkkkkooo',
            'oooookoooooo',
            '.oookoooooo.',
            '..ookooooo..',
            '...oooooo...',
        ]},
        target: { pal: { '.': null, w: '#fff', r: '#e23a3a', k: '#000' }, rows: [
            '...wwwwwwww...',
            '..wkkkkkkkkw..',
            '.wkrrrrrrrrkw.',
            'wkrwwwwwwwwrkw',
            'wkrwkkkkkkwrkw',
            'wkrwkrrrrkwrkw',
            'wkrwkrwwrkwrkw',
            'wkrwkrwwrkwrkw',
            'wkrwkrrrrkwrkw',
            'wkrwkkkkkkwrkw',
            'wkrwwwwwwwwrkw',
            '.wkrrrrrrrrkw.',
            '..wkkkkkkkkw..',
            '...wwwwwwww...',
        ]},
        arrow: { pal: { '.': null, y: '#ffcc33', d: '#a87a1a', k: '#1a1a1a', w: '#fff' }, rows: [
            'wwd...............',
            'wwddyyyyyyyyyyyykk',
            'wwddyyyyyyyyyyyykk',
            'wwd...............',
        ]},
        cannon: { pal: { '.': null, k: '#0a0a0a', d: '#3a3a3a', m: '#5a5a5a', l: '#8a8a8a', b: '#5a3a1f', w: '#3a2010' }, rows: [
            '......dddddddddd......',
            '....dddmmmmmmmmddd....',
            '..ddmmmllllllllmmmdd..',
            '.dmmllllllllllllllmmd.',
            'kdmmllllllllllllllmmdk',
            'kdmmllllllllllllllmmdk',
            '.dmmllllllllllllllmmd.',
            '..ddmmmllllllllmmmdd..',
            '....dddmmmmmmmmddd....',
            '......dddddddddd......',
            '....bbbbwwbbbbwwbb....',
            '..wwwwwwwwwwwwwwwwww..',
        ]},
        cball: { pal: { '.': null, k: '#1a1a1a', d: '#3a3a3a', s: '#5a5a5a' }, rows: [
            '..ssss..',
            '.ssddss.',
            'ssddddks',
            'sddddkks',
            'sddddkks',
            'sddddkks',
            '.skkkks.',
            '..ssss..',
        ]},
        dart: { pal: { '.': null, r: '#e23a3a', d: '#8a1010', s: '#888', w: '#fff', k: '#1a1a1a' }, rows: [
            'rrr.kksssssww.',
            'rrdd.kksssssww',
            'rrdd.kksssssww',
            'rrr.kksssssww.',
        ]},
        soccer: { pal: { '.': null, w: '#fff', k: '#1a1a1a', s: '#888' }, rows: [
            '...sswwss...',
            '..swwwwwwws.',
            '.swwwkkwwwws',
            'swwwkkwwwwww',
            'wwkkwwwwwwww',
            'wkkwwwwwwwwk',
            'wwwwwwwwwkkw',
            'wwwwwwwwkkww',
            'swwwwwwkkwws',
            '.swwwkkwwws.',
            '..swwwwwwws.',
            '...sswwss...',
        ]},
        pin: { pal: { '.': null, w: '#fff', s: '#aaa', r: '#e23a3a', k: '#1a1a1a' }, rows: [
            '...ww...',
            '..wwww..',
            '..wwww..',
            '..wrrw..',
            '..wrrw..',
            '..wwww..',
            '..wwww..',
            '.wwwwww.',
            'wwwwwwws',
            'wwwwwwws',
            'wwwwwwws',
            'wwwwwwws',
            'swwwwwwk',
            '.ssssss.',
        ]},
        bottle: { pal: { '.': null, g: '#3aa84a', d: '#1a4a1a', l: '#7adf6a', w: '#fff', y: '#ffcc33' }, rows: [
            '...dd.....',
            '...dd.....',
            '..dggd....',
            '..dggd....',
            '.dgggd....',
            '.dgggd....',
            'dggggdd...',
            'dggggdd...',
            'dgwwwgd...',
            'dgwygwgd..',
            'dggggggd..',
            'dggggggd..',
            'dggggggd..',
            'dggggggd..',
            'dggggggd..',
            'dggggggd..',
            'dddddddd..',
            '..dddd....',
        ]},
        cup: { pal: { '.': null, r: '#a83a3a', d: '#5a1010', l: '#e25a5a', k: '#1a1a1a' }, rows: [
            'kdddddddddddddrk',
            'krllllllllllllrk',
            'krllllllllllllrk',
            'krllllllllllllrk',
            '.krrrrrrrrrrrrk.',
            '.krrrrrrrrrrrrk.',
            '.krrrrrrrrrrrrk.',
            '..krrrrrrrrrrk..',
            '..krrrrrrrrrrk..',
            '..krrrrrrrrrrk..',
            '...krrrrrrrrk...',
            '...krrrrrrrrk...',
            '...krrrrrrrrk...',
            '....krrrrrrk....',
            '....krrrrrrk....',
            '....krrrrrrk....',
            '.....kkkkkk.....',
        ]},
        bin: { pal: { '.': null, k: '#0a0a0a', d: '#222', m: '#3a3a3a', l: '#555', s: '#888' }, rows: [
            '..............',
            '...sssssss....',
            '.kdddddddddk..',
            '.kdmlmlmlmdk..',
            '.kdmlmlmlmdk..',
            '.kdmlmlmlmdk..',
            '.kdmlmlmlmdk..',
            '.kdmlmlmlmdk..',
            '.kdmlmlmlmdk..',
            '.kdmlmlmlmdk..',
            '.kdmlmlmlmdk..',
            '.kdmlmlmlmdk..',
            '.kdmlmlmlmdk..',
            '.kdmlmlmlmdk..',
            '..kkkkkkkkkk..',
            '..............',
        ]},
        paper: { pal: { '.': null, w: '#fff', s: '#bbb', d: '#888' }, rows: [
            '..wwwww...',
            '.wwsswwww.',
            'wwsswwwsdw',
            'wsswwwwsdw',
            'wsswwwwsdw',
            'wwwsswwddw',
            'wwswswssdw',
            'wwsssswswd',
            '.wwwsswssd',
            '..wwwwwwd.',
        ]},
        keeper: { pal: { '.': null, w: '#fff', s: '#3a72e2', d: '#1a4a8a', k: '#1a1a1a', y: '#ffd0a0' }, rows: [
            '...yyyy...',
            '..yyyyyy..',
            '..ykyykyy.',
            '..yyyyyy..',
            '...yyyy...',
            '..ssssss..',
            '.sssssss..',
            'ssssssssss',
            'ssssssssss',
            'ssssssssss',
            'ssssssssss',
            '.dddwwddd.',
            '.dddwwddd.',
            '.kk...kkk.',
        ]},
        // ---- icons ----
        skull: { pal: { '.': null, w: '#e0d0b0', d: '#7a6a4a', k: '#1a1a1a' }, rows: [
            '...wwwwww...',
            '..wwwwwwww..',
            '.wwwwwwwwww.',
            '.wwkkwwkkww.',
            '.wwkkwwkkww.',
            '.wwwwwwwwww.',
            '.wwwwkkwwww.',
            '.wwwwwwwwww.',
            '..wwwwwwww..',
            '...wkwkwk...',
            '...wkwkwk...',
            '....wkwk....',
        ]},
        knife: { pal: { '.': null, s: '#bbb', w: '#fff', d: '#5a3a1f', k: '#1a1a1a', m: '#888' }, rows: [
            '............',
            '.wssssssss..',
            'wsssssssssm.',
            '.mmmmmmmmm..',
            '......dddd..',
            '......dddd..',
            '......dddd..',
            '......dddd..',
            '............',
        ]},
        archer: { pal: { '.': null, b: '#5a3a1f', y: '#ffd0a0', d: '#3a2010', r: '#e23a3a', k: '#000' }, rows: [
            '..yyyy..',
            '..ykyk..',
            '..yyyy..',
            '..rrrr..',
            '.brrrrb.',
            '.brrrrb.',
            '..bbbb..',
            '..b..b..',
            '..b..b..',
            '..d..d..',
        ]},
    };

    const _sprCache = {};
    function buildSpr(def) {
        const h = def.rows.length;
        let w = 0; for (const r of def.rows) if (r.length > w) w = r.length;
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const g = c.getContext('2d');
        for (let y = 0; y < h; y++) {
            const row = def.rows[y];
            for (let x = 0; x < row.length; x++) {
                const col = def.pal[row[x]];
                if (!col) continue;
                g.fillStyle = col; g.fillRect(x, y, 1, 1);
            }
        }
        return { canvas: c, w, h };
    }
    function spr(name) {
        if (_sprCache[name]) return _sprCache[name];
        const def = SPR_DEFS[name]; if (!def) return null;
        return _sprCache[name] = buildSpr(def);
    }
    // Draw centered at (cx, cy) with given pixel scale, optionally flipped/rotated.
    function drawSpr(g, name, cx, cy, scale, opts) {
        const s = spr(name); if (!s) return;
        scale = scale || 1; opts = opts || {};
        const dw = s.w * scale, dh = s.h * scale;
        if (opts.rot || opts.flipX) {
            g.save();
            g.translate(Math.round(cx), Math.round(cy));
            if (opts.rot) g.rotate(opts.rot);
            if (opts.flipX) g.scale(-1, 1);
            g.imageSmoothingEnabled = false;
            g.drawImage(s.canvas, -dw / 2, -dh / 2, dw, dh);
            g.restore();
        } else {
            g.imageSmoothingEnabled = false;
            g.drawImage(s.canvas, Math.round(cx - dw / 2), Math.round(cy - dh / 2), dw, dh);
        }
    }
    const _urlCache = {};
    function sprURL(name, scale) {
        scale = scale || 4;
        const k = name + '@' + scale;
        if (_urlCache[k]) return _urlCache[k];
        const s = spr(name); if (!s) return '';
        const c = document.createElement('canvas');
        c.width = s.w * scale; c.height = s.h * scale;
        const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
        g.drawImage(s.canvas, 0, 0, s.w * scale, s.h * scale);
        return _urlCache[k] = c.toDataURL();
    }

    // Atmospheric backdrop renderer (cached per kind+size).
    const _bgCache = {};
    function _seededNoise(g, w, h, density, seed, color) {
        let r = seed | 0;
        const rng = () => { r = (r * 1664525 + 1013904223) | 0; return ((r >>> 0) % 1000) / 1000; };
        g.fillStyle = color;
        const n = Math.floor(w * h * density);
        for (let i = 0; i < n; i++) g.fillRect(Math.floor(rng() * w), Math.floor(rng() * h), 1, 1);
    }
    function getBg(kind, w, h) {
        const k = `${kind}_${w}x${h}`;
        if (_bgCache[k]) return _bgCache[k];
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const g = c.getContext('2d');
        const renderers = {
            sky: () => {
                const grad = g.createLinearGradient(0, 0, 0, h);
                grad.addColorStop(0, '#0a1424'); grad.addColorStop(0.6, '#1a2a44'); grad.addColorStop(1, '#2a1a18');
                g.fillStyle = grad; g.fillRect(0, 0, w, h);
                _seededNoise(g, w, h * 0.7, 0.0008, 7, '#fff'); // stars
                g.fillStyle = '#1a2218'; g.fillRect(0, h - 24, w, 24); // ground band
                g.fillStyle = '#0a0e08'; for (let x = 0; x < w; x += 8) g.fillRect(x, h - 24, 4, 4);
            },
            night: () => {
                g.fillStyle = '#0a0a0a'; g.fillRect(0, 0, w, h);
                _seededNoise(g, w, h, 0.0006, 13, '#1a1a1a');
                _seededNoise(g, w, h, 0.0001, 31, '#332244');
            },
            arena: () => {
                const grad = g.createLinearGradient(0, 0, 0, h);
                grad.addColorStop(0, '#0a0a0a'); grad.addColorStop(1, '#1a0a0a');
                g.fillStyle = grad; g.fillRect(0, 0, w, h);
                _seededNoise(g, w, h, 0.0008, 17, '#222');
                _seededNoise(g, w, h, 0.0002, 41, '#3a1a1a');
            },
            wood: () => {
                g.fillStyle = '#3a2418'; g.fillRect(0, 0, w, h);
                for (let y = 0; y < h; y += 12) {
                    g.fillStyle = '#2a1810'; g.fillRect(0, y, w, 1);
                    g.fillStyle = '#5a3424'; g.fillRect(0, y + 1, w, 1);
                }
                _seededNoise(g, w, h, 0.001, 23, '#2a1810');
                _seededNoise(g, w, h, 0.0005, 47, '#6a4434');
            },
            grass: () => {
                const grad = g.createLinearGradient(0, 0, 0, h);
                grad.addColorStop(0, '#0a1408'); grad.addColorStop(1, '#162a16');
                g.fillStyle = grad; g.fillRect(0, 0, w, h);
                _seededNoise(g, w, h, 0.002, 19, '#2a4a1a');
                _seededNoise(g, w, h, 0.001, 53, '#1a3a08');
            },
            court: () => {
                const grad = g.createLinearGradient(0, 0, 0, h);
                grad.addColorStop(0, '#1a2030'); grad.addColorStop(1, '#0a0e18');
                g.fillStyle = grad; g.fillRect(0, 0, w, h);
                g.fillStyle = '#a87a3a'; g.fillRect(0, h - 60, w, 60); // floor
                g.fillStyle = '#5a3a1f'; for (let x = 0; x < w; x += 16) g.fillRect(x, h - 60, 1, 60);
                _seededNoise(g, w, h, 0.0005, 29, '#332');
            },
            felt: () => {
                g.fillStyle = '#2a1810'; g.fillRect(0, 0, w, h);
                g.fillStyle = '#1a5a2a'; g.fillRect(30, 30, w - 60, h - 60);
                _seededNoise(g, w, h, 0.0015, 11, '#0a3a18');
                _seededNoise(g, w, h, 0.0008, 67, '#2a7a3a');
            },
            lab: () => {
                g.fillStyle = '#08120a'; g.fillRect(0, 0, w, h);
                for (let y = 0; y < h; y += 24) { g.fillStyle = '#0a1a0c'; g.fillRect(0, y, w, 1); }
                for (let x = 0; x < w; x += 24) { g.fillStyle = '#0a1a0c'; g.fillRect(x, 0, 1, h); }
                _seededNoise(g, w, h, 0.0004, 37, '#1a3a1a');
            },
            cell: () => {
                g.fillStyle = '#1a1408'; g.fillRect(0, 0, w, h);
                // brick pattern
                const bw = 32, bh = 16;
                for (let y = 0; y < h; y += bh) {
                    const ox = (y / bh) % 2 === 0 ? 0 : bw / 2;
                    for (let x = -bw; x < w + bw; x += bw) {
                        g.fillStyle = '#3a2418'; g.fillRect(x + ox + 1, y + 1, bw - 2, bh - 2);
                        g.fillStyle = '#1a0c04'; g.fillRect(x + ox, y, bw, 1); g.fillRect(x + ox, y, 1, bh);
                    }
                }
                _seededNoise(g, w, h, 0.001, 43, '#0a0400');
            },
            tablet: () => {
                g.fillStyle = '#08080a'; g.fillRect(0, 0, w, h);
                for (let y = 0; y < h; y += 2) { g.fillStyle = 'rgba(40,60,80,0.15)'; g.fillRect(0, y, w, 1); }
                _seededNoise(g, w, h, 0.0006, 71, '#1a2030');
            },
        };
        (renderers[kind] || renderers.night)();
        return _bgCache[k] = c;
    }
    function drawBg(g, kind, W, H) {
        g.imageSmoothingEnabled = false;
        g.drawImage(getBg(kind, W, H), 0, 0);
    }

    // =============================================================
    // REGISTRY
    // =============================================================
    const M = {};

    // -------------------- REFLEX (10) --------------------

    // 1. Flappy Bird
    // Difficulty: pipe gap 180 (forgiving), spawn 1.6s, speed 200 px/s; need 12 in 60s.
    // 60s / 1.6s spawn = ~37 pipes spawned; needing 12 = ~32% pass rate. Beatable but
    // requires steady rhythm. Lowered from 20 (felt brutal: instant fail = whole run lost).
    M.flappy_bird = {
        title: 'FLAPPY BIRD',
        desc: 'Score 24+ in 50 seconds. TAP / SPACE to flap.',
        run(ctx) {
            const { c, g } = mkCanvas(ctx);
            let by = 200, vy = 0, gravity = 900, jump = -340;
            const pipes = []; let spawnT = 0; let score = 0;
            let dead = false;
            const cd = countdown(ctx, 50, 'TIME', () => { if (!dead) finish(); });
            ctx.setScore(`SCORE 0`);
            function flap() { if (!dead) { vy = jump; sfx.tick(); } }
            ctx.on(ctx.stage, 'pointerdown', flap);
            ctx.on(window, 'keydown', (e) => { if (e.code === 'Space') flap(); });
            function spawnPipe() {
                const gap = 180; const top = randInt(60, ctx.H - gap - 60);
                pipes.push({ x: ctx.W + 20, top, w: 70 });
            }
            function finish() {
                dead = true;
                cd.stop();
                ctx.timeout(() => { score >= 24 ? ctx.win() : ctx.lose(); }, 400);
            }
            ctx.loop((dt) => {
                if (dead) return;
                vy += gravity * dt; by += vy * dt;
                spawnT -= dt; if (spawnT <= 0) { spawnPipe(); spawnT = 1.6; }
                // move pipes
                for (const p of pipes) p.x -= 200 * dt;
                while (pipes.length && pipes[0].x + pipes[0].w < 0) { pipes.shift(); score++; ctx.setScore(`SCORE ${score}`); sfx.hit(); }
                // collide — bird is now drawn at scale 4 (sprite 16×16 → 64×64),
                // so the collision half-extents grow accordingly.
                const BR = 28; // half-size of the bird hitbox
                if (by < BR || by > ctx.H - BR) { sfx.lose(); finish(); }
                for (const p of pipes) {
                    if (190 + BR > p.x && 190 - BR < p.x + p.w && (by - BR < p.top || by + BR > p.top + 180)) { sfx.lose(); finish(); break; }
                }
                // draw
                drawBg(g, 'sky', ctx.W, ctx.H);
                for (const p of pipes) {
                    g.fillStyle = '#1a4a1a'; g.fillRect(p.x - 2, 0, p.w + 4, p.top);
                    g.fillRect(p.x - 2, p.top + 180, p.w + 4, ctx.H - p.top - 180);
                    g.fillStyle = '#3aa84a'; g.fillRect(p.x, 0, p.w, p.top);
                    g.fillRect(p.x, p.top + 180, p.w, ctx.H - p.top - 180);
                    g.fillStyle = '#5fdf6a'; g.fillRect(p.x + 4, 0, 4, p.top); g.fillRect(p.x + 4, p.top + 180, 4, ctx.H - p.top - 180);
                    g.fillStyle = '#2a7a36'; g.fillRect(p.x - 4, p.top - 18, p.w + 8, 18); g.fillRect(p.x - 4, p.top + 180, p.w + 8, 18);
                    g.fillStyle = '#1a4a1a'; g.fillRect(p.x - 4, p.top - 4, p.w + 8, 4); g.fillRect(p.x - 4, p.top + 180 + 14, p.w + 8, 4);
                }
                // bird sprite (now scale 4 — much more visible)
                drawSpr(g, 'bird', 190, by, 4, { rot: clamp(vy / 600, -0.5, 0.8) });
            });
        }
    };

    // 2. Piano Tiles — now with BOMB tiles. Bombs look red and have an
    // explicit warning marker; if you tap one, instant lose.
    // Roughly 1 in 7 tiles is a bomb after the first 4-5 safe rows.
    M.piano_tiles = {
        title: 'PIANO TILES',
        desc: 'Tap BLACK tiles only. RED tiles are bombs — DO NOT TAP. Survive 60s.',
        run(ctx) {
            const cols = 4; const colW = 800 / cols; const tileH = 110;
            const tiles = []; // {y, col, hit, bomb}
            let speed = 160; let t = 0;
            let dead = false;
            const cd = countdown(ctx, 60, 'TIME', () => { if (!dead) { dead = true; ctx.timeout(() => ctx.win(), 200); } });
            const { c, g } = mkCanvas(ctx);
            // First 4 spawned tiles at the top — never bombs (warm-up).
            for (let i = 0; i < 4; i++) tiles.push({ y: -tileH * (i+1), col: randInt(0, cols-1), hit: false, bomb: false });
            let spawnCount = 4;
            ctx.on(c, 'pointerdown', (e) => {
                if (dead) return;
                const r = c.getBoundingClientRect();
                const cx = (e.clientX - r.left) * (c.width / r.width);
                const cy = (e.clientY - r.top) * (c.height / r.height);
                for (let i = tiles.length - 1; i >= 0; i--) {
                    const tt = tiles[i];
                    if (tt.col !== Math.floor(cx / colW) || tt.hit) continue;
                    if (cy >= tt.y && cy <= tt.y + tileH) {
                        if (tt.bomb) {
                            // Tapped a bomb — instant lose.
                            tt.hit = true; sfx.lose(); dead = true; ctx.timeout(() => ctx.lose(), 300);
                            return;
                        }
                        tt.hit = true; sfx.hit(); return;
                    }
                }
                // tapped a blank space → fail
                sfx.lose(); dead = true; ctx.timeout(() => ctx.lose(), 300);
            });
            ctx.loop((dt) => {
                if (dead) return;
                t += dt; speed = 160 + t * 3.5;
                for (const tt of tiles) tt.y += speed * dt;
                while (tiles[tiles.length - 1].y > -tileH * 0.2) {
                    spawnCount++;
                    // After the 5th spawn, ~1/7 chance the new tile is a bomb.
                    const isBomb = spawnCount > 5 && Math.random() < (1 / 7);
                    tiles.push({ y: tiles[tiles.length - 1].y - tileH, col: randInt(0, cols-1), hit: false, bomb: isBomb });
                }
                // Unhit, NON-BOMB tile that exits the bottom = fail.
                // Bombs sliding off the bottom is fine (they're meant to be ignored).
                for (const tt of tiles) {
                    if (!tt.hit && !tt.bomb && tt.y > ctx.H) { sfx.lose(); dead = true; ctx.timeout(() => ctx.lose(), 300); break; }
                }
                while (tiles.length && tiles[0].y > ctx.H + tileH) tiles.shift();
                drawBg(g, 'wood', ctx.W, ctx.H);
                g.fillStyle = 'rgba(255,255,255,0.06)';
                for (let i = 0; i < cols; i++) g.fillRect(i * colW + 4, 0, colW - 8, ctx.H);
                g.strokeStyle = '#1a0c04'; g.lineWidth = 2;
                for (let i = 1; i < cols; i++) { g.beginPath(); g.moveTo(i * colW, 0); g.lineTo(i * colW, ctx.H); g.stroke(); }
                for (const tt of tiles) {
                    // shadow
                    g.fillStyle = '#000'; g.fillRect(tt.col * colW + 7, tt.y + 3, colW - 8, tileH - 4);
                    if (tt.bomb) {
                        // Red bomb tile — high contrast warning + ✕ glyph.
                        g.fillStyle = tt.hit ? '#7a1010' : '#a02020';
                        g.fillRect(tt.col * colW + 4, tt.y, colW - 8, tileH - 4);
                        g.fillStyle = '#cc4040';
                        g.fillRect(tt.col * colW + 4, tt.y, colW - 8, 6);
                        g.fillStyle = '#fff'; g.font = 'bold 64px VT323, monospace';
                        g.textAlign = 'center'; g.textBaseline = 'middle';
                        g.fillText('✕', tt.col * colW + colW / 2, tt.y + tileH / 2);
                    } else {
                        g.fillStyle = tt.hit ? '#444' : '#0a0a0a';
                        g.fillRect(tt.col * colW + 4, tt.y, colW - 8, tileH - 4);
                        g.fillStyle = tt.hit ? '#888' : '#2a2a2a';
                        g.fillRect(tt.col * colW + 4, tt.y, colW - 8, 4);
                        if (tt.hit) { g.fillStyle = '#3ae26a'; g.fillRect(tt.col * colW + colW/2 - 6, tt.y + tileH/2 - 6, 12, 12); }
                    }
                }
                ctx.setScore(`SPD ${Math.round(speed)}`);
            });
        }
    };

    // 3. Whack-a-Mole with color rules
    // Difficulty: 60s, spawn every 700ms (~85 spawns), 25% match target = ~21 valid hits.
    // Need 10 hits (was 12). Wrong color = -1. Rule shifts every 12s (was 10s) so player
    // has more time to adapt. Tuned down because rule-shift mid-tap was a frequent fail.
    M.whack_color = {
        title: 'COLOR WHACK',
        desc: '60s. Hit only the AI-called color. Rules shift every 10s. Need 14.',
        run(ctx) {
            const colors = [
                { id: 'r', hex: '#e23a3a', name: 'RED' },
                { id: 'b', hex: '#3a72e2', name: 'BLUE' },
                { id: 'g', hex: '#3ae26a', name: 'GREEN' },
                { id: 'y', hex: '#e2c83a', name: 'YELLOW' },
            ];
            let target = pick(colors);
            let score = 0; let need = 14;
            const callout = ctx.el('div', { style: { position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: '32px', fontFamily: 'VT323, monospace', letterSpacing: '4px' }, text: `HIT ${target.name}` });
            ctx.stage.appendChild(callout);
            ctx.setScore(`HITS 0/${need}`);
            const grid = ctx.el('div', { style: { position: 'absolute', inset: '90px 80px 30px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gridTemplateRows: 'repeat(3,1fr)', gap: '12px' } });
            ctx.stage.style.background = '#0a0500';
            const cells = []; for (let i = 0; i < 12; i++) { const cell = ctx.el('div', { style: { background: 'radial-gradient(circle, #2a1408 30%, #08040a)', border: '3px solid #2a1f10', position: 'relative', boxShadow: 'inset 0 4px 12px #000' } }); cells.push(cell); grid.appendChild(cell); }
            ctx.stage.appendChild(grid);
            let mole = null;
            function clearMole() { if (mole) mole.remove(); mole = null; }
            function spawn() {
                clearMole();
                const cell = pick(cells); const col = pick(colors);
                mole = ctx.el('button', { style: { position: 'absolute', inset: '8%', background: col.hex, border: '4px solid rgba(0,0,0,0.5)', cursor: 'pointer', backgroundImage: `url(${sprURL('mole', 6)})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', imageRendering: 'pixelated', boxShadow: `inset 0 0 0 4px ${col.hex}, 0 4px 0 #000` }, onclick: () => {
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

    // 4. Fruit Ninja — speed ramps every 4 seconds. Fruits fly HIGH.
    // Lose if 5 fruits fall un-sliced (off the bottom). Slicing a bomb
    // is also an instant lose. Win at 28 sliced.
    M.fruit_ninja = {
        title: 'FRUIT NINJA',
        desc: 'Slice 28 fruits. Speed ramps. Miss 5 = lose. Bombs = lose.',
        run(ctx) {
            const { c, g } = mkCanvas(ctx);
            const items = []; // {x,y,vx,vy,kind,r,sliced,counted}
            let score = 0; let need = 28; let dead = false;
            let missed = 0; const missCap = 5;
            // Speed multiplier — bumps every 4 seconds.
            let speedMul = 1.0;
            ctx.setScore(`SLICED 0/${need}  ·  MISS 0/${missCap}`);
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
                            score++; sfx.hit(); ctx.setScore(`SLICED ${score}/${need}  ·  MISS ${missed}/${missCap}`);
                            if (score >= need) { dead = true; ctx.timeout(() => ctx.win(), 200); return; }
                        }
                    }
                }
                lastP = { x, y };
            });
            ctx.on(c, 'pointerup', () => { lastP = null; });
            function spawn() {
                if (dead) return;
                const isBomb = Math.random() < 0.10;
                // Fly higher and faster. Initial vy more negative (further up),
                // scaled by speedMul. Horizontal velocity also scales so they
                // sweep wider.
                const baseVy = rand(-820, -680);
                const baseVx = rand(-110, 110);
                items.push({
                    x: rand(80, ctx.W - 80), y: ctx.H + 30,
                    vx: baseVx * speedMul, vy: baseVy * speedMul,
                    kind: isBomb ? 'bomb' : pick(['apple','watermelon','lime','orange']),
                    r: 28, sliced: false, counted: false,
                });
            }
            // Ramp speed every 4 seconds (~+8% per ramp).
            ctx.interval(() => { if (!dead) speedMul *= 1.08; }, 4000);
            ctx.interval(spawn, 600);
            countdown(ctx, 40, 'TIME', () => { if (!dead) { dead = true; ctx.timeout(() => score >= need ? ctx.win() : ctx.lose(), 200); } });
            ctx.loop((dt) => {
                if (dead) return;
                for (const it of items) { it.vy += 980 * dt; it.x += it.vx * dt; it.y += it.vy * dt; }
                // Off-screen sweep — count uncut FRUITS (not bombs) as misses.
                for (let i = items.length - 1; i >= 0; i--) {
                    const it = items[i];
                    if (it.y > ctx.H + 60) {
                        if (!it.sliced && !it.counted && it.kind !== 'bomb') {
                            it.counted = true; missed++;
                            ctx.setScore(`SLICED ${score}/${need}  ·  MISS ${missed}/${missCap}`);
                            if (missed >= missCap) {
                                dead = true; sfx.lose(); ctx.timeout(() => ctx.lose(), 400);
                            }
                        }
                        items.splice(i, 1);
                    }
                }
                drawBg(g, 'arena', ctx.W, ctx.H);
                g.fillStyle = '#1a0c04'; g.fillRect(0, ctx.H - 40, ctx.W, 40);
                g.fillStyle = '#3a1a08'; for (let x = 0; x < ctx.W; x += 40) g.fillRect(x, ctx.H - 40, 38, 38);
                for (const it of items) {
                    const ang = (it.vx + it.vy) * 0.001;
                    if (it.sliced) {
                        g.fillStyle = '#3a0808'; g.fillRect(it.x - it.r, it.y - it.r, it.r * 2, it.r * 2);
                    } else {
                        drawSpr(g, it.kind, it.x, it.y, it.kind === 'watermelon' ? 4 : 5, { rot: ang });
                    }
                }
                ctx.setTimer(`SPD ×${speedMul.toFixed(2)}`);
            });
        }
    };

    // 5. Mole Rush — fast tap (replaces old reflex_tap)
    // Difficulty: 25 moles in 20s = 1.25/s required, spawn every 420ms (~47 spawns).
    // Lowered to 18 (was 25) — old target demanded near-perfect tap rate. 18/47 = 38%
    // hit rate, achievable with a couple of misses.
    M.mole_rush = {
        title: 'MOLE RUSH',
        desc: 'Smash 18 moles in 20 seconds.',
        run(ctx) {
            let score = 0;
            ctx.setScore(`SCORE 0/18`);
            const grid = ctx.el('div', { style: { position: 'absolute', inset: '40px 100px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gridTemplateRows: 'repeat(3,1fr)', gap: '12px' } });
            const cells = []; for (let i = 0; i < 9; i++) { const cell = ctx.el('div', { style: { background: 'radial-gradient(ellipse at center, #1a0a04 30%, #000)', border: '4px solid #2a1f10', position: 'relative', boxShadow: 'inset 0 6px 16px #000' } }); cells.push(cell); grid.appendChild(cell); }
            ctx.stage.appendChild(grid);
            let activeIdx = -1, mole = null;
            function spawn() {
                if (mole) { mole.remove(); mole = null; }
                let i; do { i = randInt(0, 8); } while (i === activeIdx);
                activeIdx = i;
                mole = ctx.el('button', { style: { position: 'absolute', inset: '10%', background: 'transparent', border: 'none', cursor: 'pointer', backgroundImage: `url(${sprURL('mole', 8)})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center bottom', imageRendering: 'pixelated' }, onclick: () => {
                    if (mole.dataset.hit) return; mole.dataset.hit = '1';
                    score++; sfx.hit(); ctx.setScore(`SCORE ${score}/18`);
                    if (score >= 18) { ctx.win(); return; }
                    if (mole) mole.remove(); mole = null;
                } });
                cells[i].appendChild(mole);
            }
            spawn();
            const spawner = ctx.interval(spawn, 420);
            countdown(ctx, 20, 'TIME', () => { ctx.clearInterval(spawner); score >= 18 ? ctx.win() : ctx.lose(); });
        }
    };

    // (M.falling_blocks removed.)

    // (M.bug_smash removed.)

    // (M.balloon_pop removed.)

    // (M.tap_number removed.)

    // (M.red_green removed.)

    // -------------------- AIM / POWER --------------------

    // 11. Basketball — angle slider + power meter, 5/10
    // Difficulty: aim guide visible, 10 shots, need 5. 50% hit rate is the target. Aim
    // guide makes calibration possible after 1-2 shots. Well-tuned.
    M.basketball = {
        title: 'BASKETBALL',
        desc: 'Time both meters. Tap to lock angle, then power. Score 6 of 10.',
        run(ctx) {
            const { c, g } = mkCanvas(ctx);
            let shots = 0, scored = 0; const total = 10, need = 6;
            // Hoop is mutable now — moves to a new x/y after every shot.
            const HOOP = { x: 640, y: 300, w: 72, h: 8 };
            function moveHoop() {
                // Right-side range so the trajectory math still works with
                // the existing power/angle envelope.
                HOOP.x = randInt(560, 700);
                HOOP.y = randInt(240, 360);
            }

            // Two-stage timing: ANGLE oscillates → tap to lock → POWER oscillates
            // → tap to fire. Both meters have narrow sweet zones. Sliders were
            // too easy because you could perfectly calibrate before each shot.
            const ANGLE_MIN = 25, ANGLE_MAX = 80;
            const POWER_MIN = 450, POWER_MAX = 1000;
            let phase = 'angle'; // 'angle' | 'power' | 'firing'
            let angleVal = 0, angleDir = 1;
            let powerVal = 0, powerDir = 1;
            let lockedAngle = 55, lockedPower = 800;
            let ball = null;
            ctx.setScore(`HITS 0/${need}`);

            // Angle meter — no sweet-zone hint. Player has to learn by feel.
            const angleMeter = ctx.el('div', { style: { position: 'absolute', bottom: '14px', left: '50%', transform: 'translateX(-50%)', width: '320px', height: '26px', background: '#1a1a1a', border: '3px solid #555', boxShadow: 'inset 0 0 6px #000' } });
            const angleMark = ctx.el('div', { style: { position: 'absolute', top: '-4px', bottom: '-4px', width: '5px', background: '#ffd24a', left: '0%', boxShadow: '0 0 8px #ffd24a' } });
            angleMeter.appendChild(angleMark);
            ctx.stage.appendChild(angleMeter);
            const angleLabel = ctx.el('div', { style: { position: 'absolute', bottom: '46px', left: '50%', transform: 'translateX(-50%)', color: '#ffd24a', fontFamily: 'VT323, monospace', fontSize: '14px', letterSpacing: '2px' }, text: 'ANGLE' });
            ctx.stage.appendChild(angleLabel);

            // Power meter — also no sweet-zone hint.
            const powerMeter = ctx.el('div', { style: { position: 'absolute', right: '20px', top: '60px', width: '34px', height: '380px', background: '#1a1a1a', border: '3px solid #555', boxShadow: 'inset 0 0 6px #000' } });
            const powerMark = ctx.el('div', { style: { position: 'absolute', left: '-4px', right: '-4px', height: '5px', background: '#ff3a3a', bottom: '0%', boxShadow: '0 0 8px #ff3a3a' } });
            powerMeter.appendChild(powerMark);
            ctx.stage.appendChild(powerMeter);
            const powerLabel = ctx.el('div', { style: { position: 'absolute', right: '20px', top: '34px', width: '34px', textAlign: 'center', color: '#ff7a7a', fontFamily: 'VT323, monospace', fontSize: '14px' }, text: 'PWR' });
            ctx.stage.appendChild(powerLabel);

            const phaseLabel = ctx.el('div', { style: { position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', color: '#ffd24a', fontFamily: 'VT323, monospace', fontSize: '24px', letterSpacing: '3px', textShadow: '0 0 8px #000' }, text: 'TAP TO LOCK ANGLE' });
            ctx.stage.appendChild(phaseLabel);

            ctx.on(c, 'pointerdown', () => {
                if (ball || shots >= total || phase === 'firing') return;
                if (phase === 'angle') {
                    lockedAngle = ANGLE_MIN + (angleVal / 100) * (ANGLE_MAX - ANGLE_MIN);
                    sfx.tick && sfx.tick();
                    phase = 'power';
                    phaseLabel.textContent = 'TAP TO LOCK POWER';
                    phaseLabel.style.color = '#ff7a7a';
                } else if (phase === 'power') {
                    lockedPower = POWER_MIN + (powerVal / 100) * (POWER_MAX - POWER_MIN);
                    sfx.tick && sfx.tick();
                    const r = lockedAngle * Math.PI / 180;
                    ball = { x: 100, y: 480, vx: Math.cos(r) * lockedPower, vy: -Math.sin(r) * lockedPower };
                    shots++; phase = 'firing';
                    phaseLabel.textContent = '...';
                }
            });
            ctx.loop((dt) => {
                if (phase === 'angle') {
                    angleVal += angleDir * 95 * dt;
                    if (angleVal >= 100) { angleVal = 100; angleDir = -1; }
                    if (angleVal <= 0) { angleVal = 0; angleDir = 1; }
                } else if (phase === 'power') {
                    powerVal += powerDir * 120 * dt;
                    if (powerVal >= 100) { powerVal = 100; powerDir = -1; }
                    if (powerVal <= 0) { powerVal = 0; powerDir = 1; }
                }
                angleMark.style.left = angleVal + '%';
                powerMark.style.bottom = powerVal + '%';

                drawBg(g, 'court', ctx.W, ctx.H);
                g.fillStyle = '#fff'; g.fillRect(HOOP.x + HOOP.w - 4, HOOP.y - 60, 4, 60);
                g.fillStyle = '#1a1a1a'; g.fillRect(HOOP.x + HOOP.w - 4, HOOP.y - 30, 4, 30);
                g.fillStyle = '#3a3a3a'; g.fillRect(HOOP.x + HOOP.w, HOOP.y - 60, 4, 80);
                g.fillStyle = '#cc5500'; g.fillRect(HOOP.x - 2, HOOP.y - 2, HOOP.w + 4, 4);
                g.fillStyle = '#ff9933'; g.fillRect(HOOP.x, HOOP.y, HOOP.w, 2);
                g.strokeStyle = '#aaa'; g.lineWidth = 1;
                for (let nx = 0; nx < 8; nx++) { g.beginPath(); g.moveTo(HOOP.x + nx * 9, HOOP.y + 2); g.lineTo(HOOP.x + nx * 9 + 4, HOOP.y + 24); g.stroke(); }
                if (!ball) drawSpr(g, 'bball', 100, 480, 2);
                if (ball) {
                    ball.vy += 980 * dt; ball.x += ball.vx * dt; ball.y += ball.vy * dt;
                    drawSpr(g, 'bball', ball.x, ball.y, 2, { rot: ball.x * 0.05 });
                    if (ball.x >= HOOP.x && ball.x <= HOOP.x + HOOP.w && ball.y >= HOOP.y && ball.y <= HOOP.y + 18 && ball.vy > 0) {
                        scored++; sfx.win(); ctx.setScore(`HITS ${scored}/${need}`); ball = null;
                        if (scored >= need) { ctx.timeout(() => ctx.win(), 600); return; }
                        if (shots >= total) { ctx.timeout(() => ctx.lose(), 600); return; }
                        moveHoop();
                        phase = 'angle'; phaseLabel.textContent = 'TAP TO LOCK ANGLE'; phaseLabel.style.color = '#ffd24a';
                    } else if (ball.y > 540 || ball.x > ctx.W + 40) {
                        sfx.bad(); ball = null;
                        if (shots >= total) { ctx.timeout(() => scored >= need ? ctx.win() : ctx.lose(), 600); return; }
                        moveHoop();
                        phase = 'angle'; phaseLabel.textContent = 'TAP TO LOCK ANGLE'; phaseLabel.style.color = '#ffd24a';
                    }
                }
                ctx.setTimer(`SHOT ${shots}/${total}`);
            });
        }
    };

    // (M.archery removed.)

    // 13. Angry Birds — slingshot, knock all blocks in 3 shots
    // Difficulty: pyramid reduced from 4 tiers (10 blocks) to 3 tiers (6 blocks) — old
    // version required clearing a 10-block stack in 3 shots which was effectively
    // impossible without a perfect topple chain. 6 blocks ≈ 2 per shot, achievable.
    M.angry_birds = {
        title: 'ANGRY BIRDS',
        desc: 'Drag back to aim. Knock down all blocks in 3 shots.',
        run(ctx) {
            const { c, g } = mkCanvas(ctx);
            const sling = { x: 110, y: 460 };
            let bird = null, shots = 3;
            const blocks = []; // {x,y,w,h,alive}
            // pyramid (3 tiers = 6 blocks; tuned down from 4 tiers / 10 blocks)
            const baseX = 620, baseY = 510;
            for (let r = 0; r < 3; r++) for (let i = 0; i <= r; i++) {
                blocks.push({ x: baseX - r * 22 + i * 44, y: baseY - (2 - r) * 44, w: 40, h: 40, alive: true });
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
                drawBg(g, 'sky', ctx.W, ctx.H);
                g.fillStyle = '#1a3a18'; g.fillRect(0, 528, ctx.W, 42);
                g.fillStyle = '#3a6a2a'; g.fillRect(0, 528, ctx.W, 6);
                // sling posts
                g.fillStyle = '#3a1a08'; g.fillRect(sling.x - 6, sling.y - 12, 12, 64);
                g.fillStyle = '#5a2a14'; g.fillRect(sling.x - 4, sling.y - 10, 8, 60);
                g.fillStyle = '#7a4a24'; g.fillRect(sling.x - 2, sling.y - 8, 2, 56);
                if (dragging) {
                    g.strokeStyle = '#3a1a08'; g.lineWidth = 4; g.beginPath(); g.moveTo(sling.x - 6, sling.y - 8); g.lineTo(sling.x - dragV.x, sling.y - dragV.y); g.lineTo(sling.x + 6, sling.y - 8); g.stroke();
                    drawSpr(g, 'abird', sling.x - dragV.x, sling.y - dragV.y, 2);
                } else if (!bird && shots > 0) {
                    // Bird sitting on the slingshot ready to be flung.
                    // Without this the player saw an EMPTY slingshot between shots.
                    drawSpr(g, 'abird', sling.x, sling.y - 4, 2);
                }
                // blocks
                for (const b of blocks) if (b.alive) { drawSpr(g, 'woodblock', b.x + b.w/2, b.y + b.h/2, Math.max(2, Math.floor(b.w / 16))); }
                // bird
                if (bird) { drawSpr(g, 'abird', bird.x, bird.y, 2, { rot: Math.atan2(bird.vy, bird.vx) }); }
                ctx.setTimer(`BLOCKS ${blocks.filter(b=>b.alive).length}`);
            });
        }
    };

    // (M.paper_toss removed.)

    // (M.cannon removed.)

    // (M.darts removed.)

    // (M.penalty_kick removed.)

    // (M.bowling removed.)

    // 19. Pool
    // Difficulty: 6 object balls, need 3 sunk in 5 shots. Hardest aim/power game in the
    // set — physics + chain reactions can sink 0 or 3 in a single shot. Skews toward
    // hard but a full break-style first shot can carry it.
    M.pool = {
        title: 'POOL',
        desc: 'Sink 4 balls in 5 shots. Drag from the cue ball to aim & power.',
        run(ctx) {
            const { c, g } = mkCanvas(ctx);
            const W = ctx.W, H = ctx.H;
            const cue = { x: 200, y: 285, vx: 0, vy: 0, r: 14, color: '#fff' };
            const balls = [cue];
            for (let i = 0; i < 6; i++) balls.push({ x: 500 + (i % 3) * 30, y: 220 + Math.floor(i / 3) * 30, vx: 0, vy: 0, r: 14, color: pick(['#e23a3a','#3a72e2','#3ae26a','#e2c83a','#cc3aee','#ff9933']) });
            const pockets = [{x:30,y:30},{x:W-30,y:30},{x:30,y:H-30},{x:W-30,y:H-30},{x:W/2,y:30},{x:W/2,y:H-30}];
            let shots = 5, sunk = 0, dragging = false, dragP = null;
            ctx.setScore(`SUNK 0/4`);
            // Pointer capture so the drag keeps tracking even when the
            // cursor leaves the canvas — critical when the cue ball is
            // near a corner and the player needs to drag in the opposite
            // direction to charge full power.
            let capturedPointerId = null;
            ctx.on(c, 'pointerdown', (e) => {
                if (cue.vx || cue.vy) return;
                const r = c.getBoundingClientRect();
                const x = (e.clientX - r.left) * (c.width / r.width);
                const y = (e.clientY - r.top) * (c.height / r.height);
                if (Math.hypot(x - cue.x, y - cue.y) < 30) {
                    dragging = true; dragP = { x, y };
                    try { c.setPointerCapture(e.pointerId); capturedPointerId = e.pointerId; } catch (err) {}
                }
            });
            ctx.on(c, 'pointermove', (e) => {
                if (!dragging) return;
                const r = c.getBoundingClientRect();
                // clientX/Y - r.left can go negative or beyond r.width when
                // the pointer leaves the canvas — that's intentional, the
                // larger drag means more power.
                dragP.cx = (e.clientX - r.left) * (c.width / r.width);
                dragP.cy = (e.clientY - r.top) * (c.height / r.height);
            });
            const finishDrag = (e) => {
                if (!dragging) return; dragging = false;
                try { if (capturedPointerId !== null) c.releasePointerCapture(capturedPointerId); } catch (err) {}
                capturedPointerId = null;
                if (dragP.cx == null) return;
                cue.vx = (cue.x - dragP.cx) * 5; cue.vy = (cue.y - dragP.cy) * 5;
                shots--;
            };
            ctx.on(c, 'pointerup', finishDrag);
            ctx.on(c, 'pointercancel', finishDrag);
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
                        else { balls.splice(i, 1); sunk++; sfx.win(); ctx.setScore(`SUNK ${sunk}/4`); }
                        break;
                    }
                }
                if (sunk >= 4) { ctx.timeout(() => ctx.win(), 600); return; }
                const allStop = balls.every(b => b.vx === 0 && b.vy === 0);
                if (allStop && shots <= 0) { ctx.timeout(() => sunk >= 4 ? ctx.win() : ctx.lose(), 600); return; }
                drawBg(g, 'wood', W, H);
                drawBg(g, 'felt', W, H);
                // wooden rails (over felt)
                g.fillStyle = '#3a1a08'; g.fillRect(0, 0, W, 30); g.fillRect(0, H - 30, W, 30); g.fillRect(0, 0, 30, H); g.fillRect(W - 30, 0, 30, H);
                g.fillStyle = '#7a4a24'; g.fillRect(0, 26, W, 4); g.fillRect(0, H - 30, W, 4); g.fillRect(26, 0, 4, H); g.fillRect(W - 30, 0, 4, H);
                for (const p of pockets) { g.fillStyle = '#000'; g.beginPath(); g.arc(p.x, p.y, 18, 0, Math.PI * 2); g.fill(); g.fillStyle = '#222'; g.beginPath(); g.arc(p.x - 2, p.y - 2, 14, 0, Math.PI * 2); g.fill(); }
                for (const b of balls) {
                    g.fillStyle = 'rgba(0,0,0,0.4)'; g.beginPath(); g.arc(b.x + 2, b.y + 3, b.r, 0, Math.PI * 2); g.fill();
                    g.fillStyle = b.color; g.beginPath(); g.arc(b.x, b.y, b.r, 0, Math.PI * 2); g.fill();
                    g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(b.x - 4, b.y - 4, 4, 0, Math.PI * 2); g.fill();
                }
                if (dragging && dragP.cx != null) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.setLineDash([6,4]); g.beginPath(); g.moveTo(cue.x, cue.y); g.lineTo(dragP.cx, dragP.cy); g.stroke(); g.setLineDash([]); }
                ctx.setTimer(`SHOTS ${shots}`);
            });
        }
    };

    // 20. Bottle Flip
    // Difficulty: upright tolerance widened to ±0.6 rad (was ±0.45 rad ≈ ±26°).
    // 0.6 rad ≈ ±34°, still requires a deliberate flick. Need 3 of 5 = 60%.
    M.bottle_flip = {
        title: 'BOTTLE FLIP',
        desc: 'Flick up to flip the bottle. Land upright 4 of 5.',
        run(ctx) {
            const { c, g } = mkCanvas(ctx);
            let flips = 5, ok = 0; let bottle = { x: 400, y: 480, vy: 0, rot: 0, vrot: 0, settled: true };
            let dragStart = null;
            ctx.setScore(`UPRIGHT 0/4`);
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
                        const upright = r < 0.6 || r > Math.PI * 2 - 0.6;
                        if (upright) { ok++; sfx.win(); ctx.setScore(`UPRIGHT ${ok}/4`); }
                        else { sfx.bad(); }
                        bottle.rot = upright ? 0 : Math.PI;
                        if (ok >= 4) { ctx.timeout(() => ctx.win(), 500); return; }
                        if (flips <= 0) { ctx.timeout(() => ok >= 4 ? ctx.win() : ctx.lose(), 500); return; }
                    }
                }
                drawBg(g, 'wood', ctx.W, ctx.H);
                g.fillStyle = '#1a0c04'; g.fillRect(0, 510, ctx.W, 60);
                g.fillStyle = '#3a1a08'; g.fillRect(0, 510, ctx.W, 4);
                g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(bottle.x - 14, 506, 28, 6);
                drawSpr(g, 'bottle', bottle.x, bottle.y - 30, 3, { rot: bottle.rot });
                ctx.setTimer(`FLIPS ${flips}`);
            });
        }
    };

    // -------------------- MEMORY (10) --------------------

    // 21. Simon Says (extended to length 8)
    // Difficulty: target length 8 — within working-memory limit (7±2). Single mistake at
    // any length resets entire game. Risky but standard for the genre.
    M.simon_says = {
        title: 'SIMON SAYS',
        desc: 'Watch the sequence, repeat in time. Reach length 10. Time per round = length × 1.2s.',
        run(ctx) {
            const seq = []; let pStep = 0; const TARGET = 10; let watching = true;
            let done = false;
            const colors = ['#e23a3a', '#3a72e2', '#3ae26a', '#e2c83a'];
            const grid = ctx.el('div', { style: { position: 'absolute', top: '110px', left: '50%', transform: 'translateX(-50%)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' } });
            const msg = ctx.el('div', { style: { position: 'absolute', top: '40px', width: '100%', textAlign: 'center', color: '#fff', fontFamily: 'VT323, monospace', fontSize: '36px', letterSpacing: '4px' }, text: 'WATCH' });
            // Per-round countdown bar — drains while the player is in REPEAT mode.
            const tBar = ctx.el('div', { style: { position: 'absolute', top: '90px', left: '50%', transform: 'translateX(-50%)', width: '320px', height: '10px', background: '#1a1a1a', border: '2px solid #555' } });
            const tFill = ctx.el('div', { style: { position: 'absolute', left: 0, top: 0, bottom: 0, background: '#3ae26a', width: '100%', transition: 'width 0.1s linear' } });
            tBar.appendChild(tFill);
            const btns = colors.map((col, i) => {
                const b = ctx.el('button', { style: { width: '170px', height: '170px', background: col, opacity: 0.4, border: '4px solid rgba(0,0,0,0.6)', cursor: 'pointer', transition: 'opacity 0.1s', boxShadow: 'inset 0 0 0 6px rgba(255,255,255,0.15), inset 0 -10px 0 rgba(0,0,0,0.3), 0 6px 0 #000' }, onclick: () => onTap(i) });
                grid.appendChild(b); return b;
            });
            ctx.stage.appendChild(grid); ctx.stage.appendChild(msg); ctx.stage.appendChild(tBar);
            ctx.setScore(`LEN 0/${TARGET}`);
            function flash(i) { btns[i].style.opacity = 1; ctx.timeout(() => { btns[i].style.opacity = 0.4; }, 280); beep(220 + i * 110, 0.18, 'square', 0.05); }

            // Countdown timer for the REPEAT phase. Length × 1.2s gives more
            // time for longer sequences but tightens per-step. Clearing this
            // is critical when a round ends so it doesn't kill the player
            // mid-WATCH on the next round.
            let timerEnd = 0; let timerId = null;
            function startTimer() {
                stopTimer();
                const ms = Math.max(2200, seq.length * 1200);
                timerEnd = performance.now() + ms;
                tFill.style.width = '100%';
                tFill.style.background = '#3ae26a';
                timerId = ctx.interval(() => {
                    const remain = Math.max(0, timerEnd - performance.now());
                    const pct = (remain / ms) * 100;
                    tFill.style.width = pct + '%';
                    if (pct < 30) tFill.style.background = '#e2c83a';
                    if (pct < 12) tFill.style.background = '#e23a3a';
                    if (remain <= 0) {
                        stopTimer();
                        if (!done) { done = true; sfx.lose(); ctx.timeout(() => ctx.lose(), 400); }
                    }
                }, 100);
            }
            function stopTimer() { if (timerId) { ctx.clearInterval(timerId); timerId = null; } tFill.style.width = '0%'; }

            function play() {
                if (done) return;
                stopTimer();
                watching = true; msg.textContent = 'WATCH'; pStep = 0;
                seq.push(randInt(0, 3));
                ctx.setScore(`LEN ${seq.length-1}/${TARGET}`);
                let i = 0;
                const id = ctx.interval(() => {
                    if (done) { ctx.clearInterval(id); return; }
                    if (i < seq.length) { flash(seq[i]); i++; }
                    else {
                        ctx.clearInterval(id);
                        ctx.timeout(() => {
                            if (done) return;
                            watching = false; msg.textContent = 'REPEAT';
                            startTimer();
                        }, 300);
                    }
                }, 600);
            }
            function onTap(i) {
                if (done || watching) return; flash(i);
                if (i === seq[pStep]) {
                    pStep++;
                    if (pStep === seq.length) {
                        stopTimer();
                        if (seq.length >= TARGET) { done = true; ctx.timeout(() => ctx.win(), 400); return; }
                        ctx.timeout(play, 700);
                    }
                } else {
                    stopTimer(); done = true; sfx.lose(); ctx.timeout(() => ctx.lose(), 400);
                }
            }
            play();
        }
    };

    // 22. Memory Match (4x4) — 6 lives + 60s timer.
    // Each WRONG pair (mismatched flip) costs 1 life. 0 lives = lose.
    // Match all 8 pairs to win. Time also ticks down — both can kill you.
    M.memory_match = {
        title: 'MEMORY MATCH',
        desc: 'Match all 8 pairs in 60 seconds. 6 lives — every wrong pair costs 1.',
        run(ctx) {
            const symbols = ['◆','▲','●','★','♥','♣','■','✚'];
            const deck = shuffle([...symbols, ...symbols]);
            const grid = ctx.el('div', { style: { position: 'absolute', inset: '50px 100px 60px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gridTemplateRows: 'repeat(4,1fr)', gap: '10px' } });
            const cards = []; let first = null; let lock = false; let matches = 0;
            let lives = 6; let done = false;
            // Lives row drawn as red hearts at the top.
            const livesEl = ctx.el('div', { style: { position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', color: '#ff3a3a', fontFamily: 'VT323, monospace', fontSize: '28px', letterSpacing: '6px' } });
            ctx.stage.appendChild(livesEl);
            const refreshLives = () => { livesEl.textContent = '♥'.repeat(lives) + '♡'.repeat(6 - lives); };
            refreshLives();
            for (let i = 0; i < 16; i++) {
                const card = ctx.el('button', { style: { background: '#3a3a8a', color: '#3a3a8a', border: '3px solid #555', fontFamily: 'VT323, monospace', fontSize: '40px', cursor: 'pointer', backgroundImage: `url(${sprURL('skull', 3)})`, backgroundSize: '40px', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', imageRendering: 'pixelated', boxShadow: 'inset 0 0 0 2px #1a1a4a, 0 4px 0 #000' }, text: deck[i], onclick: () => flip(i) });
                cards.push({ el: card, sym: deck[i], matched: false, shown: false });
                grid.appendChild(card);
            }
            ctx.stage.appendChild(grid);
            ctx.setScore(`MATCHES 0/8`);
            function show(c, on) { c.shown = on; c.el.style.color = on ? '#fff' : '#3a3a8a'; c.el.style.background = on ? '#1a1a4a' : '#3a3a8a'; c.el.style.backgroundImage = on ? 'none' : `url(${sprURL('skull', 3)})`; c.el.style.backgroundSize = '40px'; c.el.style.backgroundRepeat = 'no-repeat'; c.el.style.backgroundPosition = 'center'; }
            function flip(i) {
                if (lock || done) return;
                const c = cards[i]; if (c.matched || c.shown) return;
                show(c, true); sfx.tick();
                if (!first) { first = c; return; }
                if (first.sym === c.sym) {
                    first.matched = true; c.matched = true; sfx.win();
                    matches++; ctx.setScore(`MATCHES ${matches}/8`);
                    first = null;
                    if (matches >= 8) { done = true; ctx.timeout(() => ctx.win(), 400); }
                } else {
                    lock = true;
                    lives--; sfx.bad(); refreshLives();
                    if (lives <= 0) {
                        done = true;
                        ctx.timeout(() => { show(first, false); show(c, false); ctx.lose(); }, 700);
                    } else {
                        ctx.timeout(() => { show(first, false); show(c, false); first = null; lock = false; }, 700);
                    }
                }
            }
            countdown(ctx, 60, 'TIME', () => { if (!done) { done = true; ctx.lose(); } });
        }
    };

    // (M.sequence_recall removed.)

    // 24. Cup Shuffle
    // 5 rounds, each round faster. Cup count grows by 1 every other round:
    //   round 1: 3 cups   round 2: 3   round 3: 4   round 4: 4   round 5: 5
    // Single wrong pick at any round = instant lose.
    M.cup_shuffle = {
        title: 'CUP SHUFFLE',
        desc: '5 rounds. Each round faster, more cups every other round.',
        run(ctx) {
            let round = 0; const total = 5;
            ctx.setScore(`ROUND 0/${total}`);
            const row = ctx.el('div', { style: { position: 'absolute', top: '180px', width: '100%', display: 'flex', justifyContent: 'center', gap: '24px' } });
            ctx.stage.appendChild(row);
            const status = ctx.el('div', { style: { position: 'absolute', top: '60px', width: '100%', textAlign: 'center', color: '#fff', fontFamily: 'VT323, monospace', fontSize: '36px' }, text: 'GET READY' });
            ctx.stage.appendChild(status);

            let cups = [];      // re-created each round
            let ballAt = 0;     // identity of the cup holding the ball
            let posMap = [];    // posMap[positionIndex] = cup identity at that position
            let shuffling = false;
            let cupCount = 3;

            function guess(positionClicked) {
                if (shuffling) return;
                const cupAtPos = posMap[positionClicked];
                if (cupAtPos === ballAt) {
                    sfx.win(); round++; ctx.setScore(`ROUND ${round}/${total}`);
                    status.textContent = round >= total ? 'YES!' : 'NEXT...';
                    if (round >= total) { ctx.timeout(() => ctx.win(), 600); return; }
                    ctx.timeout(nextRound, 800);
                } else {
                    sfx.lose(); ctx.timeout(() => ctx.lose(), 500);
                }
            }
            function buildCups(n) {
                cups.forEach(c => c.remove());
                cups = [];
                for (let i = 0; i < n; i++) {
                    const cup = ctx.el('div', { style: { width: '110px', height: '150px', cursor: 'pointer', position: 'relative', backgroundImage: `url(${sprURL('cup', 7)})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', imageRendering: 'pixelated' } });
                    cups.push(cup); row.appendChild(cup);
                }
                cups.forEach((cup, originalIdx) => {
                    ctx.on(cup, 'click', () => {
                        if (shuffling) return;
                        guess(posMap.indexOf(originalIdx));
                    });
                });
            }
            function nextRound() {
                shuffling = true;
                // Cup count grows every other round: 3, 3, 4, 4, 5.
                cupCount = 3 + Math.floor(round / 2);
                buildCups(cupCount);
                ballAt = randInt(0, cupCount - 1);
                posMap = [];
                for (let i = 0; i < cupCount; i++) posMap.push(i);
                row.innerHTML = '';
                cups.forEach(c => { c.style.transform = ''; c.style.transition = 'none'; row.appendChild(c); });
                cups.forEach((c, i) => { c.style.boxShadow = i === ballAt ? '0 0 24px 6px #3ae26a' : 'none'; });
                status.textContent = 'WATCH';
                ctx.timeout(() => {
                    cups.forEach(c => { c.style.boxShadow = 'none'; });
                    // More swaps each round, much faster each round.
                    const n = 6 + round * 3;
                    const speed = Math.max(110, 380 - round * 60);
                    function step(left) {
                        if (left <= 0) { shuffling = false; status.textContent = 'PICK'; return; }
                        const i = randInt(0, cupCount - 2); const j = i + 1;
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

    // (M.pattern_flash removed.)

    // 26. Odd One Out
    // Difficulty: tightened from 3s → 1.8s per round (5 rounds, all needed). The bright
    // star is still salient but at <2s scan time the player must commit quickly. Misclick
    // outside the star wastes time but doesn't penalize. Estimate ~50% win at 1.8s.
    // (M.odd_one_out removed.)

    // 27. Story Recall
    // 20 short stories. Each has at least one TRICK question — typically a
    // negation ("which character was NOT mentioned"), a chronology trap, a
    // distractor that sounds plausible from context, or a question about a
    // detail the player likely glossed over (the COLOR of the second item
    // mentioned, etc.). 30s study, 5 questions, need 4+.
    M.story_recall = {
        title: 'STORY RECALL',
        desc: 'Read carefully. 30s study. 5 questions. Need 4+. Trick questions are real.',
        run(ctx) {
            const stories = [
                { story: "MARA found a brass key under the third floor stairs at 4:45 PM. The key opened a red door behind the BOILER ROOM, where she discovered a ledger listing 12 names and a SILVER coin dated 1947. She hid the coin in her left coat pocket and ran to find her brother NOAH.", q: [
                    { q: "What time did she find the key?", a: ["4:00 PM","4:45 PM","5:15 PM","6:30 PM"], c: 1 },
                    { q: "What floor were the stairs on?", a: ["First","Second","Third","Basement"], c: 2 },
                    { q: "How many names were in the ledger?", a: ["8","10","12","20"], c: 2 },
                    { q: "Which color was NOT mentioned?", a: ["Red","Silver","Gold","Brass"], c: 2 },
                    { q: "Where did she hide the coin?", a: ["Right pocket","Left pocket","Her shoe","A drawer"], c: 1 },
                ]},
                { story: "TIMUR boarded the 7:14 train at Almaty-2 with a green backpack containing 3 BOOKS, a passport, and a sandwich. He got off at the FOURTH stop and met his cousin LEILA wearing a yellow scarf. They walked north for 8 minutes to a cafe called RIVAL.", q: [
                    { q: "What time did Timur board?", a: ["7:04","7:14","7:40","8:14"], c: 1 },
                    { q: "Which item was NOT in the backpack?", a: ["Books","Passport","Sandwich","Wallet"], c: 3 },
                    { q: "Which stop did he get off at?", a: ["Third","Fourth","Fifth","Last"], c: 1 },
                    { q: "What color was Leila's scarf?", a: ["Yellow","Green","Red","Blue"], c: 0 },
                    { q: "How long did they walk?", a: ["3 minutes","8 minutes","18 minutes","Half an hour"], c: 1 },
                ]},
                { story: "DR. KIM kept 5 jars on her desk: red, blue, green, white, black. She added 4 drops to the GREEN jar at 9 AM, then 7 drops to the WHITE jar at 9:15. The lab cat KIRA knocked the BLUE jar over at 9:23. Dr. Kim cleaned it up before the lecture at 10:00.", q: [
                    { q: "How many jars total?", a: ["3","4","5","6"], c: 2 },
                    { q: "Which jar got 7 drops?", a: ["Red","Green","White","Black"], c: 2 },
                    { q: "Which jar did the cat knock over?", a: ["Red","Blue","Green","Black"], c: 1 },
                    { q: "Which color jar was NOT on the desk?", a: ["Yellow","Black","White","Blue"], c: 0 },
                    { q: "What was at 10:00?", a: ["A lecture","Lunch","Cleanup","Another experiment"], c: 0 },
                ]},
                { story: "The thief stole 14 coins from the SECOND vault on TUESDAY night. He left footprints near the east window and dropped a button from a BROWN coat. Detective AKMARAL arrived at 6 AM Wednesday and found a torn note in Russian saying 'meet at the bridge'.", q: [
                    { q: "Which vault was robbed?", a: ["First","Second","Third","Main"], c: 1 },
                    { q: "When was the robbery?", a: ["Monday","Tuesday","Wednesday","Friday"], c: 1 },
                    { q: "How many coins were stolen?", a: ["4","12","14","40"], c: 2 },
                    { q: "What did the thief drop?", a: ["A glove","A button","A ring","Nothing"], c: 1 },
                    { q: "What language was the note in?", a: ["English","Russian","Kazakh","Unknown"], c: 1 },
                ]},
                { story: "ANNA bought 3 apples, 2 pears, and 1 mango at the market for 1200 tenge. She gave the mango to her grandmother BAYAN and ate one apple on the bus home. The bus number was 47 and it took 22 minutes.", q: [
                    { q: "What did she give to Bayan?", a: ["Apple","Pear","Mango","All of them"], c: 2 },
                    { q: "Which fruit was NOT bought?", a: ["Apple","Pear","Mango","Peach"], c: 3 },
                    { q: "How many apples did she eat?", a: ["1","2","3","Zero"], c: 0 },
                    { q: "What was the bus number?", a: ["27","47","57","74"], c: 1 },
                    { q: "How much did she spend?", a: ["1200","1500","2200","1020"], c: 0 },
                ]},
                { story: "The PILOT named YEGOR took off from gate 12 at 03:50. The plane carried 187 passengers, including a baby and TWO dogs. The flight lasted 4 hours 35 minutes. The co-pilot was named DARIA and the destination was DUBAI.", q: [
                    { q: "What gate did they leave from?", a: ["2","12","20","21"], c: 1 },
                    { q: "How many dogs were on board?", a: ["1","2","3","Zero"], c: 1 },
                    { q: "Who was the co-pilot?", a: ["Yegor","Daria","Anna","Not mentioned"], c: 1 },
                    { q: "Was a CAT on board?", a: ["Yes","No","Mentioned but not on board","Two of them"], c: 1 },
                    { q: "What was the destination?", a: ["Doha","Dubai","Damascus","Delhi"], c: 1 },
                ]},
                { story: "ZAHRA painted the kitchen wall LAVENDER on Saturday. She used 2 cans of paint and finished by 6 PM. Her dog MAX bumped a can and spilled it on the BLUE rug, which she had to throw out. She bought a new GRAY rug on Sunday for 8500 tenge.", q: [
                    { q: "What color was the kitchen wall?", a: ["Blue","Gray","Lavender","White"], c: 2 },
                    { q: "What color was the OLD rug?", a: ["Lavender","Blue","Gray","Brown"], c: 1 },
                    { q: "What color was the NEW rug?", a: ["Lavender","Blue","Gray","Same as old"], c: 2 },
                    { q: "How many cans of paint?", a: ["1","2","3","4"], c: 1 },
                    { q: "When did she finish painting?", a: ["3 PM","6 PM","Sunday","Not stated"], c: 1 },
                ]},
                { story: "Captain BORIS commanded the ship VIKTORIYA. The ship had 4 sails, 18 cannons, and a crew of 67. They left port on March 11 carrying TEA and SILK. A storm hit on March 14 and they lost ONE sail.", q: [
                    { q: "Name of the ship?", a: ["Viktoriya","Boris","Boris's Pride","Not stated"], c: 0 },
                    { q: "How many sails AT START?", a: ["3","4","5","Not stated"], c: 1 },
                    { q: "How many sails AFTER the storm?", a: ["2","3","4","All of them"], c: 1 },
                    { q: "What did they carry?", a: ["Tea and gold","Silk and gold","Tea and silk","Tea only"], c: 2 },
                    { q: "When did the storm hit?", a: ["March 11","March 12","March 14","March 18"], c: 2 },
                ]},
                { story: "The recipe needed 250g flour, 120g sugar, 3 eggs, and a pinch of SALT. Bake at 180°C for 25 minutes. KAMILA forgot the SALT and added 30g extra sugar instead. The cake came out FLAT and her sister AIZHAN said it was 'too sweet'.", q: [
                    { q: "What did Kamila forget?", a: ["Eggs","Flour","Salt","Sugar"], c: 2 },
                    { q: "Total sugar used?", a: ["120g","150g","180g","250g"], c: 1 },
                    { q: "Bake temperature?", a: ["160°C","180°C","200°C","220°C"], c: 1 },
                    { q: "How many eggs?", a: ["2","3","4","Half a dozen"], c: 1 },
                    { q: "Who tasted it?", a: ["Kamila's mother","Kamila's sister","Both","Nobody"], c: 1 },
                ]},
                { story: "On the bus, ARMAN sat in seat 14B next to a woman reading a YELLOW book. The bus had 42 seats, 38 were full. They passed 6 villages before reaching ASTANA at 11:52 PM. The fare was 3500 tenge and the trip took 5 hours 18 minutes.", q: [
                    { q: "What seat was Arman in?", a: ["12B","14A","14B","41B"], c: 2 },
                    { q: "Color of the book?", a: ["Red","Blue","Yellow","Green"], c: 2 },
                    { q: "How many seats were EMPTY?", a: ["2","3","4","6"], c: 2 },
                    { q: "Final destination?", a: ["Almaty","Astana","Aktau","Not stated"], c: 1 },
                    { q: "How long was the trip?", a: ["3h","5h 18m","6h","11h 52m"], c: 1 },
                ]},
                { story: "DARIA had a green parrot named PINKY. The parrot knew 14 words in Russian and 3 in English. It lived in a cage on the BALCONY. One Tuesday morning Daria forgot to lock the cage and the parrot flew to the NEIGHBOR's apartment and stayed for 6 hours.", q: [
                    { q: "Color of the parrot?", a: ["Green","Pink","Yellow","Blue"], c: 0 },
                    { q: "Name of the parrot?", a: ["Daria","Pinky","Greenie","Not stated"], c: 1 },
                    { q: "How many English words did it know?", a: ["1","3","14","17"], c: 1 },
                    { q: "Where was the cage?", a: ["Living room","Kitchen","Balcony","Bedroom"], c: 2 },
                    { q: "Where did the parrot fly?", a: ["Outside the building","Neighbor","Park","Back to its cage"], c: 1 },
                ]},
                { story: "NURSULTAN solved 11 chess puzzles in 25 minutes. The HARDEST puzzle (#7) took him 6 minutes. He missed only one — puzzle #4 — and his coach VLADIMIR gave him a score of 91%. The next session is on FRIDAY.", q: [
                    { q: "How many puzzles total?", a: ["7","9","11","25"], c: 2 },
                    { q: "Which puzzle did he MISS?", a: ["#4","#7","#11","None"], c: 0 },
                    { q: "Which was the HARDEST?", a: ["#4","#7","#11","Not stated"], c: 1 },
                    { q: "How long on the hardest?", a: ["3 min","6 min","11 min","25 min"], c: 1 },
                    { q: "When is the next session?", a: ["Tomorrow","Tuesday","Friday","Not stated"], c: 2 },
                ]},
                { story: "The library has 4 floors. Floor 1 holds FICTION, Floor 2 holds SCIENCE, Floor 3 holds HISTORY, and Floor 4 is closed for repair. RUSLAN wanted a book on the Mongol invasions. He took the elevator UP, found his book in 12 minutes, and checked it out at 2:18 PM.", q: [
                    { q: "Which floor was CLOSED?", a: ["1","2","3","4"], c: 3 },
                    { q: "Which floor for HISTORY?", a: ["1","2","3","4"], c: 2 },
                    { q: "Which floor would Ruslan visit?", a: ["1","2","3","4"], c: 2 },
                    { q: "How long to find the book?", a: ["2 min","12 min","18 min","2 hours"], c: 1 },
                    { q: "Did he take the STAIRS?", a: ["Yes","No","Both","Not stated"], c: 1 },
                ]},
                { story: "MADINA inherited 3 paintings from her great-uncle TARAS. Two were OIL on canvas, one was a WATERCOLOR. She sold the watercolor for 45,000 tenge and kept the others. The smallest painting was of a HORSE. The largest showed a winter MOUNTAIN scene.", q: [
                    { q: "How many paintings inherited?", a: ["2","3","4","Not stated"], c: 1 },
                    { q: "How many WATERCOLORS?", a: ["0","1","2","All"], c: 1 },
                    { q: "What did she SELL?", a: ["Horse painting","Mountain","Watercolor","An oil"], c: 2 },
                    { q: "Subject of the SMALLEST?", a: ["Mountain","Horse","Sea","River"], c: 1 },
                    { q: "Sale price?", a: ["4500","45,000","450,000","Not stated"], c: 1 },
                ]},
                { story: "The bakery opens at 06:30 every day except SUNDAY. They bake 80 loaves of BREAD and 40 dozen BUNS daily. The owner ABAY hires 5 workers — 3 morning shift and 2 afternoon. The most popular item is the cinnamon BUN at 250 tenge each.", q: [
                    { q: "What day is the bakery CLOSED?", a: ["Friday","Saturday","Sunday","Always open"], c: 2 },
                    { q: "How many TOTAL workers?", a: ["3","5","8","Not stated"], c: 1 },
                    { q: "How many BUNS per day? (1 dozen = 12)", a: ["40","80","240","480"], c: 3 },
                    { q: "Most popular item?", a: ["Bread","Cinnamon bun","Cookie","Coffee"], c: 1 },
                    { q: "Opening time?", a: ["6:00","6:30","7:00","7:30"], c: 1 },
                ]},
                { story: "OLZHAS climbed Mount KHAN-TENGRI in 9 days. He brought 22 kg of gear including a TENT, a stove, and 14 days of food. The summit temperature was -34°C. Two team members turned back at camp 3, leaving FOUR climbers including OLZHAS to summit.", q: [
                    { q: "How many days to climb?", a: ["4","9","14","22"], c: 1 },
                    { q: "Total climbers WHO SUMMITED?", a: ["2","4","6","Not stated"], c: 1 },
                    { q: "Days of food brought?", a: ["9","14","22","34"], c: 1 },
                    { q: "Summit temperature?", a: ["-14°C","-22°C","-34°C","-44°C"], c: 2 },
                    { q: "How many turned BACK?", a: ["1","2","3","4"], c: 1 },
                ]},
                { story: "ELENA's birthday party had 11 GUESTS. She served pizza (4 boxes), cake (1), and tea. SAMAT arrived 25 minutes late with a wrapped GIFT — a silver bracelet. The party started at 7 PM and ended at 11:15 PM. Three guests were vegetarian.", q: [
                    { q: "How many guests?", a: ["7","9","11","13"], c: 2 },
                    { q: "How many pizza boxes?", a: ["1","2","4","11"], c: 2 },
                    { q: "What did Samat bring?", a: ["Cake","Bracelet","Pizza","Nothing"], c: 1 },
                    { q: "How long was the party?", a: ["3 hours","4h 15m","5h","6h 25m"], c: 1 },
                    { q: "Who was LATE?", a: ["Elena","Samat","All guests","Nobody"], c: 1 },
                ]},
                { story: "Three crows sat on the fence: one BLACK, one BROWN, one with a WHITE wing. The black crow flew away first. The brown one followed 12 seconds later. The white-winged crow stayed for ANOTHER 4 minutes before joining the others by the wheat field.", q: [
                    { q: "Total crows?", a: ["2","3","4","Not stated"], c: 1 },
                    { q: "Which flew FIRST?", a: ["Black","Brown","White wing","All together"], c: 0 },
                    { q: "Which color was actually mentioned for a WING?", a: ["Black","Brown","White","Gray"], c: 2 },
                    { q: "Time gap between black and brown?", a: ["4 sec","12 sec","4 min","Not stated"], c: 1 },
                    { q: "Where did they reunite?", a: ["Sky","Pond","Wheat field","Roof"], c: 2 },
                ]},
                { story: "AYSHA cooked dinner for 6 people: her parents, her brother BAKHTYAR, and 2 friends. The menu was BESHBARMAK, salad, and apple pie. They ate at 8 PM. Aysha's friend SAULE brought a BOTTLE of red wine. The dinner lasted nearly 3 hours.", q: [
                    { q: "How many people TOTAL at dinner?", a: ["4","5","6","8"], c: 2 },
                    { q: "Brother's name?", a: ["Bakhtyar","Saule","Boris","Not stated"], c: 0 },
                    { q: "What did Saule bring?", a: ["Apple pie","Wine","Bread","Nothing"], c: 1 },
                    { q: "What COLOR was the wine?", a: ["Red","White","Rosé","Not stated"], c: 0 },
                    { q: "When did they EAT?", a: ["6 PM","7 PM","8 PM","9 PM"], c: 2 },
                ]},
                { story: "The garage held 4 vehicles: a RED car, a BLUE truck, a black motorcycle, and a yellow bicycle. AIBEK used the BLUE truck on Monday for moving boxes. The motorcycle had a flat tire. Aibek's father ERLAN drove the RED car to work every day.", q: [
                    { q: "How many vehicles in the garage?", a: ["3","4","5","Not stated"], c: 1 },
                    { q: "Color of the truck?", a: ["Red","Blue","Black","Yellow"], c: 1 },
                    { q: "Which had a FLAT tire?", a: ["Car","Truck","Motorcycle","Bicycle"], c: 2 },
                    { q: "Who drove the RED car?", a: ["Aibek","Erlan","Nobody","Both"], c: 1 },
                    { q: "What did Aibek use the TRUCK for?", a: ["Work","Moving boxes","Racing","Not stated"], c: 1 },
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
                    const ql = ctx.el('div', { style: { color: '#fff', fontFamily: 'VT323, monospace', fontSize: '28px', textAlign: 'center', marginBottom: '24px' }, text: item.q });
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
    // Difficulty: 5 tones (well within 7±2). Pitches map to button positions visually
    // (low→high left→right). Attentive players reliably solve; single mistake = lose.
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
                const b = ctx.el('button', { style: { width: '110px', height: '180px', background: '#3a72e2', border: '4px solid #1a4a9a', color: '#fff', fontFamily: 'VT323, monospace', fontSize: '40px', cursor: 'pointer', boxShadow: 'inset 0 0 0 4px rgba(255,255,255,0.2), inset 0 -10px 0 rgba(0,0,0,0.4), 0 6px 0 #000' }, text: String(i + 1), onclick: () => onTap(i) });
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
    // Difficulty: sequence shortened to 6 colors (was 8 — exceeded working-memory span
    // since each color flashes only 400ms with no positional anchor). Also slowed flash
    // interval from 700ms to 850ms for clearer encoding.
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
                if (i < seq.length) { big.style.background = palette[seq[i]].hex; ctx.timeout(() => { big.style.background = '#222'; }, 450); i++; }
                else { ctx.clearInterval(id); ctx.timeout(repeat, 600); }
            }, 850);
            let p = 0;
            function repeat() {
                status.textContent = 'TAP IN ORDER'; big.remove();
                const grid = ctx.el('div', { style: { position: 'absolute', top: '110px', left: '50%', transform: 'translateX(-50%)', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' } });
                palette.forEach(p => {
                    const b = ctx.el('button', { style: { width: '120px', height: '120px', background: p.hex, border: '4px solid #555', cursor: 'pointer', boxShadow: 'inset 0 0 0 4px rgba(255,255,255,0.2), inset 0 -8px 0 rgba(0,0,0,0.4), 0 6px 0 #000' }, onclick: () => onTap(p.id) });
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

    // (M.word_recall removed.)

    // -------------------- PATTERN RECOGNITION (9) --------------------

    // (M.color_rules removed per design — replaced by the remaining 9
    // pattern entries.)

    // 32. Math Sprint — harder. Larger numbers, division, two-step problems.
    // Wrong = -5 seconds (was -3). Need 15 problems in 60s.
    M.math_sprint = {
        title: 'MATH SPRINT',
        desc: 'Solve 15 problems in 60 seconds. Two-digit ops, division, mixed. Wrong = -5s.',
        run(ctx) {
            let score = 0; const need = 15;
            const probEl = ctx.el('div', { style: { position: 'absolute', top: '120px', width: '100%', textAlign: 'center', color: '#fff', fontFamily: 'VT323, monospace', fontSize: '64px' } });
            const opts = ctx.el('div', { style: { position: 'absolute', top: '280px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '20px' } });
            ctx.stage.appendChild(probEl); ctx.stage.appendChild(opts);
            ctx.setScore(`SOLVED 0/${need}`);
            const cd = countdown(ctx, 60, 'TIME', () => score >= need ? ctx.win() : ctx.lose());

            // Problem generator. Five operation types with non-trivial ranges:
            //   +    : two-digit + two-digit  (15..99 + 15..99)
            //   -    : large minuend, may go into hundreds
            //   ×    : up to 15 × 15 (tighter than 12×12 with bigger numbers)
            //   ÷    : exact division, dividend up to 144
            //   2step: a OP b OP c, where OPs respect order-of-ops
            function genProblem() {
                const t = pick(['+','-','×','÷','2step']);
                let q, ans;
                if (t === '+') {
                    const a = randInt(15, 99), b = randInt(15, 99);
                    q = `${a} + ${b}`; ans = a + b;
                } else if (t === '-') {
                    const a = randInt(40, 180), b = randInt(15, a - 5);
                    q = `${a} − ${b}`; ans = a - b;
                } else if (t === '×') {
                    const a = randInt(3, 15), b = randInt(3, 15);
                    q = `${a} × ${b}`; ans = a * b;
                } else if (t === '÷') {
                    const b = randInt(3, 12); const ansV = randInt(3, 12);
                    const a = b * ansV;
                    q = `${a} ÷ ${b}`; ans = ansV;
                } else {
                    // Two-step. Build from a result so the answer stays in
                    // a sane integer range. Forms: (a × b) + c, (a × b) − c,
                    //                            (a + b) × c, (a − b) × c.
                    const form = pick(['mxp','mxm','axm','smm']);
                    if (form === 'mxp') {
                        const a = randInt(3, 9), b = randInt(3, 9), c = randInt(5, 30);
                        q = `${a} × ${b} + ${c}`; ans = a * b + c;
                    } else if (form === 'mxm') {
                        const a = randInt(3, 9), b = randInt(3, 9), c = randInt(2, 12);
                        q = `${a} × ${b} − ${c}`; ans = a * b - c;
                    } else if (form === 'axm') {
                        const c = randInt(3, 8); const a = randInt(2, 10), b = randInt(2, 10);
                        q = `(${a} + ${b}) × ${c}`; ans = (a + b) * c;
                    } else {
                        const c = randInt(3, 8); const a = randInt(8, 18), b = randInt(2, a - 2);
                        q = `(${a} − ${b}) × ${c}`; ans = (a - b) * c;
                    }
                }
                return { q, ans };
            }

            function next() {
                if (score >= need) { ctx.timeout(() => ctx.win(), 400); return; }
                const { q, ans } = genProblem();
                probEl.textContent = q;
                // Wrong distractors: closer to the correct answer for harder
                // discrimination (±15% range, distinct values).
                const wrong = new Set();
                const spread = Math.max(3, Math.floor(Math.abs(ans) * 0.18));
                while (wrong.size < 3) {
                    const d = randInt(-spread, spread);
                    if (d === 0) continue;
                    const v = ans + d;
                    if (v < 0 || v === ans) continue;
                    wrong.add(v);
                }
                const choices = shuffle([ans, ...wrong]);
                opts.innerHTML = '';
                choices.forEach(v => {
                    const b = pxBtn(String(v), () => {
                        if (v === ans) { score++; sfx.hit(); ctx.setScore(`SOLVED ${score}/${need}`); next(); }
                        else { cd.add(-5); sfx.bad(); }
                    });
                    b.style.fontSize = '28px';
                    opts.appendChild(b);
                });
            }
            next();
        }
    };

    // 33. Spot the Imposter — 20 icons grid, find odd one.
    // Round 1 is obvious (high contrast colors). Round 2+ uses VERY subtle
    // differences: same hex shifted by ±10-20 RGB units instead of using a
    // sibling color. By round 5 the difference is ~5-10 units.
    M.spot_imposter = {
        title: 'SPOT THE IMPOSTER',
        desc: 'Find the odd icon. 5 rounds, 5s each. Round 1 obvious — they get subtle FAST.',
        run(ctx) {
            let round = 0; const total = 5; const PER_ROUND = 5;
            const grid = ctx.el('div', { style: { position: 'absolute', inset: '60px 80px 40px', display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gridTemplateRows: 'repeat(4,1fr)', gap: '8px' } });
            ctx.stage.appendChild(grid);
            ctx.setScore(`ROUND 0/${total}`);
            let roundCd = null;
            // RGB nudge — shifts each channel of `hex` by ±delta, returns hex.
            function shiftHex(hex, delta) {
                const m = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
                if (!m) return hex;
                const r = parseInt(m[1], 16), gC = parseInt(m[2], 16), b = parseInt(m[3], 16);
                // Brighten or darken depending on baseline luminance, so the
                // imposter stays a different shade rather than overflowing.
                const lum = (r + gC + b) / 3;
                const dir = lum > 128 ? -1 : 1;
                const clamp255 = v => Math.max(0, Math.min(255, v));
                const nr = clamp255(r + dir * delta);
                const ng = clamp255(gC + dir * delta);
                const nb = clamp255(b + dir * delta);
                return '#' + [nr, ng, nb].map(v => v.toString(16).padStart(2, '0')).join('');
            }
            function start() {
                grid.innerHTML = '';
                const baseColor = pick(['#e23a3a','#3a72e2','#3ae26a','#e2c83a','#cc3aee']);
                // Round 1: very obvious. Round 2+: subtle. Round 5: brutal.
                let altColor;
                if (round === 0) {
                    altColor = baseColor === '#e23a3a' ? '#cc2828' : '#e23a3a';
                } else {
                    // Delta shrinks: round 1 → 28, round 2 → 18, round 3 → 12, round 4 → 8.
                    const delta = Math.max(6, 32 - round * 8);
                    altColor = shiftHex(baseColor, delta);
                }
                const oddIdx = randInt(0, 19);
                let answered = false;
                for (let i = 0; i < 20; i++) {
                    const isOdd = i === oddIdx;
                    const c = ctx.el('button', { style: { background: isOdd ? altColor : baseColor, border: '3px solid #1a1a1a', cursor: 'pointer', backgroundImage: `url(${sprURL('skull', 4)})`, backgroundSize: '48px', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', imageRendering: 'pixelated', boxShadow: 'inset 0 0 0 2px rgba(0,0,0,0.5), inset 0 -4px 0 rgba(0,0,0,0.4)' }, onclick: () => {
                        if (answered) return; answered = true;
                        if (roundCd) { roundCd.stop(); roundCd = null; }
                        if (isOdd) {
                            sfx.win(); round++; ctx.setScore(`ROUND ${round}/${total}`);
                            if (round >= total) { ctx.timeout(() => ctx.win(), 400); return; }
                            ctx.timeout(start, 400);
                        } else {
                            sfx.lose(); ctx.timeout(() => ctx.lose(), 400);
                        }
                    } });
                    grid.appendChild(c);
                }
                // Per-round timer; timeout = lose this round = lose game.
                roundCd = countdown(ctx, PER_ROUND, `R${round+1} TIME`, () => {
                    if (answered) return; answered = true;
                    sfx.lose(); ctx.timeout(() => ctx.lose(), 300);
                });
            }
            start();
        }
    };

    // 34. Sequence Completion — harder. Solve 6 of 14 in 60s. Wrong = -8s
    // (was -10s but with 90s — now 60s and -8 → tighter overall). Pool
    // includes harder mixed-rule sequences: alternating, polynomial,
    // recursive (a(n) = a(n-1)+a(n-2)+1), prime gaps, and triangular numbers.
    M.sequence_completion = {
        title: 'SEQUENCE COMPLETION',
        desc: 'Pick the next term. Solve 6 in 60s. Wrong = -8s.',
        run(ctx) {
            const probs = [
                // Easier baseline (still no gimmes)
                { seq: '1 4 9 16 ?', ans: '25', wrong: ['20','22','30','36'] },                      // squares
                { seq: '100 81 64 49 ?', ans: '36', wrong: ['25','40','35','42'] },                   // descending squares
                { seq: '2 3 5 7 11 ?', ans: '13', wrong: ['12','15','17','9'] },                      // primes
                { seq: '1 1 2 3 5 ?', ans: '8', wrong: ['6','7','9','13'] },                          // fibonacci
                { seq: '1 2 4 7 11 ?', ans: '16', wrong: ['14','15','17','18'] },                     // +1 +2 +3 +4 +5
                // Harder — alternating rules
                { seq: '3 6 5 10 9 ?', ans: '18', wrong: ['12','19','14','17'] },                     // ×2, −1, ×2, −1, ×2
                { seq: '1 3 6 10 15 ?', ans: '21', wrong: ['18','20','22','25'] },                   // triangular numbers
                { seq: '2 6 12 20 30 ?', ans: '42', wrong: ['36','40','45','50'] },                   // n(n+1)
                { seq: '0 1 3 7 15 ?', ans: '31', wrong: ['25','27','29','33'] },                     // 2^n - 1
                { seq: '1 2 6 24 120 ?', ans: '720', wrong: ['600','480','840','360'] },              // factorial
                // Harder — recursive / non-obvious
                { seq: '2 2 4 6 10 ?', ans: '16', wrong: ['12','14','18','20'] },                     // Fibonacci-shift (a+b)
                { seq: '1 11 21 1211 111221 ?', ans: '312211', wrong: ['122121','312221','12111','321321'] }, // Look-and-say
                { seq: '4 9 16 25 36 ?', ans: '49', wrong: ['42','45','48','64'] },                   // squares 2..7
                // Mixed-rule
                { seq: '5 11 23 47 ?', ans: '95', wrong: ['85','94','97','94'] },                     // 2x+1
                { seq: '81 27 9 3 ?', ans: '1', wrong: ['0','2','3','9'] },                            // /3
                { seq: '2 5 11 23 47 ?', ans: '95', wrong: ['72','89','94','100'] },                  // 2x+1 (longer)
                { seq: '1 8 27 64 ?', ans: '125', wrong: ['100','120','144','216'] },                 // cubes
                { seq: '7 14 28 56 ?', ans: '112', wrong: ['96','98','108','120'] },                  // doubling
            ];
            shuffle(probs);
            let i = 0, ok = 0; const need = 6;
            ctx.setScore(`SOLVED 0/${need}`);
            const probEl = ctx.el('div', { style: { position: 'absolute', top: '120px', width: '100%', textAlign: 'center', color: '#fff', fontFamily: 'VT323, monospace', fontSize: '46px', letterSpacing: '4px' } });
            const opts = ctx.el('div', { style: { position: 'absolute', top: '270px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '700px' } });
            ctx.stage.appendChild(probEl); ctx.stage.appendChild(opts);
            const cd = countdown(ctx, 60, 'TIME', () => ok >= need ? ctx.win() : ctx.lose());
            function next() {
                if (ok >= need) { ctx.timeout(() => ctx.win(), 400); return; }
                if (i >= probs.length) { ctx.timeout(() => ok >= need ? ctx.win() : ctx.lose(), 400); return; }
                const p = probs[i]; i++;
                probEl.textContent = p.seq;
                const choices = shuffle([p.ans, ...p.wrong.slice(0, 3)]);
                opts.innerHTML = '';
                choices.forEach(v => {
                    const b = pxBtn(v, () => {
                        if (b.disabled) return;
                        opts.querySelectorAll('button').forEach(x => x.disabled = true);
                        if (v === p.ans) { ok++; sfx.win(); ctx.setScore(`SOLVED ${ok}/${need}`); }
                        else { sfx.bad(); cd.add(-8); }
                        if (!cd.isDone()) next();
                    });
                    b.style.fontSize = '24px'; opts.appendChild(b);
                });
            }
            next();
        }
    };

    // 35. Symbol Decoder — every option starts with the SAME letter so
    // the player can't first-letter cheese. They have to actually decode
    // the rest of the symbols. 5 messages in 35s, all must be correct.
    M.symbol_decoder = {
        title: 'SYMBOL DECODER',
        desc: 'Decode 5 messages in 35s. All 4 options share the FIRST letter — read every symbol.',
        run(ctx) {
            const symbols = ['▲','●','■','◆','★','♥','♣','✚','◀','▶','◐','◑'];
            const letters = ['A','B','C','D','E','F','G','H','I','J','K','L'];
            shuffle(symbols);
            const key = {}; letters.forEach((l, i) => key[l] = symbols[i]);

            // Pool of A-L only words, grouped by first letter. Every group
            // has at least 4 entries so we can always show 4 options that
            // share the first letter.
            const wordsByFirst = {
                A: ['ABACK', 'ABLE', 'ACID', 'ACIDIC', 'AGED', 'AGILE', 'ALIKE', 'AHEAD'],
                B: ['BABBLE', 'BACKED', 'BADGE', 'BAFFLE', 'BAGGAGE', 'BIBLE', 'BAILED'],
                C: ['CABBAGE', 'CABLE', 'CAGED', 'CALLED', 'CHILD', 'CHILLED', 'CICADA'],
                D: ['DABBLE', 'DECAF', 'DEADHEAD', 'DECADE', 'DEFACED', 'DIDDLE', 'DICE'],
                F: ['FABLE', 'FABLED', 'FACADE', 'FAILED', 'FALLBACK', 'FECAL', 'FEEDBACK', 'FIDDLE', 'FIELD'],
                H: ['HACKED', 'HACKLE', 'HAGGLE', 'HALFLIFE', 'HEAD', 'HEADACHE', 'HECKLE'],
                I: ['ICED', 'IDEAL', 'IDLE', 'IDLED', 'ILLEGAL'],
                J: ['JABBED', 'JADE', 'JADED', 'JAIL', 'JAILED', 'JIGGLE'],
                K: ['KICKED', 'KEEL', 'KICK', 'KIDDED', 'KILLED'],
                L: ['LABEL', 'LABELED', 'LACE', 'LAID', 'LAKE', 'LIKED', 'LIKABLE'],
            };
            const firstLetters = Object.keys(wordsByFirst);
            // Pick 5 distinct first-letters for the 5 rounds.
            shuffle(firstLetters);
            const roundLetters = firstLetters.slice(0, 5);

            let roundIdx = 0; let ok = 0;
            const keyEl = ctx.el('div', { style: { position: 'absolute', top: '20px', left: '10px', right: '10px', display: 'grid', gridTemplateColumns: 'repeat(12,1fr)', gap: '3px', color: '#fff', fontFamily: 'VT323, monospace', fontSize: '20px', textAlign: 'center' } });
            for (const l of letters) keyEl.appendChild(ctx.el('div', { style: { padding: '4px', background: '#1a1a1a', border: '2px solid #444' }, html: `${l}<br/>${key[l]}` }));
            ctx.stage.appendChild(keyEl);
            const probEl = ctx.el('div', { style: { position: 'absolute', top: '170px', width: '100%', textAlign: 'center', color: '#3ae26a', fontFamily: 'VT323, monospace', fontSize: '52px', letterSpacing: '10px' } });
            const opts = ctx.el('div', { style: { position: 'absolute', top: '280px', left: '50%', transform: 'translateX(-50%)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', minWidth: '460px' } });
            ctx.stage.appendChild(probEl); ctx.stage.appendChild(opts);
            ctx.setScore(`DECODED 0/5`);
            let locked = false; let done = false;
            function next() {
                if (done) return;
                if (roundIdx >= 5) { done = true; ok >= 5 ? ctx.win() : ctx.lose(); return; }
                const letter = roundLetters[roundIdx];
                const pool = wordsByFirst[letter].slice();
                shuffle(pool);
                const m = pool[0];
                const distractors = pool.slice(1, 4);
                roundIdx++;
                probEl.textContent = m.split('').map(l => key[l]).join(' ');
                const choices = shuffle([m, ...distractors]);
                opts.innerHTML = ''; locked = false;
                choices.forEach(v => {
                    const b = pxBtn(v, () => {
                        if (locked || done) return; locked = true;
                        opts.querySelectorAll('button').forEach(x => x.disabled = true);
                        if (v === m) { ok++; sfx.win(); ctx.setScore(`DECODED ${ok}/5`); ctx.timeout(next, 350); }
                        else { sfx.bad(); done = true; ctx.timeout(() => ctx.lose(), 400); }
                    });
                    b.style.fontSize = '22px'; opts.appendChild(b);
                });
            }
            countdown(ctx, 35, 'TIME', () => { if (!done) { done = true; ok >= 5 ? ctx.win() : ctx.lose(); } });
            next();
        }
    };

    // (M.sorting removed.)

    // (M.flow_connect removed.)

    // (M.grid_logic removed.)

    // 39. Analogy Sprint — solve 8 in 45s. WRONG ANSWER ENDS THE GAME.
    // Each item has 4 options. ALL 3 distractors are designed traps:
    //   - perfect-domain match with wrong relationship
    //   - the OTHER half of the analogy (i.e. echoes the question)
    //   - a high-frequency word that loosely associates with the prompt
    // The pool tilts toward harder relationship types: process direction,
    // hypernym/hyponym, etymology, abstract category, function-vs-output.
    M.analogy_sprint = {
        title: 'ANALOGY SPRINT',
        desc: 'Solve 8 analogies in 45s. All distractors are traps. One wrong = lose.',
        run(ctx) {
            const probs = [
                // Sequence direction trap — fortnight IS a time, but doesn't extend the doubling.
                { q: 'SECOND : MINUTE :: HOUR : ?', a: 'DAY', w: ['FORTNIGHT','WEEK','SECOND'] },
                // Reversed — "PUPPY" tempts because the prompt mentions it.
                { q: 'PUPPY : DOG :: KITTEN : ?', a: 'CAT', w: ['LION','PUPPY','MOUSE'] },
                // Functional verb vs. body part the eye uses (a glasses-trap).
                { q: 'EAR : LISTEN :: EYE : ?', a: 'SEE', w: ['BLINK','GLASSES','FINGER'] },
                // Part-whole vs. larger container (LIBRARY trap).
                { q: 'PETAL : FLOWER :: PAGE : ?', a: 'BOOK', w: ['CHAPTER','LIBRARY','INK'] },
                // Object → MEDIUM, not the action it performs.
                { q: 'KEY : LOCK :: PEN : ?', a: 'PAPER', w: ['INK','WRITE','HAND'] },
                // Antonym vs. weak-synonym (FRUGAL is "thrifty" — close but virtuous).
                { q: 'BRAVE : COWARD :: GENEROUS : ?', a: 'STINGY', w: ['KIND','HONEST','FRUGAL'] },
                // Stage-of-development direction. Soil is a context not a result.
                { q: 'SPARK : FIRE :: SEED : ?', a: 'PLANT', w: ['SOIL','SUN','GARDENER'] },
                // Workplace category — university is a workplace but wrong field.
                { q: 'JUDGE : COURT :: SURGEON : ?', a: 'HOSPITAL', w: ['UNIVERSITY','LAW','SCALPEL'] },
                // Verb-of-use, not material it acts on.
                { q: 'AXE : CHOP :: HAMMER : ?', a: 'POUND', w: ['NAIL','METAL','WOOD'] },
                // Doubling pattern, not arithmetic-progression.
                { q: 'TWO : FOUR :: SIX : ?', a: 'TWELVE', w: ['EIGHT','THREE','SIXTEEN'] },
                // Antonym, not category-extension.
                { q: 'GIGANTIC : TINY :: ANCIENT : ?', a: 'MODERN', w: ['OLD','HISTORIC','RUIN'] },
                // Metamorphosis. Salamander has a similar tail but isn't the result.
                { q: 'CATERPILLAR : BUTTERFLY :: TADPOLE : ?', a: 'FROG', w: ['LIZARD','SALAMANDER','FISH'] },
                // Tool → produced object. Hammer is a tool of the same family but not the output.
                { q: 'BRUSH : PAINTING :: CHISEL : ?', a: 'SCULPTURE', w: ['ARTIST','STONE','HAMMER'] },
                // Group-size by name.
                { q: 'DUET : TWO :: TRIO : ?', a: 'THREE', w: ['SOLO','GROUP','BAND'] },
                // Country capital — OSAKA is a famous city of Japan, not the capital.
                { q: 'PARIS : FRANCE :: TOKYO : ?', a: 'JAPAN', w: ['CHINA','ASIA','OSAKA'] },
                // Creator → primary work form.
                { q: 'AUTHOR : NOVEL :: COMPOSER : ?', a: 'SYMPHONY', w: ['POEM','BAND','CONDUCTOR'] },
                // Organ → substance moved (NOT verb).
                { q: 'HEART : BLOOD :: LUNG : ?', a: 'AIR', w: ['BREATH','OXYGEN','BREATHE'] },
                // Phenomena pair — moonrise tempts as another rise event.
                { q: 'DAWN : SUNRISE :: DUSK : ?', a: 'SUNSET', w: ['MOONRISE','MIDNIGHT','EVENING'] },
                // --- Harder additions ---
                // Etymology / derivation. ICHTHY- = fish; PYRO- = fire.
                { q: 'PYRO : FIRE :: ICHTHY : ?', a: 'FISH', w: ['SUN','MUSCLE','SOUND'] },
                // Hypernym/hyponym — VEHICLE is the parent class; SEDAN is a sibling, not the answer.
                { q: 'SPARROW : BIRD :: CAR : ?', a: 'VEHICLE', w: ['SEDAN','ROAD','ENGINE'] },
                // Function-of-tool, not its component.
                { q: 'COMPASS : DIRECTION :: THERMOMETER : ?', a: 'TEMPERATURE', w: ['MERCURY','GLASS','HEAT'] },
                // Author → work (book NAME), not author's other works.
                { q: 'SHAKESPEARE : HAMLET :: HOMER : ?', a: 'ODYSSEY', w: ['GREECE','POEM','SHAKESPEARE'] },
                // Substance source, not common compound.
                { q: 'COW : MILK :: BEE : ?', a: 'HONEY', w: ['HIVE','POLLEN','STING'] },
                // Earlier-form-of (technology evolution).
                { q: 'CANDLE : BULB :: HORSE : ?', a: 'CAR', w: ['CARRIAGE','SADDLE','GAS'] },
                // Vocabulary range. STAR is a common word for celestial; the question wants a UNIT scale.
                { q: 'OUNCE : POUND :: INCH : ?', a: 'FOOT', w: ['MILE','METER','LENGTH'] },
                // Inverse relationship. Sunset isn't a verb-pair to "ignite".
                { q: 'IGNITE : EXTINGUISH :: ASCEND : ?', a: 'DESCEND', w: ['ELEVATE','RISE','PEAK'] },
            ];
            shuffle(probs);
            let i = 0, ok = 0; const need = 8;
            ctx.setScore(`SOLVED 0/${need}`);
            const probEl = ctx.el('div', { style: { position: 'absolute', top: '110px', width: '100%', textAlign: 'center', color: '#fff', fontFamily: 'VT323, monospace', fontSize: '30px', letterSpacing: '2px' } });
            const opts = ctx.el('div', { style: { position: 'absolute', top: '230px', left: '50%', transform: 'translateX(-50%)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', minWidth: '440px' } });
            ctx.stage.appendChild(probEl); ctx.stage.appendChild(opts);
            const cd = countdown(ctx, 45, 'TIME', () => ok >= need ? ctx.win() : ctx.lose());
            let done = false;
            function next() {
                if (done) return;
                if (ok >= need) { done = true; ctx.timeout(() => ctx.win(), 400); return; }
                if (i >= probs.length) { done = true; ctx.timeout(() => ok >= need ? ctx.win() : ctx.lose(), 400); return; }
                const p = probs[i]; i++;
                probEl.textContent = p.q;
                const choices = shuffle([p.a, ...p.w.slice(0, 3)]);
                opts.innerHTML = '';
                choices.forEach(v => {
                    const b = pxBtn(v, () => {
                        if (done || b.disabled) return;
                        opts.querySelectorAll('button').forEach(x => x.disabled = true);
                        if (v === p.a) { ok++; sfx.hit(); ctx.setScore(`SOLVED ${ok}/${need}`); ctx.timeout(next, 220); }
                        else { sfx.lose && sfx.lose(); done = true; ctx.timeout(() => ctx.lose(), 500); }
                    });
                    b.style.fontSize = '22px'; opts.appendChild(b);
                });
            }
            next();
        }
    };

    // 40. Password Crack — Mastermind
    // Difficulty: 4 tries (was 3) for a 4-digit code, 0-9 with repeats. Hot/Warm/Cold
    // feedback uses sum of |digit diff| (max 36), so HOT (≤4) is a strong signal but
    // doesn't pinpoint which digits. With 4 tries, deductive players can converge.
    M.password_crack = {
        title: 'PASSWORD CRACK',
        desc: 'Crack the 4-digit code in 7 tries. HOT / WARM / COLD feedback per guess.',
        run(ctx) {
            const MAX_TRIES = 7;
            const code = []; for (let i = 0; i < 4; i++) code.push(randInt(0, 9));
            const guesses = [];
            let cur = '';

            // History panel (top half) — fixed-height scroll area listing
            // each guess + feedback chip. No more wrap-around overlap.
            const history = ctx.el('div', { style: { position: 'absolute', top: '20px', left: '60px', right: '60px', height: '230px', background: 'rgba(20,20,20,0.6)', border: '2px solid #444', padding: '10px 16px', overflowY: 'auto', fontFamily: 'VT323, monospace', fontSize: '28px', color: '#ccc', display: 'flex', flexDirection: 'column', gap: '6px' } });
            ctx.stage.appendChild(history);

            // Current guess display — large green digits in a centered slot row.
            const slots = ctx.el('div', { style: { position: 'absolute', top: '270px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '12px' } });
            const slotEls = [];
            for (let i = 0; i < 4; i++) {
                const s = ctx.el('div', { style: { width: '54px', height: '64px', background: '#0a0a0a', border: '3px solid #4eff7a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'VT323, monospace', fontSize: '44px', color: '#4eff7a', boxShadow: 'inset 0 0 12px rgba(78,255,122,0.2)' } });
                slots.appendChild(s); slotEls.push(s);
            }
            ctx.stage.appendChild(slots);

            // Keypad — 4 rows × 3 cols, fixed positions. Phone-style layout:
            //   1 2 3
            //   4 5 6
            //   7 8 9
            //   ← 0 ✓
            const pad = ctx.el('div', { style: { position: 'absolute', bottom: '14px', left: '50%', transform: 'translateX(-50%)', display: 'grid', gridTemplateColumns: 'repeat(3, 64px)', gridTemplateRows: 'repeat(4, 44px)', gap: '6px' } });
            ctx.stage.appendChild(pad);

            const refreshSlots = () => { for (let i = 0; i < 4; i++) slotEls[i].textContent = cur[i] || ''; };

            const mkKey = (label, fn, color) => ctx.el('button', { style: { background: '#1a1a1a', color: color || '#fff', border: '2px solid ' + (color || '#555'), fontFamily: 'VT323, monospace', fontSize: '24px', cursor: 'pointer', boxShadow: 'inset 0 0 8px rgba(0,0,0,0.5)' }, text: label, onclick: fn });
            const order = ['1','2','3','4','5','6','7','8','9'];
            for (const d of order) pad.appendChild(mkKey(d, () => { if (cur.length < 4) { cur += d; sfx.tick && sfx.tick(); refreshSlots(); } }));
            pad.appendChild(mkKey('←', () => { cur = cur.slice(0, -1); refreshSlots(); }, '#ff7a7a'));
            pad.appendChild(mkKey('0', () => { if (cur.length < 4) { cur += '0'; sfx.tick && sfx.tick(); refreshSlots(); } }));
            pad.appendChild(mkKey('GUESS', () => trySubmit(), '#4eff7a'));

            // Mastermind-style feedback: per-guess pegs.
            //   ● (filled green) = right digit, RIGHT POSITION
            //   ○ (hollow yellow) = right digit, WRONG POSITION
            //   absent           = digit not in the code at all
            // Each digit in the code is "consumed" by at most one peg, so
            // duplicate guesses against duplicate code digits are scored
            // correctly (classic Mastermind rules).
            function scoreGuess(guess) {
                const exact = []; const partial = [];
                const codeUsed = new Array(4).fill(false);
                const guessUsed = new Array(4).fill(false);
                // First pass — exacts.
                for (let i = 0; i < 4; i++) {
                    if (guess[i] === code[i]) {
                        exact.push(i); codeUsed[i] = true; guessUsed[i] = true;
                    }
                }
                // Second pass — partials.
                for (let i = 0; i < 4; i++) {
                    if (guessUsed[i]) continue;
                    for (let j = 0; j < 4; j++) {
                        if (codeUsed[j]) continue;
                        if (guess[i] === code[j]) {
                            partial.push(i); codeUsed[j] = true; guessUsed[i] = true;
                            break;
                        }
                    }
                }
                return { exact: exact.length, partial: partial.length };
            }
            function trySubmit() {
                if (cur.length !== 4) { sfx.bad && sfx.bad(); return; }
                const digs = cur.split('').map(Number);
                const sc = scoreGuess(digs);
                guesses.push({ guess: cur, exact: sc.exact, partial: sc.partial });
                const row = ctx.el('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #333' } });
                row.appendChild(ctx.el('span', { style: { letterSpacing: '8px', color: '#fff' }, text: cur.split('').join(' ') }));
                // Right side — peg row.
                const pegs = ctx.el('span', { style: { display: 'flex', gap: '6px', alignItems: 'center', fontSize: '20px' } });
                for (let i = 0; i < sc.exact; i++) pegs.appendChild(ctx.el('span', { style: { color: '#3ae26a', fontWeight: 'bold' }, text: '●' }));
                for (let i = 0; i < sc.partial; i++) pegs.appendChild(ctx.el('span', { style: { color: '#e2c83a' }, text: '○' }));
                if (sc.exact + sc.partial === 0) pegs.appendChild(ctx.el('span', { style: { color: '#7aaaff' }, text: 'NONE' }));
                pegs.appendChild(ctx.el('span', { style: { color: '#888', marginLeft: '8px', fontSize: '16px' }, text: `${sc.exact}● ${sc.partial}○` }));
                row.appendChild(pegs);
                history.appendChild(row);
                history.scrollTop = history.scrollHeight;
                if (sc.exact === 4) { sfx.win && sfx.win(); ctx.timeout(() => ctx.win(), 500); return; }
                if (guesses.length >= MAX_TRIES) {
                    sfx.lose && sfx.lose();
                    history.appendChild(ctx.el('div', { style: { color: '#e23a3a', textAlign: 'center', marginTop: '8px' }, text: `CODE WAS ${code.join(' ')}` }));
                    ctx.timeout(() => ctx.lose(), 1200); return;
                }
                cur = ''; refreshSlots();
                ctx.setScore(`TRIES LEFT ${MAX_TRIES - guesses.length}`);
            }
            ctx.setScore(`TRIES LEFT ${MAX_TRIES}`);
            // One-line legend at the very top so first-time players know what the pegs mean.
            history.appendChild(ctx.el('div', { style: { color: '#888', fontSize: '18px', textAlign: 'center', borderBottom: '1px solid #333', paddingBottom: '4px' }, text: '● = right digit, right position    ○ = right digit, wrong position' }));
        }
    };

    // -------------------- POLISHED LEGACY ORIGINAL --------------------
    // The original Phase 3 had three mini-games: Reflex Tap, Math Sprint,
    // and Simon Says. The polished Math Sprint (with -3s wrong-answer
    // penalty) and Simon Says (target length 8) are defined above as
    // canonical entries within the Pattern and Memory categories.
    // Reflex Tap is added here with hardened spawn behavior.

    // (M.reflex_tap removed — was a near-duplicate of M.mole_rush.)

    // -------------------- PUZZLE / STRATEGY (5) --------------------

    // 41. Lights Out — 4x4 grid. Click any cell to toggle it AND its 4
    // orthogonal neighbors. Goal: turn every light OFF. Starts with a
    // random valid pattern (random number of taps applied to all-off,
    // so the puzzle is always solvable).
    M.puzzle_lights_out = {
        title: 'LIGHTS OUT',
        desc: 'Turn every light OFF. Click flips the cell and its 4 neighbors. 60 seconds.',
        run(ctx) {
            const N = 4;
            const cells = []; // 2D state
            for (let r = 0; r < N; r++) { cells[r] = []; for (let c = 0; c < N; c++) cells[r][c] = 0; }
            // Generate solvable puzzle: apply 6-10 random toggles to all-off.
            const toggles = randInt(6, 10);
            const flip = (r, c) => {
                if (r < 0 || r >= N || c < 0 || c >= N) return;
                cells[r][c] ^= 1;
            };
            const flipPlus = (r, c) => { flip(r,c); flip(r-1,c); flip(r+1,c); flip(r,c-1); flip(r,c+1); };
            for (let i = 0; i < toggles; i++) flipPlus(randInt(0, N-1), randInt(0, N-1));
            const grid = ctx.el('div', { style: { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', display: 'grid', gridTemplateColumns: `repeat(${N}, 80px)`, gridGap: '8px' } });
            ctx.stage.appendChild(grid);
            const btns = [];
            const refresh = () => {
                let on = 0;
                for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
                    btns[r*N+c].style.background = cells[r][c] ? '#ffd24a' : '#1a1a1a';
                    btns[r*N+c].style.boxShadow = cells[r][c] ? '0 0 14px #ffd24a, inset 0 0 16px #fff8' : 'inset 0 0 12px #000';
                    if (cells[r][c]) on++;
                }
                ctx.setScore(`LIGHTS ${on}`);
                if (on === 0) { sfx.win && sfx.win(); ctx.win(); }
            };
            for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
                const btn = ctx.el('button', { style: { width: '80px', height: '80px', border: '3px solid #555', background: '#1a1a1a', cursor: 'pointer', transition: 'all 0.1s' }, onclick: () => { flipPlus(r, c); sfx.tick && sfx.tick(); refresh(); } });
                btns.push(btn); grid.appendChild(btn);
            }
            refresh();
            countdown(ctx, 60, 'TIME', () => ctx.lose());
        }
    };

    // 42. Sliding Puzzle — 3x3 with tiles 1-8 and one empty slot. Click
    // a tile adjacent to empty to slide. Solve to row-major 1..8.
    M.puzzle_sliding = {
        title: 'SLIDING PUZZLE',
        desc: 'Click a tile next to the empty slot to slide. Order 1-8. 75 seconds.',
        run(ctx) {
            const N = 3; const SIZE = 90;
            // Start with the goal then make 30 random valid moves so the
            // puzzle is always solvable.
            let board = [1,2,3,4,5,6,7,8,0];
            let empty = 8;
            const moves = [-1, 1, -N, N];
            for (let i = 0; i < 30; i++) {
                const r = Math.floor(empty / N), c = empty % N;
                const cands = [];
                if (r > 0) cands.push(empty - N);
                if (r < N-1) cands.push(empty + N);
                if (c > 0) cands.push(empty - 1);
                if (c < N-1) cands.push(empty + 1);
                const tgt = cands[randInt(0, cands.length-1)];
                board[empty] = board[tgt]; board[tgt] = 0; empty = tgt;
            }
            const wrap = ctx.el('div', { style: { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', display: 'grid', gridTemplateColumns: `repeat(${N}, ${SIZE}px)`, gap: '6px', padding: '14px', background: '#0a0a0a', border: '4px solid #444', boxShadow: '0 0 24px rgba(0,255,255,0.2)' } });
            ctx.stage.appendChild(wrap);
            const tiles = [];
            const isSolved = () => board.every((v, i) => i === N*N-1 ? v === 0 : v === i + 1);
            const refresh = () => {
                for (let i = 0; i < N*N; i++) {
                    const v = board[i];
                    tiles[i].textContent = v || '';
                    tiles[i].style.background = v ? '#1a3a5a' : '#000';
                    tiles[i].style.color = v ? '#7adfff' : 'transparent';
                    tiles[i].style.cursor = v ? 'pointer' : 'default';
                    tiles[i].style.boxShadow = v ? 'inset 0 0 10px rgba(120,220,255,0.3)' : 'none';
                }
                if (isSolved()) ctx.win();
            };
            const tryMove = (i) => {
                const r = Math.floor(i / N), c = i % N;
                const er = Math.floor(empty / N), ec = empty % N;
                if ((Math.abs(r-er) === 1 && c === ec) || (Math.abs(c-ec) === 1 && r === er)) {
                    board[empty] = board[i]; board[i] = 0; empty = i;
                    sfx.tick && sfx.tick();
                    refresh();
                }
            };
            for (let i = 0; i < N*N; i++) {
                const t = ctx.el('button', { style: { width: SIZE+'px', height: SIZE+'px', border: '2px solid #2a5a8a', fontSize: '36px', fontFamily: 'VT323, monospace', cursor: 'pointer' }, onclick: () => tryMove(i) });
                tiles.push(t); wrap.appendChild(t);
            }
            refresh();
            countdown(ctx, 75, 'TIME', () => ctx.lose());
        }
    };

    // 43. Mastermind — 4-color hidden code from a palette of 6. 6 guesses.
    // Feedback after each guess: ● = correct color, correct position;
    // ○ = correct color, wrong position; nothing = not in code.
    M.puzzle_mastermind = {
        title: 'MASTERMIND',
        desc: 'Crack the 4-color code in 6 guesses.',
        run(ctx) {
            const COLORS = ['#ff3a3a', '#3a72e2', '#3ae26a', '#ffd24a', '#a040ff', '#ff8aa0'];
            const NAMES = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'PINK'];
            const code = [randInt(0,5), randInt(0,5), randInt(0,5), randInt(0,5)];
            const guesses = [];
            const wrap = ctx.el('div', { style: { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: '#fff', fontFamily: 'VT323, monospace' } });
            ctx.stage.appendChild(wrap);
            const board = ctx.el('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' } });
            wrap.appendChild(board);
            const drawBoard = () => {
                board.innerHTML = '';
                for (let r = 0; r < 6; r++) {
                    const row = ctx.el('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' } });
                    const g = guesses[r];
                    for (let i = 0; i < 4; i++) {
                        const peg = ctx.el('div', { style: { width: '36px', height: '36px', borderRadius: '50%', background: g ? COLORS[g.guess[i]] : '#2a2a2a', border: '2px solid #555' } });
                        row.appendChild(peg);
                    }
                    if (g) {
                        const fb = ctx.el('div', { style: { display: 'flex', gap: '3px', marginLeft: '12px' } });
                        for (let i = 0; i < g.exact; i++) fb.appendChild(ctx.el('div', { style: { width: '12px', height: '12px', borderRadius: '50%', background: '#fff' } }));
                        for (let i = 0; i < g.partial; i++) fb.appendChild(ctx.el('div', { style: { width: '12px', height: '12px', borderRadius: '50%', background: 'transparent', border: '2px solid #fff' } }));
                        row.appendChild(fb);
                    }
                    board.appendChild(row);
                }
            };
            // Current row builder
            const cur = [];
            const palette = ctx.el('div', { style: { display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '8px' } });
            wrap.appendChild(palette);
            for (let i = 0; i < 6; i++) {
                const sw = ctx.el('button', { style: { width: '40px', height: '40px', borderRadius: '50%', background: COLORS[i], border: '2px solid #fff', cursor: 'pointer' }, title: NAMES[i], onclick: () => { if (cur.length < 4) { cur.push(i); drawCur(); } } });
                palette.appendChild(sw);
            }
            const curWrap = ctx.el('div', { style: { display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center', marginBottom: '8px' } });
            wrap.appendChild(curWrap);
            const drawCur = () => {
                curWrap.innerHTML = '';
                for (let i = 0; i < 4; i++) {
                    curWrap.appendChild(ctx.el('div', { style: { width: '32px', height: '32px', borderRadius: '50%', background: cur[i] != null ? COLORS[cur[i]] : '#2a2a2a', border: '2px solid #888' } }));
                }
                const undo = ctx.el('button', { text: 'X', style: { background: '#3a1010', color: '#fff', border: '1px solid #555', padding: '4px 10px', fontFamily: 'VT323, monospace', cursor: 'pointer' }, onclick: () => { cur.pop(); drawCur(); } });
                const submit = ctx.el('button', { text: 'GUESS', style: { background: '#1a3a1a', color: '#fff', border: '1px solid #555', padding: '4px 14px', fontFamily: 'VT323, monospace', cursor: 'pointer' }, onclick: () => {
                    if (cur.length !== 4) return;
                    const guess = cur.slice();
                    let exact = 0; const codeUsed = new Array(4).fill(false); const guessUsed = new Array(4).fill(false);
                    for (let i = 0; i < 4; i++) if (guess[i] === code[i]) { exact++; codeUsed[i] = guessUsed[i] = true; }
                    let partial = 0;
                    for (let i = 0; i < 4; i++) {
                        if (guessUsed[i]) continue;
                        for (let j = 0; j < 4; j++) {
                            if (codeUsed[j]) continue;
                            if (guess[i] === code[j]) { partial++; codeUsed[j] = true; break; }
                        }
                    }
                    guesses.push({ guess, exact, partial });
                    cur.length = 0; drawBoard(); drawCur();
                    ctx.setScore(`GUESS ${guesses.length}/6`);
                    if (exact === 4) { sfx.win && sfx.win(); ctx.win(); return; }
                    if (guesses.length >= 6) { sfx.lose && sfx.lose(); ctx.lose(); return; }
                } });
                curWrap.appendChild(undo); curWrap.appendChild(submit);
            };
            ctx.setScore('GUESS 0/6');
            drawBoard(); drawCur();
        }
    };

    // 44. 2048 (mini) — 4x4 swipe-merge. Reach the 256 tile in 90 seconds.
    M.puzzle_2048 = {
        title: '2048 (TO 256)',
        desc: 'Use ARROW KEYS or swipe. Combine tiles to reach 256. 90 seconds.',
        run(ctx) {
            const N = 4;
            let board = []; for (let i = 0; i < N*N; i++) board.push(0);
            const SIZE = 80;
            const wrap = ctx.el('div', { style: { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', padding: '14px', background: '#0a0a0a', border: '4px solid #555', display: 'grid', gridTemplateColumns: `repeat(${N}, ${SIZE}px)`, gap: '6px' } });
            ctx.stage.appendChild(wrap);
            const tiles = [];
            const colorFor = (v) => {
                if (v === 0) return ['#1a1a1a', 'transparent'];
                const colors = [null, ['#3a3a3a','#fff'], ['#5a3a8a','#fff'], ['#3a72e2','#fff'], ['#3ae26a','#000'], ['#ffd24a','#000'], ['#ff8a3a','#000'], ['#ff3a3a','#fff'], ['#a040ff','#fff'], ['#ff70a0','#000']];
                const idx = Math.log2(v);
                return colors[idx] || ['#fff', '#000'];
            };
            for (let i = 0; i < N*N; i++) {
                const t = ctx.el('div', { style: { width: SIZE+'px', height: SIZE+'px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'VT323, monospace', fontSize: '32px', transition: 'all 0.1s' } });
                tiles.push(t); wrap.appendChild(t);
            }
            const refresh = () => {
                for (let i = 0; i < N*N; i++) {
                    const [bg, fg] = colorFor(board[i]);
                    tiles[i].style.background = bg; tiles[i].style.color = fg;
                    tiles[i].textContent = board[i] || '';
                }
                ctx.setScore('TARGET 256');
                if (board.includes(256)) { sfx.win && sfx.win(); ctx.win(); }
            };
            const spawn = () => {
                const empties = []; for (let i = 0; i < N*N; i++) if (board[i] === 0) empties.push(i);
                if (empties.length === 0) return;
                board[empties[randInt(0, empties.length-1)]] = Math.random() < 0.9 ? 2 : 4;
            };
            const slide = (line) => {
                const filtered = line.filter(v => v !== 0);
                for (let i = 0; i < filtered.length - 1; i++) {
                    if (filtered[i] === filtered[i+1]) { filtered[i] *= 2; filtered.splice(i+1, 1); }
                }
                while (filtered.length < N) filtered.push(0);
                return filtered;
            };
            const move = (dir) => {
                let changed = false;
                for (let i = 0; i < N; i++) {
                    let line = [];
                    for (let j = 0; j < N; j++) {
                        if (dir === 'L') line.push(board[i*N+j]);
                        else if (dir === 'R') line.push(board[i*N+(N-1-j)]);
                        else if (dir === 'U') line.push(board[j*N+i]);
                        else line.push(board[(N-1-j)*N+i]);
                    }
                    const slid = slide(line);
                    for (let j = 0; j < N; j++) {
                        let val = slid[j];
                        let idx;
                        if (dir === 'L') idx = i*N+j;
                        else if (dir === 'R') idx = i*N+(N-1-j);
                        else if (dir === 'U') idx = j*N+i;
                        else idx = (N-1-j)*N+i;
                        if (board[idx] !== val) changed = true;
                        board[idx] = val;
                    }
                }
                if (changed) { spawn(); sfx.tick && sfx.tick(); refresh(); }
                else if (!board.includes(0) && !canMove()) { ctx.lose(); }
            };
            const canMove = () => {
                for (let i = 0; i < N*N; i++) {
                    if (board[i] === 0) return true;
                    const r = Math.floor(i/N), c = i%N;
                    if (c < N-1 && board[i] === board[i+1]) return true;
                    if (r < N-1 && board[i] === board[i+N]) return true;
                }
                return false;
            };
            spawn(); spawn(); refresh();
            // Make the wrap focusable and grab focus immediately so arrow
            // keys reach this handler even if iframe focus drifted.
            wrap.setAttribute('tabindex', '0');
            wrap.style.outline = 'none';
            try { wrap.focus({ preventScroll: true }); } catch (e) { wrap.focus(); }
            // Show explicit on-screen controls so the game is playable on
            // mobile or when the iframe doesn't have keyboard focus.
            const controls = ctx.el('div', { style: { position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'grid', gridTemplateColumns: '60px 60px 60px', gridTemplateRows: '60px 60px', gap: '4px' } });
            const mkArrow = (label, dir, gridArea) => ctx.el('button', { style: { gridArea, fontFamily: 'VT323, monospace', fontSize: '28px', background: '#2a2a4a', color: '#fff', border: '2px solid #5566cc', cursor: 'pointer' }, text: label, onclick: () => move(dir) });
            const up = mkArrow('▲', 'U', '1 / 2 / 2 / 3');
            const left = mkArrow('◀', 'L', '2 / 1 / 3 / 2');
            const down = mkArrow('▼', 'D', '2 / 2 / 3 / 3');
            const right = mkArrow('▶', 'R', '2 / 3 / 3 / 4');
            controls.appendChild(up); controls.appendChild(left); controls.appendChild(down); controls.appendChild(right);
            ctx.stage.appendChild(controls);
            // Listen on BOTH window and document so arrow keys fire from
            // wherever focus is.
            const onKey = (e) => {
                if (e.key === 'ArrowLeft') { e.preventDefault(); move('L'); }
                else if (e.key === 'ArrowRight') { e.preventDefault(); move('R'); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); move('U'); }
                else if (e.key === 'ArrowDown') { e.preventDefault(); move('D'); }
            };
            ctx.on(window, 'keydown', onKey);
            ctx.on(document, 'keydown', onKey);
            // Touch swipe — non-passive so we can prevent the iframe from
            // scrolling on a vertical drag.
            let sx = 0, sy = 0, swiping = false;
            ctx.on(ctx.stage, 'touchstart', (e) => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; swiping = true; }, { passive: true });
            ctx.on(ctx.stage, 'touchmove', (e) => { if (swiping) e.preventDefault(); }, { passive: false });
            ctx.on(ctx.stage, 'touchend', (e) => {
                if (!swiping) return; swiping = false;
                const t = e.changedTouches[0]; const dx = t.clientX - sx, dy = t.clientY - sy;
                if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
                if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'R' : 'L');
                else move(dy > 0 ? 'D' : 'U');
            });
            countdown(ctx, 90, 'TIME', () => ctx.lose());
        }
    };

    // 45. Tower of Hanoi — 4 disks, 3 pegs. Click peg to pick up topmost,
    // click another peg to drop. Cannot place a larger disk on a smaller.
    // Optimal solution is 15 moves. Limit: 22.
    M.puzzle_hanoi = {
        title: 'TOWER OF HANOI',
        desc: 'Move all 4 disks from peg 1 to peg 3. Larger never on smaller. 22 moves max.',
        run(ctx) {
            const NUM_DISKS = 4;
            const pegs = [[4,3,2,1], [], []]; // bigger numbers = bigger disks
            const COLORS = ['#ff3a3a', '#ffd24a', '#3ae26a', '#3a72e2'];
            let picked = -1; // peg index
            let moves = 0; const MAX_MOVES = 22;
            const wrap = ctx.el('div', { style: { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', display: 'flex', gap: '40px', alignItems: 'flex-end' } });
            ctx.stage.appendChild(wrap);
            const pegEls = [];
            for (let i = 0; i < 3; i++) {
                const col = ctx.el('div', { style: { display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', minHeight: '260px', width: '180px', borderBottom: '6px solid #aaa', cursor: 'pointer', padding: '4px', position: 'relative' }, onclick: () => clickPeg(i) });
                const post = ctx.el('div', { style: { position: 'absolute', left: '50%', bottom: '6px', transform: 'translateX(-50%)', width: '8px', height: '240px', background: '#888' } });
                col.appendChild(post);
                pegEls.push(col); wrap.appendChild(col);
            }
            const refresh = () => {
                pegEls.forEach((p, i) => {
                    p.style.borderTop = picked === i ? '3px solid #ffd24a' : '3px solid transparent';
                    // remove disk children except the post
                    Array.from(p.querySelectorAll('.disk')).forEach(d => d.remove());
                    pegs[i].forEach(d => {
                        const w = 40 + d * 28;
                        const disk = ctx.el('div', { class: 'disk', style: { position: 'relative', zIndex: '2', width: w + 'px', height: '24px', background: COLORS[d-1], border: '2px solid #000', marginBottom: '2px', borderRadius: '4px', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)' } });
                        p.appendChild(disk);
                    });
                });
                ctx.setScore(`MOVES ${moves}/${MAX_MOVES}`);
                if (pegs[2].length === NUM_DISKS) { sfx.win && sfx.win(); ctx.win(); return; }
                if (moves >= MAX_MOVES) { sfx.lose && sfx.lose(); ctx.lose(); }
            };
            const clickPeg = (i) => {
                if (picked === -1) {
                    if (pegs[i].length === 0) return;
                    picked = i;
                } else if (picked === i) {
                    picked = -1;
                } else {
                    const fromTop = pegs[picked][pegs[picked].length - 1];
                    const toTop = pegs[i][pegs[i].length - 1];
                    if (toTop !== undefined && toTop < fromTop) { picked = -1; refresh(); return; }
                    pegs[i].push(pegs[picked].pop()); moves++; picked = -1;
                    sfx.tick && sfx.tick();
                }
                refresh();
            };
            refresh();
            countdown(ctx, 120, 'TIME', () => ctx.lose());
        }
    };

    // -------------------- expose --------------------
    window.MINIGAMES = M;

    // Category map — used by initPhase3() to pick exactly one game per
    // category so every run tests reflex + aim + memory + pattern + puzzle.
    window.MINIGAME_CATEGORIES = {
        reflex:  ['flappy_bird', 'piano_tiles', 'whack_color', 'fruit_ninja', 'mole_rush'],
        aim:     ['basketball', 'angry_birds', 'pool', 'bottle_flip'],
        memory:  ['simon_says', 'memory_match', 'cup_shuffle', 'story_recall', 'sound_sequence', 'color_memory'],
        pattern: ['math_sprint', 'spot_imposter', 'sequence_completion', 'symbol_decoder', 'analogy_sprint', 'password_crack'],
        puzzle:  ['puzzle_lights_out', 'puzzle_sliding', 'puzzle_mastermind', 'puzzle_2048', 'puzzle_hanoi'],
    };
})();
