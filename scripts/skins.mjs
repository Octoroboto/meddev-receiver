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
const METAL_PARTS = "skin-decor|deck|panel|ahead|sheet|pop|syncbar|bellpanel|wtitle|btn|rd-btn|rd-btns|rd-knob|rd-knobs|rd-k|rd-dial|rd-mm|rd-ticks|rdeck|tk|tk-dial|tk-knob|tk-ticks|vol|vol-dial|vol-knob|vol-dot|vol-scale|vol-num|vizsw|sndsw|togs|fxbtns|mixer|pinfoot|strow|hrow|hside|row|station|grid|wrap|top|vu|vu-m|vu-btn|hubrx|rxrow|rxbtns|rxskin|rxset|primary|danger|on|lit|off";
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
  for (const m of c.matchAll(/(--[a-z0-9-]+)\s*:/gi)) if (!METAL.includes(m[1])) bad(`${m[1]} isn't a skin setting. Glass, LCD and LED lights stay as Default.`);
  for (const f of frames) for (const m of f.matchAll(/\{([^{}]*)\}/g)) for (const [p] of decls(m[1]))
    if (/^(filter|backdrop-filter|mix-blend-mode|display|visibility)$/.test(p)) bad(`${p} can't be animated`);
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

// Reads skins/<id> (skin.json + skin.css + images/) from a folder URL and returns { id, name, description, css } ready for skins.json.
export function buildSkin(dirUrl, id) {
  const read = p => readFileSync(new URL(p, dirUrl), "utf8");
  if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(id)) throw new Error(`skin "${id}": folder names are lowercase letters, numbers and dashes`);
  const meta = JSON.parse(read("skin.json"));
  if (meta.id !== id) throw new Error(`skin "${id}": skin.json id must be "${id}"`);
  let c = read("skin.css").replace(/\/\*[\s\S]*?\*\//g, "").replace(/url\(\s*["']?(images\/[a-z0-9._-]+)["']?\s*\)/gi, (m, f) => {
    const ext = f.split(".").pop().toLowerCase(); if (!MIME[ext]) throw new Error(`skin "${id}": ${f} isn't an image type skins can use`);
    return `url("data:${MIME[ext]};base64,${readFileSync(new URL(f, dirUrl)).toString("base64")}")`; });
  c = c.replace(/:root\b/g, `html[data-skin="${id}"]`);
  checkSkin(id, c);
  // scope every rule to this skin so it outranks the base look whatever order the styles load in (keyframes stay as they are)
  const scope = `html[data-skin="${id}"]`, [rules, frames] = splitKeyframes(c);
  c = rules.replace(/([^{};]+)\{/g, (m, sel) => { const t = sel.trim(); if (/^@/.test(t) || t.startsWith(scope)) return m;
    return t.split(",").map(x => x.trim()).map(x => x === "html" ? scope : x.startsWith("html ") ? scope + x.slice(4) : `${scope} ${x}`).join(",") + "{"; }) + frames.join("\n");
  if (/<\/(style|script)|javascript:|expression\(|@import(?!\s+url\(\s*["']?https:\/\/fonts\.googleapis\.com\/)/i.test(c)) throw new Error(`skin "${id}": only plain CSS is allowed (no tags, scripts or imports except Google Fonts)`);
  if (/url\(\s*(?!["']?(data:|#))/i.test(c.replace(/@import\s+url\([^)]*\)/g, ""))) throw new Error(`skin "${id}": images must be in the skin's images/ folder`);
  if (c.length > 1.5e6) throw new Error(`skin "${id}" is ${(c.length / 1e6).toFixed(1)} MB; keep it under 1.5 MB (compress the images)`);
  return { id, name: String(meta.name || id), description: String(meta.description || ""), css: c };
}
