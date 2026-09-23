import fs from "node:fs/promises";
import path from "node:path";
import type { ToolId, ValidationIssue } from "../types";

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function validateProject(
  projectDir: string,
  tools: ToolId[]
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  const openspecDir = path.join(projectDir, "openspec");
  if (!(await exists(openspecDir))) {
    issues.push({
      level: "error",
      message: "Missing openspec directory. Run `specloop init`.",
      path: "openspec/",
    });
    return issues;
  }

  for (const p of ["openspec/specs", "openspec/changes", "openspec/project.md"]) {
    if (!(await exists(path.join(projectDir, p)))) {
      issues.push({ level: "error", message: `Missing ${p}`, path: p });
    }
  }

  if (tools.includes("claude-code")) {
    const p = ".claude/commands/specloop-plan.md";
    if (!(await exists(path.join(projectDir, p)))) {
      issues.push({ level: "warning", message: `Missing ${p}`, path: p });
    }
  }

  if (!(await exists(path.join(projectDir, "CLAUDE.md"))) && !(await exists(path.join(projectDir, "AGENTS.md")))) {
    issues.push({ level: "error", message: "Missing CLAUDE.md (ralph-loop.mjs preflight requires it; judge.mjs reads ## Comandos from it). Run `specloop init`.", path: "CLAUDE.md" });
  }

  return issues;
}

