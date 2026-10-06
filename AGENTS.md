# AGENTS.md

Leia este arquivo inteiro antes de escrever qualquer código. Ele é o contrato de
entrega deste repositório.

## O que é este projeto

**Mesa Certa** — plataforma de planejamento e operação de eventos. Financeiro,
participantes, fornecedores, tarefas, programação e capacidade em um só lugar,
mais um módulo opcional de Networking com motor de rodadas de negócio.

Não é "um app Base44". O esqueleto veio do Base44, mas o produto é outro.

**Origem, em três peças:**

1. **Motor real** — rodou no evento Get Connected Sorocaba 2026 (76 convidados,
   14 mesas, 14 rodadas). Vivia em `rodadas-de-negocio.html`, arquivo único de
   1403 linhas, no repositório `RenanManhaes/mesacerta-private` — que é acervo
   do evento, não repositório de código.
2. **Esqueleto do Base44** — React + Vite + shadcn/ui, com as páginas do PRD
   esqueletadas. É a casca.
3. **Planilha do cliente** — controle financeiro e de fornecedores.

Decisão de unificação: **casca do Base44, miolo do motor real.**

## Leitura obrigatória antes de começar

| Arquivo | O que é |
|---|---|
| `docs/PRD_Mesa_Certa_v1.2.md` | A especificação atual do produto, consolidada com MCT-46–64 e o design aprovado. As seções 1–53 mantêm a numeração citada nas issues. A v1.1 em `docs/` é histórica. |
| `docs/unificacao.md` | O que cada peça é, o que já foi feito, o que falta. |
| `docs/jev-no-mesa-certa.md` | Onde o Jev entra e, principalmente, onde não entra. |

## Regras que não se negociam

### 1. O motor de networking é port fiel. Não reescreva.

`src/lib/networking/engine.js` foi extraído do HTML legado **sem alterar a
lógica**. Ele usa permutações cíclicas mais recozimento simulado para minimizar
reencontros entre duplas. É combinatória sutil: uma "melhoria" bem-intencionada
quebra garantias de forma silenciosa.

Antes e depois de qualquer mudança que encoste nele:

```bash
node src/lib/networking/engine.test.mjs
```

Tem de passar 9/9. Se uma issue pedir mudança no algoritmo, ela dirá isso
explicitamente e trará critério de regressão.

### 2. IA não faz conta. Nunca.

O Jev (TypeSafe) responde perguntas tipadas sobre texto e devolve valor com
probabilidade calibrada. Ele **não gera texto** e **não calcula**.

Ficam inteiramente no código, sem exceção:

- distribuição de mesas, recozimento simulado, detecção de conflito, rotas;
- faturamento, margem, ponto de equilíbrio, recálculo de custo, capacidade.

O Jev entra só onde há texto livre virando dado tipado, ou julgamento semântico
que vira peso numérico para o código otimizar.

Se uma tarefa parecer pedir que a IA calcule ou decida fluxo, isso é erro de
especificação. Pare e reporte em vez de implementar.

### 3. Nada de dado real só em localStorage.

O legado usava `localStorage` como fonte de verdade. A plataforma não usa.

### 4. Limites de ação

- Não altere o legado em produção.
- Não faça deploy de produção.
- Não exclua dados.
- Não contrate serviço pago.
- Não commite segredo. `.env.local` é local.

## Como o trabalho chega

Cada tarefa é uma issue do Linear no time **Mesa Certa** (prefixo `MCT-`), com
contexto, escopo incluído, escopo excluído e **critérios de aceite verificáveis**
em formato Dado / Quando / Então.

Os critérios de aceite são o contrato. Não são sugestão e não são resumo.

- Implemente o escopo incluído, inteiro.
- Não implemente o escopo excluído, nem "de brinde".
- Se um critério não puder ser atendido, **diga qual e por quê**. Não entregue
  como se estivesse pronto.

## Como terminar uma tarefa

Rode as verificações do `package.json` (`lint`, `typecheck`, `build`) mais os
testes que a issue citar. Depois entregue:

1. **Evidência por critério de aceite** — saída de comando, não descrição em
   prosa. Diga qual saída prova qual critério.
2. **Arquivos alterados.**
3. **O que ficou de fora**, se algo ficou.
4. **Riscos** que você percebeu e não estavam na issue.
5. **Como reverter.**

Gerar código não é concluir. Concluir é demonstrar os critérios.

> A aderência da entrega aos critérios de aceite é aferida contra o **diff e a
> saída de teste** — não contra o relatório. Relatório otimista não passa.

## Comandos

```bash
npm run dev          # frontend; configurar Supabase em .env.local
base44 dev           # comando histórico do scaffold, não o backend de dados atual
npm run lint
npm run typecheck
npm run build

node src/lib/networking/engine.test.mjs   # motor de rodadas, sem test runner
```

## Arquivos-chave

- `src/lib/networking/engine.js` — motor de rodadas. Port fiel. Ver regra 1.
- `src/lib/networking/engine.test.mjs` — verificação do motor.
- `src/lib/selectors.js` — de onde saem os números das telas. Fonte única; não
  recalcule em outro lugar.
- `src/pages/event/` — as telas do PRD.
- `src/api/base44Client.js` — cliente do SDK Base44.
- `../jev-pilot/` — piloto do Jev sobre as despesas reais do evento, com
  medição de acerto. Referência de como integrar o Jev.

## Base44

- CLI: https://docs.base44.com/developers/references/cli/get-started/overview.md
- Skills: https://docs.base44.com/developers/backend/overview/skills.md

Reuse o cliente SDK e o padrão do plugin Vite que já existem antes de criar
caminho novo de integração. Prefira o fluxo do CLI Base44 a inventar scripts npm
para tarefas específicas do Base44.

**Estado atual:** a plataforma usa Supabase Auth e PostgreSQL para dados e
controle de acesso, conforme PRD v1.2 §48 e as issues autorizadas. Base44 é a
origem do esqueleto; dependências residuais não autorizam um segundo backend de
dados reais. A evolução de acesso por evento está em PRs abertas: consultar o
estado de entrega no PRD §57 antes de pressupor que suas migrações já foram
aplicadas. Não alterar arquitetura, cadastro ou permissões além do escopo da
issue.
