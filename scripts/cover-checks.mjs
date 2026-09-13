/**
 * THE CHECKS A `--cover` PNG MUST PASS, IN NODE, WITH NO IMAGE LIBRARY.
 * DECISIONS.md D160. Used by `scripts/pick-cover.mjs`'s shoot key.
 *
 * The same checks every cover has been verified against by hand since D154:
 *
 *   size         (bezel + 2 x margin) x scale in both directions
 *   corners      all four at alpha 0
 *   margins      the opaque area is inset exactly margin x scale on all four
 *                sides - equal, and not clipped at any edge
 *   whole phone  the opaque area is exactly the bezel x scale
 *   no shadow    every pixel more than 2px outside the bezel's rounded outline
 *                is alpha 0
 *   opaque       every pixel more than 2px inside it is alpha 255
 *
 * Partly transparent pixels are allowed within 2px of the outline: that is the
 * rounded corner's anti-aliasing, and it is intended (D154).
 *
 * PNG decoding is the format's own, by hand: chunks, zlib (Node's built-in),
 * and the five scanline filters. Chromium writes a cover as 8-bit RGBA,
 * non-interlaced; anything else is reported as a failed check rather than
 * guessed at.
 */
import zlib from 'node:zlib';

/** 8-bit RGBA pixels from a PNG buffer, or `{ error }`. */
export function decodePng(buffer) {
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  if (!sig.every((b, i) => buffer[i] === b)) return { error: 'not a PNG file' };
  let pos = 8; let width = 0; let height = 0; let depth = 0; let colour = 0; let interlace = 0;
  const idat = [];
  while (pos < buffer.length) {
    const length = buffer.readUInt32BE(pos);
    const type = buffer.toString('ascii', pos + 4, pos + 8);
    const data = buffer.subarray(pos + 8, pos + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      depth = data[8]; colour = data[9]; interlace = data[12];
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    pos += 12 + length;
  }
  if (depth !== 8 || colour !== 6 || interlace !== 0) {
    return { error: `not 8-bit non-interlaced RGBA (bit depth ${depth}, colour type ${colour}, interlace ${interlace}) - a cover without an alpha channel cannot be transparent`, width, height };
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = 4; const stride = width * bpp;
  const out = Buffer.alloc(width * height * bpp);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const row = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[row + x - bpp] : 0;
      const b = y > 0 ? out[row - stride + x] : 0;
      const c = x >= bpp && y > 0 ? out[row - stride + x - bpp] : 0;
      let v = line[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c; const pa = Math.abs(p - a); const pb = Math.abs(p - b); const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      out[row + x] = v & 255;
    }
  }
  return { width, height, pixels: out };
}

/**
 * Runs every check. `spec` is in CSS px: `{ bezelWidth, bezelHeight, radius,
 * margin, scale }`. Returns `{ ok, checks: [{ name, pass, detail }] }`.
 */
export function checkCover(buffer, spec) {
  const checks = [];
  const add = (name, pass, detail) => checks.push({ name, pass, detail });
  const img = decodePng(buffer);
  if (img.error) {
    add('format', false, img.error);
    return { ok: false, checks };
  }
  const { width: W, height: H, pixels } = img;
  const s = spec.scale;
  const expectW = Math.round((spec.bezelWidth + spec.margin * 2) * s);
  const expectH = Math.round((spec.bezelHeight + spec.margin * 2) * s);
  add('size', W === expectW && H === expectH, `${W}x${H}, expected ${expectW}x${expectH}`);

  const alpha = (x, y) => pixels[(y * W + x) * 4 + 3];
  const corners = [[0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1]].map(([x, y]) => alpha(x, y));
  add('corners at alpha 0', corners.every((a) => a === 0), `alpha ${corners.join(', ')}`);

  let L = W; let T = H; let R = -1; let B = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (alpha(x, y)) { if (x < L) L = x; if (x > R) R = x; if (y < T) T = y; if (y > B) B = y; }
  }
  if (R < 0) {
    add('whole phone', false, 'the image is entirely transparent');
    return { ok: false, checks };
  }
  const margins = { left: L, top: T, right: W - 1 - R, bottom: H - 1 - B };
  const want = Math.round(spec.margin * s);
  const equal = margins.left === margins.right && margins.top === margins.bottom && margins.left === margins.top;
  add('equal margins', equal && margins.left === want,
    `left ${margins.left}, right ${margins.right}, top ${margins.top}, bottom ${margins.bottom}; expected ${want} each`);
  const boxW = R - L + 1; const boxH = B - T + 1;
  const phoneW = Math.round(spec.bezelWidth * s); const phoneH = Math.round(spec.bezelHeight * s);
  add('whole phone, nothing clipped', boxW === phoneW && boxH === phoneH && L > 0 && T > 0 && R < W - 1 && B < H - 1,
    `opaque area ${boxW}x${boxH}, expected ${phoneW}x${phoneH}`);

  // Signed distance inside the bezel's rounded outline, in PNG px.
  const rad = spec.radius * s; const rr = R + 1; const bb = B + 1;
  const inside = (x, y) => {
    const px = x + 0.5; const py = y + 0.5;
    const corner = (px < L + rad || px > rr - rad) && (py < T + rad || py > bb - rad);
    if (corner) {
      const cx = Math.min(Math.max(px, L + rad), rr - rad); const cy = Math.min(Math.max(py, T + rad), bb - rad);
      return rad - Math.hypot(px - cx, py - cy);
    }
    return Math.min(px - L, rr - px, py - T, bb - py);
  };
  let outsideNonZero = 0; let interiorNotOpaque = 0; let partialFar = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const a = alpha(x, y); const d = inside(x, y);
    if (d < -2 && a !== 0) outsideNonZero++;
    if (d > 2 && a !== 255) interiorNotOpaque++;
    if (a > 0 && a < 255 && Math.abs(d) > 2) partialFar++;
  }
  add('no shadow', outsideNonZero === 0, `${outsideNonZero} pixels more than 2px outside the outline are not alpha 0`);
  add('phone opaque', interiorNotOpaque === 0 && partialFar === 0,
    `${interiorNotOpaque} pixels more than 2px inside are not alpha 255; ${partialFar} partly transparent pixels away from the outline`);

  return { ok: checks.every((c) => c.pass), checks };
}
