"use strict";
/**
 * phases.md: the contract ralph-loop.mjs reads instead of tasks.md.
 *
 * tasks.md is for people (and for the planner): groups, tasks, cases. The loop needs
 * something else — one block per session, with its kind (teste|impl) and its scope.
 * Deriving that inside the loop meant a second copy of this parser, kept in sync by
 * hand. Here the derivation happens once, in the planner, and the loop reads a strict
 * format with no heuristics:
 *
 *   # Phases: <change>
 *
 *   <!-- specloop: {"fonte":"tasks.md","sha256":"<hex of tasks.md bytes>"} -->
 *
 *   ## Phase 1: <group> — testes
 *   <!-- loop: {"tipo":"teste","arquivos":["tests/x.test.js"],"tarefas":["1.1"]} -->
 *
 *   **Goal**: <group goal>
 *
 *   - [ ] 1.1 <task title>
 *       - CRIA `tests/x.test.js`
 *       - Casos: ...
 *
 * Only `## Phase N:` at level 2. The scope (`arquivos`) is what the tasks DECLARE
 * (CRIA/ALTERA/REMOVE), which `tasks check` already forces to equal what the loop would
 * have extracted from the text. The sha256 lets the loop refuse a phases.md generated
 * from an older tasks.md.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha256 = void 0;
exports.buildPhasesMd = buildPhasesMd;
const node_crypto_1 = require("node:crypto");
const tasks_md_1 = require("./tasks-md");
const sha256 = (bytes) => (0, node_crypto_1.createHash)("sha256").update(bytes).digest("hex");
exports.sha256 = sha256;
function buildPhasesMd(tasks, opts) {
    const byId = new Map(tasks.map((t) => [t.id, t]));
    const phases = (0, tasks_md_1.loopPhases)(tasks);
    // How many phases each group became: the "— testes/implementação" suffix only when split.
    const perGroup = new Map();
    for (const p of phases)
        perGroup.set(p.group, (perGroup.get(p.group) ?? 0) + 1);
    const out = [
        `# Phases: ${opts.change}`,
        "",
        `<!-- specloop: ${JSON.stringify({ fonte: "tasks.md", sha256: opts.tasksSha256 })} -->`,
        "",
        "Gerado por `specloop phases` a partir do tasks.md. Não edite: mude o tasks.md e rode de novo.",
    ];
    phases.forEach((p, i) => {
        const list = p.taskIds.map((id) => byId.get(id));
        const group = list[0].group;
        // Repo without package.json: the first group is the scaffold. The loop used to give
        // it the whole tree (`*`) — it creates configs and lockfiles no task can list.
        const scaffold = i === 0 && !opts.hasPackageJson;
        const arquivos = scaffold ? ["*"] : [...new Set(list.flatMap((t) => t.files.map((f) => f.path)))];
        const titulo = (perGroup.get(p.group) ?? 1) > 1
            ? `${group.title} — ${p.kind === "teste" ? "testes" : "implementação"}`
            : group.title;
        out.push("", `## Phase ${i + 1}: ${titulo}`, `<!-- loop: ${JSON.stringify({ tipo: p.kind, arquivos, tarefas: p.taskIds })} -->`, "");
        if (group.goal)
            out.push(`**Goal**: ${group.goal}`, "");
        for (const t of list)
            out.push(...t.raw);
    });
    return { text: out.join("\n") + "\n", count: phases.length };
}
//# sourceMappingURL=phases-md.js.map