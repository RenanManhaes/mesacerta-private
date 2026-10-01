# Entrega da landing page — MCT-43 / MCT-44

01/10/2026. Base: `40b322438d033545fc52918651f29e11f259cd68`. Branch original: `landing-page-v1`, `66980cae6738aea90857b69b30205cd86891d5e9`.

## Correções

- Alertas em objetos: eliminados os três erros novos de tipagem.
- Menu, FAQ e seleções com estados acessíveis; pausa dos exemplos e respeito a movimento reduzido; elementos demonstrativos sem ação deixaram de ser botões.
- Planos comunicam vendas ainda não abertas. Criar conta leva ao cadastro existente e esclarece que cadastro não contrata nem cobra.
- Idioma pt-BR, descrição da página, favicon próprio; removido link para manifest inexistente.
- Vercel configurada para Vite, `npm run build`, saída `dist`. Destino: somente projeto `mesacerta-brasil` (`prj_Vwla6oaASbcMhd2UgL2ldfpTMdDm`). Não publicar no legado `mesacerta-tau.vercel.app`.

## Regularização de tipos herdados — MCT-44, projeto Fundação

Os 246 erros anteriores à landing foram eliminados sem desligar `checkJs` nem suprimir diagnósticos. Foram declarados contratos de propriedades React/Radix, opcionais já tratados pelo JSX e tipos de ambiente Vite. O layout de autenticação e o helper visual financeiro receberam somente JSDoc: nenhum fluxo de autenticação ou regra financeira mudou.

Formatação usa timestamps explicitamente. No motor, duas anotações de arrays e a conversão explícita de booleanos para números preservam a expressão de ordenação existente; não foi reescrito o algoritmo.

Foi adicionado `npm test` para agregar as seis suítes Node já existentes e `scripts/verify-type-contracts.mjs` para comparar com o código da base revisada.

## Evidências

```text
npm run lint: exit 0
npm run typecheck: exit 0 — zero erros (antes: 249; base: 246)
npm test: 6 arquivos de teste passaram; fail 0
node src/lib/networking/engine.test.mjs: 9/9
node scripts/verify-type-contracts.mjs:
PASS: 11 component contracts emit identical JavaScript
PASS: date formatting and day differences preserve base behavior
PASS: identical networking grids and analyses in five deterministic scenarios
npm run build: exit 0
git diff --check: sem erros
```

Navegador local: vitrine pública renderiza; desktop 1440×1000 com login visível; móvel 375×812 com menu e estados corretos, sem overflow horizontal observado; login leva a `/login`; CTA de cadastro leva a `/register`; rota `/novo` exige login; pausa mantém o exemplo estável por mais de um intervalo. Meta description, idioma e favicon verificados. Não houve compra, cadastro real nem login com senha de cliente durante os testes.

Code review manual repetido: nenhum achado crítico ou alto remanescente no diff. CodeRabbit indisponível nesta máquina: WSL só possui docker-desktop, e o comando de revisão retorna `/bin/sh: bash: not found`; não afirmar que CodeRabbit passou. O fluxo de pre-push AIOX classifica erro genérico da ferramenta como CONCERNS. Limitação registrada no PR/Linear; aprovação automática e publicação já autorizadas por Renan.

Avisos não bloqueantes: bundle principal acima de 500 kB e configuração Base44 legada. Autenticação usa Supabase; o fluxo público foi verificado. Não foram incluídas mudanças financeiras locais de MCT-34 ou outras alterações do diretório principal.

## Publicação e reversão

O projeto Vercel não tem integração Git: PR/merge não publica sozinho. A publicação deve usar o projeto vinculado `mesacerta-brasil`, com as variáveis de produção configuradas lá. Nunca enviar as configurações fictícias usadas no primeiro teste como ambiente de produção.

SHAs finais, URL do PR e IDs/URLs dos deploys serão registrados no Linear após cada etapa. Para reverter código: reverter o commit do merge via novo PR. Para reverter a publicação: reapontar o projeto ao deployment anterior registrado antes da promoção.
