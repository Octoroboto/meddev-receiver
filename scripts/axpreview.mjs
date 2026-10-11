// Preview AXMOD on the MDFM receiver before it's pushed: builds one standalone page with the current dist/ (look, skins,
// AXMOD) put into an MDFM radio page, an ACCESSIBILITY button in Settings, and the radio's captions and meters wired to
// AXMOD the way the apps will be. Nothing in mdfm changes.
//   node scripts/axpreview.mjs [--base ../mdfm/dist/radio.html] [--out preview/axmod.html]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
const args = process.argv.slice(2), opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const root = new URL("../", import.meta.url), D = p => readFileSync(new URL("dist/" + p, root), "utf8");
const base = readFileSync(path.resolve(opt("--base") || new URL("../mdfm/dist/radio.html", root).pathname), "utf8");
// The radio wiring every MDFM receiver gets for AXMOD (mdfm's skin/radio-wire.js will carry the same).
const WIRE = `(()=>{ const go=()=>{ const r=window.__radio, A=window.AXMOD; if(!r||!A) return setTimeout(go,200);
  A.hasSound=true;
  r.on("caption",c=>A.caption(c.text,{who:c.who}));
  r.on("nowplaying",s=>A.sound("Music: \\u201c"+s.title+"\\u201d, "+s.style.toLowerCase()+", "+s.bpm+" BPM"));
  const band=(a,i,j)=>{ let m=0; for(let k=i;k<j;k++) m=Math.max(m,a[k]||0); return Math.round(m*100)+"%"; };
  A.describe(document.querySelector("header.top .lcd.viz"),()=>{ if(!r.isOn()) return "off"; const s=r.getSpectrum&&r.getSpectrum(); return s?"bass "+band(s,0,6)+", mids "+band(s,6,13)+", treble "+band(s,13,19):"on"; },{label:"EQ"});
  A.describe(document.querySelector(".vu"),()=>{ const l=r.isOn()&&r.getLevels?r.getLevels():null; return l?"left "+Math.round(l[0]+14)+" VU, right "+Math.round(l[1]+14)+" VU":"radio off"; },{label:"VU meters"});
  const stingers=()=>{ const cb=document.querySelector('#typeList input[data-type="stingers"]'); return cb?cb.checked:true; };
  A.on(v=>{ if(r.setTypes) r.setTypes({stingers:!v.calm&&stingers()}); });
  if(A.get().calm&&r.setTypes) r.setTypes({stingers:false});
}; go(); })();`;
let page = base
  .replace(/<style id="mdfm-skin">[\s\S]*?<\/style>/, () => `<style id="mdfm-skin">${D("receiver.css")}</style>`)
  .replace(/<script id="meddev-skins" type="application\/json">[\s\S]*?<\/script>/, () => `<script id="meddev-skins" type="application/json">${D("skins.json").replace(/</g, "\\u003c")}</script>`)
  .replace(/<script id="meddev-receiver-js">[\s\S]*?<\/script>/, () => `<script>try{localStorage.removeItem("mdfmSkin");localStorage.removeItem("axmod")}catch(e){}</script>\n<script id="meddev-receiver-js">${D("receiver.js")}</script>`)
  .replace(/(<label class="fld">Skin <select data-mdfm-skins[^>]*><\/select>[\s\S]*?<\/label>)/, `$1\n          <div data-axmod></div>`);
if (!page.includes("data-axmod")) throw new Error("couldn't find the Skin setting in the base page");
page = page.replace(/<\/body>/, `<script>${WIRE}</script></body>`);
const bar = `<div class="pv-bar" role="note"><b>AXMOD PREVIEW</b><span>MedDev Receiver ${JSON.parse(D("manifest.json")).version}: not pushed yet. Open Settings, then ACCESSIBILITY (or Cmd+Option+A).</span><label>Skin <select data-mdfm-skins aria-label="Preview skin"></select></label></div>
<style>.pv-bar{position:sticky;top:0;z-index:100;display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;padding:8px 16px;background:#111;color:#f4f4f6;font:600 13px/1.3 -apple-system,Segoe UI,sans-serif;border-bottom:2px solid #e2c86b}.pv-bar b{color:#e2c86b;letter-spacing:.12em}.pv-bar label{margin-left:auto;display:flex;gap:8px;align-items:center}.pv-bar select{font:inherit;padding:3px 6px}</style>`;
const head = (/<head>([\s\S]*?)<\/head>/.exec(page) || [])[1] || "", body = (/<body>([\s\S]*?)<\/body>/.exec(page) || [])[1] || page;
const out = path.resolve(opt("--out") || new URL("preview/axmod.html", root).pathname);
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, head.replace(/<title>[\s\S]*?<\/title>/, "<title>AXMOD Preview</title>") + "\n" + bar + "\n" + body.replace(/<details class="settings" id="settings" hidden>/, '<details class="settings" id="settings" hidden open>'));
console.log(`AXMOD preview -> ${path.relative(process.cwd(), out)}`);
