# MedDev Receiver changelog

Bump `version` in package.json, run `npm run build`, add an entry here, commit `dist/` and push. Apps that point here pick it up on their next check.

## 1.4.0 (2026-10-11, Rob)
- **New skin: Analyze Pics, by Collin Geldmeier.** The Mac OS 8 "Platinum" look of his Analyze Pics app: platinum plates with bevels, pinstriped title bars, dark green screens, note-yellow VU meters, platinum knobs and buttons, on his dithered green desktop picture. It isn't the house default.
- Skin rules: `EXEMPT` in `scripts/skins.mjs` lists skins Rob has approved to recolour glass, lights and fields too. Only Analyze Pics is on it. Those skins still can't touch the spray can or the flies, use ids or @media, or change how the receiver takes clicks. Approval lives in the rules, never in the skin.

## 1.3.0 (2026-10-10, Rob)
- **New skin: Barnaclava.** A sunken wreck on the sea floor, seen from just off the bow. Nautical realism x streetwear x gross cartoon close-ups. Encrusted, rusted steel with a broken railing and mast over the top, an organic keel, embedded barnacle clusters, coral growing from the hull, thick rope piles, tattered nets, trash bags with made-up brands, six-pack rings, a wicker basket of lemons, and portholes with eyes pressed to the glass. Every knob is a barnacle in a balaclava that opens and feeds; the round buttons are barnacles that open when pressed. The bow carries an embroidered Barnaclava patch. It isn't the house default.

## 1.2.2 (2026-10-10, Rob)
- **Fix: skinned receivers didn't respond in the apps.** With a skin like Mulchmaster on, macOS treated the whole window as a drag area, so buttons, knobs and scrolling did nothing; you could only move the window. Skins now turn off the CSS drag regions, and the apps' drag-by-the-metal still moves the window. Default is unchanged.
- The window controls (POWER / MIN / FULL) always sit above a skin's decorations.
- Skin build: skins can't set app-region or user-select, and pointer-events only to none.

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
