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

- **Criar organização**: só através da função `public.criar_organizacao(nome
  text)`, `SECURITY DEFINER` (migration 7 — ver seção **"Vulnerabilidade
  crítica corrigida"** abaixo para o porquê). `INSERT` direto em
  `organizations` é **revogado** de `authenticated` (`REVOKE INSERT`); a
  policy `organizations_insert` (`with check (true)`) continua registrada na
  tabela mas é inatingível para esse role — sem o `GRANT INSERT`, a policy
  nunca chega a ser avaliada. A função insere `organizations` e a
  `membership` de `owner` (`auth.uid()`) num único `INSERT ... WITH ...`
  (CTE), então as duas linhas nascem juntas ou nenhuma nasce.
- **`memberships`**: `memberships_insert` é só `is_org_admin(organization_id)`
  — **sem exceção de bootstrap**. Até 01/10/2026 havia uma segunda cláusula
  (`or not exists (...)`) que abria a primeira membership de uma organização
  para qualquer autenticado; era uma escalação de privilégio (ver seção
  dedicada abaixo). O bootstrap não existe mais como regra de policy — foi
  substituído por atomicidade na criação (função acima).
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

## Vulnerabilidade crítica corrigida — escalação de privilégio em `memberships_insert`

**Escrito em 01/10/2026 para quem for auditar este schema depois — não é
changelog, é o raciocínio completo: o que quebrava, por que quebrava, o que
foi trocado e como isso foi verificado.**

### O defeito

Entre a migration 2 (`core_tenancy`) e a migration 6, a policy
`memberships_insert` era:

```sql
with check (
  public.is_org_admin(organization_id)
  or not exists (
    select 1 from public.memberships m2 where m2.organization_id = memberships.organization_id
  )
)
```

A segunda cláusula era o "bootstrap": sem ela, ninguém conseguiria nunca
criar a primeira membership de uma organização nova, porque a policy padrão
exige já ser admin de uma organização que, por definição, ainda não tem
nenhum membro — uma condição logicamente impossível de satisfazer na
primeira vez. A intenção era: "se esta organização ainda não tem nenhum
membro, deixa o primeiro autenticado que aparecer virar o dono".

O defeito está em como "esta organização ainda não tem nenhum membro" foi
expresso: como uma subquery (`select 1 from memberships m2 where ...`)
rodando *dentro da mesma sessão do chamador* — e `memberships` tem RLS
habilitado, com a policy de `SELECT` (`memberships_select`) filtrando por
`is_org_member(organization_id)`. Toda subquery dentro de uma `WITH CHECK`
(ou `USING`) de uma policy roda sujeita à RLS do chamador, exatamente como
qualquer outra query dele — não há um modo "sem RLS" implícito para
predicados de policy.

Consequência: um usuário autenticado que **não é membro de organização
nenhuma** não vê nenhuma linha de `memberships` de nenhuma organização —
nem a sua (não tem), nem a de terceiros (RLS bloqueia). Para esse usuário,
`not exists (select 1 from memberships m2 where m2.organization_id = <X>)`
é **sempre verdadeiro**, qualquer que seja `X` — inclusive para uma
organização `X` que já tem um owner havia meses, com evento e dado real.
"Não existe membership visível para mim" (o que a subquery de fato mede,
por causa da RLS) foi confundido com "não existe membership" (o que o
predicado precisava medir). São fatos diferentes, e só o segundo é
seguro como predicado de bootstrap.

Exploração: `INSERT INTO memberships (organization_id, user_id, role)
VALUES ('<qualquer org existente>', auth.uid(), 'owner')` — passava a
`WITH CHECK` pela cláusula de bootstrap, sempre. A partir daí, o atacante
era membro `owner` legítimo (do ponto de vista de toda outra policy RLS do
schema, que usa `is_org_member`/`is_org_admin` sem distinguir "membro desde
sempre" de "membro há um segundo") da organização inteira: lia e escrevia
as 19 tabelas de domínio, inclusive dado financeiro e eventos privados.

### Por que a prova anterior não pegou isso

A prova de isolamento registrada acima (seção "Prova de isolamento —
executada e revertida nesta sessão") testou leitura e escrita de **dado**
(`participants`, `events`, `organizations` via UPDATE/DELETE) entre duas
organizações já populadas, com usuários já vinculados por `membership`
criada via `execute_sql` como `service_role` (que ignora RLS). Nunca testou
**inserir uma `membership` nova como usuário autenticado comum** — o único
vetor onde o bug vivia. A prova provou "não dá para ler dado de outra
organização *sendo quem eu já sou*"; não provou "não dá para virar membro
de uma organização que não é minha". O buraco era exatamente esse: do
tamanho do caso que não foi testado.

### A correção (migration `20261001160000_fix_membership_bootstrap.sql`)

Em vez de consertar o predicado (qualquer subquery sobre uma tabela com RLS,
rodando na sessão do chamador, carrega o mesmo risco — remendar a condição
não muda a classe do erro), o bootstrap foi **eliminado da policy**. Criação
de organização passa a ser atômica, via função `SECURITY DEFINER`:

1. `public.criar_organizacao(p_nome text) returns uuid` — `SECURITY
   DEFINER`, `search_path = public, pg_temp` fixo (mesma prática das demais
   funções do schema, ver migration 5). Levanta exceção se `auth.uid()` é
   nulo. Insere `organizations` e a `membership` de `owner` (`auth.uid()`,
   não um parâmetro — o chamador não escolhe de quem é a membership) num
   único statement (`WITH ... INSERT ... INSERT ...`), então as duas linhas
   existem juntas ou a transação inteira desfaz; nunca existe organização
   sem owner.
2. `memberships_insert` passa a ser só `with check
   (public.is_org_admin(organization_id))` — sem cláusula de escape. Quem
   não é admin de uma organização não insere membership nela, ponto; a
   primeira membership de uma organização nova não nasce mais por essa
   policy, nasce dentro da função.
3. `INSERT` direto em `organizations` é revogado de `authenticated`
   (`REVOKE INSERT ON public.organizations FROM authenticated`) — bloqueia
   na camada de privilégio, antes mesmo de a RLS ser avaliada. A função
   continua funcionando porque `SECURITY DEFINER` roda como o dono da
   função (não como `authenticated`), então o `REVOKE` não a afeta.
4. `EXECUTE` de `criar_organizacao` concedido a `authenticated`, revogado de
   `anon` (mesmo padrão de `is_org_member`/`is_org_admin`, migration 5).

Resultado: não existe mais um caminho onde "não existe membership" é
decidido por uma query sujeita à RLS do próprio atacante. A única forma de
uma organização ganhar seu primeiro membro é a função, que decide isso a
partir de `auth.uid()` (dado de sessão, não de tabela), dentro da mesma
transação que cria a organização.

### Varredura das outras 20 tabelas (prova obrigatória 6)

Todas as 84 policies do schema (21 tabelas × 4 operações) foram lidas de
`pg_policies` depois da correção. Único padrão usado fora de
`memberships_insert` original: `is_org_member(organization_id)` /
`is_org_admin(organization_id)` / `is_org_admin(id)` — chamadas de função
`SECURITY DEFINER`, não subqueries inline sujeitas à RLS do chamador (as
funções fazem `select ... from memberships` *dentro* do corpo
`SECURITY DEFINER`, que roda com os privilégios do dono da função, não do
chamador — por isso não herdam a RLS de `memberships_select`; é a mesma
razão pela qual `is_org_member`/`is_org_admin` funcionam sem o chamador
precisar de `SELECT` direto em `memberships`, documentado desde a migration
2). A única exceção inline era `organizations_insert` (`with check (true)`
— sem subquery, não tem o defeito) e a própria `memberships_insert`
vulnerável, já corrigida. Veredito: nenhuma outra policy usa subquery
filtrada por RLS como predicado de segurança; nada mais foi alterado no
restante do schema.

### Provas executadas (transação com `ROLLBACK`, saída literal)

Via `execute_sql`, projeto `zcsvoeznilzqborkycmi`, tudo dentro de `BEGIN` /
`ROLLBACK` — nenhum dado de teste persistiu (confirmado no fim: 0 linhas nas
21 tabelas de domínio e 0 linhas de `auth.users` de teste).

**1) O ataque original agora falha.** Organização B criada com owner
(`service_role`) + evento privado; atacante autenticado sem vínculo nenhum
tenta `INSERT INTO memberships (organization_id, user_id, role) VALUES
('<org B>', '<id do atacante>', 'owner')`:

```
prova1_ataque_insert_membership = "bloqueado: SQLSTATE=42501 MSG=new row
violates row-level security policy for table \"memberships\""
```

**2) O atacante continua sem ler nada da org B** depois da tentativa, na
mesma sessão do atacante:

```
prova2_events = 0
prova2_participants = 0
prova2_memberships = 0
```

(Se o ataque tivesse funcionado, `prova2_memberships` seria 1 — o atacante
teria acabado de se inserir e, sendo membro, passaria a ver a própria
linha.)

**3) O caminho legítimo funciona.** Usuário autenticado sem organização
nenhuma chama `select public.criar_organizacao('Minha Org')`, depois cria e
lê um evento:

```
org_criada           = 78a1119a-0de8-42c1-a2ba-b4961a07348d
papel_do_criador      = owner
evento_criado         = aec6423e-8a8c-4286-bebb-c66904f2046d
evento_lido_de_volta  = "Meu evento"
```

**4) Não existe organização órfã.** `INSERT INTO organizations (nome)
VALUES (...)` direto, como `authenticated`:

```
prova4_insert_direto_organizations = "bloqueado: SQLSTATE=42501
MSG=permission denied for table organizations"
```

(Bloqueado em `REVOKE`, nem chega a avaliar a RLS — por isso a mensagem é
`permission denied`, não `row-level security policy`.)

**5) Membro comum não se promove nem insere outras memberships.** Inserido
como `member` numa organização com outro `owner`; como esse usuário:

- `UPDATE memberships SET role = 'owner' WHERE id = <própria membership>`:
  `prova5a_autopromocao_update = "linhas_afetadas=0"` (a `USING`/`WITH CHECK`
  de `memberships_update`, `is_org_admin(organization_id)`, não bate para um
  `member` — o `UPDATE` casa zero linhas, silenciosamente, comportamento
  padrão de RLS em `UPDATE`; não é erro, é "nada para atualizar").
- `INSERT INTO memberships (...)` para um terceiro usuário como `owner`:
  `prova5b_insert_outra_membership = "bloqueado: SQLSTATE=42501 MSG=new row
  violates row-level security policy for table \"memberships\""`.
- Conferido ao final: `papel_final_do_atacante = "member"`,
  `total_memberships_na_org = 2` (as duas originais, nenhuma a mais).

**6) Varredura das outras tabelas** — ver seção acima.

**7) `get_advisors`** — ver seção "`get_advisors` — achados e o que foi
feito" abaixo; o único achado novo depois desta migration é
`criar_organizacao` aparecer como `SECURITY DEFINER` executável por
`authenticated`, justificado nessa seção (é a função que substitui o
bootstrap — tem que ser chamável por `authenticated`, é o ponto da
migration).

### Vetor que não foi possível testar

`criar_organizacao` não limita quantas organizações um mesmo `auth.uid()`
pode criar (sem rate limit nem unicidade de nome) — um usuário autenticado
pode chamar a função em loop e criar N organizações das quais vira owner.
Isso não é uma quebra de isolamento entre tenants (cada organização nova é
isolada das demais, como qualquer outra) nem uma escalação de privilégio
(ele só vira owner do que ele mesmo criou) — é, na pior hipótese, abuso de
recurso/spam de linhas. Não foi testado porque está fora do que as 7 provas
pedidas cobrem e fora do raio da vulnerabilidade relatada; fica registrado
como algo a decidir no produto (limite de organizações por usuário, se
fizer sentido) e não como parte desta correção.

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
| 7 | `20261001160000_fix_membership_bootstrap.sql` | Corrige a escalação de privilégio em `memberships_insert` (ver seção **"Vulnerabilidade crítica corrigida"** acima): função `criar_organizacao()` `SECURITY DEFINER`, `memberships_insert` sem cláusula de bootstrap, `INSERT` em `organizations` revogado de `authenticated`. |

Aplicadas via `apply_migration` do MCP, em ordem, uma a uma. `list_migrations`
confirma as 7 no projeto `zcsvoeznilzqborkycmi`. Os arquivos locais em
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
| `criar_organizacao` executável via RPC por `authenticated` (apareceu depois da migration 7) | WARN | **Não corrigido — é a correção.** A função existe exatamente para ser chamada por `authenticated` via `/rest/v1/rpc/criar_organizacao` — é o único caminho de criação de organização depois que `INSERT` direto foi revogado (ver "Vulnerabilidade crítica corrigida"). Não há parâmetro de `organization_id` nem de `user_id`: o owner é sempre `auth.uid()` da sessão que chama, nunca escolhido pelo chamador, então `SECURITY DEFINER` não abre escalação — a função decide por conta própria quem é o dono (o próprio chamador autenticado), não aceita essa decisão como input. |

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
