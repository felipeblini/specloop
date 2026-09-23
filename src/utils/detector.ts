import fs from "node:fs/promises";
import path from "node:path";
import type { ToolId } from "../types";

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function detectExistingTools(projectDir: string): Promise<ToolId[]> {
  return (await exists(path.join(projectDir, ".claude"))) ? ["claude-code"] : [];
}
