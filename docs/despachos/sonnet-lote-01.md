# Despacho Sonnet — Lote 01

**Issues:** MCT-20 (parte offline) e MCT-22 (pré-filtro)
**Condição de parada:** entregáveis abaixo completos e verificados, ou bloqueio
real reportado. Não pare por issue; pare por lote.

## Por que este lote existe

`TYPESAFE_API_KEY` está vazia. Nenhuma chamada ao Jev pode ser feita agora.

Este lote constrói **tudo que não depende da chave**, de forma que quando ela
existir baste rodar um comando para obter os números do MCT-20.

**Não tente obter uma chave. Não use outro provedor. Não invente resposta do
Jev para "testar".** Se um passo exigir a API real, pare e reporte.

## Entregável 1 — Gabaritos

Três conjuntos, em `jev-pilot/src/fixtures/`.

**1.1 Despesas — já existe.** `despesas.json`, 25 linhas reais, com
`secao_planilha` como gabarito de `tipo_custo`. Não refaça.

Atenção documentada: a planilha se contradiz. "Sacolas" e "Caneta e Caderno",
ambas com quantidade 90, estão em CUSTOS FIXOS quando são claramente por
participante. Marque essas linhas como `gabarito_duvidoso: true` para que a
medição possa reportá-las à parte, em vez de contá-las como erro do modelo.

**1.2 Segmento por empresa — criar.** As 14 patrocinadoras do Get Connected
estão na constante `SPONSORS` de
`Get Connected Sorocaba 2026/Rodadas de Negocio/rodadas-de-negocio.html`, no
repositório `RenanManhaes/mesacerta-private`:

```
INTERFOCUS, NETTOP, ASSESSOR ARQ, ENTRE SONHOS E NÚMEROS, SUMITANI,
PORT CONSULTING, SB INVESTIMENTOS & CONSÓRCIO, DESTRAVAHUB, PAULO VALLE,
DML CORRETORA, ADEMICON, CLIMBZ, JAWUL, CONVEXXA
```

Crie `segmentos.json` com uma taxonomia fechada de segmentos e, para cada
empresa, o segmento esperado.

**Onde o nome não permitir inferir o segmento com honestidade, marque
`gabarito: null` e explique.** Um gabarito inventado é pior que gabarito
faltando — ele produz uma taxa de acerto falsa. Espera-se que várias fiquem
nulas; isso é resultado, não falha.

**1.3 Parsing de linha colada — criar.** `linhas_coladas.json`, 20 linhas no
formato que o importador do legado aceita (`Nome; EMPRESA; fixo`), com o
`papel` e `situacao` esperados. Inclua variações propositais: "roda" x
"rodando", "fixo" x "fica fixo", stand, campo faltando, ordem trocada, acento
inconsistente, espaço extra.

Referência do comportamento atual: função `importar()` e `addPessoa()` no HTML
legado.

## Entregável 2 — Arnês de medição

`jev-pilot/src/medir.ts`, rodando com `npm run medir`.

Para cada conjunto, deve produzir:

- taxa de acerto, com as linhas `gabarito_duvidoso` e `gabarito: null`
  reportadas **separadamente**, nunca somadas ao denominador principal;
- **correlação entre errar e confiança baixa** — este é o número mais
  importante do lote. Se o modelo errar com confiança alta, o
  *confidence-gated routing* não funciona e todo o desenho do marco 09 precisa
  mudar. Reporte isso de forma inequívoca;
- limiar de confiança sugerido por tipo de pergunta, derivado dos dados;
- custo real em USD e contagem de tokens;
- tabela final legível no terminal.

**Modo `--dry-run` obrigatório:** roda o pipeline inteiro com respostas
sintéticas, sem tocar a API, para que a lógica de medição seja verificável hoje.
É assim que você valida este entregável sem a chave.

## Entregável 3 — Pré-filtro de deduplicação (MCT-22)

`mesa-certa/src/lib/pessoas/prefiltro.js` mais teste em `.test.mjs`, no mesmo
estilo de `engine.test.mjs` (sem test runner, roda com `node`).

Pura função, **sem IA**: recebe uma lista de pessoas e devolve os pares
candidatos a duplicata. É o que impede o custo N² antes de o Jev entrar.

Deve reconhecer como candidatos:

- acento e caixa diferentes — "João Silva" / "joao silva"
- sufixo — "João Silva" / "João Silva Jr"
- inicial abreviada — "João Silva" / "J. Silva"
- ordem invertida de nome e sobrenome
- espaço duplicado, espaço no fim

E **não** marcar como candidatos: "João Silva" / "João Santos", nem duas
pessoas distintas que só compartilham o primeiro nome.

Requisito de custo, verificável em teste: para 200 pessoas, o número de pares
candidatos deve ficar **abaixo de 500** — contra os 19.900 do N².

## Como verificar antes de entregar

```bash
cd jev-pilot && npx tsc --noEmit && npm run medir -- --dry-run
cd ../mesa-certa && node src/lib/pessoas/prefiltro.test.mjs
```

Os três têm de passar limpos.

## Regras

Valem as do `mesa-certa/AGENTS.md`. Em especial:

- **Não encoste em `src/lib/networking/engine.js`.** Outro agente pode estar
  trabalhando em `src/pages/event/Networking.jsx`. Não toque em nada sob
  `src/pages/`.
- Não commite, não faça push, não faça deploy.
- Não instale dependência nova sem necessidade demonstrada.

## Relatório final

Por entregável: o que ficou pronto, o comando que prova, a saída dele.

Mais, obrigatoriamente:

1. **Quantas empresas ficaram com `gabarito: null`** e por quê.
2. **O que você não conseguiu fazer sem a chave**, item a item.
3. Riscos que você viu e não estavam aqui.

Relatório otimista não passa. A aderência é conferida contra o diff e a saída
dos comandos.
