# Modelo de dados — Mesa Certa

**Data:** 01/10/2026
**Escopo:** MCT-3 (Supabase/Postgres, migrations, schema) e MCT-4 (organizações,
usuários, eventos, RLS).
**Projeto Supabase:** `zcsvoeznilzqborkycmi` ("Mesa Certa", sa-east-1).
**Migrations:** `supabase/migrations/`, 6 arquivos, aplicadas em ordem via
`apply_migration`. Ver `docs/briefing.md` para o contexto de produto que levou
à decisão de Supabase.

Este documento explica cada tabela, a que seção do PRD ela responde, e as
decisões de modelagem — não repete o SQL, que está nas migrations.

---

## Decisões estruturais (valem para o schema inteiro)

### 1. Chaves primárias: UUID

Toda tabela usa `id uuid primary key default gen_random_uuid()`. Permite gerar
IDs no cliente antes de persistir (útil para otimistic UI) e evita vazar
contagem de linhas via ID sequencial.

### 2. Dinheiro: `numeric(14,2)`, nunca float

Todo valor monetário é `numeric(14,2)` — reais com 2 casas decimais, não
`integer` em centavos. Percentuais (ex. despesa do tipo `percentual`, PRD
§14) ficam em `numeric(5,2)` como pontos percentuais (`4.00` = 4%).

**Por que reais com 2 casas e não centavos em integer:** o PRD tem despesas
percentuais (`% da receita`) e `valor_unitário × quantidade`, contas
fracionárias que em "cents as integer" forçam conversão cents↔reais espalhada
pela aplicação inteira (toda tela financeira faz `/100` e `*100`). `numeric`
é exato nas duas representações — não existe erro de ponto flutuante binário
em nenhuma delas. Escolhemos a que exige menos tradução na camada de UI, que
já pensa e exibe em reais (R$ 74.800,00). O trade-off: se um cálculo
intermediário precisar de mais que 2 casas decimais (ex. uma cascata de
percentuais), isso deve acontecer em `numeric` de maior escala *na query ou
na função de cálculo*, nunca persistido com mais que 2 casas na coluna final.

### 3. Tenancy: `organization_id` em toda tabela de domínio

Toda tabela de domínio carrega `organization_id` (FK para `organizations`),
além de `event_id` quando pertence a um evento. `organization_id` é
**denormalizado**: em vez de a RLS precisar fazer `join` até `events` a cada
linha para descobrir o dono, a coluna já está na própria linha.

Consistência garantida por trigger, não por confiança no cliente: a função
`set_organization_id_from_event()` roda `BEFORE INSERT OR UPDATE OF event_id`
em toda tabela filha de evento e **sobrescreve** `organization_id` com o valor
vindo de `events.organization_id` — a aplicação só precisa mandar `event_id`;
não pode (e não precisa) escrever `organization_id` diretamente no insert.

**Limite conhecido:** a trigger dispara em UPDATE apenas quando `event_id`
está na cláusula SET (comportamento padrão do Postgres para `UPDATE OF
coluna`). Um UPDATE que mexe só em `organization_id` sem tocar `event_id` não
passa pela trigger — mas a policy RLS de UPDATE (`with check
is_org_member(organization_id)`) ainda impede que esse UPDATE mova a linha
para uma organização da qual o usuário não é membro. Só é possível criar uma
inconsistência (organization_id divergente do event_id) se o usuário for
membro de ambas as organizações ao mesmo tempo — um bug de dado, não uma
quebra de isolamento entre tenants.

### 4. "Enum" como CHECK, não `CREATE TYPE ... AS ENUM`

Todo campo fechado (status, tipo, prioridade, papel) é `text` com `check
(coluna in (...))`. Motivo: `ALTER TYPE ... ADD VALUE` do Postgres não pode
rodar dentro da mesma transação que depois usa o novo valor — isso complica
migrations. Trocar os valores aceitos de um CHECK é um `ALTER TABLE ... DROP
CONSTRAINT` / `ADD CONSTRAINT` comum, sem essa restrição.

### 5. Cascata de delete: apagar a organização apaga tudo dela

`events.organization_id` e todo `organization_id` de tabela filha têm `ON
DELETE CASCADE`. `event_id` nas tabelas filhas de evento também. Apagar uma
organização (ou um evento) apaga todo o dado dependente — não há
soft-delete/retenção neste escopo; é o comportamento esperado para um tenant
apagar o próprio dado. (Achado durante a prova de isolamento: a primeira
versão do schema tinha `organization_id` sem `ON DELETE CASCADE`, o que
quebrava a deleção direta de uma organização mesmo com `events` em cascata —
corrigido na migration `organization_id_cascade`, ver seção de migrations.)

### 6. `Seat` é entidade, não contagem

Requisito explícito do PRD §47: "Seat deve existir conceitualmente como
posição de uma mesa". A tabela `seats` tem uma linha por cadeira física
(`networking_table_id`, `posicao`), não um campo `capacidade_ocupada` em
`networking_tables`. Isso é o que sustenta Mesa → capacidade → cadeiras →
ocupantes (§29/§30: toda cadeira é desenhada, vazia ou ocupada, na posição
real ao redor da mesa) em vez de Mesa → lista de pessoas.

---

## Tabelas

### Núcleo de tenancy (MCT-4)

| Tabela | PRD | Por quê |
|---|---|---|
| `organizations` | §5, §47 | Raiz de isolamento multi-tenant. Toda query de domínio, direta ou indiretamente, é filtrada por `organization_id`. |
| `memberships` | §5, §47 (Users) | Liga `auth.users` (gerenciado pelo Supabase Auth — não recriamos usuário aqui) a uma organização, com `role` (`owner`/`admin`/`member`). Um usuário pode pertencer a mais de uma organização. |
| `events` | §5, §7, §47 | Evento dentro de uma organização. Os campos `tem_ingressos`/`tem_patrocinadores`/`tem_fornecedores`/`tem_programacao`/`tem_networking` vêm do onboarding (§7) e ligam módulos opcionais **na UI** — não controlam RLS; RLS é só por `organization_id`. |

### Planejamento

| Tabela | PRD | Campos notáveis |
|---|---|---|
| `locations` | §5, §21 | Usada por Capacidade (§21: capacidade × público × confirmados). |
| `participants` | §20 | `tipo` e `status` são os enums do §20. `empresa`, `descricao_empresa` e `segmento` são **obrigatórios para o módulo de diversidade do Networking** — não vêm do PRD literal, vêm de medição registrada em `docs/briefing.md`: inferir segmento só pelo nome da empresa deu 0% de acerto em nomes opacos (8 das 14 patrocinadoras reais do evento de referência); com uma linha de descrição, 100%. Sem esses três campos, o módulo de diversidade de encontros não tem entrada de dado. |
| `tasks` | §23 | `prioridade` (`normal`/`alta`/`critica`) e `status` (`a_fazer`/`em_andamento`/`concluida`) exatamente como o PRD lista. |
| `schedule_items` | §22 | Timeline: `hora_inicio` + `duracao_min` + `ordem`. O recálculo de horários seguintes (§22: "mudanças recalculam atividades seguintes") é lógica de aplicação, não trigger de banco — fica fora deste escopo. |
| `suppliers` | §19 | `dados_pagamento` é `jsonb` porque o PRD não especifica estrutura fixa para esse campo. |

### Financeiro

| Tabela | PRD | Campos notáveis |
|---|---|---|
| `expenses` | §14 | `tipo_custo` (`fixo`/`por_participante`/`percentual`) é o campo que governa o recálculo quando o público muda — exigência explícita da tarefa. `percentual` só é obrigatório quando `tipo_custo = 'percentual'` (constraint `expenses_percentual_requires_tipo`). O recálculo em si (§14: "mudanças no público devem recalcular custos variáveis") é lógica de aplicação — fora de MCT-3/MCT-4. |
| `revenues` | §15 | Categorias são `text` livre (§15: "categorias configuráveis"), não enum. |
| `payments` | §47 (Payments) | Pagamento efetivo; pode referenciar despesa, receita, fornecedor ou patrocinador — pelo menos uma referência é obrigatória (`payments_tem_referencia`). Modelado como entidade própria, separada de `expenses`/`revenues`, porque o PRD os lista como irmãos na árvore do §47 (uma despesa pode ter vencimento previsto sem pagamento ainda feito; o pagamento é o evento de caixa). |
| `tickets` + `ticket_lots` | §17 | Tipo de ingresso é `text` livre (§17: tipos "configuráveis", a lista do PRD — Geral/VIP/Associado/Premium/Outros — é sugestão, não enum fechado). Lote carrega os campos do §17: preço, início, fim, quantidade, taxa, desconto. |
| `sponsor_plans` + `sponsors` | §18 | "Nenhum nome será fixado no código" (§18) — `nome` do plano é `text` livre. `beneficios`/`entregaveis` são `jsonb` porque a lista de benefícios/entregáveis é de tamanho e forma variável por plano. |
| `simulations` | §24 | `parametros`/`resultado` em `jsonb` — o Simulador testa hipóteses sem alterar o evento real; o shape dos parâmetros muda conforme a UI evolui, então não é colunizado. |

### Networking (PRD §25-§40, §47, §49)

| Tabela | PRD | Por quê |
|---|---|---|
| `networking_tables` | §29, §47 | Chamada assim (não `tables`) para não colidir com a palavra reservada do SQL. `capacidade` determina quantas `seats` a mesa deveria ter (a aplicação gera/ajusta as linhas de `seats`; não há trigger de geração automática — escrita explícita e auditável). |
| `seats` | §30, §47 (novo requisito) | Uma linha por posição física (`posicao` ao redor da mesa). Ver decisão estrutural #6 acima. |
| `hosts` | §26, §31 | Anfitrião `fixo` ou `rotativo`, associado a um `participant_id` e a uma `networking_table_id` "de origem". Um participante é anfitrião de no máximo uma mesa (`unique(event_id, participant_id)`). |
| `distribution_versions` | §40 | Estado `rascunho`/`publicado`. Índice único parcial (`uq_distribution_versions_one_published_per_event`) garante **no máximo uma versão publicada por evento ao mesmo tempo** — para publicar uma nova é preciso despublicar a anterior explicitamente, nunca uma troca silenciosa (§40: "o sistema não deverá alterar tudo silenciosamente"). |
| `rounds` | §27, §37 | Rodada dentro de uma versão de distribuição. |
| `assignments` | — (materialização) | É onde `tab[participante][rodada] = mesa` do motor (`src/lib/networking/engine.js`) vira linha de banco: `(round_id, seat_id, participant_id ou host_id)`. `distribution_version_id` é denormalizado de `round_id` para não exigir `join` até `rounds` em toda consulta "todas as assignments da versão X". `conflito`/`conflito_motivo` guardam o resultado da análise de conflito do motor (§27.7, função `analyze()` do engine) — o cálculo continua 100% no engine, o banco só armazena o resultado. |

---

## RLS (MCT-4)

Toda tabela de domínio (as 21 listadas acima, exceto nenhuma — organizations,
memberships e events incluídas) tem `ENABLE ROW LEVEL SECURITY` e 4 policies
(`select`/`insert`/`update`/`delete`), todas `to authenticated`.

A regra é uma função só: `is_org_member(organization_id)` —
`SECURITY DEFINER`, `STABLE`, consulta `memberships` por `auth.uid()`. Como é
`SECURITY DEFINER`, o chamador (role `authenticated`) não precisa de `SELECT`
direto em `memberships` para a policy funcionar.

`organizations` e `memberships` têm regras um pouco diferentes por serem a
raiz da árvore:

- **Criar organização**: qualquer usuário autenticado pode (`with check
  (true)` em `organizations_insert`) — vira dono ao criar, na sequência, sua
  própria `membership` com `role = 'owner'`.
- **Bootstrapping de `memberships`**: a primeira membership de uma
  organização (quando ainda não existe nenhuma) pode ser criada por qualquer
  usuário autenticado — é assim que o criador da organização vira seu
  primeiro membro. Depois disso, só `owner`/`admin` (`is_org_admin`) adiciona
  novos membros. Sem essa regra de bootstrap, ninguém conseguiria nunca criar
  a primeira membership de uma organização nova (a policy padrão exigiria já
  ser admin de uma organização que ainda não tem nenhum membro — impossível).
- **Apagar/editar organização ou gerenciar membros**: exige `is_org_admin`
  (`owner` ou `admin`), não só `is_org_member`.

Todas as outras 19 tabelas usam a mesma regra para as 4 operações:
`is_org_member(organization_id)`.

### Prova de isolamento — executada e revertida nesta sessão

Criados (via `execute_sql`, role `postgres`/service, que ignora RLS para
setup): duas organizações, dois usuários em `auth.users`, uma `membership`
cada, um evento cada, um participante cada.

Depois, executado **como cada usuário** (`set local role authenticated; set
local request.jwt.claim.sub = '<uuid>'`, a mesma GUC que `auth.uid()` lê em
produção via o JWT do PostgREST):

**Leitura — Usuário A (só membro da Organização A):**

```
tabela          | id                                   | rotulo
----------------+--------------------------------------+------------------------------------------
events          | 30000000-0000-0000-0000-00000000000a | Evento A
memberships     | 10000000-0000-0000-0000-00000000000a | owner
organizations   | 10000000-0000-0000-0000-00000000000a | Organização A — teste RLS
participants    | 40000000-0000-0000-0000-00000000000a | Participante da Organização A (Empresa A)
```

**Leitura — Usuário B (só membro da Organização B), mesma query:**

```
tabela          | id                                   | rotulo
----------------+--------------------------------------+------------------------------------------
events          | 30000000-0000-0000-0000-00000000000b | Evento B
memberships     | 10000000-0000-0000-0000-00000000000b | owner
organizations   | 10000000-0000-0000-0000-00000000000b | Organização B — teste RLS
participants    | 40000000-0000-0000-0000-00000000000b | Participante da Organização B (Empresa B)
```

Cada usuário só vê a própria organização, em todas as quatro tabelas
consultadas — nenhuma linha da outra organização aparece em nenhuma.

**Escrita — Usuário A tentando atingir dado da Organização B:**

| Ataque | Resultado |
|---|---|
| `INSERT INTO participants (event_id=Evento B, ...)` | Bloqueado pela policy de INSERT (`insufficient_privilege`); confirmado depois, como service role, que `participants` do Evento B continua com só 1 linha (a original) |
| `SELECT * FROM events WHERE id = Evento B` (leitura direta por id, não listagem) | `linhas_visiveis: 0` |
| `UPDATE participants SET nome = 'Sequestrado por A' WHERE id = <participante de B>` | `linhas_afetadas: 0` |
| `DELETE FROM organizations WHERE id = Organização B` | `linhas_afetadas: 0` |

Nenhum dos quatro ataques teve efeito. Isolamento de leitura e escrita
confirmado nas duas direções (A não vê/edita B; por simetria da mesma policy,
B não vê/edita A).

Todo o dado de teste foi apagado ao final (organizations, events — cascata —,
memberships e os dois `auth.users` de teste). `list_tables` confirma 0 linhas
em todas as 21 tabelas depois da limpeza.

---

## Migrations (ordem de aplicação)

| # | Arquivo | Conteúdo |
|---|---|---|
| 1 | `20261001150000_extensions_and_helpers.sql` | `pgcrypto`, `set_updated_at()`. |
| 2 | `20261001150100_core_tenancy.sql` | `organizations`, `memberships`, `events`, `is_org_member()`, `is_org_admin()`, `set_organization_id_from_event()`, RLS das três tabelas. |
| 3 | `20261001150200_domain_entities.sql` | `locations`, `participants`, `tasks`, `schedule_items`, `suppliers`, `expenses`, `revenues`, `tickets`, `ticket_lots`, `sponsor_plans`, `sponsors`, `payments`, `simulations` + triggers + RLS. |
| 4 | `20261001150300_networking.sql` | `networking_tables`, `seats`, `hosts`, `distribution_versions`, `rounds`, `assignments` + triggers + RLS. |
| 5 | `20261001150400_security_performance_hardening.sql` | Correções do `get_advisors` (ver abaixo): `search_path` fixo nas funções trigger, `EXECUTE` de `is_org_member`/`is_org_admin` restrito a `authenticated`/`service_role`, índice esquecido em `locations.event_id`, índice em `organization_id` de toda tabela filha, índices de FK que faltavam (`hosts.participant_id`, `assignments.host_id`/`seat_id`, `payments.expense_id`/`revenue_id`/`supplier_id`/`sponsor_id`). |
| 6 | `20261001150500_organization_id_cascade.sql` | Corrige `organization_id` para `ON DELETE CASCADE` em toda tabela filha (achado durante a prova de isolamento, ver decisão #5). |

Aplicadas via `apply_migration` do MCP, em ordem, uma a uma. `list_migrations`
confirma as 6 no projeto `zcsvoeznilzqborkycmi`. Os arquivos locais em
`supabase/migrations/` têm o mesmo conteúdo e a mesma ordem (por timestamp no
nome do arquivo) — rodar todos do zero, em ordem, recria o schema inteiro
num projeto Supabase novo.

---

## `get_advisors` — achados e o que foi feito

### Segurança

| Achado | Nível | Ação |
|---|---|---|
| `set_updated_at()`/`set_organization_id_from_event()` com `search_path` mutável | WARN | Corrigido (migration 5): `search_path = public, pg_temp` fixo nas duas funções. |
| `is_org_member`/`is_org_admin` executáveis via RPC por `anon` | WARN | Corrigido (migration 5): `REVOKE EXECUTE ... FROM public, anon`. |
| `is_org_member`/`is_org_admin` executáveis via RPC por `authenticated` | WARN | **Não corrigido — justificado.** As duas funções são `SECURITY DEFINER` e usadas dentro de toda policy RLS das 21 tabelas; o role que dispara essas policies é `authenticated`, então revogar `EXECUTE` de `authenticated` quebraria a RLS inteira (toda query a qualquer tabela de domínio passaria a falhar com `permission denied for function`). Chamar a função diretamente via `/rest/v1/rpc/is_org_member` não vaza nada que o usuário não descubra de outra forma: o retorno é só "sou membro desta organização?", sobre uma organização cujo `id` ele teria que já conhecer, e cuja resposta ele já pode inferir tentando ler a própria tabela `organizations`. Risco residual aceito. |

### Performance

| Achado | Nível | Ação |
|---|---|---|
| 27 FKs sem índice de cobertura (`organization_id` em toda tabela, mais `hosts.participant_id`, `assignments.host_id`/`seat_id`, `payments.*_id`) | INFO | Corrigido (migration 5): índice criado em todas. `organization_id` é o filtro de toda policy RLS — é o índice mais importante do schema assim que houver dado real. |
| `locations.event_id` sem índice | INFO | Corrigido (migration 5) — tinha ficado de fora por engano na migration 3; os outros 12 pares tabela/`event_id` já tinham. |
| "Unused index" (30 → 57 índices, depois de criar os de `organization_id`) | INFO | **Não corrigido — esperado.** O banco está com 0 linhas em todas as tabelas (confirmado por `list_tables` depois da limpeza do teste de RLS); não existe estatística de uso de índice possível ainda. Reavaliar depois de carga real nos ambientes — não remover um índice recém-criado por "não uso" num banco vazio. |

---

## O que ficou de fora deste escopo (MCT-3/MCT-4)

- **Troca do auth do Base44 pelo Supabase Auth** — tarefa separada (9
  arquivos, só autenticação; ver `AGENTS.md` e `docs/briefing.md`). O schema
  aqui já assume `auth.users` do Supabase via FK em `memberships.user_id`,
  então essa troca não exige mudança de schema, só de código de app.
- **Camada de acesso a dados (React Query, cliente Supabase)** — o escopo do
  Linear (MCT-3) cita "React Query/camada de acesso a dados", mas isso é
  código de aplicação sob `src/`, fora do limite desta tarefa (dois outros
  agentes trabalham em `src/pages/`+componentes e em
  `index.css`/`tailwind.config`/`DesignSystem.jsx` neste momento). Os tipos
  gerados em `supabase/types/database.types.ts` são o que essa camada vai
  importar quando for escrita.
- **Ambientes de desenvolvimento/homologação separados** — o escopo de MCT-3
  pede isso explicitamente; só existe o projeto `zcsvoeznilzqborkycmi` hoje
  (nenhum outro projeto Supabase foi criado nesta sessão — `create_project`
  não foi chamado, por ser contratação de novo recurso e o limite da tarefa
  veda contratar serviço pago sem aprovação do decisor). Fica registrado como
  pendência: antes de qualquer dado real, decidir se homologação é um projeto
  Supabase separado (replica o schema via as mesmas 6 migrations) ou um
  branch de banco do mesmo projeto.
- **Testes de permissão automatizados** (citado no Aceite de MCT-4) — a prova
  desta sessão foi manual, via SQL, documentada acima com saída literal, e os
  dados de teste foram apagados depois. Não existe ainda um script/suite que
  rode essa prova automaticamente em CI. Fica como corte explícito: o aceite
  "testes de permissão automatizados" não foi atendido no sentido de
  automação repetível — foi atendido no sentido de "provado e demonstrado com
  SQL", que é o que a issue também exige.
- **Módulos opcionais habilitados por evento** (`tem_ingressos` etc. em
  `events`) existem como colunas, mas a lógica de "módulo opcional só
  aparece quando habilitado" (PRD §5) é UI, fora deste escopo.
- **Geração automática de `seats`** a partir de `networking_tables.capacidade`
  — por ora é escrita explícita da aplicação (nenhuma trigger gera `seats`
  sozinha), para manter a operação auditável; pode virar trigger ou RPC
  depois, se o padrão de uso mostrar que vale a pena.
