# Revisão das PRs Mesa Certa — 06/10/2026

Revisão executada pelo mesmo autor das implementações, em uma etapa separada de leitura dos diffs, rastreio dos caminhos de escrita/autorização e tentativa de bypass pela API. Não é uma revisão independente nem um APPROVE registrado no GitHub. Nenhuma PR foi integrada nesta revisão.

Base conferida: `origin/main` a4c062b. MCT-54 (#23) e MCT-55 (#26) já estavam integradas por outra ação; foram incluídas na regressão de sessão/persistência. PRs #28–#33 continuam com base main. As dependências cumulativas foram autorizadas pelo usuário e permanecem identificadas nas descrições.

## Achados corrigidos

| Prioridade | PR | Problema confirmado | Correção | Evidência de comando |
|---|---|---|---|---|
| Alta | MCT-60 #29 | A RLS `FOR ALL` da tabela normalizada de tarefas permitia a staff renomear tarefas atribuídas e outras mutações além de status. Uma requisição PATCH de título com JWT staff retornou HTTP 204 antes da correção. | Policies distintas por operação; trigger invoker compara os campos e admite somente status para staff. INSERT e DELETE ficam com fundador/diretor. Migração `20261006165410_restrict_staff_task_writes.sql`. | `node scripts/test-mct60.mjs`: [roles.txt](evidencias/mct46/roles.txt), linhas `REVIEW normalized task`: PATCH título/prioridade/descrição/atribuição e INSERT HTTP 403/42501; DELETE afeta zero linhas, confirmado por leitura independente; status staff e título diretor são permitidos. |
| Alta | MCT-57 #28 | O formulário de entrada chamava `event_join` e recarregava todos os documentos sem aguardar a gravação das alterações locais. O teste antes da correção observou `join,reload` sem `save`. | Aguardar `flush()`; falha interrompe entrada/recarga e mostra erro. | `node scripts/test-join-save.mjs`: [join-save.txt](evidencias/revisao/mct46/join-save.txt), falha produz somente `save`, zero RPCs de entrada/recargas e rota conservada; sucesso executa `save,join,reload` nesta ordem. |

As duas correções estão nas branches dependentes de MCT-58, MCT-59 e MCT-46. A MCT-60 incorpora também a correção de MCT-57. A MCT-64 permanece documental e independente.

## Escopo conferido e resultado

| Issue / PR | Leitura e verificação | Resultado no escopo revisado |
|---|---|---|
| MCT-54 / #23 | AuthContext, ProtectedRoute, callbacks de renovação/expiração, identidade e conservação da árvore/formulário. | Teste de sessão passa; nenhum novo achado impeditivo identificado. |
| MCT-55 / #26 | EventContext, escrita por revisão, erro/retry, export/import e useEventField; regressão usando o fluxo atual por evento. | Teste de duas sessões independentes, ausência de storage como fonte, falha de rede, backup e conflito passa. Achado de recarga na corrente posterior corrigido em #28. |
| MCT-57 / #28 | Criação, código, convite/papel, revogação, entrada e auditoria; bootstrap de convidados sem membership organizacional. | Achado de perda de edição corrigido; convites e interface passam na corrente integrada local. |
| MCT-60 / #29 | Projeção staff, acesso direto às tabelas/endpoint legado, validação de tarefas, promoção/rebaixamento e navegação. | Achado da API direta corrigido; negações comprovadas com JWT restrito. |
| MCT-58 / #30 | Equipe real, fundador derivado, edição de contato, conservação de login, remoção lógica, recusa de código/convite antigo e preservação de histórico. | Teste da interface + API passa; nenhum novo achado impeditivo identificado. |
| MCT-59 / #31 | Isolamento de catálogo, confirmação/criação, sugestões, contagem por conta distinta, arquivamento, conservação de textos e ordem de locks. | Teste de catálogo e RLS passa; nenhum novo achado impeditivo identificado. |
| MCT-46 / #32 | Flag administrativa, seed, ausência de autorização por user_metadata, RPC único, limite na interface e lock por conta entre organizações. | Teste de bypass, flag restrita e criação concorrente passa; nenhum novo achado impeditivo identificado. |
| MCT-64 / #33 | Proposta de liberação no servidor, estados/prazos/identidade, idempotência, pedido de acesso, estimativa e limites da spike. | Documento cobre os caminhos e decisões pendentes; `git diff` comprova ausência de alteração em aplicação/Auth/banco/configuração. Não constitui implementação de bloqueio de cadastro. |

## Saídas reproduzíveis

- `node scripts/check-pr-review.mjs mct57|mct60|mct58|mct59|mct46`: saídas separadas em `docs/evidencias/revisao/<issue>/`, incluindo lint, typecheck, build, motor e teste novo de entrada. A MCT-60 inclui também o teste de papéis/API direta.
- `node scripts/check-mct46.mjs`: regressão completa da corrente no banco **local** com todas as migrações, em `docs/evidencias/mct46/`. Todos os comandos encerraram com `EXIT_CODE=0`; motor 9/9. Este teste também cobre as MCT-54 e MCT-55 já integradas.
- Na branch MCT-64: `node docs/evidencias/mct64/check.mjs`, evidências próprias de critérios, diff sem código e quatro verificações obrigatórias.
- `npx --yes supabase db advisors --local --type security --level warn`: [review-advisors.txt](evidencias/mct60/review-advisors.txt). Único aviso: policy antiga de INSERT em organizações com `WITH CHECK true`. O privilégio já foi revogado na migração de bootstrap; [organization-insert.txt](evidencias/revisao/mct60/organization-insert.txt) comprova HTTP 403/42501 por falta de INSERT. Nenhuma policy de outro escopo foi alterada.

Os testes de API usaram contas e eventos sintéticos locais. Não houve migração remota, exclusão de dados de cliente, merge ou deploy de produção.

## Condições para integração e aplicação

1. Revisar/integrar a corrente #28 → #29 → #30 → #31 → #32. A #33 é independente. Incorporar as correções posteriores junto às dependências; branches contêm cherry-picks com hashes diferentes e diffs iguais. Não são seis implementações independentes do mesmo backend.
2. Conferir fundadores do legado antes de aplicar migrações reais: documentos antigos não registram o criador autenticado e usam o proprietário mais antigo da organização como fallback. Isso não prova a autoria de cada evento; a nova criação registra `auth.uid()` corretamente. Organizações sem proprietário e IDs duplicados interrompem a migração.
3. Conferir registros normalizados externos e sua correspondência de ID com `platform_events`, além de nomes de catálogo maiores que 80 caracteres. Nenhum vínculo foi inferido por nome e nenhum valor foi truncado.
4. Aplicar o conjunto versionado de migrações e a versão correspondente da aplicação de forma coordenada. Aplicação nova com banco antigo não possui os RPCs necessários. A migração corretiva tem timestamp posterior às demais; se migrações forem aplicadas por PR isoladamente, o responsável deve conferir versões anteriores pendentes antes de continuar. Não houve ensaio com dados reais.
5. A integração Git da Vercel pode publicar main automaticamente, conforme `docs/unificacao.md`; o veto a deploy de produção continua vigente. Esta revisão não autoriza merge/deploy nem aplicação em banco real.

As sobreposições com o outro agente seguem limitadas e descritas nas PRs: EventContext/Events/CreateEvent, AppLayout/Sidebar/TopBar, Tasks e policies de notificações/tipos. Não foram feitas alterações no motor ou redesenhos adicionais das telas dessas issues.

## Reversão

Reverter a correção do fluxo de entrada somente por commit revisado, considerando que voltaria a permitir recarga sem salvar. A correção de acesso não deve ser revertida restaurando a antiga policy ampla: manter a restrição no banco ou produzir uma migração compensatória com autorização equivalente. Conservar tarefas, atribuições, memberships removidas, catálogos e auditoria. A spike reverte apenas documentação. As instruções específicas de reversão das oito entregas permanecem nos documentos e descrições originais.
