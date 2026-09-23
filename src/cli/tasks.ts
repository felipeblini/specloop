import type { Command } from "commander";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { resolveProjectDir } from "../utils/paths";
import { buildFileMap, lintTasksMd, loopPhases, type TasksIssue } from "../core/spec/tasks-md";

async function resolveChange(dir: string, change?: string): Promise<string> {
  if (change) return change;
  const changesDir = path.join(dir, "openspec", "changes");
  let names: string[] = [];
  try {
    const entries = await fs.readdir(changesDir, { withFileTypes: true });
    names = entries
      .filter((e) => e.isDirectory() && e.name !== "archive" && existsSync(path.join(changesDir, e.name, "tasks.md")))
      .map((e) => e.name);
  } catch {
    // fallthrough
  }
  if (names.length === 1) return names[0];
  if (!names.length) throw new Error(`Nenhuma change com tasks.md em ${changesDir}`);
  throw new Error(`Mais de uma change (${names.join(", ")}). Informe o nome.`);
}

async function loadTasks(dir: string, change: string) {
  const file = path.join(dir, "openspec", "changes", change, "tasks.md");
  let text: string;
  try {
    text = await fs.readFile(file, "utf8");
  } catch {
    throw new Error(`Faltando ${path.relative(dir, file)}`);
  }
  const result = lintTasksMd(text, { fileExists: (p) => existsSync(path.join(dir, p)) });
  return { file, ...result };
}

function formatIssue(rel: string, i: TasksIssue): string {
  return `${i.level === "error" ? "ERRO" : "AVISO"} ${rel}:${i.line}${i.taskId ? ` (tarefa ${i.taskId})` : ""}: ${i.message}`;
}

function fail(e: any) {
  process.stderr.write((e?.message ? String(e.message) : String(e)) + "\n");
  process.exitCode = 4;
}

export function registerTasksCommand(program: Command): void {
  const tasks = program
    .command("tasks")
    .description("Confere e mostra o tasks.md de uma change (arquivos por tarefa, fases do loop)");

  tasks
    .command("check [change]")
    .description("Valida o tasks.md contra o que o loop.mjs e o judge.mjs vão fazer com ele")
    .option("--dir <path>", "Diretório do projeto (padrão: atual)")
    .option("--strict", "Avisos também reprovam", false)
    .option("--json", "Saída em JSON", false)
    .action(async (changeArg: string | undefined, opts: { dir?: string; strict: boolean; json: boolean }) => {
      try {
        const dir = resolveProjectDir(opts.dir);
        const change = await resolveChange(dir, changeArg);
        const { file, tasks: parsed, issues } = await loadTasks(dir, change);
        const errors = issues.filter((i) => i.level === "error" || (opts.strict && i.level === "warning"));
        if (opts.json) {
          process.stdout.write(JSON.stringify({ ok: !errors.length, change, taskCount: parsed.length, phases: loopPhases(parsed), issues }, null, 2) + "\n");
        } else {
          const rel = path.relative(dir, file);
          for (const i of issues) process.stdout.write(formatIssue(rel, i) + "\n");
          const n = loopPhases(parsed).length;
          if (!issues.length) process.stdout.write(`OK: ${rel} — ${parsed.length} tarefa(s), ${n} fase(s) no loop.\n`);
          else if (!errors.length) process.stdout.write(`OK com avisos: ${rel} — ${n} fase(s) no loop.\n`);
        }
        process.exitCode = errors.length ? 1 : 0;
      } catch (e) {
        fail(e);
      }
    });

  tasks
    .command("files [change]")
    .description("Mostra os arquivos de cada tarefa (ou --by-file, ou --fases como o loop vai rodar)")
    .option("--dir <path>", "Diretório do projeto (padrão: atual)")
    .option("--by-file", "Agrupar por arquivo", false)
    .option("--fases", "Mostrar as fases do loop (tipo, tarefas, escopo)", false)
    .option("--json", "Saída em JSON", false)
    .action(async (changeArg: string | undefined, opts: { dir?: string; byFile: boolean; fases: boolean; json: boolean }) => {
      try {
        const dir = resolveProjectDir(opts.dir);
        const change = await resolveChange(dir, changeArg);
        const { tasks: parsed } = await loadTasks(dir, change);
        if (opts.json) {
          process.stdout.write(JSON.stringify({ change, tasks: parsed, files: buildFileMap(parsed), phases: loopPhases(parsed) }, null, 2) + "\n");
          return;
        }
        const lines: string[] = [];
        if (opts.fases) {
          loopPhases(parsed).forEach((f, i) => {
            lines.push(`${String(i + 1).padStart(2)}. [${f.kind}] ${f.group} — tarefas ${f.taskIds.join(", ")}`);
            lines.push(`    escopo: ${f.scope.join(", ") || "(nenhum)"}`);
          });
        } else if (opts.byFile) {
          for (const row of buildFileMap(parsed)) {
            lines.push(row.path);
            for (const t of row.touches) lines.push(`  ${t.action.padEnd(6)} tarefa ${t.taskId} [${t.kind}]`);
          }
        } else {
          for (const t of parsed) {
            lines.push(`${t.done ? "[x]" : "[ ]"} ${t.id} [${t.kind}] ${t.title}`);
            for (const f of t.files) lines.push(`    ${f.action.padEnd(6)} ${f.path}`);
            if (t.greens.length) lines.push(`    fica verde: ${t.greens.join(", ")}`);
          }
        }
        process.stdout.write(lines.join("\n") + "\n");
      } catch (e) {
        fail(e);
      }
    });
}
