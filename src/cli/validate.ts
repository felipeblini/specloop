import type { Command } from "commander";
import { resolveProjectDir } from "../utils/paths";
import { parseToolsArg } from "../utils/tools";
import { validateProject } from "../utils/validator";

export function registerValidateCommand(program: Command): void {
  program
    .command("validate")
    .description("Validate that the specloop setup is complete")
    .option("--dir <path>", "Target project directory (default: current directory)")
    .option("--tools <list>", "Kept for compatibility. Only claude-code is supported.")
    .action(async (opts: { dir?: string; tools?: string }) => {
      const dir = resolveProjectDir(opts.dir);
      const tools = parseToolsArg(opts.tools);
      const issues = await validateProject(dir, tools);

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
