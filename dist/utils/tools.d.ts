import type { ToolId } from "../types";
/**
 * Parses the legacy `--tools` flag. Only `claude-code` is supported in this fork;
 * any other value (e.g. `cursor`, `opencode`) is reported and ignored.
 * Always returns `["claude-code"]`.
 */
export declare function parseToolsArg(arg: string | undefined, warn?: (msg: string) => void): ToolId[];
//# sourceMappingURL=tools.d.ts.map