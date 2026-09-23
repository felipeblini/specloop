# /ralphy-plan (PRD -> OpenSpec change)

You are an AI coding assistant. Convert the user's PRD/requirements into an OpenSpec change proposal with clear, testable acceptance criteria and a `tasks.md` in which **every task and every test declares exactly which files it creates, modifies or deletes**.

## Deliverables (create/modify files)
Create a new change folder:
- `openspec/changes/<change-name>/proposal.md`
- `openspec/changes/<change-name>/tasks.md`
- `openspec/changes/<change-name>/specs/<domain>/spec.md` (and others as needed)

Do NOT write product code in this command. Planning only.

## Rules
- Use MUST/SHALL language for requirements.
- Every `### Requirement:` MUST include at least one `#### Scenario:`.
- Include acceptance criteria that can be validated by tests or deterministic commands.
- Keep scope explicit; list non-goals.
- Before writing `tasks.md`, inspect the repository (directory tree, existing components, styles, test folders, test runner config) so file paths are real and follow existing conventions.

## tasks.md format (mandatory)

Each task is a numbered checkbox with these sub-bullets, in this order:

```markdown
- [ ] 2.1 <short task title>
  - Files:
    - CREATE `src/path/NewThing.ts`
    - MODIFY `src/path/existing.ts` — <what changes>
    - CREATE `src/styles/new-thing.css`
    - MODIFY `index.html` — <what changes>
    - CREATE `tests/unit/new-thing.test.ts`
  - Implementation notes:
    - <optional>
  - Acceptance criteria:
    - GIVEN ... WHEN ... THEN ...
  - Tests:
    - [ ] T2.1.a <what this test proves>
      - Files:
        - CREATE `tests/unit/new-thing.test.ts`
      - Covers: `src/path/NewThing.ts`
      - Run: `<exact command>`
      - Assert: <what must be true>
```

### Files rules
1. List EVERY file the task will touch, one per line, with `CREATE`, `MODIFY` or `DELETE` and a backticked repo-relative path. This explicitly includes:
   - markup: `.html`, templates, `.vue`/`.jsx`/`.tsx`/`.svelte` components, email templates
   - styles: `.css`, `.scss`, `.less`, tailwind/theme config, design tokens
   - scripts and modules, types, config (`package.json`, `vite.config.*`, `.env.example`, etc.)
   - assets, fixtures, mocks, snapshots
   - unit, integration and e2e test files and test helpers
2. Concrete paths only: no globs, no "and related files", no "etc.". If you do not know a path yet, decide it now following repo conventions.
3. `CREATE` is only for files that do not exist yet. If an earlier task creates a file, later tasks use `MODIFY`. Never `MODIFY` a file that does not exist and is not created by an earlier task.
4. Add a short note after `MODIFY`/`DELETE` saying what changes.
5. Tasks without file changes (analysis, pure verification) use `- Files: NONE (<reason>)`.

### Tests rules
1. Every task has a `Tests:` section. Each test is a checkbox `T<task>.<letter>` (e.g. `T2.1.a`).
2. Each test lists its own `Files:` — the test file(s) it creates or modifies (and fixtures/snapshots it needs). Those paths MUST also appear in the task's `Files:`.
3. `Covers:` lists the source/markup/style files the test exercises.
4. `Run:` is the exact command to run just this test (or the smallest suite containing it). `Assert:` is the observable pass condition.
5. Tests that only run existing suites use `- Files: NONE (<reason>)`. Tasks with nothing to test use `- Tests: NONE (<reason>)`.
6. Prefer one test file per behavior area; do not hide multiple unrelated behaviors in one file.

## Procedure
1. Read `openspec/project.md` and relevant specs under `openspec/specs/`.
2. Explore the repo to learn real paths and conventions (where components, styles and tests live; test runner and commands).
3. Propose a kebab-case change name (e.g. `add-profile-filters`).
4. Create `proposal.md` explaining why/what and the constraints. Include an **Impacted files** section with the full list of files the change will create/modify/delete.
5. Write spec deltas under `specs/` using:
   - `## ADDED Requirements`
   - `## MODIFIED Requirements`
   - `## REMOVED Requirements`
6. Write `tasks.md` following the mandatory format above. Keep tasks small (one behavior slice each).
7. Run `npx ralphy-spec tasks check <change-name>` and fix every ERROR and WARN until it passes. If the CLI is unavailable, re-check the rules manually.

## Output
Summarize created files, print the file map (`npx ralphy-spec tasks files <change-name> --by-file`), and tell the user what to run next (typically `/ralphy-implement <change-name>`).
