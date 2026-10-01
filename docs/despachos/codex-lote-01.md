# Despacho Codex — Lote 01

**Issues, nesta ordem:** MCT-1 → MCT-19 → MCT-33 → MCT-32
**Condição de parada:** os critérios de aceite das quatro demonstrados com saída
de comando. Não pare entre issues.

Leia `AGENTS.md`, `docs/unificacao.md` e cada issue no Linear (time Mesa Certa)
antes de começar.

## Por que esta ordem

MCT-1 é auditoria e vem primeiro porque **ainda não sabemos se este projeto
compila.** Ele veio de um ZIP exportado do Base44 e nunca foi executado aqui.
Se `npm run build` estiver quebrado, as outras três issues vão falhar por um
motivo que não tem nada a ver com elas, e você vai perder tempo caçando fantasma.

Depois, MCT-19 liga o motor à tela. MCT-33 e MCT-32 dependem dessa ligação
existir.

## Sua faixa de arquivos

Você é dono de:

```
src/pages/**          src/components/**          docs/auditoria*.md
```

**Não toque** em `jev-pilot/`, `src/lib/pessoas/` nem `src/lib/networking/engine.js`.
Outro agente está trabalhando nos dois primeiros. O terceiro é intocável por
outro motivo (abaixo).

## O motor é intocável

`src/lib/networking/engine.js` é port fiel do algoritmo que rodou no evento real:
permutações cíclicas mais recozimento simulado. Uma "melhoria" ali quebra
garantias de forma silenciosa — o código continua rodando e produzindo uma grade
pior, sem erro nenhum.

Você **consome** o motor. Não o edita.

Se alguma coisa parecer exigir mudança nele, pare e reporte. É sinal de que a
integração está sendo feita errada, não de que o motor está errado.

Seu oráculo, antes e depois de qualquer mudança:

```bash
node src/lib/networking/engine.test.mjs   # tem de passar 9/9
```

## MCT-1 — Auditoria

Entregue `docs/auditoria-base-tecnica.md` com o que **reproduziu**, não com o que
supôs.

- Estado real de `npm install`, `lint`, `typecheck`, `build`. Saída literal.
- Dependências declaradas e não usadas.
- Onde `localStorage` aparece como fonte de verdade.
- O acoplamento ao SDK Base44: quais arquivos, quão fundo.

Se algo estiver quebrado, **conserte o que for mecânico** (import errado, script
faltando, versão incompatível) e **reporte o que for decisão**.

## MCT-19 — Ligar o motor à tela

`src/pages/event/Networking.jsx` hoje importa um módulo que **não existe mais**:

```js
import { generateDistribution, participantRoute } from '@/lib/networking/distribution';
```

Esse arquivo era um mock do Base44 e foi deletado de propósito — ele gerava
participantes fictícios a partir de contagens em vez de distribuir pessoas reais.

A API nova está em `@/lib/networking/engine`:

```js
gerarDistribuicao({ P, T, R, cap, fixosPorMesa, mesaDaCasa, seedBase })
rotaDoParticipante(tab, i)
```

**A armadilha:** `P` é o número de participantes que **rodam**, não o total de
pessoas. Anfitrião fixo não entra em `P` — ele ocupa cadeira mas não circula.
Confundir os dois índices desloca todas as rotas em silêncio, sem erro.

O critério 2 da issue existe exatamente para pegar isso: o resultado pela tela
tem de bater com o que `engine.test.mjs` produz para a mesma seed.

## MCT-33 — O que o legado tem e a plataforma não

Rota individual, análise de conflitos por dupla, avisos de cadastro e export PDF.

`analyze()` já devolve tudo que você precisa: `pairs` (ordenado com as duplas de
mesma mesa primeiro), `visitNo`, `repByPart`, `person`. Falta a tela.

O legado está em `rodadas-de-negocio.html` (repositório `mesacerta-private`,
pasta `Get Connected Sorocaba 2026/Rodadas de Negocio/`). **Porte o
comportamento e os critérios, não o DOM.**

Preste atenção num aviso específico do legado: quando há rodadas ≥ mesas, é
matematicamente impossível tirar o anfitrião rotativo da mesa da própria
empresa. O legado não diz só "há conflito" — ele explica por que é inevitável e
sugere usar no máximo `T−1` rodadas. É esse nível de explicação que o PRD §3
pede. Não reduza a um ícone vermelho.

## MCT-32 — Desenho espacial das mesas

O maior item do lote e **requisito obrigatório** do PRD (§29). Leia §29 a §38
inteiros; eles têm até um diagrama do alvo.

O essencial: cadeiras no perímetro da mesa, nunca em lista abaixo. Número de
cadeiras igual à capacidade. Lugar vazio continua desenhado. Anfitrião ocupa
cadeira com marca própria. No mobile, uma mesa por linha — **não** troque por
tabela.

Os estados de cadeira já existem como critério no legado: `casa` sai de
`rotMesa(i)===t`, `returning` sai de `A.visitNo[i][r]>1`.

O §43 é explícito sobre o que evitar: gradiente, glow, glassmorphism, sombra
pesada, componente muito arredondado. **Deve parecer planta baixa, não
infográfico.**

Esta issue será revisada visualmente por uma pessoa. Critério atendido no papel
com resultado feio não passa.

## Pare e reporte se

- O build estiver quebrado por motivo que exija decisão de arquitetura.
- Algo exigir mudar `engine.js`.
- Surgir a questão de manter o Base44 como backend ou migrar para Supabase
  (PRD §48). **Essa decisão não é sua e não é minha.** Está em aberto.
- Um critério de aceite for impossível como está escrito. Diga qual e por quê.

## Não faça

Commit, push, deploy, exclusão de dado, instalação de serviço pago, alteração do
legado em produção.

## Relatório final

Por issue: cada critério de aceite, o comando que o prova, a saída literal.

Mais: o que ficou de fora e por quê, riscos que você viu e não estavam aqui, e
como reverter.

Gerar código não é concluir. Concluir é demonstrar os critérios. A aderência
será conferida contra o diff e a saída dos comandos — não contra o relatório.
