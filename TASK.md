Deliverable: A GitHub repository with a README.
You write the tests paired with an AI agent (Claude Code, Cursor, Copilot agent, or similar).

1. UI (Playwright + TypeScript)
   Site: https://www.saucedemo.com (user: `standard_user`)
   - 5–7 tests covering core flows: login, catalog, sorting, cart, checkout
   - 2–3 negative/edge cases

2. API
   API: https://restful-booker.herokuapp.com/apidoc
   - Flow: auth → create booking → update → delete → verify it no longer exists
   - 2–3 negative cases

3. CI
   - GitHub Actions, tests run on push, test report uploaded as an artifact

4. AI_WORKLOG.md
   - Agent instructions (`CLAUDE.md`, .cursorrules, or equivalent) and key prompts
   - 3–5 places where the agent made mistakes, and how you caught them

5. README
   - How to run, what is covered, and what was intentionally left out
   - Bugs found formatted as bug reports: steps, expected result, and actual result

Bonus:
A pipeline script: takes a test case as text (steps + expected result) as input, and outputs a runnable Playwright test. Any language, any model via API or an agent in headless mode. Show 2–3 examples: input, generated output, whether it passed, and what had to be fixed manually.