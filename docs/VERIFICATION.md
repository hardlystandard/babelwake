# Release verification — 24 October 2026

The final art direction follows the user’s request: a cozy top-down life-sim style with an orthographic camera, visible traveler, earthy, shaded village, and keyboard/gamepad/click-to-walk movement.

## Authored scope

- Six places, in progression order: atelier, market, café, station, neighbour’s house, letters/reunion.
- 220 canonical inventory lemmas, 261 linked entries, 546 distinct listed forms.
- **217 distinct canonical learning targets**, tested on **66 mandatory pages**. This count uses page answers resolved to canonical lemmas; it does not count incidental prose, distractors, repeated pages, or conjugation aliases as additional learned words.
- 627 distinct encounter scenes. Related scenes share a physical book/conversation display; arrows reveal them individually. Opening a display does not encounter its other scenes.
- Every tested displayed form has three distinct authored text/SVG contexts, and runtime unlocking requires inspecting those contexts. Every local page is required by the local progression mechanism.
- Each applied mechanism checks a complete sequence; possible choice combinations range from 4,096 to 65,536. This discourages exhaustive trials; it is not a proof that a determined player cannot guess.

## Executed checks

Runtime: Node.js 24.19.0, strict TypeScript, Vite production build.

- `npm run check`: **passed** content validation, **38/38 Vitest tests**, strict TypeScript, and production build on the expanded game.
- **Final top-down production Playwright run: 12/12 passed in 4.2 minutes.** This includes six zone golden paths, finite-form journal tiles, all-or-nothing page rejection, IndexedDB reload, debug guard, physical mechanisms, individual station scenes, installed offline loading of every zone, annotation/search/drag/click matching, text size, and contrast.
- Install/offline behavior checks use the real generated service worker and real IndexedDB. The service worker precaches all lazy chapter chunks, local fonts, and icons. The cache lookup handles static `Vary: Origin` responses.
- Screenshots in `artifacts/` show the title, exploration, evidence, and journal. Browser captures check uncaught page errors.

The public repository's [CI run 40110048891](https://github.com/hardlystandard/babelwake/actions/runs/40110048891), for commit `5f74d27`, subsequently passed all **38 Vitest tests** and **12 production browser tests** (5.2 minutes for the browser suite) on a GitHub-hosted Linux runner. This full run includes the earthy palette. It precedes the Ubicloud runner migration and does not establish execution on Ubicloud.

## Final top-down verification

The production browser checks assert orthographic/top-down metadata and a nonempty WebGL canvas. They exercise actual WASD movement, click-to-walk and synthetic Gamepad API movement through normal input, reading only the exposed player position to verify movement. Station arrows reveal scenes one at a time and never auto-encounter siblings. The final title, world, evidence, journal, station and touch-tablet captures contain no uncaught page errors. The complete static output remains below 1 MiB uncompressed; the main JavaScript chunk is about 182 kB gzip. No frame-rate or loading-time benchmark is claimed.

## Earthy palette revision

The user subsequently requested a less bright palette. Foliage now uses forest and olive greens; cottages and props use walnut, muted clay, ochre, and tan plaster; water is slate blue. Scene exposure is .95 with lower ambient/sun intensities. Menus use dark forest panels and the journal uses aged parchment. Named French color cues remain distinct.

After this palette-only change, `npm run check` again passed all **38 tests**, content validation, strict TypeScript and the production build. **3/3 targeted production browser tests** passed: offline reload/all-zone loading, keyboard/mouse/gamepad walking plus station navigation, and annotation/search/matching/settings. The full 12-case result above precedes this palette revision; content, puzzles, layouts and controls were unchanged. Title/world/evidence and journal previews were inspected. Refreshed desktop and touch-tablet captures, including tap-to-walk, journal and evidence, passed with no page errors.

## Browser evidence and limits

- Chromium/Chrome engine: full production test suite with WebGL via SwiftShader on this host.
- Final cozy build, Chromium touch/tablet viewport 1024×768: trusted taps start the journey, walk the avatar, open/close the journal, and inspect evidence. Real WebGL, visible avatar movement and zero page errors passed. Updated tablet screenshots are in artifacts/.
- Firefox 157 engine: an earlier pre-redesign start/evidence/journal/contrast smoke passed using the graceful fallback. Host GL-driver initialization failed. **The final cozy Firefox renderer remains unverified here**; earlier UI smoke is not substituted for final renderer coverage.
- WebKit 27.2 engine: launch blocked by missing host libraries (`gtk-4`, `graphene`, `harfbuzz-icu`, `manette`, `hyphen`, `GLESv2`). **Safari/WebKit remains unverified**. This is a host dependency limitation, not a passing compatibility claim.
- Physical gamepad hardware was not exercised. Synthetic Gamepad API avatar movement passed; real device ergonomics and button mappings still need hardware verification. Keyboard, mouse, drag-and-drop, click matching and modal controls have browser coverage.

## Human acceptance still required

No native-speaker sign-off or zero-French participant playtest has taken place. REVIEW.md retains four explicit idiom/setting flags. Automated checks can reject identical rendered vignettes and missing evidence; they cannot prove semantic unambiguity, natural French, learning retention, CEFR attainment, Chants of Sennaar parity, or a 2–3-hour playtime. Follow PLAYTEST.md before making those claims.

## Source delivery and publication

The workspace began empty. The source history has four playable review milestones; each of the first three snapshot variants ran content validation, logic tests, strict TypeScript and a production build. The final milestone adds the offline lifecycle and release verification. MILESTONES.md contains review descriptions, design calls, limitations, and French-review flags.

No retrospective GitHub pull requests or public game deployment are claimed. The tested static build is independently deployable. Publishing the source repository and publishing a playable website are separate operations.
