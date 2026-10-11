// Receiver controls and behaviour: saved settings that aren't usable fall back, and the spray can answers each click once.
const test = require("node:test"), assert = require("node:assert"), fs = require("fs"), path = require("path"), vm = require("vm");
const R = p => fs.readFileSync(path.join(__dirname, "..", p), "utf8");

function runControls(store) {
  const calls = { tone: [], vol: [] };
  const ctx = { document: { querySelector: () => null, querySelectorAll: () => [] },
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem() {} } };
  ctx.window = ctx; vm.createContext(ctx); vm.runInContext(R("src/controls.js"), ctx);
  ctx.MDFM_receiver({ setTone: t => calls.tone.push({ ...t }), setVolume: v => calls.vol.push(v), setTypes() {} });
  return calls;
}
test("saved tone and volume that aren't numbers go back to their defaults, and are kept in range", () => {
  let c = runControls({ mdfmVolume: '"loud"', mdfmTone: '{"low":"x","mid":99,"high":-3}' });
  assert.deepStrictEqual(c.vol, [0.8]); assert.deepStrictEqual(c.tone, [{ low: 0, mid: 12, high: -3 }]);
  c = runControls({ mdfmVolume: "7", mdfmTone: "[1,2]" });
  assert.deepStrictEqual(c.vol, [1]); assert.deepStrictEqual(c.tone, [{ low: 0, mid: 0, high: 0 }]);
  c = runControls({ mdfmVolume: "0.35", mdfmTone: '{"low":-4.5,"mid":0,"high":2}' });
  assert.deepStrictEqual(c.vol, [0.35]); assert.deepStrictEqual(c.tone, [{ low: -4.5, mid: 0, high: 2 }]);
});
test("the spray can has one click handler (a second one undid each click with reduced motion on)", () => {
  const b = R("src/behaviour.js");
  assert.ok(!/\bnozzle\.addEventListener\b/.test(b), "no second listener through the #nozzle window global");
  assert.strictEqual((b.match(/can\.addEventListener\("click"/g) || []).length, 1);
});
test("VU levels that aren't numbers can't stick the needle", () => {
  const b = R("src/behaviour.js");
  assert.match(b, /Number\.isFinite\(raw\)\?raw:-99/); assert.match(b, /if\(!Number\.isFinite\(s\.pos\)\|\|!Number\.isFinite\(s\.vel\)\)/);
});
