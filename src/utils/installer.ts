import fs from "node:fs/promises";
import path from "node:path";
import fse from "fs-extra";
import type { ToolId } from "../types";
import { getDistTemplatesDir } from "./paths";

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

async function writeFileIfMissing(filePath: string, contents: string) {
  try {
    await fs.access(filePath);
  } catch {
    await ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, contents, "utf8");
  }
}

export const LEGACY_COMMANDS = [
  "ralphy-plan.md",
  "ralphy-implement.md",
  "ralphy-validate.md",
  "ralphy-archive.md",
];

/** Verification commands from package.json scripts, in the order the judge runs them. */
export async function detectVerificationCommands(projectDir: string): Promise<string[]> {
  let pkg: any;
  try {
    pkg = JSON.parse(await fs.readFile(path.join(projectDir, "package.json"), "utf8"));
  } catch {
    return [];
  }
  const exists = async (f: string) => fs.access(path.join(projectDir, f)).then(() => true, () => false);
  const pm = (await exists("pnpm-lock.yaml"))
    ? "pnpm"
    : (await exists("yarn.lock"))
      ? "yarn"
      : (await exists("bun.lock")) || (await exists("bun.lockb"))
        ? "bun"
        : "npm";
  const run = (s: string) => (pm === "npm" ? `npm run ${s}` : pm === "bun" ? `bun run ${s}` : `${pm} ${s}`);
  return [["typecheck", "type-check"], ["lint"], ["test", "test:unit"], ["build"]]
    .map((alts) => alts.find((s) => pkg?.scripts?.[s]))
    .filter((s): s is string => !!s)
    .map(run);
}

export async function buildClaudeMd(projectDir: string): Promise<string> {
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

export async function ensureOpenSpecScaffold(projectDir: string): Promise<void> {
  const openspecDir = path.join(projectDir, "openspec");
  await ensureDir(path.join(openspecDir, "specs"));
  await ensureDir(path.join(openspecDir, "changes"));
  await ensureDir(path.join(openspecDir, "changes", "archive"));

  await writeFileIfMissing(
    path.join(openspecDir, "project.md"),
    [
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
    ].join("\n")
  );
}

export async function installToolTemplates(
  projectDir: string,
  tools: ToolId[],
  opts: { force: boolean }
): Promise<void> {
  const templatesRoot = getDistTemplatesDir();

  // Claude Code (the only supported tool in this build)
  if (tools.includes("claude-code")) {
    const src = path.join(templatesRoot, "claude-code");
    const dst = path.join(projectDir, ".claude", "commands");
    await fse.ensureDir(dst);
    await fse.copy(src, dst, { overwrite: opts.force, errorOnExist: false });
    // Commands from ralphy-spec / earlier builds of this fork.
    for (const old of LEGACY_COMMANDS) {
      await fse.remove(path.join(dst, old));
    }
  }

  // CLAUDE.md: required by loop.mjs (preflight) and read by judge.mjs (## Comandos).
  await writeFileIfMissing(path.join(projectDir, "CLAUDE.md"), await buildClaudeMd(projectDir));
}
