# PLAN

## Status

- [x] **Phase 1 — Setup**
  - [x] 1.1 Repo bootstrap: `git init`, TASK.md, CLAUDE.md, PLAN.md, AI_WORKLOG.md skeleton
  - [x] 1.2 Scaffold: Playwright + TS (projects `setup`/`api`/`ui`), strict tsconfig, ESLint + Prettier, `.env.example`, `.gitignore`, npm scripts, folder structure, one smoke test per project
- [ ] **Phase 2 — API tests (restful-booker)**
  - [x] 2.1 Explore the live API with curl → table of real status codes/bodies, list bug candidates
  - [x] 2.2 `src/api/types.ts`, `BookingClient`, booking data factory, `api` fixture
  - [ ] 2.3 `tests/api/booking.spec.ts`: E2E flow (auth → create → update → delete → GET returns 404) with `test.step`; negatives: bad credentials, update without token, GET missing id, (invalid payload)
- [ ] **Phase 3 — UI tests (saucedemo, standard_user)**
  - [ ] 3.1 Explore with Playwright MCP → `data-test` inventory → POM proposal → implement pages, components, fixtures, `auth.setup.ts`
  - [ ] 3.2 Specs. Core: login, catalog, sorting (4 options), cart add/remove, full checkout, overview totals. Negative/edge: wrong password, locked_out_user, checkout required fields, direct `/inventory.html` without session
- [ ] **Phase 4 — CI**: GitHub Actions on push/PR, Chromium, upload `playwright-report/` + `test-results/` as artifact
- [ ] **Phase 5 — Docs**: README (run, coverage, left out, bug reports), curate AI_WORKLOG.md
- [ ] **Phase 6 — Bonus**: text test case → Playwright spec generator + 3 documented examples

## Next step

Phase 2.3: `tests/api/booking.spec.ts`. One E2E test with `test.step` per stage: auth → create (200, body echoes payload) → GET (200) → PUT (200, updated body) → DELETE (201, `Created`) → GET (404, `Not Found`). Uses the `token` fixture and creates its own booking. Negatives:

- PUT without a token, using `createdBooking` (403 `Forbidden`)
- GET with a missing id (404)
- bad credentials (BUG-01, `test.fail()`)
- missing required field (BUG-02, `test.fail()`)

Optional: BUG-03/04/05 as `test.fail()` cases. Tags: `@api`, `@negative`.

## API findings (2.1, verified with curl against the live API on 2026-11-25)

Docs = `/apidoc/api_data.js`. Error responses are **`text/plain`**, not JSON (body = status text, e.g. `Forbidden`).

| #   | Call                                         | Docs | Actual status | Actual body                              |
| --- | -------------------------------------------- | ---- | ------------- | ---------------------------------------- |
| 1   | `POST /auth` valid admin/password123         | 200  | 200           | `{"token":"<15 hex>"}`                   |
| 2   | `POST /auth` wrong password                  | —    | **200**       | `{"reason":"Bad credentials"}`           |
| 3   | `POST /auth` `{}`                            | —    | **200**       | `{"reason":"Bad credentials"}`           |
| 4   | `POST /booking` valid                        | 200  | 200           | `{"bookingid":number,"booking":Booking}` |
| 5   | `GET /booking/{id}`                          | 200  | 200           | `Booking` (no id inside)                 |
| 6   | `GET /booking?firstname=X`                   | 200  | 200           | `[{"bookingid":number}]`                 |
| 7   | `PUT /booking/{id}` + Cookie token           | 200  | 200           | full updated `Booking`                   |
| 8   | `PUT` no token / invalid token               | —    | 403           | `Forbidden`                              |
| 9   | `PUT` with token, only `firstname`           | —    | 400           | `Bad Request`                            |
| 10  | `PATCH /booking/{id}` + token                | 200  | 200           | full merged `Booking`                    |
| 11  | `PATCH` no token                             | —    | 403           | `Forbidden`                              |
| 12  | `DELETE /booking/{id}` + token               | 201  | 201           | `Created` (text/plain)                   |
| 13  | `DELETE` no token / invalid token            | —    | 403           | `Forbidden`                              |
| 14  | `GET` after delete                           | —    | 404           | `Not Found`                              |
| 15  | `DELETE` again / `PUT` on deleted id         | —    | **405**       | `Method Not Allowed`                     |
| 16  | `GET /booking/abc`, `GET /booking/999999999` | —    | 404           | `Not Found`                              |
| 17  | `POST /booking` missing `firstname`, or `{}` | —    | **500**       | `Internal Server Error`                  |
| 18  | `POST /booking` malformed JSON               | —    | 400           | `Bad Request`                            |
| 19  | `POST /booking` `totalprice:"abc"`           | —    | **200**       | created with `totalprice: null`          |
| 20  | `POST /booking` checkout < checkin           | —    | **200**       | created as is                            |
| 21  | `POST /booking` without `Accept` header      | —    | 200           | JSON (works without the header too)      |

## Decisions log

- 2026-11-25: Chromium only; cross-browser intentionally left out (scope/time). Document it in the README.
- 2026-11-25: Single Playwright config with `setup` / `api` / `ui` projects, so there is one HTML report.
- 2026-11-25: Known app bugs are kept as correct assertions marked with `test.fail()` + a bug annotation.
- 2026-11-25: Smoke specs (`tests/ui/smoke.spec.ts`, `tests/api/smoke.spec.ts`) stay as permanent fast `@smoke` checks.
- 2026-11-25: Verified `GET /ping` returns 201 (not 200). saucedemo is a SPA; its session is the `session-username` cookie, so `storageState` reuse works.
- 2026-11-25: TypeScript 6: `baseUrl` is deprecated, so `paths` uses `./`-relative entries. The `@src/*` alias is resolved by Playwright at runtime (verified in `auth.setup.ts`).
- 2026-11-25: API create=200 and delete=201 match the apidoc, so the tests assert them as documented. They are REST-convention oddities, not bugs, and will be noted in the README.
- 2026-11-25: `BookingClient` must not parse error bodies as JSON (they are `text/plain`). Assert `response.text()` for error cases.
- 2026-11-25: ESLint 10 flat config: `typescript-eslint` strictTypeChecked + `eslint-plugin-playwright` (tests only) + `eslint-config-prettier`.
- 2026-11-25: `BookingClient` returns raw `APIResponse` and never parses bodies; specs assert status + body. `*Raw(body: unknown)` methods exist for invalid-payload cases. The token is an optional arg sent as `Cookie: token=…`.
- 2026-11-25: The `api` fixture provides `bookingClient`, `token` (asserts 200 + token, throws on `{reason}`) and `createdBooking`. `createdBooking` is auto-deleted at teardown, and teardown accepts 201 or 405 (already deleted by the test, BUG-05). Verified with a throwaway spec (round-trip + already-deleted teardown), then removed.

## Bugs found (candidates → confirmed)

API (confirmed 2026-11-25, see the findings table; to be pinned with `test.fail()` in 2.3):

- **BUG-01** `POST /auth` with bad credentials returns **200** + `{"reason":"Bad credentials"}` (expected 401). (#2, #3)
- **BUG-02** `POST /booking` with a missing required field returns **500** (expected 400). (#17)
- **BUG-03** `POST /booking` accepts `totalprice` as a string and stores `null` (expected 400). (#19)
- **BUG-04** `POST /booking` accepts checkout before checkin (expected 400). (#20)
- **BUG-05** `DELETE`/`PUT` on an already deleted booking returns **405** (expected 404). (#15)

Rejected candidates: "create returns 200" and "delete returns 201" are documented in the apidoc (see Decisions). "Malformed body returns 500" was refined: malformed JSON → 400, missing fields → 500 (BUG-02).

UI candidates (verify in Phase 3): checkout possible with an empty cart; postal code accepts any string; "Reset App State" leaves "Remove" buttons until reload.

## Open questions

- Bonus generator: headless `claude -p` vs `@anthropic-ai/sdk` script. Decide in Phase 6.
- Use `locked_out_user` for a negative case (the task names only `standard_user`). Assumption: yes, documented in the README.
