"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseToolsArg = parseToolsArg;
const types_1 = require("../types");
/**
 * Parses the legacy `--tools` flag. Only `claude-code` is supported in this fork;
 * any other value (e.g. `cursor`, `opencode`) is reported and ignored.
 * Always returns `["claude-code"]`.
 */
function parseToolsArg(arg, warn = (m) => process.stderr.write(m)) {
    if (!arg)
        return [...types_1.SUPPORTED_TOOLS];
    const parts = arg
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    const ignored = parts.filter((p) => !types_1.SUPPORTED_TOOLS.includes(p));
    if (ignored.length) {
        warn(`Ignoring unsupported tool(s): ${ignored.join(", ")}. This build supports Claude Code only.\n`);
    }
    return [...types_1.SUPPORTED_TOOLS];
}
//# sourceMappingURL=tools.js.map