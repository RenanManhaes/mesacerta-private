# PRD — Mesa Certa

**Versão:** 1.1  
**Status:** Produto em definição / prototipação  
**Atualização principal:** representação visual obrigatória das mesas e cadeiras no módulo Networking.

> **Esta versão substitui o PRD anterior.**

---

## 1. Visão do produto

O **Mesa Certa** será uma plataforma completa para planejamento, gestão e operação de eventos.

O produto não será focado exclusivamente em rodadas de negócio. O sistema atual de distribuição entre mesas se tornará um **módulo opcional de Networking**, integrado a uma plataforma maior.

A proposta central é:

> **Tudo o que você precisa organizar para seu evento, em um só lugar.**

O Mesa Certa deve funcionar para eventos:

- corporativos;
- networking;
- congressos;
- workshops;
- treinamentos;
- feiras;
- seminários;
- eventos internos;
- eventos pagos ou gratuitos;
- com ou sem patrocinadores;
- com ou sem rodadas de negócios.

---

## 2. Problema

Organizadores normalmente trabalham com informações espalhadas entre planilhas, WhatsApp, listas, documentos, cronogramas, fornecedores e controles financeiros.

O Mesa Certa deverá transformar essa fragmentação em uma visão centralizada.

A experiência deve responder rapidamente:

> **Como está meu evento?**

> **O que precisa da minha atenção?**

> **Quanto estou faturando e gastando?**

> **O que preciso fazer agora?**

---

## 3. Princípio central

### Simplicidade não significa produto simples

O Mesa Certa poderá possuir muitas funcionalidades.

Porém, um usuário leigo deve conseguir utilizá-lo sem precisar aprender:

- fórmulas;
- planilhas;
- conceitos técnicos;
- estruturas complexas;
- lógica de banco de dados.

O sistema deverá traduzir números em contexto.

Em vez de:

**Capacidade: 180 / Público: 198**

mostrar:

> **Seu público previsto ultrapassa a capacidade do espaço em 18 pessoas.**

A lógica central é:

**Dado → Contexto → Decisão**

---

## 4. Público principal

O principal usuário é o **organizador do evento**.

Pode ser:

- produtor;
- empreendedor;
- funcionário de uma empresa;
- associação;
- comunidade;
- agência;
- organizador independente;
- grupo empresarial.

Não é necessário possuir experiência profissional com eventos.

---

## 5. Estrutura geral

```text
Organização
│
├── Evento A
├── Evento B
└── Evento C
```

Cada evento possui seus próprios módulos.

### Navegação

**Visão geral**

**Planejamento**
- Programação
- Tarefas
- Participantes
- Fornecedores

**Financeiro**
- Financeiro
- Receitas
- Despesas
- Patrocínios

**Operação**
- Capacidade
- Networking

**Análise**
- Simulador

**Configurações**

Módulos opcionais só aparecem quando estão habilitados.

---

## 6. Meus Eventos

Primeira área após login.

Mostrar:

- próximos eventos;
- eventos em planejamento;
- eventos finalizados.

Cada evento apresenta:

- nome;
- data;
- local;
- público previsto;
- situação geral.

Ação principal:

**+ Criar evento**

---

## 7. Criação do evento

Não utilizar formulário gigante.

Criar onboarding guiado.

### Informações básicas

- Nome
- Data
- Cidade
- Local

### Público

- Público esperado
- Capacidade do espaço
- “Ainda não sei”

### Características

**O evento terá ingressos?**

Sim / Não / Ainda não sei

**Terá patrocinadores?**

Sim / Não / Talvez

**Terá fornecedores externos?**

Sim / Não

**Terá programação?**

Sim / Não

**Terá rodadas de negócios ou networking estruturado?**

Sim / Não

Com essas respostas, o Mesa Certa configura os módulos iniciais.

---

## 8. Dashboard

O Dashboard é a principal tela do produto.

Em poucos segundos o usuário deverá entender:

- saúde financeira;
- situação operacional;
- participantes;
- tarefas;
- programação;
- fornecedores;
- problemas;
- próximos passos.

Não deve ser simplesmente uma coleção de cards.

---

## 9. Dashboard financeiro

Mostrar:

### Faturamento previsto
R$ 74.800

### Recebido
R$ 46.350

### A receber
R$ 28.450

### Despesas previstas
R$ 43.200

### Pago
R$ 31.700

### A pagar
R$ 11.500

### Resultado previsto
R$ 31.600

### Margem
42,2%

### Meta
R$ 90.000

Além dos valores:

> **83% da meta atingida.**

> **Faltam R$ 15.200 para atingir sua meta.**

---

## 10. Precisa da sua atenção

Área central do Dashboard.

Exemplos:

- 🔴 2 pagamentos vencidos.
- 🟠 3 tarefas críticas pendentes.
- 🟠 O custo de alimentação está 12% acima do planejado.
- 🟠 A programação termina 25 minutos depois do previsto.
- 🟢 Capacidade adequada.
- 🟢 Networking sem conflitos.

Cada alerta deve ser clicável.

---

## 11. Próximas ações

Exemplo:

| Quando | Ação | Responsável |
|---|---|---|
| Hoje | Confirmar buffet | Renan |
| Amanhã | Pagar audiovisual | Financeiro |
| 04/11 | Fechar programação | Ana |

---

## 12. Resumo operacional

Dashboard também apresenta, de maneira compacta:

**Participantes**  
138 confirmados / 180 esperados

**Programação**  
11 atividades

**Tarefas**  
32 concluídas / 8 pendentes / 3 atrasadas

**Fornecedores**  
9 contratados / 2 pendências

**Networking**  
12 mesas / 10 rodadas / 0 conflitos

Networking só aparece quando habilitado.

---

## 13. Financeiro

O objetivo não é substituir um software contábil.

O usuário precisa entender:

> Quanto vou faturar?

> Quanto vou gastar?

> Quanto já entrou?

> Quanto falta pagar?

> Meu evento dará resultado?

### Áreas

- Resumo
- Receitas
- Despesas
- Fluxo de caixa

---

## 14. Despesas

Cada despesa poderá conter:

- descrição;
- categoria;
- fornecedor;
- quantidade;
- valor unitário;
- valor previsto;
- valor real;
- vencimento;
- status;
- observação.

### Tipos

**Fixa**

Exemplo:

Espaço  
R$ 5.000

**Por participante**

Exemplo:

Buffet  
R$ 75 por participante

**Percentual**

Exemplo:

Taxa  
4% da receita

Mudanças no público devem recalcular custos variáveis.

---

## 15. Receitas

Categorias configuráveis.

Exemplos:

- ingressos;
- patrocínios;
- stands;
- inscrições;
- produtos;
- outras.

Campos:

- descrição;
- categoria;
- previsto;
- recebido;
- data prevista;
- data recebida;
- status.

---

## 16. Ponto de equilíbrio

Quando houver informações suficientes, mostrar:

> **Seu evento começa a gerar resultado positivo a partir de 82 ingressos pagos.**

O usuário não deverá precisar interpretar fórmula financeira.

---

## 17. Ingressos

Módulo opcional.

Tipos configuráveis:

- Geral
- VIP
- Associado
- Premium
- Outros

Cada tipo pode possuir múltiplos lotes.

### Lote

- nome;
- preço;
- início;
- fim;
- quantidade;
- taxa;
- desconto.

Sistema calcula:

- vendas;
- disponibilidade;
- receita;
- ticket médio;
- ocupação.

---

## 18. Patrocínios

Módulo opcional.

Usuário pode criar planos livremente.

Exemplo:

**Master**  
R$ 15.000

**Ouro**  
R$ 8.000

**Apoio**  
R$ 3.000

Nenhum nome será fixado no código.

Cada plano possui:

- preço;
- quantidade;
- cortesias;
- benefícios;
- entregáveis.

Cada patrocinador possui:

- empresa;
- contato;
- plano;
- valor negociado;
- recebido;
- saldo;
- vencimentos;
- convidados;
- entregáveis;
- status.

---

## 19. Fornecedores

Cada fornecedor possui:

- nome;
- contato;
- categoria;
- serviço;
- contrato;
- entrada;
- pago;
- saldo;
- vencimentos;
- dados de pagamento;
- observações;
- status.

Dados financeiros devem alimentar automaticamente o módulo Financeiro.

---

## 20. Participantes

Campos principais:

- nome;
- telefone;
- email;
- empresa;
- cargo;
- tipo;
- status;
- observações.

Tipos sugeridos:

- Participante
- Convidado
- VIP
- Palestrante
- Patrocinador
- Expositor
- Equipe
- Outro

Status:

- Confirmado
- Pendente
- Cancelado
- Check-in

---

## 21. Capacidade

Relacionar:

- capacidade;
- público previsto;
- confirmados;
- cortesias;
- equipe;
- demais pessoas contabilizadas.

Mostrar interpretação.

Exemplo:

> **Seu evento está dentro da capacidade.**

> Existem **42 lugares disponíveis**.

Ou:

> **Atenção: o público previsto excede a capacidade em 18 pessoas.**

---

## 22. Programação

Interface em formato de timeline.

Exemplo:

**08:00**  
Credenciamento  
60 min

**09:00**  
Abertura  
20 min

**09:20**  
Palestra  
40 min

Usuário poderá:

- criar;
- alterar;
- excluir;
- duplicar;
- reorganizar;
- mudar duração.

Mudanças recalculam atividades seguintes.

---

## 23. Tarefas

Cada tarefa:

- título;
- responsável;
- prazo;
- categoria;
- prioridade;
- status;
- descrição.

### Status

- A fazer
- Em andamento
- Concluída

### Prioridade

- Normal
- Alta
- Crítica

Dashboard deverá puxar automaticamente tarefas atrasadas e críticas.

---

## 24. Simulador

Permitir testar hipóteses sem alterar o evento real.

Exemplo:

**Participantes**  
150

**Ticket médio**  
R$ 299

**Patrocínios**  
R$ 25.000

**Custos fixos**  
R$ 18.000

**Custo por participante**  
R$ 72

Resultado:

**Faturamento**  
R$ 69.850

**Despesas**  
R$ 28.800

**Resultado**  
R$ 41.050

**Margem**  
58,8%

**Ponto de equilíbrio**  
63 ingressos

Botão:

**Comparar com cenário atual**

---

## 25. Networking

Networking será um módulo opcional.

Um evento que não faz rodada de negócio utiliza normalmente todo o restante do Mesa Certa.

Quando ativado, poderá gerenciar:

- mesas;
- participantes;
- anfitriões;
- rodadas;
- distribuição;
- conflitos;
- rotas.

---

## 26. Papéis no Networking

### Anfitrião fixo

Permanece na mesa.

### Anfitrião rotativo

Está associado a uma empresa, mas circula.

### Participante

Circula entre as mesas.

### Fora das rodadas

Não participa da distribuição.

---

## 27. Regras do motor

Prioridades:

1. Evitar repetição de mesa enquanto houver mesas ainda não visitadas.
2. Respeitar capacidade.
3. Considerar anfitriões fixos na capacidade.
4. Evitar anfitrião rotativo na própria mesa quando possível.
5. Maximizar diversidade de encontros.
6. Minimizar reencontros entre as mesmas pessoas.
7. Detectar conflitos antes de publicar.

A lógica existente do Mesa Certa original deverá ser preservada e evoluída.

---

## 28. Fluxo do Networking

```text
Participantes
      ↓
Mesas
      ↓
Regras
      ↓
Gerar distribuição
      ↓
Revisar
      ↓
Publicar
```

Após gerar:

- visualizar mesas por rodada;
- visualizar rota individual;
- analisar conflitos;
- verificar reencontros;
- exportar informações.

---

## 29. Mesas por rodada — REQUISITO VISUAL OBRIGATÓRIO

Esta é uma característica importante do Mesa Certa.

As mesas **não devem ser exibidas somente como cards contendo listas de participantes**.

Cada mesa deverá possuir uma **representação espacial vista de cima**, seguindo o conceito existente no Mesa Certa original.

### Estrutura

No centro:

#### Mesa

Mostrar:

- número;
- nome da empresa/patrocinador;
- ocupação.

Em torno dela:

#### Cadeiras

Cada cadeira representa uma posição real da mesa.

Exemplo:

```text
                  [ Ana ]

          [ João ]       [ Pedro ]


               ╭───────────╮
               │  MESA 04  │
               │  NETTOP   │
               ╰───────────╯


          [ Maria ]      [ Lucas ]

                 [ Renan ]
```

A posição das cadeiras deverá formar visualmente o perímetro da mesa.

Não transformar as cadeiras em uma lista abaixo.

---

## 30. Cadeiras

A quantidade de cadeiras exibidas deverá corresponder à capacidade configurada da mesa.

Exemplo:

Capacidade = 6

↓

Desenhar 6 cadeiras.

### Cadeira ocupada

Mostrar:

- primeiro nome, quando couber;
- ou iniciais.

Hover:

**Renan Manhães**  
Participante  
Empresa XYZ

### Cadeira vazia

Continuar mostrando a cadeira, porém em estado neutro/vazio.

Isso permite que o organizador entenda visualmente a capacidade.

---

## 31. Anfitrião na representação da mesa

O anfitrião fixo também deverá ocupar uma cadeira.

Visualmente deve ser diferente dos participantes.

Por exemplo:

**ANF**  
Renan

ou indicador discreto:

★ Renan

A diferença precisa ser perceptível sem dominar a interface.

---

## 32. Estados das cadeiras

### Participante normal

Estado neutro.

### Anfitrião fixo

Estado de anfitrião.

### Anfitrião rotativo

Estado diferente do participante comum.

### Retorno à mesa

Estado de atenção discreto.

### Lugar vazio

Estado neutro.

### Conflito

Indicação de problema.

Não utilizar cinco cores extremamente fortes.

Priorizar:

- borda;
- ícone;
- pequena marca;
- tooltip;
- texto.

---

## 33. Estado da mesa

Mesa normal:

**6 / 6 lugares**

Mesa parcialmente ocupada:

**4 / 6 lugares**

Mesa acima da capacidade:

> **8 / 6 lugares**

Mostrar visualmente estado de erro.

Exemplo:

🔴 Capacidade excedida em 2 pessoas.

---

## 34. Interação com a cadeira

Ao selecionar uma cadeira, mostrar informações da pessoa.

Preferencialmente em:

- popover para informações simples;
- drawer lateral para informações completas.

Mostrar:

### Renan Manhães

Empresa  
Linkia

Papel  
Participante

Rodada atual  
4

Mesa atual  
Nettop

Próxima mesa  
Interfocus

Ação:

**Ver rota completa**

---

## 35. Interação com a mesa

Clicar no centro da mesa abre detalhes.

Exemplo:

### Mesa 04 — Nettop

Capacidade  
6

Ocupação  
6 / 6

Anfitrião  
Gabriel Silva

Participantes  
5

Rodada  
4 de 10

Também permitir visualizar:

- participantes;
- histórico das rodadas;
- conflitos relacionados.

---

## 36. Mesas em conjunto

No desktop:

```text
[Mesa 01]    [Mesa 02]    [Mesa 03]

[Mesa 04]    [Mesa 05]    [Mesa 06]

[Mesa 07]    [Mesa 08]    [Mesa 09]
```

Cada bloco contém a representação física da mesa e das cadeiras.

O usuário escolhe:

**Rodada 1**

e todas as mesas mostram quem está sentado.

Ao mudar para:

**Rodada 2**

as cadeiras atualizam.

Idealmente com transição visual discreta.

---

## 37. Controle de rodada

Topo da tela:

**Mesas por rodada**

```text
‹     Rodada 4 de 10     ›
```

Opcionalmente:

```text
Rodada 1 | 2 | 3 | 4 | 5 | 6...
```

Também mostrar:

**96 participantes · 14 mesas · 0 conflitos**

---

## 38. Responsividade das mesas

A representação espacial é parte do produto e deve ser mantida no mobile.

Desktop:

mesa e cadeiras em tamanho completo.

Tablet:

diminuir proporcionalmente.

Mobile:

mostrar uma mesa por linha.

Não trocar automaticamente por uma tabela ou lista de nomes.

Pode existir uma opção adicional:

**Visualização em lista**

mas o desenho das mesas será a visualização principal.

---

## 39. Rotas

Cada participante poderá visualizar sua sequência:

```text
Rodada 1 → Mesa 04
Rodada 2 → Mesa 11
Rodada 3 → Mesa 07
Rodada 4 → Mesa 02
```

Mostrar visualmente em formato de jornada.

---

## 40. Publicação

Distribuições possuem estado.

### Rascunho

Pode ser alterado livremente.

### Publicado

É a distribuição utilizada no evento.

Se uma alteração impactar uma distribuição publicada:

> **Esta alteração modifica rotas que já foram publicadas.**

O sistema não deverá alterar tudo silenciosamente.

---

## 41. Relacionamento entre módulos

Os módulos não podem ser ilhas.

### Exemplo: participante

Novo participante

↓

Participantes

↓

Capacidade

↓

Custos por pessoa

↓

Financeiro

↓

Networking

### Exemplo: patrocinador

Patrocinador fechado

↓

Receitas

↓

Financeiro

↓

Cortesias

↓

Participantes

↓

Capacidade

↓

Networking

### Exemplo: fornecedor

Fornecedor contratado

↓

Fornecedores

↓

Despesas

↓

Fluxo de caixa

↓

Resultado

---

## 42. UX/UI

Design deve transmitir:

- confiança;
- organização;
- maturidade;
- precisão;
- facilidade.

Simplicidade deverá vir da organização da informação, não da remoção de funcionalidades.

Evitar aparência de dashboard genérico feito por IA.

---

## 43. Direção visual

Evitar:

- excesso de cards;
- gradientes;
- glow;
- glassmorphism;
- sombras excessivas;
- pills em todo lugar;
- enormes espaços vazios;
- ícones decorativos;
- componentes excessivamente arredondados.

Priorizar:

- hierarquia tipográfica;
- grids;
- alinhamento;
- boa densidade;
- tabelas;
- listas;
- espaço branco bem utilizado;
- interação contextual.

---

## 44. Desktop e mobile

### Desktop

Prioridade:

- configuração;
- planejamento;
- financeiro;
- análise;
- Networking completo.

### Mobile

Prioridade:

- agenda;
- tarefas;
- alertas;
- participantes;
- fornecedores;
- pagamentos;
- rota individual;
- consulta das mesas.

---

## 45. Busca global

Permitir buscar:

- participantes;
- fornecedores;
- patrocinadores;
- tarefas;
- atividades;
- despesas;
- receitas.

---

## 46. Ação rápida

Botão global:

**+ Adicionar**

Opções conforme módulos ativos:

- Participante
- Tarefa
- Fornecedor
- Despesa
- Receita
- Atividade
- Patrocinador

---

## 47. Arquitetura conceitual

```text
Organization
│
├── Users
│
└── Events
    │
    ├── Participants
    ├── Tasks
    ├── ScheduleItems
    ├── Suppliers
    ├── Expenses
    ├── Revenues
    ├── Payments
    ├── Tickets
    │   └── TicketLots
    ├── SponsorPlans
    │   └── Sponsors
    ├── Locations
    ├── Simulations
    │
    └── Networking
        ├── Tables
        ├── Seats
        ├── Hosts
        ├── Rounds
        ├── Assignments
        └── DistributionVersions
```

### Novo requisito

`Seat` deve existir conceitualmente como posição de uma mesa.

Isso facilitará representar:

> Mesa → capacidade → cadeiras → ocupantes

e não apenas:

> Mesa → lista de pessoas.

---

## 48. Arquitetura técnica

Frontend:

- React
- TypeScript
- componentes independentes
- design system próprio

Backend recomendado inicialmente:

- PostgreSQL
- Supabase

Para:

- autenticação;
- banco;
- storage;
- controle de acesso;
- multi-evento;
- multiusuário.

---

## 49. Motor de Networking

Separar completamente:

### Lógica

```text
networking-engine
```

Responsável por:

- distribuição;
- balanceamento;
- conflitos;
- otimização;
- capacidade;
- repetição.

### Interface

```text
networking-ui
```

Responsável por:

- mesa desenhada;
- cadeiras;
- animações;
- interação;
- visualização das rodadas.

Assim mudanças no design não quebram o algoritmo.

---

## 50. MVP

### P0 — Base

- autenticação;
- organizações;
- eventos;
- criação guiada;
- Dashboard;
- participantes;
- programação;
- tarefas;
- fornecedores;
- despesas;
- receitas;
- financeiro;
- capacidade;
- configurações;
- responsividade.

### P1 — Diferenciais

- ingressos;
- patrocínios;
- fluxo de caixa;
- ponto de equilíbrio;
- simulador;
- Networking;
- visualização gráfica das mesas;
- rotas;
- conflitos;
- exportações.

### P2 — Evolução

- check-in;
- QR Code;
- comunicação;
- WhatsApp;
- email;
- integrações;
- portal do participante;
- relatórios pós-evento;
- automações;
- templates;
- IA assistente.

---

## 51. Critérios de aceite do Networking

Para considerar o módulo pronto:

1. É possível cadastrar mesas.
2. É possível determinar capacidade individual.
3. Cada mesa possui representação gráfica.
4. Todas as cadeiras são desenhadas ao redor da mesa.
5. A quantidade de cadeiras corresponde à capacidade.
6. Lugares vazios continuam visíveis.
7. Anfitrião ocupa uma cadeira.
8. Anfitrião possui indicação visual própria.
9. Participantes aparecem nas cadeiras corretas.
10. Alterar a rodada atualiza a ocupação das mesas.
11. Mesa acima da capacidade é destacada.
12. Participante pode ser selecionado diretamente pela cadeira.
13. Mesa pode ser selecionada pelo centro.
14. Visualização funciona em desktop e mobile.
15. Existe rota individual.
16. Conflitos são exibidos.
17. O algoritmo continua respeitando as regras originais de distribuição.

---

## 52. Critério de sucesso de UX

Um usuário sem treinamento deve conseguir responder rapidamente:

> Quanto estou gastando?

> Quanto estou faturando?

> Quem preciso pagar?

> Quantas pessoas confirmaram?

> O espaço comporta o público?

> Qual é a próxima atividade?

> Quais tarefas estão atrasadas?

E, em um evento com Networking:

> **Quem está sentado em cada mesa nesta rodada?**

Para essa última pergunta, a resposta deverá estar **visualmente evidente através do desenho das mesas e cadeiras**, sem depender de interpretar uma tabela.

---

## 53. Definição final

> **Mesa Certa é uma plataforma de planejamento e operação de eventos que centraliza financeiro, participantes, fornecedores, tarefas, programação e capacidade em uma experiência simples de compreender, oferecendo módulos especializados como simulação financeira e um motor visual e inteligente para rodadas de networking.**

### Princípio definitivo do produto

> **O Mesa Certa não deve mostrar tudo o que o sistema sabe. Deve mostrar o que o organizador precisa saber e fazer agora.**

E, especificamente para Networking:

> **Uma rodada de negócios é espacial. O produto deve permitir enxergá-la espacialmente.**

---

**Versão oficial:** PRD Mesa Certa v1.1
