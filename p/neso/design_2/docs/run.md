# Run and check

## Platform

- Chatium project module.
- Auto deploy on git push.
- Fixed platform dependencies.

## Main routes for manual QA

- `/p/neso/design_2/`
- `/p/neso/design_2/web/dark`
- `/p/neso/design_2/web/light`
- `/p/neso/design_2/web/dark/components`
- `/p/neso/design_2/web/light/components`

## Manual checks

1. Open dark and light workspace routes.
2. Verify preset switching in header controls.
3. Verify RU/EN switch affects section labels.
4. Verify table modes (`compact`, `standard`, `audit`).
5. Verify chart modes (`throughput`, `sla`, `bottlenecks`).
6. Verify mobile sidebar open/close behavior.

## Notes

Local typecheck/build commands were not executed in this environment due missing `node`/`npx` binaries.
