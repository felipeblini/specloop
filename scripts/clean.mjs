import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

async function rmIfExists(p) {
  try {
    await fs.rm(p, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

// scripts/ -> repo root (upstream went one level too far and removed ../dist)
const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
await rmIfExists(path.join(root, "dist"));

