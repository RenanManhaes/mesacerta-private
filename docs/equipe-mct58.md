# Equipe do evento — MCT-58

A equipe vem das contas com vínculo ativo em `event_members`. O criador já aparece na resposta transacional de criação como Diretor, cargo Fundador. Os papéis de autorização continuam sendo `founder`, `director` e `staff`, separados dos campos de apresentação.

“Nova pessoa” abre código/link e escolha de papel, sem formulário pessoal. Para conceder papel diretor ou gerar links, exige fundador, conforme MCT-60. Diretor pode compartilhar o código staff e editar os contatos da equipe. O fundador controla promoção/rebaixamento em Configurações e remoção na equipe.

Nome, telefone, e-mail de contato e função são persistidos no vínculo do evento. Editar o e-mail de contato não troca credenciais do Supabase Auth. Alterar nome atualiza também o rótulo das tarefas ligadas por ID. A operação incrementa a revisão, evitando que uma aba antiga sobrescreva a edição. O rascunho salvo do editor é encerrado no banco após sucesso.

Remoção é revogação por `removed_at`, sem excluir conta, tarefas, perfil ou auditoria. A partir da próxima chamada, o token antigo não lê nem grava o evento. Código e convites anteriores à remoção não restauram acesso; o fundador precisa criar um novo convite para uma readmissão deliberada. O fundador não pode ser removido. A rota `/equipe` substitui a antiga, com redirecionamento de `/diretores-staffs` para preservar links e notificações existentes.

## Dados anteriores e risco

Cadastros manuais anteriores não provam vínculo com conta autenticada. São conservados em `legacyStaffMembers` e no snapshot original, sem inventar acesso por nome/e-mail. A lista ativa passa a refletir vínculos reais. Tarefas antigas com IDs de pessoas manuais conservam seus responsáveis históricos, mas precisam de reatribuição explícita para uma conta real antes de aparecerem para staff. Importação de equipe está fora do escopo; nenhuma associação automática foi criada.

## Evidência, arquivos compartilhados e reversão

`node scripts/check-mct58.mjs` grava saídas em `docs/evidencias/mct58/`. `acceptance.txt` testa a equipe real renderizada, editor/convite, criação com fundador, persistência dos quatro campos e remoção pelo botão com negação HTTP 403/SQLSTATE 42501. `roles.txt` repete os critérios de MCT-60; os demais arquivos comprovam regressões e os quatro comandos obrigatórios.

Compartilha Staff, Sidebar, TopBar e App com telas do outro agente, apenas para a nomenclatura, vínculo de acesso e nova entrada. Conserva busca, notificações e tarefas. Incorpora as PRs de MCT-57 e MCT-60 como dependências, autorizado pelo usuário.

Para reverter, retornar a interface anterior sem excluir tabelas ou colunas. Manter RLS e revogações, pois a lista manual anterior não é uma autorização segura. Migração compensatória pode restaurar apresentação histórica a partir dos campos preservados; conferir vínculos antes de conceder qualquer acesso. Nenhuma migração foi aplicada fora do ambiente local.
