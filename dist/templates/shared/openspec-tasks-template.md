# Modelo do tasks.md (specloop)

Estrutura de `openspec/changes/<change>/tasks.md`. Ela é lida por duas pontas:
por você, e pelo `specloop phases`, que transforma cada grupo em fases de **teste**
e de **implementação** no `phases.md` — o documento que o loop externo
(`ralph-loop.mjs` + `judge.mjs`) executa, com os arquivos declarados em cada tarefa
como escopo da fase. Confira e gere com:

```bash
specloop tasks check <change>
specloop phases <change>
```

## Regras

1. Grupos são `## N. Título`. Tarefa fora de um grupo assim é ignorada pelo loop.
2. Tarefa é `- [ ] N.M Título`. Tudo que detalha a tarefa fica recuado **4 espaços**
   (o loop descarta linhas com 1–3 espaços). Nada de caixa `[ ]` aninhada.
3. Cada tarefa lista **todos** os arquivos que toca, um por linha:
   `- CRIA \`caminho\``, `- ALTERA \`caminho\` — o quê`, `- REMOVE \`caminho\` — por quê`.
   Isso inclui HTML, componentes, CSS, config, fixtures e testes. Caminho concreto,
   relativo à raiz, sem glob.
4. **Tarefa de teste** = o primeiro arquivo é um teste (`*.test|spec.ts|tsx|js|mjs`).
   Ela só CRIA: o teste (e, se precisar, fixtures). Lista os `Casos` com o valor
   esperado de cada um e o `Run`. O alvo do teste aparece só no `Import`, com caminho
   relativo começando por `../` — assim o loop não o põe no escopo da fase de teste.
5. **Tarefa de implementação** não cita arquivo de teste. Diz quais testes ficam
   verdes: `- Fica verde: 2.1`.
6. Dentro de um grupo: testes primeiro, implementação depois. O juiz reprova teste
   que nasce verde.
7. Teste nunca é ALTERA nem REMOVE: o juiz trava testes por hash quando a fase
   fecha. Caso novo = arquivo de teste novo.
8. Nenhuma outra menção a caminho no texto da tarefa: todo caminho citado vira
   escopo da fase. Precisa mencionar? Declare-o.
9. Repo sem `package.json`: o grupo 1 é o scaffold (o loop libera a árvore inteira
   e não roda teste antes). Os testes começam no grupo 2.
10. Não use `### ... teste antes ...`, `**Plano de teste**` nem linha começando com
    `**Teste`: o loop lê isso como plano e desliga a separação teste → implementação.

## Exemplo

```markdown
# Tasks: add-prize-card

## 1. Card do brinde

**Goal**: mostrar cada brinde cadastrado como um card na home

- [ ] 1.1 Testes do card do brinde
    - CRIA `tests/unit/prize-card.test.ts`
    - Casos:
        - mostra o nome recebido: nome "Caneca" → texto "Caneca" no card
        - usa a imagem recebida: url "/img/caneca.png" → atributo src igual
        - selecionado: prop selected true → classe is-selected no card
    - Import: `import PrizeCard from '../../src/components/PrizeCard.vue'`
    - Run: `npx vitest run tests/unit/prize-card.test.ts`
- [ ] 1.2 Componente do card do brinde
    - CRIA `src/components/PrizeCard.vue`
    - CRIA `src/styles/prize-card.css`
    - ALTERA `index.html` — preload da fonte do título
    - Fica verde: 1.1

## 2. Lista de brindes na home

- [ ] 2.1 Testes da lista na home
    - CRIA `tests/unit/home-prizes.test.ts`
    - Casos:
        - sem brindes: lista vazia → mensagem "Nenhum brinde cadastrado ainda."
        - com dois brindes → dois cards, na ordem de cadastro
    - Import: `import HomeView from '../../src/views/HomeView.vue'`
    - Run: `npx vitest run tests/unit/home-prizes.test.ts`
- [ ] 2.2 Lista de cards na home
    - ALTERA `src/views/HomeView.vue` — renderiza um card por brinde
    - ALTERA `src/styles/prize-card.css` — grade dos cards
    - Fica verde: 2.1
```
