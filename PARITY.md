# Screen reconstruction evidence

Target: SnowRun Android 1.9.7-build-3. The APK and decompiled Java remain outside this repository.

## Visually observed in the emulator

Welcome, guest skill selection, interactive onboarding map and selected route, account choice, completion, home map, Yuki menu/tutorials, profile sign-in gate, login and sign-up. Local reference captures are in `../analysis/screens`. Browser captures at 411 × 838 are in `../analysis/web-screens`.

The reconstruction follows the observed guest acquisition flow. Alternate questionnaire/pain-point/paywall onboarding branches found in the APK are not fully implemented. First-use map tooltip sequences and the animated Yuki character are not pixel-identical.

## Reconstructed from static code

Journal, run detail/replay, trip detail, run picker/comparison, Friends, challenges, rewards, profile, settings, permissions, acknowledgements, account details, referrals, membership, snowmiles, monthly rewards, SnowMarket, password reset and tester camera tuning. These layouts and strings use decompiled evidence; they have not been visually verified behind a native login.

Route registration: `mn3.java`. Screen bodies: `vu1.java` (Friends), `ta6.java` (membership) and the source references recorded in `src/nativeScreens.ts`. APK palette: `m46.java`; map layers: `vl3.java`, `tl3.java`, `wo5.java`. Filled icon paths are recovered in `src/nativeIcons.ts`.

## Visual system

Recovered navy #0B2F5E, orange #F97316, coral #E85D3A, cream #FAF8F5 → #F5F0EB, text #1E293B and muted #64748B. Original illustrations, video, demo trail data and recovered filled icon paths are reused. Main map uses the original OpenFreeMap Positron vector style; replay uses the original CARTO Positron style. Run/lift widths, opacity, colors and labels follow the APK. There is no raw OSM raster basemap.

## Behavior and verification boundaries

Simulated GPS, SQLite WASM persistence, local route planning, run recording, journal, comparison, replay and export work locally. Accounts, subscriptions, purchases, referral codes, remote rewards, social synchronization and native integrations are not connected. Forms never submit credentials. Empty server states cannot demonstrate every possible populated/error state.

Automated checks cover domain logic, palette/style requests, guest onboarding, simulated recording and journal persistence, settings persistence, account navigation and offline reload. A separate capture sweep rendered 22 auxiliary screens without browser exceptions or horizontal overflow. This is not a claim of pixel-perfect parity across every native screen.
