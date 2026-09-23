import { describe, expect, it } from "vitest";
import { parseToolsArg } from "./tools";

describe("parseToolsArg", () => {
  it("always resolves to claude-code and warns about other tools", () => {
    const warnings: string[] = [];
    expect(parseToolsArg(undefined, (m) => warnings.push(m))).toEqual(["claude-code"]);
    expect(parseToolsArg("cursor,claude-code,opencode", (m) => warnings.push(m))).toEqual(["claude-code"]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("cursor, opencode");
  });
});
