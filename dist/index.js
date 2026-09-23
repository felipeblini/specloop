"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const init_1 = require("./cli/init");
const validate_1 = require("./cli/validate");
const update_1 = require("./cli/update");
const tasks_1 = require("./cli/tasks");
const phases_1 = require("./cli/phases");
function buildProgram() {
    const program = new commander_1.Command();
    program
        .name("specloop")
        .description("OpenSpec planning for Claude Code, with phases.md ready for the external loop (ralph-loop.mjs + judge.mjs).")
        .version("0.7.0");
    (0, init_1.registerInitCommand)(program);
    (0, update_1.registerUpdateCommand)(program);
    (0, validate_1.registerValidateCommand)(program);
    (0, tasks_1.registerTasksCommand)(program);
    (0, phases_1.registerPhasesCommand)(program);
    return program;
}
async function main() {
    const program = buildProgram();
    await program.parseAsync(process.argv);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
//# sourceMappingURL=index.js.map