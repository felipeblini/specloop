import { Command } from "commander";
import { registerInitCommand } from "./cli/init";
import { registerValidateCommand } from "./cli/validate";
import { registerUpdateCommand } from "./cli/update";
import { registerRunCommand } from "./cli/run";
import { registerStatusCommand } from "./cli/status";
import { registerReportCommand } from "./cli/report";
import { registerTailCommand } from "./cli/tail";
import { registerCheckpointCommand } from "./cli/checkpoint";
import { registerBudgetCommand } from "./cli/budget";
import { registerTasksCommand } from "./cli/tasks";

function buildProgram(): Command {
  const program = new Command();

  program
    .name("ralphy-spec")
    .description(
      "One-command setup for Ralph loop + OpenSpec workflows for Claude Code."
    )
    .version("0.4.0");

  registerInitCommand(program);
  registerValidateCommand(program);
  registerUpdateCommand(program);
  registerRunCommand(program);
  registerStatusCommand(program);
  registerBudgetCommand(program);
  registerReportCommand(program);
  registerTailCommand(program);
  registerCheckpointCommand(program);
  registerTasksCommand(program);

  return program;
}

async function main() {
  const program = buildProgram();
  await program.parseAsync(process.argv);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();

