# specloop

Planejamento OpenSpec para Claude Code, com um `tasks.md` pronto para o loop externo (`loop.mjs` + `judge.mjs`). Cada tarefa declara os arquivos que cria, altera ou remove — HTML, CSS e testes inclusive — e cada teste é uma tarefa própria, antes da implementação.

Fork de [wenqingyu/ralphy-openspec](https://github.com/wenqingyu/ralphy-openspec) 0.3.6 (commit `0c1cf7a`). Veja o [CHANGELOG](CHANGELOG.md).

## OpenSpec

O specloop usa o **formato** do OpenSpec — `openspec/specs/` como fonte da verdade, uma pasta por change em `openspec/changes/<change>/` com `proposal.md`, spec deltas (`## ADDED/MODIFIED/REMOVED Requirements`, `#### Scenario:`) e `tasks.md`. Quem escreve esses arquivos é o Claude, seguindo o `/specloop-plan`. O CLI do OpenSpec (`npm i -g @fission-ai/openspec`) é opcional: se estiver instalado, o plan roda `openspec validate --strict` e o archive usa `openspec archive`.

## Fluxo

```
/specloop-plan  →  commit  →  node loop.mjs (terminal)  →  /specloop-validate  →  /specloop-archive
   (sessão)                     (fora da sessão)               (sessão)                (sessão)
```

A implementação não acontece dentro do Claude Code: ela roda no terminal pelo `loop.mjs`, fase a fase, com o `judge.mjs` como árbitro. Os dois ficam fora do projeto (ex.: `C:\dev\loop-kit\`).

## Instalação

Fora do npm. Nesta pasta:

```bash
npm install
npm run build
npm install -g .        # ou: sh scripts/install.sh
```

No projeto:

```bash
specloop init
```

Cria `.claude/commands/specloop-*.md`, `openspec/` (`specs/`, `changes/`, `changes/archive/`, `project.md`) e, se não existir, `CLAUDE.md` com a seção `## Comandos` preenchida a partir dos scripts do `package.json` (o `loop.mjs` exige o `CLAUDE.md`; o `judge.mjs` roda esses comandos). `specloop update` atualiza os comandos e apaga os antigos `ralphy-*.md`.

## Comandos do Claude Code

| Comando | O que faz |
|---------|-----------|
| `/specloop-plan` | Requisitos → proposal, spec deltas, `tasks.md` no formato do loop e `## Comandos` do `CLAUDE.md` |
| `/specloop-validate` | Depois do loop: relatório, juiz manual, auditoria dos arquivos alterados contra os declarados |
| `/specloop-archive` | Arquiva a change concluída |

## Formato do tasks.md

```markdown
## 1. Card do brinde

**Goal**: mostrar cada brinde cadastrado como um card na home

- [ ] 1.1 Testes do card do brinde
    - CRIA `tests/unit/prize-card.test.ts`
    - Casos:
        - mostra o nome recebido: nome "Caneca" → texto "Caneca" no card
    - Import: `import PrizeCard from '../../src/components/PrizeCard.vue'`
    - Run: `npx vitest run tests/unit/prize-card.test.ts`
- [ ] 1.2 Componente do card do brinde
    - CRIA `src/components/PrizeCard.vue`
    - CRIA `src/styles/prize-card.css`
    - ALTERA `index.html` — preload da fonte do título
    - Fica verde: 1.1
```

O loop transforma isso em duas fases: `[teste] tests/unit/prize-card.test.ts` e depois `[impl] src/components/PrizeCard.vue, src/styles/prize-card.css, index.html`. O escopo de cada fase é exatamente o que a tarefa declara.

Regras (conferidas por `specloop tasks check`):

- Grupos `## N. Título`; tarefas `- [ ] N.M`; detalhes recuados 4 espaços, sem caixa aninhada.
- Toda tarefa declara arquivos: `CRIA`/`ALTERA`/`REMOVE` + caminho concreto entre crases (`CREATE`/`MODIFY`/`DELETE` também valem).
- Nenhum caminho não declarado no texto da tarefa: o loop o poria no escopo da fase.
- Tarefa de teste: primeiro arquivo é `*.test|spec.ts|tsx|js|mjs`, só CRIA, lista `Casos` e `Run`; o alvo aparece só no `Import`, com `../`.
- Tarefa de implementação: não cita teste; diz `Fica verde: <ids>`.
- No grupo, testes antes da implementação. Teste nunca é ALTERA/REMOVE (o juiz trava por hash).
- Sem `**Plano de teste**`, `**Teste…` ou `### … teste antes …` (o loop desliga a separação teste → impl).
- Repo sem `package.json`: grupo 1 é o scaffold, sem teste.

Modelo completo: [`src/templates/shared/openspec-tasks-template.md`](src/templates/shared/openspec-tasks-template.md).

## CLI

```bash
specloop tasks check [change]            # valida contra o que o loop e o juiz fazem (--strict, --json)
specloop tasks files [change]            # arquivos por tarefa
specloop tasks files [change] --by-file  # quais tarefas tocam cada arquivo
specloop tasks files [change] --fases    # as fases que o loop.mjs vai rodar (igual ao loop.mjs --listar)
specloop validate                        # confere a instalação no projeto
```

`[change]` é opcional quando só há uma change em `openspec/changes/`.

`specloop tasks check` replica a leitura do `loop.mjs` (grupos, recuo, extração de caminhos, tipo teste/impl) e as regras do `judge.mjs` (padrão de arquivo de teste, trava por hash, infraestrutura). Se você mudar o parser do loop, atualize `src/core/spec/tasks-md.ts` — os espelhos estão marcados no topo do arquivo.

## Créditos

- **[ralphy-openspec](https://github.com/wenqingyu/ralphy-openspec)** por Wenqing Yu (upstream)
- **[Ralph Methodology](https://ghuntley.com/ralph)** por Geoffrey Huntley
- **[OpenSpec](https://github.com/Fission-AI/OpenSpec)** por Fission-AI

## Licença

BSD-3-Clause (licença do upstream mantida em [LICENSE](LICENSE)).
