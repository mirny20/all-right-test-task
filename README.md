# QA Automation Assignment: Playwright + TypeScript

UI tests for [saucedemo.com](https://www.saucedemo.com) and API tests for [restful-booker](https://restful-booker.herokuapp.com/apidoc), written paired with an AI agent (Claude Code). See [AI_WORKLOG.md](AI_WORKLOG.md) for how the agent was used and where it went wrong.

- **Stack:** Playwright Test 1.65, TypeScript 6 (strict), ESLint 10 + `eslint-plugin-playwright`, Prettier, GitHub Actions
- **Browser:** Chromium
- **Suite:** 12 tests (UI 5 core + 3 negative, API 1 E2E flow + 3 negative). 3 of them pin known bugs.

## How to run

Requirements: Node.js LTS and npm.

```bash
npm ci
npx playwright install --with-deps chromium
cp .env.example .env      # then fill in the values (see below)
```

`.env` (gitignored) must define all four variables. If one is missing, the run stops at startup with an error that names it (`src/config/env.ts`). Nothing falls back to credentials hardcoded in the code.

| Variable          | Value                                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------- |
| `SAUCE_USERNAME`  | `standard_user`                                                                                                |
| `SAUCE_PASSWORD`  | the password shown on the saucedemo login page                                                                 |
| `BOOKER_USERNAME` | the admin username from the [restful-booker docs](https://restful-booker.herokuapp.com/apidoc) (`CreateToken`) |
| `BOOKER_PASSWORD` | the admin password from the same docs section                                                                  |

| Command                                                       | What it does                                  |
| ------------------------------------------------------------- | --------------------------------------------- |
| `npm test`                                                    | all tests (setup + api + ui)                  |
| `npm run test:api` / `npm run test:ui`                        | one project                                   |
| `npx playwright test --grep @negative`                        | by tag (`@ui`, `@api`, `@negative`, `@smoke`) |
| `npx playwright test tests/ui/cart.spec.ts --reporter=line`   | one file                                      |
| `npm run report`                                              | open the last HTML report                     |
| `npm run typecheck` · `npm run lint` · `npm run format:check` | static checks (CI runs all three)             |

A green run shows `12 passed` plus the `setup` test. The 3 bug pins count as passed, because they are `test.fail()` tests that fail as expected (see [Known bugs in the suite](#known-bugs-in-the-suite)).

### CI

[`.github/workflows/playwright.yml`](.github/workflows/playwright.yml) runs on every push, on PRs to `main` and on manual dispatch. It runs `npm ci`, installs Chromium, then type check, lint, format check and the tests. `playwright-report/` and `test-results/` (traces and screenshots of failures) are uploaded as the artifact `playwright-report-<attempt>`, kept 14 days, even when tests fail. Download it from the run page (**Summary → Artifacts**) and open `playwright-report/index.html`.

To run the workflow in a fork, set these in **Settings → Secrets and variables → Actions**:

- **Secrets:** `SAUCE_PASSWORD`, `BOOKER_PASSWORD`
- **Variables:** `SAUCE_USERNAME`, `BOOKER_USERNAME` (not secret, so they stay readable in logs)

## Project structure

```
src/
  config/env.ts    required env vars, fail fast
  api/             BookingClient (wraps APIRequestContext) + request/response types
  pages/           Page Objects; components/ = header (cart badge), item list
  fixtures/        test.extend fixtures: ui.fixture.ts, api.fixture.ts
  data/            factories (booking, customer), products/prices, UI messages, users
tests/
  ui/              auth.setup.ts + login, catalog, cart, checkout specs
  api/             booking.spec.ts (E2E flow), booking.negative.spec.ts
```

Design choices:

- **Page Object Model.** Page Objects expose intent-level methods (`login(user)`, `addToCart(name)`, `sortBy('lohi')`) and readonly locators. They make no business assertions; those live in the specs. Specs get Page Objects from fixtures and never call `new`.
- **Selectors.** `data-test` attributes via `getByTestId` (`testIdAttribute: 'data-test'`) come first, then roles. Products are found by name, never by index.
- **Login once.** `auth.setup.ts` logs in and saves `storageState` (the session cookie). UI tests reuse it, so each one starts logged in with an empty cart. Login tests use a fixture with no session.
- **Independent tests.** Multi-stage flows are one test with a `test.step` per stage. API tests create their own booking with unique data and delete it afterwards. No test depends on pre-existing IDs.
- **Test data.** Specs hold no hardcoded test data or money values. Expected prices, the 8% tax and totals are computed in `src/data/products.ts`.
- **Status and body.** Every API call asserts the status code and the body shape. Error bodies are asserted as text, because restful-booker returns them as `text/plain`, not JSON.
- **Known bugs.** A known bug stays in the suite as the correct assertion, marked with `test.fail()` and a `bug` annotation (BUG-0X), which the HTML report shows. If the bug gets fixed, the test starts "unexpectedly passing" and the run goes red, so the fix gets noticed.

## What is covered

### UI: saucedemo (`standard_user`)

| #   | Test                                                                                  | Type     | What it checks                                                                                          |
| --- | ------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| 1   | login › should log in standard_user and open the inventory                            | core     | Valid login opens the Products page                                                                     |
| 2   | catalog › should list all products with their prices                                  | core     | All 6 products with their names and prices                                                              |
| 3   | catalog › should sort products by name and by price                                   | core     | All 4 sort options (A→Z default, Z→A, price low→high, high→low) and the active sort label               |
| 4   | cart › should add and remove items and keep the badge and cart in sync                | core     | Add from inventory, cart contents and quantity, remove in the cart and in the inventory, badge count    |
| 5   | checkout › should complete checkout with correct overview totals                      | core     | Full flow: cart → info → overview (items, subtotal, 8% tax, total) → finish clears the cart → back home |
| 6   | login › should show error when password is wrong                                      | negative | Error message, no navigation to the inventory                                                           |
| 7   | checkout › validation › should require first name, last name and postal code in order | negative | Each missing field shows its own error, and checkout stays on step one                                  |
| 8   | checkout › should not allow checkout with an empty cart                               | negative | **BUG-06** pin (`test.fail()`)                                                                          |

### API: restful-booker

| #   | Test                                               | Type     | What it checks                                                                                                            |
| --- | -------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1   | should create, read, update and delete a booking   | E2E flow | auth → token; create → 200 + payload echoed; GET → 200; PUT → 200 + persisted; DELETE → 201; GET → 404 (no longer exists) |
| 2   | should reject update without a token with 403      | negative | `PUT` without the token cookie → 403 `Forbidden`, booking unchanged                                                       |
| 3   | should reject auth with a wrong password with 401  | negative | **BUG-01** pin (`test.fail()`)                                                                                            |
| 4   | should reject a booking without firstname with 400 | negative | **BUG-02** pin (`test.fail()`)                                                                                            |

### API behaviour that is documented, not a bug

These calls don't follow REST conventions, but they match the [apidoc](https://restful-booker.herokuapp.com/apidoc), so the tests assert them as documented:

- `POST /booking` returns **200**, not 201.
- `DELETE /booking/{id}` returns **201 Created**, with body `Created`.
- `GET /ping` returns **201**.
- Error responses are `text/plain` with the status text as the body (`Forbidden`, `Not Found`), even with `Accept: application/json`.

## What was intentionally left out

- **Other browsers.** Only Chromium runs. The flows are not browser-specific, and three browsers would triple a slow CI run against public demo sites.
- **Other saucedemo users** (`locked_out_user`, `problem_user`, `performance_glitch_user`, …). The brief names `standard_user`. A `locked_out_user` test existed and was removed when the suite was trimmed to the brief (it is in git history, `924189e`).
- **A bug pin for every bug found.** The brief asks for 2–3 negative cases per area. Only the 3 most critical bugs are pinned. The other five (BUG-03, 04, 05, 07, 08) are documented below with manual repro steps. Their removed pins are in git history (`5582d50`, `924189e`).
- **Other trimmed tests.** "GET a missing id → 404" was dropped because the E2E flow already asserts 404 after delete. "Direct `/inventory.html` without a session" and the smoke specs were also dropped.
- **Untested API endpoints:** `PATCH`, `GET /booking` filters, XML bodies, Basic auth.
- **Other test types:** visual regression, accessibility, performance/load, mobile viewports.
- **Extra reporters** (JUnit, Allure). The brief asks for an uploaded report, and the HTML report covers it.

## Bugs found

All bugs were reproduced against the live sites on 2026-11-25. **Status** says whether a bug is pinned in the suite or reproduced manually.

### Known bugs in the suite

The suite pins BUG-01, BUG-02 and BUG-06 as `test.fail()` tests. They are reported as passed while the bug is present.

### BUG-01: `POST /auth` with wrong credentials returns 200 instead of 401

- **Severity:** Major
- **Status:** Automated (`tests/api/booking.negative.spec.ts`, "should reject auth with a wrong password with 401")
- **Steps:**
  1. `POST https://restful-booker.herokuapp.com/auth` with `Content-Type: application/json` and body `{"username":"admin","password":"wrong"}`.
- **Expected:** `401 Unauthorized`.
- **Actual:** `200 OK` with body `{"reason":"Bad credentials"}`. An empty body `{}` gives the same result. Clients can't tell a failed login from a successful one by the status code.

### BUG-02: `POST /booking` with a missing required field returns 500

- **Severity:** Major
- **Status:** Automated (`tests/api/booking.negative.spec.ts`, "should reject a booking without firstname with 400")
- **Steps:**
  1. `POST /booking` with a valid booking body that leaves out `firstname`, e.g. `{"lastname":"QA","totalprice":1,"depositpaid":true,"bookingdates":{"checkin":"2026-12-01","checkout":"2026-12-02"}}`.
- **Expected:** `400 Bad Request`, with a message about the missing field.
- **Actual:** `500 Internal Server Error`. An empty body `{}` gives the same result. Missing input crashes the server instead of failing validation. (Malformed JSON gets a correct 400.)

### BUG-03: `POST /booking` accepts a non-numeric `totalprice` and stores `null`

- **Severity:** Major (silent data loss)
- **Status:** Manual repro
- **Steps:**
  1. `POST /booking` with a valid body, but `"totalprice":"abc"`.
  2. `GET /booking/{bookingid}`.
- **Expected:** `400 Bad Request`, and no booking is created.
- **Actual:** `200 OK`. The booking is created with `"totalprice": null`.

### BUG-04: `POST /booking` accepts a checkout date before the checkin date

- **Severity:** Medium
- **Status:** Manual repro
- **Steps:**
  1. `POST /booking` with a valid body, but `"bookingdates":{"checkin":"2026-12-10","checkout":"2026-12-01"}`.
- **Expected:** `400 Bad Request` (checkout must not be before checkin).
- **Actual:** `200 OK`. The booking is stored with the dates as sent.

### BUG-05: `DELETE` / `PUT` on a deleted booking returns 405 instead of 404

- **Severity:** Minor
- **Status:** Manual repro
- **Steps:**
  1. `POST /auth` with valid credentials and take the `token`.
  2. `POST /booking` with a valid body and take the `bookingid`.
  3. `DELETE /booking/{bookingid}` with `Cookie: token=<token>` → `201 Created`.
  4. Send the same `DELETE` again, and a valid `PUT /booking/{bookingid}` with the same cookie.
- **Expected:** `404 Not Found`, which is what `GET` returns for the same id.
- **Actual:** `405 Method Not Allowed` for both. That status means the method isn't supported on the resource, which is misleading here.

### BUG-06: Checkout can be completed with an empty cart

- **Severity:** Major
- **Status:** Automated (`tests/ui/checkout.spec.ts`, "should not allow checkout with an empty cart"). The test asserts that the Checkout button is disabled with an empty cart.
- **Steps:**
  1. Log in as `standard_user` with an empty cart.
  2. Click the cart icon, then **Checkout**.
  3. Fill in First Name, Last Name and Zip, then click **Continue**.
  4. On the overview page, click **Finish**.
- **Expected:** Checkout is not possible with an empty cart: the Checkout button is disabled, or an error is shown.
- **Actual:** Checkout is allowed at every step. The overview shows `Item total: $0` and `Total: $0.00`, and Finish shows "Thank you for your order!".

### BUG-07: Reset App State leaves item buttons showing "Remove"

- **Severity:** Minor
- **Status:** Manual repro
- **Steps:**
  1. Log in as `standard_user`.
  2. On the inventory page, click **Add to cart** for "Sauce Labs Backpack". The badge shows 1 and the button changes to **Remove**.
  3. Open the burger menu and click **Reset App State**.
- **Expected:** The cart is empty, and every item's button says **Add to cart**.
- **Actual:** The badge and the stored cart are cleared, but the Backpack button still says **Remove** until the page is reloaded.

### BUG-08: The postal code field accepts any characters

- **Severity:** Minor
- **Status:** Manual repro
- **Steps:**
  1. Log in as `standard_user` and go to checkout (cart → **Checkout**).
  2. Enter First Name `Ann`, Last Name `Lee`, Zip/Postal Code `!!!abc`.
  3. Click **Continue**.
- **Expected:** A validation error, and checkout stays on step one. The rule assumed here is that a postal code contains only letters, digits, spaces and hyphens. The site has no documented rule.
- **Actual:** No error. Checkout goes on to the overview page.

**Minor observation (not filed as a bug):** with an empty cart, the overview shows `Item total: $0` but `Total: $0.00`. The two lines format money differently.

## AI usage

The whole suite was written with Claude Code, working one step at a time from [PLAN.md](PLAN.md) under the rules in [CLAUDE.md](CLAUDE.md). [AI_WORKLOG.md](AI_WORKLOG.md) has the agent setup, the key prompts, and the mistakes the agent made and how they were caught.
