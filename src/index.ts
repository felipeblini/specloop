import { Command } from "commander";
import { registerInitCommand } from "./cli/init";
import { registerValidateCommand } from "./cli/validate";
import { registerUpdateCommand } from "./cli/update";
import { registerTasksCommand } from "./cli/tasks";
import { registerPhasesCommand } from "./cli/phases";

function buildProgram(): Command {
  const program = new Command();

  program
    .name("specloop")
    .description(
      "OpenSpec planning for Claude Code, with project-phases.md ready for the external loop (ralph-loop.mjs + judge.mjs)."
    )
    .version("0.8.0");

  registerInitCommand(program);
  registerUpdateCommand(program);
  registerValidateCommand(program);
  registerTasksCommand(program);
  registerPhasesCommand(program);

  return program;
}

async function main() {
  const program = buildProgram();
  await program.parseAsync(process.argv);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
