# /specloop-plan (requisitos → change OpenSpec pronta para o loop)

Você transforma os requisitos do usuário numa change OpenSpec com critérios de aceite testáveis e um `tasks.md` do qual sai o `phases.md` que o loop externo (`ralph-loop.mjs` + `judge.mjs`) executa sem ajuste: cada tarefa declara exatamente os arquivos que cria, altera ou remove, e cada teste é uma tarefa própria que declara o arquivo de teste que cria.

A implementação NÃO acontece nesta sessão. Ela roda depois, no terminal, pelo loop. Não escreva código de produto nem testes aqui.

## Entregáveis
- `openspec/changes/<change>/proposal.md`
- `openspec/changes/<change>/specs/<domínio>/spec.md` (quantos precisar)
- `openspec/changes/<change>/tasks.md`
- `openspec/changes/<change>/phases.md`, gerado por `specloop phases` (nunca escrito à mão)
- `CLAUDE.md` com a seção `## Comandos` preenchida (o juiz roda esses comandos)

## Procedimento
1. Leia `openspec/project.md`, `CLAUDE.md` e as specs relevantes em `openspec/specs/`.
2. Explore o repo: árvore de pastas, onde ficam componentes, estilos e testes, runner e scripts do `package.json`. Os caminhos do `tasks.md` precisam ser reais e seguir as convenções do projeto.
3. Escolha um nome kebab-case para a change (ex.: `add-prize-card`).
4. `proposal.md`: por quê, o quê, fora de escopo, riscos e uma seção **Arquivos impactados** com a lista completa.
5. Spec deltas em `specs/` com `## ADDED Requirements`, `## MODIFIED Requirements`, `## REMOVED Requirements`. Linguagem MUST/SHALL; todo `### Requirement:` tem pelo menos um `#### Scenario:`.
6. `tasks.md` no formato abaixo.
7. `CLAUDE.md`, seção `## Comandos`: um bloco de código com um comando por linha (typecheck, lint, testes, build, na ordem). Se o `package.json` ainda não existe, escreva os comandos que o scaffold vai criar.
8. Se o CLI do OpenSpec estiver instalado (`openspec --version`), rode `openspec validate <change> --strict` e corrija o formato do proposal e das spec deltas. Sem ele, confira as regras do passo 5 à mão.
9. Rode `specloop tasks check <change>` e corrija todo ERRO e AVISO.
10. Rode `specloop phases <change>`: ele gera o `phases.md` (uma seção por sessão do loop, com tipo e escopo). Se o usuário deu um limite de fases, passe `--max-fases N`. Mudou o `tasks.md` depois? Rode de novo: o loop recusa `phases.md` de outra versão do `tasks.md`.

## Formato do tasks.md (obrigatório)

```markdown
# Tasks: <change>

## 1. <Grupo: uma fatia de comportamento>

**Goal**: <uma linha>

- [ ] 1.1 Testes de <comportamento>
    - CRIA `tests/unit/<nome>.test.ts`
    - Casos:
        - <situação>: <entrada> → <valor esperado exato>
        - <situação>: <entrada> → <valor esperado exato>
    - Import: `import X from '../../src/<caminho>/X.ts'`
    - Run: `<comando que roda só este arquivo>`
- [ ] 1.2 <Implementação>
    - CRIA `src/<caminho>/X.ts`
    - CRIA `src/styles/<nome>.css`
    - ALTERA `index.html` — <o que muda>
    - Fica verde: 1.1
```

### Regras que o loop e o juiz impõem
1. Grupos são `## N. Título`; tarefas são `- [ ] N.M Título`. Detalhes da tarefa recuados **4 espaços**. Sem caixa `[ ]` aninhada.
2. Cada tarefa lista TODOS os arquivos que toca, um por linha, com `CRIA`, `ALTERA` ou `REMOVE` e o caminho entre crases, relativo à raiz, sem glob. Isso inclui: HTML e templates, componentes (`.vue`, `.tsx`, `.svelte`), CSS/SCSS e tokens, config (`package.json`, `vite.config.ts`, `tsconfig.json`), assets, fixtures e testes. `ALTERA`/`REMOVE` têm uma nota curta do que muda.
3. `CRIA` só para arquivo que ainda não existe; se uma tarefa anterior cria, as seguintes usam `ALTERA`.
4. **Tarefa de teste**: o primeiro arquivo é o teste, com nome `*.test.ts|tsx|js|mjs` ou `*.spec.*`. Ela só CRIA (o teste e fixtures). Liste em `Casos` cada caso com o valor esperado exato — a 2ª opinião do loop confere um teste por valor. O alvo aparece só em `Import`, com caminho relativo começando por `../` (o loop ignora caminhos com `..`; qualquer outro caminho citado entraria no escopo da fase de teste e liberaria escrever implementação nela).
5. **Tarefa de implementação**: nunca cita arquivo de teste. Termina com `- Fica verde: <ids das tarefas de teste>`.
6. Em cada grupo: tarefas de teste primeiro, implementação depois. O loop roda cada bloco como uma fase; teste escrito depois da implementação nasce verde e o juiz reprova.
7. Teste existente nunca é `ALTERA` nem `REMOVE` (o juiz trava por hash). Caso novo em outro grupo = arquivo de teste novo.
8. Todo caminho que aparece no texto da tarefa vira escopo da fase. Não cite caminho em `Casos`, notas ou título sem declará-lo.
9. Repo sem `package.json`: o grupo 1 é o scaffold (instala runner, cria config e scripts), sem tarefa de teste. Os testes começam no grupo 2.
10. Não escreva `### ... teste antes ...`, `**Plano de teste**` nem linha que comece com `**Teste`: o loop lê isso como plano e desliga a separação teste → implementação.
11. Fatias pequenas: um grupo por comportamento, que caiba numa sessão.
12. Nunca cite `CLAUDE.md`, `AGENTS.md`, `openspec/`, `design/`, `ralph-loop.mjs` ou `judge.mjs` como arquivo de tarefa: são infraestrutura do loop.

## Saída
Resuma os arquivos criados, mostre a saída de `specloop phases <change>` e diga o próximo passo:

Uma linha por comando, separados por `;` (o PowerShell 5.1 não tem `&&`; `git init` num repositório que já existe não muda nada):

```powershell
git init; git add -A; git commit -m "spec: <change>"
node <caminho>/ralph-loop.mjs --listar
node <caminho>/ralph-loop.mjs --demo
```
