/**
 * Parser + linter for `openspec/changes/<change>/tasks.md`, shaped for the external
 * loop (ralph-loop.mjs + judge.mjs). The loop reads tasks.md like this:
 *
 *   - groups are `## N. Title` (also `## Phase N:`, `## Fase N:`, `## Etapa N —`);
 *     tasks under any other `##` heading are silently ignored
 *   - a task is `- [ ] N.M text`; its continuation lines need 4+ spaces of indent
 *     (lines with 1–3 spaces are dropped)
 *   - the phase scope is every path the task text cites (backticked or bare)
 *   - a task whose FIRST cited file is a test is a test task; consecutive tasks of
 *     the same kind form one phase, so tests must come before implementation
 *   - test files are locked by hash once their phase closes: never modify them later
 *
 * Format (Portuguese keywords; CREATE/MODIFY/DELETE are accepted too):
 *
 *   ## 1. Card do brinde
 *
 *   **Goal**: mostrar os brindes cadastrados na home
 *
 *   - [ ] 1.1 Testes do card do brinde
 *       - CRIA `tests/unit/prize-card.test.ts`
 *       - Casos:
 *           - mostra o nome recebido ("Caneca" → texto "Caneca")
 *       - Import: `import PrizeCard from '../../src/components/PrizeCard.vue'`
 *       - Run: `npx vitest run tests/unit/prize-card.test.ts`
 *   - [ ] 1.2 Componente do card
 *       - CRIA `src/components/PrizeCard.vue`
 *       - CRIA `src/styles/prize-card.css`
 *       - ALTERA `index.html` — preload da fonte
 *       - Fica verde: 1.1
 */
export type FileAction = "CRIA" | "ALTERA" | "REMOVE";
export type FileEntry = {
    action: FileAction;
    path: string;
    note?: string;
    line: number;
};
export type TaskKind = "teste" | "impl";
export type TaskEntry = {
    id: string;
    title: string;
    done: boolean;
    line: number;
    group: {
        n: number;
        title: string;
        line: number;
        goal?: string;
    };
    kind: TaskKind;
    files: FileEntry[];
    /** Paths the loop will extract from this task's text (its phase scope). */
    loopScope: string[];
    greens: string[];
    cases: string[];
    run?: string;
    text: string;
    /** The task as written: its `- [ ]` line and the indented detail lines. */
    raw: string[];
};
export type TasksIssue = {
    level: "error" | "warning";
    line: number;
    taskId?: string;
    message: string;
};
/** Same extraction as ralph-loop.mjs `caminhos()`: what the loop treats as phase scope. */
export declare function loopPaths(texto: string): string[];
export declare const isTestFile: (p: string) => boolean;
export declare function parseTasksMd(text: string): {
    tasks: TaskEntry[];
    issues: TasksIssue[];
};
/**
 * Lints tasks.md against what the loop and the judge will do with it.
 * `fileExists` lets it check CRIA/ALTERA against the repo.
 */
export declare function lintTasksMd(text: string, opts?: {
    fileExists?: (repoRelativePath: string) => boolean;
}): {
    tasks: TaskEntry[];
    issues: TasksIssue[];
};
export type FileMapRow = {
    path: string;
    touches: Array<{
        taskId: string;
        action: FileAction;
        kind: TaskKind;
    }>;
};
/** Reverse index: which tasks touch each file, in document order. */
export declare function buildFileMap(tasks: TaskEntry[]): FileMapRow[];
/** The phases the loop will run: consecutive tasks of the same kind inside a group. */
export declare function loopPhases(tasks: TaskEntry[]): Array<{
    group: string;
    kind: TaskKind;
    taskIds: string[];
    scope: string[];
}>;
//# sourceMappingURL=tasks-md.d.ts.map