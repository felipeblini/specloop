# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-01-23

### Added
- Initial public release of `ralphy-spec`.
- Astro-powered documentation site with i18n (en/zh/ko/ja).

### Changed
- N/A

### Fixed
- N/A

## [0.3.0] - 2026-01-23

### Added
- Budget intelligence: three-tier budgets (optimal → warning → hard) with hard-cap blocking + failure summaries.
- Sprint semantics: `sprint.size` defaults, `sprint.intent` constraints, and configurable scope guard policy (`off|warn|block`).
- Artifact system: `ralphy-spec/` folder, STATUS/TASKS/BUDGET writers, per-task artifacts, immutable run logs, and `--artifact-dir`.
- New CLI command: `ralphy-spec budget` and a full CLI docs page on the website.
- Test suite (Vitest) covering the above behaviors.

### Changed
- `ralphy-spec run` now supports `worktree` mode and real backend selection (`cursor|opencode|claude-code|noop`).
- Docs + README (all languages) updated to reflect the new artifacts and CLI.

## [0.3.1] - 2026-01-23

### Fixed
- `--backend cursor` now invokes **Cursor Agent** (`cursor agent --print ...`) instead of the editor CLI, and provides a clear error when Cursor Agent authentication is missing.

## [0.3.2] - 2026-01-23

### Changed
- `ralphy-spec run` now streams backend output to the terminal by default. Use `--no-stream-backend` to disable (and `--json` remains non-streaming).

## [0.3.3] - 2026-01-23

### Changed
- `ralphy-spec run` now prints minimal progress updates to stderr (run started, task/iteration, validate), so runs never look “hung” even if the backend is quiet.

## [0.3.4] - 2026-01-23

### Added
- Per-iteration backend transcripts under `ralphy-spec/logs/<runId>/...` (stdout/stderr + metadata), and a backend heartbeat message every 30s while a backend call is running.

## [0.3.5] - 2026-01-23

### Fixed
- Backends now respect task budget time limits (`task.budget.hard.time_minutes`) instead of using a fixed 10-minute timeout. This prevents premature termination of longer tasks.
- Improved timeout detection: backends now explicitly detect and report timeouts (using execa's `timedOut` flag) with actionable error messages suggesting task breakdown or budget increases.
- Backend logs now include timeout information (timedOut flag, timeout duration, actual duration) for better debugging.

### Changed
- Timeout error messages now clearly distinguish between timeouts (with budget context) and other termination causes (crashes, external kills).

## [0.3.6] - 2026-01-23

### Added
- **Real-time backend logging**: Backend logs are now written in real-time as output is received, with `[OUT]`/`[ERR]` prefixes for easier debugging.
- **Agent activity reporting**: Cursor backend now detects and reports agent activities (thinking, executing commands, reading files, etc.) in progress messages when output is available.

### Fixed
- Improved error handling in Cursor backend: now properly captures and logs errors even when the process is interrupted externally (SIGTERM, SIGKILL, etc.).
- Backend logs are now always written (best-effort) even if the subprocess throws an exception or is killed, ensuring diagnostic information is preserved.
- Better error messages for process interruptions, distinguishing between timeouts, crashes, and external kills.
- Real-time stdout/stderr capture: output is now captured via event listeners before piping to terminal, ensuring all output is logged even when streaming is enabled.

## [0.4.0] - 2026-09-22

Claude Code-only fork of ralphy-spec 0.3.6 (upstream commit 0c1cf7a).

### Added
- `tasks.md` format where every task declares the files it CREATEs/MODIFYs/DELETEs (including HTML, CSS, config and test files) and every test declares its own test files, `Covers`, `Run` and `Assert`.
- `ralphy-spec tasks check [change]`: lints tasks.md (missing `Files:`/`Tests:`, globs, invalid actions, CREATE vs MODIFY against the repo, test files not declared in the task, test files not claimed by any test). `--strict` and `--json`.
- `ralphy-spec tasks files [change]`: per-task file list, or reverse map with `--by-file`.
- `ralphy-spec tasks sync [change]`: writes pending tasks into `openspec/project.yml` with `files_contract.allowed` = declared files, so `ralphy-spec run` enforces them.
- `TASKS.md` board lists each task's declared files.

### Changed
- `/ralphy-plan`, `/ralphy-implement`, `/ralphy-validate`, `/ralphy-archive` and the loop prompt template now require and enforce the per-task/per-test file declarations.
- Default backend is `claude-code`; unknown backends now fail with exit code 4 instead of silently falling back to noop.
- `--tools` accepts only `claude-code` (other values are ignored with a warning); no interactive tool prompt.

### Removed
- Cursor and OpenCode support: backends, templates, `.cursor/`, `AGENTS.md`, `inquirer` dependency.
- Upstream docs website (`docs/`) and its deploy workflow, translated READMEs, and committed runtime state (`.ralphy/`, `ralphy-spec/`).

## [0.5.0] - 2026-09-22

Renomeado para **specloop**. A implementação sai da sessão: roda no terminal pelo loop externo (`loop.mjs` + `judge.mjs`).

### Changed
- CLI `ralphy-spec` → `specloop`; comandos `/ralphy-plan|validate|archive` → `/specloop-plan|validate|archive`.
- Formato do `tasks.md` alinhado ao `loop.mjs`: grupos `## N.`, detalhes recuados 4 espaços, `CRIA`/`ALTERA`/`REMOVE`, teste como tarefa própria antes da implementação, `Casos`, `Import` com `../`, `Fica verde`.
- `specloop tasks check` replica a leitura do loop e as regras do juiz (escopo derivado do texto, tipo teste/impl, ordem, trava de testes por hash, infraestrutura, recuo).
- `specloop tasks files --fases` mostra as fases como o `loop.mjs --listar`.
- `specloop init` cria `CLAUDE.md` com `## Comandos` a partir dos scripts do `package.json`; `init`/`update` apagam os `ralphy-*.md` antigos.
- Templates em português.

### Removed
- `/ralphy-implement` (o loop roda fora da sessão).
- `tasks sync` e o modelo de prompt do Ralph loop.
- `openspec/changes/add-cli-plan-command` (plano inacabado do upstream).

## [0.6.0] - 2026-09-22

### Removed
- Motor interno do ralphy-spec: `run`, `status`, `budget`, `report`, `tail`, `checkpoint`, backends, workspaces, validators, budgets, SQLite, pasta `ralphy-spec/` e `openspec/project.yml`. O loop é o `loop.mjs`.
- Dependências: better-sqlite3, chalk, cli-table3, execa, fast-glob, inquirer, minimatch, ora, yaml, zod.
- `openspec/archive/` do upstream (specs do motor removido).

### Changed (cont.)
- Changes arquivadas vão para `openspec/changes/archive/AAAA-MM-DD-<change>/`, como no CLI do OpenSpec (o upstream usava `openspec/archive/`). O `loop.mjs` já ignora `changes/archive`.

### Changed
- `/specloop-plan` roda `openspec validate --strict` quando o CLI do OpenSpec está instalado.

### Fixed
- `scripts/clean.mjs` apagava `../dist` (um nível acima do repo) em vez de `dist/`; o build deixava templates antigos em `dist/`.

## [0.7.0] - 2026-09-23

### Added
- `specloop phases [change] [--max-fases N]`: grava `openspec/changes/<change>/phases.md`, uma seção `## Phase N:` por sessão do loop com `<!-- loop: {tipo, arquivos, tarefas} -->` e o sha256 do `tasks.md` de origem. Não gera com ERRO no `tasks check`.

### Changed
- O loop externo se chama `ralph-loop.mjs` e lê o `phases.md` no lugar do `tasks.md`.
### Fixed
- `npm run build` no Windows não copiava `src/templates/` para `dist/` (`URL.pathname` vira `/C:/...`; o erro era engolido) e o `specloop init` quebrava com ENOENT. `clean.mjs` tinha o mesmo defeito.

### Changed (cont.)
- Templates chamam `specloop` direto em vez de `npx specloop` (o pacote não está no npm; `npx` baixaria outro com o mesmo nome).
