# PRD — Mesa Certa

**Versão:** 1.2  
**Atualizado em:** 06/10/2026  
**Responsável pelo produto:** Renan Manhães — `renannascimento0304@gmail.com`  
**Status:** MVP em implementação; nova identidade visual integrada; corrente de acesso e limite comercial em PRs abertas.  
**Atualização principal:** consolidação das 19 issues MCT-46 a MCT-64, design aprovado, persistência, equipe, convites, papéis de acesso e regras comerciais.

> **Esta versão é a referência atual do produto e substitui a v1.1 para novos trabalhos.** A [v1.1](PRD_Mesa_Certa_v1.1.md) permanece como histórico. A numeração das seções 1–53 foi preservada para manter as referências das issues.

Os requisitos descrevem o produto desejado. Não são uma declaração de que toda a plataforma está pronta ou publicada. A seção 57 distingue código integrado em main, PR aberta e proposta pendente. Exemplos numéricos deste documento são ilustrativos; dados de telas e cálculos vêm do evento e dos seletores do código.

**Decisões confirmadas nesta revisão:** Renan é o único fundador da plataforma e o fundador dos eventos reais existentes até esta data. Quem criar um novo evento será automaticamente fundador desse evento; quem entrar por convite/código recebe staff ou diretor. Código sem link concede staff; link leva o papel definido no convite. A exceção comercial de múltiplos eventos é uma flag da conta, não uma consequência automática do papel fundador.

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

A organização agrupa dados e catálogos reutilizáveis; o acesso às pessoas é concedido por evento. Um convite não dá acesso automático aos demais eventos da organização. A estrutura comporta vários eventos, mas a criação por conta está sujeita à regra comercial da seção 56.

### Navegação

**Visão geral**

**Planejamento**
- Programação
- Tarefas
- Equipe do evento
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

Fundador e diretor usam a navegação completa dos módulos habilitados. Staff vê apenas **Tarefas, Participantes e Programação** e entra diretamente em Tarefas. As restrições também valem no banco e na API; ocultar menu não substitui autorização.

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

Essa ação aparece apenas quando a conta pode criar. Para uma conta que já possui vínculo ativo com um evento e não tem liberação de múltiplos eventos, ocultar os botões de criação e recusar também a API. Eventos anteriores permanecem disponíveis; arquivar não libera outra criação.

Oferecer **Entrar em um evento**, com campo de código. Link de convite abre esse fluxo com código e convite preenchidos, preservados durante login/cadastro. Um código inválido ou revogado mostra erro claro e não concede acesso. Antes de aceitar convite e recarregar documentos, concluir o salvamento das alterações em edição; se ele falhar, conservar o trabalho e mostrar o erro.

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

Ao concluir, gerar código único e curto e registrar a conta autenticada como fundador do evento, numa transação no backend. O criador aparece imediatamente na **Equipe do evento** com apresentação **Diretor / Fundador**, preservando o papel de acesso especial de fundador. Não pedir uma lista de dados pessoais de pessoas que ainda não aceitaram o convite.

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

### Layout aprovado — MCT-49

Cabeçalho com título **Fornecedores**, texto **Contratos, valores e vencimentos.** e botão laranja **+ Novo fornecedor**. Três resumos calculados do evento: **Contratados** (quantidade e em orçamento), **Pago** (valor e percentual) e **A pagar** (fundo escuro e quantidade com vencimento na semana).

A grade apresenta cartões com avatar quadrado de iniciais, nome, categoria, valor, status contextual, progresso de pagamento e **R$ X pagos**. Pagamento parcial produz selo **Parcial**; vencimento na semana é informado; quitação e orçamento têm estados claros. No celular, os cartões ficam em uma coluna, sem rolagem lateral da página. Este redesenho não muda o modelo de dados nem implementa geração de contratos.

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

### Cadastro e cronograma — MCT-62

**Nova atividade** abre modal com título, início, duração, responsável, tipo, observação e cor. Nada é criado antes da confirmação. Ao salvar, posicionar a atividade pela hora: 14h entre 13h e 15h. Arrastar um bloco no cronograma ajusta seu horário e persiste a mudança. **Atualizado pela MCT-81:** o painel separado de cronograma foi removido; a reordenação acontece na própria lista, pela alça (mouse ou teclado), e os horários são recalculados mantendo o início do dia, a duração de cada atividade e os intervalos, sem sobreposição. Staff só lê (MCT-80). Sinalizar conflito de horário sem impedir o salvamento.

A cor é escolhida **por atividade**, numa paleta de tons frios, e aparece na lista e no cronograma. Não é uma cor fixa do tipo. Programação com várias trilhas/salas simultâneas permanece fora deste lote.

### Tipos reutilizáveis — MCT-63

Tipos pertencem à organização e ficam disponíveis nos eventos seguintes. Sugestões iniciais: **Palestra, Painel, Rodada de negócio, Intervalo, Credenciamento, Almoço, Apresentação e Encerramento**. O campo do modal sugere correspondências durante a digitação; criar um valor inexistente exige confirmação.

Oferecer gestão para renomear e excluir tipos. Se houver uso, mostrar quantas atividades usam o tipo antes de confirmar. Catálogo de tipos e catálogo da equipe são independentes. Não importar atividades, vincular permissões a tipos ou estabelecer cor automática por tipo.

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
- Concluído

### Prioridade

- Normal
- Alta
- Crítica

Dashboard deverá puxar automaticamente tarefas atrasadas e críticas.

### Quadro e acesso — MCT-61 / MCT-60

Organizar cartões nas colunas **A fazer, Em andamento e Concluído**. Arrastar entre colunas muda o status e salva ao soltar, com animação curta; se a gravação falhar, reverter visualmente e avisar. Oferecer alternativa por teclado e foco visível. Reordenação manual dentro da coluna não faz parte da MCT-61.

Prioridade alta tem borda laranja. Atraso tem borda vermelha e prevalece sobre prioridade alta; manter também indicação textual, sem depender só de cor. Staff vê apenas tarefas atribuídas à sua conta e altera somente o status dessas tarefas. A restrição deve valer tanto no RPC do documento quanto no acesso direto às tabelas; não permite alterar responsável, título, prazo, criar ou remover tarefas.

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
0 ingressos adicionais, neste exemplo sem taxas: os R$ 25.000 de patrocínio já cobrem os R$ 18.000 de custos fixos e a contribuição por ingresso é positiva. O resultado deve ser calculado por código, considerando os custos percentuais e outras receitas quando existirem, nunca copiado desta ilustração.

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

A lógica existente do Mesa Certa original deve ser preservada como port fiel em `src/lib/networking/engine.js`. As 19 issues não autorizam reescrita do algoritmo. Melhorias futuras que alterem a otimização exigem issue específica e regressão; diversidade semântica de segmentos não deve ser tratada como já implementada. IA não calcula distribuição, conflitos, rotas, capacidade ou resultado financeiro e não decide o fluxo.

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

### Revisão de cenário após geração — MCT-51

Mesmo com grade existente, mesas, rodadas e pessoas por mesa continuam editáveis. Alterar parâmetros marca a grade exibida como **desatualizada**. Recalcular informa que substituirá a grade anterior, preserva cadastros de pessoas/patrocinadores/anfitriões e usa o mesmo motor. Não faz edição manual dos ocupantes de uma mesa.

### Acesso às repetições — MCT-52

O indicador **Repetições** é acionável por clique e teclado, leva à lista existente e a realça por aproximadamente um segundo. Respeitar movimento reduzido, sem rolagem animada ou efeito de piscar. Esse comportamento não muda os dados da lista.

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

## 43. Direção visual aprovada

A referência é o pacote e os prints de **Mesa Certa Plataforma** aprovados pelo usuário, integrados em outubro de 2026. Esta direção substitui as proibições genéricas da v1.1 sobre cartões e arredondamento: usar os componentes e a hierarquia do desenho aprovado, sem ampliar o estilo indiscriminadamente.

| Elemento | Direção |
|---|---|
| Tipografia | **Schibsted Grotesk** na landing, autenticação e plataforma; números alinhados para comparação. |
| Fundo e painéis | Fundo claro suave, painéis brancos, bordas discretas e contraste forte. |
| Marca e ação | Azul escuro para estrutura/destaques; laranja para a ação principal. Referências atuais: `#0f1f3d`, `#1d3a6e`, `#e8663d`. Tokens do design system são a fonte de estilo. |
| Organização | Menu lateral por grupos, cabeçalho com contexto, busca, notificações e estado de salvamento; indicadores antes do detalhe. |
| Componentes | Painéis/cartões de dados, tabelas legíveis, campos e modais de cantos arredondados, botões principais conforme a referência e badges discretos de status. |
| Controles de módulo | **Retângulos de cantos arredondados**, com ligado/desligado, foco e desabilitado consistentes. MCT-56 não muda seu comportamento. |
| Animações | Entrada discreta, contadores, barras e transição de rodada; respeitar movimento reduzido. Login pode ter a animação decorativa de mesas; não usar seus dados como estado de um evento real. |

Fornecedores usam cartões; financeiro, participantes, receitas e despesas usam tabelas/painéis conforme suas referências; tarefas usam quadro; programação usa uma lista ordenável (MCT-81); capacidade usa medidor; networking mantém a representação espacial. Não uniformizar telas diferentes em uma coleção genérica de cartões.

### Gráficos — MCT-47 / MCT-50

Cada gráfico usa **uma cor base**, variando somente seus tons quando necessário. A paleta é centralizada em `src/styles/chart-palette.css`, consumida por `src/lib/chartPalette.js`. Mudar a cor central deve atualizar os gráficos; o lote não muda tipos de gráfico ou métricas.

Valores e rótulos ficam fora do desenho ou numa área reservada, sem sobreposição ou corte, incluindo **R$ 1.234.567,89** e largura de **390px**. Cores semânticas de atraso/prioridade e a paleta de atividades não são séries de gráficos e preservam suas funções.

Evitar glow, sombras excessivas, efeitos que prejudiquem leitura e espaço vazio sem função. Preservar hierarquia tipográfica, alinhamento, densidade e interação contextual. Elementos decorativos de autenticação/capas não devem invadir a leitura dos dados.

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

Em 390px e nas verificações de 320px, não ampliar horizontalmente a página; permitir rolagem **dentro** de tabelas, abas ou cronogramas quando necessária. Menu móvel, modais, foco e ações principais mantêm a identidade e a acessibilidade. A visualização espacial de mesas permanece no mobile. Os estados de confirmação, erro, vazio e carregamento fazem parte do desenho, não são detalhes opcionais.

---

## 45. Busca no evento — MCT-48

A busca do cabeçalho opera **no evento atual**, conforme o acesso da pessoa. A partir de **dois caracteres**, abrir sugestões agrupadas por participantes, fornecedores, tarefas e atividades da programação. Setas selecionam, Enter abre o resultado, Esc fecha; clique também funciona. Termo sem correspondência apresenta aviso explícito de nada encontrado.

Não buscar entre eventos nem expor itens de módulos proibidos para staff. Busca de patrocínios, despesas e receitas e ranqueamento semântico não são entregas deste lote; eventual ampliação exige requisito próprio. Jev não entra nesse fluxo sem avaliação específica.

### Notificações do cabeçalho — MCT-53

O sino abre um menu do evento com tarefas próximas do vencimento, pagamentos a vencer, pendências de fornecedores e convites aceitos. Cada item leva à origem; oferecer **Marcar como lidas**, remover o indicador de não lidas e manter essa leitura após recarregar, por conta autenticada e evento, no banco. Sem notificações, mostrar estado vazio.

Notificações só podem derivar de dados autorizados: staff não recebe resumo financeiro ou de fornecedor por esse caminho. O comportamento deste lote é interno à plataforma; não inclui envio por e-mail, push ou WhatsApp.

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

Só mostrar ações permitidas pelo papel e pelos módulos. Staff não vê o menu global de inclusão: a ação autorizada de tarefas é mudar o status das próprias atribuições, e não criar itens arbitrários.

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

### Acesso e catálogos na arquitetura

Separar conta autenticada, organização e vínculo por evento. `EventMember` contém o papel real e a atribuição à conta; `EventInvitation` contém papel de convite e revogação; `EventJoinLog` registra entrada. Catálogos de função/área/cargo e tipos de atividade pertencem à organização e não concedem acesso. `UserEventPermission` contém a exceção comercial por conta.

`AccountRelease` é **modelo proposto na MCT-64**, não entidade de produção aprovada. `Seat`, `DistributionVersion` e demais entidades do desenho conceitual também não significam que toda a camada normalizada ou todos os fluxos estejam implementados. Conferir o estado de entrega antes de utilizá-los como APIs existentes.

---

## 48. Arquitetura técnica

Frontend atual: **React + Vite**, componentes em JSX/JavaScript com checagem pelo TypeScript, componentes independentes e design system próprio baseado nos componentes existentes. O requisito não obriga reescrever a aplicação em TSX.

Backend utilizado pela plataforma: **Supabase Auth + PostgreSQL**, com RLS, privilégios mínimos e RPCs de mutação validados no servidor. O Base44 é a origem do esqueleto; dependências residuais não são autorização para criar outro backend de dados reais.

Em main, a persistência atual usa `platform_workspaces.events`, documento por organização. A corrente MCT-57 → MCT-60 → MCT-58 → MCT-59 → MCT-46, ainda em PRs abertas nesta revisão, introduz documentos por evento em `platform_events` e vínculos em `event_members`, com projeção staff e escrita por revisão. O documento antigo é preservado como backup e tem acesso legado fechado na corrente de papéis. Tabelas normalizadas não devem ser apresentadas como automaticamente preenchidas por essa ponte de documentos.

Toda alteração de banco fica em migração versionada dentro de `supabase/`; nada de alteração manual no painel. Serviços de storage, pagamentos, e-mail, push e outros provedores não são considerados integrados só por estarem previstos nesta arquitetura. Nunca expor chave privilegiada no frontend ou usar metadados editáveis da conta como autorização.

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

`node src/lib/networking/engine.test.mjs` deve permanecer **9/9**. Cálculos financeiros usam `src/lib/selectors.js` como fonte única; IA não faz contas nem decide fluxo. O Jev pode ser estudado para texto livre e julgamento semântico, com medição de acerto e confirmação humana quando necessária; os estudos em `docs/jev-no-mesa-certa.md` não são funcionalidades aprovadas por estas 19 issues.

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

Requisitos de liberação do uso real: persistência no Supabase, erros de salvamento visíveis, conservação de trabalho na renovação de sessão, acesso por evento, equipe por convite, RLS testada por API e limite de criação por conta. A disponibilidade final depende da integração e aplicação das migrações correspondentes; não tratar a lista P0 como uma declaração de conclusão.

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

## 54. Fundador, equipe e acesso por evento

### Identidade confirmada

O fundador da plataforma é **Renan Manhães**, conta `renannascimento0304@gmail.com`. Conforme confirmação direta em 06/10/2026, ele é o **único fundador dos eventos reais existentes até esta data**. Contas e eventos sintéticos dos testes locais não fazem parte desse histórico real.

Para novos eventos, o fundador é a **conta autenticada que criou o evento**. Essa conta aparece na equipe com apresentação Diretor e cargo Fundador, mas seu papel de acesso no banco é fundador. Não se torna fundador quem apenas aceita código/link. Não há transferência de fundador neste lote e ninguém pode rebaixar ou remover o fundador pela gestão de equipe.

Ser fundador de um evento não transforma uma pessoa em fundador da plataforma nem libera outros eventos ou organizações. A exceção comercial de Renan é descrita na seção 56.

**Orientação para o legado:** a versão inicial inferia o fundador pelo proprietário mais antigo da organização porque os documentos não guardavam o criador autenticado. A confirmação humana substitui essa inferência. A [correção na PR #28](https://github.com/RenanManhaes/mesacerta-private/pull/28), incorporada às dependentes, exige a conta única e verificada de Renan no bootstrap e acrescenta `20261006180655_confirmed_legacy_founder.sql` para ambientes que aplicaram a versão anterior. Somente IDs presentes no backup legado são corrigidos; documentos e criadores de eventos novos são preservados. PostgreSQL local e API com tokens reais locais provaram a correção, inclusive HTTP 403 ao proprietário antigo e HTTP 200 a Renan para gerar convite. Antes de aplicação real, conferir conta/UUID e inventário dos IDs do backup. Este PRD não afirma que a correção já foi aplicada no banco de produção.

### Matriz de papéis — MCT-60

| Ação / dado | Fundador do evento | Diretor | Staff |
|---|---|---|---|
| Ver o evento | Sim | Sim | Sim, com projeção restrita |
| Dashboard e módulos habilitados | Sim | Sim | Apenas Tarefas, Participantes e Programação |
| Tarefas | Gerir tarefas e responsáveis | Gerir tarefas e responsáveis | Ver atribuições à própria conta e mudar somente status |
| Participantes e programação | Sim | Sim | Acesso aos dados e operações autorizadas desses módulos |
| Financeiro, receitas, despesas, fornecedores, patrocínios, networking, capacidade e simulador | Sim | Sim | Não, inclusive via API |
| Configurações | Sim | Sim, sem poderes exclusivos do fundador | Não |
| Gerar/revogar link de convite e ativar/revogar código | Sim | Não | Não |
| Editar dados de contato/função/área/cargo da equipe | Sim | Sim | Não |
| Promover/rebaixar staff e diretor | Sim | Não | Não |
| Remover acesso de pessoa da equipe | Sim, exceto o próprio fundador | Não | Não |
| Exclusão definitiva do evento, se implementada futuramente | Reservada ao fundador | Não | Não |

O fluxo de remoção de evento disponível é **arquivamento/restauração**, conservando dados. A previsão de permissão exclusiva não autoriza apagar dados durante desenvolvimento ou nesta revisão. Permissões específicas por pessoa/módulo ou por função profissional estão fora do lote.

As regras são consultadas pelo banco e valem com token do papel restrito, independentemente do frontend. Mudanças de papel aparecem no próximo carregamento da pessoa e são aplicadas às próximas requisições autorizadas. A mudança não apaga retroativamente dados que já foram vistos numa aba.

### Entrada e convite — MCT-57

- Código curto e único criado junto com o evento. Implementação em revisão: oito caracteres hexadecimais em maiúsculas.
- **Código sem link → staff**, decisão confirmada pelo responsável do produto; não tentar adivinhar papel a partir dos convites ativos.
- **Link individual → staff ou diretor**, conforme o papel registrado no convite. O frontend não escolhe o papel final sozinho.
- Em Configurações, mostrar código, copiar código, gerar/copiar link e revogar entradas futuras. O link traz o evento e o convite preenchidos no fluxo de entrada.
- Aceitar requer conta autenticada; registrar quem entrou, quando, convite quando houver, papel e origem código/link. Convidado passa a ver somente os eventos aos quais tem vínculo, sem precisar receber acesso organizacional amplo.
- Revogar convite/código impede novas entradas. Acessos já aceitos só são revogados ao remover a pessoa da equipe. Aceitar de novo não rebaixa o fundador nem troca silenciosamente o papel de um vínculo ativo.
- Remoção de pessoa bloqueia reentrada pelo código e por convite antigo. Um novo convite emitido pelo fundador após a remoção pode readmitir deliberadamente essa pessoa.

O organizador copia e compartilha o link. Envio automático de e-mail não está incluído.

### Equipe do evento — MCT-58

O nome **Equipe do evento** substitui **Diretores e Staffs** no menu, cabeçalho e cadastro. O endereço antigo pode redirecionar para manter links existentes.

**+ Nova pessoa** abre convite com código, link e escolha de papel, sem pedir nome/telefone/e-mail de alguém que ainda não entrou. Após entrada, editar dados da pessoa: nome, telefone, e-mail de contato e função; a MCT-59 acrescenta área e cargo. Alterar e-mail de contato não altera o login de Auth nem concede acesso a outra conta.

Remover exige confirmação e revoga o vínculo ativo, preservando tarefas, nomes históricos e auditoria. Cadastros manuais anteriores são conservados como legado; nome/e-mail em uma lista não prova membership autenticada e não concede permissão automaticamente. Importar equipe de outro evento está fora da MCT-58.

### Funções, áreas e cargos — MCT-59

Catálogo por organização, reutilizável em seus eventos, independente dos papéis de acesso. Inicializar funções e áreas com Produção, Credenciamento, Audiovisual, Comercial, Recepção, Financeiro, Limpeza e Segurança; a implementação em revisão também oferece cargos Fundador, Coordenador e Assistente.

O campo apresenta correspondências a partir de **três letras**. Valor inexistente exige confirmação de criação e então passa às sugestões. Ao lado de **+ Nova pessoa**, oferecer **Gerenciar funções, áreas e cargos**. Excluir um valor em uso mostra quantas contas ativas distintas o usam nos eventos da organização e pede confirmação; a mesma pessoa em dois eventos conta uma vez. Arquivar a sugestão conserva textos de perfis e histórico. Um valor arquivado já atribuído não impede editar outros dados de contato.

Fundador/diretor gerem esse catálogo; staff não lê nem altera o catálogo pela API. Cargo Fundador deriva do papel real do criador. Função **Financeiro**, cargo **Diretor** ou área **Produção** não concedem permissão por seu nome. Reutilizar catálogo não importa pessoas ou equipe.

---

## 55. Persistência e conservação do trabalho

### Fonte de verdade — MCT-55

Todos os dados importantes do evento devem estar no Supabase: participantes, equipe/vínculos, programação, tarefas, fornecedores, lançamentos, receitas, despesas, ingressos, patrocínios, ambientes, networking, grade, filtros, rascunhos e preferências relevantes. Nenhuma leitura de dados reais do evento deve depender de localStorage. Armazenamento de credencial pelo SDK de Auth é distinto de dados do evento.

Abrir em outra máquina ou após limpar cache restaura o que foi gravado. O navegador pode guardar conveniência local, mas não a única cópia do trabalho. Esse requisito não promete modo offline nem histórico completo de versões.

Gravar com retorno de erro visível e proteção contra revisão desatualizada. Se outra pessoa alterou o documento, recusar sobrescrita silenciosa, conservar a edição e oferecer exportação/recuperação. **Atualizado pelas MCT-66 e MCT-85:** alterações em campos diferentes são juntadas automaticamente; quando duas pessoas mudam o mesmo campo, vale a de quem salvou por último e aparece o aviso "1 alteração feita por outra pessoa foi substituída pela sua." — nada é descartado sem aviso. Importação de backup deve ser explícita, recusar IDs duplicados e nunca sobrescrever um evento existente sem fluxo próprio autorizado.

Cabeçalho deve distinguir **Salvo**, **Salvando…** e estado de **falha**, com aviso claro e **Tentar novamente**. A main usa o texto **Não salvo** para falha; a issue descreve **Falha ao salvar**. Nenhum desses estados pode dizer Salvo depois de uma gravação recusada. Falha deve conservar a edição em memória e permitir exportá-la.

### Sessão e foco — MCT-54

Voltar por alt+tab ou revalidar a mesma conta não recarrega a página, remonta a árvore, apaga formulário ou redireciona ao login. Renovação da sessão ocorre em segundo plano. Sessão realmente expirada mostra aviso e permite recuperar o acesso sem perder silenciosamente o trabalho em andamento. Logout explícito é um fluxo distinto.

### Limites e aplicação

Antes de migrar dados antigos, preservar/exportar o que ainda existir apenas no navegador. A recuperação é por arquivo explícito; o uso normal não importa automaticamente localStorage. Uma falha seguida de fechamento definitivo da aba sem recuperar/exportar não equivale a sincronização offline garantida.

Aplicação e migrações precisam corresponder. Não afirmar disponibilidade real apenas porque uma PR fez build. Proibir exclusão de dados de cliente, segredos no Git, contratação paga e deploy de produção sem autorização específica. O motor não é modificado por migrações de persistência.

---

## 56. Regra comercial e evolução do cadastro

### Limite de criação — MCT-46

> **MCT-78 (07/10/2026):** conta comum mantém **1 evento (arquivado também conta)** (`public.event_limit()` = 1, migração `20261007110000_event_limit_one`), em substituição ao limite 3 de 06/10/2026. Preservados: exceção master (`multi_event`), trava transacional contra pedidos simultâneos e todos os eventos existentes — nada é apagado nem arquivado; contas acima do limite apenas não criam novos. A interface mostra “Sua conta permite 1 evento. Eventos arquivados também contam. Para criar outro, fale com a gente.” Qualquer menção anterior a “até 3 eventos ativos” está superada.

Conta sem liberação pode criar o primeiro evento, mas não outro enquanto já tem vínculo ativo com um evento, inclusive recebido por convite. Arquivar não libera vaga. Eventos existentes acima do limite são conservados. O limite é aplicado no backend, inclusive contra chamada direta e dois pedidos simultâneos em organizações diferentes.

`user_event_permissions.multi_event` é a flag administrativa por conta. **`renannascimento0304@gmail.com` começa com a flag ligada**, sem limite de criação. Ser fundador de um novo evento não ativa essa exceção automaticamente. A flag não vem de campos do documento nem de metadados que o usuário edita.

Uma conta limitada não vê botões de criação; acessar a rota ou API diretamente recebe erro explicando a regra. Importação de backup passa pelo mesmo caminho autorizado de criação. Administração pode liberar uma conta caso a caso sem novo deploy de frontend, por alteração versionada no banco e UUID conferido; a pessoa não muda a própria flag.

Este lote restringe **criação**, não introduz recusa de todos os convites adicionais. Não implementa cobrança, preços, planos, compra, transferência de propriedade ou remoção de eventos antigos.

### Cadastro por liberação — MCT-64, proposta

A intenção comercial é admitir conta por convite, compra aprovada ou liberação manual do fundador da plataforma. **A entrega atual é uma spike documental; o cadastro ainda não foi fechado por essa regra.** MCT-64 não escolhe provedor nem integra pagamento.

A [proposta da PR #33](https://github.com/RenanManhaes/mesacerta-private/pull/33) recomenda validação no servidor antes de criar a conta, com pedido de acesso para quem não tem liberação. Modelo futuro `account_releases`: origem, identidade prospectiva/conta, evento/papel quando aplicável, estado, validade, token protegido, auditoria, referência idempotente e reserva/consumo. Uma aprovação de compra deve vir de backend verificado, nunca do redirecionamento do navegador.

Proposta para avaliação: liberação ainda não usada válida por sete dias e reserva de cadastro por quinze minutos. Esses prazos não encerram acesso a eventos. Recuperação de falhas e repetição idempotente precisam ser provadas antes de ativar. Nenhum fluxo do produto deve tratar isso como decisão aprovada só porque está documentado.

Alternativas estudadas: bloqueio seco, lista de espera e pedido de acesso. Recomendação preliminar: pedido de acesso com responsável de atendimento; sem operação definida, não oferecer uma fila abandonada. A estimativa do documento é **30–46 horas** de desenvolvimento futuro, sem provedor de pagamento; não é orçamento contratado. Esta spike não contrata serviço pago.

**Decisões ainda necessárias:** aprovar a forma de atendimento, prazos/retenção, autoridade da liberação manual, ativação da regra e efeitos de cancelamento/estorno. Abrir implementação própria após decisão. Liberação de cadastro, papel de evento e liberação de múltiplos eventos são três regras distintas.

---

## 57. Rastreabilidade das 19 issues e estado observado

Fontes: descrições e critérios lidos no Linear do time **Mesa Certa**, lote **MCT-46 a MCT-64**; PRD v1.1; alterações visuais de 05/10/2026; confirmação do responsável em 06/10/2026; código de main e PRs. Situação abaixo é do **Git em 06/10/2026**, base `a4c062b`, e não substitui status do Linear, aceite final ou confirmação de deploy/migração em produção.

| Issue / requisito resumido | Seções | Estado do código / entrega |
|---|---|---|
| [MCT-46 — limite de um evento](https://linear.app/renanmanhaes/issue/MCT-46) | 6, 56 | [PR #32 aberta](https://github.com/RenanManhaes/mesacerta-private/pull/32), implementação e regressão local. |
| [MCT-47 — uma cor por gráfico](https://linear.app/renanmanhaes/issue/MCT-47) | 43 | [PR #15](https://github.com/RenanManhaes/mesacerta-private/pull/15), integrado em main. |
| [MCT-48 — sugestões na busca](https://linear.app/renanmanhaes/issue/MCT-48) | 45 | [PR #17](https://github.com/RenanManhaes/mesacerta-private/pull/17), integrado em main. |
| [MCT-49 — layout de fornecedores](https://linear.app/renanmanhaes/issue/MCT-49) | 19, 43 | [PR #16](https://github.com/RenanManhaes/mesacerta-private/pull/16), integrado em main. |
| [MCT-50 — rótulos sem sobreposição](https://linear.app/renanmanhaes/issue/MCT-50) | 43 | [PR #20](https://github.com/RenanManhaes/mesacerta-private/pull/20), integrado em main. |
| [MCT-51 — editar cenário após gerar](https://linear.app/renanmanhaes/issue/MCT-51) | 27–28, 49 | [PR #18](https://github.com/RenanManhaes/mesacerta-private/pull/18), integrado em main. |
| [MCT-52 — acesso à lista de repetições](https://linear.app/renanmanhaes/issue/MCT-52) | 28, 44 | [PR #24](https://github.com/RenanManhaes/mesacerta-private/pull/24), integrado em main. |
| [MCT-53 — notificações do evento](https://linear.app/renanmanhaes/issue/MCT-53) | 45, 55 | [PR #22](https://github.com/RenanManhaes/mesacerta-private/pull/22), integrado em main. |
| [MCT-54 — conservar trabalho ao voltar à aba](https://linear.app/renanmanhaes/issue/MCT-54) | 55 | [PR #23](https://github.com/RenanManhaes/mesacerta-private/pull/23), integrado em main. |
| [MCT-55 — persistência no Supabase](https://linear.app/renanmanhaes/issue/MCT-55) | 48, 55 | [PR #26](https://github.com/RenanManhaes/mesacerta-private/pull/26), integrado em main; corrente aberta evolui o armazenamento por evento. |
| [MCT-56 — controle retangular de módulos](https://linear.app/renanmanhaes/issue/MCT-56) | 43 | [PR #19](https://github.com/RenanManhaes/mesacerta-private/pull/19), integrado em main. |
| [MCT-57 — código e link de convite](https://linear.app/renanmanhaes/issue/MCT-57) | 6–7, 54 | [PR #28 aberta](https://github.com/RenanManhaes/mesacerta-private/pull/28), inclui correção para salvar antes de entrar. |
| [MCT-58 — equipe por convite](https://linear.app/renanmanhaes/issue/MCT-58) | 5, 7, 54 | [PR #30 aberta](https://github.com/RenanManhaes/mesacerta-private/pull/30). |
| [MCT-59 — funções, áreas e cargos](https://linear.app/renanmanhaes/issue/MCT-59) | 54 | [PR #31 aberta](https://github.com/RenanManhaes/mesacerta-private/pull/31). |
| [MCT-60 — papéis e RLS por evento](https://linear.app/renanmanhaes/issue/MCT-60) | 5, 23, 45–48, 54 | [PR #29 aberta](https://github.com/RenanManhaes/mesacerta-private/pull/29), inclui correção de status exclusivo para staff na API direta de tarefas. |
| [MCT-61 — tarefas por arraste e prioridade](https://linear.app/renanmanhaes/issue/MCT-61) | 23, 43 | [PR #21](https://github.com/RenanManhaes/mesacerta-private/pull/21), integrado em main. |
| [MCT-62 — modal e cronograma editável](https://linear.app/renanmanhaes/issue/MCT-62) | 22, 43 | [PR #25](https://github.com/RenanManhaes/mesacerta-private/pull/25), integrado em main. |
| [MCT-63 — tipos de atividade reutilizáveis](https://linear.app/renanmanhaes/issue/MCT-63) | 22 | [PR #27 fechada](https://github.com/RenanManhaes/mesacerta-private/pull/27); código incorporado pela integração em main, inclusive catálogo e migração. |
| [MCT-64 — spike de cadastro por liberação](https://linear.app/renanmanhaes/issue/MCT-64) | 56 | [PR #33 aberta](https://github.com/RenanManhaes/mesacerta-private/pull/33), somente documento; decisão/implementação futuras. |

São **13 requisitos com código integrado em main** e **6 PRs abertas**, sendo uma delas apenas documental. Não somar PR fechada como implementação perdida nem contar a spike como fechamento de cadastro já entregue.

Dependências de revisão/integração autorizadas: **MCT-57 → MCT-60 → MCT-58 → MCT-59 → MCT-46**; MCT-64 documental é independente. Branches dependentes partem de main e incorporam commits necessários, sem merge feito por este agente. Corrente de acesso só pode ser liberada com o conjunto coerente de aplicação, RLS e migrações; não publicar uma etapa intermediária permissiva como produto concluído.

### Referências de implementação e design

- [Conferência das telas de referência](qa/reference-screens-review.md) e [revisão da integração visual](qa/platform-design-review.md): evidência histórica do design. Suas descrições antigas de equipe/persistência não substituem as novas regras deste PRD.
- `src/index.css`, `src/components/layout/platform.css`, `src/styles/chart-palette.css` e `src/pages/DesignSystem.jsx`: tokens, componentes e referências visuais integrados.
- [Relatório de revisão das PRs de acesso](https://github.com/RenanManhaes/mesacerta-private/blob/7227d97/docs/revisao-prs-mct.md): duas falhas corrigidas, evidências locais e condições de aplicação; confirmação posterior de fundador do legado nesta versão atualiza a premissa histórica daquele relatório. A [preparação da integração](https://github.com/RenanManhaes/mesacerta-private/blob/6e51b35/docs/integracao-prs-mct.md) registra a correção posterior, regressão completa, autorização de merge e coordenação com banco/publicação.
- [Unificação](unificacao.md) e [limites do Jev](jev-no-mesa-certa.md): origem do motor e limites da IA. Não interpretar os estudos como autorização para reescrever motor, automatizar contas ou mudar cadastro.

---

## 58. Aceite da evolução do produto

Os critérios individuais das issues continuam sendo o contrato. Para validar a evolução conjunta:

| Cenário | Resultado verificável |
|---|---|
| Formulário em edição + retorno de foco/renovação | Conteúdo e rota conservados, sem remontagem; expiração real mostra aviso. |
| Outro computador ou cache limpo | Dados gravados do evento, networking e preferências importantes restaurados do Supabase. |
| Falha de rede ou revisão concorrente | Aviso, estado de falha, tentativa novamente e edição/exportação conservadas; nenhum Salvo falso ou overwrite silencioso. |
| Conta sem exceção já com evento | Sem botão de criação; API de segundo evento negada; pedidos simultâneos não contornam a regra. |
| Conta de Renan / flag confiável | Mais de um evento pode ser criado; a conta comum não consegue alterar sua flag pela API. |
| Evento novo e convite | Criador fundador; código entra como staff; link usa papel registrado; auditoria guarda entrada; revogação impede novas entradas. |
| Staff tenta módulo financeiro ou altera tarefa além do status | Banco nega dados/operação não autorizados, testado pela API com token staff; menu mostra apenas três módulos. |
| Editar contato / remover pessoa | Contato persistido sem trocar login; remoção corta acesso e reentrada antiga, preservando histórico. |
| Catálogos em outro evento da organização | Valores criados reaparecem; confirmação de exclusão informa uso; função/cargo não elevam papel. |
| Tarefa movida / atividade criada ou arrastada | Estado e horário persistidos; tarefa reverte em falha; atividade só nasce na confirmação e fica ordenada por hora. |
| Design em desktop e celular | Gráficos com uma cor base, rótulos legíveis, fornecedor em uma coluna, controles coerentes e foco visível. |
| Networking após alteração de parâmetros | Grade desatualizada identificada; recálculo preserva cadastros; lista de repetições acessível; motor continua 9/9. |
| Encerramento da spike MCT-64 | Documento completo, recomendação e custos, sem alteração de cadastro ou provedor de pagamento em produção. |

Antes de cada PR de implementação: `npm run lint`, `npm run typecheck`, `npm run build` e `node src/lib/networking/engine.test.mjs`. Evidência deve ser saída de comando por critério; para autorização, chamada real de API com token restrito, e não apenas descrição de botão oculto. Registrar arquivos, exclusões, riscos e reversão sem apagar dados.

---

## 59. Registro de decisões e limites desta versão

| Decisão | Situação / autoridade |
|---|---|
| Design integrado em outubro | Pacote e prints aprovados pelo usuário; usar nova direção visual da seção 43. |
| Criador é fundador do evento | Confirmado pelo responsável; apresentação Diretor / Fundador não muda o papel especial no banco. |
| Fundador histórico dos eventos reais | Renan, `renannascimento0304@gmail.com`, único até 06/10/2026; não usar inferência por proprietário quando existe essa confirmação. |
| Código sem convite dá staff | Confirmado pelo responsável; link mantém papel escolhido. |
| Múltiplos eventos | Flag da conta, Renan com exceção inicial; não liberação automática de todo fundador. |
| Papéis e dados | Autorização por evento e no banco; nenhum dado real exclusivamente no navegador. |
| Fechar cadastro / pagamento | Intenção e proposta registradas; aguarda decisão e implementação própria. Nenhuma ativação foi feita pela spike. |
| Publicação e banco real | Este documento não autoriza merge, deploy ou migração em produção. Conferir conta histórica, dados e versão de aplicação antes de aplicar. |

Esta atualização é documental: não altera estilos, telas, algoritmo, cadastro, permissões ou dados. A correção do mapeamento histórico foi versionada e testada nas PRs de implementação; a conferência dos IDs e da conta real continua necessária antes da aplicação em produção. Estudos de IA, edição offline, cobrança/planos, envio de convites por e-mail, permissões individuais por módulo, importação de equipe, várias trilhas e edição manual de assentos continuam fora deste lote.

**Versão oficial:** PRD Mesa Certa v1.2 — 06/10/2026.

---

## 60. Revisão de usabilidade de outubro — MCT-68 a MCT-88

Revisão de Renan em 06/10/2026, registrada pelo Codex no Linear (MCT-68 a MCT-87) e concluída pelo Claude em 07/10/2026 no [PR #44](https://github.com/RenanManhaes/mesacerta-private/pull/44). Detalhe e evidências por item em `docs/usabilidade-2026-10-06.md`.

| Tema | Regra vigente |
|---|---|
| Programação (MCT-80, MCT-81) | Staff só lê, inclusive pela API (`event_save` e `schedule_items`). Direção reordena na lista principal; não há painel de cronograma separado. |
| Limite de eventos (MCT-78) | Conta comum: 1 evento, e arquivados também contam (§56). A exceção master continua. |
| Abas (MCT-79) | Cada aba do navegador pode estar numa conta diferente; sair numa aba não muda as outras contas. A mesma conta em duas abas compartilha a sessão. |
| Tempo real (MCT-85) | Quem está com o evento aberto vê, em segundos, o que outra pessoa salvou. Staff recebe só o aviso de mudança e a sua projeção, nunca o documento completo. |
| Equipe (MCT-73, MCT-74) | Convite: copiar link é a ação principal; código sempre dá staff. Papéis e remoção ficam no card do membro, só para o fundador, com confirmação. Configurações não muda mais papéis. |
| Fornecedor (MCT-84) | O card abre a edição; valores e pagamentos continuam no financeiro central. |
| Tarefas (MCT-86) | Título, descrição e um ou mais responsáveis, escolhidos entre os membros reais da equipe. Staff só muda o status das próprias tarefas. |
| Confirmações (MCT-82) | Toda ação destrutiva pede confirmação em modal, com foco preso no modal e devolvido ao botão de origem. |
| Banco (MCT-88) | `event_create` usa `private.is_org_member`; corrigido por migration. |

Migrations novas desta revisão, ainda **não aplicadas em produção**: `20261007090000` a `20261007160000`. Aplicar em ordem, junto com a publicação do front, depois de conferir a MCT-88.

