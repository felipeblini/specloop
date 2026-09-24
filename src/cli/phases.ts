import type { Command } from "commander";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { resolveProjectDir } from "../utils/paths";
import { loadTasks, resolveChange, formatIssue, fail } from "./tasks";
import { buildPhasesMd, sha256 } from "../core/spec/phases-md";

export function registerPhasesCommand(program: Command): void {
  program
    .command("phases [change]")
    .description("Gera openspec/changes/<change>/project-phases.md, o documento que o ralph-loop.mjs executa")
    .option("--dir <path>", "Diretório do projeto (padrão: atual)")
    .option("--max-fases <n>", "Recusa gerar com mais fases que isto")
    .action(async (changeArg: string | undefined, opts: { dir?: string; maxFases?: string }) => {
      try {
        const dir = resolveProjectDir(opts.dir);
        const change = await resolveChange(dir, changeArg);
        const { file, tasks, issues } = await loadTasks(dir, change);
        const rel = path.relative(dir, file);
        for (const i of issues) process.stdout.write(formatIssue(rel, i) + "\n");
        // Com erro, não gera: um project-phases.md de um tasks.md reprovado seria o loop
        // executando um escopo que o check já sabe que está errado.
        if (issues.some((i) => i.level === "error")) {
          process.stdout.write("project-phases.md NÃO gerado: corrija os ERROS do tasks.md.\n");
          process.exitCode = 1;
          return;
        }
        const { text, count } = buildPhasesMd(tasks, {
          change,
          tasksSha256: sha256(await fs.readFile(file)),
          hasPackageJson: existsSync(path.join(dir, "package.json")),
        });
        const max = opts.maxFases ? Number(opts.maxFases) : null;
        if (max && count > max) {
          process.stdout.write(`${count} fases, o limite é ${max}: project-phases.md NÃO gerado. Junte grupos no tasks.md.\n`);
          process.exitCode = 1;
          return;
        }
        const out = path.join(path.dirname(file), "project-phases.md");
        await fs.writeFile(out, text, "utf8");
        process.stdout.write(`${path.relative(dir, out)} — ${count} fase(s)\n`);
      } catch (e) {
        fail(e);
      }
    });
}
