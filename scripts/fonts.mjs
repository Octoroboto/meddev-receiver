// Fetch the two AXMOD reading fonts once, so they're built into receiver.css (no web font loads at runtime).
//   npm run fonts      (needs the internet; writes src/fonts/*.woff2, then run npm test)
// Both are SIL Open Font License 1.1: Atkinson Hyperlegible (Braille Institute) and OpenDyslexic (Abbie Gonzalez).
import { writeFileSync, mkdirSync } from "node:fs";
const root = new URL("../", import.meta.url);
const CDN = "https://cdn.jsdelivr.net/npm/";
const FILES = {
  "atkinson-400.woff2": "@fontsource/atkinson-hyperlegible@5.0.20/files/atkinson-hyperlegible-latin-400-normal.woff2",
  "atkinson-700.woff2": "@fontsource/atkinson-hyperlegible@5.0.20/files/atkinson-hyperlegible-latin-700-normal.woff2",
  "opendyslexic-400.woff2": "@fontsource/opendyslexic@5.0.12/files/opendyslexic-latin-400-normal.woff2",
  "opendyslexic-700.woff2": "@fontsource/opendyslexic@5.0.12/files/opendyslexic-latin-700-normal.woff2",
};
mkdirSync(new URL("src/fonts/", root), { recursive: true });
for (const [name, p] of Object.entries(FILES)) {
  const r = await fetch(CDN + p); if (!r.ok) throw new Error(`${p}: HTTP ${r.status}`);
  const b = Buffer.from(await r.arrayBuffer());
  if (b.subarray(0, 4).toString("latin1") !== "wOF2") throw new Error(`${p} isn't a woff2 file`);
  writeFileSync(new URL("src/fonts/" + name, root), b); console.log(`${name}  ${(b.length / 1024).toFixed(0)} KB`);
}
console.log("Fonts saved in src/fonts. Now run: npm test");
