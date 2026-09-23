import { describe, expect, it } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { writeTasksBoard } from "./tasks-writer";
import { FILES, getRalphyRoot } from "../folders";

describe("writeTasksBoard", () => {
  it("writes TASKS.md with configurable icon mode", async () => {
    const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ralphy-artifacts-"));
    await writeTasksBoard({
      repoRoot,
      runId: "run_1",
      statusIcons: "ascii",
      specTasks: [{ id: "t1", title: "Hello" } as any],
      rows: [{ taskId: "t1", status: "running", iteration: 2 }],
    });

    const tasksPath = path.join(getRalphyRoot(repoRoot), FILES.tasks);
    const md = await fs.readFile(tasksPath, "utf8");
    expect(md).toContain("# TASKS");
    expect(md).toContain("[~] running");
  });

  it("lists the declared files of each task", async () => {
    const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ralphy-artifacts-"));
    await writeTasksBoard({
      repoRoot,
      runId: "run_2",
      specTasks: [
        {
          id: "c--2-1",
          title: "Card",
          filesContract: { allowed: ["src/Card.vue", "src/card.css"], forbidden: [], allowNewFiles: true },
        } as any,
      ],
      rows: [{ taskId: "c--2-1", status: "pending", iteration: 0 }],
    });
    const md = await fs.readFile(path.join(getRalphyRoot(repoRoot), FILES.tasks), "utf8");
    expect(md).toContain("## Files");
    expect(md).toContain("- `src/card.css`");
  });
});

