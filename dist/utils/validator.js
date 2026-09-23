"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateProject = validateProject;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
async function exists(p) {
    try {
        await promises_1.default.access(p);
        return true;
    }
    catch {
        return false;
    }
}
async function validateProject(projectDir, tools) {
    const issues = [];
    const openspecDir = node_path_1.default.join(projectDir, "openspec");
    if (!(await exists(openspecDir))) {
        issues.push({
            level: "error",
            message: "Missing openspec directory. Run `specloop init`.",
            path: "openspec/",
        });
        return issues;
    }
    for (const p of ["openspec/specs", "openspec/changes", "openspec/project.md"]) {
        if (!(await exists(node_path_1.default.join(projectDir, p)))) {
            issues.push({ level: "error", message: `Missing ${p}`, path: p });
        }
    }
    if (tools.includes("claude-code")) {
        const p = ".claude/commands/specloop-plan.md";
        if (!(await exists(node_path_1.default.join(projectDir, p)))) {
            issues.push({ level: "warning", message: `Missing ${p}`, path: p });
        }
    }
    if (!(await exists(node_path_1.default.join(projectDir, "CLAUDE.md"))) && !(await exists(node_path_1.default.join(projectDir, "AGENTS.md")))) {
        issues.push({ level: "error", message: "Missing CLAUDE.md (ralph-loop.mjs preflight requires it; judge.mjs reads ## Comandos from it). Run `specloop init`.", path: "CLAUDE.md" });
    }
    return issues;
}
//# sourceMappingURL=validator.js.map