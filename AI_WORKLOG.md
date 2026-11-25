# AI Worklog

How this repo was built with an AI agent: the setup, the key prompts, and the mistakes the agent made that I caught. The full, unedited list of agent mistakes is in the [Raw log](#raw-log) at the end.

## Agent setup

- **Agent:** Claude Code (VS Code extension), plus the **Playwright MCP** server for exploring saucedemo in a real browser. `curl` was used to explore restful-booker.
- **Instructions:** [CLAUDE.md](CLAUDE.md), loaded automatically in every session. It imports two other files:
  - [TASK.md](TASK.md): the assignment, verbatim and never edited (also excluded from Prettier).
  - [PLAN.md](PLAN.md): the living plan, with phase status, a "Next step", verified API/UI findings, a decisions log and the bug list. This kept context between sessions, so `/clear` could be used freely between steps.
- **What CLAUDE.md enforces:**
  - **Working agreement:** one PLAN.md step at a time. The agent states the approach in ≤10 lines and waits for approval. It runs the tests and shows the summary line before calling anything done, then updates PLAN.md and proposes a commit (no AI attribution trailers). Every step ends with a "YOUR TURN" checklist in execution order. The agent never invents selectors, endpoints or status codes; everything is verified against the live site/API first. It never weakens an assertion to make a test pass: app misbehaviour is a bug, pinned with `test.fail()`.
  - **Code rules:** TypeScript strictness (no `any`), Page Object rules (intent-level methods, no assertions, injected via fixtures), selector priority (`data-test` → role → text, never XPath), test design (web-first assertions, no sleeps, `test.step`, tags) and API rules (status + body on every call, unique data, cleanup).
  - **Secrets:** credentials only from env vars, with no fallbacks in code.
  - **Mistake logging:** whenever I correct the agent, or a test, lint or `tsc` shows it was wrong, it appends an entry to the raw log below before continuing.
- **Workflow per step:** `/clear` → "continue from Next step" → the agent proposes an approach → I review it and correct it or approve → the agent implements and runs the tests → I review the diff, the report and `git status` → commit.

## Key prompts

**1. Kick-off (verbatim; the assignment text, identical to [TASK.md](TASK.md), is omitted).** This produced the CLAUDE.md template, the tooling recommendation (`@playwright/test` + Playwright MCP) and the phased plan that became PLAN.md.

> I am starting a QA automation test assignment using Playwright + TypeScript. Before we write any code, act as a Senior QA Automation Architect and create a detailed, step-by-step execution plan.
>
> Here is the full task description:
> --- _[TASK.md]_ ---
>
> Please provide:
>
> 1. Context & File Strategy: Explain how I should structure TASK.md, CLAUDE.md, and PLAN.md in the repo so you never lose context across sessions, and give me the exact initial content for CLAUDE.md (including POM architecture, TypeScript strictness, selector best practices, and a rule reminding you to log mistakes/corrections for `AI_WORKLOG.md`).
> 2. Tooling & Configuration Recommendations: Before generating the plan, recommend the optimal setup for this specific stack (Playwright + TypeScript + Restful-Booker API): should I use standard @playwright/test via Playwright CLI, or integrate any additional tools/MCP servers?
> 3. Step-by-Step Execution Plan: Break the work down into logical phases (Setup → API Tests → UI Tests → CI → Documentation & Worklog → Optional Bonus). For each step, tell me:
>    - What I should do manually vs. what prompt I should give you.
>    - How to verify the step before moving on.
> 4. Context Management Tips: Tell me when to clear/compact context (`/clear` or `/compact`) during this workflow so your output quality doesn't degrade.
>
> Do not generate the project files yet—just give me the plan and the CLAUDE.md template so we can review and start Step 1.

**2. Step kick-off, used after every `/clear` (verbatim).** Because of the PLAN.md "Next step" section, this one line was enough to resume work.

> Read PLAN.md and continue from 'Next step'

## Mistakes the agent made, and how I caught them

These are the four mistakes I caught myself, in a plan review, a proposal review or a manual check. Mistakes the agent's own tooling caught (lint, `tsc`, `git status`, odd script output) are only in the raw log.

### 1. The plan could not pass its own first verification step

- **Mistake:** The execution plan created PLAN.md in step 1.2. But CLAUDE.md imports `@PLAN.md`, and the step 1.1 check ("a new session can answer 'what is Phase 2?'") needs PLAN.md to exist already.
- **How I caught it:** Manual check. I ran the check, and a new session answered that no phases were defined.
- **Fix:** PLAN.md and the AI_WORKLOG.md skeleton moved into step 1.1.

### 2. Credentials hardcoded as fallbacks, and a wrong description of how config loads

- **Mistake:** For CI, the agent proposed running with no secrets because "the `.env.example` defaults are used". That was wrong: the defaults were hardcoded fallbacks in `src/config/env.ts`, and `.env.example` is never read at runtime. It was also the wrong design: credentials in source, plus a silent fallback that hides missing config. The same proposal also added a JUnit reporter that the brief does not ask for.
- **How I caught it:** Review of the step proposal.
- **Fix:** Credentials come only from the environment (local `.env`, or GitHub Secrets + Variables in CI). `env.ts` fails fast when a variable is missing. The JUnit reporter was dropped. The rule was added to CLAUDE.md "Secrets & config".

### 3. Real passwords left in the committed `.env.example` and PLAN.md

- **Mistake:** After removing the fallbacks from code, the agent kept the real passwords in `.env.example`, which is committed. So the credentials were still in the repo, just in a different file. PLAN.md's API findings also had the booker password.
- **How I caught it:** Review of the diff.
- **Fix:** `.env.example` now holds only variable names and non-secret usernames, with blank passwords, and the password was removed from PLAN.md. The `gh secret set` instructions prompt for the value instead of taking it on the command line, which keeps it out of shell history.

### 4. Twice as many tests as the brief asks for, without flagging it

- **Mistake:** TASK.md asks for 5–7 UI core tests + 2–3 UI negatives, and 1 API flow + 2–3 API negatives. The plan already had 4 negatives per area. Then every confirmed bug got its own `test.fail()` pin, so the suite reached 20 tests (14 negative) + 2 smoke specs. The overshoot was never raised as a decision.
- **How I caught it:** Review. I compared the suite against the TASK.md numbers.
- **Fix:** Trimmed to 12 tests (UI 5 + 3, API 1 + 3). Only the three most critical bugs keep automated pins. The other five are bug reports with manual repro steps in the README.

---

## Raw log

Every mistake, logged as it happened (CLAUDE.md "Mistake logging" rule). Unedited apart from formatting.

### Phase 2.3 specs failed lint (unused destructured var, conditional in test)

- What I did wrong: Omitted `firstname` via `const { firstname: _omitted, ...rest }` (the `_` prefix isn't allowed by the `no-unused-vars` config), and put `if (bookingId !== undefined)` cleanup inside the test's `finally` (`playwright/no-conditional-in-test`).
- How it was caught: lint (`npm run lint`) after the tests and `tsc` had passed.
- Fix: `Partial<Booking>` + `delete`. Create the booking before the `try`, so the `finally` deletes it unconditionally.
- Prevention rule: Run lint together with `tsc` before reporting a step. Keep conditional logic in helpers outside the test body.

### Execution plan had a step ordering bug (PLAN.md missing at its own verification step)

- What I did wrong: The plan put creating PLAN.md in Step 1.2. But the CLAUDE.md template imports `@PLAN.md`, and the Step 1.1 check ("a new session can answer 'what is Phase 2?'") needs PLAN.md to exist already. The check could not pass as written.
- How it was caught: Manual check by the user. A new Claude session answered that no phases were defined because PLAN.md did not exist.
- Fix: Created PLAN.md (with the full phase breakdown) and this AI_WORKLOG.md skeleton as part of Step 1.1.
- Prevention rule: When a plan includes a verification step, make sure everything it depends on is created at or before that step. Check imports (`@file`) in instructions files resolve to files that exist.

### Manual instructions in the wrong order (proposal came after commit and push)

- What I did wrong: In the step-by-step manual checklist I listed commit (step 3) and push (step 4), then at the very end proposed a CLAUDE.md change "to go into the same commit". The user followed the steps in order and had already pushed before reaching the proposal.
- How it was caught: User review. They pointed out the edit now needed a separate commit.
- Fix: Added the rule in a follow-up commit and added a CLAUDE.md rule: a "YOUR TURN" section at the end of every step, and anything that belongs in a commit is listed before the commit/push actions.
- Prevention rule: Write manual checklists in strict execution order. Read them top to bottom as if executing them literally before sending.

### Probed a SPA page before it rendered (read stale DOM)

- What I did wrong: While verifying saucedemo selectors with a throwaway script, I read `[data-test]` attributes right after `waitForURL('**/inventory.html')`. saucedemo is a client-side SPA, so the URL changed before the DOM re-rendered, and the "inventory" dump was actually the login page.
- How it was caught: Script output: the inventory list was identical to the login list, which was implausible.
- Fix: Waited for the login container to detach before reading the DOM; got the real inventory `data-test` list.
- Prevention rule: On SPAs, a URL change is not a readiness signal. Wait for a page-specific element (this is why Page Objects get a `waitForLoaded()`).

### Used `baseUrl` in tsconfig (deprecated in the installed TypeScript 6)

- What I did wrong: Proposed and wrote `"baseUrl": "."` + `paths` from habit, without checking the installed TypeScript major version (6.0.3), where `baseUrl` is deprecated (TS5101) and fails `tsc`.
- How it was caught: `npx tsc --noEmit` (error TS5101).
- Fix: Removed `baseUrl`; `paths` entries are now relative (`"./src/*"`), which TS resolves against the tsconfig directory.
- Prevention rule: After installing dependencies, check the actual major versions (`npm ls --depth=0`) before writing config from memory; run `tsc` immediately after writing tsconfig.

### Ran `prettier --write .` over the whole repo and modified the verbatim TASK.md

- What I did wrong: Formatted the entire repo right after adding Prettier, which silently rewrote TASK.md (supposed to be the assignment verbatim) and CLAUDE.md (whitespace), files outside the scope of the step.
- How it was caught: Manual check of `git status` before proposing the commit; unexpected `M TASK.md`.
- Fix: `git checkout -- TASK.md CLAUDE.md`; added TASK.md to `.prettierignore`. I first ignored CLAUDE.md too; the user corrected that only TASK.md is frozen (CLAUDE.md may be edited/formatted). Rules added to CLAUDE.md Working agreement.
- Prevention rule: Review `git status`/`git diff --stat` before every commit proposal; any file outside the step's scope is a red flag. Repo-wide formatters/codemods must exclude verbatim/instruction files.

### Phase 3.1 setup relied on a POM readiness check as its only assertion

- What I did wrong: `auth.setup.ts` called `inventoryPage.waitForLoaded()` (which asserts internally) and had no `expect` in the test body.
- How it was caught: lint (`playwright/expect-expect` warning).
- Fix: the setup asserts explicitly with `expect(inventoryPage.title).toHaveText('Products')`.
- Prevention rule: Specs and setups must have a visible `expect`. `waitForLoaded()` is for readiness inside flows, not a substitute for the test's assertion.

### Phase 4 proposal: credentials via hardcoded fallbacks, and an unrequested JUnit reporter

- What I did wrong: (1) Proposed running CI with no secrets because "the `.env.example` defaults are used". That was inaccurate, since the defaults are hardcoded fallbacks in `src/config/env.ts` and not read from `.env.example`. It was also the wrong approach: credentials in source code, plus a silent fallback that hides missing config. (2) Offered an optional JUnit reporter that TASK.md does not ask for (it only asks for "test report uploaded as an artifact").
- How it was caught: user review of the step proposal.
- Fix: credentials come only from the environment (local `.env` / GitHub Secrets + Variables). `env.ts` fails fast when a variable is missing. The JUnit reporter was dropped.
- Prevention rule: Before describing how config is loaded, read the loader code. Never hardcode credentials as fallbacks, even public demo ones. Map every proposed item to a TASK.md line, and leave out anything that isn't one.

### Left real passwords in the committed `.env.example` (and in PLAN.md)

- What I did wrong: After removing the hardcoded fallbacks from `env.ts`, I kept the real passwords in `.env.example`. That file is committed, so the credentials were still in the repo, just in a different file. PLAN.md's API findings table also had the booker password.
- How it was caught: user review.
- Fix: `.env.example` now has blank password values (and a blank BOOKER_USERNAME); only non-secret usernames stay. I removed the password from PLAN.md. The `gh secret set` instructions prompt for the value instead of passing it on the command line (keeps it out of shell history).
- Prevention rule: Before proposing a commit, run `git grep` for every credential value. Templates (`.env.example`) hold names and placeholders, never real secret values.

### Planned and wrote more tests than TASK.md asks for, without flagging it

- What I did wrong: TASK.md asks for 5–7 UI core tests + 2–3 UI negatives, and one API flow + 2–3 API negatives (10–14 in total). PLAN.md 2.3 and 3.2 already listed 4 negatives per area. Then every confirmed bug got its own `test.fail()` pin, so the suite ended up with 20 tests (14 negatives) + 2 smoke specs. The overshoot was never recorded as a decision.
- How it was caught: user review ("how many tests does TASK.md ask for, and how many are written?").
- Fix: trimmed to 12 tests (UI 5 core + 3 negative, API 1 flow + 3 negative). Only the most critical bugs keep automated pins (BUG-01, BUG-02, BUG-06). BUG-03/04/05/07/08 are documented in the README as bug reports with manual repro steps. The smoke specs were removed.
- Prevention rule: When planning a step, compare the planned test count against the TASK.md numbers and flag any difference as a decision for the user. Bug pins count toward the brief's numbers.

### Picked tool-caught mistakes for the curated worklog list

- What I did wrong: When proposing the 3–5 curated mistakes for AI_WORKLOG.md, I picked them for variety of detection method (tsc, git status, implausible script output, user review). TASK.md asks for "places where the agent made mistakes, and how **you** caught them", that is, mistakes the human caught, not ones the agent's own tooling caught.
- How it was caught: user review of the Phase 5.1 proposal.
- Fix: the curated list only uses raw-log entries whose "How it was caught" is the user (review or manual check).
- Prevention rule: Read the TASK.md wording for each deliverable literally (who does what) before choosing what goes into it.

### README "left out" section listed items without real reasons

- What I did wrong: The README's "What was intentionally left out" section mostly restated scope decisions ("the brief names `standard_user`", "trimmed to the brief", a bare list of untested endpoints and reporters). It explained nothing about why those areas were not tested.
- How it was caught: user review of the README.
- Fix: rewrote the section as test areas left out, each with a technical or ethical reason (cross-browser cost vs. value, no load or security testing against shared public services, unstable visual baselines on a third-party site, accessibility findings nobody can act on, live backends instead of mocks). Also dropped the "documented API behaviour" section and the dates, and split the bug reports by product.
- Prevention rule: "Left out, and why" needs a reason that would still hold if the brief didn't exist. "The task didn't ask for it" is not a reason.
