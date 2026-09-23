"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectExistingTools = detectExistingTools;
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
async function detectExistingTools(projectDir) {
    return (await exists(node_path_1.default.join(projectDir, ".claude"))) ? ["claude-code"] : [];
}
//# sourceMappingURL=detector.js.map