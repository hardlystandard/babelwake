# Babelwake

A top-down French decipherment game built with strict TypeScript, Vite, Three.js, and DOM/SVG interfaces. Infer words from objects and people, record your own guesses, confirm complete journal pages, and use French to act in the world. The full vocabulary inventory targets 200–300 useful French lexemes.

This correction pass covers the shared interaction and validation changes plus L’atelier. The other five zones retain their earlier content until the atelier changes have been reviewed and merged. They are not presented as corrected content.

## Run

Requires Node.js 22.12 or newer and npm.

```sh
npm ci
npm run dev
```

Move with WASD/arrows, a gamepad, or by selecting a path. Select a sign, an object, or a person to look closely. Select any French word to write a personal guess; the guess follows the word in the world. J opens the journal. Match every picture on a page before the game checks the whole page. Use objects and follow the people’s instructions to continue.

```sh
npm run check          # content validation, Vitest, strict TypeScript, production build
npx playwright install chromium
BABELWAKE_PRODUCTION=1 npm run test:e2e
npm run content:review
npm run preview
```

Deploy `dist/` over HTTPS as a static site. The PWA caches local assets and zones for offline play. Progress uses IndexedDB with JSON export/import. There are no accounts, backend, analytics, translations, or runtime language models.

## Content and verification

French content and scene layouts live in `src/content/`. Inflected forms share a lemma and player notes. Journal confirmation remains all-or-nothing; environmental evidence must be encountered before a page unlocks. Physical puzzles validate the complete arrangement without identifying correct individual steps.

`content/REVIEW.md` inventories the authored French and unresolved native-review flags. `docs/PLAYTEST.md` checks whether a zero-French player can infer meaning from the actual scene. Automated tests establish content integrity and reachability; they do not prove idiom, beginner understanding, retention, or playtime. Historical browser evidence is in `docs/VERIFICATION.md`; current results belong to the correction PR and its CI checks.

## Contributions and CI

`@hardlystandard` is the sole owner. Changes require a PR and passing CI. See [CONTRIBUTING.md](CONTRIBUTING.md).

CI uses Ubicloud runners with GitHub workflow orchestration; see [docs/CI.md](docs/CI.md).
