# SnowRun Web

TypeScript SPA for exploring ski trails, planning routes, recording simulated GPS runs, and replaying a local journal. Built around the Mount Hutt demo dataset and visual assets bundled with SnowRun Android 1.9.7-build-3.

## Run

```sh
npm ci
npm run dev
npm test
npm run build
```

The production build is a static site in `dist/`, using relative asset paths for GitHub Pages. The Pages workflow deploys `main`.

## Browser features

- Original welcome video, illustration, launcher and Yuki assets.
- Mount Hutt demo: 48 runs and 5 lifts, searchable and colored by difficulty.
- Local directed routing with difficulty and grooming preferences.
- Simulated GPS recording, pause/resume, local recovery checkpoints, and run statistics.
- SQLite compiled to WASM via sql.js, persisted to IndexedDB.
- Journal, elevation profile, replay at 2×/8×/16× and GPX export.
- Local snowmiles, profile, units and reconstructed account/settings screens.
- GeoJSON resort import, saved trail maps, SQLite backup export.
- Service worker caches the app and bundled map for offline use after the first visit. Basemap tiles require a connection and are not bulk cached.

Screen evidence and verification are documented in [PARITY.md](PARITY.md).

## Parity limits

This is a browser reconstruction, not an official client or a full port of SnowRun's private services. Unobserved Android screens are reconstructed from static evidence and cannot be claimed pixel-identical. Some APK methods could not be decompiled. Routing connects compatible trail endpoints within 100 m and is an approximate demonstration, not authoritative mountain navigation. Dataset closure status is not current. GPS and friends are simulated. Reward balances are local. Login, purchases, live group sharing, native Health Connect/Wear OS, and server synchronization are not connected. No production SnowRun API requests are made.

SQLite lives in browser memory while open and is saved as database bytes in IndexedDB on mutations. Browser data removal also removes the journal. Export backups from Me. Use one tab at a time; opening multiple writable tabs is prevented where Web Locks is supported. Private browsing can discard data when the session ends.

## Assets and attribution

Original SnowRun artwork, video and demo map retain their respective ownership and license terms; this repository does not relicense them. No APK, original DEX, decompiled Java, account credentials or private user database is included. Trail data credits from the original app: OpenSkiData/OpenSkiMap, © OpenStreetMap contributors (ODbL), Skimap.org, Who's On First and Mapterhorn. Original Positron vector styles: OpenFreeMap/OpenMapTiles and CARTO, © OpenStreetMap contributors. MapLibre GL JS and sql.js retain their upstream licenses.
