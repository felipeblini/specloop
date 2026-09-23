import type { Command } from "commander";
import type { InitOptions } from "../types";
import { ensureOpenSpecScaffold, installToolTemplates } from "../utils/installer";
import { resolveProjectDir } from "../utils/paths";
import { parseToolsArg } from "../utils/tools";
import { ensureRalphyFolders, getRalphyRoot } from "../core/folders";

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Initialize Ralph + OpenSpec workflow files for Claude Code in a project")
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
      await ensureRalphyFolders(options.dir);

      process.stdout.write(
        `Initialized Ralph-OpenSpec in ${options.dir}\nConfigured tools: ${tools.join(", ")}\n`
      );
      process.stdout.write(
        `\nArtifact folder created: ${getRalphyRoot(options.dir)}\n` +
          `\n.gitignore suggestions:\n` +
          `- Commit: ${getRalphyRoot(options.dir)}/STATUS.md, ${getRalphyRoot(options.dir)}/TASKS.md, ${getRalphyRoot(options.dir)}/BUDGET.md\n` +
          `- Ignore: ${getRalphyRoot(options.dir)}/state.db, ${getRalphyRoot(options.dir)}/runs/, ${getRalphyRoot(options.dir)}/logs/, ${getRalphyRoot(options.dir)}/worktrees/\n`
      );
    });
}
