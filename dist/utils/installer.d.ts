import type { ToolId } from "../types";
export declare const LEGACY_COMMANDS: string[];
/** Verification commands from package.json scripts, in the order the judge runs them. */
export declare function detectVerificationCommands(projectDir: string): Promise<string[]>;
export declare function buildClaudeMd(projectDir: string): Promise<string>;
export declare function ensureOpenSpecScaffold(projectDir: string): Promise<void>;
export declare function installToolTemplates(projectDir: string, tools: ToolId[], opts: {
    force: boolean;
}): Promise<void>;
//# sourceMappingURL=installer.d.ts.map