# PR B browser views

The fourteen desktop captures named `*-world.png`, `*-workorder.png`,
`lettres-memory.png`, and `lettres-correspondence.png` come from one production
build at 1440 × 900, default zoom 1. The exact served JavaScript hash, source
hashes, observed font sizes, player positions and page-error results are recorded
in [default-view-metrics.json](default-view-metrics.json). `complete: true` means
the entire capture script finished; it is not a learning-outcome certification.

Reproduce after building and starting a production preview:

```sh
PLAYWRIGHT_BROWSERS_PATH=<browser-cache> \
BABELWAKE_PREVIEW=http://127.0.0.1:4184/ \
node scripts/capture-pr-b.mjs
```

The script imports a travel fixture through the normal save-import control. It
preserves empty revised-page confirmations and uses existing inspection hooks
to select authored observations. Personal guesses such as “key?” and “memory?”
are typed through the normal annotation UI. They are test notes, not shipped
translations. Assertions check 18px French, notes of at least 12px, no evidence
caption panels, no avatar displacement during inspection, and no player-object
manipulation caused by annotation. The original household letter-word click is included;
an overlapping NPC name previously blocked that interaction and was repaired.

Service workers are blocked for these visual captures. The separate production
offline test verifies the real service worker and cached chapters.

## Remaining semantic review

Les lettres now renders its photographs, dated miniature action scenes and
actual correspondence. Its memory archive is visually dense: many pictogram
photographs and action models remain visible together. Beginner playtests must
check whether this feels like exploring personal memories or like studying a
grid, and whether each contrast can be inferred without answer elimination.
Distinct rendered images and reachable golden paths do not establish that.

No native-speaker sign-off, zero-French participant playtest, learning retention,
or measured 2–3-hour duration is claimed. These screenshots are visual and
interaction evidence, not independent human inference evidence.
