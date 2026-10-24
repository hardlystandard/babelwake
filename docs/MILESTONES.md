# Four playable milestones

These are the four source-history review units. The private Sites source remote has no GitHub pull-request interface; these descriptions are ready to reuse in a code-host review. No remote PR is claimed.

## 1 — The atelier and the discovery loop

Playable: explore the atelier, inspect illustrated evidence, annotate any visible French token in any language, search the journal, and confirm complete picture pages. Open the green door using the full action sequence. Keyboard matching accompanies drag-and-drop. Save state links inflected cards to canonical notes without supplying translations.

Design calls: a cozy top-down low-poly village keeps the objects and French legible; illustrations carry context rather than English tooltips. Pages require three inspected contexts for every tested entry. Mechanisms validate entire sequences, with no partial feedback or penalties. A solved final available chapter opens a local ending so the milestone remains playable independently.

Validation: content validation, unit tests, strict TypeScript and a production build were run on this milestone snapshot. Native-speaker idiom and beginner inference are not established by those checks.

Limitations: the atelier is a short chapter, not the requested complete game. The core shared UI already includes save/settings support used by later chapters. Surface words outside the curated lexicon can receive personal notes, but do not become confirmed entries automatically.

## 2 — The market and café

Playable: continue the letter through a shopping transaction and café conversation. Reuse atelier objects/colors and acquire quantities, prices, negation, wants, ordering, politeness, and questions. Confirm representative prices through 100, including the French 70–99 constructions.

Design calls: quantities and money anchor number forms; articles, negation and verb families have dedicated pages. Café answers are French phrases. Whole-sequence validation keeps price, object, register, recipient, and destination interdependent.

Validation: content validation, unit tests, strict TypeScript and a production build were run on this milestone snapshot.

Limitations and French review: « La bouteille verte est avec le panier. » is flagged in REVIEW.md for native review of its grouping context. Inference and duration need beginner playtests.

## 3 — The station, neighbour and letters

Playable: all six chapters and the final reunion. Read the timetable and map, follow place prepositions, meet Claire’s family, distinguish possession and adjective agreement, and reconstruct the letters using completed actions. Earlier words recur without translations.

Design calls: present-tense form cards share canonical journal notes; the family scene uses a visible relationship tree; final actions depend on reading both letters. The railway is a fictional small village line serving Claire’s house.

Validation: content validation, unit tests, strict TypeScript and a production build were run on this milestone snapshot.

Limitations and French review: REVIEW.md flags the miniature railway destination and « devant le train » against its illustration. Human review must establish whether these settings and drawings disambiguate the language. The 2–3-hour target is not timed or verified.

## 4 — Production, accessibility and offline play

Playable: the six-zone browser game with 217 distinct canonical confirmation targets, 66 mandatory pages, and 627 encounter scenes, plus title/pause/credits, remappable keyboard controls, mouse and gamepad support, text sizing, contrast, IndexedDB autosave and JSON export/import, Web Audio ambience, voice hooks, and an installable offline PWA. All fonts and art are local. Zones remain separate lazy chunks; the service worker caches them after the first online load.

Design calls: an orthographic top-down camera follows a visible avatar. Walking uses keyboard, gamepad, or selecting a path, and overlays release movement input. SVG journal art and DOM world labels keep text crisp. Debug APIs require an explicit `?debug=1` URL and call normal state transitions; they cannot directly set a save. They are test facilities, not evidence of human language learning.

Validation: see VERIFICATION.md for the actual production test results and browser exercised. CI runs content checks, logic tests, the build, and production Playwright paths. Cross-browser desktop testing and physical gamepad verification remain manual work.

Known release limits: no native-speaker sign-off or zero-French participant sessions have taken place. This is a complete playable implementation, not a verified claim of Chants of Sennaar parity, CEFR attainment, or 2–3-hour pacing. Use docs/PLAYTEST.md to assess those acceptance criteria before calling the educational design finished.
