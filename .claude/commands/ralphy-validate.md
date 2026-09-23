# /ralphy-validate (Validate against acceptance criteria)

You are validating an OpenSpec change.

## Goal
Prove that the implementation matches the requirements/scenarios, that tests pass, and that the files changed match the files declared in `tasks.md`.

## Steps
1. Identify the active change folder under `openspec/changes/`.
2. Run `npx ralphy-spec tasks check <change-name>` (if available) and fix format issues in `tasks.md`.
3. Extract acceptance criteria from:
   - spec scenarios in `openspec/changes/<change-name>/specs/**`
   - `Tests:` entries in `tasks.md` (each has `Files`, `Covers`, `Run`, `Assert`)
4. Run every test's `Run:` command, then the full validators (typecheck, test, lint).
5. File audit: compare `git diff --name-status` + untracked files (`git ls-files --others --exclude-standard`) with the union of all `Files:` entries:
   - Changed but undeclared → either revert it or declare it in the right task with a reason.
   - Declared `CREATE`/`MODIFY` but untouched → implement it or remove the entry with a reason.
   - Declared `DELETE` but file still exists → delete it.
6. If failures occur, fix them and re-run until green.

## Output
Report:
- What passed (per test id: T2.1.a …)
- What failed (with next actions)
- File audit result (undeclared / missing / OK)
- Any missing tests needed to satisfy acceptance criteria
