# Conferência das telas de referência — 05/10/2026

## Entrega

Fonte Schibsted Grotesk aplicada à landing, autenticação e plataforma. Refeitos dashboard, patrocínios, capacidade, networking, configurações, financeiro, receitas e despesas conforme a estrutura dos oito prints. Valores são calculados a partir do evento selecionado, não copiados dos exemplos.

- Dashboard: quatro indicadores, fluxo em oito semanas, alertas, meta, tarefas e organização.
- Patrocínios: cartões, meta e modal com contrato, recebimento, situação e datas; cotas preservadas.
- Capacidade: medidor semicircular, ambientes editáveis e ajustes gerais.
- Networking: planta pontilhada, mesas e assentos animados entre rodadas, seleção e roteiro de convidado; distribuição preservada ao retornar. Motor original sem alterações.
- Configurações: dados, módulos, equipe real da organização e arquivamento reversível.
- Financeiro: previsto/realizado, fluxo, composição e lançamentos.
- Receitas: lotes editáveis, ocupação e vendas por data registrada.
- Despesas: tabela, progresso de pagamento, edição e totais reconciliados com fornecedores.

## Correções encontradas na revisão

Valores animados limitados ao intervalo correto; campos de data preservados após edição; pagamentos parciais reconciliados sem duplicação; adicionar outra despesa ao fornecedor mantém pagamento legado. Alertas não afirmam ausência de conflitos antes de analisar a distribuição. Salvar configurações não substitui transações editadas em paralelo.

## Persistência

Aplicadas migrations 20261005171348 e 20261005172415 no projeto Mesa Certa. Eventos da interface são armazenados em `platform_workspaces.events` por organização, com RLS e revisão para impedir sobrescrita concorrente. Tabelas normalizadas existentes permanecem disponíveis; esta ponte de documentos não as preenche. Conta usa a primeira organização da associação existente, sem seletor de organização nesta entrega.

Dados antigos do navegador são recuperáveis pelo botão **Importar para esta organização**. O navegador conserva o backup original; alterações posteriores são gravadas no Supabase. Erros de salvamento são visíveis e permitem exportar alterações antes de recarregar. Logout tenta concluir o salvamento e exporta backup se ele falhar.

A equipe reflete permissões reais: dono, administrador e membro. Convidar adiciona uma conta já cadastrada com e-mail confirmado; não envia e-mail nem cria usuários ou permissões fictícias de leitura/editor.

## Evidências e limites

- Lint, verificação de tipos, build e suíte de regressão executados.
- Motor: nove verificações originais mantidas; testes de adaptação, cálculos e persistência de distribuição.
- Banco: transação de teste revertida comprovou revisão, bloqueio de escrita desatualizada, isolamento entre organizações, leitura da equipe, recusa de alteração por não administrador e privilégios mínimos.
- Navegador: componentes reais em fixture anônima temporária; geração de sete mesas/cinco rodadas, animação, roteiro, retorno à distribuição, modais de patrocínio/despesa, ambiente, venda datada, salvar configurações, arquivar/restaurar. Fixture excluída da entrega.
- Responsividade conferida em 390 × 844: sem transbordamento horizontal da página de networking; menu e logout disponíveis.
- Não foi feito teste autenticado completo de gravação/recarga na conta do usuário. Banco e interface foram verificados separadamente. Download CSV não teve confirmação de conclusão pelo navegador de testes.
- Gráficos usam datas registradas; pagamentos sem data e histórico de vendas ausente são informados. Nenhuma série de exemplo é apresentada como dado real.
- Build mantém avisos existentes sobre bundle grande e plugin Base44 legado; não bloquearam a geração.

## Reversão

Reverter o commit desta entrega pelo Git e restaurar o deployment anterior na Vercel. Manter `platform_workspaces` e backups para não perder eventos gravados; não remover tabela como parte da reversão visual. Exportar dados antes de qualquer migração futura.
