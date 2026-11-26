# Bonus: text test case → Playwright test

[`generate.ts`](generate.ts) turns a manual test case written as plain text (steps + expected result) into a runnable Playwright spec for saucedemo. It runs Claude Code in headless mode (`claude -p`) with read-only tools, so the agent can use this repo's Page Objects, fixtures and test data but cannot change them. The generated spec is formatted, type-checked, linted and run.

## Usage

```bash
npx tsx bonus/generate.ts                                 # all bonus/examples/*.txt
npx tsx bonus/generate.ts bonus/examples/cart-remove.txt  # one test case
BONUS=1 npx playwright test --project=bonus               # re-run the generated specs
```

- Run it in a normal terminal with a logged-in `claude` CLI. It does not start inside another Claude Code session.
- It uses the same `.env` as the main suite.
- It uses your Claude Code usage limits.
- Output: `generated/<name>.spec.ts` and the check results in `results/<name>.log`.
- Re-running overwrites the generated spec.

## Examples

| Input                                                     | Output                                                                 | Passed on first run | Fixed manually                                    |
| --------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------- | ------------------------------------------------- |
| [cart-remove](examples/cart-remove.txt)                   | [cart-remove.spec.ts](generated/cart-remove.spec.ts)                   | yes                 | nothing                                           |
| [sort-name-desc](examples/sort-name-desc.txt)             | [sort-name-desc.spec.ts](generated/sort-name-desc.spec.ts)             | yes                 | hardcoded product name → `products` test data     |
| [login-empty-password](examples/login-empty-password.txt) | [login-empty-password.spec.ts](generated/login-empty-password.spec.ts) | yes                 | hardcoded error text → `messages.ts` (was a TODO) |
