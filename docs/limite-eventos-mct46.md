# Limite comercial de eventos — MCT-46

> **Atualização MCT-78 (07/10/2026):** o limite de eventos por conta comum é **1** (arquivado também conta). A migração `20261007110000_event_limit_one.sql` troca somente o valor de `public.event_limit()`, que substitui o 3 da migração `20261006210000_event_limit_three.sql`. Exceção master, trava transacional e conservação de eventos existentes não mudam: conta com mais de 1 evento mantém todos e apenas não cria novos. Mensagem para quem organiza: “Sua conta permite 1 evento. Eventos arquivados também contam. Para criar outro, fale com a gente.” (plural correto para N > 1), com link de contato; o texto não diz “ativo” porque arquivar não libera vaga. Prova: `node scripts/test-mct78.mjs`. O texto abaixo descreve a regra original e vale com o limite lido do banco.

Cada conta sem liberação cria o primeiro evento, mas não cria outro enquanto já possui um vínculo ativo com um evento. Isso inclui um evento recebido por convite. Arquivar não libera outra criação: o vínculo continua ativo. Eventos anteriores acima do limite permanecem disponíveis e nenhum dado é excluído. A issue limita criação; este trabalho não altera a aceitação de convites, cobrança, planos ou transferência de propriedade.

Ser fundador de um evento significa tê-lo criado e controla seu acesso. Não concede automaticamente a exceção comercial. A exceção é a flag `user_event_permissions.multi_event` da conta; `renannascimento0304@gmail.com` começa com ela ligada, conforme a issue. A regra usa a conta autenticada e o registro confiável em banco, nunca metadados editáveis ou campos do documento.

`event_create` valida organização e limite, usa lock transacional por usuário e cria evento e vínculo fundador em uma transação. Dois pedidos simultâneos, inclusive para organizações diferentes, só conseguem uma criação para conta limitada. Importação de backup passa pelo mesmo caminho. Inserção direta nas tabelas não substitui a RPC autorizada.

`event_creation_permission` fornece o estado para a interface. A lista oculta “Criar evento” e a importação quando limitada; `/novo` mostra aviso de limite em vez de controles de criação. A resposta de criação já traz o estado atualizado, para ocultar o botão sem novo login. Liberações administrativas aparecem no próximo carregamento.

## Liberação sem deploy

A conta lê somente a própria flag por RLS e não tem privilégios de alteração. A administração usa uma migração versionada em `supabase/migrations/`, com o UUID da conta conferido previamente, por exemplo:

```sql
update public.user_event_permissions
set multi_event = true, updated_at = now()
where user_id = '<UUID conferido da conta>'::uuid;
```

Para revogar novas criações, usar `false` em uma migração compensatória. Não excluir eventos ou flags. Isso é mudança de dado administrativo e não exige deploy do frontend. Não usar painel manual nem conceder `service_role` ao navegador. Nesta entrega nenhuma conta real foi liberada e somente o banco local recebeu migrações.

## Evidências e riscos

`node scripts/check-mct46.mjs` grava saídas em `docs/evidencias/mct46/`. `acceptance.txt` renderiza as telas reais com permissão consultada na API: botão para conta nova (CA1), ausência de botão e aviso em `/novo` para conta com evento (CA2), POST direto recusado com HTTP 403/SQLSTATE 42501 e mensagem do limite (CA3), e duas criações da conta de exceção com flag automática (CA4). Também testa metadados falsos, tentativa de alterar a flag (HTTP 403), liberação administrativa e concorrência entre duas organizações. Regressões de catálogo, equipe, papel, convites, persistência, sessão e motor são verificadas com fixtures sintéticas liberadas explicitamente quando precisam de dois eventos.

Limite comercial não é cancelamento de acesso a eventos antigos. A conta de exceção é identificada pelo e-mail de Auth na criação da conta, não pelo nome “Fundador” da equipe. O privilégio fica ligado ao UUID; se a conta mudar de e-mail, a flag não é transferida para outra conta. Alterações administrativas devem conferir identidade e registro correto.

## Dependências, sobreposição e reversão

Incorpora a corrente MCT-57 → MCT-60 → MCT-58 → MCT-59, a partir de main, para aplicar a regra à criação atual de documentos por evento e demonstrar regressão completa. A incorporação foi autorizada pelo usuário. Compartilha Events, CreateEvent e EventContext com outras telas; alterações limitadas ao limite de criação e estado fornecido pelo banco.

Reverter a interface conserva dados, mas a restrição permanece no banco. Para suspender o limite, usar migração compensatória da função de criação, mantendo a tabela de flags e a auditoria. Para uma exceção pontual, alterar somente a flag da conta em migração versionada. Não restaurar o acesso ao workspace antigo nem remover a autorização por evento.
