# Babelwake

A cozy top-down village exploration and French decipherment game built with strict TypeScript, Vite, Three.js, and DOM/SVG interfaces. This playable milestone confirms 37 distinct canonical targets on 12 pages through 78 illustrated scenes. Explore 1 available place, infer French from illustrated encounters, write guesses in any language, confirm whole journal pages, then use French to continue the story.

No translations or automatic note suggestions are provided. English is restricted to menus, settings, and the player's own notes. All game content lives in typed data modules.

## Run

Requires Node.js 22 or newer and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. A WebGL-capable desktop browser is recommended. Mobile is outside the target. Chrome, Safari, and Firefox are the intended desktop targets; actual browser coverage must be reported with each release.

```sh
npm run check          # content validation, unit tests, strict type check, production build
npx playwright install chromium
npm run test:e2e       # debug-hook golden paths, one per zone
npm run content:review
npm run preview       # serve the production build
```

Deploy `dist/` as a static website over HTTPS. The installable PWA uses a service worker and a local save; there are no accounts, backend, analytics, or runtime language models. Save export/import moves progress as a JSON file. Browser storage can be cleared by browser settings, so export important progress.

## Content and systems

- `src/content/types.ts`: schemas for lemmas, encounters, pictures, pages, zone layouts, and puzzles.
- `src/content/zones/`: six places and their evidence, grammar, and applications.
- `src/content/index.ts`: shared lexicon and lazy zone loading.
- `src/content/validator.ts`: deterministic content integrity checks.
- `src/game/`: exploration, journal state, persistence, and audio.
- `src/ui/`: pictograms and interface helpers.
- `content/REVIEW.md`: every authored line grouped by place, with uncertainty flags.
- `docs/PLAYTEST.md`: zero-French inference test protocol.

Each form belongs to a lemma; a personal guess follows inflections. Confirmation requires at least three inspected evidence contexts for every tested word, every picture slot filled, and every assignment correct. No per-slot success/failure is returned. Progress puzzles validate their entire answer sequence together.

Voice audio is optional: line IDs identify future recordings. Missing recordings must not block play. Ambient sound and interface effects use the Web Audio API and begin after a user gesture.

## Verification limits

The content checker enforces structural uniqueness and a conservative French accent reference. Its English detection catches a known list of inappropriate English terms, not every possible English sentence. It cannot prove that a drawing is semantically unambiguous or that a line is idiomatic; those are explicit manual review tasks. The illustrated lexicon and grammar should be assessed with native French speakers and first-time learners before claiming CEFR coverage or learning outcomes.

The complete-content Vitest coverage guard counts canonical lemmas, so multiple inflections and repeated pages cannot inflate the learning inventory. It requires at least 200 distinct canonical words on journal pages, 200–300 canonical words in the full inventory, and every local page to be confirmed before its zone puzzle can be solved. The content validator also checks that the French form displayed on each matching tile appears in three distinct prior contexts; the discontinuous *ne…pas* construction is checked across its sentence. These are exposure and progression guarantees, not proof of understanding.

Golden paths demonstrate that authored pages and puzzles can be completed through game APIs. They do not establish that a zero-French player can infer every answer, that every browser is supported, or that a normal playthrough lasts 2–3 hours. Do not describe those targets as verified without the sessions in `docs/PLAYTEST.md`.

The repository was created in an empty workspace. No earlier prototype or engine assets were available to preserve. The delivery is organized around four playable milestones: atelier/core loop; market/café; station/house/finale; production polish. PR descriptions must list actual checks and unresolved review flags, and should not claim a remote PR exists unless one has been created.

Release evidence and remaining manual checks are recorded in `docs/VERIFICATION.md`. Four playable source milestones and review descriptions are in `docs/MILESTONES.md`.
