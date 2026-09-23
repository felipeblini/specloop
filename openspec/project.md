# Project Context: specloop

specloop (fork of ralphy-spec 0.3.6) prepares OpenSpec changes for Claude Code: `/specloop-plan` writes proposal, spec deltas and a `tasks.md` that an external loop (`loop.mjs` + `judge.mjs`, kept outside this repo) executes phase by phase. Implementation never happens inside the Claude Code session.

## Stack
- Language: TypeScript (strict), CommonJS output via tsc
- Runtime: Node.js >= 20.19.0
- Package manager: npm
- Dependencies: commander, fs-extra
- Tests: Vitest (`npm test`), typecheck: `npm run typecheck`

## Components
- `src/cli/` — `init`, `update`, `validate`, `tasks check|files`
- `src/core/spec/tasks-md.ts` — tasks.md parser/linter. Mirrors how loop.mjs reads tasks.md (groups `## N.`, 4-space continuation, path extraction, test/impl kind) and judge.mjs rules (test file pattern, hash lock, infra files). Keep the mirrored regexes in sync with the loop.
- `src/utils/installer.ts` — installs `.claude/commands/specloop-*.md`, OpenSpec scaffold and `CLAUDE.md` (with `## Comandos` from package.json scripts)
- `src/templates/claude-code/` — slash commands; `src/templates/shared/openspec-tasks-template.md` — tasks.md model (its example is linted by a test)

## External References
- [OpenSpec](https://github.com/Fission-AI/openspec)
- [Ralph Wiggum methodology](https://ghuntley.com/ralph)
