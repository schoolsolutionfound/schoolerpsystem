/**
 * One-off: regenerate icon.png / adaptive-icon.png / splash-icon.png /
 * favicon.png from the real brand logo. Run once: node scripts/generate-icons.mjs
 */
import { Jimp } from 'jimp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const A = (f) => path.join(root, 'assets', f);

const src = await Jimp.read(A('logo-transparent.png'));
console.log('source logo:', src.width + 'x' + src.height, 'alpha=' + src.hasAlpha());

/** Cover-fit the logo onto a square canvas of `size`, centered. */
async function makeIcon(size, { bg, padRatio, out }) {
  const canvas = new Jimp({ width: size, height: size, color: bg });

  // Scale logo to fit inside the padded box, preserving aspect.
  const box = Math.round(size * padRatio);
  const scale = Math.min(box / src.width, box / src.height);
  const w = Math.round(src.width * scale);
  const h = Math.round(src.height * scale);
  const resized = src.clone().resize({ w, h });

  canvas.composite(
    resized,
    Math.round((size - w) / 2),
    Math.round((size - h) / 2)
  );

  await canvas.write(A(out));
  console.log('wrote', out, size + 'x' + size);
}

// App icon (iOS + Android launcher fallback): cream background, logo ~72%.
await makeIcon(1024, { bg: 0xfffdf7ff, padRatio: 0.72, out: 'icon.png' });

// Android adaptive foreground: transparent, logo kept inside the 66% safe circle.
await makeIcon(1024, { bg: 0x00000000, padRatio: 0.55, out: 'adaptive-icon.png' });

// Native splash image: transparent, logo prominent.
await makeIcon(1024, { bg: 0x00000000, padRatio: 0.8, out: 'splash-icon.png' });

// Web favicon: small, cream bg.
await makeIcon(48, { bg: 0xfffdf7ff, padRatio: 0.85, out: 'favicon.png' });

console.log('done');
