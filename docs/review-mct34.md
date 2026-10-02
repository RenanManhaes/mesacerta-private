# MCT-34 — segunda rodada de code review do executor

Data: 01/10/2026. Estado observado da branch: commit 40b3224.
Projeto Linear atual: **Financeiro do evento** (5fe2988c-81b0-4cd5-ac47-cf4f79c7c730).
Issue MCT-34 permanece em In Review, com documento vinculado à issue.

## Organização e responsabilidade

Conferido o projeto atual após a reorganização temática de Claude. A orientação
de Renan foi registrada em docs/fluxo-linear.md: selecionar issues no projeto
correto e passar Backlog → Todo antes de executar, preservando estados avançados.
O status disponível no time Mesa Certa tem nome literal **Todo**.

Autenticação está sob responsabilidade dos demais executores, conforme Renan;
esta rodada não alterou autenticação, src/api, EventContext, migrations ou motor.

## Achados e correções

**P2 — ponto de equilíbrio podia indicar prejuízo após arredondar os percentuais.**
A fórmula somava alíquotas sem conferir o arredondamento de cada lançamento.
Reprodução: ingresso R$0,05; fixo R$0,05; duas despesas de 25% da receita.
A indicação anterior era 2 vendas: receita R$0,10, despesas R$0,11, prejuízo R$0,01.
Corrigido para conferir os totais efetivos e indicar 3 vendas.

**P2 — equilíbrio pontual não assegurava equilíbrio com mais vendas.**
No limite de ingresso R$0,01 e fixo R$0,01, com duas taxas de 25%, uma venda
iguala receitas e despesas, mas duas vendas geram prejuízo de um centavo.
O cálculo agora encontra o último volume com prejuízo dentro da faixa afetada
por arredondamento; nesse exemplo, anuncia equilíbrio a partir de 3 vendas.

**P3 — a conferência de centavos precisava ter execução limitada.**
A faixa de conferência deriva do erro máximo de meio centavo por lançamento.
Quando ultrapassa 1000 incrementos, usa o limite superior conservador e marca
breakEvenApproximate. Financeiro e Simulador apresentam explicitamente a palavra
estimativa, evitando bloquear a tela em contribuições muito pequenas.
Há teste de cálculo e teste visual para esse caso.

**Esclarecimento solicitado por Renan — os R$29.718,98 não são regra do produto.**
Essa constante só é o esperado da fixture da planilha. Os cálculos recebem os
dados de cada evento e não consultam a fixture. Busca nos seletores/controles/
telas desta entrega por 29718, 31206 ou 20658 retornou vazia (rg exit1, que indica
nenhuma ocorrência). Nenhum desses valores foi fixado no cálculo de produção.
Adicionado teste com dois eventos diferentes, sem alterar nenhum deles:
A: receita R$50.000, despesas R$22.000.
B: receita R$80.000, despesas R$22.700.
Recalcular A com outro público e patrocínio não altera o resultado de B.

## Resultado da revisão

Achados acima corrigidos nesta rodada. Revisão de responsabilidade do executor.
Nenhuma alegação de revisão independente ou de verificação do backend.

Arquivos de código alterados nesta rodada:
- src/lib/selectors.js
- src/lib/selectors.test.mjs
- src/pages/event/Financial.jsx
- src/pages/event/Simulator.jsx
- src/components/financial/browser.test.mjs

Documentação: este relatório, adendo em docs/auditoria-mct34.md,
docs/fluxo-linear.md e docs/evidencias/mct34/review-*.

## Evidências finais

`node src/lib/selectors.test.mjs`:

```text
PASS Review: duas taxas de 25% arredondadas — equilíbrio em 3 vendas, não 2
PASS Review: contribuição mínima usa estimativa conservadora explícita e sem busca excessiva
PASS Review: equilíbrio pontual em 1 venda seguido de prejuízo em 2 não anuncia lucro a partir de 1
PASS Eventos independentes: A receita=50000 despesa=22000; B receita=80000 despesa=22700
15/15 testes MCT-34 PASS
```

Saída integral, incluindo comparação dos 25 lançamentos:
[review-financeiro.txt](evidencias/mct34/review-financeiro.txt).

`node src/components/financial/browser.test.mjs`, com o mesmo setup de ambiente
descrito no relatório inicial e MCT_EVIDENCE_DIR apontando para
C:/Users/Renan/tmp/mct34-review-evidence:

```text
PASS Review: estimativa conservadora identificada nas telas Financeiro e Simulador
PASS Zero erros de JavaScript/console nos componentes testados
12/12 verificações UI MCT-34 PASS
```

[review-browser.txt](evidencias/mct34/review-browser.txt) e
[review-browser-result.json](evidencias/mct34/review-browser-result.json).

- npm run lint: exit0 ([saída](evidencias/mct34/review-lint.txt)).
- npm run build: exit0; built in 2.59s ([saída](evidencias/mct34/review-build.txt)).
- node src/lib/networking/engine.test.mjs: exit0, 9 garantias aprovadas
  ([saída](evidencias/mct34/review-engine.txt)).
- npm run typecheck: falha global, 240 diagnósticos; registrada integralmente
  em [review-typecheck.txt](evidencias/mct34/review-typecheck.txt).
- git diff --check nos arquivos revisados: exit0.
- git diff --exit-code -- src/lib/networking/engine.js: exit0.
- SHA256 do motor permanece
  761187E4044C44F78B6777E3940A82998AC21F1759705375A4953437859136A2.

O total da fixture permanece R$29.718,98 e a margem 4,8%. Isso comprova
compatibilidade com aquele evento, junto dos testes independentes com valores
diferentes que comprovam que o cálculo não depende dele.

## Limitações e reversão

O ponto de equilíbrio mantém as hipóteses existentes de preço médio e custo
variável por venda; não implementa modelos novos de cortesias/catering.
Em contribuição muito pequena, a quantidade é uma estimativa conservadora
identificada na interface. A falha global de tipagem continua fora do escopo
desta issue, registrada para o responsável correspondente.

Reverter somente os hunks desta rodada nos cinco arquivos de código listados.
Não fazer restore global, pois o repositório contém alterações de outros
executores. Nenhum banco, usuário ou dado remoto foi modificado. Sem commit,
push ou deploy.

