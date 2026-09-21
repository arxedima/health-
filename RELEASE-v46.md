# IRIS v46 — implementation / review checkpoint

Status: implemented, not yet deployed to the live Pages site.

## Included

- One colored progress arc on all five eyes; black background and local light only.
- Navigation: Eye / Journal / Statistics. Scrollable views stop above the bottom navigation.
- Journal filters, date navigation, manual water/workout entries, editing and record-specific deletion undo.
- One atomic workout/timer state, grouped pause segments, type, effort and notes.
- Custom water portion, repeated meals with portion confirmation, optional sleep quality.
- Personal goals, enabled tracking areas, activity weekdays/rest days, optional weekend targets.
- Voluntary daily energy/mood/stress check-in; notes; no inferred health score.
- Period averages use only recorded days, with explicit coverage and previous-period comparisons.
- One-minute quiet pause; backups include new records and preferences, without syncing to a server.
- Existing 520 reactive iris fibers, batched Canvas2D drawing and render suspension remain in place.

## Validation

27 automated tests passed on 21 September 2026; loaded script syntax checks and
`git diff --check` also passed. The tests are reproducible with the commands below.

Run `npm install`, then `npm test`. `npm run test:data` needs only Node.js.

Tests cover data migration, bounds, duplicate/manual workouts, timer failure atomicity,
reload/midnight, editing/deletion undo, goals and rest days, backups, optional ratings,
forms, navigation, touch behavior, shared arcs and suspension of hidden canvases.

The DOM integration harness uses jsdom, native Canvas2D and mocked geometry.
It is **not** a layout engine or a physical-device performance test.

## Required before production

- Browser and actual mobile layout review, including small heights, safe areas,
  keyboard, dialogs, statistics scrolling and the three navigation buttons.
- Safari / installed PWA check for service-worker update and offline restart.
- Manual spot-check using a copy of an existing diary before adopting the update.

The current browser review was blocked by the browser tool's approval/usage limit.
Do not bypass it or describe the visual review as completed. No cloud sync,
push delivery or HealthKit has been added.

Previous live baseline: `a0091b7` (v44). v45 draft requirements are incorporated in v46.
