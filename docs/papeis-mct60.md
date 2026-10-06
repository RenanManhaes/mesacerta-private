# Papéis por evento — MCT-60

Fundador é a conta que criou o evento. Diretor acessa todos os módulos habilitados do evento. Staff acessa somente suas tarefas, participantes e programação. O vínculo fica em `event_members`, não em metadados editáveis da conta ou no documento de interface.

O menu usa a mesma lista permitida da proteção de rotas. O banco controla o acesso independentemente dela: `event_list` projeta os campos autorizados, filtra tarefas por ID da membership ou conta autenticada, e restringe os rascunhos ao próprio usuário e aos três módulos. `event_save` recusa campos adicionais, alterações em outras tarefas ou responsável; staff muda apenas o status de tarefas atribuídas. A projeção é mesclada com o documento completo no banco sob revisão otimista, conservando dados privados.

O endpoint direto do documento completo é protegido por RLS para fundador/diretor. `platform_workspaces` permanece como backup, com privilégios revogados para clientes. O convite antigo da organização também foi desabilitado. As tabelas normalizadas financeiras, fornecedores, patrocínios, networking, capacidade e simulador usam papel por evento. Tarefas normalizadas possuem `assigned_user_id`; registros antigos sem conta atribuída ficam invisíveis a staff até atribuição por diretor/fundador. A tabela normalizada `events` contém capacidade e também não é exposta a staff.

Somente fundador usa `event_change_role`. A alteração vale imediatamente para as próximas requisições; a interface da pessoa muda no próximo carregamento. O fundador não pode ser rebaixado. A política de exclusão da tabela normalizada de eventos é exclusiva do fundador; nenhum dado foi excluído nesta entrega. O fluxo atual da interface continua sendo arquivamento.

As políticas de notificações e tipos de atividade foram adaptadas para reconhecer convidados sem vínculo com a organização. São arquivos de banco necessários à corrente de acesso; a UI de MCT-53/MCT-63 foi preservada. Staff lê tipos de programação, mas a gestão do catálogo fica com diretor/fundador.

## Evidências e limites

`node scripts/check-mct60.mjs` grava saídas por comando em `docs/evidencias/mct60/`. `acceptance.txt` verifica menu real com exatamente três links, menu completo de diretor, promoção/rebaixamento, projeção, alteração de tarefa própria, GET financeiro sem linhas e POST/injeção com HTTP 403 e SQLSTATE 42501. Também tenta os endpoints antigos. Testes de persistência, convites, sessão, lint, typecheck, build e motor continuam passando.

Políticas personalizadas por módulo estão fora do escopo. A alteração não encerra uma sessão de Auth; ela muda a autorização consultada pelo banco. Dados já exibidos antes do rebaixamento permanecem na memória da aba até o próximo carregamento, conforme o critério da issue. Não há revogação retroativa do conhecimento de dados já vistos.

Registros normalizados precisam do vínculo em `platform_events` com o mesmo ID para acesso. A migração anterior cobre os documentos operados pela plataforma; conferir separadamente eventuais registros normalizados importados por ferramentas externas antes de aplicar em ambiente real. Não foi inventado vínculo por nome de evento. A migração só foi aplicada localmente.

## Sobreposição e reversão

Compartilha Sidebar, TopBar, AppLayout, Events e Tasks com o trabalho do outro agente. Alterações limitadas à autorização, destino de entrada e responsável de tarefa restrita; nenhum redesenho das telas. A PR incorpora MCT-57 como dependência a partir de main, autorizado pelo usuário.

Reverter a interface é possível sem remover dados, mas não reabrir o endpoint antigo do workspace: exporia documentos inteiros a staff. Para reverter regras, produzir migração compensatória revisada com o modelo anterior de acesso aprovado e preservação das tabelas e auditoria. Não remover coluna de atribuição nem tabelas com dados. O motor permanece intocado.
