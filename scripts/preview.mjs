// Preview a skin before it's added: builds one standalone page (the MDFM receiver, playable) with the candidate skin
// selected and a dropdown to compare it with the others. Nothing in skins/ or dist/ changes.
//   node scripts/preview.mjs <path/to/candidate-skin-folder> [--base ../mdfm/dist/radio.html] [--out preview/<id>.html]
// The candidate folder holds skin.json + skin.css (+ images/), the same as skins/<id>/. Publish the output as a private
// page to look at it; when it's approved, copy the folder into skins/<id>/ (see README "Adding a skin").
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { buildSkin } from "./skins.mjs";

const args = process.argv.slice(2), opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const dir = args.find(a => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--base" && args[args.indexOf(a) - 1] !== "--out");
if (!dir) { console.error("Usage: node scripts/preview.mjs <candidate-skin-folder> [--base ../mdfm/dist/radio.html] [--out file]"); process.exit(1); }
const root = new URL("../", import.meta.url);
const dirUrl = pathToFileURL(path.resolve(dir) + "/");
const meta = JSON.parse(readFileSync(new URL("skin.json", dirUrl), "utf8"));
const skin = buildSkin(dirUrl, meta.id);   // the same checks the real build uses
const D = p => readFileSync(new URL("dist/" + p, root), "utf8");
const bundle = JSON.parse(D("skins.json"));
bundle.skins = [...bundle.skins.filter(s => s.id !== skin.id), skin];
bundle.default = skin.id;   // preview only: "House default" shows the candidate
const base = readFileSync(path.resolve(opt("--base") || new URL("../mdfm/dist/radio.html", root).pathname), "utf8");
const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
let page = base
  .replace(/<style id="mdfm-skin">[\s\S]*?<\/style>/, () => `<style id="mdfm-skin">${D("receiver.css")}</style>`)
  .replace(/<script id="meddev-skins" type="application\/json">[\s\S]*?<\/script>/, () => `<script id="meddev-skins" type="application/json">${JSON.stringify(bundle).replace(/</g, "\\u003c")}</script>`)
  .replace(/<script id="meddev-receiver-js">[\s\S]*?<\/script>/, () => `<script>try{localStorage.removeItem("mdfmSkin")}catch(e){}</script>\n<script id="meddev-receiver-js">${D("receiver.js")}</script>`);
if (!page.includes('id="meddev-skins"')) throw new Error("the base page has no skins block; rebuild mdfm first (npm run receiver:sync && npm run build)");
const bar = `<div class="pv-bar" role="note"><b>SKIN PREVIEW</b><span>${esc(skin.name)}: not added or pushed yet</span><label>Compare <select data-mdfm-skins aria-label="Compare skins"></select></label></div>
<style>.pv-bar{position:sticky;top:0;z-index:100;display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;padding:8px 16px;background:#111;color:#f4f4f6;font:600 13px/1.3 -apple-system,Segoe UI,sans-serif;border-bottom:2px solid #e2c86b}.pv-bar b{color:#e2c86b;letter-spacing:.12em}.pv-bar label{margin-left:auto;display:flex;gap:8px;align-items:center}.pv-bar select{font:inherit;padding:3px 6px}</style>`;
// The artifact publisher adds its own page skeleton: keep the head's contents and the body's contents.
const head = (/<head>([\s\S]*?)<\/head>/.exec(page) || [])[1] || "", body = (/<body>([\s\S]*?)<\/body>/.exec(page) || [])[1] || page;
const out = path.resolve(opt("--out") || new URL(`preview/${skin.id}.html`, root).pathname);
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, head.replace(/<title>[\s\S]*?<\/title>/, `<title>Skin preview: ${esc(skin.name)}</title>`) + "\n" + bar + "\n" + body);
console.log(`preview of "${skin.name}" (${(skin.css.length / 1024).toFixed(0)} KB) -> ${path.relative(process.cwd(), out)}`);
