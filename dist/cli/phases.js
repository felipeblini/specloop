"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPhasesCommand = registerPhasesCommand;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const paths_1 = require("../utils/paths");
const tasks_1 = require("./tasks");
const phases_md_1 = require("../core/spec/phases-md");
function registerPhasesCommand(program) {
    program
        .command("phases [change]")
        .description("Gera openspec/changes/<change>/phases.md, o documento que o ralph-loop.mjs executa")
        .option("--dir <path>", "Diretório do projeto (padrão: atual)")
        .option("--max-fases <n>", "Recusa gerar com mais fases que isto")
        .action(async (changeArg, opts) => {
        try {
            const dir = (0, paths_1.resolveProjectDir)(opts.dir);
            const change = await (0, tasks_1.resolveChange)(dir, changeArg);
            const { file, tasks, issues } = await (0, tasks_1.loadTasks)(dir, change);
            const rel = node_path_1.default.relative(dir, file);
            for (const i of issues)
                process.stdout.write((0, tasks_1.formatIssue)(rel, i) + "\n");
            // Com erro, não gera: um phases.md de um tasks.md reprovado seria o loop
            // executando um escopo que o check já sabe que está errado.
            if (issues.some((i) => i.level === "error")) {
                process.stdout.write("phases.md NÃO gerado: corrija os ERROS do tasks.md.\n");
                process.exitCode = 1;
                return;
            }
            const { text, count } = (0, phases_md_1.buildPhasesMd)(tasks, {
                change,
                tasksSha256: (0, phases_md_1.sha256)(await promises_1.default.readFile(file)),
                hasPackageJson: (0, node_fs_1.existsSync)(node_path_1.default.join(dir, "package.json")),
            });
            const max = opts.maxFases ? Number(opts.maxFases) : null;
            if (max && count > max) {
                process.stdout.write(`${count} fases, o limite é ${max}: phases.md NÃO gerado. Junte grupos no tasks.md.\n`);
                process.exitCode = 1;
                return;
            }
            const out = node_path_1.default.join(node_path_1.default.dirname(file), "phases.md");
            await promises_1.default.writeFile(out, text, "utf8");
            process.stdout.write(`${node_path_1.default.relative(dir, out)} — ${count} fase(s)\n`);
        }
        catch (e) {
            (0, tasks_1.fail)(e);
        }
    });
}
//# sourceMappingURL=phases.js.map