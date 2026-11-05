/**
 * NEXUS intro animation, ported from the "Nexus — intro" design.
 *
 * Sequence: blinking cursor types "BOOT" → BOOT breaks into falling glyph
 * rain that fills the screen → the wall dissolves leaving a cluster → glyphs
 * fly in as bricks and build the NEXUS logotype → it turns solid and glows →
 * it is backspaced away → the page is revealed.
 *
 * The engine draws on a canvas and reports DOM state (the typed BOOT prompt)
 * back to React through `onState`. All timers are cleared by `destroy()`.
 */

export type BootState = {
  typed: string;
  showBoot: boolean;
  cursorOn: boolean;
  cursorBlink: boolean;
  bootBroken: number;
};

type Timeline = ReturnType<typeof timeline>;

type Wall = {
  t0: number;
  fs: number;
  cols: number;
  rows: number;
  colsData: { delay: number; speed: number; phase: number; sspeed: number }[];
  chars: string[];
  death: Float64Array;
  cluster: Uint8Array;
};

type Frag = { c: number; r0: number; k: number; delay: number; speed: number; fallAt: number; ch: string; breakAt: number; appear: number };
type Letter = { breakAt: number };
type Part = { k: number; sx: number; sy: number; tx: number; ty: number; start: number; dur: number; solidAt: number; ch: string };

const GLYPHS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン0123456789';

/** The NEXUS logotype on a 14-row brick grid; digit = letter (0 N, 1 E, 2 X, 3 U, 4 S). */
const LOGO = [
  '00000........0000..11111111111111..222........22222..333........3333.....444444444',
  '00000........0000..11111111111111..2222.......22222..333........3333.....444444444',
  '000000.......0000..11111111111111...2222......22222..333........3333.....444444444',
  '0000000......0000....................2222....22222...333........3333.4444.........',
  '....0000.....0000.....................2222..22222....333........3333.4444.........',
  '.....0000....0000..111111111111........222.22222.....333........3333.4444444444444',
  '0000.00000...0000..111111111111...........22222......333........3333....4444444444444',
  '0000..00000..0000..111111111111...........2222.......333........3333....4444444444444',
  '0000...00000.0000..1111...............2222....2......333........3333.............4444',
  '0000....00000......111...............22222..2222.....333........3333..............444',
  '0000.....0000000...111..............22222...22222....333........333..............4444',
  '0000......0000000.....11111111111...2222.....22222......33333333......444444444444',
  '0000.......000000.....11111111111..2222.......22222.....33333333......444444444444',
  '0000........00000.....11111111111.2222.........2222.....33333333......444444444444',
];

const rand = () => Math.random();
const glyph = () => GLYPHS[Math.floor(rand() * GLYPHS.length)];

function timeline(wallMs: number, dissolveMs: number, formMs: number) {
  const HOLD = wallMs;
  const DIS = dissolveMs;
  const FORM = formMs;
  const FALL = 2700; // wall front reaches the bottom
  const FORM0 = FALL + HOLD + DIS + 300; // first brick of N flies in
  const BUILT = FORM0 + 5 * FORM + 400; // last brick has landed
  const SOLID0 = BUILT + 300; // bricks start turning solid (sweep L→R)
  const SWEEP = 1000;
  const MORPH = 450;
  const SOLID1 = SOLID0 + SWEEP + MORPH;
  const ERASE0 = SOLID1 + 1500; // backspace starts
  const ERASE = 130;
  const END = ERASE0 + 5 * ERASE;
  return { HOLD, DIS, FORM, FALL, FORM0, BUILT, SOLID0, SWEEP, MORPH, SOLID1, ERASE0, ERASE, END };
}

export type IntroOptions = {
  canvas: HTMLCanvasElement;
  getBootEl: () => HTMLElement | null;
  getCursorEl: () => HTMLElement | null;
  accent: string;
  fontFamily: string;
  onState: (patch: Partial<BootState>) => void;
  /** Called when the overlay should fade out to reveal the page. */
  onReveal: () => void;
  wallMs?: number;
  dissolveMs?: number;
  formMs?: number;
  typeMs?: number;
};

export class IntroEngine {
  private o: IntroOptions;
  private T: Timeline;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private raf = 0;
  private lastDraw = 0;
  private ctx: CanvasRenderingContext2D | null = null;
  private dpr = 1;
  private wall: Wall | null = null;
  private shards: { letters: Letter[]; frags: Frag[] } | null = null;
  private parts: { list: Part[]; bs: number } | null = null;
  private bootBroken = 0;
  private rgb: [number, number, number];

  constructor(options: IntroOptions) {
    this.o = options;
    this.T = timeline(options.wallMs ?? 2500, options.dissolveMs ?? 1400, options.formMs ?? 600);
    const hex = options.accent.replace('#', '');
    const n = parseInt(hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex, 16);
    this.rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  start() {
    this.raf = requestAnimationFrame(this.loop);
    this.run();
  }

  destroy() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    cancelAnimationFrame(this.raf);
  }

  private at(ms: number, fn: () => void) {
    this.timers.push(setTimeout(fn, ms));
  }

  private green(a: number) {
    const [r, g, b] = this.rgb;
    return `rgba(${r},${g},${b},${a.toFixed(3)})`;
  }

  private font(px: number) {
    return `${px}px ${this.o.fontFamily}`;
  }

  private run() {
    const K = this.o.typeMs ?? 170;
    const T = this.T;
    this.o.onState({ showBoot: true, typed: '', cursorOn: true, cursorBlink: true, bootBroken: 0 });

    // 1. Blinking cursor on black, then type BOOT.
    let t = 1000;
    this.at(t, () => this.o.onState({ cursorBlink: false }));
    for (let i = 0; i < 4; i++) this.at(t + i * K, () => this.o.onState({ typed: 'BOOT'.slice(0, i + 1) }));
    t += 4 * K;
    this.at(t + 100, () => this.o.onState({ cursorBlink: true }));
    t += 2550; // BOOT holds on screen

    // 2. BOOT breaks into rain glyphs; the wall pours down.
    const tRain = t;
    this.at(tRain, () => this.startWall());
    this.at(tRain + T.FALL + 150, () => this.o.onState({ showBoot: false, typed: '', cursorOn: false }));
    // 3. Plan the cluster and brick build of NEXUS.
    this.at(tRain + T.FALL + 300, () => this.prepareNexus());

    // 4. Solidify and backspace are canvas-driven; then black → page.
    const tEnd = tRain + T.END;
    this.at(tEnd + 100, () => {
      this.wall = null;
      this.parts = null;
      this.ctx?.clearRect(0, 0, this.o.canvas.width, this.o.canvas.height);
    });
    this.at(tEnd + 700, () => this.o.onReveal());
  }

  private fit() {
    const c = this.o.canvas;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(c.clientWidth * dpr));
    const h = Math.max(1, Math.round(c.clientHeight * dpr));
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
    }
    this.ctx = c.getContext('2d');
    this.dpr = dpr;
    return !!this.ctx;
  }

  private startWall() {
    if (!this.fit()) return;
    const { FALL, HOLD, DIS } = this.T;
    const canvas = this.o.canvas;
    const fs = Math.round(16 * this.dpr);
    const cols = Math.ceil(canvas.width / fs);
    const rows = Math.ceil(canvas.height / fs) + 1;
    const colsData = Array.from({ length: cols }, () => {
      const delay = 300 + rand() * 400;
      const dur = (FALL - delay) * (0.75 + rand() * 0.25);
      return { delay, speed: rows / dur, phase: rand() * rows, sspeed: 0.012 + rand() * 0.018 };
    });
    const n = cols * rows;
    const chars = Array.from({ length: n }, glyph);
    const death = new Float64Array(n);
    const disStart = FALL + HOLD;
    for (let i = 0; i < n; i++) death[i] = disStart + Math.pow(rand(), 0.8) * DIS;
    this.wall = { t0: performance.now(), fs, cols, rows, colsData, chars, death, cluster: new Uint8Array(n) };
    this.buildShards();
  }

  /** Which grid cells a piece of text covers. items: [{ch, x, cy}] in canvas px. */
  private sampleInk(items: { ch: string; x: number; cy: number }[], fontPx: number) {
    const w = this.wall!;
    const fs = w.fs;
    const off = document.createElement('canvas');
    off.width = this.o.canvas.width;
    off.height = this.o.canvas.height;
    const o = off.getContext('2d')!;
    o.font = this.font(fontPx);
    o.textBaseline = 'middle';
    o.textAlign = 'left';
    o.fillStyle = '#fff';
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const it of items) {
      o.fillText(it.ch, it.x, it.cy);
      minX = Math.min(minX, it.x);
      maxX = Math.max(maxX, it.x + fontPx);
      minY = Math.min(minY, it.cy - fontPx);
      maxY = Math.max(maxY, it.cy + fontPx);
    }
    const c0 = Math.max(0, Math.floor(minX / fs));
    const c1 = Math.min(w.cols - 1, Math.ceil(maxX / fs));
    const r0 = Math.max(0, Math.floor(minY / fs));
    const r1 = Math.min(w.rows - 1, Math.ceil(maxY / fs));
    const img = o.getImageData(0, 0, off.width, off.height).data;
    const out: { c: number; r: number; k: number }[] = [];
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        let hits = 0;
        for (let a = 1; a <= 3; a++)
          for (let b = 1; b <= 3; b++) {
            const px = Math.floor(c * fs + (a * fs) / 4);
            const py = Math.floor(r * fs + (b * fs) / 4);
            if (px < off.width && py < off.height && img[(py * off.width + px) * 4 + 3] > 120) hits++;
          }
        if (hits >= 3) {
          const cx = c * fs + fs / 2;
          let k = 0;
          for (let q = 0; q < items.length; q++) if (cx >= items[q].x) k = q;
          out.push({ c, r, k });
        }
      }
    }
    return out;
  }

  /** BOOT → grid glyphs that fall with the rain. */
  private buildShards() {
    this.shards = null;
    const el = this.o.getBootEl();
    const w = this.wall;
    if (!el || !w) return;
    const dpr = this.dpr;
    const r = el.getBoundingClientRect();
    const cr = this.o.canvas.getBoundingClientRect();
    const fontPx = parseFloat(getComputedStyle(el).fontSize) || 40;
    const adv = (r.width - 0.68 * fontPx) / 6;
    const items = '> BOOT'
      .split('')
      .map((ch, i) => ({ ch, x: (r.left - cr.left + i * adv) * dpr, cy: (r.top - cr.top + r.height / 2) * dpr }))
      .filter((it) => it.ch !== ' ');
    const cells = this.sampleInk(items, fontPx * dpr);
    const frags: Frag[] = cells.map((cl) => {
      const cd = w.colsData[cl.c];
      return {
        c: cl.c,
        r0: cl.r,
        k: cl.k,
        delay: cd.delay,
        speed: cd.speed,
        fallAt: cd.delay + cl.r / cd.speed,
        ch: glyph(),
        breakAt: 0,
        appear: 0,
      };
    });
    // A letter breaks into glyphs just before the rain reaches it.
    const letters: Letter[] = items.map((_, k) => {
      let first = Infinity;
      for (const f of frags) if (f.k === k) first = Math.min(first, f.fallAt);
      return { breakAt: (first === Infinity ? 600 : first) - 280 };
    });
    for (const f of frags) f.breakAt = letters[f.k].breakAt;
    // The blinking cursor keeps blinking until the rain breaks it down too.
    const ce = this.o.getCursorEl();
    if (ce) {
      const q = ce.getBoundingClientRect();
      const rx = (q.left - cr.left) * dpr;
      const ry = (q.top - cr.top) * dpr;
      const rw = q.width * dpr;
      const rh = q.height * dpr;
      const fs = w.fs;
      const kC = letters.length;
      let first = Infinity;
      for (let c = Math.floor(rx / fs); c <= Math.floor((rx + rw) / fs); c++) {
        for (let rr = Math.floor(ry / fs); rr <= Math.floor((ry + rh) / fs); rr++) {
          const cx = c * fs + fs / 2;
          const cy = rr * fs + fs / 2;
          if (c < 0 || c >= w.cols || cx < rx - fs * 0.3 || cx > rx + rw + fs * 0.3 || cy < ry || cy > ry + rh) continue;
          const cd = w.colsData[c];
          const fallAt = cd.delay + rr / cd.speed;
          first = Math.min(first, fallAt);
          frags.push({ c, r0: rr, k: kC, delay: cd.delay, speed: cd.speed, fallAt, ch: glyph(), breakAt: 0, appear: 0 });
        }
      }
      letters.push({ breakAt: (first === Infinity ? 600 : first) - 280 });
      for (const f of frags) if (f.k === kC) f.breakAt = letters[kC].breakAt;
    }
    for (const f of frags) f.appear = f.breakAt;
    this.shards = { letters, frags };
    // Fade each real letter out exactly when its glyphs fade in (0 = '>', 1–4 = BOOT, 5 = cursor).
    letters.forEach((L, k) =>
      this.at(Math.max(0, L.breakAt), () => {
        this.bootBroken |= 1 << k;
        this.o.onState({ bootBroken: this.bootBroken });
      }),
    );
  }

  /** A cluster survives the dissolve; its glyphs fly in as bricks and stack into N-E-X-U-S. */
  private prepareNexus() {
    const w = this.wall;
    this.parts = null;
    if (!w) return;
    const T = this.T;
    const fs = w.fs;
    const W = this.o.canvas.width;
    const H = this.o.canvas.height;
    const LH = LOGO.length;
    let cMax = 0;
    for (const row of LOGO) for (let c = 0; c < row.length; c++) if (row[c] !== '.') cMax = Math.max(cMax, c);
    const totalCols = cMax + 1;
    const bs = Math.max(3, Math.floor(Math.min(14 * this.dpr, (W * 0.66) / totalCols)));
    const wordW = totalCols * bs;
    const wordH = LH * bs;
    const ox = Math.round((W - wordW) / 2);
    const oy = Math.round((H - wordH) / 2);

    const targets: { k: number; r: number; x: number; y: number }[] = [];
    const colLetter = new Array<number>(totalCols).fill(-1);
    for (let r = 0; r < LH; r++)
      for (let c = 0; c < LOGO[r].length; c++) {
        const ch = LOGO[r][c];
        if (ch === '.') continue;
        colLetter[c] = +ch;
        targets.push({ k: +ch, r, x: ox + c * bs, y: oy + r * bs });
      }
    for (let c = 1; c < totalCols; c++) if (colLetter[c] < 0) colLetter[c] = colLetter[c - 1];

    // The ragged cluster left behind when the rain stops.
    const padX = fs * 6;
    const padY = fs * 5;
    const left = ox;
    const right = ox + wordW;
    const top = oy;
    const bottom = oy + wordH;
    const c0 = Math.max(0, Math.floor((left - padX * 1.6) / fs));
    const c1 = Math.min(w.cols - 1, Math.ceil((right + padX * 1.6) / fs));
    const r0 = Math.max(0, Math.floor((top - padY * 1.6) / fs));
    const r1 = Math.min(w.rows - 1, Math.ceil((bottom + padY * 1.6) / fs));
    const pool: number[] = [];
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const idx = r * w.cols + c;
        const x = c * fs + fs / 2;
        const y = r * fs + fs / 2;
        const dx = Math.max(0, left - x, x - right) / padX;
        const dy = Math.max(0, top - y, y - bottom) / padY;
        if (rand() > Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) * 0.65)) continue;
        w.cluster[idx] = 1;
        const inside = x >= left && x <= right && y >= top && y <= bottom;
        if (inside) {
          const k = Math.max(0, colLetter[Math.min(totalCols - 1, Math.floor((x - left) / bs))]);
          w.death[idx] = T.FORM0 + k * T.FORM - 80 + rand() * 60;
        } else {
          w.death[idx] = T.FORM0 + rand() * (T.BUILT - T.FORM0 - 200);
        }
        pool.push(idx);
      }
    }

    // Bricks: letter by letter, bottom row up; each lifts off from the cluster and snaps in.
    const list: Part[] = targets.map((tg) => {
      const land = T.FORM0 + tg.k * T.FORM + ((LH - 1 - tg.r) / (LH - 1)) * T.FORM * 0.95 + rand() * 90;
      const dur = 300 + rand() * 120;
      let sx: number;
      let sy: number;
      let pick = -1;
      for (let tries = 0; tries < 14 && pool.length; tries++) {
        const j = Math.floor(rand() * pool.length);
        const pidx = pool[j];
        const px = (pidx % w.cols) * fs;
        const py = Math.floor(pidx / w.cols) * fs;
        if (w.death[pidx] < land - dur) continue;
        if (Math.abs(px - tg.x) + Math.abs(py - tg.y) >= fs * 4 || tries === 13) {
          pick = j;
          break;
        }
      }
      if (pick >= 0) {
        const pidx = pool.splice(pick, 1)[0];
        sx = (pidx % w.cols) * fs;
        sy = Math.floor(pidx / w.cols) * fs;
        w.death[pidx] = land - dur;
      } else {
        sx = tg.x + (rand() - 0.5) * fs * 12;
        sy = bottom + fs * 6;
      }
      const frac = (tg.x - left) / wordW;
      const e = frac < 0.5 ? 4 * frac * frac * frac : 1 - Math.pow(-2 * frac + 2, 3) / 2;
      return { k: tg.k, sx, sy, tx: tg.x, ty: tg.y, start: land - dur, dur, solidAt: T.SOLID0 + e * T.SWEEP, ch: glyph() };
    });
    this.parts = { list, bs };
  }

  private loop = (now: number) => {
    if (this.wall && now - this.lastDraw > 30 && this.fit()) {
      this.lastDraw = now;
      this.draw(now);
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  private draw(now: number) {
    const w = this.wall!;
    const ctx = this.ctx!;
    const fs = w.fs;
    const el = now - w.t0;
    ctx.clearRect(0, 0, this.o.canvas.width, this.o.canvas.height);
    ctx.font = this.font(fs);
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';

    if (el < this.T.BUILT) {
      for (let k = 0; k < w.chars.length * 0.04; k++) w.chars[Math.floor(rand() * w.chars.length)] = glyph();
      for (let i = 0; i < w.cols; i++) {
        const cd = w.colsData[i];
        const front = Math.max(0, (el - cd.delay) * cd.speed);
        if (front <= 0) continue;
        const last = Math.min(w.rows, Math.floor(front));
        const head = cd.phase + el * cd.sspeed;
        const x = i * fs;
        for (let j = 0; j <= last && j < w.rows; j++) {
          const idx = j * w.cols + i;
          if (el >= w.death[idx]) continue;
          const y = j * fs;
          ctx.fillStyle = '#000';
          ctx.fillRect(x, y, fs, fs);
          let a: number;
          if (j === last && front < w.rows) a = 1;
          else {
            const trail = front < w.rows ? Math.max(0, 1 - (last - j) / 8) : 0;
            const kk = (((head - j) % 22) + 22) % 22;
            const streak = kk < 9 ? 1 - kk / 9 : 0;
            a = Math.min(1, 0.28 + 0.72 * Math.max(streak, trail));
          }
          ctx.fillStyle = this.green(a);
          ctx.fillText(w.chars[idx], x + fs / 2, y + fs * 0.08);
        }
      }
    }
    this.drawShards(el, fs);
    this.drawParts(el);
  }

  private drawShards(el: number, fs: number) {
    const S = this.shards;
    const ctx = this.ctx!;
    const w = this.wall!;
    if (!S) return;
    let alive = S.letters.some((L) => el < L.breakAt);
    ctx.font = this.font(fs);
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';
    for (const f of S.frags) {
      if (el < f.appear) continue;
      const row = el > f.fallAt ? Math.max(f.r0, Math.floor((el - f.delay) * f.speed)) : f.r0;
      if (row >= w.rows) continue;
      alive = true;
      if (rand() < 0.3) f.ch = glyph();
      const x = f.c * fs;
      ctx.fillStyle = '#000';
      ctx.fillRect(x, row * fs, fs, fs);
      ctx.fillStyle = this.green(1);
      ctx.fillText(f.ch, x + fs / 2, row * fs + fs * 0.08);
    }
    if (!alive) this.shards = null;
  }

  private drawParts(el: number) {
    const P = this.parts;
    const ctx = this.ctx!;
    const T = this.T;
    if (!P) return;
    const bs = P.bs;
    const erased = el >= T.ERASE0 ? Math.min(5, 1 + Math.floor((el - T.ERASE0) / T.ERASE)) : 0;
    const smooth = (x: number) => {
      x = Math.max(0, Math.min(1, x));
      return x * x * (3 - 2 * x);
    };
    const glow = smooth((el - T.SOLID0) / (T.SWEEP + T.MORPH));
    ctx.font = this.font(Math.round(bs * 0.9));
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    // Pass 1: solid blocks (one glow).
    ctx.save();
    ctx.shadowColor = this.green(0.85);
    ctx.shadowBlur = bs * (0.4 + 1.2 * glow);
    for (const p of P.list) {
      if (p.k >= 5 - erased) continue;
      const m = smooth((el - p.solidAt) / T.MORPH);
      if (m <= 0) continue;
      ctx.globalAlpha = m;
      ctx.fillStyle = this.green(1);
      const inset = (1 - m) * bs * 0.22;
      ctx.fillRect(p.tx + inset - 0.5, p.ty + inset - 0.5, bs - inset * 2 + 1, bs - inset * 2 + 1);
    }
    ctx.restore();

    // Pass 2: glyph bricks (flying in, landed, then fading as the block takes over).
    for (const p of P.list) {
      if (el < p.start || p.k >= 5 - erased) continue;
      const m = smooth((el - p.solidAt) / T.MORPH);
      const t = Math.min(1, (el - p.start) / p.dur);
      const s = 1.4;
      const e = 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
      const x = p.sx + (p.tx - p.sx) * e;
      const y = p.sy + (p.ty - p.sy) * e;
      const landed = t >= 1;
      if (rand() < (landed ? 0.12 : 0.4)) p.ch = glyph();
      if (m < 1) {
        ctx.globalAlpha = 1 - m;
        if (m === 0) {
          ctx.fillStyle = '#000';
          ctx.fillRect(x, y, bs, bs);
        }
        ctx.fillStyle = this.green(landed ? 1 : 0.75);
        ctx.fillText(p.ch, x + bs / 2, y + bs / 2);
      }
    }
    ctx.globalAlpha = 1;
  }
}
