# MedDev Receiver

The receiver look and controls in one place: brushed steel, scratched-glass LCDs, red LEDs, round push buttons, knobs, VU meters, the LED equalizer, light-colour knobs, the fruit flies and bug spray, badge plates and the MedDev badging.

**Update it here once, and every app that points here follows.**

## Who uses it

| App | Gets new versions | How |
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

Paste the two blocks from `dist/blocks.html`: the style in `<head>`, the script at the end of `<body>`.

- For the badging: add `<footer data-mdfm-badges></footer>`.
- For the controls: use the standard markup (see MDFM's `skin/radio-body.html`) and call `MedDevReceiver.mountControls(radio, { app })`.

## Public API (kept stable)

- **Classes:** `.deck`, `.wtitle`, `.lcd`, `.rd-btn` with `.rd-led`, `.vizsw`, `.tk` / `.vol` knobs, `.vu`, `.rdeck`, `.pinfoot`.
- **Badging:** `[data-mdfm-badges]`, `window.MDFM_BADGES`, `MDFM_mountBadges()`.
- **Controls and version:** `MDFM_receiver(radio, { app })`, and `window.MedDevReceiver` (`version`, `mountBadges`, `mountControls`).
