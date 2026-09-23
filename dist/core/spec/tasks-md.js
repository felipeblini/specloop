"use strict";
/**
 * Parser + linter for `openspec/changes/<change>/tasks.md`, shaped for the external
 * loop (ralph-loop.mjs + judge.mjs). The loop reads tasks.md like this:
 *
 *   - groups are `## N. Title` (also `## Phase N:`, `## Fase N:`, `## Etapa N —`);
 *     tasks under any other `##` heading are silently ignored
 *   - a task is `- [ ] N.M text`; its continuation lines need 4+ spaces of indent
 *     (lines with 1–3 spaces are dropped)
 *   - the phase scope is every path the task text cites (backticked or bare)
 *   - a task whose FIRST cited file is a test is a test task; consecutive tasks of
 *     the same kind form one phase, so tests must come before implementation
 *   - test files are locked by hash once their phase closes: never modify them later
 *
 * Format (Portuguese keywords; CREATE/MODIFY/DELETE are accepted too):
 *
 *   ## 1. Card do brinde
 *
 *   **Goal**: mostrar os brindes cadastrados na home
 *
 *   - [ ] 1.1 Testes do card do brinde
 *       - CRIA `tests/unit/prize-card.test.ts`
 *       - Casos:
 *           - mostra o nome recebido ("Caneca" → texto "Caneca")
 *       - Import: `import PrizeCard from '../../src/components/PrizeCard.vue'`
 *       - Run: `npx vitest run tests/unit/prize-card.test.ts`
 *   - [ ] 1.2 Componente do card
 *       - CRIA `src/components/PrizeCard.vue`
 *       - CRIA `src/styles/prize-card.css`
 *       - ALTERA `index.html` — preload da fonte
 *       - Fica verde: 1.1
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTestFile = void 0;
exports.loopPaths = loopPaths;
exports.parseTasksMd = parseTasksMd;
exports.lintTasksMd = lintTasksMd;
exports.buildFileMap = buildFileMap;
exports.loopPhases = loopPhases;
// ─── Mirrors of ralph-loop.mjs / judge.mjs (keep in sync when the loop changes) ─────
const EXT = /\.(?:[cm]?[jt]sx?|json|ya?ml|css|scss|vue|html|md|txt|svg|png|csv)$/i;
const SOLTO_RE = /(?:^|[\s("'])((?:[\w.@-]+\/)+[\w.@-]+\.\w{1,5})(?=$|[\s,;:)"'.])/g;
const SPEC_RE = /^(?:openspec|specs|\.specify|\.spec)\//;
const INFRA_RE = /^(?:design\/|openspec\/|specs\/|\.specify\/|\.spec\/|judge\.mjs$|(?:ralph-)?loop\.mjs$|CLAUDE\.md$|AGENTS\.md$)/;
const FASE_RE = /^(?:(?:Phase|Fase|Etapa|Step)\s+\d+\s*[:—–-]?|\d+\.)\s*/i;
const TASK_LINE_RE = /^\s*-\s*\[\s*([ xX]?)\s*\]\s*(?:(T\d+|\d+\.\d+)\s+)?(.*)$/;
/** ralph-loop.mjs decides task kind with this. */
const LOOP_TEST_RE = /\.(test|spec)\.[cm]?[jt]sx?$/;
/** judge.mjs only collects/locks these; a test file must match it. */
const JUDGE_TEST_RE = /\.(test|spec)\.(ts|tsx|js|mjs)$/;
const PLANO_SUB_RE = /^#{3,}[^\n]*(?:\btest\w*\b[^\n]*\bantes\b|\btests?\b[^\n]*\bbefore\b|plano de testes?|test plan)/i;
const PLANO_PAR_RE = /^\*\*(?:plano de testes?|test plan|testes?|tests?)\b/i;
/** Same extraction as ralph-loop.mjs `caminhos()`: what the loop treats as phase scope. */
function loopPaths(texto) {
    const out = [];
    for (const m of texto.matchAll(/`([^`\s]+)`/g)) {
        const p = m[1].replace(/\\/g, "/").replace(/^\.\//, "");
        if (p === "*") {
            out.push("*");
            continue;
        }
        if (/[*@(){}=:,'"<>$]/.test(p) || /^[\d/]/.test(p) || p.includes(".."))
            continue;
        if (/^\.[\w-]+$/.test(p) && EXT.test(`x${p}`))
            continue;
        if (EXT.test(p) || /^\.[\w-]+$/.test(p)) {
            out.push(p);
            continue;
        }
        if (p.includes("/") && !/\.\w+$/.test(p.split("/").filter(Boolean).pop() ?? "")) {
            out.push(p.endsWith("/") ? p : `${p}/`);
        }
    }
    for (const m of texto.matchAll(SOLTO_RE)) {
        const p = m[1].replace(/\\/g, "/");
        if (EXT.test(p) && !SPEC_RE.test(p) && !p.startsWith("design/") && !p.includes(".."))
            out.push(p);
    }
    return [...new Set(out)].filter((p) => !INFRA_RE.test(p));
}
const isTestFile = (p) => JUDGE_TEST_RE.test(p);
exports.isTestFile = isTestFile;
const FILE_RE = /^-\s+(CRIA|ALTERA|REMOVE|CREATE|MODIFY|DELETE)\s+`([^`]+)`\s*(?:[—–:-]+\s*(.*))?$/i;
const ACTION = {
    CRIA: "CRIA", CREATE: "CRIA",
    ALTERA: "ALTERA", MODIFY: "ALTERA",
    REMOVE: "REMOVE", DELETE: "REMOVE",
};
function parseTasksMd(text) {
    const issues = [];
    const tasks = [];
    const lines = text.split(/\r?\n/);
    let group = null;
    let groupIsPhase = false;
    let cur = null;
    let inFence = false;
    const close = () => {
        if (!cur)
            return;
        const { entry, body } = cur;
        let inCases = false;
        let casesIndent = 0;
        for (const { raw, line } of body) {
            const t = raw.trim();
            if (inCases && indentOf(raw) > casesIndent && /^-\s+/.test(t)) {
                entry.cases.push(t.replace(/^-\s+/, ""));
                continue;
            }
            inCases = false;
            if (TASK_LINE_RE.test(t)) {
                issues.push({ level: "error", line, taskId: entry.id, message: "Caixa de seleção aninhada: o loop a trata como outra tarefa. Use bullets simples dentro da tarefa." });
                continue;
            }
            const fm = FILE_RE.exec(t);
            if (fm) {
                entry.files.push({
                    action: ACTION[fm[1].toUpperCase()],
                    path: fm[2].trim().replace(/^\.\//, ""),
                    note: fm[3]?.trim() || undefined,
                    line,
                });
                continue;
            }
            if (/^-\s+(?:\*\*)?(?:CRIA|ALTERA|REMOVE|CREATE|MODIFY|DELETE)\b/i.test(t)) {
                issues.push({ level: "error", line, taskId: entry.id, message: `Entrada de arquivo inválida: "${t}". Use: - CRIA|ALTERA|REMOVE \`caminho/do/arquivo\` [— nota]` });
                continue;
            }
            const lab = /^-\s+([A-Za-zÀ-ú ]+):\s*(.*)$/.exec(t);
            if (lab) {
                const key = lab[1].trim().toLowerCase();
                inCases = key === "casos";
                casesIndent = indentOf(raw);
                if (key === "fica verde")
                    entry.greens = lab[2].split(/[,\s]+/).map((s) => s.replace(/`/g, "").replace(/\.$/, "")).filter(Boolean);
                if (key === "run")
                    entry.run = lab[2];
                continue;
            }
        }
        entry.text = [entry.title, ...body.map((b) => b.raw.trim())].join(" ").replace(/\s+/g, " ").trim();
        entry.raw = [`- [ ] ${entry.id} ${entry.title}`, ...body.map((b) => b.raw.replace(/\s+$/, ""))];
        entry.loopScope = loopPaths(entry.text);
        const first = entry.loopScope.find((a) => !a.endsWith("/"));
        entry.kind = first && LOOP_TEST_RE.test(first) ? "teste" : "impl";
        tasks.push(entry);
        cur = null;
    };
    lines.forEach((raw, idx) => {
        const lineNo = idx + 1;
        if (raw.trim().startsWith("```"))
            inFence = !inFence;
        if (inFence)
            return;
        if (/^## /.test(raw)) {
            close();
            const h = raw.slice(3);
            groupIsPhase = FASE_RE.test(h);
            const n = Number((/\d+/.exec(h) ?? ["0"])[0]);
            group = { n, title: h.replace(FASE_RE, "").trim(), line: lineNo };
            return;
        }
        if (/^#{1,6}\s/.test(raw)) {
            close();
            if (/^#{3,}\s/.test(raw) && PLANO_SUB_RE.test(raw.trim())) {
                issues.push({ level: "error", line: lineNo, message: "Subtítulo de plano de teste: o loop passa a tratar o grupo inteiro como implementação. Escreva os testes como tarefas (CRIA `x.test.ts`)." });
            }
            return;
        }
        const goal = /^\*\*Goal\*\*:\s*(.*)$/.exec(raw.trim());
        if (goal && group && !cur)
            group.goal = goal[1].trim();
        if (PLANO_PAR_RE.test(raw.trim())) {
            issues.push({ level: "error", line: lineNo, message: `"${raw.trim().slice(0, 40)}…": o loop lê linha que começa com **Teste/**Plano de teste como plano e desliga a separação teste→implementação. Use outro rótulo.` });
        }
        const tm = TASK_LINE_RE.exec(raw);
        if (tm && indentOf(raw) < 4) {
            close();
            const id = tm[2] ?? "";
            const entry = {
                id: id || `?${lineNo}`,
                title: tm[3].trim(),
                done: tm[1].toLowerCase() === "x",
                line: lineNo,
                group: group ?? { n: 0, title: "", line: 0 },
                kind: "impl",
                files: [],
                loopScope: [],
                greens: [],
                cases: [],
                text: "",
                raw: [],
            };
            if (!id)
                issues.push({ level: "error", line: lineNo, message: "Tarefa sem id. Use `- [ ] N.M título` (ex.: 2.1)." });
            if (!group || !groupIsPhase) {
                issues.push({ level: "error", line: lineNo, taskId: entry.id, message: "Tarefa fora de um grupo `## N. Título`: o loop ignora esta tarefa." });
            }
            cur = { entry, body: [] };
            return;
        }
        if (!cur)
            return;
        if (!raw.trim())
            return;
        const ind = indentOf(raw);
        if (ind >= 4)
            cur.body.push({ raw, line: lineNo });
        else if (ind > 0) {
            issues.push({ level: "error", line: lineNo, taskId: cur.entry.id, message: "Linha com menos de 4 espaços de recuo: o loop descarta. Recue os detalhes da tarefa com 4 espaços." });
        }
        else
            close();
    });
    close();
    return { tasks, issues };
}
function indentOf(raw) {
    let n = 0;
    for (const ch of raw) {
        if (ch === " ")
            n += 1;
        else if (ch === "\t")
            n += 4;
        else
            break;
    }
    return n;
}
/**
 * Lints tasks.md against what the loop and the judge will do with it.
 * `fileExists` lets it check CRIA/ALTERA against the repo.
 */
function lintTasksMd(text, opts = {}) {
    const { tasks, issues } = parseTasksMd(text);
    const add = (level, t, message, line) => issues.push({ level, line: line ?? t.line, taskId: t.id, message });
    if (!tasks.length)
        issues.push({ level: "error", line: 1, message: "Nenhuma tarefa. Formato: `## 1. Grupo` e `- [ ] 1.1 Título`." });
    const ids = new Set();
    const createdBy = new Map();
    const testTaskIds = new Set(tasks.filter((t) => t.kind === "teste").map((t) => t.id));
    const hasPkg = opts.fileExists?.("package.json");
    for (const t of tasks) {
        if (ids.has(t.id))
            add("error", t, `Id repetido: ${t.id}.`);
        ids.add(t.id);
        if (!t.files.length) {
            add("error", t, `Tarefa ${t.id} não declara arquivos. Liste cada arquivo que ela cria, altera ou remove (inclusive HTML, CSS e testes).`);
            continue;
        }
        const declared = new Set(t.files.map((f) => f.path));
        const seen = new Set();
        for (const f of t.files) {
            if (seen.has(f.path))
                add("warning", t, `\`${f.path}\` aparece duas vezes.`, f.line);
            seen.add(f.path);
            if (/[*?[\]{}]/.test(f.path))
                add("error", t, `Caminho concreto, sem glob: \`${f.path}\`.`, f.line);
            if (f.path.startsWith("/") || f.path.includes(".."))
                add("error", t, `Caminho relativo à raiz do repo: \`${f.path}\`.`, f.line);
            if (INFRA_RE.test(f.path) || /^(?:(?:ralph-)?loop|judge)\.mjs$/.test(f.path)) {
                add("error", t, `\`${f.path}\` é infraestrutura do loop/juiz: nenhuma fase pode tocar.`, f.line);
            }
            if (!loopPathsCover(t.loopScope, f.path)) {
                add("error", t, `O loop não vai enxergar \`${f.path}\` (extensão fora da lista do loop?). Ele fica fora do escopo da fase e o juiz reprova.`, f.line);
            }
            if (f.action === "CRIA") {
                const prev = createdBy.get(f.path);
                if (prev)
                    add("warning", t, `\`${f.path}\` já é criado na tarefa ${prev}; aqui é ALTERA.`, f.line);
                else if (opts.fileExists?.(f.path))
                    add("warning", t, `\`${f.path}\` já existe no repo; use ALTERA.`, f.line);
            }
            else if (opts.fileExists && !createdBy.has(f.path) && !opts.fileExists(f.path)) {
                add("error", t, `${f.action} \`${f.path}\`: o arquivo não existe e nenhuma tarefa anterior o cria.`, f.line);
            }
            if ((0, exports.isTestFile)(f.path) && f.action !== "CRIA") {
                add("error", t, `${f.action} \`${f.path}\`: o juiz trava testes por hash quando a fase fecha. Crie um arquivo de teste novo em vez de alterar/remover.`, f.line);
            }
        }
        for (const f of t.files)
            if (f.action === "CRIA" && !createdBy.has(f.path))
                createdBy.set(f.path, t.id);
        // What the loop sees must be exactly what the task declares.
        const extra = t.loopScope.filter((p) => p !== "*" && !declared.has(p) && !(p.endsWith("/") && [...declared].some((d) => d.startsWith(p))));
        for (const p of extra) {
            add("error", t, `O texto cita \`${p}\`, e o loop vai colocá-lo no escopo da fase sem estar declarado. Declare-o ou reescreva sem o caminho (import de teste: use caminho relativo com ../).`);
        }
        if (t.kind === "teste") {
            const first = t.files[0];
            if (!(0, exports.isTestFile)(first.path)) {
                add("error", t, `Tarefa de teste: o primeiro arquivo precisa ser o teste (*.test|spec.ts|tsx|js|mjs).`, first.line);
            }
            for (const f of t.files) {
                if (!(0, exports.isTestFile)(f.path) && f.action !== "CRIA") {
                    add("error", t, `Tarefa de teste não altera código: ${f.action} \`${f.path}\`. Isso é implementação; mova para a tarefa de implementação.`, f.line);
                }
                else if (!(0, exports.isTestFile)(f.path)) {
                    add("warning", t, `\`${f.path}\` numa tarefa de teste: aceito só para fixture/mocks. Código de produção vai na tarefa de implementação.`, f.line);
                }
            }
            if (!t.cases.length)
                add("warning", t, `Tarefa de teste ${t.id} sem \`- Casos:\` (a 2ª opinião confere um caso por valor esperado).`);
            if (!t.run)
                add("warning", t, `Tarefa de teste ${t.id} sem \`- Run:\`.`);
        }
        else {
            for (const f of t.files) {
                if ((0, exports.isTestFile)(f.path))
                    add("error", t, `Tarefa de implementação cita o teste \`${f.path}\`. O loop classifica pelo primeiro arquivo e trava testes por hash: teste vai numa tarefa de teste própria, antes.`, f.line);
            }
            for (const g of t.greens) {
                if (!testTaskIds.has(g))
                    add("warning", t, `Fica verde: ${g} não é uma tarefa de teste deste tasks.md.`);
            }
        }
    }
    // Order inside each group: tests before implementation.
    const byGroup = new Map();
    for (const t of tasks) {
        const k = `${t.group.line}`;
        byGroup.set(k, [...(byGroup.get(k) ?? []), t]);
    }
    let groupIdx = 0;
    for (const list of byGroup.values()) {
        groupIdx++;
        const firstImpl = list.findIndex((t) => t.kind === "impl");
        const lateTest = firstImpl === -1 ? undefined : list.slice(firstImpl).find((t) => t.kind === "teste");
        if (lateTest) {
            add("error", lateTest, `Teste ${lateTest.id} depois de implementação no mesmo grupo: ele nasceria verde e o juiz reprova. Coloque as tarefas de teste primeiro.`);
        }
        const tests = list.filter((t) => t.kind === "teste");
        if (tests.length) {
            for (const t of list.filter((x) => x.kind === "impl")) {
                if (!t.greens.length)
                    add("warning", t, `Tarefa ${t.id} não diz quais testes ficam verdes (\`- Fica verde: ${tests.map((x) => x.id).join(", ")}\`).`);
            }
        }
        if (groupIdx === 1 && opts.fileExists && !hasPkg && tests.length) {
            add("warning", tests[0], "Repo sem package.json: o loop trata o grupo 1 como scaffold (escopo total, sem teste antes). Deixe os testes para o grupo 2.");
        }
    }
    issues.sort((a, b) => a.line - b.line);
    return { tasks, issues };
}
function loopPathsCover(scope, p) {
    return scope.includes("*") || scope.includes(p) || scope.some((s) => s.endsWith("/") && p.startsWith(s));
}
/** Reverse index: which tasks touch each file, in document order. */
function buildFileMap(tasks) {
    const map = new Map();
    for (const t of tasks) {
        for (const f of t.files) {
            const row = map.get(f.path) ?? { path: f.path, touches: [] };
            row.touches.push({ taskId: t.id, action: f.action, kind: t.kind });
            map.set(f.path, row);
        }
    }
    return [...map.values()].sort((a, b) => a.path.localeCompare(b.path));
}
/** The phases the loop will run: consecutive tasks of the same kind inside a group. */
function loopPhases(tasks) {
    const out = [];
    for (const t of tasks) {
        const last = out[out.length - 1];
        if (last && last.key === t.group.line && last.kind === t.kind) {
            last.taskIds.push(t.id);
            last.scope = [...new Set([...last.scope, ...t.loopScope])];
        }
        else {
            out.push({ group: `${t.group.n}. ${t.group.title}`, kind: t.kind, taskIds: [t.id], scope: [...t.loopScope], key: t.group.line });
        }
    }
    return out.map(({ key: _k, ...rest }) => rest);
}
//# sourceMappingURL=tasks-md.js.map