import type { Command } from "commander";
import { type TasksIssue } from "../core/spec/tasks-md";
export declare function resolveChange(dir: string, change?: string): Promise<string>;
export declare function loadTasks(dir: string, change: string): Promise<{
    tasks: import("../core/spec/tasks-md").TaskEntry[];
    issues: TasksIssue[];
    file: string;
}>;
export declare function formatIssue(rel: string, i: TasksIssue): string;
export declare function fail(e: any): void;
export declare function registerTasksCommand(program: Command): void;
//# sourceMappingURL=tasks.d.ts.map