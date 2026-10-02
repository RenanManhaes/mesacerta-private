# MCT-34 — entrega, evidências e revisão do executor

Data: 01/10/2026. Branch: `plataforma-unificada`. Base: `eeae220`.
Issue: https://linear.app/renanmanhaes/issue/MCT-34/despesa-percentual-calcula-sobre-o-publico-nao-sobre-a-receita

## Escopo e execução

`git pull --ff-only origin plataforma-unificada` antes da implementação:

```text
From https://github.com/RenanManhaes/mesacerta-private
 * branch plataforma-unificada -> FETCH_HEAD
Already up to date.
```

Renan restringiu esta sessão ao item 1 do despacho. Itens 2 e 3 seguem com outros
executores. Este executor não editou auth, src/api nem EventContext. O diff global
contém mudanças paralelas e não representa sozinho a autoria desta entrega.
Não houve commit, push, deploy, alteração de migration ou exclusão de dados.

## Implementação

- `expenseTotal(exp, audience, revenue)`: recebe as receitas explicitamente.
  `revenue` pode ser o resultado de `financialSummary(ev)`.
- Cada percentual tem `revenueBase: 'total' | 'sponsors'`.
  Total significa faturamento previsto (ingressos + patrocínio + outras receitas);
  sponsors significa patrocínio negociado previsto. Não usa receita recebida.
  Campo ausente assume total previsto; contexto de receita ausente resulta zero,
  nunca usa público como substituto.
- `unitValue: 4` significa 4%, não 0,04. O tipo interno continua `percent`.
- Quantidade fixa usa `qty ?? 1`: zero permanece zero, ausente assume uma unidade.
- Valores de despesa arredondados por lançamento a duas casas decimais, antes
  da soma. Correção numérica nos limites de meio centavo positivo/negativo.
- Campos de tipo, percentual, base e quantidade compartilhados entre editor
  de Despesas e criação rápida. Disponíveis em celular; valores exibidos com centavos.
- Financeiro, pagamentos e alerta de alimentação recebem o mesmo contexto de receita.
- Percentuais separados dos custos fixos: `percentCosts` é uma parcela própria.
- Simulador usa `financialSummary`, mantendo as bases escolhidas e recalculando
  percentuais sobre a receita simulada. Outras receitas previstas são mantidas.
- Ponto de equilíbrio considera percentual total na contribuição por ingresso e
  percentual de patrocínio na receita líquida de patrocínio. `breakEvenPossible`
  evita anunciar equilíbrio em zero vendas quando a contribuição não cobre os
  custos descobertos.

## Origem dos 25 lançamentos

Fixture versionada: `src/lib/fixtures/mct34-expenses.json`, extraída via openpyxl
do arquivo original `../Base da configuração - MesaCerta.xlsx`, aba Despesas.

- 17 fixos (D13:D29), 5 por pessoa (D34:D38), 3 percentuais (D44:D46).
- Faturamento B8 = 31206; patrocínio B9 = 20658.
- Público previsto B5 = 82; quantidade contratada para catering B7 = 100.
- A planilha tem quantidades próprias: 100 refeições, 360 águas, zero kits.
  O teste preserva quantidade/unitário originais na fixture e normaliza cada
  custo variável para custo por pessoa contratada (`unitValue × qty / 100`).
  Não foi implementado importador, migração ou novo mecanismo de persistência.
- D23 é um valor literal de R$520 com C23 vazio. O fixture deriva unitário como
  D23/B23. O JSON do piloto tinha esse total nulo; copiar somente o piloto perderia
  essa despesa. Nenhum arquivo de jev-pilot foi alterado.
- Os três percentuais reais estão zerados. Por isso os testes acrescentam casos
  separados de 4% sobre ambas as bases reais; bater apenas o total da planilha
  não seria suficiente para comprovar a correção.

## Critérios de aceite — comandos e saídas

Todos os cinco critérios da MCT-34 estão demonstrados pelo comando:

```powershell
node src/lib/selectors.test.mjs
```

Saídas literais relevantes:

```text
PASS CA1: 4% de 31206 = 1248.24; públicos 0/82/100/1000 não alteram o valor
PASS CA2: 4% de patrocínio 20658 = 826.32, diferente de 1248.24
PASS CA3: fixo qty=0 → 0; qty ausente → 1 unidade; qty=17 × 68 → 1156
PASS CA4/CA5: 25 linhas reais — comparação individual planilha × seletor
PASS CA4: total planilha=29718.98 sistema=29718.98; margem planilha=4.8% sistema=4.8%
PASS CA5: por participante recalcula; café real 60 × 100 = 6000; × 82 = 4920
11/11 testes MCT-34 PASS
```

Saída integral, incluindo os 25 pares planilha/sistema:
[evidencias/mct34/financeiro.txt](evidencias/mct34/financeiro.txt).

## Verificação no navegador

Usadas as skills agent-browser e agent-browser-verify. O servidor Vite próprio
foi verificado: página com conteúdo, controles de login renderizados, sem erros
de runtime. Em seguida foi testada a integração dos componentes financeiros,
com EventContext de fixture interceptado somente no navegador. Isso evita
alterar os arquivos dos executores paralelos ou depender de auth/persistência.
O HTML de harness não é rota da aplicação e não entra no build de produção.

Comandos (servidor e teste):

```powershell
$env:CHOKIDAR_USEPOLLING='1'
npm run dev -- --host 127.0.0.1 --port 5175 --strictPort

$env:MCT_PLAYWRIGHT_ROOT='C:/Users/Renan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'
$env:MCT_EVIDENCE_DIR='C:/Users/Renan/tmp/mct34-evidence'
node src/components/financial/browser.test.mjs
```

Saída literal:

```text
PASS 25 linhas renderizadas; total da tela R$ 29.718,98
PASS Editor percentual: 4% do faturamento R$ 31.206 → R$ 1.248,24
PASS Troca de base por linha: 4% de R$ 20.658 → R$ 826,32; público 1000 mantém valor
PASS Mobile 375px: percentual/base acessíveis e sem overflow horizontal
PASS Editor fixo: quantidade zero → R$ 0,00; quantidade 2 × R$ 4,00 → R$ 8,00
PASS Editor por pessoa: R$ 60 × público 1000 → R$ 60.000,00
PASS Criação rápida preserva percentual 4 e base patrocínio
PASS Financeiro: margem dos 25 lançamentos reais exibida como 4,8%
PASS Financeiro: total e rótulo percentual usam faturamento
PASS Simulador recalcula 4% com patrocínio 60000 + outras receitas 10548 → despesa 2821.92
PASS Zero erros de JavaScript/console nos componentes testados
11/11 verificações UI MCT-34 PASS
```

Saída integral: [browser.txt](evidencias/mct34/browser.txt).
Resultados: [browser-result.json](evidencias/mct34/browser-result.json).
Capturas: [celular](evidencias/mct34/expenses-mobile.png) e
[simulador](evidencias/mct34/simulator-desktop.png).

Este teste não é evidência de login real, persistência ou isolamento entre
organizações. Esses itens não pertencem ao escopo atual deste executor.

## Gates e regressões

| Comando | Resultado | Saída |
| --- | --- | --- |
| `node src/lib/selectors.test.mjs` | exit 0; 11/11 | [financeiro.txt](evidencias/mct34/financeiro.txt) |
| `node src/lib/networking/engine.test.mjs` | exit 0; 9 garantias passam | [engine.txt](evidencias/mct34/engine.txt) |
| `npm run lint` | exit 0 | [lint.txt](evidencias/mct34/lint.txt) |
| `npm run build` | exit 0; built in 4.71s | [build.txt](evidencias/mct34/build.txt) |
| `npm run typecheck` | falha; exit 1 reportado pelo runner; 240 diagnósticos TS | [typecheck.txt](evidencias/mct34/typecheck.txt) |
| teste de componentes no Edge | exit 0; 11/11 | [browser.txt](evidencias/mct34/browser.txt) |
| `git diff --check` nos arquivos editados | exit 0 | sem erros de whitespace |
| `git diff --exit-code -- src/lib/networking/engine.js` | exit 0 | motor sem diff |

SHA256 do motor:
`761187E4044C44F78B6777E3940A82998AC21F1759705375A4953437859136A2`.

Typecheck é uma falha global do estado compartilhado: há problemas de inferência
de props do shadcn, datas e arquivos em execução paralela. Nenhum diagnóstico
referencia `selectors.js` ou `ExpenseCostFields.jsx` nesta rodada. Não foi
corrigida a cadeia global de tipagem fora desta issue. Os avisos de configuração
do plugin legado e tamanho do bundle ainda aparecem no build; eles não impedem
a compilação e pertencem a outros trabalhos.

## Revisão do executor e discussão das melhorias

Esta revisão foi feita pelo executor, não é revisão independente.

1. **Base faltando nos chamadores:** corrigidos todos os chamadores de produção,
   incluindo total por categoria, pagamentos e alerta de alimentação. Testes
   verificam que total e pago não mudam ao alterar somente o público.
2. **Percentuais reais zero escondiam regressão:** adicionados casos não zero
   com as duas receitas reais e alterações de receita independentes.
3. **Quantidade zero e ausência eram confundidas:** aplicado operador nullish;
   controles preservam zero tanto na criação quanto na edição.
4. **Simulador mantinha percentual congelado:** cálculo reaproveita o seletor,
   sem aritmética financeira paralela. Teste visual muda patrocínio para 60000
   e comprova despesa percentual de 2821.92.
5. **Ponto de equilíbrio consumia custos percentuais como fixos:** separado
   percentual de fixo e ajustada contribuição líquida; teste comprova 48 vendas.
   Caso de taxa 100% com custos descobertos passa a exibir inviabilidade.
6. **Meio centavo e apresentação:** corrigidos 1.005, 35.675 e -1.005; exibidos
   centavos nas despesas. A fixture compara cada linha antes da soma.
7. **Teste antigo exigia os bugs:** atualizadas somente as duas expectativas
   financeiras em `src/components/networking/browser.test.mjs` (100 e zero).
   A suíte completa antiga de networking depende do bootstrap anterior e não
   foi usada como gate desta issue durante a troca paralela de auth.
8. **Tipagem do novo controle:** usado input nativo, evitando acrescentar novos
   diagnósticos à inferência problemática do Input shadcn.
9. **Harness:** corrigidos setup do renderer, preâmbulo Vite, compartilhamento da
   mesma instância React e espera da animação de fechamento do diálogo. Falhas
   intermediárias eram do harness; a rodada final possui zero erros de console.

## Arquivos deste executor

- src/lib/selectors.js
- src/lib/selectors.test.mjs
- src/lib/fixtures/mct34-expenses.json
- src/components/financial/ExpenseCostFields.jsx
- src/components/financial/browser.test.mjs
- src/components/financial/browser-harness.html
- src/components/layout/AddMenu.jsx — somente criação/campos de despesa
- src/components/networking/browser.test.mjs — somente expectativas financeiras
- src/pages/event/Expenses.jsx
- src/pages/event/Financial.jsx
- src/pages/event/Simulator.jsx
- docs/auditoria-mct34.md e docs/evidencias/mct34/*

## Fora do escopo, riscos e reversão

- Auth, Supabase, EventContext e persistência financeira não foram implementados
  aqui. O campo `revenueBase` é contrato da UI; o executor futuro de MCT-6 deverá
  preservá-lo ao persistir despesas. Nenhuma migration foi alterada.
- Somente faturamento previsto total ou patrocínio previsto são bases disponíveis.
  Campo ausente usa total; não há seleção de base monetária arbitrária.
- O oráculo respeita quantidades contratadas da planilha; a normalização do teste
  não equivale a implementar catering ou importar despesas na aplicação.
- Ponto de equilíbrio mantém o modelo de preço médio e custo por participante
  existente; não incorpora novos modelos de cortesias/catering da planilha.
- Falha global de typecheck permanece documentada; gates pedidos de lint/build
  e regressão do motor passam.
- Para reverter, retirar somente os hunks desta issue nos arquivos listados e
  os novos arquivos de teste/controle/fixture/documentação. Não executar restore
  global: existem mudanças simultâneas de outros executores, inclusive em
  AddMenu. Nenhuma alteração de banco ou dado precisa ser desfeita.

Implementação e aceite MCT-34 demonstrados. Encaminhada para revisão independente
no Linear; não marcada como revisão independente aprovada.

## Atualização posterior — nova revisão solicitada por Renan

Veja [review-mct34.md](review-mct34.md) para a rodada posterior, os achados
adicionais corrigidos, o projeto temático Financeiro do evento e a regra Todo.
Resultado atualizado: 15/15 testes financeiros, 12/12 verificações UI, lint e
build aprovados, motor preservado 9/9. Typecheck global continua falhando.
O valor da planilha é uma referência de teste; o novo teste de eventos distintos
comprova cálculos independentes com receitas e despesas diferentes.
