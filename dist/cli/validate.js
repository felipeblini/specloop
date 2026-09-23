"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerValidateCommand = registerValidateCommand;
const paths_1 = require("../utils/paths");
const tools_1 = require("../utils/tools");
const validator_1 = require("../utils/validator");
function registerValidateCommand(program) {
    program
        .command("validate")
        .description("Validate that the specloop setup is complete")
        .option("--dir <path>", "Target project directory (default: current directory)")
        .option("--tools <list>", "Kept for compatibility. Only claude-code is supported.")
        .action(async (opts) => {
        const dir = (0, paths_1.resolveProjectDir)(opts.dir);
        const tools = (0, tools_1.parseToolsArg)(opts.tools);
        const issues = await (0, validator_1.validateProject)(dir, tools);
        if (!issues.length) {
            process.stdout.write("OK: specloop setup looks good.\n");
            return;
        }
        for (const issue of issues) {
            const prefix = issue.level === "error" ? "ERROR" : "WARN";
            process.stdout.write(`${prefix}: ${issue.message}${issue.path ? ` (${issue.path})` : ""}\n`);
        }
        process.exitCode = issues.some((i) => i.level === "error") ? 1 : 0;
    });
}
//# sourceMappingURL=validate.js.map