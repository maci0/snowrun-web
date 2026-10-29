# Product

## Platform
web

## Stack
TypeScript SPA, SQLite in WebAssembly (user specified), GitHub Pages. Vanilla TypeScript with Vite is the implementation choice.

## Users and purpose
Skiers and snowboarders exploring trail maps, planning routes and recording runs. Reconstruct the Android app's browser-feasible behavior from observed APK evidence.

## Capabilities and constraints
Map, resort/trail search, difficulty filtering, local routing, GPS recording, replay, local journal, local rewards, import/export and saved map data. SQLite WASM persists to IndexedDB. Static hosting cannot implement shared server accounts, payments, live group positions, or native background tracking. Keep those limits explicit. Do not publish APKs, decompiled source or user data.

## Evidence
Local static report ../analysis/REPORT.txt and Android onboarding screenshot. Native app uses white/navy surfaces, MapLibre, local routing, offline journal and backend social/rewards services.
