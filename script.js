// ══ SLIDE ENGINE ══
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');
const tags = ['01 / 03 — INTRO', '02 / 03 — PROFILE CARD', '03 / 03 — VIDEO'];
let cur = 0, busy = false;

function set(to) {
    if (busy || to === cur) return; busy = true;
    const dir = to > cur ? 1 : -1;
    slides[cur].className = 'slide s' + (cur + 1) + ' ' + (dir > 0 ? 'go-left' : 'go-right');
    cur = to;
    slides[cur].className = 'slide s' + (cur + 1) + ' active';
    dots.forEach((d, i) => d.classList.toggle('on', i === cur));
    document.getElementById('stag').textContent = tags[cur];
    playFlip();
    if (cur === 1) setTimeout(initCard, 400);
    setTimeout(() => busy = false, 900);
}

function go(d) { set(Math.max(0, Math.min(slides.length - 1, cur + d))); }

let tx = 0;
document.addEventListener('touchstart', e => tx = e.touches[0].clientX, { passive: true });
document.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1); });
document.addEventListener('keydown', e => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); });

// ══ MUSIC ══
const bgm = document.getElementById('bgMusic');
let musicOn = false;
bgm.volume = 0.35;

function toggleMusic() {
    if (!musicOn) {
        bgm.play().then(() => {
            musicOn = true;
            document.getElementById('playBtn').textContent = '⏸';
            document.getElementById('musicBtn').textContent = '🎶';
            document.getElementById('eqAnim').classList.remove('paused');
            toast('🎵 MUSIC ON');
        }).catch(() => toast('Add music.mp3 to folder'));
    }
    else {
        bgm.pause();
        musicOn = false;
        document.getElementById('playBtn').textContent = '▶';
        document.getElementById('musicBtn').textContent = '🎵';
        document.getElementById('eqAnim').classList.add('paused');
        toast('🔇 MUSIC OFF');
    }
}

function restartMusic() { bgm.currentTime = 0; if (!musicOn) toggleMusic(); }
document.getElementById('musicBtn').addEventListener('click', toggleMusic);

// ══ SFX ══
let ac, mg, sfxMuted = false, sfxStarted = false, drones = [];
function initAC() { ac = new (window.AudioContext || window.webkitAudioContext)(); mg = ac.createGain(); mg.gain.value = .4; mg.connect(ac.destination); }
function nt(f, t, d, tp = 'sine', v = .22) { const o = ac.createOscillator(), g = ac.createGain(); o.connect(g); g.connect(mg); o.type = tp; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + d); o.start(t); o.stop(t + d + .05); }
function ns(t, d, v = .1, f = 800) { const b = ac.createBuffer(1, ac.sampleRate * d, ac.sampleRate), dd = b.getChannelData(0); for (let i = 0; i < dd.length; i++) dd[i] = (Math.random() * 2 - 1); const s = ac.createBufferSource(), fi = ac.createBiquadFilter(), g = ac.createGain(); fi.type = 'bandpass'; fi.frequency.value = f; fi.Q.value = 1.5; s.buffer = b; s.connect(fi); fi.connect(g); g.connect(mg); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); s.start(t); s.stop(t + d + .05); }
function gun() { if (!ac || sfxMuted) return; const t = ac.currentTime; ns(t, .04, .35, 150); ns(t + .01, .08, .2, 400); ns(t + .05, .14, .09, 2000); nt(80, t, .12, 'sawtooth', .26); }
function playFlip() { if (!ac || sfxMuted) return; const t = ac.currentTime; [880, 1100, 1320].forEach((f, i) => nt(f, t + i * .06, .08, 'sine', .07)); }
function bubSfx() { if (!ac || sfxMuted) return; const t = ac.currentTime, f = [523, 659, 784, 1047][Math.floor(Math.random() * 4)]; nt(f, t, .1, 'sine', .1); ns(t, .04, .04, 2000); }
function expSfx() { if (!ac || sfxMuted) return; const t = ac.currentTime; ns(t, .28, .26, 200); ns(t, .18, .13, 800); nt(80, t, .18, 'sawtooth', .18); }
function killSfx() { if (!ac || sfxMuted) return; gun(); setTimeout(() => { if (!ac || sfxMuted) return; const t = ac.currentTime; nt(440, t, .05, 'square', .11); nt(880, t + .05, .1, 'sine', .09); nt(1320, t + .1, .14, 'sine', .08); }, 100); }
function introJ() { const t = ac.currentTime + .2; [[330, 0, .18, 'sawtooth', .15], [392, .18, .18, 'sawtooth', .15], [494, .36, .18, 'sawtooth', .15], [659, .54, .3, 'sawtooth', .18], [784, .84, .5, 'sawtooth', .17]].forEach(([f, s, d, tp, v]) => nt(f, t + s, d, tp, v));[0, .54, .84].forEach(s => { nt(82, t + s, .2, 'triangle', .2); ns(t + s, .1, .1, 200); }); ns(t + .84, .5, .08, 3000); }
function startDrone() { [[55, 'sine', .045], [110, 'sine', .022]].forEach(([f, tp, v]) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = tp; o.frequency.value = f; g.gain.value = v; o.connect(g); g.connect(mg); o.start(); drones.push(o); }); }
function stopDrone() { drones.forEach(o => { try { o.stop(); } catch (e) { } }); drones = []; }
function bootSFX() { if (sfxStarted) return; sfxStarted = true; initAC(); introJ(); startDrone(); }

document.getElementById('sndBtn').addEventListener('click', () => {
    if (!sfxStarted) { bootSFX(); return; }
    sfxMuted = !sfxMuted;
    mg.gain.setTargetAtTime(sfxMuted ? 0 : .4, ac.currentTime, .3);
    document.getElementById('sndBtn').textContent = sfxMuted ? '🔈' : '🔊';
    if (sfxMuted) stopDrone(); else startDrone();
});
document.addEventListener('click', bootSFX, { once: true });

// ══ BATTLEFIELD BG ══
(function () {
    const c = document.getElementById('bgC'), ctx = c.getContext('2d');
    let W, H; function rsz() { W = c.width = window.innerWidth; H = c.height = window.innerHeight; } rsz(); window.addEventListener('resize', rsz);
    const emb = Array.from({ length: 65 }, () => ({ x: Math.random() * 2000, y: Math.random() * 2000, r: Math.random() * 1.4 + .3, vy: Math.random() * .4 + .1, vx: (Math.random() - .5) * .3, col: `hsl(${Math.random() * 40 + 5},100%,${50 + Math.random() * 32}%)` }));
    let t = 0;
    function draw() {
        t += .006; ctx.clearRect(0, 0, W, H); const g = ctx.createRadialGradient(W * .38, H * .48, 0, W * .5, H * .5, W * .85); g.addColorStop(0, 'rgba(30,4,0,.96)'); g.addColorStop(.5, 'rgba(9,2,0,.98)'); g.addColorStop(1, 'rgba(3,0,6,1)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); emb.forEach(e => { e.y -= e.vy; e.x += e.vx + Math.sin(t + e.r) * .28; if (e.y < -5) { e.y = H + 5; e.x = Math.random() * W; } ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fillStyle = e.col; ctx.shadowColor = e.col; ctx.shadowBlur = 5; ctx.fill(); ctx.shadowBlur = 0; }); ctx.strokeStyle = 'rgba(255,60,0,0.02)'; ctx.lineWidth = 1; for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); } requestAnimationFrame(draw);
    }
    draw();
})();

// ══ SPARKS ══
const sc = document.getElementById('spkC'), sctx = sc.getContext('2d');
sc.width = window.innerWidth; sc.height = window.innerHeight;
window.addEventListener('resize', () => { sc.width = window.innerWidth; sc.height = window.innerHeight; });
const sparks = [];
function spawnSparks(x, y, n = 16) { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, sp = Math.random() * 6 + 2; sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, dc: Math.random() * .04 + .02, sz: Math.random() * 4 + 2, col: `hsl(${Math.random() * 40 + 5},100%,${55 + Math.random() * 35}%)` }); } }
(function animSparks() { sctx.clearRect(0, 0, sc.width, sc.height); for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.x += s.vx; s.y += s.vy; s.vy += .15; s.life -= s.dc; s.sz *= .96; if (s.life <= 0) { sparks.splice(i, 1); continue; } sctx.globalAlpha = s.life; sctx.fillStyle = s.col; sctx.shadowColor = s.col; sctx.shadowBlur = 5; sctx.beginPath(); sctx.arc(s.x, s.y, s.sz, 0, Math.PI * 2); sctx.fill(); } sctx.globalAlpha = 1; sctx.shadowBlur = 0; requestAnimationFrame(animSparks); })();
document.addEventListener('click', e => { spawnSparks(e.clientX, e.clientY, 14); gun(); });

// ══ FIRE (slide 1) ══
(function () {
    const c = document.getElementById('s1fire'), ctx = c.getContext('2d'); c.width = 280; c.height = 280;
    const pts = [];
    function sp() { for (let i = 0; i < 5; i++) pts.push({ x: 140 + (Math.random() - .5) * 44, y: 215, vx: (Math.random() - .5) * 2.2, vy: -(Math.random() * 3.2 + 2), life: 1, dc: Math.random() * .035 + .025, sz: Math.random() * 11 + 5, hue: Math.random() * 40 }); }
    function draw() { ctx.clearRect(0, 0, 280, 280); sp(); for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; p.x += p.vx; p.y += p.vy; p.life -= p.dc; p.sz *= .97; if (p.life <= 0 || p.sz < .5) { pts.splice(i, 1); continue; } const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.sz); g.addColorStop(0, `hsla(${p.hue},100%,92%,${p.life})`); g.addColorStop(.4, `hsla(${p.hue + 15},100%,56%,${p.life * .8})`); g.addColorStop(1, `hsla(${p.hue + 25},100%,28%,0)`); ctx.beginPath(); ctx.arc(p.x, p.y, p.sz, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill(); } requestAnimationFrame(draw); }
    draw();
})();

// ══ CARD ANIMATIONS ══
let cardDone = false;
function initCard() {
    if (cardDone) return; cardDone = true;
    document.querySelectorAll('.csv[data-tgt]').forEach((el, i) => {
        const tgt = parseInt(el.dataset.tgt); let st = null;
        function step(ts) { if (!st) st = ts; const p = Math.min((ts - st) / 1400, 1), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.floor(e * tgt); if (p < 1) requestAnimationFrame(step); else el.textContent = tgt; }
        setTimeout(() => requestAnimationFrame(step), i * 200);
    });
    setTimeout(() => document.querySelectorAll('.br-f').forEach(b => b.style.width = b.dataset.w + '%'), 500);
}

// ══ BUBBLES ══
document.querySelectorAll('.bub').forEach(b => {
    b.addEventListener('click', e => { e.stopPropagation(); const r = b.getBoundingClientRect(); spawnSparks(r.left + r.width / 2, r.top + r.height / 2, 30); expSfx(); b.classList.add('exploded'); setTimeout(() => { b.classList.remove('exploded'); b.textContent = b.dataset.o; }, 600); });
    b.addEventListener('mouseenter', bubSfx);
});

// ══ KILL COUNTER ══
let kills = 0;
function uk(d) { kills = Math.max(0, kills + d); const el = document.getElementById('kn'); el.textContent = kills; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); if (d > 0) killSfx(); }

// ══ COPY UID ══
function copyUID() { navigator.clipboard.writeText('10105678590').then(() => { toast('✓ UID COPIED!'); if (ac && !sfxMuted) { const t = ac.currentTime; [880, 1100, 1320].forEach((f, i) => nt(f, t + i * .08, .1, 'sine', .1)); } }); }

// ══ SCREENSHOT ══
function dlCard() { html2canvas(document.getElementById('mainCard'), { backgroundColor: '#0f0f18', scale: 2 }).then(c => { const a = document.createElement('a'); a.download = 'FAJMAN_card.png'; a.href = c.toDataURL(); a.click(); toast('✓ SCREENSHOT SAVED!'); }); }

// ══ TOAST ══
function toast(m) { const el = document.getElementById('toast'); el.textContent = m; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2400); }
