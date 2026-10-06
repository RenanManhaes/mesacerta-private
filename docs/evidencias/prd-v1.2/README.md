# Evidências da atualização do PRD v1.2

Executadas em 06/10/2026 na branch `docs/prd-v1-2`, baseada em main
`a4c062be894f832cadd18fd726146ab8478c82cd`. A entrega altera somente documentação.

| Verificação | Saída de comando | O que demonstra |
|---|---|---|
| Conferência documental com Node, `node --input-type=module` | [acceptance.txt](acceptance.txt) | Hash da v1.1 copiada sem alteração; seções 1–59; cobertura de MCT-46–64; distinções explícitas de fundador/código/spike/migração pendente; links locais; exemplo financeiro pelo selector; diff somente documental. |
| `gh pr list --repo RenanManhaes/mesacerta-private --state all --limit 40 --json number,state,title` | [pr-snapshot.json](pr-snapshot.json) | Estados das PRs consultados para §57; não confirma deploy ou aplicação de migração. A PR #27 está fechada, mas o código está na integração de main. |
| `npm run lint` | [lint.txt](lint.txt) | Exit code 0. |
| `npm run typecheck` | [typecheck.txt](typecheck.txt) | Exit code 0. |
| `npm run build` | [build.txt](build.txt) | Exit code 0; contém avisos de configuração residual Base44 e tamanho de bundle, sem deploy. |
| `node src/lib/networking/engine.test.mjs` | [engine.txt](engine.txt) | Nove garantias do cenário real passando; exit code 0. |

A conferência documental usou `node:assert/strict`, leitura UTF-8, SHA-256 dos
arquivos, extração de títulos `^## (\d+)\.` e linhas `| [MCT-`, resolução de links
por `node:path` e `fs.existsSync`, e listagem de alterações com `git diff
--name-only` e `git ls-files --others --exclude-standard`. É conferência da
entrega documental; não é teste de aceite da implementação das 19 issues.

O exemplo de §24 foi conferido chamando a função existente, sem mudar código:

```js
import { financialSummary } from './src/lib/selectors.js';
const summary = financialSummary({
  expectedAudience: 150,
  tickets: [{ lots: [{ price: 299, expectedSales: 150 }] }],
  sponsors: [{ negotiated: 25000 }],
  expenses: [
    { type: 'fixed', qty: 1, unitValue: 18000 },
    { type: 'perParticipant', unitValue: 72 },
  ],
});
console.log(summary);
```

Nenhuma regra de acesso foi alterada nesta entrega. As evidências de API/RLS
pertencem às PRs de implementação e ao relatório de revisão referenciado no
PRD. O ajuste do fundador dos eventos reais na migração permanece pendente;
este conjunto de verificações não afirma que foi aplicado.
