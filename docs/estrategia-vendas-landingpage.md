# Mesa Certa — estratégia de vendas e página de vendas

Data: 01/10/2026. Issue: MCT-42. Projeto Linear: Vendas — oferta, preços e página de vendas.
Status: estratégia proposta; preços e demanda ainda não validados. Produção pausada por Renan.

## 1. Diagnóstico AIOX

Aplicação do `aiox-sales-chief`, fonte canônica `squads/sales-fran/agents/sales-chief.md` e tarefa `tasks/create-sales-copy.md`, no AIOX local de ProspectAi. Uso dos frameworks descritos nesses arquivos; sem alegar participação de agentes independentes.

- Produto: plataforma de planejamento e operação de eventos, com networking opcional.
- Público inicial proposto: organizadores independentes, pequenas produtoras, associações e comunidades de negócios com eventos recorrentes. Começar pelos organizadores de encontros empresariais, próximos da experiência real do projeto; depois ampliar para outros tipos de evento.
- Comprador: dono ou responsável que organiza e acompanha o orçamento. Hipótese de equipe pequena e decisão direta.
- Estágio: validação comercial inicial; autenticação e módulos ainda evoluem com outros agentes. Ter telas implementadas não comprova prontidão da jornada inteira.
- Problema comercial: transformar controle fragmentado em benefício fácil de entender e disposição real de pagar.
- Complexidade: SaaS B2B de baixo valor, venda pela página. Adaptar o perfil SaaS SMB do AIOX para uma compra simples, sem exigir reuniões longas.
- Abordagem principal: Gap Selling — situação atual, impacto, situação desejada. Apoio: qualificação e redução de risco de Sandler. Não usar estatísticas das metodologias como prova do produto.

## 2. Posicionamento e promessa

**Promessa central: organize seus eventos e acompanhe o financeiro de cada um em um só lugar.**

Situação atual: orçamento em uma planilha, fornecedores em conversas e tarefas em outras listas; a cada novo evento, é preciso reunir novamente o contexto.

Situação desejada: abrir o evento e saber o que está pendente, quem está envolvido e como estão receitas e despesas. Vários eventos, cada um com seus próprios dados.

Distância a investigar: horas de atualização, tempo para fechar o financeiro e dificuldade para encontrar pendências. Não há medição própria de economia ou lucro. Nas entrevistas, pedir exemplos do último evento e medir antes/depois no piloto; não publicar números hipotéticos como resultados.

O networking é uma diferenciação útil para encontros empresariais; continua opcional. A plataforma atende eventos com e sem rodadas de negócios. IA não é a promessa central de venda.

## 3. Oferta e preços para o primeiro teste

Uma oferta, duas formas de contratação; mesmos recursos e limites em ambas, para não confundir preferência por pagamento com preferência por funcionalidades.

| Modalidade | Preço proposto | Condição | Melhor adequação |
|---|---:|---|---|
| Mensal | R$ 97/mês | Cobrança recorrente mensal; cancelamento impede a próxima renovação | Quem quer começar com compromisso menor ou usa em períodos curtos |
| Acesso de 12 meses | R$ 797 à vista | Uma compra, acesso por 12 meses a partir da ativação; sem renovação automática | Quem planeja usar durante o ano e quer previsibilidade |

12 mensalidades custam R$ 1.164. O pagamento de R$ 797 economiza R$ 367, aproximadamente 31,5%. Equivalente de R$ 66,42/mês serve apenas para comparação: não é uma mensalidade nem parcelamento. O mensal custa R$ 776 por oito meses e R$ 873 por nove; a compra de 12 meses passa a ser mais econômica a partir do nono mês de uso contínuo.

**Recomendação:** manter ambas as opções, com destaque visual ao acesso por 12 meses por sua economia, sem selecionar uma compra automaticamente. Não rotular como “mais vendido” sem dados. O plano mensal facilita a primeira compra; o anual antecipa caixa, mas exige prestar o serviço por todo o período.

### Escopo comercial proposto, sujeito à capacidade comprovada

- Uma organização, um usuário responsável e um evento ativo por conta comum (MCT-78, 07/10/2026; antes previa três). Mais de um evento ativo exige liberação pela equipe. Contas master não têm limite.
- Financeiro, participantes, fornecedores, tarefas, programação e capacidade, conforme módulos efetivamente aprovados para lançamento.
- Networking incluído quando a jornada completa estiver demonstrada; nenhuma promessa de escala de participantes sem teste correspondente.
- Suporte assíncrono por um canal a definir, sem prometer atendimento 24 horas ou implantação individual incluída.
- Atualizações liberadas durante o período contratado.

Os limites são uma proposta comercial, não uma limitação já implementada. Devem constar claramente nos cartões de preço se adotados. Não prometer eventos, usuários, arquivos ou uso de IA ilimitados. Operações maiores terão negociação própria futura; não criar terceiro plano nesta primeira rodada.

### Condições propostas

Garantia comercial: reembolso integral solicitado nos primeiros sete dias da primeira compra, nos dois modelos. Antes da publicação, definir canal, responsável e processo de reembolso. Alternativas avaliadas: 30 dias aumenta exposição inicial; garantia por resultado depende de medição que ainda não existe. Recomenda-se sete dias para o piloto.

Mensal: cancelamento mantém acesso até o fim do período pago. Compra de 12 meses: termina ao completar o prazo; nova compra exige ação explícita. Não chamar de vitalício. Antes de receber pagamentos, documentar política de dados após expiração e verificar exportação, cobrança, cancelamento e devolução. Não prometer exportação ou retenção indefinida antes de estarem disponíveis. Sem parcelamento no primeiro teste; eventual parcelamento futuro não deve ser confundido com assinatura cancelável.

## 4. Referências de mercado

Preços públicos consultados em 01/10/2026; não representam pesquisa de disposição a pagar do nosso público.

| Referência | Oferta pública observada | O que informa |
|---|---|---|
| ConneOPS Produtor | R$ 708/ano, equivalente de R$ 59/mês; três eventos ativos e um usuário | Há concorrência direta abaixo do preço anual proposto |
| ConneOPS Estrategista | R$ 984/ano, equivalente de R$ 82/mês; dez eventos ativos e três usuários | Recursos e capacidade mudam entre planos; preço sozinho não basta |
| Sympla | Criação gratuita, sem mensalidade fixa; cobrança associada à venda de ingressos pagos | Bilheteria tem outra lógica de cobrança; não confundir com gestão operacional |

Fontes oficiais: [ConneOPS — planos](https://conneops.com/) e [Sympla — quanto custa](https://produtores.sympla.com.br/quanto-custa/).

Inferência: R$ 797/ano fica entre as duas referências anuais da ConneOPS, mas o plano de R$ 708 oferece capacidade semelhante à proposta inicial. Portanto, nosso preço requer demonstrar simplicidade, controle financeiro e valor do networking para o público escolhido. Não alegar superioridade ou menor preço. R$ 97/mês é uma hipótese para menor compromisso; não foi derivado de um preço mensal independente do concorrente.

## 5. Roteiro completo da landing page

Textos abaixo são proposta editorial para a versão comercial. Publicar cada recurso somente depois de confirmar sua disponibilidade. Enquanto a produção estiver pausada ou a jornada não estiver pronta, a ação disponível será solicitar demonstração/interesse; não simular uma compra disponível.

### 1 — Primeira tela

**Organize seus eventos e acompanhe o financeiro de cada um em um só lugar.**

Reúna participantes, fornecedores, tarefas e programação no Mesa Certa. Para encontros empresariais, organize também as rodadas de networking.

Botão principal da versão comercial: **Ver planos e começar**. Ação secundária: **Ver como funciona**.

Imagem: captura real com dois eventos diferentes e o detalhe de um deles, sem dados pessoais. Não usar o valor financeiro do evento de referência como padrão do produto.

### 2 — Identificação com o problema

**Cada evento traz uma nova lista de coisas para acompanhar.**

Quando o orçamento está em uma planilha e as combinações com fornecedores ficam nas conversas, descobrir o que falta exige procurar em vários lugares. Com mais de um evento em andamento, esse trabalho se repete.

### 3 — Impacto

**Tenha as informações à mão para decidir o próximo passo.**

Confira despesas, receitas e pendências do evento que está organizando. O objetivo é dar clareza ao planejamento e ao acompanhamento; não prometemos lucro nem uma economia de tempo ainda não medida.

### 4 — Explicação do mecanismo

**Cada evento tem seu próprio espaço.**

O planejamento fica ligado ao evento correspondente. Assim, você pode acompanhar atividades e números de projetos diferentes sem misturar suas informações.

### 5 — Demonstração em três passos

1. Crie seu evento com as informações principais.
2. Organize participantes, fornecedores, tarefas e financeiro.
3. Acompanhe o andamento e revise o que precisa de atenção.

Vídeo proposto de 60–90 segundos: criar um evento, registrar uma despesa, encontrar uma pendência e alternar para outro evento. Mostrar somente fluxos que funcionem de ponta a ponta na versão disponível.

### 6 — Prova

**Networking com uma origem prática.**

O motor de rodadas que deu origem ao módulo foi usado no Get Connected Sorocaba 2026, com 76 convidados, 14 mesas e 14 rodadas. Esse histórico se refere ao motor original; não comprova uso da plataforma completa em produção.

Antes de publicar nomes, imagens ou depoimentos, confirmar autorização. Se isso não estiver disponível, usar demonstração do produto. Coletar no piloto: contexto, operação anterior, módulos utilizados, tempo observado e depoimento autorizado. Nenhum testemunho fictício.

### 7 — O que está incluído e preços

Apresentar os módulos liberados, com uma frase de benefício para cada um. Networking identificado como opcional. Exibir o limite de organização, usuários e eventos ativos.

**Mensal — R$ 97/mês**
Cobrança mensal recorrente. Cancele a renovação quando quiser.
Botão: **Começar no mensal**.

**12 meses — R$ 797 em pagamento único**
Economize R$ 367 comparado a 12 mensalidades. Acesso por 12 meses, sem renovação automática.
Botão: **Comprar acesso de 12 meses**.

Não criar uma soma de “bônus” com preços fictícios. A comparação de valor verificável é entre R$ 797 e R$ 1.164 pelos mesmos 12 meses.

### 8 — Objeções e perguntas frequentes

- **“Minha planilha já funciona.”** Talvez sua preocupação seja trocar uma rotina conhecida. Veja uma demonstração com informações de exemplo e avalie se reunir os dados resolve uma dificuldade real da sua operação.
- **“Está caro para mim.”** Talvez você ainda não saiba quanto vai usar. O mensal reduz o compromisso inicial; a compra de 12 meses compensa para uso contínuo a partir do nono mês. Não prometer que a ferramenta se paga sozinha.
- **“Serve para um evento sem networking?”** Sim. O networking é opcional; a proposta principal é organizar o evento e acompanhar sua operação.
- **“Posso organizar vários eventos?”** Cada conta comum mantém 1 evento ativo; mais de um exige liberação da equipe. Os dados e o financeiro pertencem a cada evento.
- **“Pago uma vez e uso para sempre?”** A compra única libera 12 meses de acesso. Ao final, você escolhe se quer comprar outro período.
- **“Como cancelo o mensal?”** O cancelamento interrompe próximas renovações e mantém o acesso até o fim do período pago. Publicar o caminho exato apenas quando testado.
- **“Posso vender ingressos por aqui?”** Esta oferta é de planejamento e operação. Não anunciar bilheteria, processamento de pagamentos ou integração com Sympla sem uma entrega comprovada.
- **“O que acontece com meus dados quando termina?”** A resposta depende da política e dos recursos que serão definidos antes da abertura comercial. Esta lacuna impede publicar a FAQ final e receber pagamentos com a oferta atual.

### 9 — Redução de risco

**Sete dias para avaliar.**

Na primeira compra, você pode solicitar reembolso integral nos primeiros sete dias pelo canal informado. Texto proposto: só publicar quando houver processo operacional disponível.

### 10 — Chamada final

**Organize seu próximo evento com as informações no mesmo lugar.**

Escolha a forma de contratação que combina com sua rotina.
Botão: **Escolher meu plano** — leva aos mesmos cartões de preço.

Não usar contagem regressiva, número fictício de vagas ou desconto “só hoje”. A data do próximo evento do comprador é o motivo real para começar.

### 11 — Recapitulação e rodapé

Mesa Certa: planejamento e operação de vários eventos, com o financeiro de cada um e networking opcional. Mensal de R$ 97 ou acesso de 12 meses por R$ 797.

Rodapé comercial futuro: responsável pela oferta, contato, termos, privacidade e condições de contratação efetivamente definidos.

## 6. Aquisição e sequência de validação

Executar depois da retomada e liberação comercial; este documento não inicia campanhas nem contatos.

1. **Entrevistas:** dez organizadores com evento nos próximos 90 dias, incluindo encontros empresariais e outro tipo de evento. Perguntar sobre o último evento, frequência anual, ferramentas, tempo de fechamento e responsável pela compra. Não tratar intenção declarada como venda.
2. **Demonstrações:** vídeo curto e uma demonstração de dez minutos para interessados. Mostrar dois eventos independentes, financeiro e, quando relevante, networking. Registrar objeções e tempo necessário de suporte.
3. **Primeiros compradores:** captar por rede existente, parcerias com associações e conteúdo sobre organização financeira de eventos. Mensagens individuais devem partir de relacionamento ou autorização apropriada; nenhum envio realizado nesta entrega.
4. **Conteúdo:** três peças iniciais — “O que revisar no orçamento antes de confirmar um evento”, “Como acompanhar dois eventos sem misturar as contas” e “Como preparar rodadas de networking”. Direcionar à mesma página.
5. **Tráfego pago:** avaliar somente depois de vendas reais, ativação e custo de suporte observados. Nenhum orçamento contratado ou anúncio publicado.

## 7. Teste dos modelos e decisão

### Etapa 1 — Preferência em uma página

Mostrar os dois modelos com os mesmos recursos. Medir visualizações, escolha, início de checkout, pagamento confirmado, ativação, reembolso e cancelamento. Escolha entre cartões mostra preferência nessa apresentação; não comprova efeito causal do modelo.

Ativação proposta: em até sete dias, comprador cria um evento, registra ao menos uma receita ou despesa e uma tarefa ou fornecedor. Acompanhar também se retorna e se consegue organizar o segundo evento; criar dados sozinho não prova sucesso na operação.

### Etapa 2 — Experimento controlado, se houver volume

Comparar página A com oferta mensal de R$ 97 e página B com compra de 12 meses de R$ 797. Manter público, campanha, conteúdo, recursos e garantia iguais; variar apenas o modelo e a comunicação necessária de cobrança. Distribuir visitantes elegíveis 50/50, fixar variante por visitante e identificar origem. A opção alternativa pode ser fornecida quando solicitada, registrando a troca; não ocultar condições ou restringir direitos.

Primeira leitura após 30 dias: buscar ao menos 100 visitantes qualificados por variante e dez compradores por variante como marco operacional. **Esses números não asseguram significância estatística.** Com baixo volume, resultado inconclusivo: continuar coleta e entrevistas, sem declarar vencedor. Antes de um teste conclusivo, calcular amostra a partir da conversão de base e melhoria mínima relevante.

### Métricas

| Métrica | Cálculo / observação |
|---|---|
| Conversão paga | Compradores confirmados / visitantes únicos elegíveis; separar reembolsos |
| Ativação | Compradores ativados / compradores com sete dias completos de acompanhamento |
| CAC | Gasto atribuível de aquisição / novos compradores; incluir custo humano separadamente |
| Uso | Retorno e atividade real em 30, 60 e 90 dias; eventos organizados por cliente |
| Retenção mensal | Clientes da mesma coorte que renovam no segundo e terceiro mês; considerar sazonalidade |
| Satisfação anual | Uso, reembolso e suporte; pagamento antecipado não comprova retenção ou renovação |
| Contribuição | Receita líquida menos taxas, tributos aplicáveis, infraestrutura, IA, suporte variável e reembolsos |

A compra anual gera mais caixa inicial e uma obrigação de serviço maior. Não comparar R$ 797 recebidos com apenas uma mensalidade de R$ 97 e concluir que o anual venceu. Comparar coortes em horizontes comuns de 90 dias e projetar 12 meses com cenários explícitos de permanência, custo de serviço e renovação; distinguir projeção de observação. O dinheiro antecipado não é todo margem disponível.

**Regra de decisão:** manter ambos enquanto não houver evidência suficiente. Favorecer aquisição pelo mensal se ele trouxer mais compradores ativados com contribuição sustentável e renovações; favorecer destaque anual se sua conversão, uso e contribuição suportarem doze meses de entrega. Sem dados de custos, não declarar um CAC máximo rentável ou LTV validado.

**Teste de preço posterior:** se houver adoção e objeção recorrente de preço, testar anual de R$ 697 versus R$ 797, mantendo o mensal em R$ 97. Se compradores aceitarem com pouco atrito e suporte sustentável, testar R$ 997 anual versus R$ 797 em nova coorte. São alternativas futuras, não preços simultâneos de lançamento. Mudar uma variável por rodada; não simular descontos com um preço “de” nunca praticado.

## 8. Banco de mensagens AIOX

### Perguntas para aprender com compradores — SPIN simplificado

Situação: Quantos eventos organiza por ano? Onde registra receitas e despesas? Quem acompanha as tarefas?

Problema: Qual informação é mais difícil de encontrar? O que se perde nas conversas? O que dá mais trabalho quando dois eventos coincidem?

Implicação: O que aconteceu na última vez que uma pendência apareceu tarde? Quanto tempo levou para fechar o último financeiro? Quem precisou refazer trabalho?

Benefício desejado: O que gostaria de ver ao abrir o evento? Qual informação ajudaria na próxima decisão? O que tornaria a ferramenta útil toda semana?

### Cinco títulos para testar depois do preço

1. Organize seus eventos e acompanhe o financeiro de cada um em um só lugar.
2. Saiba o que falta para seu próximo evento acontecer.
3. Acompanhe receitas, despesas e tarefas de cada evento.
4. Vários eventos em andamento. Um lugar para acompanhar cada um.
5. Planeje seus encontros empresariais, do orçamento às rodadas de networking.

### Dez situações para reconhecer na comunicação

Orçamento desatualizado; custo esquecido; fornecedor sem confirmação; prazo sem responsável; informação repetida; financeiro difícil de fechar; versões diferentes da lista; contas de eventos misturadas; histórico difícil de encontrar; preparação de networking dispersa. São hipóteses de dor a confirmar em entrevistas, não estatísticas de perda.

### Três transições de benefício

- Abra o evento e encontre o que precisa de atenção.
- Acompanhe cada orçamento com os dados do evento correspondente.
- Chegue à preparação das rodadas com participantes e organização à mão.

## 9. Revisão e pendências antes da venda

Revisão editorial realizada: preços iguais em todas as seções; economia calculada por comando; anual separado de vitalício e assinatura; público inicial específico; diversos eventos contemplados; prova restrita ao motor original; nenhuma promessa de lucro, estatística inventada ou escassez artificial. Não houve teste de compreensão com compradores nem validação de conversão.

Pendências materiais: demonstrar a jornada dos módulos anunciados e isolamento dos dados; definir e viabilizar limites da oferta; cobrança e cancelamento; política de dados e término do acesso; reembolso e suporte; capturas e permissões de prova. As equipes responsáveis deverão implementar quando a produção for retomada. A estratégia está entregue, mas a venda não está liberada por este documento.

Rastreabilidade: PRD v1.1 e AGENTS.md do Mesa Certa; skill e tarefa AIOX citadas acima; fontes oficiais de preço; issue MCT-42; arquivos de aplicação não alterados nesta etapa.
