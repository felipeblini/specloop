import { describe, expect, it } from "vitest";
import YAML from "yaml";
import { parseTasksMd } from "./tasks-md";
import { mergeIntoProjectYml, toEngineTasks } from "./tasks-sync";
import { projectSpecSchema } from "./schemas";
import { buildTaskDAG } from "./dag";

const MD = `- [ ] 1.1 Review
  - Files: NONE (review)
  - Tests: NONE (n/a)
- [ ] 2.1 Card
  - Files:
    - CREATE \`src/Card.vue\`
    - MODIFY \`src/app.css\` — card styles
    - CREATE \`tests/Card.test.ts\`
  - Tests:
    - [ ] T2.1.a renders
      - Files:
        - CREATE \`tests/Card.test.ts\`
      - Run: \`npm test -- Card\`
- [x] 2.2 Done already
  - Files:
    - MODIFY \`src/app.css\` — x
  - Tests: NONE (n/a)
- [ ] 2.3 Tweak
  - Files:
    - MODIFY \`src/app.css\` — y
  - Tests: NONE (n/a)
`;

const YML = `# my comment
version: "1.1"
defaults:
  backend: "claude-code"
tasks:
  - id: "manual-1"
    title: "keep me"
  - id: "prize--9-9"
    title: "stale"
`;

describe("tasks sync", () => {
  it("builds engine tasks with files_contract equal to declared files", () => {
    const synced = toEngineTasks("prize", parseTasksMd(MD).tasks);
    expect(synced.map((t) => t.id)).toEqual(["prize--2-1", "prize--2-3"]);
    expect(synced[0].files_contract).toEqual({
      allowed: ["src/Card.vue", "src/app.css", "tests/Card.test.ts", "openspec/changes/prize/tasks.md"],
      forbidden: [],
      allow_new_files: true,
    });
    expect(synced[1].deps).toEqual(["prize--2-1"]);
    expect(synced[1].files_contract.allow_new_files).toBe(false);
    expect(synced[0].goal).toContain("CREATE src/Card.vue");
    expect(synced[0].goal).toContain("T2.1.a renders");
  });

  it("merges into project.yml keeping other tasks and comments, and stays loadable", () => {
    const synced = toEngineTasks("prize", parseTasksMd(MD).tasks);
    const { text, removed, added } = mergeIntoProjectYml(YML, "prize", synced);
    expect(removed).toBe(1);
    expect(added).toBe(2);
    expect(text).toContain("# my comment");
    const spec = projectSpecSchema.parse(YAML.parse(text));
    expect(spec.tasks.map((t) => t.id)).toEqual(["manual-1", "prize--2-1", "prize--2-3"]);
    expect(spec.tasks[1].filesContract?.allowed).toContain("src/app.css");
    expect(buildTaskDAG(spec.tasks).order).toEqual(["manual-1", "prize--2-1", "prize--2-3"]);
  });
});
