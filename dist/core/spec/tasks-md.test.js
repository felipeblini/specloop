"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const tasks_md_1 = require("./tasks-md");
const GOOD = `# Tasks: add-prize-card

## 1. Card do brinde

**Goal**: mostrar cada brinde como card

- [ ] 1.1 Testes do card
    - CRIA \`tests/unit/prize-card.test.ts\`
    - Casos:
        - nome "Caneca" → texto "Caneca"
        - url "/img/caneca.png" → src igual
    - Import: \`import PrizeCard from '../../src/components/PrizeCard.vue'\`
    - Run: \`npx vitest run tests/unit/prize-card.test.ts\`
- [ ] 1.2 Componente do card
    - CRIA \`src/components/PrizeCard.vue\`
    - CRIA \`src/styles/prize-card.css\`
    - ALTERA \`index.html\` — preload da fonte
    - Fica verde: 1.1

## 2. Selecionado

- [ ] 2.1 Testes do estado selecionado
    - CRIA \`tests/unit/prize-card-selected.test.ts\`
    - Casos:
        - selected true → classe is-selected
    - Import: \`import PrizeCard from '../../src/components/PrizeCard.vue'\`
    - Run: \`npx vitest run tests/unit/prize-card-selected.test.ts\`
- [x] 2.2 Estilo do selecionado
    - ALTERA \`src/styles/prize-card.css\` — .is-selected
    - ALTERA \`src/components/PrizeCard.vue\` — prop selected
    - Fica verde: 2.1
`;
const repo = new Set(["index.html", "package.json"]);
const exists = (p) => repo.has(p);
(0, vitest_1.describe)("parseTasksMd", () => {
    (0, vitest_1.it)("parses groups, tasks, files, kinds and cases like the loop", () => {
        const { tasks, issues } = (0, tasks_md_1.parseTasksMd)(GOOD);
        (0, vitest_1.expect)(issues).toEqual([]);
        (0, vitest_1.expect)(tasks.map((t) => `${t.id}:${t.kind}`)).toEqual(["1.1:teste", "1.2:impl", "2.1:teste", "2.2:impl"]);
        (0, vitest_1.expect)(tasks[1].files.map((f) => `${f.action} ${f.path}`)).toEqual([
            "CRIA src/components/PrizeCard.vue",
            "CRIA src/styles/prize-card.css",
            "ALTERA index.html",
        ]);
        (0, vitest_1.expect)(tasks[1].files[2].note).toBe("preload da fonte");
        (0, vitest_1.expect)(tasks[0].cases).toHaveLength(2);
        (0, vitest_1.expect)(tasks[0].loopScope).toEqual(["tests/unit/prize-card.test.ts"]);
        (0, vitest_1.expect)(tasks[1].greens).toEqual(["1.1"]);
        (0, vitest_1.expect)(tasks[3].done).toBe(true);
        (0, vitest_1.expect)(tasks[2].group).toMatchObject({ n: 2, title: "Selecionado" });
    });
    (0, vitest_1.it)("accepts CREATE/MODIFY/DELETE as aliases", () => {
        const { tasks } = (0, tasks_md_1.parseTasksMd)("## 1. A\n\n- [ ] 1.1 x\n    - CREATE `a/b.ts`\n    - MODIFY `c.css` — y\n");
        (0, vitest_1.expect)(tasks[0].files.map((f) => f.action)).toEqual(["CRIA", "ALTERA"]);
    });
});
(0, vitest_1.describe)("loopPaths (mirror of loop.mjs caminhos)", () => {
    (0, vitest_1.it)("ignores relative imports with .. and code spans with spaces", () => {
        (0, vitest_1.expect)((0, tasks_md_1.loopPaths)("`import X from '../../src/x.vue'` e `tests/a.test.ts`")).toEqual(["tests/a.test.ts"]);
    });
    (0, vitest_1.it)("picks bare paths in prose and drops infra/spec paths", () => {
        (0, vitest_1.expect)((0, tasks_md_1.loopPaths)("edite src/core/x.ts e confira openspec/project.md e `CLAUDE.md`")).toEqual(["src/core/x.ts"]);
    });
});
(0, vitest_1.describe)("lintTasksMd", () => {
    (0, vitest_1.it)("accepts a loop-ready tasks.md", () => {
        (0, vitest_1.expect)((0, tasks_md_1.lintTasksMd)(GOOD, { fileExists: exists }).issues).toEqual([]);
    });
    (0, vitest_1.it)("flags tasks outside a `## N.` group, short indents and nested checkboxes", () => {
        const md = `## Notas

- [ ] 1.1 perdida
    - CRIA \`src/a.ts\`

## 2. Grupo

- [ ] 2.1 recuo curto
  - CRIA \`src/b.ts\`
    - [ ] 2.1.a aninhada
`;
        const msgs = (0, tasks_md_1.lintTasksMd)(md).issues.map((i) => i.message);
        (0, vitest_1.expect)(msgs.some((m) => m.includes("fora de um grupo"))).toBe(true);
        (0, vitest_1.expect)(msgs.some((m) => m.includes("menos de 4 espaços"))).toBe(true);
        (0, vitest_1.expect)(msgs.some((m) => m.includes("aninhada"))).toBe(true);
    });
    (0, vitest_1.it)("requires every task to declare files", () => {
        const errs = (0, tasks_md_1.lintTasksMd)("## 1. A\n\n- [ ] 1.1 Sem arquivos\n    - Casos:\n        - x\n").issues;
        (0, vitest_1.expect)(errs[0].message).toContain("não declara arquivos");
    });
    (0, vitest_1.it)("errors when the text cites a path the task does not declare", () => {
        const md = "## 1. A\n\n- [ ] 1.1 Impl\n    - CRIA `src/a.ts`\n    - Observação: reaproveita src/util/format.ts\n";
        const msgs = (0, tasks_md_1.lintTasksMd)(md).issues.map((i) => i.message);
        (0, vitest_1.expect)(msgs.some((m) => m.includes("`src/util/format.ts`") && m.includes("sem estar declarado"))).toBe(true);
    });
    (0, vitest_1.it)("errors on tests after implementation in the same group", () => {
        const md = `## 1. A

- [ ] 1.1 Impl
    - CRIA \`src/a.ts\`
- [ ] 1.2 Teste tardio
    - CRIA \`tests/a.test.ts\`
    - Casos:
        - x → y
    - Run: \`npm test\`
`;
        const errs = (0, tasks_md_1.lintTasksMd)(md).issues.filter((i) => i.level === "error");
        (0, vitest_1.expect)(errs.some((i) => i.taskId === "1.2" && i.message.includes("nasceria verde"))).toBe(true);
    });
    (0, vitest_1.it)("errors when an impl task cites a test file, or a test file is modified", () => {
        const md = `## 1. A

- [ ] 1.1 Testes
    - CRIA \`tests/a.test.ts\`
    - Casos:
        - x
    - Run: \`npm test\`
- [ ] 1.2 Impl
    - CRIA \`src/a.ts\`
    - ALTERA \`tests/a.test.ts\` — ajuste
`;
        const msgs = (0, tasks_md_1.lintTasksMd)(md).issues.filter((i) => i.level === "error").map((i) => i.message);
        (0, vitest_1.expect)(msgs.some((m) => m.includes("Tarefa de implementação cita o teste"))).toBe(true);
        (0, vitest_1.expect)(msgs.some((m) => m.includes("trava testes por hash"))).toBe(true);
    });
    (0, vitest_1.it)("errors when a test task alters production code", () => {
        const md = "## 1. A\n\n- [ ] 1.1 Testes\n    - CRIA `tests/a.test.ts`\n    - ALTERA `src/a.ts` — stub\n";
        const msgs = (0, tasks_md_1.lintTasksMd)(md, { fileExists: (p) => p === "src/a.ts" }).issues.map((i) => i.message);
        (0, vitest_1.expect)(msgs.some((m) => m.includes("Tarefa de teste não altera código"))).toBe(true);
    });
    (0, vitest_1.it)("checks CRIA/ALTERA against the repo and earlier tasks, and infra files", () => {
        const md = `## 1. A

- [ ] 1.1 a
    - CRIA \`index.html\`
    - ALTERA \`src/nao-existe.css\` — x
    - ALTERA \`CLAUDE.md\` — x
- [ ] 1.2 b
    - CRIA \`src/novo.css\`
- [ ] 1.3 c
    - CRIA \`src/novo.css\`
`;
        const issues = (0, tasks_md_1.lintTasksMd)(md, { fileExists: exists }).issues.map((i) => `${i.level}:${i.message}`);
        (0, vitest_1.expect)(issues.some((m) => m.startsWith("warning:") && m.includes("já existe no repo"))).toBe(true);
        (0, vitest_1.expect)(issues.some((m) => m.startsWith("error:") && m.includes("src/nao-existe.css"))).toBe(true);
        (0, vitest_1.expect)(issues.some((m) => m.includes("infraestrutura"))).toBe(true);
        (0, vitest_1.expect)(issues.some((m) => m.includes("já é criado na tarefa 1.2"))).toBe(true);
    });
    (0, vitest_1.it)("flags lines the loop reads as a test plan", () => {
        const md = "## 1. A\n\n**Teste:** cobre o parser\n\n- [ ] 1.1 x\n    - CRIA `src/a.ts`\n";
        (0, vitest_1.expect)((0, tasks_md_1.lintTasksMd)(md).issues.some((i) => i.message.includes("plano"))).toBe(true);
    });
    (0, vitest_1.it)("warns about tests in group 1 of a repo without package.json", () => {
        const md = "## 1. A\n\n- [ ] 1.1 t\n    - CRIA `tests/a.test.ts`\n    - Casos:\n        - x\n    - Run: `npm test`\n";
        const w = (0, tasks_md_1.lintTasksMd)(md, { fileExists: () => false }).issues;
        (0, vitest_1.expect)(w.some((i) => i.message.includes("scaffold"))).toBe(true);
    });
    (0, vitest_1.it)("the shipped tasks template example passes the linter", () => {
        const tpl = node_fs_1.default.readFileSync(node_path_1.default.join(__dirname, "../../templates/shared/openspec-tasks-template.md"), "utf8");
        const example = /## Exemplo\s+```markdown\n([\s\S]*?)\n```/.exec(tpl)?.[1];
        (0, vitest_1.expect)(example).toBeTruthy();
        const existing = new Set(["index.html", "package.json", "src/views/HomeView.vue"]);
        const { tasks, issues } = (0, tasks_md_1.lintTasksMd)(example, { fileExists: (p) => existing.has(p) });
        (0, vitest_1.expect)(issues).toEqual([]);
        (0, vitest_1.expect)((0, tasks_md_1.loopPhases)(tasks).map((f) => f.kind)).toEqual(["teste", "impl", "teste", "impl"]);
    });
});
(0, vitest_1.describe)("buildFileMap / loopPhases / isTestFile", () => {
    (0, vitest_1.it)("indexes files by task", () => {
        const map = (0, tasks_md_1.buildFileMap)((0, tasks_md_1.parseTasksMd)(GOOD).tasks);
        const css = map.find((r) => r.path === "src/styles/prize-card.css");
        (0, vitest_1.expect)(css?.touches.map((t) => `${t.taskId}:${t.action}`)).toEqual(["1.2:CRIA", "2.2:ALTERA"]);
    });
    (0, vitest_1.it)("groups consecutive tasks of the same kind into loop phases", () => {
        const phases = (0, tasks_md_1.loopPhases)((0, tasks_md_1.parseTasksMd)(GOOD).tasks);
        (0, vitest_1.expect)(phases.map((p) => `${p.kind}:${p.taskIds.join("+")}`)).toEqual(["teste:1.1", "impl:1.2", "teste:2.1", "impl:2.2"]);
        (0, vitest_1.expect)(phases[1].scope).toEqual(["src/components/PrizeCard.vue", "src/styles/prize-card.css", "index.html"]);
    });
    (0, vitest_1.it)("uses the judge's test file pattern", () => {
        for (const p of ["a.test.ts", "b/c.spec.tsx", "d.test.mjs", "e.spec.js"])
            (0, vitest_1.expect)((0, tasks_md_1.isTestFile)(p)).toBe(true);
        for (const p of ["tests/helper.ts", "a.test.jsx", "a.cy.ts"])
            (0, vitest_1.expect)((0, tasks_md_1.isTestFile)(p)).toBe(false);
    });
});
//# sourceMappingURL=tasks-md.test.js.map