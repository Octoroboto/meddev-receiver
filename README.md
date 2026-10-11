# MedDev Receiver

The receiver look and controls in one place: brushed steel, scratched-glass LCDs, red LEDs, round push buttons, knobs, VU meters, the LED equalizer, light-colour knobs, the fruit flies and bug spray, badge plates and the MedDev badging.

**Update it here once, and every app that points here follows.**

It also holds the **skins**: different looks for the metal, picked from a Skin dropdown in every app. Default is the original steel Winamp-style look.

## Who uses it

| App | Gets new versions and skins | How |
|---|---|---|
| MDFM Radio (Mac app) | Live, on next launch | `client/updater.cjs` (via mdfm `apps/common/receiver.js`) |
| MD Hub (Mac app) | Live, on next launch or hub reload | Same updater. It also restyles the hub page inside the app. |
| Media Development Hub (claude.ai artifact) | When the hub is republished | Swap the blocks from `dist/blocks.html` (artifacts can't load from GitHub) |
| mdfm package | When mdfm runs `npm run receiver:sync` | Bundled copy in `mdfm/vendor/meddev-receiver/`. This is the fallback copy every app ships with. |

## Making a change

1. Edit `src/`:
   - `receiver.css`: the look.
   - `behaviour.js`: EQ, flies, light knobs, VU meters.
   - `controls.js`: tone and volume knobs, mode buttons, content checkboxes.
   - `badges.html`: the MedDev badging.
2. Bump `version` in `package.json`, then run `npm test`. Tests build `dist/` and check it.
3. Add a line to `CHANGELOG.md`, commit everything (including `dist/`) and push.

That's it. Installed MDFM Radio and MD Hub apps pick it up on their next check (launch, then every 6 hours) and use it from the next launch. To also update the hub page and the mdfm bundled copy, run `npm run receiver:sync` in mdfm, rebuild, and have Claude republish the hub.

## Skins

Each skin lives in `skins/<id>/`:

- `skin.json`: `{ "id", "name", "description" }`
- `skin.css`
- `images/` (optional; built in as data: URLs)

`skins/skins.json` lists them in order and names the **house default**.

**What a skin can change:** skins can be wildly different, like a western saloon of wood and rusty nails, or a Giger-style one of organic forms and dripping slime. Every control stays and works the same, but everything about how it looks can change.

- **The metal:**
  - The skin settings at the end of `src/receiver.css`: plates, steel, keys, title bars, buttons, knobs, the volume knob, bezels, trim and captions.
  - Any styling of the receiver's parts: `.deck`, `.panel`, `.wtitle`, `.rd-btn button`, `.rd-knob`, `.vol-knob`, `.mixer`, `.vu`, `.tk` and so on. That includes textures, borders, shapes, shadows, fonts and spacing.
- **Moving things:** parts can be rearranged to fit the theme (flex/grid direction, gaps, order, margins).
- **Decorations:**
  - `.skin-decor` sits over each `.deck` and `.panel`. Use its `::before` and `::after`, and as many layered background images as you like.
  - Decorations may overlap the glass a little (a tentacle over an LCD corner), and can animate with `@keyframes` (dripping slime).
  - They never take clicks.

**What stays the same in every skin (the build refuses changes):**

- **Glass:** LCDs, VU glass and the EQ display keep their look. A skin may *move* glass (margin, order, translate, relative position), but not restyle it.
- **Lights:** LCD text glow, LEDs, the EQ bars and VU faces.
- **The spray can and the fruit flies.**
- **Text fields, the hub's lists, and every control's behaviour.**
- **Effects that would reach the glass inside a panel:** filter, opacity, transform, clip and animation are only allowed on buttons, knobs and decorations.
- **Keep it a little under 1.5 MB per skin.** Use WebP images; the hub page carries every skin.

**How a person's skin is chosen:** their own pick wins. Next comes "House default", which follows `skins.json`'s `default`. The built-in Default is the last resort.

**Adding a skin:**

1. Make the candidate in a scratch folder, not in `skins/`.
2. Run `node scripts/preview.mjs <folder>`. It writes `preview/<id>.html`: the playable receiver with the skin on and a Compare dropdown. Nothing is added yet.
3. When it's approved, copy the folder to `skins/<id>/`, add the id to `skins/skins.json` `order`, bump the version, then run `npm test`, commit and push.
4. To make it the house default, set `default` in `skins/skins.json` and bump the version again.

The `/newmdfmlook` and `/updatemdfmlook` commands in Claude walk through this.

### Skin extras (tappable decorations)

A skin can make its decorations respond to taps and clicks with an `extras` block in `skin.json`. It's data, not code. The receiver turns it into plain buttons, menus, message boxes and read-only tables, and sets all text as text. The build checks it with `checkExtras` in `scripts/skins.mjs`.

```json
"extras": {
  "layers": [{ "anchor": "top", "box": { "left": "-10px", "right": "-10px", "bottom": "calc(100% + 12px)", "height": "152px" },
    "spots": [
      { "label": "File", "left": "6px", "top": "34px", "width": "40px", "height": "24px",
        "menu": [{ "text": "Save", "say": "Saved." }, { "sep": true }, { "text": "Log", "page": "log" }] },
      { "label": "First tab", "left": "58px", "top": "0", "width": "140px", "height": "30px", "back": true }] }],
  "pages": { "log": { "title": "Log", "cols": ["Date", "Done"], "rows": [["10/01", "✓"]], "note": "All done." } }
}
```

- **`anchor`:** `top` (the header deck), `station` or `pinfoot`. The `box` is placed against that part with plain CSS lengths: px, %, vw and calc/clamp/min/max.
- **What a spot does (one of):**
  - `menu`: entries with `text`, plus optional `hint`, `disabled`, `say`, `page` or `back`; `{ "sep": true }` is a divider;
  - `say`: a message box with OK;
  - `page`: opens a page over the receiver, which has a Back button;
  - `back`: closes the page;
  - `open: true`: the spot toggles open and shut (its `aria-pressed` flips). Style `.sx-spot[aria-pressed=true]` to swing a door open, and `.sx-spot[aria-pressed=true] + .sx-spot` to reveal what's behind it.
- **Esc** closes the open menu, then the message, then the page.
- **Styling:** skins may restyle every `.sx-` part: `sx-layer`, `sx-spot`, `sx-menu`, `sx-item`, `sx-sep`, `sx-dialog`, `sx-page`, `sx-head`, `sx-grid`, `sx-note` and `sx-back`.
- **Limits:**
  - 6 layers and 60 spots;
  - 16 entries per menu;
  - 20 pages, each with up to 8 columns and 60 rows;
  - text is capped (labels 60 characters, messages 300).

## Pointing another app at it

### Electron app

1. Copy `client/updater.cjs` into the app.
2. Bundle a copy of `dist/` with the app as the fallback.
3. Wire it up:

```js
const { createReceiverUpdater, applyToPage } = require("./receiver-updater.cjs");
const rx = createReceiverUpdater({
  dir: path.join(app.getPath("userData"), "receiver"),
  getJSON: net.getJSON,                // your Bouncer-guarded fetch
  bundled: { version, css, js },       // from the bundled dist/
});
rx.check();                            // at launch and every few hours
const { css, js } = rx.active();       // newest good copy, or the bundled one
```

4. Add this Bouncer rule:
   - host: `raw.githubusercontent.com`
   - method: `GET`
   - path: `/Octoroboto/meddev-receiver/main/dist/*`

**What the updater checks before using a download:**

- The files match the manifest's sha256 hashes.
- The versions match.
- The JS parses.
- Nothing closes a `<style>` or `<script>` tag.
- No CSS imports from outside Google Fonts.

### Web page or artifact

Paste the blocks from `dist/blocks.html`: the style in `<head>`, and the skins and script at the end of `<body>`. Add `<select data-mdfm-skins></select>` anywhere for a Skin dropdown.

- For the badging: add `<footer data-mdfm-badges></footer>`.
- For the controls: use the standard markup (see MDFM's `skin/radio-body.html`) and call `MedDevReceiver.mountControls(radio, { app })`.

## Public API (kept stable)

- **Classes:** `.deck`, `.wtitle`, `.lcd`, `.rd-btn` with `.rd-led`, `.vizsw`, `.tk` / `.vol` knobs, `.vu`, `.rdeck`, `.pinfoot`.
- **Badging:** `[data-mdfm-badges]`, `window.MDFM_BADGES`, `MDFM_mountBadges()`.
- **Controls and version:** `MDFM_receiver(radio, { app })`, and `window.MedDevReceiver` (`version`, `mountBadges`, `mountControls`).
- **Skins:** `window.MDFM_skins` (`list`, `current`, `set`, `houseDefault`), the `meddev:skin` event, `select[data-mdfm-skins]`, and `html[data-skin]`.
