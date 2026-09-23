# /specloop-archive (arquivar a change concluída)

## Pré-condições
- Todas as tarefas do `tasks.md` concluídas pelo loop (`.loop/relatorio.md` diz COMPLETO)
- `/specloop-validate` sem pendências
- Spec deltas refletem o comportamento final

## Passos
1. Rode os comandos da seção `## Comandos` do `CLAUDE.md` e confirme verde.
2. Marque as tarefas como `[x]` no `tasks.md`.
3. Se o CLI do OpenSpec estiver disponível: `openspec archive <change> --yes`.
   Senão, mova `openspec/changes/<change>/` para `openspec/changes/archive/<AAAA-MM-DD>-<change>/` (mesmo destino do CLI) e aplique as spec deltas em `openspec/specs/`.
4. Confira que `openspec/specs/` ficou atualizado.

## Saída
Resumo curto do que mudou, a lista final de arquivos (`npx specloop tasks files <change> --by-file`) e como testar.
