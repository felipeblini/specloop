# OpenSpec Tasks Template

Use this structure for `openspec/changes/<change-name>/tasks.md`.

Every task declares **every file it creates, modifies or deletes** — source code,
markup (HTML, templates, components), styles (CSS/SCSS), config, fixtures,
snapshots and test files. Every test declares **the test file(s) it creates or
modifies** and which source files it covers. Check the result with:

```bash
ralphy-spec tasks check <change-name>
```

## File entry syntax

```
- CREATE `path/from/repo/root.ext` — optional note
- MODIFY `path/from/repo/root.ext` — what changes
- DELETE `path/from/repo/root.ext` — why
```

- Concrete, repo-relative paths only. No globs (`src/**`), no "etc.".
- `CREATE` only for files that do not exist yet; the first task that creates a file owns the CREATE, later tasks use `MODIFY`.
- A test file listed under a test's `Files:` MUST also be listed in its task's `Files:`.
- Nothing to declare? Write `Files: NONE (reason)` or `Tests: NONE (reason)`.

## Example

```markdown
# Tasks: add-prize-card

## 1. Planning
- [ ] 1.1 Confirm scope and impacted files
  - Files: NONE (read-only review)
  - Acceptance criteria:
    - GIVEN the current `openspec/specs/` baseline
    - WHEN this change is implemented
    - THEN only the files declared below are touched
  - Tests: NONE (no code change)

## 2. Implementation
- [ ] 2.1 Render the prize card on the home screen
  - Files:
    - CREATE `src/components/PrizeCard.vue`
    - CREATE `src/styles/prize-card.css`
    - MODIFY `src/views/HomeView.vue` — render <PrizeCard> in the prize list
    - MODIFY `index.html` — preload the display font used by the card
    - CREATE `tests/unit/PrizeCard.test.ts`
    - CREATE `tests/e2e/home-prize.spec.ts`
  - Implementation notes:
    - Styles live in the new CSS file; do not add inline styles
  - Acceptance criteria:
    - GIVEN a prize with name and image
    - WHEN the home screen renders
    - THEN the card shows the image and the name
  - Tests:
    - [ ] T2.1.a renders the prize name and image
      - Files:
        - CREATE `tests/unit/PrizeCard.test.ts`
      - Covers: `src/components/PrizeCard.vue`
      - Run: `npm test -- PrizeCard`
      - Assert: name text and `<img src>` match the props
    - [ ] T2.1.b selected card gets the highlight style
      - Files:
        - CREATE `tests/e2e/home-prize.spec.ts`
      - Covers: `src/views/HomeView.vue`, `src/styles/prize-card.css`
      - Run: `npx playwright test home-prize`
      - Assert: clicking a card adds `.is-selected` and the check badge is visible

## 3. Validation
- [ ] 3.1 Full validator pass
  - Files: NONE (verification only)
  - Tests:
    - [ ] T3.1.a typecheck, unit and e2e suites are green
      - Files: NONE (runs existing suites)
      - Run: `npm run typecheck && npm test`
      - Assert: exit code 0
```
