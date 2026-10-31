# Current journey verification — 31 October 2026

[PR B #3](https://github.com/hardlystandard/babelwake/pull/3) applies situated decipherment to all six places. The dated history below describes earlier builds only.

## Acceptance checked in this pass

- All six zones use the strict situated contract; no migration exemptions remain.
- 229 canonical inventory lemmas, 211 distinct canonical learning targets, 68 mandatory journal pages, 1,021 encounters and 53 physical puzzle decisions.
- Tracked French on labels, printed props, photographs, speech and notes; at most two new surface forms per ordered encounter. Later zones reuse actual previously encountered forms.
- Three distinct physical situations are required both by validation and by runtime page unlocking. Grammar pages require witnessed contrasts; matching chrome and SVGs expose no answer forms or blanks.
- Every maximum-scoring target is wrong for all 53 decisions, even when the overlap solver already knows the action kind. Independent golden helpers infer actions from clue wording, dates, ownership and scene geometry, without reading the authored answer sequence.
- Normal entity callbacks and action-diagram buttons reach every golden action, every zone transition and the final ending. Legal wrong actions remain possible and recoverable; validation checks the whole arrangement.
- Notes, homograph senses, lemma linking, all-or-nothing pages, old-save travel, real IndexedDB and offline chapter assets retain regression coverage.

## Executed checks

`npm run check` passes content validation, **117 Vitest tests**, strict TypeScript and the production build. `npm run content:review` regenerates the current French inventory. The development-only Vitest upgrade removes the three reported dependency advisories; the locked tree reports zero advisories.

Production Chromium: **24/24 browser tests passed**, including all six independently inferred golden paths, complete ending, physical model counts, loaded tray geometry and movement, visible NPC travel and train operation, real annotation hit targets, settings, saves and offline loading. The initial run exposed an unstable generic word selector and outdated eight-page save expectations; the final run passed after the selector, overlap and ten-page expectations were corrected.

Firefox 157: **12/12** production golden-path, annotation, old-save and rendered control checks passed. WebKit 27.2: the same **12/12** passed. Each engine rendered a real WebGL canvas; these checks do not claim every platform or physical controller configuration has been exercised. A final one-line correction aligns Claire’s dated appointment with Luc’s promise; a dedicated content regression and the final-head CI cover that wording.

The required `game` check on [PR #3](https://github.com/hardlystandard/babelwake/pull/3/checks) runs the fresh checkout on `ubicloud-standard-4-ubuntu-2404`, including all unit and production Chromium tests. Its result is the source of truth for the exact PR head and must pass before merging.

## Visual evidence

`docs/pr-b/` contains actual production-rendered views at 1440×900 and zoom 1. The capture script types personal hypotheses through the annotation interface, checks at least 18px French and 12px notes, and checks no caption panels, page errors or avatar displacement during inspection. `default-view-metrics.json` records the served entrypoint hash and source hashes. Reproduce with `PLAYWRIGHT_BROWSERS_PATH=<cache> BABELWAKE_PREVIEW=<production-preview> node scripts/capture-pr-b.mjs`.

Visual review caught and repaired placeholder house geometry, black SVG photo textures, overlapping tray contents and an NPC conversation control covering a focused word. The market’s number exercise rows were replaced by stock requests, customer handoffs and actual till payments. The household garden retains outdoor ground; the station uses real platforms and a standing clock with a clear front and back.

## Remaining acceptance boundaries

Native-speaker review and zero-French participant testing have not occurred. The five prior idiom/setting flags were rewritten; current uncertainties are explicitly listed in `content/REVIEW.md`. The dense memory archive, abstract vocabulary, pronoun/possession contrasts and pictogram interpretation particularly need beginner observation. No measured 2–3-hour duration, retention, CEFR attainment or Chants of Sennaar parity is claimed. Synthetic gamepad input and a tablet viewport pass; physical controller ergonomics remain unverified.

The static production output is ready in `dist/`. The repository has no public game deployment workflow or configured homepage; GitHub reports `has_pages: false`, and the Pages endpoint returns 404. No new hosting service or network configuration was created. A public hosted game therefore remains separate from the completed source/PR delivery.

---

# Previous build verification — 24 October 2026

These results describe the build before the situated atelier correction. They do not verify the redesigned content or interactions; those results are recorded in the correction PR and its CI checks.

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

The workspace began empty. The source history retains the earlier playable builds and their verification. Design corrections are reviewed through real pull requests against `main`.

No retrospective GitHub pull requests or public game deployment are claimed. The tested static build is independently deployable. Publishing the source repository and publishing a playable website are separate operations.
