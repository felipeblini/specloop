import { describe, expect, it } from "vitest";
import { parseTasksMd } from "./tasks-md";
import { buildPhasesMd, sha256 } from "./phases-md";

const TASKS = `# Tasks: add-prize-card

## 1. Card do brinde

**Goal**: mostrar cada brinde como card

- [ ] 1.1 Testes do card
    - CRIA \`tests/unit/prize-card.test.ts\`
    - Casos:
        - nome "Caneca" → texto "Caneca"
    - Import: \`import PrizeCard from '../../src/components/PrizeCard.vue'\`
    - Run: \`npx vitest run tests/unit/prize-card.test.ts\`
- [ ] 1.2 Componente do card
    - CRIA \`src/components/PrizeCard.vue\`
    - ALTERA \`index.html\` — preload da fonte
    - Fica verde: 1.1

## 2. Rodapé

- [ ] 2.1 Rodapé fixo
    - CRIA \`src/components/Rodape.vue\`
`;

const gerar = (hasPackageJson = true) =>
  buildPhasesMd(parseTasksMd(TASKS).tasks, { change: "add-prize-card", tasksSha256: sha256(TASKS), hasPackageJson });

const blocos = (text: string) => text.split(/^## /m).slice(1);
const meta = (bloco: string) => JSON.parse(/<!-- loop: (\{.*\}) -->/.exec(bloco)![1]);

describe("buildPhasesMd", () => {
  it("um grupo com teste e impl vira duas fases; grupo sem teste vira uma, sem sufixo", () => {
    const { text, count } = gerar();
    expect(count).toBe(3);
    const b = blocos(text);
    expect(b.map((x) => x.split("\n")[0])).toEqual([
      "Phase 1: Card do brinde — testes",
      "Phase 2: Card do brinde — implementação",
      "Phase 3: Rodapé",
    ]);
  });

  it("o escopo é o que as tarefas declaram, e o tipo vem de cada bloco", () => {
    const b = blocos(gerar().text);
    expect(meta(b[0])).toEqual({ tipo: "teste", arquivos: ["tests/unit/prize-card.test.ts"], tarefas: ["1.1"] });
    expect(meta(b[1])).toEqual({ tipo: "impl", arquivos: ["src/components/PrizeCard.vue", "index.html"], tarefas: ["1.2"] });
  });

  it("carrega o Goal e as linhas da tarefa como foram escritas", () => {
    const b = blocos(gerar().text);
    expect(b[0]).toContain("**Goal**: mostrar cada brinde como card");
    expect(b[0]).toContain("- [ ] 1.1 Testes do card\n    - CRIA `tests/unit/prize-card.test.ts`");
    expect(b[0]).toContain('        - nome "Caneca" → texto "Caneca"');
    expect(b[2]).not.toContain("**Goal**");
  });

  it("só `## Phase N:` no nível 2, e o sha256 do tasks.md no cabeçalho", () => {
    const { text } = gerar();
    expect(text.match(/^## .*$/gm)!.every((h) => /^## Phase \d+: /.test(h))).toBe(true);
    expect(text).toContain(`"sha256":"${sha256(TASKS)}"`);
  });

  it("repo sem package.json: a primeira fase é o scaffold, escopo `*`", () => {
    expect(meta(blocos(gerar(false).text)[0]).arquivos).toEqual(["*"]);
  });
});
