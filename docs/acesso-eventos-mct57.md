# Entrada por evento — MCT-57

O criador autenticado recebe `founder` em uma transação no banco. O cliente não escolhe esse papel. Código sem convite concede `staff`; link individual concede `staff` ou `director` conforme o convite no banco. Estas duas decisões foram confirmadas pelo responsável do produto.

`platform_events` preserva IDs e documentos completos, agora com revisão por evento. `event_members` é o vínculo de acesso. Entrar não adiciona ninguém à organização. `event_join_log` registra conta, horário, papel, origem e convite. Convites e códigos podem ser revogados pelo fundador. A revogação impede entradas futuras; não remove acessos já concedidos. Aceitar novamente não rebaixa o fundador nem muda um papel existente.

## Migração e conservação

A migração copia os documentos de `platform_workspaces`, sem excluir ou modificar os originais. Como os documentos antigos não registravam o criador autenticado, usa-se o proprietário mais antigo da organização como fundador, conforme esclarecimento aprovado. Outros proprietários/administradores conservam acesso como diretores e membros como staff. Eventos novos sempre usam `auth.uid()` do criador. A MCT-60 refina os módulos acessíveis por papel.

Antes de aplicar fora do ambiente local, verificar IDs de eventos duplicados entre organizações e organizações com eventos sem proprietário: a primeira situação causa falha transacional; a segunda impede a cópia desses documentos. Resolver com evidência sobre os responsáveis antes de executar. O backup original permanece no banco. Nesta entrega somente o banco local recebeu migração.

O frontend lê e grava os documentos por RPC, com compare-and-swap por evento. A importação de arquivo passa pela mesma transação de criação. Se um lote falhar parcialmente, os eventos já importados ficam conservados; reexportar e importar apenas os pendentes, sem sobrescrever IDs.

## Evidências

`node scripts/check-mct57.mjs` grava saídas em `docs/evidencias/mct57/`. `acceptance.txt` demonstra CA1–CA4, inclusive negação HTTP 403/SQLSTATE 42501 ao tentar elevar papel com JWT staff e ausência de linhas para terceiro. `persistence.txt` repete a persistência entre clientes, recuperação de erro e conflito de revisão com o contexto real. `focus.txt` verifica a estabilidade da sessão. Nenhuma credencial é gravada nas evidências.

Não há envio de e-mail, provedor pago ou fechamento do cadastro. Links guardam código e convite enquanto a pessoa entra ou cria a conta.

## Riscos e arquivos compartilhados

As políticas de módulos ficam para MCT-60. O documento antigo por organização continua com suas políticas anteriores nesta etapa. Compartilha `App.jsx`, `Events.jsx`, `CreateEvent.jsx`, `EventSettings.jsx`, `ProtectedRoute.jsx` e `EventContext.jsx` com telas/integracões de outras issues. A substituição do convite por organização é necessária para o contrato de acesso por evento. Não foram redesenhados busca, notificações, programação, tarefas ou as demais telas do outro agente.

## Reversão

Reverter o commit antes da aplicação da migração é suficiente. Depois de receber dados, não remover tabelas nem retornar diretamente ao snapshot antigo: exportar os documentos atuais e produzir migração compensatória de consolidação em `platform_workspaces`, preservando todas as versões e registrando responsáveis. Reverter a interface somente após conferir essa cópia. As tabelas de convite e auditoria ficam conservadas; revogar convites ativos se o fluxo for desabilitado.
