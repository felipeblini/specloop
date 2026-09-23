# ralphy-spec (Claude Code edition)

**Spec-driven AI development with iterative execution, for Claude Code only.** Combines OpenSpec + Ralph Loop, with a `tasks.md` in which every task and every test states exactly which files it creates, modifies or deletes — including HTML, CSS and test files.

Fork of [wenqingyu/ralphy-openspec](https://github.com/wenqingyu/ralphy-openspec) 0.3.6 (commit `0c1cf7a`). Cursor and OpenCode support were removed. See [CHANGELOG](CHANGELOG.md).

## Install

Not published to npm. From this folder:

```bash
npm install
npm run build
npm install -g .        # or: sh scripts/install.sh
```

Then, in your project:

```bash
ralphy-spec init
```

This creates `.claude/commands/ralphy-*.md`, `openspec/` and `ralphy-spec/`.

## Claude Code commands

| Command | What it does |
|---------|--------------|
| `/ralphy-plan` | Create specs + `tasks.md` (with files per task and per test) from requirements |
| `/ralphy-implement` | Build with iterative loop, touching only declared files |
| `/ralphy-validate` | Verify acceptance criteria + audit changed files vs declared files |
| `/ralphy-archive` | Complete and archive |

## tasks.md format

```markdown
- [ ] 2.1 Render the prize card on the home screen
  - Files:
    - CREATE `src/components/PrizeCard.vue`
    - CREATE `src/styles/prize-card.css`
    - MODIFY `index.html` — preload the display font
    - CREATE `tests/unit/PrizeCard.test.ts`
  - Acceptance criteria:
    - GIVEN a prize WHEN the home renders THEN the card shows image and name
  - Tests:
    - [ ] T2.1.a renders the prize name and image
      - Files:
        - CREATE `tests/unit/PrizeCard.test.ts`
      - Covers: `src/components/PrizeCard.vue`
      - Run: `npm test -- PrizeCard`
      - Assert: name text and `<img src>` match the props
```

Rules (enforced by `ralphy-spec tasks check`):

- Every task has `Files:` (or `Files: NONE (reason)`) and `Tests:` (or `Tests: NONE (reason)`).
- Entries are `CREATE|MODIFY|DELETE` + a backticked, concrete, repo-relative path. No globs.
- `CREATE` only for files that don't exist yet and aren't created by an earlier task; `MODIFY`/`DELETE` only for files that exist or were created earlier.
- Every test has its own `Files:`; any test file it lists must also be in the task's `Files:`.
- Test files listed in a task must be claimed by some test (warning).

Full template: [`src/templates/shared/openspec-tasks-template.md`](src/templates/shared/openspec-tasks-template.md).

## CLI

```bash
ralphy-spec tasks check [change]          # lint tasks.md (--strict, --json)
ralphy-spec tasks files [change]          # files per task/test (--by-file, --json)
ralphy-spec tasks sync [change]           # tasks.md -> openspec/project.yml with files_contract
ralphy-spec run --dry-run
ralphy-spec run                           # backend: claude-code
ralphy-spec status
ralphy-spec budget --json
```

`[change]` can be omitted when there is only one change under `openspec/changes/`.

`tasks sync` turns each pending task into an engine task whose `files_contract.allowed` is exactly its declared files (plus the change's `tasks.md`), chained in document order. `ralphy-spec run` then reverts the workspace if Claude modifies a file outside that list.

Logs & artifacts (during/after runs):
- `ralphy-spec/STATUS.md`: live status (primary)
- `ralphy-spec/TASKS.md`: task board, now with each task's declared files
- `ralphy-spec/runs/<runId>.md`: run log (immutable on completion)
- `ralphy-spec/logs/<runId>/...`: backend transcripts

## Example workflow

```bash
You: /ralphy-plan Add a prize card to the home screen
#   -> openspec/changes/add-prize-card/{proposal.md,tasks.md,specs/...}
#   -> runs `ralphy-spec tasks check add-prize-card` until clean

ralphy-spec tasks files add-prize-card --by-file   # review what will be touched

You: /ralphy-implement add-prize-card
#   or, headless: ralphy-spec tasks sync && ralphy-spec run

You: /ralphy-validate
You: /ralphy-archive add-prize-card
```

## What gets created

```
.claude/commands/
├── ralphy-plan.md
├── ralphy-implement.md
├── ralphy-validate.md
└── ralphy-archive.md

openspec/
├── specs/                # Source of truth
├── changes/              # Active work
├── archive/              # Completed
├── project.md            # Context
└── project.yml           # Engine config + tasks (backend: claude-code)

ralphy-spec/              # Local state + artifacts
├── state.db
├── STATUS.md
├── TASKS.md
├── BUDGET.md
├── runs/
├── logs/
├── worktrees/
└── tasks/<taskId>/{CONTEXT,REPAIR,NOTES}.md
```

## How it works

**Ralph Wiggum Loop:** AI receives the same prompt repeatedly until task completion. Each iteration, it sees previous work in files and self-corrects.

**OpenSpec:** Specs before code. Structured specifications with acceptance criteria ensure AI knows exactly what to build.

**File declarations:** the plan fixes which files each task and test touches, so the implementation step (and the engine's file contract) can hold Claude to it.

## Credits

- **[ralphy-openspec](https://github.com/wenqingyu/ralphy-openspec)** by Wenqing Yu (upstream)
- **[Ralph Methodology](https://ghuntley.com/ralph)** by Geoffrey Huntley
- **[OpenSpec](https://github.com/Fission-AI/OpenSpec)** by Fission-AI

## License

BSD-3-Clause (upstream license retained in [LICENSE](LICENSE)).
