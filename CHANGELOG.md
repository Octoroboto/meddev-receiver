# MedDev Receiver changelog

Bump `version` in package.json, run `npm run build`, add an entry here, commit `dist/` and push. Apps that point here pick it up on their next check.

## 1.2.1 (2026-10-10, Rob)
- Mulchmaster: a black engine vent on the bumper, and a crumpled honey-do sticky note stuck under the engine sticker. The note cycles through four chore lists, changing every two minutes. Both hide on phones.

## 1.2.0 (2026-10-10, Rob)
- **New skin: Mulchmaster.** A beat-up push mower seen from above. It has a dirty red deck, a black engine housing, a handlebar with a pull-start grip, and big cream wheels at the corners. A gas cap is the volume knob, yellow choke caps are the light knobs and primer bulbs are the buttons. There's an oil fill cap, a rinse port with a garden hose, spark plugs and a muffler off the sides, a sound-control sticker and a Mulchmaster decal. In the apps the window itself is mower-shaped. It isn't the house default.
- Skin build: comments in a skin's CSS are removed before the rules are scoped. A comment with a comma or semicolon used to break the rule after it.

## 1.1.1 (2026-10-10, Rob)
- The VOLUME knob's 0-10 numbers are plain positioned text now, not SVG text. On iPhone they could drift out of place and float over other parts of the receiver.

## 1.1.0 (2026-10-10, Rob)
- **Skins.** Every app gets a Skin dropdown. "House default" (set in `skins/skins.json`) is used unless a person picks their own skin. Default is the original steel look and stays pixel-identical.
- Skins can be complete makeovers: the metal, textures, shapes, fonts, spacing and arrangement, plus decorations (with animation) that may overlap the glass a little. Glass keeps its look (it can be moved). Lights, the spray can, the flies and every control's behaviour stay the same. The build enforces all of this.
- `scripts/preview.mjs` builds a playable preview of a candidate skin before it's added.
- The canvas parts (LED EQ, VU faces) read their colours from settings, so skins can never break them.
- The live updater also carries the skins (`skins.json`, checked against the manifest), so new skins and a new house default reach apps without a release.

## 1.0.0 (2026-10-10, Rob)
- First release, moved out of the mdfm repo (it was `mdfm/skin/`): the steel look, LCDs, LEDs, round push buttons (including the SOUND and EQ switches), knobs, VU meters, LED equalizer, light-colour knobs, flies and bug spray, badge plates and the MedDev badging, plus the receiver controls (`MDFM_receiver`).
- `client/updater.cjs`: the live updater apps use to follow new versions without an app release.
