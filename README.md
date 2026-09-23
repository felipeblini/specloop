# specloop

Planejamento OpenSpec para Claude Code, com um `phases.md` pronto para o loop externo (`ralph-loop.mjs` + `judge.mjs`). Cada tarefa declara os arquivos que cria, altera ou remove — HTML, CSS e testes inclusive — e cada teste é uma tarefa própria, antes da implementação.

Fork de [wenqingyu/ralphy-openspec](https://github.com/wenqingyu/ralphy-openspec) 0.3.6 (commit `0c1cf7a`). Veja o [CHANGELOG](CHANGELOG.md).

## OpenSpec

O specloop usa o **formato** do OpenSpec — `openspec/specs/` como fonte da verdade, uma pasta por change em `openspec/changes/<change>/` com `proposal.md`, spec deltas (`## ADDED/MODIFIED/REMOVED Requirements`, `#### Scenario:`) e `tasks.md`. Quem escreve esses arquivos é o Claude, seguindo o `/specloop-plan`. O CLI do OpenSpec (`npm i -g @fission-ai/openspec`) é opcional: se estiver instalado, o plan roda `openspec validate --strict` e o archive usa `openspec archive`.

## Fluxo

```
/specloop-plan  →  specloop phases  →  commit  →  node ralph-loop.mjs (terminal)  →  /specloop-validate  →  /specloop-archive
   (sessão)                     (fora da sessão)               (sessão)                (sessão)
```

A implementação não acontece dentro do Claude Code: ela roda no terminal pelo `ralph-loop.mjs`, fase a fase, com o `judge.mjs` como árbitro. Os dois ficam fora do projeto (ex.: `C:\dev\loop-kit\`).

## Instalação

Fora do npm, direto do GitHub (o `dist/` compilado vai no repositório; mudou o código, `npm run build` antes do commit):

```bash
npm install -g github:felipeblini/specloop
specloop --version
```

Do código local, para desenvolver:

```bash
npm install
npm run build
npm install -g .        # link para esta pasta: build novo vale na hora
```

No projeto:

```bash
specloop init
```

Cria `.claude/commands/specloop-*.md`, `openspec/` (`specs/`, `changes/`, `changes/archive/`, `project.md`) e, se não existir, `CLAUDE.md` com a seção `## Comandos` preenchida a partir dos scripts do `package.json` (o `ralph-loop.mjs` exige o `CLAUDE.md`; o `judge.mjs` roda esses comandos). `specloop update` atualiza os comandos e apaga os antigos `ralphy-*.md`.

## phases.md

O `tasks.md` é para gente: grupos, tarefas, casos. O loop precisa de outra coisa: uma
seção por sessão, com o tipo (`teste`|`impl`) e o escopo. `specloop phases [change]`
faz essa derivação uma vez e grava `openspec/changes/<change>/phases.md`:

```markdown
# Phases: add-prize-card

<!-- specloop: {"fonte":"tasks.md","sha256":"…"} -->

## Phase 1: Card do brinde — testes
<!-- loop: {"tipo":"teste","arquivos":["tests/unit/prize-card.test.ts"],"tarefas":["1.1"]} -->

**Goal**: mostrar cada brinde cadastrado como um card na home

- [ ] 1.1 Testes do card do brinde
    - CRIA `tests/unit/prize-card.test.ts`
    - …
```

- Só gera se o `tasks check` não tiver ERRO. `--max-fases N` recusa plano grande.
- O escopo é o que as tarefas declaram (`CRIA`/`ALTERA`/`REMOVE`).
- O `ralph-loop.mjs` prefere o `phases.md` ao `tasks.md` e recusa um `phases.md` cujo
  sha256 não bate com o `tasks.md` atual: mudou o plano, rode `specloop phases` de novo.
- Regras de fase e "Pronto quando" são do loop, não entram no arquivo.

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
specloop tasks files [change] --fases    # as fases que o ralph-loop.mjs vai rodar (igual ao ralph-loop.mjs --listar)
specloop phases [change] [--max-fases N] # grava o phases.md que o ralph-loop.mjs executa
specloop validate                        # confere a instalação no projeto
```

`[change]` é opcional quando só há uma change em `openspec/changes/`.

`specloop tasks check` replica a leitura do `ralph-loop.mjs` (grupos, recuo, extração de caminhos, tipo teste/impl) e as regras do `judge.mjs` (padrão de arquivo de teste, trava por hash, infraestrutura). Se você mudar o parser do loop, atualize `src/core/spec/tasks-md.ts` — os espelhos estão marcados no topo do arquivo.

## Créditos

- **[ralphy-openspec](https://github.com/wenqingyu/ralphy-openspec)** por Wenqing Yu (upstream)
- **[Ralph Methodology](https://ghuntley.com/ralph)** por Geoffrey Huntley
- **[OpenSpec](https://github.com/Fission-AI/OpenSpec)** por Fission-AI

## Licença

BSD-3-Clause (licença do upstream mantida em [LICENSE](LICENSE)).
