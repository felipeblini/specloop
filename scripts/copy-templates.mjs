import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

async function copyDir(srcDir, dstDir) {
  await fs.mkdir(dstDir, { recursive: true });
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const dstPath = path.join(dstDir, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, dstPath);
    } else if (entry.isFile()) {
      await fs.mkdir(path.dirname(dstPath), { recursive: true });
      await fs.copyFile(srcPath, dstPath);
    }
  }
}

// fileURLToPath, não `.pathname`: no Windows o pathname é "/C:/..." e o caminho sai errado.
const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptsDir, "..");
const srcTemplates = path.join(root, "src", "templates");
const dstTemplates = path.join(root, "dist", "templates");

try {
  await fs.access(srcTemplates);
  await copyDir(srcTemplates, dstTemplates);
} catch {
  // No templates yet; ignore.
}

