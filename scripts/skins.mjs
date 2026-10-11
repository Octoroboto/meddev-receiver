// Skin rules, shared by the build and the preview. A skin restyles the brushed metal (chassis, panels, buttons, knobs,
// bezels, trim, engraved captions) and fonts. Glass (LCDs, VU glass, the EQ display, fields) and anything lit (LCD text
// glow, LEDs, meters) stay as Default. Decorations (.skin-decor, e.g. a tentacle) may overlap the glass a little; they
// never take clicks. Images live in the skin's images/ folder and are built in as data: URLs.
import { readFileSync } from "node:fs";
const METAL = ["--steel-a", "--steel-b", "--steel-c", "--brushed", "--brushed2", "--grain", "--spec", "--streak", "--raise", "--engrave", "--shadow",
  "--surface", "--line", "--bg", "--ink", "--muted", "--gold", "--gold-dark", "--caption", "--focus",
  "--btn-1", "--btn-2", "--btn-3", "--btn-down-1", "--btn-down-2", "--btn-bezel", "--btn-rim",
  "--knob-1", "--knob-2", "--knob-3", "--knurl-1", "--knurl-2", "--knob-pointer",
  "--vol-1", "--vol-2", "--vol-3", "--vol-cap", "--vol-knurl-1", "--vol-knurl-2", "--vol-knurl-3", "--vol-dot",
  "--bezel-1", "--bezel-2", "--bezel-3", "--plate-1", "--plate-2", "--plate-3", "--key-1", "--key-2", "--key-hover-1", "--key-hover-2", "--title-1", "--title-2",
  "--f-display", "--f-body", "--f-mono"];
// Parts of the receiver a skin may restyle freely (everything about how they look, and where they sit).
const METAL_PARTS = "sx-layer|sx-spot|sx-menu|sx-item|sx-sep|sx-dialog|sx-page|sx-head|sx-grid|sx-note|sx-back|skin-decor|deck|panel|ahead|sheet|pop|syncbar|bellpanel|wtitle|btn|rd-btn|rd-btns|rd-knob|rd-knobs|rd-k|rd-dial|rd-mm|rd-ticks|rdeck|tk|tk-dial|tk-knob|tk-ticks|vol|vol-dial|vol-knob|vol-dot|vol-scale|vol-num|vizsw|sndsw|togs|fxbtns|mixer|pinfoot|strow|hrow|hside|row|station|grid|wrap|top|vu|vu-m|vu-btn|hubrx|rxrow|rxbtns|rxskin|rxset|primary|danger|on|lit|off";
// Glass: it keeps its look in every skin, but a skin may move it a little to fit the theme.
const GLASS_PARTS = "lcd|rxlcd|vu-glass|vizwrap|viz|status";
// Never touched: lights, the spray can and the flies, the hub's own lists, fields, canvases, ids, wildcards.
const PESTS = /\.(canlayer|spraycan|swatter|nozzle|fly|flies|jet)\b|#nozzle/;
const LOCKED = /\.(rd-led|vu-pk|led|list|tabs|hits|msgs|toast)\b|#|\bcanvas\b|\binput\b(?!\[type=checkbox\])|textarea|\bselect\b|::?(placeholder|selection)|\*/;
const PSEUDO = String.raw`(\[[a-z-]+(=("[^"]*"|[a-z0-9-]+))?\])*(:(hover|active|focus|focus-visible|first-child|last-child|nth-child\(\d+\)|nth-of-type\(\d+\)|checked|not\([^)]*\)))*(::(before|after))?`;
const COMPOUND = new RegExp(String.raw`^(html|body|button|small|span|i|svg|input\[type=checkbox\]|\.(${METAL_PARTS}|${GLASS_PARTS}))(\.(${METAL_PARTS}|${GLASS_PARTS}))*${PSEUDO}$`);
const GLASS_IN = new RegExp(String.raw`\.(${GLASS_PARTS})\b`);
const MOVE = /^(margin(-(top|right|bottom|left|inline|block)(-(start|end))?)?|order|align-self|justify-self|grid-(area|column|row)(-(start|end))?|translate|position|top|right|bottom|left|inset)$/;
// Properties that change everything inside a part: only on parts with no glass inside (buttons, knobs, decorations).
const SUBTREE = /^(filter|backdrop-filter|opacity|mix-blend-mode|transform|rotate|scale|zoom|visibility|display|content-visibility|clip-path|mask(-[a-z-]+)?|animation(-[a-z-]+)?)$/;
const LEAF = new RegExp(String.raw`(\.(skin-decor|rd-knob|tk-knob|vol-knob|vol-dot)|button|small|input\[type=checkbox\])${PSEUDO}$`);
// Skins Rob has approved to recolour glass, lights and fields as well (still no layout changes to glass, no pests, no
// @media, no ids, no click/drag behaviour changes). Approval lives here, never in the skin itself.
export const EXEMPT = { "analyze-pics": "Collin's Analyze Pics (Mac OS 8 Platinum) look: its screens, LEDs, EQ, VU faces and fields are part of it. Approved by Rob, 2026-10-11." };
const decls = body => body.split(";").map(d => d.trim()).filter(Boolean).map(d => { const i = d.indexOf(":"); return [d.slice(0, i).trim().toLowerCase(), d.slice(i + 1).trim()]; });

// Pulls @keyframes out (they're checked separately and never scoped). Returns [rest, keyframes[]].
export function splitKeyframes(c) {
  const out = []; let rest = "", i = 0;
  for (;;) { const k = c.slice(i).search(/@(-webkit-)?keyframes\b/); if (k < 0) { rest += c.slice(i); break; }
    const start = i + k, open = c.indexOf("{", start); rest += c.slice(i, start); let d = 0, j = open;
    for (; j < c.length; j++) { if (c[j] === "{") d++; else if (c[j] === "}" && --d === 0) break; }
    out.push(c.slice(start, j + 1)); i = j + 1; }
  return [rest, out];
}
export function checkSkin(id, c) {
  const bad = m => { throw new Error(`skin "${id}": ${m}`); };
  const [flat, frames] = splitKeyframes(c.replace(/\/\*[\s\S]*?\*\//g, ""));
  { const at = /@(?!import\b|font-face\b)([a-z-]+)/i.exec(flat); if (at) bad(`@${at[1]} isn't allowed in a skin`); }
  for (const m of c.matchAll(/(--[a-z0-9-]+)\s*:/gi)) if (!EXEMPT[id] && !METAL.includes(m[1])) bad(`${m[1]} isn't a skin setting. Glass, LCD and LED lights stay as Default.`);
  for (const f of frames) for (const m of f.matchAll(/\{([^{}]*)\}/g)) for (const [p] of decls(m[1]))
    if (/^(filter|backdrop-filter|mix-blend-mode|display|visibility)$/.test(p)) bad(`${p} can't be animated`);
  if (EXEMPT[id]) {
    for (const m of flat.matchAll(/([^{};]+)\{([^{}]*)\}/g)) {
      const sel = m[1].trim(), body = m[2];
      if (/^@font-face$/.test(sel)) continue;
      if (/^@/.test(sel)) bad(`${sel.split(" ")[0]} isn't allowed in a skin`);
      for (const one of sel.split(",").map(x => x.trim())) {
        if (PESTS.test(one)) bad(`"${one}" is the spray can or the flies; they stay the same in every skin`);
        if (/#[a-z_-]/i.test(one)) bad(`"${one}": ids aren't allowed in a skin`);
      }
      for (const [p, v] of decls(body)) if (/(^|-)app-region$|^user-select$/.test(p) || (p === "pointer-events" && !/^none(\s*!important)?$/.test(v))) bad(`${p} isn't allowed in a skin (it would change how the receiver takes clicks)`);
    }
    return;
  }
  for (const m of flat.matchAll(/([^{};]+)\{([^{}]*)\}/g)) {
    const sel = m[1].trim(), body = m[2];
    if (/^@font-face$/.test(sel)) continue;
    if (/^@/.test(sel)) bad(`${sel.split(" ")[0]} isn't allowed in a skin`);
    const parts = sel.split(",").map(x => x.trim().replace(/^html\[data-skin="[^"]+"\]\s*/, ""));
    for (const one of parts) {
      if (!one) continue;
      if (PESTS.test(one)) bad(`"${one}" is the spray can or the flies; they stay the same in every skin`);
      if (LOCKED.test(one)) bad(`"${one}" is a light or a field; skins can't restyle it`);
      for (const part of one.split(/\s*[>+~]\s*|\s+/).filter(Boolean))
        if (!COMPOUND.test(part)) bad(`"${part}" in "${one}" isn't a receiver part a skin can restyle`);
      const glass = GLASS_IN.test(one);
      for (const [p, v] of decls(body)) {
        if (p.startsWith("--")) continue;
        if (/(^|-)app-region$|^user-select$/.test(p) || (p === "pointer-events" && !/^none(\s*!important)?$/.test(v))) bad(`${p} isn't allowed in a skin (it would change how the receiver takes clicks)`);
        if (glass) {
          if (!MOVE.test(p)) bad(`"${one}" is glass: a skin can move it (margin, order, translate, relative position) but not change ${p}`);
          if (p === "position" && v !== "relative") bad(`"${one}" is glass: position can only be relative`);
        } else if (SUBTREE.test(p) && !LEAF.test(one)) bad(`"${one}" contains glass; ${p} there would change the glass too. Use it on a button, knob or .skin-decor instead.`);
      }
    }
  }
}
// Skins: skins/<id>/skin.json + skin.css (+ images/ inlined as data: URLs). A skin may only restyle: CSS, no code,
// no outside files except Google Fonts. ":root" in a skin is scoped to html[data-skin="<id>"] so it always wins.
export const MIME = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", svg: "image/svg+xml", gif: "image/gif" };

// Skin extras (skin.json "extras"): tappable spots a skin lays over its decorations. Data only, never code: the receiver
// builds plain buttons, menus, message boxes and read-only pages from it, all text set as text. Every page has a way back.
//   extras.layers[]: { anchor: "top"|"station"|"pinfoot", box: {left,right,top,bottom,width,height}, spots: [spot] }
//   spot: { label, left, top, width, height, then one of: menu: [entry], say: "text", page: "<page id>", back: true }
//   entry: { text, hint?, disabled?, say?, page?, back? } or { sep: true }
//   extras.pages: { <id>: { title, cols: [..], rows: [[..]], note? } }
const LEN = /^(-?\d+(\.\d+)?(px|%|vw|vh|em|rem)?|0|auto|(calc|clamp|min|max)\([-+*\/ .,%0-9a-z()]*\))$/i;
export function checkExtras(id, x) {
  const bad = m => { throw new Error(`skin "${id}": extras ${m}`); };
  const str = (v, n, what) => { if (typeof v !== "string" || !v.trim() || v.length > n) bad(`${what} must be text up to ${n} characters`); return v; };
  const len = (v, what) => { if (v == null) return; if (typeof v !== "string" || v.length > 80 || !LEN.test(v.trim()) || /url|var|expression|attr/i.test(v)) bad(`${what} "${v}" isn't a plain CSS length`); };
  const only = (o, keys, what) => { if (!o || typeof o !== "object" || Array.isArray(o)) bad(`${what} must be an object`); for (const k of Object.keys(o)) if (!keys.includes(k)) bad(`${what}: "${k}" isn't allowed`); };
  only(x, ["layers", "pages"], "extras");
  const pages = x.pages || {}; only(pages, Object.keys(pages), "pages");
  if (Object.keys(pages).length > 20) bad("can have up to 20 pages");
  for (const [pid, pg] of Object.entries(pages)) {
    if (!/^[a-z0-9-]{1,30}$/.test(pid)) bad(`page id "${pid}" must be lowercase letters, numbers and dashes`);
    only(pg, ["title", "cols", "rows", "note"], `page "${pid}"`); str(pg.title, 80, `page "${pid}" title`);
    if (!Array.isArray(pg.cols) || pg.cols.length < 1 || pg.cols.length > 8) bad(`page "${pid}" needs 1-8 cols`);
    pg.cols.forEach(c => str(c, 40, `page "${pid}" column`));
    if (!Array.isArray(pg.rows) || pg.rows.length > 60) bad(`page "${pid}" can have up to 60 rows`);
    pg.rows.forEach(r => { if (!Array.isArray(r) || r.length > pg.cols.length) bad(`page "${pid}" rows must be lists no longer than cols`); r.forEach(c => { if (typeof c !== "string" || c.length > 80) bad(`page "${pid}" cells must be text up to 80 characters`); }); });
    if (pg.note != null) str(pg.note, 300, `page "${pid}" note`);
  }
  const act = (o, what) => { const n = ["say", "page", "back", "menu"].filter(k => o[k] != null).length; if (n > 1) bad(`${what}: one of say, page, back or menu`);
    if (o.say != null) str(o.say, 300, `${what} say`); if (o.page != null && !pages[o.page]) bad(`${what}: page "${o.page}" isn't in pages`); if (o.back != null && o.back !== true) bad(`${what}: back must be true`); };
  const layers = x.layers || []; if (!Array.isArray(layers) || layers.length > 6) bad("layers must be a list of up to 6");
  let count = 0;
  layers.forEach((L, i) => { only(L, ["anchor", "box", "spots"], `layer ${i}`);
    if (!["top", "station", "pinfoot"].includes(L.anchor)) bad(`layer ${i}: anchor must be top, station or pinfoot`);
    only(L.box || {}, ["left", "right", "top", "bottom", "width", "height"], `layer ${i} box`); for (const [k, v] of Object.entries(L.box || {})) len(v, `layer ${i} box ${k}`);
    if (!Array.isArray(L.spots)) bad(`layer ${i}: spots must be a list`);
    L.spots.forEach((sp, j) => { const w = `layer ${i} spot ${j}`; count++;
      only(sp, ["label", "left", "top", "width", "height", "menu", "say", "page", "back"], w); str(sp.label, 60, `${w} label`);
      for (const k of ["left", "top", "width", "height"]) len(sp[k], `${w} ${k}`); act(sp, w);
      if (sp.menu != null) { if (!Array.isArray(sp.menu) || sp.menu.length > 16) bad(`${w}: menu must be a list of up to 16`);
        sp.menu.forEach((e, k) => { if (e && e.sep === true) { only(e, ["sep"], `${w} entry ${k}`); return; }
          only(e, ["text", "hint", "disabled", "say", "page", "back"], `${w} entry ${k}`); str(e.text, 80, `${w} entry ${k} text`);
          if (e.hint != null) str(e.hint, 80, `${w} entry ${k} hint`); if (e.disabled != null && typeof e.disabled !== "boolean") bad(`${w} entry ${k}: disabled is true or false`); act(e, `${w} entry ${k}`); }); }
    }); });
  if (count > 60) bad("can have up to 60 spots");
  return x;
}
// Reads skins/<id> (skin.json + skin.css + images/) from a folder URL and returns { id, name, description, css } ready for skins.json.
export function buildSkin(dirUrl, id) {
  const read = p => readFileSync(new URL(p, dirUrl), "utf8");
  if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(id)) throw new Error(`skin "${id}": folder names are lowercase letters, numbers and dashes`);
  const meta = JSON.parse(read("skin.json"));
  if (meta.id !== id) throw new Error(`skin "${id}": skin.json id must be "${id}"`);
  // Images become short placeholders while the CSS is checked and scoped, and are inlined at the end. Scanning the
  // rules with megabytes of base64 inside them made the build take minutes (a regex re-scanned every long data URI).
  const imgs = [];
  let c = read("skin.css").replace(/\/\*[\s\S]*?\*\//g, "").replace(/url\(\s*["']?(images\/[a-z0-9._-]+)["']?\s*\)/gi, (m, f) => {
    const ext = f.split(".").pop().toLowerCase(); if (!MIME[ext]) throw new Error(`skin "${id}": ${f} isn't an image type skins can use`);
    imgs.push(`data:${MIME[ext]};base64,${readFileSync(new URL(f, dirUrl)).toString("base64")}`); return `url("data:img${imgs.length - 1}x")`; });
  c = c.replace(/:root\b/g, `html[data-skin="${id}"]`);
  checkSkin(id, c);
  // scope every rule to this skin so it outranks the base look whatever order the styles load in (keyframes stay as they are)
  const scope = `html[data-skin="${id}"]`, [rules, frames] = splitKeyframes(c);
  c = rules.replace(/([^{};]+)\{/g, (m, sel) => { const t = sel.trim(); if (/^@/.test(t) || t.startsWith(scope)) return m;
    return t.split(",").map(x => x.trim()).map(x => x === "html" ? scope : x.startsWith("html ") ? scope + x.slice(4) : `${scope} ${x}`).join(",") + "{"; }) + frames.join("\n");
  if (/<\/(style|script)|javascript:|expression\(|@import(?!\s+url\(\s*["']?https:\/\/fonts\.googleapis\.com\/)/i.test(c)) throw new Error(`skin "${id}": only plain CSS is allowed (no tags, scripts or imports except Google Fonts)`);
  if (/url\(\s*(?!["']?(data:|#))/i.test(c.replace(/@import\s+url\([^)]*\)/g, ""))) throw new Error(`skin "${id}": images must be in the skin's images/ folder`);
  c = c.replace(/data:img(\d+)x(?=")/g, (m, n) => imgs[+n]);
  if (c.length > 1.5e6) throw new Error(`skin "${id}" is ${(c.length / 1e6).toFixed(1)} MB; keep it under 1.5 MB (compress the images)`);
  const out = { id, name: String(meta.name || id), description: String(meta.description || ""), css: c };
  if (meta.extras != null) out.extras = checkExtras(id, meta.extras);
  return out;
}
