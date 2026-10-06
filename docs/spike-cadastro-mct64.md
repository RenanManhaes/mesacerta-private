# MCT-64 — cadastro mediante liberação

Status: proposta para decisão do produto, 06/10/2026. Esta spike entrega documentação; não implementa fechamento de cadastro, pagamento, migração ou configuração de Auth. `Register.jsx` continua chamando `supabase.auth.signUp` como na main. Não houve deploy nem alteração de cadastro em produção.

## Recomendação explícita

Recomendo **cadastro condicionado a uma liberação válida no servidor, com pedido de acesso para quem não possui liberação**. Começar por convite e liberação manual; ligar pagamento ao mesmo registro quando houver uma compra aprovada. A decisão de ativar essa regra em produção fica para o responsável do produto, após aprovação desta proposta e implementação/testes em uma issue própria.

Não recomendo criar contas sem liberação para depois bloquear a interface: uma chamada direta ao Auth contornaria essa barreira e criaria contas que a operação não autorizou. A proposta é validar antes da criação da conta e manter RLS por evento depois dela.

## Caminhos de entrada

| Caminho | Prova conferida pelo servidor | Resultado recomendado | Risco e mitigação |
|---|---|---|---|
| Código do evento | Evento existente, código ativo, limite de tentativas e e-mail informado pelo próprio interessado | Liberação de cadastro vinculada ao evento, com papel staff | Código curto compartilhável e sujeito a tentativa automatizada: limitar tentativas por origem e código, não revelar dados de evento em erro |
| Link de convite | Token imprevisível, convite ativo e evento correspondente | Liberação vinculada ao evento e papel staff/diretor já gravado no convite | Link encaminhado permite entrada de outra pessoa: deixar isso explícito ao gerar; reservar para um e-mail no início do cadastro; revogação deve valer antes da ativação |
| Compra aprovada | Evento de aprovação recebido e verificado exclusivamente pelo backend | Liberação para a identidade da compra; permitir primeiro evento conforme MCT-46 | Retorno do navegador pode ser falsificado: nunca aprovar pelo redirecionamento; validar origem, assinatura, estado e idempotência no backend |
| Liberação manual pelo fundador da plataforma | Operador administrativo autenticado, destinatário conferido, motivo e prazo | Mesma liberação, origem manual, auditada | Engano de identidade e concessões sem rastreio: registrar quem aprovou, a justificativa e validade; limitar o endpoint ao operador autorizado |

“Fundador da plataforma” neste fluxo manual é a autoridade administrativa definida pelo produto, inicialmente a conta de exceção da MCT-46. Ser fundador de um evento não dá poder para liberar cadastro geral, pagamento ou múltiplos eventos. No evento, o criador é fundador; quem recebe código/convite tem o papel do ingresso, conforme a decisão confirmada na MCT-57.

Uma conta já existente continua entrando pelo login e aceitando convite pelo vínculo de evento. Não recriar conta, não transferir propriedade e não apagar usuários antigos. Conta liberada por convite não recebe automaticamente permissão comercial para criar outros eventos.

## Modelo de dados proposto

Tabela `account_releases` no Supabase, criada futuramente por migração versionada. O modelo abaixo é proposta, não SQL executado:

| Campo | Tipo sugerido | Finalidade |
|---|---|---|
| `id` | UUID | Identificador interno da liberação |
| `origin` | Enum `convite`, `compra_aprovada`, `manual` | Origem verificável, definida no servidor |
| `state` | Enum `pendente`, `autorizada`, `reservada`, `consumida`, `revogada`, `expirada` | Ciclo de vida explícito |
| `email_normalized` | Texto privado | Identidade prospectiva; normalizar caixa e espaços, sem inventar equivalência entre aliases |
| `user_id` | UUID nullable, FK Auth | Vincular somente depois que a conta realmente existir |
| `token_hash` | Hash de token aleatório | Prova de posse; nunca guardar token bruto nem senha |
| `event_id` / `invitation_id` | Referências nullable | Obrigatórias para origem convite; convite individual pode ter ID, código puro não |
| `event_role` | `staff` / `director`, nullable | Copiado da origem validada, nunca escolhido pelos metadados do cadastro |
| `source_reference` | Texto opaco | Referência externa ou administrativa para idempotência |
| `created_by` / `approved_by` | UUID nullable | Operador, quando aplicável; aprovação de compra tem ator de serviço auditado |
| `reason` | Texto privado | Motivo da concessão ou revogação |
| `created_at` / `approved_at` | Timestamps | Auditoria de emissão e aprovação |
| `expires_at` | Timestamp obrigatório | Validade da concessão ainda não consumida |
| `reserved_until` / `reserved_request_id` | Timestamp e UUID nullable | Reserva breve para impedir dois cadastros com a mesma liberação |
| `consumed_at` / `revoked_at` | Timestamps nullable | Ativação e revogação sem apagar histórico |

Restrições recomendadas: origem e estado fechados; unicidade de `(origin, source_reference)` para aprovações repetidas; uma liberação consumida não se reaproveita; convite precisa corresponder ao evento e papel existentes; transições autorizadas somente por funções de servidor. Registrar mudanças de estado em `account_release_log`, com liberação, ator, request ID, horário e motivo.

Clientes anônimos e autenticados não inserem, aprovam, alteram ou enumeram liberações. Revogar privilégios padrão, habilitar RLS e expor somente RPCs mínimas. A consulta pública deve devolver resultado genérico do pedido atual, sem lista de e-mails, compras ou eventos. Chaves administrativas ficam exclusivamente no servidor. A combinação de privilégios e RLS, e a exclusividade de chaves administrativas no backend, segue a [documentação de segurança do Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security).

Não depender de localStorage para concessão, reserva ou ativação. `user_event_permissions.multi_event` da MCT-46 é uma regra comercial separada; nenhuma compra libera múltiplos eventos automaticamente sem uma decisão comercial registrada.

## Validade e ativação recomendadas

Proposta inicial para decisão: concessão ainda não usada válida por sete dias; reserva de cadastro por quinze minutos. Não limitar o tempo de acesso ao evento com esses prazos: eles são para uso da liberação, não duração da membership. Origem compra pode exigir outro prazo comercial, a definir antes da integração.

1. Interessado apresenta código/link ou prova de liberação manual/compra e seu e-mail a um endpoint limitado por tentativas.
2. Backend valida a origem e emite token aleatório forte, armazenando apenas hash, identidade, validade e estado. O token não contém papel ou aprovação que o cliente possa alterar.
3. Cadastro apresenta a liberação. Um controle server-side verifica hash, identidade, estado, prazo e origem ainda ativa antes de criar usuário.
4. Reservar de forma atômica; após criação real, vincular UUID e consumir a liberação de forma idempotente. Se criação falhar, liberar a reserva com política de recuperação e manter auditoria, sem marcar consumo definitivo prematuramente.
5. Confirmar identidade conforme a política de e-mail do projeto. Convite só concede membership depois da conta autenticada e da revalidação de evento/convite. Compra/manual permitem onboarding sob MCT-46, com flag comercial separada.

O Supabase oferece o [Before User Created Hook](https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook) para validar e recusar criação no servidor, por função Postgres ou HTTP. O usuário ainda não está em `auth.users` quando o hook roda, por isso o modelo permite identidade prospectiva sem FK preenchida. O recurso é listado para Free e Pro na [documentação de Auth Hooks](https://supabase.com/docs/guides/auth/auth-hooks). Essa disponibilidade não determina a conta final de infraestrutura.

Recomendo avaliar um hook SQL com validação mínima e reserva, e um endpoint de emissão de liberações. A implementação precisa comprovar, em ambiente local, o comportamento transacional entre hook, criação Auth e consumo: não assumir atomicidade de chamadas HTTP separadas. Recuperação de reservas e repetição idempotente fazem parte dos testes antes de qualquer ativação.

## Quem tenta se cadastrar sem liberação

| Opção | Comportamento | Benefício | Custo e risco |
|---|---|---|---|
| Bloqueio seco | Recusa cadastro e mostra como obter código/liberação | Menor implementação e operação | Perde interessados sem oferecer canal; aumenta pedidos informais ao suporte |
| Lista de espera | Guarda interesse, sem criar conta ou acesso | Mede demanda e permite chamada futura | Lista tende a ficar sem atendimento; exige política de retenção e comunicação sem prometer vaga |
| Pedido de acesso — recomendado | Recusa criação Auth, oferece formulário mínimo; operador aprova ou recusa depois | Mantém controle e caminho claro para interessados | Exige fila e responsabilidade de atendimento; spam, expectativas e dados de contato precisam ser tratados |

Mensagem sugerida: “Para criar sua conta, use um convite válido ou uma liberação. Você pode solicitar acesso.” Não revelar se determinado e-mail já tem compra ou convite. Um pedido não cria usuário, membership, flag ou liberação autorizada.

Tabela futura `access_requests`: ID, contato, finalidade opcional, estado `pendente/aprovado/recusado`, horários e operador responsável. Coletar somente o necessário, limitar tentativas e definir prazo de retenção com a operação antes de implementar. Aprovar cria liberação de origem manual; o pedido não muda a autorização por si só. Não enviar e-mails automáticos nem contratar serviço nesta spike.

## Onde o pagamento entra

Interface futura: `processar_aprovacao_compra(referencia, identidade, estado_verificado, request_id)`, chamada apenas pelo backend após conferir uma mensagem autenticada do provedor escolhido no futuro. O adaptador registra o evento recebido, garante unicidade e cria/autoriza `account_releases` com origem `compra_aprovada`.

O cadastro e a emissão de sessão continuam no Auth. Pagamento não entra no frontend como prova de aprovação nem escreve diretamente memberships. A liberação apenas permite criar conta; a quantidade de eventos continua sob a regra MCT-46. Convites continuam controlando o papel do evento sob MCT-57/MCT-60.

Pagamento pendente/recusado não aprova liberação. Mensagem repetida não cria outra concessão. Cancelamento/estorno de uma concessão não usada pode revogá-la; efeitos sobre conta/eventos já existentes precisam de decisão comercial específica, preservando dados. A spike não escolhe provedor, preço, plano, cobrança ou mecanismo de estorno.

## Custo da recomendação

Esta entrega documental não contrata serviço: **R$ 0 de contratação nesta spike**. Estimativa técnica preliminar para uma implementação futura, incluindo pedido de acesso e os dois caminhos iniciais, mas excluindo integração de pagamento:

| Trabalho futuro | Estimativa de esforço |
|---|---|
| Modelo, migrações, RLS e auditoria | 6–10 horas |
| Emissão por convite/manual e limites de tentativas | 8–12 horas |
| Hook e adaptação do cadastro/retorno de convite | 8–12 horas |
| Pedido de acesso e contrato de entrada de compra, sem provedor | 4–6 horas |
| Testes de API/Auth, recuperação e ativação controlada | 4–6 horas |

Total estimado: **30–46 horas de desenvolvimento**. É estimativa do escopo proposto, não orçamento contratado. O total é calculado pelo comando registrado em `docs/evidencias/mct64/acceptance.txt`. Custo de mão de obra é esse esforço multiplicado pelo valor/hora acordado; nenhum valor/hora foi fornecido. Revisar a estimativa após validar o hook e a operação de pedidos.

Operação adicional estimada: uma pessoa responsável por revisar pedidos e concessões, reservando inicialmente 15–30 minutos por dia útil e ajustando à demanda. Sem atendimento definido, preferir bloqueio seco a oferecer uma fila abandonada. Infraestrutura usa os recursos existentes como hipótese inicial; confirmar consumo, limites e custos do projeto antes de ativar. Não pressupor serviço ilimitado gratuito. A futura integração de pagamento exige estimativa separada após escolher e aprovar o provedor.

## Riscos, decisão e próximas etapas

- Adivinhação de código e encaminhamento de link: limites de tentativa, token forte de reserva e auditoria; código continua concedendo staff, nunca diretor.
- E-mail errado ou identidade não confirmada: normalização limitada, confirmação do destinatário e nenhuma transferência automática de liberação.
- Corridas, falha após reserva e webhook repetido: locks, unicidade, transições idempotentes e recuperação testada; não apagar registros para “corrigir”.
- Queda do serviço de liberação: negar novas criações com mensagem clara, mantendo login de usuários existentes. Não aprovar automaticamente na falha.
- Bloqueio acidental de clientes atuais ou operador fundador: aplicar a novos cadastros somente após inventário e testes; manter mecanismo administrativo de recuperação auditado.
- Pedido de acesso sem responsável: definir atendimento antes de disponibilizar; não prometer aprovação, prazo ou compra que ainda não existem.

Aprovar ou ajustar: escolha por pedido de acesso; autoridade da liberação manual; validade de sete dias e reserva de quinze minutos; atendimento/retencão; comportamento comercial de estorno. Depois, abrir implementação própria com testes de cadastro direto pela API sem liberação, convite revogado, consumo concorrente, recuperação, liberação manual e compra simulada. Todas as mudanças de banco serão migrações versionadas; nada de alteração manual no painel, serviço pago, segredo no commit ou deploy de produção sem autorização específica.

Esta proposta se relaciona às PRs [MCT-57 #28](https://github.com/RenanManhaes/mesacerta-private/pull/28) e [MCT-46 #32](https://github.com/RenanManhaes/mesacerta-private/pull/32), ainda em revisão no momento da escrita. A branch desta spike parte diretamente de main e não incorpora código delas. Nenhum arquivo de cadastro, configuração Auth, tabela ou policy foi alterado por esta PR.

## Evidência e reversão

Revisão adicional em 06/10/2026: conferidos os limites da spike, identidade e consumo da liberação, recuperação, caminhos de convite/manual/compra e cálculo de esforço. Nenhum novo achado impeditivo no escopo documental. A proposta continua exigindo decisões de produto antes de implementação; não altera cadastro. `node docs/evidencias/mct64/check.mjs` foi repetido na revisão: critérios, diff sem código, lint, typecheck, build e motor passaram.

`docs/evidencias/mct64/acceptance.txt` registra verificação dos caminhos/modelo/comportamento (CA1), recomendação/custo e soma do esforço por comando (CA2), e diff sem alterações em `src/`, `supabase/`, configuração ou dependências (CA3). Os demais arquivos registram lint, typecheck, build e motor 9/9.

Para reverter a spike, reverter somente o commit documental. Não há banco ou configuração a reverter. Na implementação futura, ativação e reversão da regra serão planejadas e aprovadas separadamente, preservando usuários, eventos e auditoria.
