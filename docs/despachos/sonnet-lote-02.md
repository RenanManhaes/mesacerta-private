# Despacho Sonnet — Lote 02

**Issue:** MCT-22, a metade que falta — o julgamento pelo Jev.
**Pré-requisito:** as correções do lote 01 fechadas, com o pré-filtro já tratando
partículas portuguesas.

No lote 01 você construiu o pré-filtro: dada uma lista de pessoas, ele devolve
**pares candidatos**. Agora o Jev decide quais candidatos são de fato a mesma
pessoa, e o mesmo para empresas.

## O que a MCT-22 conserta

Dois defeitos reais do legado, ambos de correspondência frágil:

```js
// dedup de pessoas: só caixa e acento
DB.pessoas.forEach(x=>{const k=norm(x.nome);if(vistos[k])dup.push(x.nome);vistos[k]=1});

// empresa -> mesa: substring nos dois sentidos
const j=DB.mesas.findIndex(m=>norm(m).includes(n)||n.includes(norm(m)));
```

O segundo é o mais perigoso: **anfitrião na mesa errada estraga a rodada
inteira**, e com `SB INVESTIMENTOS & CONSÓRCIO` na lista uma entrada curta casa
com qualquer coisa.

## Entregável 1 — Julgamento de pessoa

`mesa-certa/src/lib/pessoas/dedup.js`

Recebe os pares candidatos do pré-filtro, pergunta ao Jev um Noul por par, e
classifica em três faixas:

| Faixa | Ação |
|---|---|
| acima do limiar alto | funde automaticamente, **com registro** |
| entre os dois limiares | devolve para o organizador confirmar |
| abaixo do limiar baixo | trata como pessoas distintas |

O `state` de cada par deve levar o que ajuda a decidir — nome, empresa quando
houver, e o `motivo` que o pré-filtro atribuiu.

**Cuidado com o `motivo`.** Ele entra no prompt como justificativa. Se o
pré-filtro disser "ordem_invertida" para um par Jr/Neto, você está afirmando ao
modelo algo falso. Esse defeito está na lista de correções do lote 01; confirme
que foi corrigido antes de usar o campo aqui.

Nenhuma fusão automática sem log contendo os dois registros originais e a
probabilidade.

## Entregável 2 — Julgamento de empresa

`mesa-certa/src/lib/pessoas/empresa.js`

Noul: *"estes dois nomes se referem à mesma empresa?"*, rodado nos candidatos do
casamento aproximado, antes de aceitar.

Regra dura: se o nome informado ficar acima do limiar para **duas mesas
diferentes**, não escolha nenhuma. Devolva ambiguidade para o organizador
resolver. Escolher a primeira é exatamente o bug do legado.

## Entregável 3 — Medição, no método do lote 01

Gabaritos em `jev-pilot/src/fixtures/`:

**3.1 `pares_pessoas.json`** — no mínimo 30 pares com veredito anotado, metade
duplicata real e metade não. Cubra o que o pré-filtro agora aceita: partículas
(`Joao Silva` / `Joao da Silva`), sufixo (`Jr`), inicial abreviada, ordem
invertida. E inclua os casos difíceis de verdade:

- pai e filho — `João Silva Jr` / `João Silva Neto`: **pessoas diferentes**
- homônimos de empresas diferentes: **pessoas diferentes**
- mesma pessoa com sobrenome de casada

**3.2 `pares_empresas.json`** — use as 14 patrocinadoras reais (constante
`SPONSORS` no HTML legado) contra variações plausíveis de digitação: abreviação,
sem acento, com/sem sufixo societário, e pelo menos dois pares **ambíguos** onde
a entrada casaria com duas mesas.

Estenda `medir.ts` para cobrir os dois conjuntos.

## O que o lote 01 ensinou — aplique aqui

A revisão de código do lote 01 achou três coisas que você precisa não repetir:

**1. Baseline de classe majoritária, sempre.** Em despesas, chutar `fixo` sempre
dava 65,2% e o Jev deu 73,9% — o relatório imprimia só o segundo. Aqui o risco é
igual: se o gabarito tiver 60% de "não é duplicata", um modelo que responde
sempre "não" tira 60%. **Imprima o baseline ao lado da taxa, sem exceção.** É
por isso que pedi metade/metade nos pares.

**2. Teste que não pode falhar é pior que teste nenhum.** O teste de custo do
lote 01 afirmava medir comparações contra N², mas asseria sobre pares de saída —
e como o fixture era todo de pessoas distintas, passava mesmo se a função
retornasse lista vazia. Todo teste que você escrever aqui: pergunte-se *o que
teria que estar quebrado para isto falhar*. Se a resposta for "nada", o teste é
decorativo.

**3. Nada de sucesso silencioso.** `--limite` sem valor e `--somente` com typo
faziam o arnês sair verde tendo medido zero. Qualquer flag nova valida a entrada
e sai diferente de zero quando não entende.

## Critérios de aceite

1. `"João Silva"`, `"Joao Silva"` e `"J. Silva"` da mesma empresa são
   sinalizados como possível duplicata.
2. `"João Silva"` e `"João Santos"` **não** são sinalizados.
3. `"João Silva Jr"` e `"João Silva Neto"` **não** são fundidos automaticamente.
4. Com 200 pessoas, o número de chamadas ao Jev é registrado e é muito menor que
   19.900. Asserte sobre **chamadas efetuadas**, não sobre pares devolvidos.
5. `"SB"` casa com `SB INVESTIMENTOS & CONSÓRCIO`; um nome ambíguo entre duas
   mesas não é resolvido sozinho.
6. Toda fusão automática tem log com os dois originais e a probabilidade.
7. A medição imprime taxa de acerto **e** baseline de classe majoritária para os
   dois conjuntos.

## Limites

Não toque em `src/lib/networking/engine.js` nem em nada sob `src/pages/` — o
Codex está lá. Não commite. Não faça deploy.

## Relatório

Por critério: o comando que prova e a saída literal. Mais o baseline ao lado de
cada taxa, e uma frase direta sobre se o *confidence-gated routing* funciona
nestes dois campos — ou seja, se errar anda junto com confiança baixa.

Se o resultado for ruim, diga que é ruim. Um número honesto que reprova vale mais
que um número bonito que não se sustenta.
