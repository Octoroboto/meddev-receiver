# MedDev Receiver changelog

Bump `version` in package.json, run `npm run build`, add an entry here, commit `dist/` and push. Apps that point here pick it up on their next check.

## 1.10.2 (2026-10-11, Rob)
- **Skin rules:** closed about a dozen ways a skin could get past the checks (nested rules, backslash escapes, quoted braces and semicolons, -webkit- prefixes, image-set(), animated pointer-events). No existing skin changes.
- **Spray can:** each click was handled once instead of twice, so BUG SPRAY and SUGAR MIST work with reduced motion on.
- **Updater:** kept copies are re-checked on load and written all-or-nothing; checks time out and don't overlap.
- **Extras:** page links must name the skin's own pages; Esc and Back return focus to the spot that opened them; refresh() rebuilds changed extras.
- **Smaller:** VU needle recovers from a bad level; fewer per-frame allocations; bad saved tone/volume fall back to defaults; a missing mode LED no longer stops setup; stable skin order in the build.

## 1.10.1 (2026-10-11, Rob)
- Clara Stamford's Homestead Collection on the hub page and MD Hub: their headings are stitched in rose thread (the embroidered MDFM 99.9 HD logo stays on the radio only), and the lists, tabs, fields and text use dark ink on the cloth and paint instead of the base's light glass colours.

## 1.10.0 (2026-10-11, Rob)
- **New skin: Clara Stamford's Homestead Collection.** A sunlit farmhouse kitchen belonging to a fictional homemaker who is definitely not a spy. White shaker cupboards with brass pulls, a white subway-tile backsplash, an oak shelf on corbels (basil, a crock of wooden spoons, a lattice blueberry pie on a cake stand, stacked bowls, a pitcher of eucalyptus), two brass globe pendants, cabinet-door panels with brass label holders, brass and porcelain knobs, a lattice pie for the volume knob, a butcher-block island with the Homestead sign and three counter stools on a striped rug. The screens are embroidered on display cloth (satin-stitched station name, thread text, rose-thread EQ bars); the light-colour knobs still tint them. Tap a cupboard door to swing it open and find the spy kit inside; two doors won't stay shut. It isn't the house default.
- **Skin extras: `open`.** A spot with `"open": true` toggles open and shut (its `aria-pressed` flips), so a skin can swing a door open with CSS and reveal the spot behind it (`.sx-spot[aria-pressed=true] + .sx-spot`).
- **Approved exception:** Clara Stamford's Homestead Collection joins Analyze Pics on the `EXEMPT` list so it can restyle the screens, EQ and VU faces (Rob, 2026-10-11).
- **Fix:** skin scoping and rule checks now split selector lists only at top-level commas, so `:is(.a,.b)` and `:not(.a,.b)` work in skins. Every existing skin builds byte-identical.

## 1.9.0 (2026-10-11, Rob)
- **New skin: Q3 Reconciliation.** A very sensible spreadsheet: "Q3_Reconciliation_FINAL_v2 (Reviewed) (2).xlsx" open in LedgerSheet Pro. A title bar, menus, toolbar, formula bar and column headers over the top, row numbers and gridlines on the sheet, the Station as the current selection, grey buttons, option-button lights and flat dials. Cell comments from Accounting, HR, Facilities, Compliance and others change every half minute and agree that this is a very normal choice. There's a Responsible Adult Checklist, a Q3 Flossing Compliance chart, sheet tabs and a status bar. It isn't the house default.
- **Skin extras: a skin can now make its decorations tappable.** `extras` in a skin's skin.json lists spots laid over its decorations: a spot opens a menu, pops up a message, opens a read-only page (a title, a table and a note), or goes back. It's data only: the receiver builds plain buttons, menus, message boxes and tables, with all text set as text and no markup or code. Every page has a Back button, and Esc closes menus, messages and pages. The build checks extras (`checkExtras` in scripts/skins.mjs): known keys only, plain CSS lengths, length and count limits, and every page a spot points to must exist. In Q3 Reconciliation, the menus, toolbar, formula bar, window buttons, sheet tabs and status bar all respond.
- `scripts/fitcheck.mjs` skips skin extras. They sit on decorations, outside the receiver, and narrow windows crop them on purpose.

## 1.8.0 (2026-10-11, Rob)
- **New skin: Mouth Jamboree.** The receiver is a kids' toothpaste tube that has been squeezed half flat. Glossy blue laminate with squeeze creases, a white plastic shoulder and threaded neck with Sparkle Jam gel crusted in the threads and a swirl on top, white printed panel outlines, and title bars printed in navy with a row of red dots. The front label carries the Mouth Jamboree logo and a made-up "MDA Accepted" seal, then a white swoosh and the red confetti Cavity Patrol band. The crimped end has a LOT/EXP stamp (99.9 · NEVER). Knobs and buttons are the cap (pressed, you see the gel inside), the volume knob is a cap full of glitter gel, and Jam Facts is printed on the back. A used toothbrush and the cap sit on the counter on wide windows. It isn't the house default.
- CHANGELOG: removed a duplicated 1.6.0 entry.

## 1.7.1 (2026-10-11, Rob)
- **For apps that only want the look and AXMOD:** `data-no-flies` on `<html>` skips the fruit flies and spray can. MD Hub's frame uses it, and the uploader apps will too.
- AXMOD fires `axmod:open` and `axmod:close` when the drawer opens and closes. MD Hub uses them to move the hub page aside.
- `npm run fonts` keeps going when one font can't be fetched, and tries the newest OpenDyslexic when the pinned one isn't there.

## 1.7.0 (2026-10-11, Rob)
- **AXMOD, the accessibility module.** Put `<div data-axmod></div>` in an app's Settings and it becomes an ACCESSIBILITY push button (its LED lights when anything is changed). The button slides out a drawer built from receiver parts (title bar, push buttons, keys, knobs, LCD readouts), so every skin restyles it. Cmd+Option+A opens it from anywhere.
  - **Options:** the standard 15 (text size to 200%, high contrast, readable font, wider spacing, reduce motion, no flashing, colourblind-safe colours, grayscale, underlined links and a bold focus ring, big cursor, lock the layout, no idle surprises, buttons stay put, sound captions, text versions of visuals).
  - **Extras:** read aloud with speed and voice, a reading ruler, a dyslexia font, colour strength, left-aligned text, calm mode, quick setups (Low vision, Motion sensitive, Dyslexia, Keyboard only), shortcuts, Reset all, a skip link and a projected WCAG 2.2 self-estimate.
  - **Skins:** High contrast sets the skin aside while it's on. No flashing is off by default, because some skins flash on purpose and Default never does.
  - **Saving:** settings save to the app's settings (`axmod`), or on this device in a browser. The computer's reduce-motion and increased-contrast settings are the starting defaults.
  - **For apps:** `AXMOD.caption`, `sound`, `channels`, `describe`, `setSpeaker`, `on` and the `axmod:change` event. `dist/axmod.schema.json` is the shared settings list for the Swift port.
- **Receiver motion follows AXMOD live:** the LED EQ, the fruit flies, the spray can and the AUTO lights (`window.MDFM_still()`). The canvas colours re-read on AXMOD changes.
- `npm run fonts` builds Atkinson Hyperlegible and OpenDyslexic into receiver.css. Until it's run, Verdana and Comic Sans stand in. `scripts/axpreview.mjs` makes a playable preview.

## 1.6.0 (2026-10-11, Rob)
- **New skin: Mr. Spoonatelli's House of Spoons.** An old-world spoon shop that has lost control of its inventory. Walnut cabinetry with an arched gilt crown, emerald velvet with a damask of tiny spoons, brass nameplate title bars, ivory keys, spoon-bowl knobs (silver for the lights, gold for tone) and an engraved serving-ladle volume knob. Spoons are stabbed into every edge of the cabinet, hang off the counter and lie across the panels: silver, gold, rusted, tarnished and carved wood. Some carry messages ("THE 4TH SPOON IS A LIE", "THE 4TH IS REAL", "COUNT THE HOOKS"). A spoon rack sways over the crown, the founder's portrait hangs on the counter, and the corkboard notes argue about the fourth spoon, changing every forty seconds. On phones the side spoons step aside. It isn't the house default.
- **Faster build.** Skins with several images in one rule made `npm run build` take minutes. Images are now inlined after the checks. Every existing skin builds byte-for-byte the same.

## 1.5.0 (2026-10-11, Rob)
- **New skin: Business Lightning.** A rain-soaked neon back alley: wet brick, a pink neon tube around the receiver, a black sign-cabinet header, neon title bars, glass sign keys, chrome knobs with neon rings, a flickering OPEN 24/7 sign, a lightning-bolt briefcase, a vertical MDFM sign, a fire escape, a puddle with rain, and lightning that flashes across the whole deck. It isn't the house default.
- **Fix: buttons fit on every skin.** On phones, the header's SOUND and Station Break controls could hang off the edge. The header controls row now wraps. Default looks the same.
- `scripts/fitcheck.mjs`: checks that every control sits inside the receiver for every skin at phone, tablet, app and desktop widths.

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
