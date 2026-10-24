# Release verification — 24 October 2026

The art direction was changed at the user’s request to a cozy top-down life-sim style. Earlier first-person browser results below are historical; the final top-down browser result is recorded separately.

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
- **Historical expanded first-person production Playwright run: 12/12 passed in 2.7 minutes.** Six zone golden paths, finite-form journal tiles, all-or-nothing page rejection, IndexedDB reload, debug guard, physical mechanism operation, individual station-scene navigation, installed offline loading of every zone, annotation/search/drag/click matching, text size and contrast all passed.
- Earlier production run, before the vocabulary expansion: 11/11 browser cases passed, followed by 2/2 affected UI/offline retests. These earlier checks are not substituted for the final expanded run.
- Install/offline behavior checks use the real generated service worker and real IndexedDB. The service worker precaches all lazy chapter chunks, local fonts, and icons. The cache lookup handles static `Vary: Origin` responses.
- Screenshots in `artifacts/` show the title, exploration, evidence, and journal. Browser captures check uncaught page errors.

## Final top-down verification

TOP_DOWN_FINAL_RESULT_PENDING

## Browser evidence and limits

- Chromium/Chrome engine: full production test suite with WebGL via SwiftShader on this host.
- Chromium touch/tablet viewport, 1024×768: start, journal, evidence inspection and real WebGL passed without page errors on the pre-expansion build. A post-expansion visual smoke is reported with the final run when available.
- Firefox 157 engine: start, evidence, journal confirmation, contrast and zero-error smoke passed using the graceful fallback. Host GL-driver initialization failed, so **Firefox 3D rendering is not verified here**.
- WebKit 27.2 engine: launch blocked by missing host libraries (`gtk-4`, `graphene`, `harfbuzz-icu`, `manette`, `hyphen`, `GLESv2`). **Safari/WebKit remains unverified**. This is a host dependency limitation, not a passing compatibility claim.
- Physical gamepad hardware was not exercised. Gamepad controls and modal focus navigation are implemented; keyboard, mouse, drag-and-drop and click matching have browser coverage.

## Human acceptance still required

No native-speaker sign-off or zero-French participant playtest has taken place. REVIEW.md retains four explicit idiom/setting flags. Automated checks can reject identical rendered vignettes and missing evidence; they cannot prove semantic unambiguity, natural French, learning retention, CEFR attainment, Chants of Sennaar parity, or a 2–3-hour playtime. Follow PLAYTEST.md before making those claims.

## Source delivery and publication

The workspace began empty. The source history has four playable review milestones; each of the first three snapshot variants ran content validation, logic tests, strict TypeScript and a production build. The final milestone adds the offline lifecycle and release verification. MILESTONES.md contains review descriptions, design calls, limitations, and French-review flags.

No GitHub PR or public deployment is claimed. A private Sites project was provisioned, but automatic approval review rejected forwarding a source credential to its Git remote because that publishing destination and credential handling lacked explicit user authorization. No push or publication followed that rejection. The tested local static build is independently deployable; remote publication is pending that approval.
