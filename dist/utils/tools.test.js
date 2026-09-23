"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const tools_1 = require("./tools");
(0, vitest_1.describe)("parseToolsArg", () => {
    (0, vitest_1.it)("always resolves to claude-code and warns about other tools", () => {
        const warnings = [];
        (0, vitest_1.expect)((0, tools_1.parseToolsArg)(undefined, (m) => warnings.push(m))).toEqual(["claude-code"]);
        (0, vitest_1.expect)((0, tools_1.parseToolsArg)("cursor,claude-code,opencode", (m) => warnings.push(m))).toEqual(["claude-code"]);
        (0, vitest_1.expect)(warnings).toHaveLength(1);
        (0, vitest_1.expect)(warnings[0]).toContain("cursor, opencode");
    });
});
//# sourceMappingURL=tools.test.js.map