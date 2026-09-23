import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { buildFileMap, isTestFile, lintTasksMd, parseTasksMd } from "./tasks-md";

const GOOD = `# Tasks: add-prize-card

## 1. Planning
- [ ] 1.1 Confirm scope
  - Files: NONE (read-only review)
  - Tests: NONE (no code change)

## 2. Implementation
- [ ] 2.1 Render the prize card
  - Files:
    - CREATE \`src/components/PrizeCard.vue\`
    - CREATE \`src/styles/prize-card.css\`
    - MODIFY \`index.html\` — link the stylesheet
    - CREATE \`tests/unit/PrizeCard.test.ts\`
  - Acceptance criteria:
    - GIVEN a prize WHEN rendered THEN the name shows
  - Tests:
    - [ ] T2.1.a shows the name
      - Files:
        - CREATE \`tests/unit/PrizeCard.test.ts\`
      - Covers: \`src/components/PrizeCard.vue\`, \`src/styles/prize-card.css\`
      - Run: \`npm test -- PrizeCard\`
      - Assert: name is rendered
- [x] 2.2 Style the selected state
  - Files:
    - MODIFY \`src/styles/prize-card.css\` — add .is-selected
    - MODIFY \`tests/unit/PrizeCard.test.ts\` — new case
  - Tests:
    - [x] T2.2.a selected class
      - Files:
        - MODIFY \`tests/unit/PrizeCard.test.ts\`
      - Run: \`npm test -- PrizeCard\`
`;

const exists = (p: string) => p === "index.html";

describe("parseTasksMd", () => {
  it("parses tasks, file entries and per-test files", () => {
    const { tasks, issues } = parseTasksMd(GOOD);
    expect(issues).toEqual([]);
    expect(tasks.map((t) => t.id)).toEqual(["1.1", "2.1", "2.2"]);
    expect(tasks[0].files).toMatchObject({ kind: "none", reason: "read-only review" });
    const t21 = tasks[1];
    expect(t21.files?.kind === "list" && t21.files.entries.map((e) => `${e.action} ${e.path}`)).toEqual([
      "CREATE src/components/PrizeCard.vue",
      "CREATE src/styles/prize-card.css",
      "MODIFY index.html",
      "CREATE tests/unit/PrizeCard.test.ts",
    ]);
    expect(t21.files?.kind === "list" && t21.files.entries[2].note).toBe("link the stylesheet");
    const test = t21.tests?.kind === "list" ? t21.tests.items[0] : undefined;
    expect(test).toMatchObject({ id: "T2.1.a", run: "`npm test -- PrizeCard`" });
    expect(test?.covers).toEqual(["src/components/PrizeCard.vue", "src/styles/prize-card.css"]);
    expect(tasks[2].done).toBe(true);
  });
});

describe("lintTasksMd", () => {
  it("accepts a well-formed tasks.md", () => {
    expect(lintTasksMd(GOOD, { fileExists: exists }).issues).toEqual([]);
  });

  it("requires Files and Tests on every task, and flags legacy Test plan", () => {
    const md = `- [ ] 1.1 Do something
  - Test plan:
    - Run: npm test
`;
    const msgs = lintTasksMd(md).issues.map((i) => i.message);
    expect(msgs.some((m) => m.includes("no `Files:`"))).toBe(true);
    expect(msgs.some((m) => m.includes("uses `Test plan:`"))).toBe(true);
  });

  it("rejects globs, bad actions and undeclared test files", () => {
    const md = `- [ ] 1.1 Thing
  - Files:
    - CREATE \`src/**/*.ts\`
    - TOUCH \`src/a.ts\`
  - Tests:
    - [ ] T1.1.a works
      - Files:
        - CREATE \`tests/a.test.ts\`
      - Run: \`npm test\`
`;
    const errs = lintTasksMd(md).issues.filter((i) => i.level === "error").map((i) => i.message);
    expect(errs.some((m) => m.includes("not globs"))).toBe(true);
    expect(errs.some((m) => m.includes("Invalid file entry"))).toBe(true);
    expect(errs.some((m) => m.includes("missing from task 1.1"))).toBe(true);
  });

  it("requires each test to declare its files", () => {
    const md = `- [ ] 1.1 Thing
  - Files:
    - CREATE \`src/a.ts\`
  - Tests:
    - [ ] T1.1.a works
      - Run: \`npm test\`
`;
    const errs = lintTasksMd(md).issues.filter((i) => i.level === "error");
    expect(errs[0].message).toContain("Test T1.1.a has no `Files:`");
    expect(errs[0].testId).toBe("T1.1.a");
  });

  it("checks CREATE/MODIFY against the repo and earlier tasks", () => {
    const md = `- [ ] 1.1 A
  - Files:
    - CREATE \`index.html\`
    - MODIFY \`src/missing.css\` — x
  - Tests: NONE (n/a)
- [ ] 1.2 B
  - Files:
    - CREATE \`src/new.css\`
  - Tests: NONE (n/a)
- [ ] 1.3 C
  - Files:
    - CREATE \`src/new.css\`
    - MODIFY \`src/new.css\`
  - Tests: NONE (n/a)
`;
    const issues = lintTasksMd(md, { fileExists: exists }).issues.map((i) => `${i.level}:${i.message}`);
    expect(issues.some((m) => m.startsWith("warning:") && m.includes("already exists in the repo"))).toBe(true);
    expect(issues.some((m) => m.startsWith("error:") && m.includes("src/missing.css"))).toBe(true);
    expect(issues.some((m) => m.includes("already created by task 1.2"))).toBe(true);
  });

  it("warns when a test file in the task is not claimed by any test", () => {
    const md = `- [ ] 1.1 A
  - Files:
    - CREATE \`src/a.ts\`
    - CREATE \`src/a.spec.ts\`
  - Tests: NONE (later)
`;
    const w = lintTasksMd(md).issues.filter((i) => i.level === "warning");
    expect(w.some((i) => i.message.includes("no test under"))).toBe(true);
  });

  it("the shipped tasks template example passes the linter", () => {
    const tpl = fs.readFileSync(
      path.join(__dirname, "../../templates/shared/openspec-tasks-template.md"),
      "utf8"
    );
    const example = /## Example\s+```markdown\n([\s\S]*?)\n```/.exec(tpl)?.[1];
    expect(example).toBeTruthy();
    const existing = new Set(["src/views/HomeView.vue", "index.html"]);
    const { tasks, issues } = lintTasksMd(example!, { fileExists: (p) => existing.has(p) });
    expect(issues).toEqual([]);
    expect(tasks).toHaveLength(3);
  });
});

describe("buildFileMap / isTestFile", () => {
  it("indexes files by task and test", () => {
    const { tasks } = parseTasksMd(GOOD);
    const map = buildFileMap(tasks);
    const css = map.find((r) => r.path === "src/styles/prize-card.css");
    expect(css?.touches.map((t) => `${t.taskId}:${t.action}`)).toEqual(["2.1:CREATE", "2.2:MODIFY"]);
    const spec = map.find((r) => r.path === "tests/unit/PrizeCard.test.ts");
    expect(spec?.touches.map((t) => t.testIds)).toEqual([["T2.1.a"], ["T2.2.a"]]);
  });

  it("detects common test file patterns", () => {
    for (const p of ["tests/a.ts", "src/__tests__/b.ts", "src/c.test.tsx", "e2e/d.ts", "src/e.spec.js", "cypress/f.cy.ts"]) {
      expect(isTestFile(p)).toBe(true);
    }
    expect(isTestFile("src/components/Test.vue")).toBe(false);
  });
});
