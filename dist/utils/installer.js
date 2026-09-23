"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEGACY_COMMANDS = void 0;
exports.detectVerificationCommands = detectVerificationCommands;
exports.buildClaudeMd = buildClaudeMd;
exports.ensureOpenSpecScaffold = ensureOpenSpecScaffold;
exports.installToolTemplates = installToolTemplates;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const paths_1 = require("./paths");
async function ensureDir(p) {
    await promises_1.default.mkdir(p, { recursive: true });
}
async function writeFileIfMissing(filePath, contents) {
    try {
        await promises_1.default.access(filePath);
    }
    catch {
        await ensureDir(node_path_1.default.dirname(filePath));
        await promises_1.default.writeFile(filePath, contents, "utf8");
    }
}
exports.LEGACY_COMMANDS = [
    "ralphy-plan.md",
    "ralphy-implement.md",
    "ralphy-validate.md",
    "ralphy-archive.md",
];
/** Verification commands from package.json scripts, in the order the judge runs them. */
async function detectVerificationCommands(projectDir) {
    let pkg;
    try {
        pkg = JSON.parse(await promises_1.default.readFile(node_path_1.default.join(projectDir, "package.json"), "utf8"));
    }
    catch {
        return [];
    }
    const exists = async (f) => promises_1.default.access(node_path_1.default.join(projectDir, f)).then(() => true, () => false);
    const pm = (await exists("pnpm-lock.yaml"))
        ? "pnpm"
        : (await exists("yarn.lock"))
            ? "yarn"
            : (await exists("bun.lock")) || (await exists("bun.lockb"))
                ? "bun"
                : "npm";
    const run = (s) => (pm === "npm" ? `npm run ${s}` : pm === "bun" ? `bun run ${s}` : `${pm} ${s}`);
    return [["typecheck", "type-check"], ["lint"], ["test", "test:unit"], ["build"]]
        .map((alts) => alts.find((s) => pkg?.scripts?.[s]))
        .filter((s) => !!s)
        .map(run);
}
async function buildClaudeMd(projectDir) {
    const cmds = await detectVerificationCommands(projectDir);
    return [
        "# Instruções do projeto",
        "",
        "Contexto: `openspec/project.md`. Specs vigentes: `openspec/specs/`. Mudança ativa: `openspec/changes/<change>/`.",
        "",
        "## Regras",
        "",
        "- Nunca altere, desabilite ou remova um teste existente para fazer a suíte passar.",
        "- Toque só os arquivos declarados na tarefa atual do `tasks.md` (CRIA/ALTERA/REMOVE).",
        "- Dúvida que a spec não cobre vai para `.loop/duvidas.md`, com a suposição adotada.",
        "",
        "## Comandos",
        "",
        "Um por linha, na ordem em que o juiz roda. Linhas com `#` são ignoradas.",
        "",
        "```bash",
        ...(cmds.length ? cmds : ["# preencha: typecheck, lint, testes, build (o /specloop-plan preenche)"]),
        "```",
        "",
    ].join("\n");
}
async function ensureOpenSpecScaffold(projectDir) {
    const openspecDir = node_path_1.default.join(projectDir, "openspec");
    await ensureDir(node_path_1.default.join(openspecDir, "specs"));
    await ensureDir(node_path_1.default.join(openspecDir, "changes"));
    await ensureDir(node_path_1.default.join(openspecDir, "changes", "archive"));
    await writeFileIfMissing(node_path_1.default.join(openspecDir, "project.md"), [
        "# Project Context",
        "",
        "Describe your project's tech stack, conventions, and architecture here.",
        "",
        "## Stack",
        "- Language:",
        "- Framework:",
        "- Package manager:",
        "",
        "## Conventions",
        "- Code style:",
        "- Testing:",
        "- CI:",
        "",
    ].join("\n"));
}
async function installToolTemplates(projectDir, tools, opts) {
    const templatesRoot = (0, paths_1.getDistTemplatesDir)();
    // Claude Code (the only supported tool in this build)
    if (tools.includes("claude-code")) {
        const src = node_path_1.default.join(templatesRoot, "claude-code");
        const dst = node_path_1.default.join(projectDir, ".claude", "commands");
        await fs_extra_1.default.ensureDir(dst);
        await fs_extra_1.default.copy(src, dst, { overwrite: opts.force, errorOnExist: false });
        // Commands from ralphy-spec / earlier builds of this fork.
        for (const old of exports.LEGACY_COMMANDS) {
            await fs_extra_1.default.remove(node_path_1.default.join(dst, old));
        }
    }
    // CLAUDE.md: required by ralph-loop.mjs (preflight) and read by judge.mjs (## Comandos).
    await writeFileIfMissing(node_path_1.default.join(projectDir, "CLAUDE.md"), await buildClaudeMd(projectDir));
}
//# sourceMappingURL=installer.js.map