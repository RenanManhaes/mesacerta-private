# Persistência do evento (MCT-55)

## Fonte de verdade e auditoria

`platform_workspaces.events` é a fonte de verdade já criada pelas migrations
versionadas `20261005171348_platform_workspace.sql` e
`20261005172415_platform_workspace_privileges.sql`. Esta issue não muda o schema:
o documento JSONB existente comporta os novos campos, com isolamento por organização
e revisão otimista no banco. Não foi alterado nenhum painel ou banco remoto.

O documento inclui cadastro do evento, todos os módulos, ambientes, equipe,
cadastro/configuração de networking e a distribuição gerada. A distribuição é
restaurada pelo adaptador existente; engine.js permanece intacto.

A auditoria encontrou a leitura do backup `mesacerta_v1` e um marcador de
importação em EventContext. Essas leituras/escritas foram removidas. Nenhum código
de produção sob src lê dados de evento de localStorage. Autenticação do SDK pode
guardar sua própria sessão no navegador; isso não é armazenamento do evento.

`uiState[userId]` no mesmo documento guarda filtros e rascunhos por usuário:

- filtros de participantes, tarefas, equipe, financeiro e busca global;
- rascunhos de despesas, receitas, patrocínios/planos, ambientes e equipe;
- dados em edição nas configurações e no menu Adicionar;
- valores em edição de pagamentos de fornecedores;
- parâmetros do simulador, busca de networking e rodada selecionada.

Abrir outro dispositivo com a mesma conta recupera esses campos. Não há histórico
de versões nem edição offline com sincronização posterior. Estados transitórios
como animação em execução, popover aberto, spinner e mensagem de validação não
são dados do evento. A criação de um evento que ainda não existe não ganhou
um serviço de rascunhos nesta issue.

## Salvamento e recuperação

O indicador no cabeçalho do evento mostra Salvo, Salvando ou Falha ao salvar,
inclusive no mobile. Uma falha mantém o conteúdo na memória e apresenta o botão
Tentar novamente. Falha de leitura inicial também pode ser repetida sem reload.
`flush()` não finge sucesso antes de os eventos serem carregados. A revisão do
banco impede sobrescrita silenciosa por uma segunda sessão.

Antes de integrar/publicar esta mudança, operadores que ainda tenham dados
exclusivos de versões antigas precisam usar a importação da versão anterior e
aguardar Salvo, ou exportar seu backup JSON. A nova opção em Meus eventos recebe
esse arquivo explicitamente, sem ler storage do navegador. IDs já presentes são
recusados para proteger o documento existente. Duplicatas precisam ser conciliadas
pelo operador antes da importação; esta issue não decide qual cópia deve vencer.
Nenhuma chave antiga do navegador é removida e nenhum documento existente é limpo.

## Prova reproduzível, somente local

Requisitos: Node, Docker Desktop e npm. A configuração versionada é de
desenvolvimento local; não é uma configuração de publicação.

```text
npm ci
npx --yes supabase start --exclude studio,imgproxy,edge-runtime,logflare,vector,supavisor,realtime,storage-api,postgres-meta
node scripts/check-mct55.mjs
```

O teste usa Supabase Auth e REST reais em 127.0.0.1, com contas e organizações
sintéticas, e os componentes EventProvider/useEventField reais. Não lê .env local,
não usa conta de cliente, não imprime tokens e não apaga registros. O SDK roda com
persistSession=false e métodos de storage que lançam erro. A falha de rede é
injetada no transporte do provider; a tentativa seguinte grava na API real.

Saídas de aceite, RLS e checks estão em `docs/evidencias/mct55/`.

## Riscos e reversão

O documento ainda é gravado inteiro por organização. Edições concorrentes são
recusadas, não mescladas; o usuário pode exportar o conteúdo não salvo para
conciliação. Prefs/rascunhos ficam no documento da organização: membros que hoje
podem consultar esse documento possuem acesso a ele. A separação por papel/evento
é o contrato de MCT-57/MCT-60, não uma permissão resolvida nesta issue.

Os arquivos de telas receberam apenas ligação de estado à persistência, além do
controle do campo de pagamento em edição. Eles podem conflitar com as issues de
telas do outro agente; não foi redesenhada nenhuma tela nem alterada sua regra
comercial, cálculo ou fluxo de cadastro.

Para reverter, reverter o commit da PR. Não há rollback de banco necessário;
os campos uiState continuarão preservados no JSONB, mesmo que a versão anterior
não os exiba. A versão anterior volta a ler o backup local; ela não deve ser usada
para decidir que dados mais novos do Supabase podem ser substituídos. Não executar
reset de banco ou remoção de dados como parte da reversão.
