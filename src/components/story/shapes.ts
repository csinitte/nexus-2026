/**
 * Shapes the NEXUS "N" transforms into while scrolling the home page.
 * Each is drawn into a SIZE×SIZE canvas in metallic silver with green accents;
 * particles take their positions and colours from the drawn pixels.
 */
export const SIZE = 400;

/** Pixel columns of each letter inside /brand/nexus-wordmark.png (1708×290). */
export const WORDMARK = {
  width: 1708,
  height: 290,
  letters: [
    [4, 340],
    [380, 665],
    [696, 1026],
    [1059, 1361],
    [1391, 1704],
  ] as const,
};

/** The N crop fitted into the SIZE box (shared by the drawn letter and its particles). */
export function nFit() {
  const [sx, ex] = WORDMARK.letters[0];
  const w = ex - sx;
  const h = WORDMARK.height;
  const scale = (0.92 * SIZE) / Math.max(w, h);
  return { sx, sw: w, sh: h, w: w * scale, h: h * scale, x: (SIZE - w * scale) / 2, y: (SIZE - h * scale) / 2 };
}

const ACCENT = '#8cea5a';

function silver(ctx: CanvasRenderingContext2D, y0 = 40, y1 = 360) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, '#f5f5f5');
  g.addColorStop(0.45, '#b9b9b9');
  g.addColorStop(1, '#4e4e4e');
  return g;
}

/** About NEXUS — "Connecting chapters": a hub linked to a ring of chapter nodes. */
function network(ctx: CanvasRenderingContext2D) {
  const c = SIZE / 2;
  const inner = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    return [c + Math.cos(a) * 128, c + Math.sin(a) * 128] as const;
  });
  const outer = Array.from({ length: 6 }, (_, i) => {
    const a = ((i + 0.5) / 6) * Math.PI * 2 - Math.PI / 2;
    return [c + Math.cos(a) * 178, c + Math.sin(a) * 178] as const;
  });
  ctx.lineCap = 'round';
  ctx.strokeStyle = silver(ctx);
  ctx.lineWidth = 9;
  ctx.beginPath();
  inner.forEach(([x, y], i) => {
    ctx.moveTo(c, c);
    ctx.lineTo(x, y);
    const [nx, ny] = inner[(i + 1) % 6];
    ctx.moveTo(x, y);
    ctx.lineTo(nx, ny);
  });
  ctx.stroke();
  ctx.lineWidth = 5;
  ctx.beginPath();
  outer.forEach(([x, y], i) => {
    const [ax, ay] = inner[i];
    const [bx, by] = inner[(i + 1) % 6];
    ctx.moveTo(x, y);
    ctx.lineTo(ax, ay);
    ctx.moveTo(x, y);
    ctx.lineTo(bx, by);
  });
  ctx.stroke();
  ctx.fillStyle = silver(ctx);
  for (const [x, y] of inner) {
    ctx.beginPath();
    ctx.arc(x, y, 24, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const [x, y] of outer) {
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();
  }
  // Hub with a glowing green ring.
  ctx.beginPath();
  ctx.arc(c, c, 48, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(c, c, 62, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = ACCENT;
  for (const i of [0, 2, 4]) {
    const [x, y] = inner[i];
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** About the hosts — an institution: pediment, columns and steps. */
function institution(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = silver(ctx, 60, 360);
  ctx.beginPath();
  ctx.moveTo(52, 138);
  ctx.lineTo(200, 58);
  ctx.lineTo(348, 138);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(62, 146, 276, 24);
  for (let i = 0; i < 5; i++) ctx.fillRect(80 + i * 54, 182, 26, 128);
  ctx.fillRect(62, 312, 276, 16);
  ctx.fillRect(46, 334, 308, 18);
  ctx.fillRect(30, 358, 340, 18);
  // Green accents: crest in the pediment and a lit step edge.
  ctx.fillStyle = '#121212';
  ctx.beginPath();
  ctx.arc(200, 110, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.arc(200, 110, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(62, 172, 276, 5);
  ctx.fillRect(30, 376, 340, 5);
}

/** One day of innovation — a lightbulb with a glowing filament. */
function lightbulb(ctx: CanvasRenderingContext2D) {
  const c = SIZE / 2;
  ctx.fillStyle = silver(ctx, 40, 340);
  ctx.beginPath();
  ctx.arc(c, 158, 108, Math.PI * 0.78, Math.PI * 2.22);
  ctx.lineTo(c + 44, 268);
  ctx.lineTo(c - 44, 268);
  ctx.closePath();
  ctx.fill();
  // Screw base bands.
  for (let i = 0; i < 4; i++) ctx.fillRect(c - 46 + i * 3, 276 + i * 20, 92 - i * 6, 13);
  ctx.beginPath();
  ctx.moveTo(c - 26, 356);
  ctx.lineTo(c + 26, 356);
  ctx.lineTo(c + 12, 372);
  ctx.lineTo(c - 12, 372);
  ctx.closePath();
  ctx.fill();
  // Filament cut-out and glow.
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#121212';
  ctx.lineWidth = 16;
  const filament = () => {
    ctx.beginPath();
    ctx.moveTo(c - 30, 262);
    ctx.lineTo(c - 30, 186);
    ctx.lineTo(c - 15, 162);
    ctx.lineTo(c, 186);
    ctx.lineTo(c + 15, 162);
    ctx.lineTo(c + 30, 186);
    ctx.lineTo(c + 30, 262);
    ctx.stroke();
  };
  filament();
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 7;
  filament();
  // Rays.
  ctx.lineWidth = 7;
  for (const a of [-150, -115, -90, -65, -30]) {
    const r = (a * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(c + Math.cos(r) * 132, 158 + Math.sin(r) * 132);
    ctx.lineTo(c + Math.cos(r) * 162, 158 + Math.sin(r) * 162);
    ctx.stroke();
  }
}

export const OBJECTS = [
  { id: 'network', label: 'Connecting chapters', draw: network },
  { id: 'institution', label: 'Hosted at NMAMIT', draw: institution },
  { id: 'lightbulb', label: 'One day of innovation', draw: lightbulb },
] as const;

export type ShapePoints = { x: Float32Array; y: Float32Array; r: Uint8Array; g: Uint8Array; b: Uint8Array };

/**
 * Samples `count` points (normalised 0–1) and colours from a drawing.
 * Points are sorted by angle around the centre so morphs sweep rather than scatter.
 */
export function sampleShape(draw: (ctx: CanvasRenderingContext2D) => void, count: number): ShapePoints {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  draw(ctx);
  const data = ctx.getImageData(0, 0, SIZE, SIZE).data;
  const cells: number[] = [];
  for (let y = 0; y < SIZE; y += 2)
    for (let x = 0; x < SIZE; x += 2) {
      const i = (y * SIZE + x) * 4;
      // Opaque and not the dark "cut-out" colour.
      if (data[i + 3] > 160 && data[i] + data[i + 1] + data[i + 2] > 90) cells.push(i);
    }
  const picked = Array.from({ length: count }, () => cells[Math.floor(Math.random() * cells.length)] ?? 0);
  const pts = picked.map((i) => {
    const p = i / 4;
    const x = (p % SIZE) + Math.random() * 2;
    const y = Math.floor(p / SIZE) + Math.random() * 2;
    return { x: x / SIZE, y: y / SIZE, r: data[i], g: data[i + 1], b: data[i + 2], a: Math.atan2(y - SIZE / 2, x - SIZE / 2) };
  });
  pts.sort((p, q) => p.a - q.a);
  const out: ShapePoints = {
    x: new Float32Array(count),
    y: new Float32Array(count),
    r: new Uint8Array(count),
    g: new Uint8Array(count),
    b: new Uint8Array(count),
  };
  pts.forEach((p, k) => {
    out.x[k] = p.x;
    out.y[k] = p.y;
    out.r[k] = p.r;
    out.g[k] = p.g;
    out.b[k] = p.b;
  });
  return out;
}

/** Draws the N letter from the wordmark image into the SIZE box. */
export function drawN(img: HTMLImageElement) {
  return (ctx: CanvasRenderingContext2D) => {
    const f = nFit();
    const k = sourceScale(img);
    ctx.drawImage(img, f.sx * k, 0, f.sw * k, f.sh * k, f.x, f.y, f.w, f.h);
  };
}

/** The loaded image may be a resized copy (next/image); letter columns are in original pixels. */
export function sourceScale(img: HTMLImageElement) {
  return img.naturalWidth / WORDMARK.width || 1;
}
