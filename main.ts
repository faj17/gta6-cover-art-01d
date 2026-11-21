// Neon Coast — a GTA-style multi-panel cover maker (make.fun gta6-cover-art-01).
//
// main.ts is the entrypoint: it hands the app in. It copies this repo's app/ and
// screenshots/ into the output directory (MAKEFUN_OUTPUT_DIR outside the grader,
// /output inside it) and writes /output/dossier.json with buildDossier from the
// vendored make.fun library (vendor/makefun-app.ts, byte-identical to the kit).
// Node 22, standard library only, no network, no build step.
//
// Run it locally:  MAKEFUN_OUTPUT_DIR=/tmp/neon-out node main.ts
// Serve the app:   node serve.ts   (then open http://localhost:8080)

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail fast with a readable message when the entry is not ready to hand in,
// instead of letting buildDossier throw its raw error halfway through the copy.
function preflight(): string[] {
  const problems: string[] = [];
  if (!existsSync(join(repoRoot, 'app', 'index.html'))) {
    problems.push('app/index.html is missing');
  }
  const shotsDir = join(repoRoot, 'screenshots');
  if (!existsSync(shotsDir)) {
    problems.push('screenshots/ is missing (3–4 images, the first by name is the cover)');
  } else {
    const shots = readdirSync(shotsDir).filter((f) => !f.startsWith('.'));
    if (shots.length < 3 || shots.length > 4) {
      problems.push(`screenshots/ holds ${shots.length} images, need 3–4`);
    }
    for (const f of shots) {
      const size = statSync(join(shotsDir, f)).size;
      if (size > 262144) problems.push(`screenshots/${f} is ${size} bytes, over the 256 KiB cap`);
    }
  }
  if (problems.length) {
    throw new Error(`Neon Coast is not ready to hand in:\n- ${problems.join('\n- ')}`);
  }
  return readdirSync(join(repoRoot, 'screenshots')).filter((f) => !f.startsWith('.'));
}

const shots = preflight();

function copyTree(src: string, dst: string): void {
  mkdirSync(dst, { recursive: true });
  cpSync(src, dst, { recursive: true });
}

mkdirSync(outDir, { recursive: true });
copyTree(join(repoRoot, 'app'), join(outDir, 'app'));
if (existsSync(join(repoRoot, 'screenshots'))) {
  copyTree(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'));
}

// The scorer's own caps (from the kit's gate): text_max_bytes shapes the dossier
// text; the other limits refuse an entry the scorer would refuse, so an oversize
// screenshot or an app/ over the caps fails here first, loudly, instead of at grade.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

const dossierBytes = statSync(join(outDir, 'dossier.json')).size;
console.log(
  `Neon Coast handed in to ${outDir}: ${shots.length} screenshots ` +
    `(${shots.join(', ')}), dossier.json ${dossierBytes} bytes.`,
);
