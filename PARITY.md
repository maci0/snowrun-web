# Screen reconstruction evidence

Target: SnowRun Android 1.9.7-build-3. The APK and decompiled Java remain outside this repository.

## Visually observed in the emulator

Welcome, guest skill selection, interactive onboarding map and selected route, account choice, completion, home map, Yuki menu/tutorials, profile sign-in gate, login and sign-up. Local reference captures are in `../analysis/screens`. Browser captures at 411 × 838 are in `../analysis/web-screens`.

The reconstruction follows the observed guest acquisition flow. Alternate questionnaire, pain-point, permission, value and paywall wrappers now follow recovered code. The Tinder-card layout could not be recovered and is omitted. The resort, navigation and three-step Yuki tutorial cards now use recovered dimensions, artwork and captured copy. The Yuki sphere uses original t27.java/k10.java geometry and gradients, with breathing/blinking animation. Blink timing remains an approximation.

## Reconstructed from static code

Journal, run detail/replay, trip detail, run picker/comparison, Friends, challenges, rewards, profile, settings, permissions, acknowledgements, account details, referrals, membership, snowmiles, monthly rewards, SnowMarket, password reset and tester camera tuning. These layouts and strings use decompiled evidence; they have not been visually verified behind a native login.

Route registration: `mn3.java`. Screen bodies: `vu1.java` (Friends), `ta6.java` (membership) and the source references recorded in `src/nativeScreens.ts`. APK palette: `m46.java`; map layers: `vl3.java`, `tl3.java`, `wo5.java`. Filled icon paths, the gondola XML and original Google logo are recovered in `src/nativeIcons.ts` and `src/nativeFlow.ts`. Onboarding projection and pinned route segments follow `f05.java`, `h05.java`, `d05.java` and `b11.java`; Google logo paths come from `ic_google_logo.xml`.

## Visual system

Recovered navy #0B2F5E, orange #F97316, coral #E85D3A, cream #FAF8F5 → #F5F0EB, text #1E293B and muted #64748B. Original illustrations, video, demo trail data and recovered filled icon paths are reused. A renamed, licensed subset of the emulator’s Android emoji font preserves weather and ski emoji artwork. Main map uses the original OpenFreeMap Positron vector style; replay uses the original CARTO Positron style. Run/lift widths, opacity, colors and labels follow the APK. Unspecified grooming stays unknown and does not receive the ungroomed overlay. Map overview orientation and center follow lift altitude inference in `ie5.java`/`g10.java`; bounds padding and zoom follow `tl3.java`. Guide counts group named features and choose the hardest display difficulty as in `kg5.java`/`th5.java`, yielding 6/12/12/6/9 for the demo. Original credits are available in Acknowledgements. There is no raw OSM raster basemap.

## Behavior and verification boundaries

Simulated GPS, SQLite WASM persistence, local route planning, run recording, journal, comparison, replay and export work locally. Accounts, subscriptions, purchases, referral codes, remote rewards, social synchronization and native integrations are not connected. Forms never submit credentials. Empty server states cannot demonstrate every possible populated/error state.

Automated checks cover domain logic, guide grouping, lift-based camera inference, grooming classification, palette/style requests, guest onboarding, simulated recording and journal persistence, settings persistence, account navigation, native phone control bounds, password visibility, plan selection and offline reload. Sixteen logic tests, five production browser checks and two development browser checks pass. The latter seed two real SQLite runs to verify comparison playback/cleanup and trip selection.

Run `node scripts/capture-screens.mjs` against the development server to reproduce the screen sweep. `BASE_URL` and `SCREENSHOT_DIR` can override the defaults. It asserts each auxiliary screen heading rather than treating a missing browser exception as proof that navigation worked. The full sweep captures the guest flow, five tutorials, map/search/route states and 22 auxiliary routes. Phone and desktop captures, simulated run detail/comparison and six alternate questionnaire stages were additionally reviewed.

## Remaining verification limits

Captured screens were compared at a normalized 411 × 838 content viewport, removing Android status/navigation bars. Browser/native text rasterization and physical pixel rounding differ. The source-backed reconstruction is much broader than the initial approximation, but has not passed a zero-difference image test.

Gated native populated/error states, alternate acquisition/questionnaire branches, private server payloads and tester tools have no matching runtime captures. Populated journal rows, trip grouping/cards, season metrics and map-based comparison follow recovered code; local route choices remain browser adaptations, with limits marked in code. Some large methods failed JADX decompilation. The analog compass and some small controls were reconstructed from visible geometry where an exact resource could not be resolved. No claim of universal pixel-perfect parity is made.
