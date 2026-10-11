// Checks that every control on the receiver sits inside it, for every skin, at phone, tablet, app and desktop widths.
//   node scripts/fitcheck.mjs preview/<id>.html      (needs Playwright; run on a preview page so new skins are included)
let chromium; try { ({ chromium } = await import(process.env.PLAYWRIGHT || "playwright")); } catch { console.log("Playwright isn't installed: npm i -D playwright, then run again."); process.exit(0); }
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os"; import { join } from "node:path";
const page = process.argv[2]; if (!page) { console.error("Usage: node scripts/fitcheck.mjs preview/<id>.html"); process.exit(1); }
const out = join(mkdtempSync(join(tmpdir(), "fit-")), "fit.html");
writeFileSync(out, '<!doctype html><html><head><meta charset="utf-8"></head><body>' + readFileSync(page, "utf8") + "</body></html>");
const b = await chromium.launch(); let bad = 0;
for (const [w, h, app] of [[390, 844, false], [700, 900, false], [1060, 820, true], [1440, 1000, false]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } }); await p.goto("file://" + out); await p.waitForTimeout(600);
  if (app) await p.evaluate(() => { document.documentElement.classList.add("appwin"); const c = document.getElementById("wctl"); if (c) c.hidden = false; });
  const ids = await p.evaluate(() => MDFM_skins.list().map(s => s.id));
  for (const s of ids) {
    await p.evaluate(s => { MDFM_skins.set(s); document.querySelector(".pv-bar")?.remove(); }, s); await p.waitForTimeout(250);
    const off = await p.evaluate(() => { const W = document.querySelector(".wrap").getBoundingClientRect(), res = [];
      document.querySelectorAll(".wrap button,.wrap label.vizsw,.wrap [role=slider],.wrap summary").forEach(e => { if (e.closest(".sx-layer")) return;   // skin extras sit on decorations and may be cropped on purpose
        if (e.closest("details:not([open])") && !e.matches("summary")) return; const r = e.getBoundingClientRect(); if (!r.width) return;
        if (r.left < W.left - 1 || r.right > W.right + 1 || r.left < 0 || r.right > innerWidth) res.push(e.id || e.textContent.trim().slice(0, 14) || e.className); });
      return res; });
    if (off.length) { bad++; console.log(`${w}px ${s}: outside the receiver: ${off.join(", ")}`); }
  }
  await p.close();
}
await b.close(); console.log(bad ? "FIT PROBLEMS" : "All controls fit, every skin, every width."); process.exit(bad ? 1 : 0);
