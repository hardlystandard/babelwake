# Babelwake: inference playtest

The release question is: **can someone with zero French infer each tested word from the world alone?** Passing automated tests is necessary but cannot answer it. Do not tell a participant what a French word means. Do not explain a puzzle in English. Menu controls may be explained. The current art direction is a cozy top-down village with a visible avatar, keyboard/gamepad walking, and click-to-walk; it is not a first-person view.

## Participants and procedure

Recruit at least three people who have never studied French; record any knowledge of related languages. Use a fresh save and default settings. The facilitator stays silent except for equipment problems. Ask the participant to think aloud. Record observations outside the game; there is no analytics code. Keep the participant's guesses in their chosen language.

Before each session, verify audio, top-down movement and journal input release, save export/import, and an empty journal. Allow breaks and save/reload at a natural pause. Never use the debug hook during the participant run. A debug golden path proves reachability, not inferability or natural pacing.

For every word tested by a journal page, make one row in the session notes:

| Word/form | Context 1 observed | Context 2 observed | Context 3 observed | Participant guess before page | Picture interpreted as | Inferred without help? | Confound / repair |
| --- | --- | --- | --- | --- | --- | --- | --- |

A word fails if its three contexts repeat the same clue, if an illustration needs its French caption to be understood, or if the player arrives at the answer only by eliminating other slots. Never count guessing the page arrangement as learning the word. After a confirmation, observe whether the participant can apply the word in a later place without reopening its original encounter.

## Corrected atelier world

- [ ] French is readable on the actual prop, sign or notice at default zoom. The player can read their own subscripts comfortably without inspecting or enlarging the scene.
- [ ] Inspecting pans toward the object and keeps the avatar in place. No title/paragraph caption or illustrated evidence card appears.
- [ ] Each person speaks one short in-world line at a time. The … control lets the player speak while carrying an object.
- [ ] Possession shows an already-held object; taking visibly moves an object into a hand. A participant does not infer that these verbs mean the same thing.
- [ ] Introducing one object and referring to that same object form a visible exchange. Pointing direction alone does not distinguish the articles.
- [ ] Three situations establish each tested form before its journal page opens. Different SVG metadata alone does not count as a new world situation.
- [ ] The player understands which actions the workorders request, including taking, placing and delivering. Correct choices require color, size, spatial relation or referent comprehension.
- [ ] The last request identifies a recipient through language and their held object; a finger or success highlight does not point out the answer.
- [ ] Legal wrong actions remain possible, and no individual correctness feedback appears. The player can correct placements or retrieve a mistaken delivery; all final conditions are checked together.
- [ ] Matching-page titles, headings, navigation and pictures contain none of the slot answers. Journal confirmation still checks the whole page at once.

The five following zones retain their earlier content until PR B. Their checklists are acceptance work to perform after that correction, not evidence of current situated-design compliance.

## Zone checklist

### L’atelier

- [ ] The player discovers how to inspect an object and enter a personal guess without learning an English translation from the UI.
- [ ] Each object is recognizable in all three contexts; color does not substitute for object identity.
- [ ] Players distinguish object names, colors, articles, and actions rather than assigning every word in a line the same meaning.
- [ ] Singular/plural evidence contains countable objects, including clear article and noun changes.
- [ ] Being and having have different pictured relationships and each tested person is visible.
- [ ] The mechanism can be understood from environmental instructions. Its solution does not depend on journal answer positions.

### Le marché

- [ ] Food drawings distinguish the actual objects without text or color alone.
- [ ] Number/price evidence distinguishes quantity, unit price, and total.
- [ ] The participant derives the French number composition used in the puzzle rather than guessing from a familiar digit.
- [ ] Wanting is distinct from owning and being; negative requests are visibly different from positive ones.
- [ ] Earlier objects and colors still mean what the participant expects.

### Le café

- [ ] An order is inferred from the customer's situation and the scene; no bilingual menu is needed.
- [ ] Politeness is visible through contrasting familiar and unfamiliar relationships, not explained in an English tooltip.
- [ ] The player can distinguish a question from a statement and understand what information a question requests.
- [ ] Wrong assembled orders reveal no correct individual component and do not erase notes.
- [ ] Vocabulary from the market remains usable in ordering.

### La gare

- [ ] Clocks are readable and show the intended time unambiguously.
- [ ] The participant distinguishes time of day, platform, destination, and direction.
- [ ] Place-preposition drawings show a stable reference object; front/back orientation is visible.
- [ ] The player reasons from the timetable/map and can explain their intended route without the facilitator giving translations.
- [ ] Earlier numbers and questions support the route puzzle naturally.

### La maison

- [ ] Family/possession scenes show the relevant relationships; gender is not inferred from arbitrary clothing alone.
- [ ] Adjective agreement scenes keep noun identity fixed while the intended attribute changes.
- [ ] The player can follow a conversation using their own hypotheses about people and possession.
- [ ] Familiar/fomal pronouns remain interpretable and earlier vocabulary appears in new scenes.

### Les lettres

- [ ] The visual sequence makes past versus present visible without relying on an English tense explanation.
- [ ] Past actions with *avoir* are distinguishable from a character possessing an object now.
- [ ] Letter chronology and the final conversation can be solved from information actually encountered.
- [ ] The participant understands why the final action resolves the story.
- [ ] Ask the participant to describe the story after finishing. Do not show translations to improve their account.

## Journal and accessibility

- [ ] Every clicked inflected form attaches the guess to the intended lemma.
- [ ] Guesses remain visible after changing zones, closing the journal, and reloading.
- [ ] A page remains locked until all its words have three inspected evidence contexts.
- [ ] Incomplete arrangements never validate; incorrect complete arrangements give no individual correctness signal.
- [ ] A correct arrangement confirms the entire page at once without revealing an English answer.
- [ ] Pictures remain distinguishable at the largest text size and in high contrast.
- [ ] Keyboard and gamepad interaction reaches the same content as mouse interaction.
- [ ] Opening overlays pauses avatar movement. Closing an overlay never captures the pointer or resumes an old walking destination.
- [ ] Save export/import round-trips the participant's own notes. Test offline after the first complete load; distinguish cached versus unvisited zones.
- [ ] Tablet-width layout stays usable even though touch-first gameplay is out of scope.

## Release notes from sessions

Record total time, active play time, interruptions, abandoned hypotheses, stalled puzzles, facilitator interventions, and whether players consulted external translations. Treat the requested 2–3-hour duration as an unverified design target until actual sessions measure it. Mark every ambiguous picture and every sentence that two native speakers interpret differently. Repair content and rerun the affected contexts with a new participant; a player who has already seen a solution cannot validate its inferability.

Automated content checks detect duplicate picture definitions, insufficient distinct contexts, missing references, malformed pages, known English terms, and curated accent errors. They cannot prove that two distinct drawings communicate different meanings, recognize all English, or certify idiomatic French. `content/REVIEW.md` is the sentence inventory for native-speaker review, not proof that review has happened.
