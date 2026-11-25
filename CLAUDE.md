# CLAUDE.md — QA Automation Assignment (Playwright + TypeScript)

@TASK.md
@PLAN.md

## Working agreement

- Work ONE step of PLAN.md at a time. Before coding a step, state the approach in ≤10 lines and wait for approval.
- At the end of every step: run the relevant tests, update PLAN.md (status, decisions, "Next step"), and propose a commit message. Do not commit unless asked.
- Never claim a test passes without running it and showing the summary line.
- Never invent selectors, endpoints, status codes, or response shapes. Verify against the live site/API (Playwright MCP, codegen, or curl) or ask.
- Do not weaken an assertion to make a test pass. If the app misbehaves, it is a potential BUG: report it, do not "fix" the test.
- End every step with a "YOUR TURN" section: numbered manual actions in order
  (what to verify, exact git commands, when to /clear, and the exact prompt for the next step).
- **TASK.md is the assignment verbatim and must never be edited** (it is in `.prettierignore`). CLAUDE.md may be edited when a new rule is needed.
- Before proposing a commit, review `git status` / `git diff --stat`. Any changed file outside the step's scope must be explained or reverted.
- Anything that should go into the current commit (e.g. a proposed edit to CLAUDE.md) must be listed BEFORE the commit/push actions, never after them.
- No AI attribution in commit messages: never add `Co-Authored-By: Claude …` (or similar) trailers, in commits you run or messages you propose.

## Mistake logging (for AI_WORKLOG.md) — MANDATORY

Whenever (a) the user corrects you, (b) a test run reveals your code was wrong, or (c) you discover you hallucinated a selector/API detail,
append an entry to the "Raw log" section of AI_WORKLOG.md immediately, before continuing:

```
### <short title>
- What I did wrong:
- How it was caught: (user review / failing test / lint / tsc / manual check)
- Fix:
- Prevention rule: (if generalizable, also propose adding it to CLAUDE.md)
```

## Commands

- Install: `npm ci && npx playwright install --with-deps chromium`
- All tests: `npx playwright test`
- API only: `npx playwright test --project=api`
- UI only: `npx playwright test --project=ui`
- Single file, terse output: `npx playwright test tests/ui/cart.spec.ts --reporter=line`
- Type check: `npx tsc --noEmit` · Lint: `npm run lint`
- Report: `npx playwright show-report`

## Project structure

```
src/
  pages/      Page Objects (one class per page/component)
  api/        API clients (BookingClient) + response/request types
  fixtures/   Custom test fixtures (ui.fixture.ts, api.fixture.ts)
  data/       Users, test data factories (no hardcoded data in specs)
tests/
  ui/         *.spec.ts + auth.setup.ts
  api/        *.spec.ts
bonus/        Test-case → Playwright test generator + examples
```

## TypeScript rules

- `strict: true`, plus `noUncheckedIndexedAccess`, `noImplicitOverride`, `noUnusedLocals`.
- No `any`. Use `unknown` + narrowing, or explicit interfaces in `src/api/types.ts`.
- No `@ts-ignore` / `eslint-disable` without a comment explaining why.
- `npx tsc --noEmit` and lint must pass before a step is considered done.

## Page Object Model rules

- Page Objects expose **intent-level methods** (`login(user)`, `addToCart(name)`, `sortBy('lohi')`) and **locators as readonly properties** defined in the constructor.
- **No assertions inside Page Objects**, except `waitForLoaded()`-style readiness checks. Assertions live in specs.
- Page Objects never call `test()`/`expect` for business checks and never hold test data.
- Inject Page Objects via custom fixtures (`test.extend`). Specs must not call `new LoginPage(page)`.
- Shared components (header/cart badge, burger menu) = separate component classes composed into pages.

## Selector rules (priority order)

1. `page.getByTestId(...)`. saucedemo uses `data-test` attributes; `testIdAttribute: 'data-test'` is set in config.
2. `getByRole(...)` with accessible name.
3. `getByText` / `getByPlaceholder` for user-visible text.
4. CSS only as last resort, with a comment why. **Never** XPath, nth-child chains, or auto-generated class names.

- Locate products by name, not index (`inventoryItem.filter({ hasText: name })`).

## Test design rules

- Web-first assertions only (`await expect(locator).toHaveText(...)`). **Never** `waitForTimeout` or manual sleeps.
- Each test is independent: own data, no ordering between tests. API tests create & clean up their own bookings.
- A multi-stage flow = one test with `test.step(...)` per stage (not `describe.serial`).
- Test titles describe behavior: `should show error when password is wrong`.
- Tag tests: `@smoke`, `@negative`, `@api`, `@ui`.
- Known app bugs: keep the CORRECT expected assertion, mark with `test.fail()` + annotation `{ type: 'bug', description: 'BUG-0X ...' }`, and document in README.

## API rules (restful-booker)

- Use Playwright `request` / `APIRequestContext` through `BookingClient`. No axios.
- Base URL from config (`https://restful-booker.herokuapp.com`). Always send `Accept: application/json` and `Content-Type: application/json`.
- Auth token is sent as `Cookie: token=<token>`.
- Assert status code AND body shape for every call. Do not assume REST conventions; verify actual codes against the live API and record surprises as decisions/bugs.
- The public instance is shared and slow: generous timeouts, unique data per test (e.g. firstname with timestamp), no reliance on pre-existing IDs.

## Secrets & config

- Credentials come only from env vars, with **no hardcoded fallbacks** in code (even public demo creds). `src/config/env.ts` fails fast on a missing var.
- Locally: `.env` (gitignored), copied from the committed `.env.example` template. CI: passwords are GitHub **Secrets**, usernames are GitHub **Variables** (not secret, so logs stay readable).
