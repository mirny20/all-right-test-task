/**
 * Test case (plain text) → runnable Playwright spec, using Claude Code in headless mode.
 *
 *   npx tsx bonus/generate.ts bonus/examples/cart-remove.txt [more.txt ...]
 *   npx tsx bonus/generate.ts            # every bonus/examples/*.txt
 *
 * For each input it:
 *   1. asks `claude -p` (read-only tools: Read, Glob, Grep) to write a spec that uses the
 *      repo's Page Objects, fixtures and data, following the rules in CLAUDE.md;
 *   2. writes the reply to bonus/generated/<name>.spec.ts and formats it with Prettier;
 *   3. checks it: tsc, eslint, then `playwright test --project=bonus` (BONUS=1 enables that project);
 *   4. writes the check outputs to bonus/results/<name>.log.
 *
 * Needs a logged-in `claude` CLI and the same .env as the main suite.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';

const ROOT = join(__dirname, '..');
const EXAMPLES_DIR = join(__dirname, 'examples');
const GENERATED_DIR = join(__dirname, 'generated');
const RESULTS_DIR = join(__dirname, 'results');
/**
 * Safety stop, not a price: `claude -p` uses your Claude Code login (subscription limits) unless
 * ANTHROPIC_API_KEY is set. The CLI estimates each session's cost at API rates and stops it above this.
 */
const MAX_BUDGET_USD = '2';

const SYSTEM_PROMPT = `You are a non-interactive code generator. Your whole final answer is ONE TypeScript file in a single \`\`\`ts code block, nothing else.
Ignore the "state the approach and wait for approval", PLAN.md and AI_WORKLOG.md parts of CLAUDE.md: nobody will answer you.
Do follow the TypeScript, Page Object Model, selector and test design rules in CLAUDE.md.`;

function buildPrompt(testCase: string, specPath: string): string {
  return `Convert this manual test case into a Playwright + TypeScript spec for https://www.saucedemo.com.
The file will be saved as ${specPath}.

Session: the Playwright project logs in as standard_user once and gives every test that session (storageState).
- If the case starts with a logged-in user, import \`test\` and open the page under test directly; do not log in again.
- If the case needs a logged-out user (login, logout-only pages, access without a session), import \`guestTest as test\`
  from the same fixture file: it overrides storageState with an empty one, so the test starts with no session.

<test_case>
${testCase.trim()}
</test_case>

Before writing, read the code you will use; do not guess method or locator names:
- src/fixtures/ui.fixture.ts: import \`test\` (or \`guestTest as test\`, see Session) and \`expect\` from '@src/fixtures/ui.fixture'.
- src/pages/**: Page Objects and components. Use their methods and readonly locators.
- src/data/**: users, products, messages. Never hardcode credentials. Use the data modules for names and texts where they exist.
- tests/ui/*.spec.ts: the existing style to copy (tags, test.step, titles).

Requirements:
- One test; a \`test.step\` per stage of the case; title starts with "should".
- Tag the describe with '@ui' and the test with '@negative' when the case is a negative one.
- Web-first assertions only (await expect(locator)...). No waitForTimeout, no XPath, no CSS unless nothing else works.
- Every expected result in the case must become an assertion. Do not weaken it.
- If something the case needs does not exist in src/ (a page method, a message text), write the minimal code inside the spec and add a // TODO(generator): comment saying what is missing. Do not edit other files.`;
}

interface ClaudeJsonResult {
  result?: string;
  is_error?: boolean;
  total_cost_usd?: number;
  duration_ms?: number;
  num_turns?: number;
}

function run(command: string, args: string[], env: NodeJS.ProcessEnv = process.env) {
  const res = spawnSync(command, args, {
    cwd: ROOT,
    env,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  return { ok: res.status === 0, output: `${res.stdout}${res.stderr}`.trim() };
}

function askClaude(prompt: string): ClaudeJsonResult {
  const res = run('claude', [
    '-p',
    prompt,
    '--output-format',
    'json',
    '--tools',
    'Read,Glob,Grep',
    '--strict-mcp-config',
    '--no-session-persistence',
    '--max-budget-usd',
    MAX_BUDGET_USD,
    '--append-system-prompt',
    SYSTEM_PROMPT,
  ]);
  if (!res.ok) throw new Error(`claude -p failed:\n${res.output}`);
  return JSON.parse(res.output) as ClaudeJsonResult;
}

function extractCode(answer: string): string {
  const match = /```(?:ts|typescript)\s*\n([\s\S]*?)```/.exec(answer);
  if (!match?.[1]) throw new Error(`No \`\`\`ts block in the answer:\n${answer}`);
  return match[1];
}

function lastLine(output: string): string {
  return output.split('\n').filter(Boolean).at(-1) ?? '';
}

function generate(inputPath: string): boolean {
  const name = basename(inputPath, '.txt');
  const specPath = join(GENERATED_DIR, `${name}.spec.ts`);
  const relSpec = relative(ROOT, specPath);
  console.log(`\n=== ${name} ===`);

  const answer = askClaude(buildPrompt(readFileSync(inputPath, 'utf8'), relSpec));
  if (answer.is_error || !answer.result)
    throw new Error(`Claude returned an error: ${JSON.stringify(answer)}`);
  writeFileSync(specPath, extractCode(answer.result));
  // CI runs `prettier --check .`; the model's line wrapping does not always match.
  run('npx', ['prettier', '--write', relSpec]);
  console.log(
    `generated ${relSpec} (${String(answer.num_turns)} turns, ${((answer.duration_ms ?? 0) / 1000).toFixed(0)}s, $${(answer.total_cost_usd ?? 0).toFixed(2)})`,
  );

  // tsc cannot check one file with the tsconfig paths, so check the project and keep only this spec's errors
  // (another generated spec that does not compile must not fail this one).
  const project = run('npx', ['tsc', '--noEmit']);
  const ownErrors = project.output.split('\n').filter((line) => line.startsWith(relSpec));
  const tsc = {
    ok: ownErrors.length === 0,
    output: ownErrors.join('\n') || 'no errors in this spec',
  };
  const lint = run('npx', ['eslint', relSpec]);
  const pw = run('npx', ['playwright', 'test', '--project=bonus', relSpec, '--reporter=line'], {
    ...process.env,
    BONUS: '1',
  });

  const checks = { tsc, eslint: lint, playwright: pw };
  for (const [check, res] of Object.entries(checks)) {
    console.log(
      `${check.padEnd(10)} ${res.ok ? 'PASS' : 'FAIL'}  ${res.ok ? '' : lastLine(res.output)}`,
    );
  }
  console.log(`playwright ${lastLine(pw.output)}`);

  writeFileSync(
    join(RESULTS_DIR, `${name}.log`),
    Object.entries(checks)
      .map(([check, res]) => `### ${check}: ${res.ok ? 'PASS' : 'FAIL'}\n${res.output}\n`)
      .join('\n'),
  );
  return tsc.ok && lint.ok && pw.ok;
}

function main(): void {
  mkdirSync(GENERATED_DIR, { recursive: true });
  mkdirSync(RESULTS_DIR, { recursive: true });
  const inputs =
    process.argv.length > 2
      ? process.argv.slice(2)
      : readdirSync(EXAMPLES_DIR)
          .filter((f) => f.endsWith('.txt'))
          .map((f) => join(EXAMPLES_DIR, f));

  const failed = inputs.filter((input) => !generate(input));
  console.log(
    `\n${String(inputs.length - failed.length)}/${String(inputs.length)} generated specs passed all checks.`,
  );
  process.exitCode = failed.length ? 1 : 0;
}

main();
