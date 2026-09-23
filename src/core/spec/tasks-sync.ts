import YAML from "yaml";
import type { TaskEntry } from "./tasks-md";

export type SyncedTask = {
  id: string;
  title: string;
  goal: string;
  deps?: string[];
  files_contract: {
    allowed: string[];
    forbidden: string[];
    allow_new_files: boolean;
  };
};

export function taskIdFor(change: string, taskNumber: string): string {
  return `${change}--${taskNumber.replace(/\./g, "-")}`;
}

/**
 * Converts tasks.md entries into engine tasks. Each task's `files_contract.allowed`
 * is exactly the set of files the task declares (plus the change's tasks.md, so the
 * agent can tick checkboxes). Tasks with `Files: NONE` or already done are skipped.
 * Tasks run in document order (each depends on the previous synced task).
 */
export function toEngineTasks(change: string, tasks: TaskEntry[]): SyncedTask[] {
  const out: SyncedTask[] = [];
  const tasksMdPath = `openspec/changes/${change}/tasks.md`;
  for (const t of tasks) {
    if (t.done) continue;
    if (t.files?.kind !== "list" || !t.files.entries.length) continue;
    const entries = t.files.entries;
    const allowed = [...new Set([...entries.map((e) => e.path), tasksMdPath])];
    const testLines =
      t.tests?.kind === "list"
        ? t.tests.items.map(
            (x) =>
              `- ${x.id} ${x.title}` +
              (x.run ? ` (run: ${x.run})` : "") +
              (x.files?.kind === "list" ? ` [files: ${x.files.entries.map((f) => `${f.action} ${f.path}`).join(", ")}]` : "")
          )
        : [];
    const goal = [
      `OpenSpec change \`${change}\`, task ${t.id}: ${t.title}`,
      `Read openspec/changes/${change}/tasks.md (task ${t.id}) and the spec deltas before editing.`,
      `Files declared for this task (touch nothing else):`,
      ...entries.map((e) => `- ${e.action} ${e.path}${e.note ? ` — ${e.note}` : ""}`),
      ...(testLines.length ? [`Tests:`, ...testLines] : []),
      `When done, mark task ${t.id} and its tests as [x] in tasks.md.`,
    ].join("\n");

    const prev = out[out.length - 1];
    out.push({
      id: taskIdFor(change, t.id),
      title: t.title,
      goal,
      ...(prev ? { deps: [prev.id] } : {}),
      files_contract: {
        allowed,
        forbidden: [],
        allow_new_files: entries.some((e) => e.action === "CREATE"),
      },
    });
  }
  return out;
}

/**
 * Replaces the `<change>--*` tasks inside project.yml text, keeping every other
 * task, key and comment intact. Returns the new YAML text.
 */
export function mergeIntoProjectYml(
  projectYmlText: string,
  change: string,
  synced: SyncedTask[]
): { text: string; removed: number; added: number } {
  const doc = YAML.parseDocument(projectYmlText);
  const prefix = `${change}--`;
  const current = doc.get("tasks");
  const kept: unknown[] = [];
  let removed = 0;
  if (YAML.isSeq(current)) {
    for (const item of current.items) {
      const id = YAML.isMap(item) ? item.get("id") : undefined;
      if (typeof id === "string" && id.startsWith(prefix)) removed++;
      else kept.push(item);
    }
  }
  const seq = doc.createNode([]) as YAML.YAMLSeq;
  for (const k of kept) seq.items.push(k as any);
  for (const s of synced) seq.items.push(doc.createNode(s) as any);
  doc.set("tasks", seq);
  return { text: doc.toString({ lineWidth: 0 }), removed, added: synced.length };
}
