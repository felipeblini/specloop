import type { ToolId } from "../types";
import { SUPPORTED_TOOLS } from "../types";

/**
 * Parses the legacy `--tools` flag. Only `claude-code` is supported in this fork;
 * any other value (e.g. `cursor`, `opencode`) is reported and ignored.
 * Always returns `["claude-code"]`.
 */
export function parseToolsArg(
  arg: string | undefined,
  warn: (msg: string) => void = (m) => process.stderr.write(m)
): ToolId[] {
  if (!arg) return [...SUPPORTED_TOOLS];
  const parts = arg
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const ignored = parts.filter((p) => !(SUPPORTED_TOOLS as readonly string[]).includes(p));
  if (ignored.length) {
    warn(
      `Ignoring unsupported tool(s): ${ignored.join(", ")}. This build supports Claude Code only.\n`
    );
  }
  return [...SUPPORTED_TOOLS];
}
