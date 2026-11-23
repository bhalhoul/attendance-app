// صور الهوية: صورة البروفايل + كوفر Facebook → out/studio/
// node scripts/brand-assets.mjs
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import fs from 'node:fs'; import path from 'node:path';
const brand = JSON.parse(fs.readFileSync('studio/brand.json', 'utf8'));
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const browserExecutable = process.env.REMOTION_BROWSER && fs.existsSync(process.env.REMOTION_BROWSER) ? process.env.REMOTION_BROWSER : null;
for (const [id, out] of [['brand-avatar', 'profile-picture.png'], ['fb-cover', 'facebook-cover.png']]) {
  const inputProps = { brand };
  const composition = await selectComposition({ serveUrl, id, inputProps, browserExecutable });
  await renderStill({ composition, serveUrl, frame: 0, inputProps, browserExecutable, output: path.resolve('out/studio', out) });
  console.log('✔', out);
}
