"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDistTemplatesDir = getDistTemplatesDir;
exports.resolveProjectDir = resolveProjectDir;
const node_path_1 = __importDefault(require("node:path"));
function getDistTemplatesDir() {
    // Compiled files live in dist/**. This resolves dist/templates.
    return node_path_1.default.resolve(__dirname, "..", "templates");
}
function resolveProjectDir(dirArg) {
    return node_path_1.default.resolve(process.cwd(), dirArg ?? ".");
}
//# sourceMappingURL=paths.js.map