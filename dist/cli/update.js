"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUpdateCommand = registerUpdateCommand;
const installer_1 = require("../utils/installer");
const paths_1 = require("../utils/paths");
const tools_1 = require("../utils/tools");
function registerUpdateCommand(program) {
    program
        .command("update")
        .description("Update the specloop Claude Code commands in a project (removes legacy ralphy-*.md)")
        .option("--dir <path>", "Target project directory (default: current directory)")
        .option("--tools <list>", "Kept for compatibility. Only claude-code is supported.")
        .option("--force", "Overwrite existing files", false)
        .action(async (opts) => {
        const dir = (0, paths_1.resolveProjectDir)(opts.dir);
        const tools = (0, tools_1.parseToolsArg)(opts.tools);
        await (0, installer_1.installToolTemplates)(dir, tools, { force: opts.force });
        process.stdout.write(`Updated templates in ${dir}\nUpdated tools: ${tools.join(", ")}\n`);
    });
}
//# sourceMappingURL=update.js.map