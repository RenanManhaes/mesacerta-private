# Despacho Codex — Lote 02

**Issues, nesta ordem:** MCT-34 → troca do auth → MCT-5
**Condição de parada:** critérios de aceite das três demonstrados com saída de
comando. Não pare entre issues.

Leia `AGENTS.md`, `docs/briefing.md` e `docs/modelo-de-dados.md` antes de começar.
O terceiro é novo e é essencial: descreve as 21 tabelas que passaram a existir.

## O que mudou desde o seu lote 01

Três coisas que alteram o terreno:

1. **A decisão Base44 x Supabase foi tomada: Supabase.** Ela estava em aberto e
   você corretamente não a tomou. Agora está decidida.
2. **O banco existe.** Projeto `zcsvoeznilzqborkycmi` (sa-east-1), 21 tabelas
   conforme PRD §47, 6 migrations versionadas em `supabase/migrations/`, RLS em
   todas as tabelas com isolamento multi-tenant provado por SQL. Tipos
   TypeScript gerados em `supabase/types/database.types.ts`.
3. **A identidade visual entrou.** Os tokens de `src/index.css` foram
   recalculados. Os nomes foram preservados, então seu `TablePlan.jsx` já pegou
   a paleta nova sem alteração. Existe uma rota `/design-system` de referência.

## Sua faixa de arquivos

```
src/pages/**    src/components/**    src/lib/AuthContext.jsx
src/api/**      src/context/**       src/lib/app-params.js
```

**Não toque** em `src/lib/networking/engine.js`, `src/lib/pessoas/`,
`src/lib/qa/`, `jev-pilot/`, `supabase/migrations/` nem `src/index.css`.
Outros agentes são donos desses.

O motor continua intocável, pelo mesmo motivo do lote 01 — combinatória sutil,
"melhoria" quebra garantia em silêncio. Seu oráculo:
`node src/lib/networking/engine.test.mjs`, 9/9.

---

## 1. MCT-34 — Despesa percentual calcula sobre a base errada

Você reproduziu e documentou esta dívida na auditoria, sem corrigir, conforme o
despacho. Agora corrija.

O PRD §14 é explícito: percentual é **% da receita**. A implementação usa o
**público** como base.

A planilha real confirma a intenção. Na aba Despesas, "4. CUSTOS PROPORCIONAIS
À RECEITA" tem três linhas e nenhuma é por pessoa — taxa sobre o patrocínio,
imposto sobre o faturamento, contingência sobre R$ 31.206.

**A base precisa ser um campo por despesa**, não uma constante: a planilha tem
casos sobre o faturamento total e casos só sobre o patrocínio.

Corrija no mesmo passe: **quantidade zero em despesa fixa vira uma unidade.**
Zero tem de valer zero.

Oráculo exato, e é o que torna esta issue boa para você: os 25 lançamentos
reais do Get Connected somam **R$ 29.718,98** e produzem margem de **4,8%**.
Se o seu cálculo bate na centavo, está certo; se não bate, está errado. Sem
espaço para interpretação.

## 2. Troca do auth: Base44 → Supabase

Nove arquivos, todos de autenticação. As telas de negócio não tocam o Base44 —
medido em 01/10/2026.

```
src/api/base44Client.js        -> virar supabaseClient.js
src/lib/AuthContext.jsx        -> base44.auth.me/logout/redirectToLogin
src/lib/app-params.js
src/lib/PageNotFound.jsx
src/pages/Login.jsx
src/pages/Register.jsx
src/pages/ForgotPassword.jsx
src/pages/ResetPassword.jsx
src/pages/OAuthConsent.jsx
```

Use `@supabase/supabase-js`. As chaves publicáveis e a URL do projeto saem do
conector Supabase — **não invente valores e não commite chave**. Variáveis de
ambiente com prefixo `VITE_`, e registre no `.env.example` quais são
necessárias.

Ponto de atenção que você mesmo levantou no lote 01: hoje, sem backend
configurado, o frontend dá 404 nas chamadas de public settings. Isso tem de
desaparecer.

**O `memberships` é a ponte.** O modelo tem `organizations`, `memberships` e
`events`; a RLS se apoia em `is_org_member(organization_id)`. Um usuário
autenticado sem membership não vê nada — isso é correto, não é bug. Trate o
caso: usuário novo precisa de um caminho para criar ou entrar numa organização,
senão ele loga num vazio.

## 3. MCT-5 — Tirar o localStorage de fonte de verdade

Hoje o estado dos eventos vive em `localStorage` na chave `mesacerta_v1`, lido
pelo `EventContext`.

Troque por leitura e escrita no Supabase, via React Query (`src/lib/query-client.js`
já existe). Use os tipos gerados em `supabase/types/database.types.ts` — não
redeclare o schema à mão.

Escopo desta issue: **organizações, eventos e participantes.** Financeiro,
networking e o resto vêm nas issues próprias (MCT-6 a MCT-12); não os traga
agora, mas não deixe o `EventContext` com dois mecanismos concorrentes.

`localStorage` pode continuar como cache de conveniência — nunca como fonte de
verdade. Se o banco e o cache divergirem, o banco ganha.

**Migração de dado:** não há. O modelo anterior era `{ role: admin | user }` e
nenhum dado real existe. Não escreva código de migração.

---

## Critérios de aceite

1. Os 25 lançamentos reais somam R$ 29.718,98 e a margem resulta 4,8%.
2. Despesa percentual não muda de valor quando o público muda.
3. Despesa fixa com quantidade zero soma zero.
4. Nenhuma referência a `base44` sobra em `src/` — `grep -rn base44 src/` vazio.
5. Login real funciona contra o Supabase; `auth.me` devolve o usuário.
6. Usuário autenticado sem membership vê um caminho para criar organização, não
   uma tela vazia.
7. Criar um evento, recarregar a página e ele continua lá — vindo do banco, não
   do `localStorage`.
8. Com `localStorage` limpo manualmente, o evento continua aparecendo.
9. Dois usuários de organizações diferentes não veem os eventos um do outro —
   teste pela aplicação, não só por SQL.
10. `npm run lint` e `npm run build` passam. `engine.test.mjs` 9/9.

O critério 9 é o que mais importa. A RLS está provada no banco; falta provar que
a aplicação não a contorna.

## Pare e reporte se

- Precisar criar um segundo projeto Supabase (ambiente de homologação). Isso é
  contratar recurso e não é decisão sua.
- Um critério de aceite for impossível como está escrito. Diga qual e por quê.
- Algo exigir mudar `engine.js` ou as migrations.

## Não faça

Commit, push, deploy, exclusão de dado, serviço pago, alteração do legado em
produção. **Não commite chave de API em nenhuma circunstância.**

## Relatório final

Por critério: o comando que o prova e a saída literal. Mais o que ficou de fora,
riscos novos, e como reverter.

Observação do lote 01 que continua valendo: sua revisão é do executor, não
independente. A revisão independente é feita aqui depois.
