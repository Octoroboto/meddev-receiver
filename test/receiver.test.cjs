// MedDev Receiver: the build output, and the live updater's checks (a bad or tampered download is never used).
const test = require("node:test"), assert = require("node:assert"), fs = require("fs"), os = require("os"), path = require("path"), vm = require("vm");
const { createReceiverUpdater, applyToPage, validate, versionOf } = require("../client/updater.cjs");
const D = p => fs.readFileSync(path.join(__dirname, "../dist", p), "utf8");
const { version } = JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json"), "utf8"));
const manifest = JSON.parse(D("manifest.json")), css = D("receiver.css"), js = D("receiver.js"), skins = D("skins.json");

test("dist is built, versioned and self-consistent", () => {
  assert.strictEqual(manifest.version, version);
  assert.strictEqual(versionOf(css), version); assert.strictEqual(versionOf(js), version);
  assert.strictEqual(validate({ manifest, css, js, skins }), null);
  assert.match(D("blocks.html"), /<style id="mdfm-skin">[\s\S]*<script id="meddev-skins" type="application\/json">[\s\S]*<script id="meddev-receiver-js">/);
  const b = JSON.parse(skins); assert.ok(b.skins.find(k => k.id === b.default), "the house default is a real skin");
  assert.ok(!/<\//.test(D("blocks.html").split('id="meddev-skins"')[1].split("</script>")[0]), "skins can't close their own tag");
});
test("receiver.js loads and defines the badging", () => {
  const ctx = { window: {}, document: { readyState: "complete", querySelectorAll: () => [], addEventListener() {} }, localStorage: { getItem: () => null, setItem() {} },
    addEventListener() {}, setInterval() {}, setTimeout() {}, requestAnimationFrame() {}, matchMedia: () => ({ matches: false, addEventListener() {} }) };
  ctx.window = ctx; vm.createContext(ctx);
  try { vm.runInContext(js, ctx); } catch (e) { /* DOM-heavy parts may need a browser; the API must still be defined first or last */ }
  assert.strictEqual(typeof ctx.MDFM_BADGES, "string");
});
test("tampered, mismatched or broken downloads are refused", () => {
  assert.match(validate({ manifest, css: css + " ", js, skins }), /doesn't match/);
  assert.match(validate({ manifest, css, js, skins: skins + " " }), /skins.json doesn't match/);
  assert.match(validate({ manifest: { ...manifest, version: "9.9.9" }, css, js, skins }), /version mismatch|match/);
  const evil = js.replace("window.MedDevReceiver=", "window.X=");
  const m2 = JSON.parse(JSON.stringify(manifest)); m2.files["receiver.js"].sha256 = require("crypto").createHash("sha256").update(evil).digest("hex");
  assert.match(validate({ manifest: m2, css, js: evil, skins }), /missing its API/);
});

function bump(v) { const [a, b, c] = v.split(".").map(Number); return `${a}.${b}.${c + 1}`; }
function remote(ver, extraSkin) {
  const c = css.replace(`MedDev Receiver ${version}`, `MedDev Receiver ${ver}`), j = js.replace(`MedDev Receiver ${version}`, `MedDev Receiver ${ver}`);
  const b = JSON.parse(skins); b.version = ver; if (extraSkin) { b.skins.push(extraSkin); b.default = extraSkin.id; } const k = JSON.stringify(b);
  const h = s => require("crypto").createHash("sha256").update(s).digest("hex");
  return { c, j, k, m: { name: "meddev-receiver", version: ver, files: { "receiver.css": { sha256: h(c) }, "receiver.js": { sha256: h(j) }, "skins.json": { sha256: h(k) } } } };
}
const serve = r => async url => url.endsWith("manifest.json") ? r.m : url.endsWith(".css") ? r.c : url.endsWith("skins.json") ? r.k : r.j;
test("a newer good copy is downloaded, kept and used; older or off is ignored", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rx-")), newer = bump(version), r = remote(newer, { id: "brass", name: "Brass", description: "", css: 'html[data-skin="brass"]{--steel-a:#b08d57}' });
  const getJSON = serve(r);
  let on = true; const u = createReceiverUpdater({ dir, getJSON, bundled: { version, css, js }, enabled: () => on });
  assert.strictEqual(u.active().source, "bundled");
  const st = await u.check(); assert.match(st.result, new RegExp("got " + newer));
  assert.deepStrictEqual([u.active().version, u.active().source], [newer, "updated"]);
  assert.strictEqual(u.active().skins.default, "brass", "a new house default arrives with the skins");
  on = false; assert.strictEqual(u.active().source, "bundled", "turning it off goes back to the bundled look");
  on = true; const again = await u.check(); assert.match(again.result, /up to date/);
});
test("a failed download leaves the current look alone", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rx-")), r = remote(bump(version));
  const u = createReceiverUpdater({ dir, getJSON: async url => url.endsWith("manifest.json") ? r.m : url.endsWith(".css") ? r.c + "x" : url.endsWith("skins.json") ? r.k : r.j, bundled: { version, css, js } });
  assert.match((await u.check()).result, /skipped/); assert.strictEqual(u.active().source, "bundled");
  const off = createReceiverUpdater({ dir, getJSON: async () => { throw new Error("offline"); }, bundled: { version, css, js } });
  assert.match((await off.check()).result, /offline/); assert.strictEqual(off.active().source, "bundled");
});
test("applyToPage swaps only when newer and only on pages with both blocks", () => {
  const page = `<style id="mdfm-skin">${css}</style><script id="meddev-receiver-js">${js}</script><script id="x">1</script>`;
  const r = remote(bump(version), { id: "x-y", name: "</script><b>", description: "", css: "" });
  const out = applyToPage(page, { version: bump(version), css: r.c, js: r.j, skinsText: r.k });
  assert.ok(out.includes(`MedDev Receiver ${bump(version)}`) && out.includes('<script id="x">1</script>'));
  assert.ok(/<script id="meddev-skins" type="application\/json">[^<]*<\/script>\n<script id="meddev-receiver-js">/.test(out), "skins go in before the code, and can't close the tag");
  assert.strictEqual(applyToPage(page, { version, css, js }), page, "same version: unchanged");
  assert.strictEqual(applyToPage(`<style id="mdfm-skin">${css}</style>`, { version: bump(version), css: r.c, js: r.j }), `<style id="mdfm-skin">${css}</style>`, "old layout: unchanged");
});
