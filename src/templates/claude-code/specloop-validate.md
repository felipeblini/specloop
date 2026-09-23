# /specloop-validate (conferir o resultado do loop)

Você confere uma change OpenSpec depois que o loop externo terminou (ou parou).

## Objetivo
Provar que a implementação cumpre os requisitos e cenários, que os comandos de verificação passam, e que os arquivos alterados são exatamente os declarados no `tasks.md`.

## Passos
1. Identifique a change em `openspec/changes/`.
2. Leia `.loop/relatorio.md` (se existir): status, commits da execução, se a trava de testes aguentou, e `O que o agente chutou` (dúvidas registradas em `.loop/duvidas.md`).
3. Rode `npx specloop tasks check <change>`.
4. Rode os comandos da seção `## Comandos` do `CLAUDE.md`, e o juiz em modo manual: `node <caminho>/judge.mjs`.
5. Auditoria de arquivos: compare `git diff --name-status <base>..HEAD` (base em `.loop/base.sha`) com a união dos arquivos declarados no `tasks.md`:
   - alterado e não declarado → aponte a tarefa que deveria declará-lo;
   - declarado CRIA/ALTERA e não tocado → tarefa incompleta;
   - declarado REMOVE e ainda existe → tarefa incompleta.
6. Para cada `Casos` das tarefas de teste, confirme que existe um caso com asserção sobre aquele valor.
7. Confira cada `#### Scenario:` das spec deltas contra um teste ou comando que o prove.

Não corrija código nesta sessão. Correções voltam para o `tasks.md` (tarefa nova, em grupo novo) e rodam pelo loop.

## Saída
- O que passou (por tarefa e caso)
- O que falhou, com a próxima ação
- Auditoria de arquivos (não declarados / faltando / ok)
- Dúvidas do agente que precisam de decisão sua
- Cenários sem teste
