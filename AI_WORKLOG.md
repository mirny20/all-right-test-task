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
