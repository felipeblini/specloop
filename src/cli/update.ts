import type { Command } from "commander";
import { installToolTemplates } from "../utils/installer";
import { resolveProjectDir } from "../utils/paths";
import { parseToolsArg } from "../utils/tools";

export function registerUpdateCommand(program: Command): void {
  program
    .command("update")
    .description("Update the specloop Claude Code commands in a project (removes legacy ralphy-*.md)")
    .option("--dir <path>", "Target project directory (default: current directory)")
    .option("--tools <list>", "Kept for compatibility. Only claude-code is supported.")
    .option("--force", "Overwrite existing files", false)
    .action(async (opts: { dir?: string; tools?: string; force: boolean }) => {
      const dir = resolveProjectDir(opts.dir);
      const tools = parseToolsArg(opts.tools);
      await installToolTemplates(dir, tools, { force: opts.force });

      process.stdout.write(`Updated templates in ${dir}\nUpdated tools: ${tools.join(", ")}\n`);
    });
}
