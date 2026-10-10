# MedDev Receiver changelog

Bump `version` in package.json, run `npm run build`, add an entry here, commit `dist/` and push. Apps that point here pick it up on their next check.

## 1.0.0 (2026-10-10, Rob)
- First release, moved out of the mdfm repo (it was `mdfm/skin/`): the steel look, LCDs, LEDs, round push buttons (including the SOUND and EQ switches), knobs, VU meters, LED equalizer, light-colour knobs, flies and bug spray, badge plates and the MedDev badging, plus the receiver controls (`MDFM_receiver`).
- `client/updater.cjs`: the live updater apps use to follow new versions without an app release.
