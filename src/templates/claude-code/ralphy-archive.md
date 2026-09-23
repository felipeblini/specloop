# /ralphy-archive (Archive completed change)

You are archiving a completed OpenSpec change.

## Preconditions
- All tasks and tests in `tasks.md` are checked `[x]`
- Tests are green
- Files changed match the files declared in `tasks.md` (run `/ralphy-validate` first)
- Spec deltas reflect final behavior

## Steps
1. Run tests to confirm green.
2. If OpenSpec CLI is available, archive via:
   - `openspec archive <change-name> --yes`
3. Otherwise, move the change folder from:
   - `openspec/changes/<change-name>/`
   to:
   - `openspec/archive/<change-name>/`
4. Confirm `openspec/specs/` is updated appropriately.
5. If `openspec/project.yml` has tasks with ids starting `<change-name>--`, remove them.

## Output
Provide a short summary, the final file list (`npx ralphy-spec tasks files <change-name> --by-file`), and a test plan.
