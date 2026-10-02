# Onde o Jev é útil no Mesa Certa

Estudo feito depois de ler o motor real (`rodadas-de-negocio.html`, 1403 linhas,
usado no Get Connected Sorocaba 2026) e o esqueleto do Base44.

## A regra de corte

O Jev responde perguntas tipadas sobre texto e devolve valor + probabilidade
calibrada. Ele **não** decide fluxo, não gera código e não faz conta.

No Mesa Certa isso separa o produto em dois territórios:
<!--  -->
| Território | Quem resolve |
|---|---|
| Distribuição das mesas, recozimento simulado, detecção de conflito, rota | **Código.** Combinatória determinística. Jev nunca entra. |
| Faturamento, margem, ponto de equilíbrio, capacidade, recálculo de custo | **Código.** Aritmética. Jev nunca entra. |
| Texto livre virando dado tipado — importação, categorização, deduplicação | **Jev.** |
| Julgamento semântico que vira peso numérico para o código otimizar | **Jev.** |

Tudo abaixo está no terceiro e quarto território.

---

## 1. Segmento → diversidade de encontros ⭐

**O maior ganho, e é um buraco real, não um enfeite.**

O PRD §27 lista sete prioridades do motor. A regra 5 é *"Maximizar diversidade
de encontros"*. Ela **não está implementada**.

Olhando `pairCost` em `engine.js`: o recozimento minimiza *reencontro* — duas
pessoas que já se viram pagam mais caro para cair na mesma mesa de novo. Mas
todas as duplas valem exatamente o mesmo. O motor não tem nenhuma noção de
*quem vale a pena conhecer quem*. Ele produz encontros bem espalhados, não
encontros bem escolhidos.

E há um detalhe revelador no importador do HTML (linha ~1153):

```js
// planilha: Nome | Papel | Empresa | Segmento | Situação
```

O formato **já aceita uma coluna Segmento** — e `addPessoa` a descarta. O dado
foi previsto e nunca chegou a ser usado.

**O que o Jev faz:** classifica cada empresa em um segmento (Choice sobre uma
taxonomia que o organizador define). 76 chamadas, custo desprezível.

**O que o código faz:** usa o segmento como termo de diversidade dentro de
`pairCost` — sentar dois de segmentos complementares passa a custar menos que
sentar dois do mesmo segmento. O recozimento continua sendo do código; o Jev só
preencheu o campo que faltava.

Essa divisão é o padrão canônico da doc: o modelo julga, o código otimiza.

> **Pré-requisito honesto:** hoje só os patrocinadores têm empresa cadastrada.
> A importação de convidados (`tipo === "conv"`) passa empresa vazia. Para isso
> funcionar, o organizador precisa fornecer a empresa de cada convidado — o
> formato TSV já suporta, a coleta é que não acontece.

---

## 2. Deduplicação de pessoas

**Problema real no código atual.** O aviso de nome repetido é:

```js
const vistos={},dup=[];
DB.pessoas.forEach(x=>{const k=norm(x.nome);if(vistos[k])dup.push(x.nome);vistos[k]=1});
```

`norm` só baixa caixa e tira acento. Pega `"João Silva"` vs `"joão silva"`. Não
pega `"João Silva"` vs `"Joao Silva Jr"`, `"J. Silva"`, ou a mesma pessoa
digitada com o sobrenome de casada.

Num evento de 76 pessoas montado a partir de listas coladas de WhatsApp e
Sympla, duplicata vira cadeira vazia na rodada.

**Jev:** Noul *"estes dois registros são a mesma pessoa?"*, rodado **só nos pares
que um filtro barato já marcou como parecidos** — nunca N². Abaixo do limiar,
não funde: marca para o organizador confirmar.

---

## 3. Casamento empresa → mesa

`acheMesa` faz match exato e, falhando, substring nos dois sentidos:

```js
const j=DB.mesas.findIndex(m=>norm(m).includes(n)||n.includes(norm(m)));
```

Com `SPONSORS` contendo `SB INVESTIMENTOS & CONSÓRCIO` e `ASSESSOR ARQ`, uma
entrada curta e genérica pode casar com a mesa errada — e anfitrião na mesa
errada estraga a rodada inteira.

**Jev:** Noul *"estes dois nomes se referem à mesma empresa?"* nos candidatos do
substring, antes de aceitar o match.

---

## 4. Importação de texto colado

As caixas de importação aceitam `Nome; EMPRESA; fixo (ou roda)` e resolvem
papel e situação por regex:

```js
sit.startsWith("fix")?"fixo":sit.startsWith("fora")||sit.startsWith("stand")?"fora":...
```

Funciona quando a pessoa escreve exatamente o esperado. **Jev:** Choice para
`situacao` e `papel` quando a linha não bate no padrão, em vez de cair no
default silencioso (`convidado roda, anfitrião fica fixo`).

---

## 5. Importação de despesas ✅ construído

Está em `../jev-pilot/`, rodando sobre as 25 despesas reais da planilha do
evento. Classifica `categoria`, `tipo_custo`, `entregavel_de_patrocinador` e
`risco_de_estourar`. Mede o próprio acerto contra a seção da planilha.

## 6. Fornecedores

Mesma forma do item 5 — `categoria` e `status` a partir de descrição livre.
Reaproveita o código do piloto quase inteiro.

---

## Ordem sugerida — parte 1 (importação e motor)

1. **Despesas** (feito) — valida o Jev com custo e risco baixos.
2. **Dedup + casamento de empresa** — conserta bug existente, não depende de dado novo.
3. **Segmento + diversidade** — o diferencial de produto, depois que a coleta de empresa por convidado existir.

Os itens 2 e 3 têm ordem invertida em valor e em prontidão: o 3 vale mais, o 2
está pronto para ser feito hoje.

---
---

# Parte 2 — Simulador, assistente e tipagem

Decidido em conversa. **Não implementar ainda**; registrado para quando for a hora.

## 7. Jev no simulador — o Jev não escreve a dica, ele ordena os cenários ⭐

Hoje `Simulator.jsx` é manual: cinco sliders e um `useMemo` com
`faturamento = participantes × preço + patrocínio`. Pura aritmética.

A evolução natural **não tem IA**: o código gera dezenas de cenários sozinho —
preço +5/+10/+15%, mais uma cota Ouro, cortar o almoço, 6→7 cadeiras por mesa,
mexer no mix de lotes. Instantâneo, com os números exatos que já existem.

O problema aparece na hora de ordenar. **Ordenar por margem dá sempre a pior
resposta:** o cenário de maior margem vai ser "corte o almoço e cobre R$ 900".
Os números não enxergam que é uma ideia terrível.

**Jev:** pontua cada cenário nas dimensões que a conta não vê.

| Pergunta | Primitiva |
|---|---|
| `agressividade_do_preco` — sai do padrão para este público? | Score |
| `impacto_na_experiencia` — quanto machuca um evento de dia inteiro? | Score |
| `esforco_de_execucao` — dá para fazer faltando 3 semanas? | Score |

**Código:** compõe `ganho_em_margem × viabilidade`, ordena, mostra os 3
melhores. A frase é **template preenchido com número**, não prosa gerada — que
é o que o PRD §3 pede ("Dado → Contexto → Decisão") e o que o §42 manda evitar
("aparência de dashboard genérico feito por IA").

**O simulador não precisa de LLM.** Código faz o fan-out, Jev pontua
viabilidade, código monta a frase.

Padrões da doc aplicados: *Speculative Fan-out* + *Composite Scoring*.

> O determinismo do simulador é o ativo, não a limitação. O Jev não substitui a
> conta — ele ordena as saídas dela.

## 8. A nuvenzinha de ajuda — Jev dos dois lados do LLM

A ideia inicial era: o LLM responde, o Jev alimenta ele em tempo real. Metade
certa, e a metade errada é cara.

Se o LLM é quem responde, é ele quem fala os números. Num produto financeiro,
um assistente dizendo *"faltam R$ 15.200 para a meta"* quando o certo é
R$ 12.800 queima a confiança de forma permanente. Enriquecer o prompt **reduz**
a taxa disso; não elimina.

### Antes do LLM — roteamento de intenção

Jev Choice sobre um conjunto fixo de intenções; o código decide o caminho:

| Pergunta | Caminho |
|---|---|
| "quanto falta pra meta?" | resposta direta do estado, **sem LLM** |
| "quem ainda não confirmou?" | consulta, **sem LLM** |
| "como consigo mais patrocinador?" | LLM — é conselho aberto |
| ambígua / confiança baixa | pergunta de volta |

A maioria das perguntas de um organizador é consulta de número que o sistema já
calculou. Mandar essas para o LLM é inventar erro onde não havia.

### Depois do LLM — guardrail

Antes de exibir, Jev Noul: *"esta resposta afirma algum número que não está no
estado fornecido?"* Se sim, bloqueia ou obriga a citar.

O assistente é, na maior parte do tempo, **não-LLM** — e quando é, sai conferido.

Cookbooks correspondentes: *Intent Routing* e *Guardrails for LLMs*.

## 9. Tipagem na criação do evento — o gargalo de tudo

**O simulador só vale o que os campos valem.**

`CreateEvent.jsx` hoje coleta nome, data, cidade, público, capacidade e cinco
perguntas Sim/Não/"Ainda não sei". Com isso o Jev não tem como julgar "esse
preço é agressivo?" — ele não sabe o que é o evento nem para quem.

Falta tipar:

- `tipo_de_evento` — **inferido pelo Jev** a partir de nome + cidade, não
  perguntado (serve o §7, "não utilizar formulário gigante")
- `publico_alvo` — empresário, técnico, estudante. É isso que decide se R$ 299
  é caro ou barato
- `posicionamento` — popular / intermediário / premium (Score)
- `experiencia_do_organizador` — decide se "vender 10 cotas" é realista

Sem esses campos, qualquer julgamento do Jev no simulador é chute com cara de
número.

**Bônus:** hoje o "Ainda não sei" só desliga o campo. Podia ser o contrário — o
Jev propõe um default a partir do que já se sabe, marcado como "sugestão,
confira". Onboarding que preenche em vez de interrogar.

## 10. Comparação com os eventos anteriores do organizador

Quando houver 2–3 eventos no sistema: Noul *"este orçamento está fora do padrão
dos eventos anteriores desta pessoa?"*, passando os eventos passados como
`state`.

Forte porque o julgamento se apoia em dado do próprio usuário, não em
conhecimento geral do modelo — que é onde o Jev é mais confiável.

## 11. Triagem do "Precisa da sua atenção" (§10)

Composite scoring: cada alerta ganha um Score de urgência e o código ordena.
Sem isso vira lista fixa, e o §53 diz justamente que o produto deve mostrar *o
que precisa agora*.

---

## Risco a controlar: português

A doc do Jev diz explicitamente: *"trained on English primarily; other languages
supported but with lower accuracy."*

Todo o estado do Mesa Certa é português, com empresas brasileiras e jargão de
evento local. Isso não invalida nada, mas significa que **cada uso precisa de um
teste de acerto com gabarito antes de virar produção** — como em
`../jev-pilot/`, que mede o próprio acerto contra a seção da planilha.

Julgamento de "preço agressivo" e "viabilidade" é bem mais subjetivo que
categorizar despesa, então os itens 7 e 9 são os que mais precisam ser medidos
antes de merecer confiança.

## Ordem sugerida — parte 2

1. **Tipagem no onboarding (§9)** — destrava os outros dois.
2. **Roteamento do assistente (§8)** — ganho imediato e mensurável.
3. **Simulador (§7)** — por último: é o que mais depende de calibragem.
