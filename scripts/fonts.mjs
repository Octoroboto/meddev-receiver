// Fetch the two AXMOD reading fonts once, so they're built into receiver.css (no web font loads at runtime).
//   npm run fonts      (needs the internet; writes src/fonts/*.woff2, then run npm test)
// Both are SIL Open Font License 1.1: Atkinson Hyperlegible (Braille Institute) and OpenDyslexic (Abbie Gonzalez).
// Each font is tried at its pinned version first, then at the newest; one that can't be fetched is skipped (the build
// then uses the stand-in font for it) and the others are still saved.
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
const root = new URL("../", import.meta.url);
const CDN = "https://cdn.jsdelivr.net/npm/";
const FILES = {
  "atkinson-400.woff2": ["@fontsource/atkinson-hyperlegible", "5.0.20", "atkinson-hyperlegible-latin-400-normal.woff2"],
  "atkinson-700.woff2": ["@fontsource/atkinson-hyperlegible", "5.0.20", "atkinson-hyperlegible-latin-700-normal.woff2"],
  "opendyslexic-400.woff2": ["@fontsource/opendyslexic", "5.0.12", "opendyslexic-latin-400-normal.woff2"],
  "opendyslexic-700.woff2": ["@fontsource/opendyslexic", "5.0.12", "opendyslexic-latin-700-normal.woff2"],
};
mkdirSync(new URL("src/fonts/", root), { recursive: true });
let missing = 0;
for (const [name, [pkg, ver, file]] of Object.entries(FILES)) {
  if (existsSync(new URL("src/fonts/" + name, root)) && !process.argv.includes("--force")) { console.log(`${name}  already here`); continue; }
  let saved = false;
  for (const url of [`${CDN}${pkg}@${ver}/files/${file}`, `${CDN}${pkg}/files/${file}`]) {
    try { const r = await fetch(url); if (!r.ok) throw new Error("HTTP " + r.status);
      const b = Buffer.from(await r.arrayBuffer()); if (b.subarray(0, 4).toString("latin1") !== "wOF2") throw new Error("not a woff2 file");
      writeFileSync(new URL("src/fonts/" + name, root), b); console.log(`${name}  ${(b.length / 1024).toFixed(0)} KB  (${url.replace(CDN, "")})`); saved = true; break;
    } catch (e) { console.log(`${name}: ${url.replace(CDN, "")} didn't work (${e.message})`); }
  }
  if (!saved) missing++;
}
console.log(missing ? `${missing} font file(s) couldn't be fetched; the build uses the stand-in font for those. Now run: npm test` : "Fonts saved in src/fonts. Now run: npm test");
