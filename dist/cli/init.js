"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerInitCommand = registerInitCommand;
const installer_1 = require("../utils/installer");
const paths_1 = require("../utils/paths");
const tools_1 = require("../utils/tools");
function registerInitCommand(program) {
    program
        .command("init")
        .description("Initialize OpenSpec + Claude Code commands + CLAUDE.md in a project")
        .option("--dir <path>", "Target project directory (default: current directory)")
        .option("--tools <list>", "Kept for compatibility. Only claude-code is supported.")
        .option("--force", "Overwrite existing files", false)
        .action(async (opts) => {
        const options = {
            dir: (0, paths_1.resolveProjectDir)(opts.dir),
            tools: (0, tools_1.parseToolsArg)(opts.tools),
            force: opts.force,
        };
        const tools = options.tools ?? ["claude-code"];
        await (0, installer_1.ensureOpenSpecScaffold)(options.dir);
        await (0, installer_1.installToolTemplates)(options.dir, tools, { force: options.force });
        process.stdout.write(`specloop initialized in ${options.dir}\n` +
            `Commands: /specloop-plan, /specloop-validate, /specloop-archive (.claude/commands/)\n` +
            `CLAUDE.md: fill the "## Comandos" block if it is empty (judge.mjs runs those commands)\n`);
    });
}
//# sourceMappingURL=init.js.map