import type { Command } from "commander";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { resolveProjectDir } from "../utils/paths";
import { buildFileMap, lintTasksMd, type TasksIssue } from "../core/spec/tasks-md";
import { mergeIntoProjectYml, toEngineTasks } from "../core/spec/tasks-sync";

async function resolveChange(dir: string, change?: string): Promise<string> {
  if (change) return change;
  const changesDir = path.join(dir, "openspec", "changes");
  let names: string[] = [];
  try {
    const entries = await fs.readdir(changesDir, { withFileTypes: true });
    names = entries
      .filter((e) => e.isDirectory() && existsSync(path.join(changesDir, e.name, "tasks.md")))
      .map((e) => e.name);
  } catch {
    // fallthrough
  }
  if (names.length === 1) return names[0];
  if (!names.length) throw new Error(`No change with tasks.md found under ${changesDir}`);
  throw new Error(`Multiple changes found (${names.join(", ")}). Pass the change name.`);
}

async function loadTasks(dir: string, change: string) {
  const file = path.join(dir, "openspec", "changes", change, "tasks.md");
  let text: string;
  try {
    text = await fs.readFile(file, "utf8");
  } catch {
    throw new Error(`Missing ${path.relative(dir, file)}`);
  }
  const result = lintTasksMd(text, { fileExists: (p) => existsSync(path.join(dir, p)) });
  return { file, ...result };
}

function formatIssue(rel: string, i: TasksIssue): string {
  const where = [i.taskId && `task ${i.taskId}`, i.testId && `test ${i.testId}`].filter(Boolean).join(", ");
  return `${i.level === "error" ? "ERROR" : "WARN"} ${rel}:${i.line}${where ? ` (${where})` : ""}: ${i.message}`;
}

function fail(e: any) {
  process.stderr.write((e?.message ? String(e.message) : String(e)) + "\n");
  process.exitCode = 4;
}

export function registerTasksCommand(program: Command): void {
  const tasks = program
    .command("tasks")
    .description("Check, inspect and sync an OpenSpec change's tasks.md (files per task and per test)");

  tasks
    .command("check [change]")
    .description("Lint tasks.md: every task and every test must declare the files it creates/modifies")
    .option("--dir <path>", "Project directory (default: current directory)")
    .option("--strict", "Treat warnings as errors", false)
    .option("--json", "Machine-readable output", false)
    .action(async (changeArg: string | undefined, opts: { dir?: string; strict: boolean; json: boolean }) => {
      try {
        const dir = resolveProjectDir(opts.dir);
        const change = await resolveChange(dir, changeArg);
        const { file, tasks: parsed, issues } = await loadTasks(dir, change);
        const errors = issues.filter((i) => i.level === "error" || (opts.strict && i.level === "warning"));
        if (opts.json) {
          process.stdout.write(JSON.stringify({ ok: !errors.length, change, taskCount: parsed.length, issues }, null, 2) + "\n");
        } else {
          const rel = path.relative(dir, file);
          for (const i of issues) process.stdout.write(formatIssue(rel, i) + "\n");
          if (!issues.length) process.stdout.write(`OK: ${rel} — ${parsed.length} task(s), all files declared.\n`);
          else if (!errors.length) process.stdout.write(`OK with warnings: ${rel}\n`);
        }
        process.exitCode = errors.length ? 1 : 0;
      } catch (e) {
        fail(e);
      }
    });

  tasks
    .command("files [change]")
    .description("Show which files each task and test creates/modifies/deletes")
    .option("--dir <path>", "Project directory (default: current directory)")
    .option("--by-file", "Group by file instead of by task", false)
    .option("--json", "Machine-readable output", false)
    .action(async (changeArg: string | undefined, opts: { dir?: string; byFile: boolean; json: boolean }) => {
      try {
        const dir = resolveProjectDir(opts.dir);
        const change = await resolveChange(dir, changeArg);
        const { tasks: parsed } = await loadTasks(dir, change);
        const map = buildFileMap(parsed);
        if (opts.json) {
          process.stdout.write(JSON.stringify({ change, tasks: parsed, files: map }, null, 2) + "\n");
          return;
        }
        const lines: string[] = [];
        if (opts.byFile) {
          for (const row of map) {
            lines.push(row.path);
            for (const t of row.touches) {
              lines.push(`  ${t.action.padEnd(6)} task ${t.taskId}${t.testIds.length ? ` (tests: ${t.testIds.join(", ")})` : ""}`);
            }
          }
        } else {
          for (const t of parsed) {
            lines.push(`${t.done ? "[x]" : "[ ]"} ${t.id} ${t.title}`);
            if (t.files?.kind === "none") lines.push(`    files: NONE${t.files.reason ? ` (${t.files.reason})` : ""}`);
            else for (const e of t.files?.entries ?? []) lines.push(`    ${e.action.padEnd(6)} ${e.path}`);
            if (t.tests?.kind === "list") {
              for (const x of t.tests.items) {
                const f = x.files?.kind === "list" ? x.files.entries.map((e) => `${e.action} ${e.path}`).join(", ") : "NONE";
                lines.push(`    test ${x.id}: ${f}`);
              }
            }
          }
        }
        process.stdout.write(lines.join("\n") + "\n");
      } catch (e) {
        fail(e);
      }
    });

  tasks
    .command("sync [change]")
    .description("Write pending tasks into openspec/project.yml with files_contract = declared files")
    .option("--dir <path>", "Project directory (default: current directory)")
    .option("--dry-run", "Print the resulting project.yml instead of writing it", false)
    .action(async (changeArg: string | undefined, opts: { dir?: string; dryRun: boolean }) => {
      try {
        const dir = resolveProjectDir(opts.dir);
        const change = await resolveChange(dir, changeArg);
        const { file, tasks: parsed, issues } = await loadTasks(dir, change);
        const errors = issues.filter((i) => i.level === "error");
        if (errors.length) {
          const rel = path.relative(dir, file);
          for (const i of errors) process.stderr.write(formatIssue(rel, i) + "\n");
          process.stderr.write(`Refusing to sync: fix tasks.md first (ralphy-spec tasks check ${change}).\n`);
          process.exitCode = 1;
          return;
        }
        const ymlPath = path.join(dir, "openspec", "project.yml");
        const current = await fs.readFile(ymlPath, "utf8");
        const synced = toEngineTasks(change, parsed);
        const merged = mergeIntoProjectYml(current, change, synced);
        if (opts.dryRun) {
          process.stdout.write(merged.text);
          return;
        }
        await fs.writeFile(ymlPath, merged.text, "utf8");
        process.stdout.write(
          `Synced ${merged.added} task(s) from ${change} into openspec/project.yml (replaced ${merged.removed}).\n` +
            `Next: ralphy-spec run --dry-run\n`
        );
      } catch (e) {
        fail(e);
      }
    });
}
