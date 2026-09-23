/**
 * This fork targets Claude Code only. `ToolId` is kept as a type so the
 * `--tools` flag stays backwards compatible with upstream scripts.
 */
export type ToolId = "claude-code";

export const SUPPORTED_TOOLS: readonly ToolId[] = ["claude-code"] as const;

export type InitOptions = {
  dir: string;
  tools?: ToolId[];
  force: boolean;
};

export type ValidationIssue = {
  level: "error" | "warning";
  message: string;
  path?: string;
};
