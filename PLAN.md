# PLAN

## Status

- [x] **Phase 1 — Setup**
  - [x] 1.1 Repo bootstrap: `git init`, TASK.md, CLAUDE.md, PLAN.md, AI_WORKLOG.md skeleton
  - [x] 1.2 Scaffold: Playwright + TS (projects `setup`/`api`/`ui`), strict tsconfig, ESLint + Prettier, `.env.example`, `.gitignore`, npm scripts, folder structure, one smoke test per project
- [x] **Phase 2 — API tests (restful-booker)**
  - [x] 2.1 Explore the live API with curl → table of real status codes/bodies, list bug candidates
  - [x] 2.2 `src/api/types.ts`, `BookingClient`, booking data factory, `api` fixture
  - [x] 2.3 `tests/api/booking.spec.ts`: E2E flow (auth → create → update → delete → GET returns 404) with `test.step`; negatives: bad credentials, update without token, GET missing id, (invalid payload)
- [x] **Phase 3 — UI tests (saucedemo, standard_user)**
  - [x] 3.1 Explore with Playwright MCP → `data-test` inventory → POM proposal → implement pages, components, fixtures, `auth.setup.ts`
  - [x] 3.2 Specs. Core: login, catalog, sorting (4 options), cart add/remove, full checkout, overview totals. Negative/edge: wrong password, locked_out_user, checkout required fields, direct `/inventory.html` without session
- [x] **Phase 4 — CI**: GitHub Actions on push/PR, Chromium, upload `playwright-report/` + `test-results/` as artifact. First run green (run 45666319745: 23 passed, artifact `playwright-report-1` downloaded and checked).
- [ ] **Phase 5 — Docs**
  - [x] 5.0 Trim the suite to the TASK.md numbers: 12 tests (UI 5 core + 3 negative, API 1 flow + 3 negative). Smoke specs removed.
  - [ ] 5.1 README (run, coverage, left out, bug reports) and curate AI_WORKLOG.md
- [ ] **Phase 6 — Bonus**: text test case → Playwright spec generator + 3 documented examples

## Next step

Phase 5.1: README (how to run incl. `.env` + CI secrets/variables setup, coverage, what was left out, bug reports BUG-01…08 as steps / expected / actual, each marked automated or manual repro) and curate AI_WORKLOG.md (agent setup, key prompts, 3–5 mistakes from the raw log). The README outline was proposed in the 5.0 session; re-confirm it and settle the key prompts and the 5 curated mistakes before writing.

## API findings (2.1, verified with curl against the live API on 2026-11-25)

Docs = `/apidoc/api_data.js`. Error responses are **`text/plain`**, not JSON (body = status text, e.g. `Forbidden`).

| #   | Call                                         | Docs | Actual status | Actual body                              |
| --- | -------------------------------------------- | ---- | ------------- | ---------------------------------------- |
| 1   | `POST /auth` valid credentials               | 200  | 200           | `{"token":"<15 hex>"}`                   |
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

## UI findings (3.1, verified with Playwright MCP against the live site on 2026-11-25)

- Session = `session-username` cookie. Cart = `localStorage["cart-contents"]` (e.g. `[4,0]`). Both are in `storageState`, saved right after login, so every test starts with an empty cart.
- Login errors (`data-test="error"`, h3): wrong password, `locked_out_user`, empty username, and no session on `/inventory.html` (redirects to `/`). Exact texts are in `src/data/messages.ts`.
- Inventory: 6 items, `product-sort-container` options `az`/`za`/`lohi`/`hilo` (default `az`), and `active-option` shows the label. Two items cost $15.99 (Bolt T-Shirt, Red T-Shirt).
- Each item's add/remove button is `add-to-cart-<slug>`, which becomes `remove-<slug>`. The image and title links inside an item have role `button` ("View details for …"), so the POM matches the button by exact name.
- Burger menu: the open button is `getByRole('button', { name: 'Open Menu' })` (`data-test="open-menu"` is on the inner `<img>`). The open menu covers the button, and Reset App State does not close it.
- Checkout step one: each empty field shows its own error, in this order: First Name, Last Name, Postal Code. Step two: `subtotal-label` / `tax-label` / `total-label`, tax = 8% rounded to cents. Complete: cart and badge are cleared.
- Console: one `Permissions policy violation: unload` error on every page (site/third-party script), ignored.

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

- 2026-11-25: Phase 2.3 is split into `tests/api/booking.spec.ts` (E2E, `test.step` per stage) and `tests/api/booking.negative.spec.ts` (`@negative`). BUG-01…05 are pinned with `test.fail()` + a `bug` annotation. The JSON reporter confirmed each one fails for the documented reason (401←200, 400←500, 400←200, 400←200, 404←405).
- 2026-11-25: The E2E test creates its own booking and deletes it in `finally` without asserting the status (it is 405 after a successful flow, BUG-05). The BUG-02/03/04 tests delete any wrongly created booking (200) before the failing assertion, via a `deleteIfCreated` helper outside the test body (lint: no conditionals in tests).

- 2026-11-25: POM: `AppPage` base (header, burger menu, `title`, `goto`, `waitForLoaded`) for logged-in pages. `LoginPage` is standalone. `ItemListComponent` is shared by the inventory, cart and overview pages and finds items by exact name (regex-escaped). `waitForLoaded()` is the only `expect` inside POM, and specs must still assert explicitly (lint `expect-expect`).
- 2026-11-25: `guestTest` = `test` with an empty `storageState`, for login and no-session tests. `auth.setup.ts` uses the `test` fixtures.
- 2026-11-25: Postal code rule for BUG-08 (agreed with the user): only letters, digits, spaces and hyphens. The test expects an error to be visible and checkout to stay on step one. It does not check the message text, since none exists.
- 2026-11-25: The POM was verified with a throwaway spec covering every locator and method (5/5 passed), then removed. `.playwright-mcp/` is gitignored.

- 2026-11-25: Phase 3.2 specs: `login.spec.ts` (`guestTest`: 1 core + 3 negative), `catalog.spec.ts` (product list + one sorting test with a `test.step` per option, as the user chose), `cart.spec.ts` (add/remove flow + BUG-07), `checkout.spec.ts` (full checkout with totals, required fields, BUG-06, BUG-08). Totals: 12 UI tests + smoke. Full suite: 23 passed.
- 2026-11-25: Price sorts are asserted by comparing the formatted price list (`$15.99` twice), so the tie cannot make the order ambiguous. Sort labels (`sortLabels`) were confirmed by the live run.
- 2026-11-25: `formatPrice` + `orderTotals` (in cents, tax = round(8%)) were added to `src/data/products.ts`, so specs have no hardcoded money.
- 2026-11-25: BUG-06 asserts that the `checkout` button is disabled with an empty cart, rather than walking to "Thank you". A full walk would make a fixed app fail on a click timeout, and `test.fail()` would then hide that the bug was fixed. The JSON reporter confirmed BUG-06/07/08 each fail on their own bug assertion (disabled←enabled, "Add to cart"←"Remove", error not found).

- 2026-11-25: Phase 4: credentials have no hardcoded fallbacks (the user rejected the "defaults in code" approach). `src/config/env.ts` `requireEnv` fails fast when a variable is missing. `.env.example` is only a template for `.env`, and holds no passwords (blank values). The user caught a first version that still had the real passwords. In CI, passwords are GitHub Secrets and usernames are GitHub Variables, passed to the test step only. The CLAUDE.md "Secrets & config" rule was updated to match.
- 2026-11-25: Workflow `.github/workflows/playwright.yml` runs on push (all branches), PRs to `main` and manual dispatch. Concurrency cancels older runs. Steps: Node `lts/*` → `npm ci` → install Chromium → typecheck, lint, format:check → tests. `playwright-report/` + `test-results/` are uploaded with `if: !cancelled()` and kept 14 days. JUnit/job summary was left out because TASK.md only asks for an uploaded report. Local `CI=1` run: 23 passed.
- 2026-11-25: CI actions bumped from v4 to v7 (`checkout`, `setup-node`, `upload-artifact`) to clear the deprecated-Node-20 warning. Release notes v5–v7 were checked, and no breaking change affects this workflow.

- 2026-11-25: Phase 5.0: the suite had 20 tests + 2 smoke specs against the TASK.md brief of 10–14 (UI 5–7 core + 2–3 negative, API 1 flow + 2–3 negative). The overshoot came from the plan (4 negatives per area) and from one `test.fail()` pin per bug. The user chose to trim it to 12: UI = login, product list, sorting, cart, full checkout + wrong password, required checkout fields, BUG-06; API = E2E flow + update without token (403), BUG-01, BUG-02. Removed: `locked_out_user`, the no-session redirect, GET missing id (the E2E already asserts 404 after delete), BUG-03/04/05/07/08 pins, and both smoke specs. This reverses the earlier "smoke specs stay" decision. The removed bugs are still documented in the README with manual repro steps, and their code is in git history (`5582d50`, `924189e`). The removed code's now-unused helpers were deleted: `SAUCE_LOCKED_USERNAME` (env, `.env.example`, CI), `BurgerMenuComponent`, `BookingClient.ping`, unused users and messages. `createdBooking` teardown now requires 201 (only the BUG-05 test deleted the booking itself). Full suite: 13 passed (12 + setup), and the JSON reporter confirmed BUG-01/02/06 fail on their own assertions.

## Bugs found (candidates → confirmed)

API (confirmed 2026-11-25, see the findings table). Since 5.0 only BUG-01 and BUG-02 are pinned with `test.fail()` in `tests/api/booking.negative.spec.ts`; BUG-03/04/05 are manual repro only:

- **BUG-01** `POST /auth` with bad credentials returns **200** + `{"reason":"Bad credentials"}` (expected 401). (#2, #3)
- **BUG-02** `POST /booking` with a missing required field returns **500** (expected 400). (#17)
- **BUG-03** `POST /booking` accepts `totalprice` as a string and stores `null` (expected 400). (#19)
- **BUG-04** `POST /booking` accepts checkout before checkin (expected 400). (#20)
- **BUG-05** `DELETE`/`PUT` on an already deleted booking returns **405** (expected 404). (#15)

Rejected candidates: "create returns 200" and "delete returns 201" are documented in the apidoc (see Decisions). "Malformed body returns 500" was refined: malformed JSON → 400, missing fields → 500 (BUG-02).

UI (confirmed live 2026-11-25 with Playwright MCP). Since 5.0 only BUG-06 is pinned (`tests/ui/checkout.spec.ts`); BUG-07/08 are manual repro only:

- **BUG-06** Checkout completes with an empty cart: Cart → Checkout → info → overview (`Item total: $0`, `Total: $0.00`) → Finish → "Thank you for your order!" (expected: Checkout disabled, or an error).
- **BUG-07** After burger menu → Reset App State, the cart badge and storage are cleared, but the item buttons still say "Remove" (expected "Add to cart").
- **BUG-08** The postal code accepts any characters, e.g. `!!!abc` (expected: a validation error; rule above). Minor, seen with the empty cart: `Item total: $0` vs `Total: $0.00` (inconsistent money format), noted in the README only.

## Open questions

- Bonus generator: headless `claude -p` vs `@anthropic-ai/sdk` script. Decide in Phase 6.
- ~~Use `locked_out_user`?~~ Was yes in 3.1; the test and `SAUCE_LOCKED_USERNAME` were removed in 5.0 (scope trim). Delete the GitHub Variable.
