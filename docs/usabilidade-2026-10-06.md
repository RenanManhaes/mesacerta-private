# Revisão de usabilidade — 06/10/2026

## Estado da entrega

Base: `af4d735` (PR #42), branch `fix/october-usability`.
20 solicitações registradas no Linear (MCT-68 a MCT-87), distribuídas nos projetos existentes por assunto.

Este lote implementa os itens **1, 2, 3, 4, 5, 8, 9, 10, 16 e 20**. Os outros dez ficam preparados para execução pelo Claude, conforme autorização de Renan. Não foram executados por um agente Claude nesta conversa.

Os itens implementados permanecem **In Review** até validação visual. O navegador do Codex falhou em duas tentativas com:
`failed to write kernel assets: O sistema não pode encontrar o caminho especificado. (os error 3)`.
Uma tentativa incluiu reinicialização do kernel. Não é uma solicitação pendente de permissão do usuário.

**Merge e publicação ficam pendentes da validação visual pelo Claude.** PR/merge já autorizados por Renan; não pedir confirmação novamente.

## Issues e escopo

| Item | Linear | Solicitação | Continuidade |
| --- | --- | --- | --- |
| 1 | [MCT-68](https://linear.app/renanmanhaes/issue/MCT-68/revisao-de-usabilidade-01-ajustar-tipografia-e-proporcoes-dos-cards-de) | Revisão de usabilidade 01 — Ajustar tipografia e proporções dos cards de planos | Implementado no PR; validação visual pendente |
| 2 | [MCT-69](https://linear.app/renanmanhaes/issue/MCT-69/revisao-de-usabilidade-02-sugerir-cidades-brasileiras-durante-a) | Revisão de usabilidade 02 — Sugerir cidades brasileiras durante a criação do evento | Implementado no PR; validação visual pendente |
| 3 | [MCT-70](https://linear.app/renanmanhaes/issue/MCT-70/revisao-de-usabilidade-03-corrigir-distancia-do-cursor-e-fluidez-ao) | Revisão de usabilidade 03 — Corrigir distância do cursor e fluidez ao arrastar tarefas | Implementado no PR; validação visual pendente |
| 4 | [MCT-71](https://linear.app/renanmanhaes/issue/MCT-71/revisao-de-usabilidade-04-autocomplete-de-areas-e-criacao-sem) | Revisão de usabilidade 04 — Autocomplete de áreas e criação sem confirmação | Implementado no PR; validação visual pendente |
| 5 | [MCT-72](https://linear.app/renanmanhaes/issue/MCT-72/revisao-de-usabilidade-05-simplificar-catalogo-e-separar-funcoes-de) | Revisão de usabilidade 05 — Simplificar catálogo e separar funções de áreas | Implementado no PR; validação visual pendente |
| 6 | [MCT-73](https://linear.app/renanmanhaes/issue/MCT-73/revisao-de-usabilidade-06-simplificar-o-modal-de-convite-da-equipe) | Revisão de usabilidade 06 — Simplificar o modal de convite da equipe | Claude: implementação pendente |
| 7 | [MCT-74](https://linear.app/renanmanhaes/issue/MCT-74/revisao-de-usabilidade-07-gerenciar-papeis-e-remocao-no-card-da-equipe) | Revisão de usabilidade 07 — Gerenciar papéis e remoção no card da equipe | Claude: implementação pendente |
| 8 | [MCT-75](https://linear.app/renanmanhaes/issue/MCT-75/revisao-de-usabilidade-08-expor-configuracao-das-rodadas-no-topo-de) | Revisão de usabilidade 08 — Expor configuração das rodadas no topo de Networking | Implementado no PR; validação visual pendente |
| 9 | [MCT-76](https://linear.app/renanmanhaes/issue/MCT-76/revisao-de-usabilidade-09-usar-cotas-diamante-ouro-e-prata-com-icones) | Revisão de usabilidade 09 — Usar cotas Diamante, Ouro e Prata com ícones | Implementado no PR; validação visual pendente |
| 10 | [MCT-77](https://linear.app/renanmanhaes/issue/MCT-77/revisao-de-usabilidade-10-padronizar-interruptores-com-formato) | Revisão de usabilidade 10 — Padronizar interruptores com formato semelhante ao iPhone | Implementado no PR; validação visual pendente |
| 11 | [MCT-78](https://linear.app/renanmanhaes/issue/MCT-78/revisao-de-usabilidade-11-restabelecer-limite-de-um-evento-por-conta) | Revisão de usabilidade 11 — Restabelecer limite de um evento por conta comum | Claude: implementação pendente |
| 12 | [MCT-79](https://linear.app/renanmanhaes/issue/MCT-79/revisao-de-usabilidade-12-isolar-autenticacao-entre-abas-para-contas) | Revisão de usabilidade 12 — Isolar autenticação entre abas para contas diferentes | Claude: implementação pendente |
| 13 | [MCT-80](https://linear.app/renanmanhaes/issue/MCT-80/revisao-de-usabilidade-13-impedir-que-staff-altere-programacao-no) | Revisão de usabilidade 13 — Impedir que staff altere programação no servidor e na tela | Claude: implementação pendente |
| 14 | [MCT-81](https://linear.app/renanmanhaes/issue/MCT-81/revisao-de-usabilidade-14-arrastar-a-programacao-principal-e-remover) | Revisão de usabilidade 14 — Arrastar a programação principal e remover coluna duplicada | Claude: implementação pendente |
| 15 | [MCT-82](https://linear.app/renanmanhaes/issue/MCT-82/revisao-de-usabilidade-15-usar-modal-em-todas-as-confirmacoes) | Revisão de usabilidade 15 — Usar modal em todas as confirmações | Claude: implementação pendente |
| 16 | [MCT-83](https://linear.app/renanmanhaes/issue/MCT-83/revisao-de-usabilidade-16-pedir-nome-no-cadastro-e-reutilizar-perfil) | Revisão de usabilidade 16 — Pedir nome no cadastro e reutilizar perfil da equipe | Implementado no PR; validação visual pendente |
| 17 | [MCT-84](https://linear.app/renanmanhaes/issue/MCT-84/revisao-de-usabilidade-17-abrir-gestao-do-fornecedor-ao-clicar-no-card) | Revisão de usabilidade 17 — Abrir gestão do fornecedor ao clicar no card | Claude: implementação pendente |
| 18 | [MCT-85](https://linear.app/renanmanhaes/issue/MCT-85/revisao-de-usabilidade-18-sincronizar-dados-e-rodadas-entre-membros-em) | Revisão de usabilidade 18 — Sincronizar dados e rodadas entre membros em tempo real | Claude: implementação pendente |
| 19 | [MCT-86](https://linear.app/renanmanhaes/issue/MCT-86/revisao-de-usabilidade-19-editar-tarefas-com-descricao-e-busca-de) | Revisão de usabilidade 19 — Editar tarefas com descrição e busca de responsáveis | Claude: implementação pendente |
| 20 | [MCT-87](https://linear.app/renanmanhaes/issue/MCT-87/revisao-de-usabilidade-20-acelerar-navegacao-da-landing-por-ancoras) | Revisão de usabilidade 20 — Acelerar navegação da landing por âncoras | Implementado no PR; validação visual pendente |

## Código do lote implementado

- Cards de oferta: tipografia menor, preço pode quebrar linha, texto e botões proporcionais; identidade preservada.
- Cidades: snapshot oficial de **5.571 municípios / 27 UFs**; carregamento apenas ao focar; busca sem acentos, menu com setas/Enter/Escape; local livre continua válido. Fonte: [API de Localidades IBGE](https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome), obtida em 06/10/2026.
- Componente `SearchSuggestions`: compartilhado por cidades e campos do catálogo, com estados ARIA.
- Área: sugestão desde o foco, criação direta no RPC existente, sem confirmação.
- Catálogo: todas as áreas/funções no filtro inicial, papéis excluídos dessa gestão, exemplos distinguem trabalho de setor, exclusão em AlertDialog. Valores existentes não são renomeados em massa.
- Arraste de tarefa: portal para document.body durante arraste, removida rotação/escala que alterava captura. Fundamentos: [guia oficial hello-pangea/dnd](https://github.com/hello-pangea/dnd/blob/main/docs/guides/reparenting.md). Geometria ainda precisa de teste em navegador.
- Networking: ação Configurar rodadas no cabeçalho; formulário completo em modal. Engine original não alterado.
- Patrocínios: Diamante/Ouro/Prata com ícones. Master/Apoio antigos recebem apresentação nova, preservando nomes internos, IDs, associações, contagens e pagamentos; novas cotas usam nomenclatura nova.
- Switch: trilho e thumb circulares; sobrescrita de altura nos botões da plataforma corrigida.
- Cadastro: `options.data.full_name` no Supabase Auth; a equipe já lê essa mesma chave como nome inicial. Nenhuma nova tabela/coluna/fonte de nome.
- Navegação da landing: animação de 280ms, com cancelamento por intervenção e salto imediato em movimento reduzido.

## Review realizado

1. Tipagem dos componentes AlertDialog corrigida com props/ref dos primitives Radix.
2. Criação de catálogo não depende de confirmação; falha mantém erro visível.
3. Exclusão não fecha o modal durante chamada assíncrona e não remove dados de membros.
4. Portal conserva padding/borda do card e não sobrescreve transformação/posição controladas pela biblioteca.
5. Contagem de cotas usa a associação original, evitando somar duas vezes se um evento possuir Master e Diamante.
6. Nenhuma migration, credencial, conta real ou evento de produção foi alterado neste lote.

## Validação

- `npm ci --no-audit --no-fund` instala exatamente o lockfile.
- `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`.
- `node scripts/test-usability-october.mjs`: interações de foco/teclado, seleção, criação de área sem confirmação, catálogo completo sem papéis e exclusão modal; busca Sao P → São Paulo/SP.
- Engine: nove garantias conferidas antes da mudança; suíte executada depois.
- O teste de componentes usa primitives simples e catálogo sintético; **não** comprova geometria, foco do Radix em navegador, nem persistência real por RPC.
- Warnings existentes: Base44 app ID ausente (produto usa Supabase) e chunk principal grande; não constituem evidência de erro no fluxo.

## Claude: próximos passos sem precisar falar com Renan

1. Recuperar navegador de validação e abrir preview do PR. Comparar cards a 1280/1440 e celular; nenhuma sobreposição.
2. Testar arraste com mouse/teclado, scroll da página e filtros; card deve acompanhar ponto de captura e manter status após reload.
3. Testar catálogo com backend real sintético: selecionar, adicionar área, filtrar, excluir/cancelar. Confirmar foco e Escape dos modais.
4. Networking: abrir configuração pelo topo, editar, fechar, gerar, animar e exportar; rodar engine.test.mjs sem editar engine.js.
5. Testar cadastro sintético com nome e ingresso em equipe; confirmar nome pelo fluxo existente.
6. Revisar diff e gates. Se aprovado, marcar PR pronto, fazer merge já autorizado e verificar deployment no domínio público.
7. Priorizar **MCT-80 (staff somente leitura)**, **MCT-78 (limite 1)**, **MCT-85 (sincronização)** e **MCT-79 (abas independentes)**. Os outros itens pendentes: MCT-73, 74, 81, 82, 84 e 86.
8. Não fazer alterações em produção pelo execute_sql: usar migrations versionadas e testes de papel/concorrência antes de aplicar.

### Diagnósticos dos itens urgentes

- Limite atual **3**, introduzido pela decisão anterior MCT-46 e migration `event_limit_three` já aplicada. Pedido atual exige **1** por conta comum. Preservar flag master e todos eventos existentes. O banco usa `event_creation_permission` / `event_create`, trava transacional e `event_limit()`. Atualizar texto “Até 3 eventos ativos” e testes/PRD.
- Staff: `event_save` permite schedule no ramo staff; policy `schedule_items.event_access` é FOR ALL para todo membro. Ocultar UI não fecha os caminhos de escrita. Corrigir ambos com testes negativos no banco.
- Realtime: `EventContext` atualiza no foco/visibilidade, sem subscription. Preservar CAS/merge e drafts locais pendentes. Staff não pode receber o JSON completo de `platform_events`; usar projeção/sinal autorizado.
- Duas contas em abas: armazenamento atual é padrão compartilhado do Supabase. Investigar também BroadcastChannel, storageKey, locks, OAuth/confirm links e refresh; sessionStorage sozinho pode não isolar broadcasts.
- Confirmações: exclusão do catálogo foi convertida neste lote. Remoção de membro, revogação e demais confirmações continuam na MCT-82.
- Papéis no card: usar RPCs existentes, não inventar novos cargos de acesso, nem permitir staff/diretor promover a si mesmo.

## Reversão

Antes do merge, basta não publicar o PR. Depois do merge, reverter o commit do lote e confirmar deployment anterior. Não há migration nem transformação de dados para reverter.

