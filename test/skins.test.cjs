// Skin rules: skins restyle the brushed metal and fonts only; glass, lights, the spray can and the flies stay as Default.
const test = require("node:test"), assert = require("node:assert"), fs = require("fs"), os = require("os"), path = require("path");
const { pathToFileURL } = require("url");
const mk = (css, id = "t-skin") => { const d = fs.mkdtempSync(path.join(os.tmpdir(), "skin-")) + "/" + id; fs.mkdirSync(d);
  fs.writeFileSync(d + "/skin.json", JSON.stringify({ id, name: "T" })); fs.writeFileSync(d + "/skin.css", css); return pathToFileURL(d + "/"); };
let buildSkin; test.before(async () => { ({ buildSkin } = await import("../scripts/skins.mjs")); });
const ok = css => buildSkin(mk(css), "t-skin"), no = (css, re) => assert.throws(() => ok(css), re, css);

test("metal settings, fonts, metal parts and decorations are allowed", () => {
  const s = ok(`:root{--plate-1:#b8925a;--btn-1:#e0bd7c;--f-display:Georgia,serif}
.rd-btn button:hover{filter:sepia(1)} .deck > .skin-decor::after{content:"";transform:rotate(10deg)}`);
  assert.match(s.css, /html\[data-skin="t-skin"\]\{--plate-1/); assert.match(s.css, /html\[data-skin="t-skin"\] \.deck > \.skin-decor::after/);
});
test("glass and lights can't be changed", () => {
  no(":root{--lcd:#f00}", /isn't a skin setting/); no(":root{--glow-g:red}", /isn't a skin setting/);
  no(":root{--eq-1:red}", /isn't a skin setting/); no(":root{--vu-face-1:red}", /isn't a skin setting/); no(":root{--led:blue}", /isn't a skin setting/);
  no(".lcd{color:red}", /is glass/); no(".deck .lcd{background:red}", /is glass/); no(".vu-glass canvas{filter:none}", /light or a field/);
  no(".lcd{position:absolute}", /only be relative/); no(".rd-led{background:blue}", /light or a field/);
  no(".deck *{color:red}", /light or a field|isn't a receiver part/); no(".deck div{color:red}", /isn't a receiver part/);
  no(".deck{filter:hue-rotate(90deg)}", /would change the glass too/); no(".station{opacity:.5}", /would change the glass too/);
});
test("parts can move to fit the theme; glass can move but keeps its look", () => {
  const s = ok(`.lcd{margin-top:6px;translate:4px 0;position:relative;left:2px}.vu{order:-1}.mixer{flex-direction:column;gap:20px}.vol{margin-left:30px}
.deck > .skin-decor::before{content:"";animation:drip 4s infinite}@keyframes drip{0%{translate:0 0}100%{translate:0 20px}}`);
  assert.match(s.css, /@keyframes drip\{0%\{translate:0 0\}/, "keyframes aren't scoped"); assert.match(s.css, /html\[data-skin="t-skin"\] \.lcd\{margin-top/);
  no(".deck{animation:drip 1s}", /would change the glass/);
});
test("the spray can and the flies stay the same", () => { no(".spraycan{display:none}", /spray can or the flies/); no(".fly{opacity:0}", /spray can or the flies/); });
test("only plain CSS with its own images", () => {
  no('.deck{background-image:url(https://example.com/x.png)}', /images must be in/); no("@media (min-width:1px){.deck{color:red}}", /isn't allowed/);
  no(".deck{background:url(javascript:alert(1))}", /images must be in|only plain CSS/);
});
