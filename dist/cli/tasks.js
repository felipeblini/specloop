"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveChange = resolveChange;
exports.loadTasks = loadTasks;
exports.formatIssue = formatIssue;
exports.fail = fail;
exports.registerTasksCommand = registerTasksCommand;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const paths_1 = require("../utils/paths");
const tasks_md_1 = require("../core/spec/tasks-md");
async function resolveChange(dir, change) {
    if (change)
        return change;
    const changesDir = node_path_1.default.join(dir, "openspec", "changes");
    let names = [];
    try {
        const entries = await promises_1.default.readdir(changesDir, { withFileTypes: true });
        names = entries
            .filter((e) => e.isDirectory() && e.name !== "archive" && (0, node_fs_1.existsSync)(node_path_1.default.join(changesDir, e.name, "tasks.md")))
            .map((e) => e.name);
    }
    catch {
        // fallthrough
    }
    if (names.length === 1)
        return names[0];
    if (!names.length)
        throw new Error(`Nenhuma change com tasks.md em ${changesDir}`);
    throw new Error(`Mais de uma change (${names.join(", ")}). Informe o nome.`);
}
async function loadTasks(dir, change) {
    const file = node_path_1.default.join(dir, "openspec", "changes", change, "tasks.md");
    let text;
    try {
        text = await promises_1.default.readFile(file, "utf8");
    }
    catch {
        throw new Error(`Faltando ${node_path_1.default.relative(dir, file)}`);
    }
    const result = (0, tasks_md_1.lintTasksMd)(text, { fileExists: (p) => (0, node_fs_1.existsSync)(node_path_1.default.join(dir, p)) });
    return { file, ...result };
}
function formatIssue(rel, i) {
    return `${i.level === "error" ? "ERRO" : "AVISO"} ${rel}:${i.line}${i.taskId ? ` (tarefa ${i.taskId})` : ""}: ${i.message}`;
}
function fail(e) {
    process.stderr.write((e?.message ? String(e.message) : String(e)) + "\n");
    process.exitCode = 4;
}
function registerTasksCommand(program) {
    const tasks = program
        .command("tasks")
        .description("Confere e mostra o tasks.md de uma change (arquivos por tarefa, fases do loop)");
    tasks
        .command("check [change]")
        .description("Valida o tasks.md contra o que o ralph-loop.mjs e o judge.mjs vão fazer com ele")
        .option("--dir <path>", "Diretório do projeto (padrão: atual)")
        .option("--strict", "Avisos também reprovam", false)
        .option("--json", "Saída em JSON", false)
        .action(async (changeArg, opts) => {
        try {
            const dir = (0, paths_1.resolveProjectDir)(opts.dir);
            const change = await resolveChange(dir, changeArg);
            const { file, tasks: parsed, issues } = await loadTasks(dir, change);
            const errors = issues.filter((i) => i.level === "error" || (opts.strict && i.level === "warning"));
            if (opts.json) {
                process.stdout.write(JSON.stringify({ ok: !errors.length, change, taskCount: parsed.length, phases: (0, tasks_md_1.loopPhases)(parsed), issues }, null, 2) + "\n");
            }
            else {
                const rel = node_path_1.default.relative(dir, file);
                for (const i of issues)
                    process.stdout.write(formatIssue(rel, i) + "\n");
                const n = (0, tasks_md_1.loopPhases)(parsed).length;
                if (!issues.length)
                    process.stdout.write(`OK: ${rel} — ${parsed.length} tarefa(s), ${n} fase(s) no loop.\n`);
                else if (!errors.length)
                    process.stdout.write(`OK com avisos: ${rel} — ${n} fase(s) no loop.\n`);
            }
            process.exitCode = errors.length ? 1 : 0;
        }
        catch (e) {
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
        .action(async (changeArg, opts) => {
        try {
            const dir = (0, paths_1.resolveProjectDir)(opts.dir);
            const change = await resolveChange(dir, changeArg);
            const { tasks: parsed } = await loadTasks(dir, change);
            if (opts.json) {
                process.stdout.write(JSON.stringify({ change, tasks: parsed, files: (0, tasks_md_1.buildFileMap)(parsed), phases: (0, tasks_md_1.loopPhases)(parsed) }, null, 2) + "\n");
                return;
            }
            const lines = [];
            if (opts.fases) {
                (0, tasks_md_1.loopPhases)(parsed).forEach((f, i) => {
                    lines.push(`${String(i + 1).padStart(2)}. [${f.kind}] ${f.group} — tarefas ${f.taskIds.join(", ")}`);
                    lines.push(`    escopo: ${f.scope.join(", ") || "(nenhum)"}`);
                });
            }
            else if (opts.byFile) {
                for (const row of (0, tasks_md_1.buildFileMap)(parsed)) {
                    lines.push(row.path);
                    for (const t of row.touches)
                        lines.push(`  ${t.action.padEnd(6)} tarefa ${t.taskId} [${t.kind}]`);
                }
            }
            else {
                for (const t of parsed) {
                    lines.push(`${t.done ? "[x]" : "[ ]"} ${t.id} [${t.kind}] ${t.title}`);
                    for (const f of t.files)
                        lines.push(`    ${f.action.padEnd(6)} ${f.path}`);
                    if (t.greens.length)
                        lines.push(`    fica verde: ${t.greens.join(", ")}`);
                }
            }
            process.stdout.write(lines.join("\n") + "\n");
        }
        catch (e) {
            fail(e);
        }
    });
}
//# sourceMappingURL=tasks.js.map