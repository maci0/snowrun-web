# SnowRun Web

TypeScript SPA for exploring ski trails, planning routes, recording simulated GPS runs, and replaying a local journal. Built around the Mount Hutt demo dataset and visual assets bundled with SnowRun Android 1.9.7-build-3.

## Run

```sh
npm ci
npm run dev
npm test
npm run build
# With the dev server running:
npx playwright test
node scripts/capture-screens.mjs
```

The production build is a static site in `dist/`, using relative asset paths for GitHub Pages. The Pages workflow deploys `main`.

## Browser features

- Original welcome video, illustration, launcher and Yuki assets, recovered filled icons and five native tutorial overlays.
- Mount Hutt demo: 48 runs and 5 lifts, searchable and colored by difficulty.
- Junction-based local routing with native lift/run costs, station links, GPS snapping, difficulty alternatives and grooming preferences.
- Simulated GPS recording, pause/resume, local recovery checkpoints, and run statistics.
- SQLite compiled to WASM via sql.js, persisted to IndexedDB.
- Journal, elevation profile, replay at 2×/8×/16× and GPX export.
- Source-backed layouts for populated journal/trips, season summary, map-based comparison/replay, alternate questionnaire, rewards, friends, profile, account, settings, permissions, referrals, membership, snowmiles and SnowMarket. Local units and preferences persist in SQLite.
- GeoJSON resort import, saved trail maps, SQLite backup export.
- Service worker caches the app and bundled map for offline use after the first visit. Basemap tiles require a connection and are not bulk cached.

Screen evidence and verification are documented in [PARITY.md](PARITY.md).

## Parity limits

This is a browser reconstruction, not an official client or a full port of SnowRun's private services. Unobserved Android screens are reconstructed from static evidence and cannot be claimed pixel-identical. Some APK methods could not be decompiled. Routing reconstructs native junctions, station links and cost multipliers from static code. Direction confidence and preview grouping remain incomplete; route choices are a demonstration, not authoritative mountain navigation. Dataset closure status is not current. GPS and friends are simulated. Reward balances are local. Login, purchases, live group sharing, native Health Connect/Wear OS, and server synchronization are not connected. No production SnowRun API requests are made.

SQLite lives in browser memory while open and is saved as database bytes in IndexedDB on mutations. Browser data removal also removes the journal. Export backups from Me. Use one tab at a time; opening multiple writable tabs is prevented where Web Locks is supported. Private browsing can discard data when the session ends.

## Assets and attribution

Original SnowRun artwork, video and demo map retain their respective ownership and license terms; this repository does not relicense them. No APK, original DEX, decompiled Java, account credentials or private user database is included. Trail data credits from the original app: OpenSkiData/OpenSkiMap, © OpenStreetMap contributors (ODbL), Skimap.org, Who's On First and Mapterhorn. Original Positron vector styles: OpenFreeMap/OpenMapTiles and CARTO, © OpenStreetMap contributors. The renamed Android emoji subset is under SIL OFL 1.1; see `public/assets/EMOJI-LICENSE.txt`. MapLibre GL JS and sql.js retain their upstream licenses.
