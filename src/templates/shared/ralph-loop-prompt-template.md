# Ralph Loop Prompt Template (OpenSpec task runner)

Use this template when running an AI agent in a loop (Ralph methodology). The same prompt may be repeated until the completion promise is printed.

## Context
You are implementing OpenSpec change: `{{change_name}}`

## Current Task
{{current_task_from_tasks_md}}

## Files (contract for this task)
{{files_from_current_task}}

## Acceptance Criteria
{{acceptance_criteria}}

## Instructions
1. Read the spec at `openspec/changes/{{change_name}}/` and the baseline specs in `openspec/specs/`.
2. Implement the current task touching ONLY the files listed above (including HTML, CSS and test files). If another file is required, declare it in `tasks.md` first.
3. Write the tests listed under the task's `Tests:` in the files they declare and run each `Run:` command.
4. If tests pass, mark the tests and the task `[x]` and output `<promise>TASK_COMPLETE</promise>`.
5. If tests fail, fix issues and continue iterating.

## Important
- Do NOT output the promise until tests pass.
- Prefer small, incremental changes.
- Keep tests aligned with OpenSpec scenarios.
