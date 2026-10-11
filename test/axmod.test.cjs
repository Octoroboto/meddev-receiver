// AXMOD: the settings list is sound, and it's built into receiver.js / receiver.css / dist/axmod.schema.json.
const test = require("node:test"), assert = require("node:assert"), fs = require("fs"), path = require("path");
const R = p => fs.readFileSync(path.join(__dirname, "..", p), "utf8");
const S = JSON.parse(R("src/axmod.schema.json"));
const STANDARD = ["size", "contrast", "font", "spacing", "reduce", "noflash", "colorblind", "gray", "focus", "cursor", "lock", "still", "steady", "captions", "textalt"];
const EXTRAS = ["speak", "speakRate", "voice", "ruler", "saturation", "left", "calm", "hotkeys"];

test("every option is complete and valid", () => {
  const ids = S.options.map(o => o.id), secs = S.sections.map(s => s.id);
  assert.strictEqual(new Set(ids).size, ids.length, "option ids are unique");
  for (const o of S.options) {
    assert.ok(secs.includes(o.section), `${o.id}: section ${o.section} exists`);
    assert.ok(o.label && typeof o.label === "string", `${o.id}: has a label`);
    if (o.type === "bool") assert.strictEqual(typeof o.default, "boolean");
    else if (o.type === "choice") assert.ok(o.choices.some(c => c[0] === o.default), `${o.id}: default is a choice`);
    else if (o.type === "range") assert.ok(o.min <= o.default && o.default <= o.max && o.step > 0, `${o.id}: default in range`);
    else assert.strictEqual(o.type, "voice");
  }
});
test("full spectrum: the standard 15 plus Rob's extras", () => {
  const ids = S.options.map(o => o.id);
  for (const k of [...STANDARD, ...EXTRAS]) assert.ok(ids.includes(k), `has ${k}`);
  assert.strictEqual(S.options.find(o => o.id === "noflash").default, false, "No flashing is off by default (Rob: some skins flash on purpose; Default never does)");
  assert.strictEqual(S.options.find(o => o.id === "reduce").os, "prefers-reduced-motion: reduce", "Reduce motion follows the computer");
  assert.ok(S.options.find(o => o.id === "size").choices.some(c => c[0] === "200"), "text goes to 200%");
});
test("presets only set real options to real values", () => {
  const O = Object.fromEntries(S.options.map(o => [o.id, o]));
  for (const p of S.presets) for (const [k, v] of Object.entries(p.values)) {
    assert.ok(O[k], `${p.id}: ${k} exists`);
    if (O[k].type === "bool") assert.strictEqual(typeof v, "boolean");
    if (O[k].type === "choice") assert.ok(O[k].choices.some(c => c[0] === v), `${p.id}: ${k}=${v} is a choice`);
  }
  assert.deepStrictEqual(S.presets.map(p => p.id).sort(), ["dyslexia", "keyboard", "lowvision", "motion"]);
});
test("built into dist", () => {
  const js = R("dist/receiver.js"), css = R("dist/receiver.css");
  assert.ok(!js.includes("/*AXMOD_SCHEMA*/"), "the settings list replaced the placeholder");
  assert.ok(js.includes('"presets":[') && js.includes("window.AXMOD=AX"), "AXMOD is in receiver.js");
  assert.ok(js.indexOf("window.AXMOD=AX") > js.indexOf("window.MDFM_skins="), "AXMOD comes after the skins");
  assert.ok(css.includes(".ax-drawer{") && css.includes("html.ax-contrast"), "AXMOD styles are in receiver.css");
  assert.deepStrictEqual(JSON.parse(R("dist/axmod.schema.json")), S, "dist/axmod.schema.json matches src (for the Swift port)");
  assert.ok(!/<\/?(style|script)\b/i.test(js + css));
});
test("AXMOD styles stay out of the skins' locked parts", () => {
  const css = R("src/axmod.css");
  assert.ok(!/(^|[^-\w])#(?![0-9a-fA-F]{3,8}\b)[a-zA-Z]/.test(css.replace(/url\("data:[^)]*\)/g, "")), "no id selectors");
});
