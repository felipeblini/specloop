import type { Command } from "commander";
import type { InitOptions } from "../types";
import { ensureOpenSpecScaffold, installToolTemplates } from "../utils/installer";
import { resolveProjectDir } from "../utils/paths";
import { parseToolsArg } from "../utils/tools";

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Initialize OpenSpec + Claude Code commands + CLAUDE.md in a project")
    .option("--dir <path>", "Target project directory (default: current directory)")
    .option("--tools <list>", "Kept for compatibility. Only claude-code is supported.")
    .option("--force", "Overwrite existing files", false)
    .action(async (opts: { dir?: string; tools?: string; force: boolean }) => {
      const options: InitOptions = {
        dir: resolveProjectDir(opts.dir),
        tools: parseToolsArg(opts.tools),
        force: opts.force,
      };
      const tools = options.tools ?? ["claude-code"];

      await ensureOpenSpecScaffold(options.dir);
      await installToolTemplates(options.dir, tools, { force: options.force });

      process.stdout.write(
        `specloop initialized in ${options.dir}\n` +
          `Commands: /specloop-plan, /specloop-validate, /specloop-archive (.claude/commands/)\n` +
          `CLAUDE.md: fill the "## Comandos" block if it is empty (judge.mjs runs those commands)\n`
      );
    });
}
