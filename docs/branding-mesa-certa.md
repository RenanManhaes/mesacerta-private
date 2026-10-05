# Branding e direção visual — Mesa Certa

> Atualização de 5 de outubro de 2026: a direção visual abaixo é histórica.
> O arquivo `atualização da plataforma.zip`, enviado e aprovado pelo usuário,
> passa a ser a referência visual: azul `#1d3a6e`, coral `#e8663d`,
> Schibsted Grotesk e Geist Mono, painéis arredondados e mesas animadas no login.
> Os tokens vigentes estão em `src/index.css` e a integração em
> `src/components/layout/platform.css`. As regras de dados e cálculos permanecem.

Referência: `../PRD_Mesa_Certa_v1.1.md`. Toda decisão abaixo está ligada a uma seção
específica do PRD, não a gosto pessoal. Onde a justificativa é "§43", é restrição
direta de produto, não sugestão de estilo.

## Posicionamento

**Mesa Certa é um instrumento operacional de evento, não um dashboard de métricas.**
Ele existe para que um organizador leigo responda, em segundos, a sete perguntas
financeiras e operacionais concretas (PRD §52) e para que uma rodada de negócios
presencial seja compreendida espacialmente, mesa por mesa (PRD §53).

O que o produto **não é**:

- não é uma ferramenta de BI ou analytics para especialistas em dados;
- não é um produto "IA primeiro" que decide por quem usa — a IA (Jev) só tipa texto,
  nunca calcula nem decide fluxo (AGENTS.md, regra 2);
- não é um site institucional bonito — é usado sob pressão, no dia do evento, por
  alguém que não vai ler documentação;
- não é "genérico Base44" (PRD §42) — cada decisão de cor, tipografia e densidade
  abaixo existe para impedir que o produto pareça um template.

A régua de julgamento (PRD §42): o produto deve transmitir **confiança,
organização, maturidade, precisão, facilidade**. Uma tela que parece "gerada" —
cards flutuando sobre gradiente, ícones decorativos, espaço vazio sem função —
é critério de fracasso, não detalhe estético.

---

## Paleta

A paleta é neutra-quente (papel, não branco/cinza frio de SaaS) com uma cor de
marca âncora em verde-azulado profundo — tom de tinta/encadernação, não de
tecnologia. Isso evita o azul/roxo-gradiente que qualquer dashboard genérico usa,
e reforça a leitura de "caderno de operação", coerente com §43 (evitar glow,
glassmorphism, gradiente).

### Modo claro

| Token | Hex | HSL | Papel |
|---|---|---|---|
| `--background` | `#FAF7F1` | `40 47% 96%` | Fundo de página. Papel quente, não branco puro — reduz a sensação de tela vazia de SaaS (§43: evitar espaços vazios enormes tratados como "respiro" decorativo). |
| `--foreground` | `#1C1A16` | `40 12% 10%` | Texto principal. Quase preto, nunca cinza-médio — precisão exige contraste alto, não suavização. |
| `--card` | `#FFFFFF` | `0 0% 100%` | Superfície elevada (modais, popovers). Branco puro contra o papel quente cria separação sem precisar de sombra — resolve "evitar sombras excessivas" com alinhamento de cor, não com elevação artificial. |
| `--primary` | `#1F4D46` | `171 43% 21%` | Cor de marca. Verde-azulado escuro ("tinta"), usado em texto de ação, foco, e no destaque de rota ativa. Não é azul SaaS nem roxo IA — intencional. |
| `--primary-foreground` | `#FAF7F1` | — | Texto sobre `primary`. |
| `--secondary` / `--muted` | `#F0EBE1` / `#EFEAE0` | `40 33% 91%` | Fundos de zebra em tabela, badges neutras, hover sutil. Nunca usados como "card" decorativo — só como separador funcional de linha. |
| `--muted-foreground` | `#6B6558` | `41 10% 38%` | Texto secundário (legendas, metadados, rótulos de coluna). |
| `--accent` | `#E3ECE9` | `160 19% 91%` | Realce discreto (linha selecionada, item ativo de navegação). Deriva do primary, não é uma cor nova — mantém a paleta pequena. |
| `--border` | `#E3DDD0` | `41 25% 85%` | Toda separação do produto. Tabelas, listas e grids usam borda de 1px, não sombra nem card — é a ferramenta central de hierarquia visual pedida em §43. |

### Modo escuro

| Token | Hex | HSL | Papel |
|---|---|---|---|
| `--background` | `#15181A` | `204 11% 9%` | Ardósia fria quase neutra — não preto puro, não azul-meia-noite de app de IA. |
| `--foreground` | `#EDE8DD` | `41 31% 90%` | Texto. Mantém o calor do papel claro, não vira branco frio. |
| `--card` | `#1C2023` | `206 11% 12%` | Superfície elevada. |
| `--primary` | `#6FB8A8` | `167 34% 58%` | Mesmo matiz do modo claro, clareado para contraste em fundo escuro — a marca não muda de identidade entre os dois modos. |
| `--border` | `#30363A` | `204 9% 21%` | Mantém a mesma função estrutural do modo claro. |

### Estados semânticos

O produto tem dois tipos de alerta real: financeiro (margem, ponto de equilíbrio,
pagamento) e operacional de mesa (conflito, excesso de capacidade). PRD §32 é
explícito: **"Não utilizar cinco cores extremamente fortes"** — priorizar borda,
ícone, marca pequena, tooltip, texto. As quatro cores abaixo existem só para isso:
texto de estado, borda de alerta, ponto indicador — nunca preenchimento grande de
card ou pill decorativa.

| Token | Claro | Escuro | Significado | Onde aparece |
|---|---|---|---|---|
| `--positive` | `#2E7D4F` (`145 46% 34%`) | `#5FBE86` (`145 42% 56%`) | Pago, confirmado, recebido, margem saudável | texto de status, ponto de 1.5px, borda de linha em tabela |
| `--warning` | `#B5750C` (`37 88% 38%`) | `#E0A53C` (`38 73% 56%`) | Pendente, parcial, retorno à mesa, margem apertada | texto de status, indicador discreto na cadeira |
| `--danger` | `#B3402C` (`9 61% 44%`)  | `#E07A63` (`11 67% 63%`) | Capacidade excedida, conflito de mesa, atrasado, prejuízo | borda de 2px na mesa/cadeira, texto de alerta — nunca fundo sólido grande |
| `--info` | `#3B6EA5` (`211 47% 44%`) | `#7AAEDD` (`208 59% 67%`) | Em andamento, neutro-informativo (não é erro nem sucesso) | texto de status operacional |

Regra de uso (reforça §32): cor de estado é aplicada a **texto, borda fina ou
ponto de 6px** — nunca a um card inteiro ou uma pill grande colorida. Uma mesa
com conflito ganha borda vermelha de 2px e um ícone pequeno, não um cartão
vermelho piscando.

---

## Tipografia

| Papel | Fonte | Uso |
|---|---|---|
| `--font-display` | Instrument Serif | Títulos de página (H1) e números financeiros de destaque (KPI hero). A serifa marca "documento oficial", reforça maturidade — contrapeso deliberado à sans de sistema que domina o resto da tela. |
| `--font-heading` / `--font-body` | Instrument Sans | Texto de interface, rótulos, corpo, tabela. |
| `--font-mono` | JetBrains Mono | Todo número tabular (dinheiro, contagem, percentual) via classe `.tnum`. |

### Escala e regra de hierarquia

| Nível | Tamanho | Peso | Uso |
|---|---|---|---|
| Display | 26–32px / `font-display` | 400 | Título de página, valor de KPI hero (ex. faturamento previsto) |
| H2 | 18–20px / `font-heading` | 600 | Título de seção |
| H3 | 14–15px / `font-heading` | 600 | Cabeçalho de bloco, nome de mesa |
| Corpo | 13–14px / `font-body` | 400–500 | Texto de tabela, parágrafo |
| Rótulo | 11px, uppercase, tracking 0.12–0.14em | 500 | Cabeçalho de coluna, label de KPI |
| Micro | 9–10px | 400–500 | Legenda de cadeira, nota de rodapé |

**Regra**: hierarquia vem de tamanho + peso + a família (serifa só no topo), nunca
de cor. Isso é a aplicação direta de "priorizar hierarquia tipográfica" (§43) —
uma tela sem nenhuma cor ainda deve ser legível em camadas.

---

## Espaçamento e grade

Escala em múltiplos de 4px: `2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 40, 56`.
Não existe espaçamento "custom" fora dessa escala em componente novo.

- Grade de página: container com padding lateral 16–24px (mobile) / 32px (desktop),
  conteúdo em coluna única ou grid de 12 colunas conforme a tela.
- Mesas em rodada: grid responsivo (3 colunas desktop → 1 coluna mobile, PRD §36/§38),
  gap fixo de 16–24px — nunca mais, para não criar "espaço vazio enorme" (§43).
  O produto usa espaço em branco como separador funcional (entre blocos de tabela,
  entre seções), não como enchimento decorativo de layout.
- Densidade controlada por altura de linha, não por margem: linha de tabela ~36–40px,
  célula de cadeira ~44px — compacto o suficiente para 14 mesas ou uma tabela de
  despesas caberem sem rolagem excessiva.

---

## Densidade

Decisão: **densidade média-alta, tabular por padrão.**

Justificativa direta: o produto mostra tabelas de despesas linha a linha e até 14
mesas simultâneas com 6–7 cadeiras cada visíveis ao mesmo tempo numa rodada
(§29, §36). Um layout "arejado" de dashboard genérico — um KPI por card grande,
muito respiro — obrigaria rolagem constante e esconderia exatamente a visão
geral que o PRD pede ("Como está meu evento?", §2). Por isso:

- listas e tabelas são a unidade padrão de conteúdo, não cards (§43: evitar
  excesso de cards);
- uma linha de despesa ocupa ~40px, não um card de 120px;
- uma mesa ocupa o espaço mínimo necessário para desenhar as cadeiras com
  legibilidade — não um card quadrado com padding generoso.

Onde a densidade cede espaço: a representação espacial da mesa (§29–38) e o KPI
hero do financeiro. Esses dois lugares têm função de leitura rápida sob pressão
("quem está em que mesa", "estou no azul ou no vermelho") e merecem mais peso
visual momentâneo — mas nunca viram cards soltos no meio de uma tela densa.

---

## Tratamento de número

Número é o produto. Dinheiro, percentual e contagem seguem regra única:

- **Fonte tabular**: todo número usa `font-variant-numeric: tabular-nums` via a
  classe utilitária `.tnum` (já existente em `src/index.css`), com `font-mono`
  (JetBrains Mono) — dígitos de largura igual, para que colunas de valores
  alinhem verticalmente sem esforço de leitura.
- **Alinhamento**: número sempre alinhado à direita em coluna de tabela; label
  sempre à esquerda. Nunca centralizado.
- **Moeda**: `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`
  — já implementado em `src/lib/format.js` (`formatBRL`, `formatBRLc`). Valor
  inteiro por padrão (sem centavos) em KPI e tabela; duas casas decimais só onde
  o centavo importa (preço unitário de ingresso, por exemplo).
  Nunca abreviar (nunca "R$ 31,2k") — o PRD exige que o organizador leia o valor
  exato, não uma aproximação; abreviação é o tipo de "tradução perdida" que
  contraria §3 (Dado → Contexto → Decisão exige o dado real, não um resumo vago).
- **Percentual**: uma casa decimal (`4,8%`), nunca arredondado para inteiro —
  margem de evento é apertada o suficiente para que 4,8% e 5,4% sejam decisões
  diferentes.
- **Contagem**: inteiro sem decimal, `Intl.NumberFormat('pt-BR')` para milhar
  (`1.240` convidados, se necessário) — mas nos volumes reais do produto
  (dezenas a poucas centenas) normalmente não há milhar a formatar.
- **Negativo/resultado**: cor de texto (positive/danger), nunca sinal "+/-" como
  único indicador — a cor reforça, o número fala primeiro.

---

## Proibido no produto (PRD §43)

Lista literal do PRD, tratada como bloqueio de revisão de design, não como
preferência:

- gradiente;
- glow;
- glassmorphism;
- sombra excessiva (sombra é exceção pontual em popover/dialog, nunca em card
  de conteúdo — `src/components/common/Primitives.jsx` já resolve isso com borda);
- pill em todo lugar (pill é aceitável só em filtro ativo/tag removível, não como
  padrão de badge de status — `StatusPill` em Primitives.jsx usa ponto + texto,
  não pill preenchida, e deve continuar assim);
- excesso de cards (conteúdo tabular por padrão, card reservado para agrupamento
  real — formulário, KPI hero, detalhe de mesa);
- espaços vazios enormes;
- ícones decorativos (ícone só quando substitui ou reforça uma ação/estado
  específico — nunca como enfeite ao lado de um título);
- componentes excessivamente arredondados (`--radius: 0.375rem` — raio pequeno e
  consistente, nunca `rounded-full` em botão ou card).

Qualquer componente novo que viole um item desta lista deve ser rejeitado antes
de chegar à revisão de código — é o mesmo critério que torna o produto diferente
de "mais um dashboard genérico feito por IA" (§42).
