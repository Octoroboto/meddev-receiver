# MedDev Receiver changelog

Bump `version` in package.json, run `npm run build`, add an entry here, commit `dist/` and push. Apps that point here pick it up on their next check.

## 1.14.1 (2026-10-27, Rob)
- **VOID in the desktop apps resizes like a normal Mac app.** In an app window, AUTO no longer zooms the receiver with the window's width (that made dragging an edge look like the whole picture scaling with its shape kept) and there are no empty side gaps (they put the window's resize edges way out to the side). The receiver stays at 100 % and reflows to whatever size you drag the window to. The SIZE slider still sets a fixed 50-200 % if you want it bigger or smaller. Browsers are unchanged.
- **The SIZE slider no longer jumps around.** It sits inside the receiver it resizes, so resizing while you dragged it moved it out from under the pointer. Now the number follows your drag and the new size is applied when you let go.

## 1.14.0 (2026-10-26, Rob)
- **New skin: VOID.** Flat dark blocks with crisp lit edges: no textures, glass, glows, shadows, filters, animations or decorations. It's the look of MDFM's MIX › VOID button, but as a skin you pick in Looks, so it's on everywhere (radio, apps, hub page) and stays on. It's also the fastest look on phones and iPads (VOID mode measured 50-60 fps on an iPhone 13, where the textured skins managed about 2). The spray can and the flies stay, as in every skin.
- **VOID resizes freely.** The receiver has no maximum width, and a **SIZE** row appears under the skin picker while VOID is on:
  - **AUTO** (the default) keeps 100 % up to about 1500 px wide and scales the receiver up to fill bigger windows (up to 220 %); smaller windows reflow as they always did (down to a 320 px phone).
  - The slider sets a fixed **50-200 %**: smaller packs the receiver into a thin strip along the top of a screen, bigger is for across the room. The receiver still fills the window's width.
  - It's kept in this browser (`mdfmSkinSize`) and, in the apps, in the app's settings (`skinSize`). Other skins keep their fixed layout and never show the SIZE row.
  - In the Mac apps the window's own minimum size (set by the app) still applies until an app release lifts it.
- **How it works (new skin switches, data in skin.json, not CSS):** `"flat": true` sets `<html data-flat>`, `"fluid": true` sets `<html data-fluid>`; the receiver's own stylesheet does the rest (end of `src/receiver.css`). The SIZE row and `--rx-zoom` / `--rx-gap` come from `src/skins.js`; only `.wrap` is zoomed, so the spray can and flies (which place themselves from on-screen positions) stay where they should. `MDFM_skins.size()` reads or sets the size. `buildSkin` checks both switches are true or false.
- Tests: `test/skins.test.cjs` covers the switches.

## 1.13.4 (2026-10-16, Rob)
- **Lighter meters (from MDFM 1.25 and 1.26).** Nothing looks different.
  - The LED EQ draws its unlit ladder once per size, then fills the lit segments and peak caps as one path each frame (it used to make about 380 separate draw calls a frame). It runs at 30 fps.
  - The EQ and the VU meters do nothing while they're scrolled off screen or the tab is hidden: no level read, no repaint.
  - The VU face measures its size twice a second instead of every frame (that was a layout read every frame).
  - The reduced-motion media query is made once instead of every frame.
- **The live updater (`client/updater.cjs`)** now gets the pruning that the MDFM apps already ship (from mdfm 1.25): only the newest two downloaded looks are kept, plus the one in use.
- **`window.MDFM_lite`:** when a page sets it (MDFM's MIX does in LITE mode, on phones and tablets), the EQ and the VU meters run at 20 fps.

## 1.13.3 (2026-10-13, Rob)
- **The "What plays between songs" switches work in any app.** They used to assume the MDFM apps' settings bridge and broke (taking the rest of the page's wiring with them) in apps without it, or with an asynchronous one. Those apps now keep the switches on the device, like a browser.
- **The Slack news switch** is only enabled where the app can connect Slack: the MDFM apps, or a kit app with `mdfm-live`. Elsewhere it says "needs Slack in this app".

## 1.13.2 (2026-10-13, Rob)
- **The spray can shows its label again** (BUG SPRAY / SUGAR MIST) when there's no room beside the radio. Since 1.13.1 it had tucked so far out that only the white tip showed.
  - It now comes out far enough to read the shoulder, at the height nearest the header gap where it covers nothing clickable. The can's whole button box is counted, since that is what takes clicks.
  - It falls back to just the tip only if every height would cover a button.
  - Phones get the same treatment.

## 1.13.1 (2026-10-12, Rob)
- The spray can no longer sits on the header buttons when the window is too narrow for it to rest beside the radio (browser windows about 800 to 1350 px wide): it tucks out to the edge with only its tip showing. It covered the right-hand "Station break" / "Station ID" button and took its clicks.

## 1.13.0 (2026-10-12, Rob)
- **Layout pass (every skin, any window shape):**
  - Button LEDs sit right beside their button, however long the caption is. LET IT RIDE, UNDERWATER, ACCESSIBILITY and the like had their LED stranded at the caption's edge, which in some skins put it on the frame.
  - The header switches to its stacked layout when the header itself is too narrow, not only when the window is. Skins with wide frames (House of Spoons, Mouth Jamboree, Slouch) used to leave the spectrum analyzer at half width with an empty gap beside it. Now the switches and buttons share one row and the analyzer runs full width.
  - The header's right column is wide enough for the station arrows and both text buttons on one line, even in skins that use capitals.
  - The tone knobs and volume knob fit beside the meters in narrower panels.
  - The "What plays" lists use wider columns, so the longer names don't wrap.
  - The spray can rests beside the radio on wide windows (it used to sit at the far edge of the screen), and tucks further out on phones.

## 1.12.2 (2026-10-12, Rob)
- **Mouth Jamboree: terrible advice and the eight sad teeth.** Dr. Toothbert, D.D.S. (Definitely Didn't Study) stands on the red band: tap him for seven pieces of awful oral hygiene advice, read aloud. The Cavity Patrol badge, the gel dollop and the Jam Facts label give more (Jam Facts opens a Directions page, with a note that none of it is real advice). Eight sad, rotten teeth with rain clouds hide around the tube; tap one to hear its troubles and it cheers up. Find all eight and claim the Certificate of Ateethment from Dr. Toothbert: it gets pinned to the tube.

## 1.12.1 (2026-10-12, Rob)
- **The radio never starts silent:** if the volume was left at 0 last time, it starts at 8 instead. A zero volume looked like a broken radio (songs changing, no sound, blank EQ).

## 1.12.0 (2026-10-12, Rob)
- **House of Spoons: The Case of the Fourth Spoon.** The counter is now an evidence table drawn big enough to read: the founder's portrait, the plaque, the corkboard, a carved spoon, the inventory clipboard, Doug's receipt, Delphine's time card, the Forkington's flyer, the lost & found tag and the case file, tied together with red string. Tap any of them (or the spoon rack) to read the full clue; found clues get a wax seal. With 6 of 10 clues, accuse someone in the case file. Solve it and the cursor turns into a spoon (until you choose Start over). The tiny carved spoons are gone.
- **Skin extras can now run a mystery:** `clue`, `need` + `locked`, `solve`, `reset`, `{found}` / `{total}` in text, and a `title` on message boxes. `<html>` gets `data-sx-clues` and `data-sx-solved`, so skins can style progress and rewards with `html[data-sx-solved] ...` rules (the build now scopes `html[...]` rules to the skin).

## 1.11.1 (2026-10-12, Rob)
- **Slouch from the Dead:** the gold rope tiebacks are wrapped twice round each curtain's gathered waist, with a knot and tassel at the inner edge, instead of floating across the stage. The right-hand curtain now reaches the edge of the theatre (it stopped short and showed the backdrop behind it).

## 1.11.0 (2026-10-11, Rob)
- **New skin: Slouch from the Dead: The Musical.** A grand theatre in front of the ruined Slouch HQ tower: a hexagonal-hashtag sign and high-tech SLOUCH wordmark with pieces jutting out of the building, typogromby hashtag zombies crawling across the facade, show posters on the bricks when there's room, gold proscenium, curtains, followspots and a chasing marquee.
- **A play on the stage:** five scenes. The arrow moves to the next one (the set slides off to the left and the next slides in) and wraps around after the last. Click the actors to hear their lines.
- **Skin extras can now:** have scenes (`"scenes": 2-12` on a layer; spots with `"scene": k` show only in that scene; `"next"` / `"prev"` spots change scene), and speak a spot's `say` text aloud (`"speak": {pitch, rate, voices}`). Layers, spots and dialogs may be animated.
- **Music ducks for spoken lines:** while a line is spoken the receiver sends `meddev:voice`; MDFM turns the music down so the line is easy to hear, and all the way to silence for sung (♪) lines, then brings it back.

## 1.10.4 (2026-10-11, Rob)
- **Light-colour knobs on skins whose screens aren't lights:** a skin can say `"tint": "dye"` in its skin.json; the RED/GREEN/BLUE knobs then shift the colour of its screens (hue and saturation) and never dim them, so turning all three to MIN no longer blacks them out. Clara Stamford's embroidered screens use it. Lit screens (every other skin) still go dark at MIN, like lights switched off.
- **Clara Stamford's Homestead Collection:** every prop redrawn at higher resolution and with proper modelling: the shortwave radio and headphones, the glass cookie jar of passports with a kraft tag, the spice jars (labels fitted to the jars), the safe, binoculars, map roll, the CLASSIFIED folders, the corkboard (photos of the pigeon, Gary, the pie, the goose...), the red hotline phone, the basil, utensil crock, pie on its stand, bowls, pitcher of eucalyptus and the brass globe pendants; the island's rolling-pin rack and pie safe are new too.
- **Mr. Spoonatelli's House of Spoons:** no more half spoons. The spoons stuck in the edges come in tiles of whole spoons, spaced so a tile is never cut off at the corners or where the sections meet.

## 1.10.3 (2026-10-11, Rob)
- **Q3 Reconciliation:** the minimize, maximize and close glyphs are redrawn and sit in the middle of their tap areas. The settings (skin picker, "What plays between songs", Slack, city and units labels, hints) and the brand marks on the faceplate are dark ink on the light sheet instead of the base's light text.
- **New skin settings `--label`, `--hint` and `--etch`:** the text colour of settings labels and option names, of hints, and of the faceplate brand marks, spec line and window-button captions. The base keeps its old colours when a skin doesn't set them; light skins set them so that text stays readable. Q3 Reconciliation, Clara Stamford's Homestead Collection and Mouth Jamboree (hints) use them.

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
