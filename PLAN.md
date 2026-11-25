# PLAN

## Status
- [ ] **Phase 1 — Setup**
  - [x] 1.1 Repo bootstrap: `git init`, TASK.md, CLAUDE.md, PLAN.md, AI_WORKLOG.md skeleton
  - [ ] 1.2 Scaffold: Playwright + TS (projects `setup`/`api`/`ui`), strict tsconfig, ESLint + Prettier, `.env.example`, `.gitignore`, npm scripts, folder structure, one smoke test per project
- [ ] **Phase 2 — API tests (restful-booker)**
  - [ ] 2.1 Explore the live API with curl → table of real status codes/bodies, list bug candidates
  - [ ] 2.2 `src/api/types.ts`, `BookingClient`, booking data factory, `api` fixture
  - [ ] 2.3 `tests/api/booking.spec.ts`: E2E flow (auth → create → update → delete → GET returns 404) with `test.step`; negatives: bad credentials, update without token, GET missing id, (invalid payload)
- [ ] **Phase 3 — UI tests (saucedemo, standard_user)**
  - [ ] 3.1 Explore with Playwright MCP → `data-test` inventory → POM proposal → implement pages, components, fixtures, `auth.setup.ts`
  - [ ] 3.2 Specs. Core: login, catalog, sorting (4 options), cart add/remove, full checkout, overview totals. Negative/edge: wrong password, locked_out_user, checkout required fields, direct `/inventory.html` without session
- [ ] **Phase 4 — CI**: GitHub Actions on push/PR, Chromium, upload `playwright-report/` + `test-results/` as artifact
- [ ] **Phase 5 — Docs**: README (run, coverage, left out, bug reports), curate AI_WORKLOG.md
- [ ] **Phase 6 — Bonus**: text test case → Playwright spec generator + 3 documented examples

## Next step
Phase 1.2: Scaffold the Playwright + TypeScript project per CLAUDE.md. Propose the config and tsconfig before running anything.

## Decisions log
- 2026-11-25: Chromium only; cross-browser intentionally left out (scope/time). Document it in the README.
- 2026-11-25: Single Playwright config with `setup` / `api` / `ui` projects, so there is one HTML report.
- 2026-11-25: Known app bugs are kept as correct assertions marked with `test.fail()` + a bug annotation.

## Bugs found (candidates → confirmed)
_None yet. Candidates to verify (not yet confirmed):_
- API: create returns 200 (not 201); delete returns 201; bad credentials return 200 + `{"reason":"Bad credentials"}`; malformed body returns 500
- UI: checkout possible with an empty cart; postal code accepts any string; "Reset App State" leaves "Remove" buttons until reload

## Open questions
- Bonus generator: headless `claude -p` vs `@anthropic-ai/sdk` script. Decide in Phase 6.
- Use `locked_out_user` for a negative case (the task names only `standard_user`). Assumption: yes, documented in the README.
