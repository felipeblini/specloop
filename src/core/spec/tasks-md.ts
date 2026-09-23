/**
 * Parser + linter for `openspec/changes/<change>/tasks.md`.
 *
 * Every task MUST declare the files it creates/modifies/deletes, and every test
 * MUST declare the test files it creates/modifies. Format:
 *
 *   - [ ] 2.1 Render the prize card
 *     - Files:
 *       - CREATE `src/components/PrizeCard.vue`
 *       - CREATE `src/styles/prize-card.css`
 *       - MODIFY `index.html` — link the new stylesheet
 *       - CREATE `tests/unit/PrizeCard.test.ts`
 *     - Acceptance criteria:
 *       - GIVEN ... WHEN ... THEN ...
 *     - Tests:
 *       - [ ] T2.1.a shows the prize name
 *         - Files:
 *           - CREATE `tests/unit/PrizeCard.test.ts`
 *         - Covers: `src/components/PrizeCard.vue`
 *         - Run: `npm test -- PrizeCard`
 *         - Assert: the name passed as prop is rendered
 *
 * A task or test with nothing to declare uses `- Files: NONE (reason)` /
 * `- Tests: NONE (reason)`.
 */

export type FileAction = "CREATE" | "MODIFY" | "DELETE";

export type FileEntry = {
  action: FileAction;
  path: string;
  note?: string;
  line: number;
};

export type FilesDecl =
  | { kind: "list"; entries: FileEntry[]; line: number }
  | { kind: "none"; reason: string; line: number };

export type TaskTest = {
  id: string;
  title: string;
  done: boolean;
  line: number;
  files?: FilesDecl;
  covers: string[];
  run?: string;
  assert?: string;
};

export type TaskEntry = {
  id: string;
  title: string;
  done: boolean;
  line: number;
  section?: string;
  files?: FilesDecl;
  tests?: { kind: "list"; items: TaskTest[]; line: number } | { kind: "none"; reason: string; line: number };
  hasLegacyTestPlan: boolean;
};

export type TasksIssue = {
  level: "error" | "warning";
  line: number;
  taskId?: string;
  testId?: string;
  message: string;
};

type Node = {
  indent: number;
  text: string;
  line: number;
  children: Node[];
};

const TASK_RE = /^\[( |x|X)\]\s+(\d+(?:\.\d+)*)\.?\s+(.*)$/;
const TEST_RE = /^(?:\[( |x|X)\]\s+)?(T\d[\w.-]*)\s*[:—–-]?\s*(.*)$/;
const FILE_RE = /^(CREATE|MODIFY|DELETE)\s+`([^`]+)`\s*(?:[—–:-]+\s*(.*))?$/i;
const GLOB_CHARS = /[*?[\]{}]/;
const TEST_FILE_RE = /(^|\/)(__tests__|tests?|spec|e2e)\/|\.(test|spec|cy|e2e)\.[a-z0-9]+$/i;

function indentOf(raw: string): number {
  let n = 0;
  for (const ch of raw) {
    if (ch === " ") n += 1;
    else if (ch === "\t") n += 2;
    else break;
  }
  return n;
}

/** Builds a forest of bullet nodes, one forest per markdown heading section. */
function parseBullets(text: string): Array<{ heading?: string; nodes: Node[] }> {
  const sections: Array<{ heading?: string; nodes: Node[] }> = [{ nodes: [] }];
  let stack: Node[] = [];
  let inFence = false;
  const lines = text.split(/\r?\n/);

  lines.forEach((raw, idx) => {
    const lineNo = idx + 1;
    const trimmed = raw.trim();
    if (trimmed.startsWith("```")) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;

    const heading = /^#{1,6}\s+(.*)$/.exec(trimmed);
    if (heading && indentOf(raw) === 0) {
      sections.push({ heading: heading[1], nodes: [] });
      stack = [];
      return;
    }
    if (!trimmed) return;

    const bullet = /^[-*+]\s+(.*)$/.exec(trimmed);
    const indent = indentOf(raw);
    if (!bullet) {
      // continuation line: append to the deepest open node
      const last = stack[stack.length - 1];
      if (last && indent > last.indent) last.text += " " + trimmed;
      return;
    }

    const node: Node = { indent, text: bullet[1].trim(), line: lineNo, children: [] };
    while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
    const parent = stack[stack.length - 1];
    if (parent) parent.children.push(node);
    else sections[sections.length - 1].nodes.push(node);
    stack.push(node);
  });

  return sections;
}

function label(node: Node): { key: string; rest: string } | undefined {
  const m = /^\*{0,2}([A-Za-z][A-Za-z ]*?)\*{0,2}\s*:\s*(.*)$/.exec(node.text);
  if (!m) return undefined;
  return { key: m[1].trim().toLowerCase(), rest: m[2].trim() };
}

function findChild(node: Node, key: string): { node: Node; rest: string } | undefined {
  for (const c of node.children) {
    const l = label(c);
    if (l && l.key === key) return { node: c, rest: l.rest };
  }
  return undefined;
}

function backtickPaths(s: string): string[] {
  return [...s.matchAll(/`([^`]+)`/g)].map((m) => m[1].trim());
}

function parseFilesDecl(
  found: { node: Node; rest: string },
  issues: TasksIssue[],
  ctx: { taskId?: string; testId?: string }
): FilesDecl {
  const { node, rest } = found;
  if (/^none\b/i.test(rest)) {
    const reason = rest.replace(/^none\b\s*/i, "").replace(/^\((.*)\)$/, "$1").trim();
    if (!reason) {
      issues.push({ level: "warning", line: node.line, ...ctx, message: "`Files: NONE` should state a reason, e.g. `NONE (docs-only review)`." });
    }
    return { kind: "none", reason, line: node.line };
  }
  const entries: FileEntry[] = [];
  const inline = rest ? [rest] : [];
  const candidates = [
    ...inline.map((t) => ({ text: t, line: node.line })),
    ...node.children.map((c) => ({ text: c.text, line: c.line })),
  ];
  for (const c of candidates) {
    const m = FILE_RE.exec(c.text);
    if (!m) {
      issues.push({
        level: "error",
        line: c.line,
        ...ctx,
        message: `Invalid file entry "${c.text}". Use: CREATE|MODIFY|DELETE \`path/to/file\` [— note]`,
      });
      continue;
    }
    const p = m[2].trim().replace(/^\.\//, "");
    if (GLOB_CHARS.test(p)) {
      issues.push({ level: "error", line: c.line, ...ctx, message: `File entries must be concrete paths, not globs: \`${p}\`` });
    }
    if (p.startsWith("/") || p.includes("..")) {
      issues.push({ level: "error", line: c.line, ...ctx, message: `Use repo-relative paths: \`${p}\`` });
    }
    entries.push({ action: m[1].toUpperCase() as FileAction, path: p, note: m[3]?.trim() || undefined, line: c.line });
  }
  if (!entries.length) {
    issues.push({ level: "error", line: node.line, ...ctx, message: "`Files:` is empty. List entries or use `Files: NONE (reason)`." });
  }
  return { kind: "list", entries, line: node.line };
}

export function parseTasksMd(text: string): { tasks: TaskEntry[]; issues: TasksIssue[] } {
  const issues: TasksIssue[] = [];
  const tasks: TaskEntry[] = [];

  for (const section of parseBullets(text)) {
    for (const node of section.nodes) {
      const m = TASK_RE.exec(node.text);
      if (!m) continue;
      const task: TaskEntry = {
        id: m[2],
        title: m[3].trim(),
        done: m[1].toLowerCase() === "x",
        line: node.line,
        section: section.heading,
        hasLegacyTestPlan: !!findChild(node, "test plan"),
      };
      const ctx = { taskId: task.id };

      const files = findChild(node, "files");
      if (files) task.files = parseFilesDecl(files, issues, ctx);

      const tests = findChild(node, "tests");
      if (tests) {
        if (/^none\b/i.test(tests.rest)) {
          task.tests = {
            kind: "none",
            reason: tests.rest.replace(/^none\b\s*/i, "").replace(/^\((.*)\)$/, "$1").trim(),
            line: tests.node.line,
          };
        } else {
          const items: TaskTest[] = [];
          for (const tn of tests.node.children) {
            const tm = TEST_RE.exec(tn.text);
            if (!tm) {
              issues.push({ level: "error", line: tn.line, ...ctx, message: `Invalid test item "${tn.text}". Use: - [ ] T${task.id}.a <what it checks>` });
              continue;
            }
            const test: TaskTest = {
              id: tm[2],
              title: tm[3].trim(),
              done: (tm[1] ?? " ").toLowerCase() === "x",
              line: tn.line,
              covers: [],
            };
            const tctx = { taskId: task.id, testId: test.id };
            const tf = findChild(tn, "files");
            if (tf) test.files = parseFilesDecl(tf, issues, tctx);
            const cov = findChild(tn, "covers");
            if (cov) test.covers = [...backtickPaths(cov.rest), ...cov.node.children.flatMap((c) => backtickPaths(c.text))];
            const run = findChild(tn, "run");
            if (run) test.run = run.rest;
            const as = findChild(tn, "assert");
            if (as) test.assert = as.rest;
            items.push(test);
          }
          task.tests = { kind: "list", items, line: tests.node.line };
        }
      }
      tasks.push(task);
    }
  }

  return { tasks, issues };
}

export function isTestFile(p: string): boolean {
  return TEST_FILE_RE.test(p);
}

/**
 * Lints tasks.md. `fileExists` (optional) lets the linter check that MODIFY/DELETE
 * targets exist in the repo or are created by an earlier task.
 */
export function lintTasksMd(
  text: string,
  opts: { fileExists?: (repoRelativePath: string) => boolean } = {}
): { tasks: TaskEntry[]; issues: TasksIssue[] } {
  const { tasks, issues } = parseTasksMd(text);

  if (!tasks.length) {
    issues.push({ level: "error", line: 1, message: "No tasks found. Tasks look like: `- [ ] 1.1 Title`." });
  }

  const seenIds = new Set<string>();
  const createdBy = new Map<string, string>();

  for (const t of tasks) {
    const ctx = { taskId: t.id };
    if (seenIds.has(t.id)) issues.push({ level: "error", line: t.line, ...ctx, message: `Duplicate task id ${t.id}.` });
    seenIds.add(t.id);

    if (!t.files) {
      issues.push({ level: "error", line: t.line, ...ctx, message: `Task ${t.id} has no \`Files:\` section (list CREATE/MODIFY/DELETE entries, including HTML, CSS and test files).` });
    }

    if (!t.tests) {
      issues.push({
        level: "error",
        line: t.line,
        ...ctx,
        message: t.hasLegacyTestPlan
          ? `Task ${t.id} uses \`Test plan:\`. Replace it with \`Tests:\` where each test lists its own \`Files:\`.`
          : `Task ${t.id} has no \`Tests:\` section (or \`Tests: NONE (reason)\`).`,
      });
    } else if (t.tests.kind === "list" && !t.tests.items.length) {
      issues.push({ level: "error", line: t.tests.line, ...ctx, message: `Task ${t.id}: \`Tests:\` is empty.` });
    }

    const taskFiles = t.files?.kind === "list" ? t.files.entries : [];
    const taskPaths = new Map<string, FileEntry>();
    for (const e of taskFiles) {
      if (taskPaths.has(e.path)) {
        issues.push({ level: "warning", line: e.line, ...ctx, message: `\`${e.path}\` is listed twice in task ${t.id}.` });
      }
      taskPaths.set(e.path, e);

      if (e.action === "CREATE") {
        const prev = createdBy.get(e.path);
        if (prev) {
          issues.push({ level: "warning", line: e.line, ...ctx, message: `\`${e.path}\` is already created by task ${prev}; use MODIFY here.` });
        } else if (opts.fileExists?.(e.path)) {
          issues.push({ level: "warning", line: e.line, ...ctx, message: `\`${e.path}\` already exists in the repo; use MODIFY instead of CREATE.` });
        }
      } else if (opts.fileExists && !createdBy.has(e.path) && !opts.fileExists(e.path)) {
        issues.push({ level: "error", line: e.line, ...ctx, message: `${e.action} \`${e.path}\`: file does not exist and no earlier task creates it.` });
      }
    }
    for (const e of taskFiles) if (e.action === "CREATE" && !createdBy.has(e.path)) createdBy.set(e.path, t.id);

    const testFilesUsed = new Set<string>();
    if (t.tests?.kind === "list") {
      for (const test of t.tests.items) {
        const tctx = { taskId: t.id, testId: test.id };
        if (!test.files) {
          issues.push({ level: "error", line: test.line, ...tctx, message: `Test ${test.id} has no \`Files:\` (the test file it creates/modifies, or \`Files: NONE (reason)\`).` });
        } else if (test.files.kind === "list") {
          for (const e of test.files.entries) {
            testFilesUsed.add(e.path);
            if (!taskPaths.has(e.path)) {
              issues.push({ level: "error", line: e.line, ...tctx, message: `Test ${test.id} touches \`${e.path}\`, which is missing from task ${t.id} \`Files:\`.` });
            } else if (taskPaths.get(e.path)!.action !== e.action) {
              issues.push({ level: "warning", line: e.line, ...tctx, message: `Test ${test.id} says ${e.action} \`${e.path}\` but task ${t.id} says ${taskPaths.get(e.path)!.action}.` });
            }
          }
        }
        if (!test.run) {
          issues.push({ level: "warning", line: test.line, ...tctx, message: `Test ${test.id} has no \`Run:\` command.` });
        }
        for (const c of test.covers) {
          if (!taskPaths.has(c) && opts.fileExists && !opts.fileExists(c) && !createdBy.has(c)) {
            issues.push({ level: "warning", line: test.line, ...tctx, message: `Test ${test.id} covers \`${c}\`, which neither exists nor is created by any task.` });
          }
        }
      }
    }

    for (const e of taskFiles) {
      if (isTestFile(e.path) && e.action !== "DELETE" && !testFilesUsed.has(e.path)) {
        issues.push({ level: "warning", line: e.line, ...ctx, message: `Test file \`${e.path}\` is listed in task ${t.id} but no test under \`Tests:\` declares it.` });
      }
    }
  }

  issues.sort((a, b) => a.line - b.line);
  return { tasks, issues };
}

export type FileMapRow = {
  path: string;
  touches: Array<{ taskId: string; action: FileAction; testIds: string[] }>;
};

/** Reverse index: which tasks (and tests) touch each file, in task order. */
export function buildFileMap(tasks: TaskEntry[]): FileMapRow[] {
  const map = new Map<string, FileMapRow>();
  for (const t of tasks) {
    if (t.files?.kind !== "list") continue;
    for (const e of t.files.entries) {
      const row = map.get(e.path) ?? { path: e.path, touches: [] };
      const testIds =
        t.tests?.kind === "list"
          ? t.tests.items
              .filter((x) => x.files?.kind === "list" && x.files.entries.some((f) => f.path === e.path))
              .map((x) => x.id)
          : [];
      row.touches.push({ taskId: t.id, action: e.action, testIds });
      map.set(e.path, row);
    }
  }
  return [...map.values()].sort((a, b) => a.path.localeCompare(b.path));
}
