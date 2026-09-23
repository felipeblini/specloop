# /ralphy-implement (Implement OpenSpec tasks)

You are implementing an OpenSpec change located under `openspec/changes/<change-name>/`.

## Goal
Complete all tasks in `tasks.md` and satisfy the acceptance criteria from the spec scenarios, touching only the files each task declares.

## Ralph loop compatibility
If this command is being executed in an iterative loop:
- Make progress each iteration
- Run tests frequently
- Only declare success when verification passes

## Steps
1. Identify the active change folder under `openspec/changes/`.
2. Read the change artifacts:
   - `proposal.md`
   - `tasks.md`
   - spec deltas under `specs/`
3. Implement tasks in order. For each task:
   - Read its `Files:` list. That list is the contract: create/modify/delete exactly those files — including the HTML, CSS and test files listed — and nothing else.
   - If you discover you need an extra file, FIRST add it to the task's `Files:` (and to the test's `Files:` if it is a test file) with a note explaining why, then make the change. Never touch undeclared files silently.
   - Write the tests listed under `Tests:` in the files they declare, then implement until they pass using each test's `Run:` command.
   - Mark each test `[x]` when it passes, and the task `[x]` only when all its tests pass.
4. After each task, compare `git status --porcelain` against the task's declared files and fix any mismatch (undeclared change, or declared file not touched).
5. If `npx ralphy-spec` is available, run `npx ralphy-spec tasks check <change-name>` after editing `tasks.md`.

## Completion promise
Only output this exact text when ALL tasks are complete and tests pass:

<promise>TASK_COMPLETE</promise>
