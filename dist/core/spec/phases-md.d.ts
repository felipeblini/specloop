/**
 * phases.md: the contract ralph-loop.mjs reads instead of tasks.md.
 *
 * tasks.md is for people (and for the planner): groups, tasks, cases. The loop needs
 * something else — one block per session, with its kind (teste|impl) and its scope.
 * Deriving that inside the loop meant a second copy of this parser, kept in sync by
 * hand. Here the derivation happens once, in the planner, and the loop reads a strict
 * format with no heuristics:
 *
 *   # Phases: <change>
 *
 *   <!-- specloop: {"fonte":"tasks.md","sha256":"<hex of tasks.md bytes>"} -->
 *
 *   ## Phase 1: <group> — testes
 *   <!-- loop: {"tipo":"teste","arquivos":["tests/x.test.js"],"tarefas":["1.1"]} -->
 *
 *   **Goal**: <group goal>
 *
 *   - [ ] 1.1 <task title>
 *       - CRIA `tests/x.test.js`
 *       - Casos: ...
 *
 * Only `## Phase N:` at level 2. The scope (`arquivos`) is what the tasks DECLARE
 * (CRIA/ALTERA/REMOVE), which `tasks check` already forces to equal what the loop would
 * have extracted from the text. The sha256 lets the loop refuse a phases.md generated
 * from an older tasks.md.
 */
import { type TaskEntry } from "./tasks-md";
export declare const sha256: (bytes: Buffer | string) => string;
export declare function buildPhasesMd(tasks: TaskEntry[], opts: {
    change: string;
    tasksSha256: string;
    hasPackageJson: boolean;
}): {
    text: string;
    count: number;
};
//# sourceMappingURL=phases-md.d.ts.map