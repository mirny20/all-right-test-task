# AI Worklog

> Curated in Phase 5. Until then, entries are appended to **Raw log** as they happen (see the CLAUDE.md "Mistake logging" rule).

## Agent setup

- Agent: Claude Code (VS Code extension)
- Instructions: [CLAUDE.md](CLAUDE.md), which imports [TASK.md](TASK.md) (the assignment, verbatim) and [PLAN.md](PLAN.md) (living plan/status)

## Key prompts

_To be curated in Phase 5._

## Mistakes & how they were caught (curated, 3–5)

_To be curated in Phase 5 from the Raw log below._

---

## Raw log

### 2026-11-25 — Phase 2.3 specs failed lint (unused destructured var, conditional in test)

- What I did wrong: Omitted `firstname` via `const { firstname: _omitted, ...rest }` (the `_` prefix isn't allowed by the `no-unused-vars` config), and put `if (bookingId !== undefined)` cleanup inside the test's `finally` (`playwright/no-conditional-in-test`).
- How it was caught: lint (`npm run lint`) after the tests and `tsc` had passed.
- Fix: `Partial<Booking>` + `delete`. Create the booking before the `try`, so the `finally` deletes it unconditionally.
- Prevention rule: Run lint together with `tsc` before reporting a step. Keep conditional logic in helpers outside the test body.

### 2026-11-25 — Execution plan had a step ordering bug (PLAN.md missing at its own verification step)

- What I did wrong: The plan put creating PLAN.md in Step 1.2. But the CLAUDE.md template imports `@PLAN.md`, and the Step 1.1 check ("a new session can answer 'what is Phase 2?'") needs PLAN.md to exist already. The check could not pass as written.
- How it was caught: Manual check by the user. A new Claude session answered that no phases were defined because PLAN.md did not exist.
- Fix: Created PLAN.md (with the full phase breakdown) and this AI_WORKLOG.md skeleton as part of Step 1.1.
- Prevention rule: When a plan includes a verification step, make sure everything it depends on is created at or before that step. Check imports (`@file`) in instructions files resolve to files that exist.

### 2026-11-25 — Manual instructions in the wrong order (proposal came after commit and push)

- What I did wrong: In the step-by-step manual checklist I listed commit (step 3) and push (step 4), then at the very end proposed a CLAUDE.md change "to go into the same commit". The user followed the steps in order and had already pushed before reaching the proposal.
- How it was caught: User review. They pointed out the edit now needed a separate commit.
- Fix: Added the rule in a follow-up commit and added a CLAUDE.md rule: a "YOUR TURN" section at the end of every step, and anything that belongs in a commit is listed before the commit/push actions.
- Prevention rule: Write manual checklists in strict execution order. Read them top to bottom as if executing them literally before sending.

### 2026-11-25 — Probed a SPA page before it rendered (read stale DOM)

- What I did wrong: While verifying saucedemo selectors with a throwaway script, I read `[data-test]` attributes right after `waitForURL('**/inventory.html')`. saucedemo is a client-side SPA, so the URL changed before the DOM re-rendered, and the "inventory" dump was actually the login page.
- How it was caught: Script output: the inventory list was identical to the login list, which was implausible.
- Fix: Waited for the login container to detach before reading the DOM; got the real inventory `data-test` list.
- Prevention rule: On SPAs, a URL change is not a readiness signal. Wait for a page-specific element (this is why Page Objects get a `waitForLoaded()`).

### 2026-11-25 — Used `baseUrl` in tsconfig (deprecated in the installed TypeScript 6)

- What I did wrong: Proposed and wrote `"baseUrl": "."` + `paths` from habit, without checking the installed TypeScript major version (6.0.3), where `baseUrl` is deprecated (TS5101) and fails `tsc`.
- How it was caught: `npx tsc --noEmit` (error TS5101).
- Fix: Removed `baseUrl`; `paths` entries are now relative (`"./src/*"`), which TS resolves against the tsconfig directory.
- Prevention rule: After installing dependencies, check the actual major versions (`npm ls --depth=0`) before writing config from memory; run `tsc` immediately after writing tsconfig.

### 2026-11-25 — Ran `prettier --write .` over the whole repo and modified the verbatim TASK.md

- What I did wrong: Formatted the entire repo right after adding Prettier, which silently rewrote TASK.md (supposed to be the assignment verbatim) and CLAUDE.md (whitespace), files outside the scope of the step.
- How it was caught: Manual check of `git status` before proposing the commit; unexpected `M TASK.md`.
- Fix: `git checkout -- TASK.md CLAUDE.md`; added TASK.md to `.prettierignore`. I first ignored CLAUDE.md too; the user corrected that only TASK.md is frozen (CLAUDE.md may be edited/formatted). Rules added to CLAUDE.md Working agreement.
- Prevention rule: Review `git status`/`git diff --stat` before every commit proposal; any file outside the step's scope is a red flag. Repo-wide formatters/codemods must exclude verbatim/instruction files.

### 2026-11-25 — Phase 3.1 setup relied on a POM readiness check as its only assertion

- What I did wrong: `auth.setup.ts` called `inventoryPage.waitForLoaded()` (which asserts internally) and had no `expect` in the test body.
- How it was caught: lint (`playwright/expect-expect` warning).
- Fix: the setup asserts explicitly with `expect(inventoryPage.title).toHaveText('Products')`.
- Prevention rule: Specs and setups must have a visible `expect`. `waitForLoaded()` is for readiness inside flows, not a substitute for the test's assertion.

### 2026-11-25 — Phase 4 proposal: credentials via hardcoded fallbacks, and an unrequested JUnit reporter

- What I did wrong: (1) Proposed running CI with no secrets because "the `.env.example` defaults are used". That was inaccurate, since the defaults are hardcoded fallbacks in `src/config/env.ts` and not read from `.env.example`. It was also the wrong approach: credentials in source code, plus a silent fallback that hides missing config. (2) Offered an optional JUnit reporter that TASK.md does not ask for (it only asks for "test report uploaded as an artifact").
- How it was caught: user review of the step proposal.
- Fix: credentials come only from the environment (local `.env` / GitHub Secrets + Variables). `env.ts` fails fast when a variable is missing. The JUnit reporter was dropped.
- Prevention rule: Before describing how config is loaded, read the loader code. Never hardcode credentials as fallbacks, even public demo ones. Map every proposed item to a TASK.md line, and leave out anything that isn't one.

### 2026-11-25 — Left real passwords in the committed `.env.example` (and in PLAN.md)

- What I did wrong: After removing the hardcoded fallbacks from `env.ts`, I kept the real passwords in `.env.example`. That file is committed, so the credentials were still in the repo, just in a different file. PLAN.md's API findings table also had the booker password.
- How it was caught: user review.
- Fix: `.env.example` now has blank password values (and a blank BOOKER_USERNAME); only non-secret usernames stay. I removed the password from PLAN.md. The `gh secret set` instructions prompt for the value instead of passing it on the command line (keeps it out of shell history).
- Prevention rule: Before proposing a commit, run `git grep` for every credential value. Templates (`.env.example`) hold names and placeholders, never real secret values.
