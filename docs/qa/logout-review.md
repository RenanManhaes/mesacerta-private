# Logout visível — 5 de outubro de 2026

## Implementação e review

- Botão compartilhado `LogoutButton` na lista de eventos, criação de evento, organização, topo interno, menu lateral e landing quando há sessão.
- A ação aguarda `supabase.auth.signOut({ scope: 'local' })`. Erros não são ignorados e não apagam o estado de autenticação artificialmente.
- Enquanto a ação está pendente, o botão fica desativado e mostra “Saindo…”. Erro permite nova tentativa e informa o usuário.
- Sucesso substitui a página pela landing pública, descartando dados privados em memória. Não exclui eventos nem dados de negócio.
- A saída afeta a sessão atual; não desconecta outros dispositivos.

## Verificação

Foi usada uma fixture local temporária com `AuthProvider`, `EventProvider` e páginas reais. O adaptador do Supabase foi controlado somente nessa fixture, sem gravar tokens ou alterar contas. Arquivos removidos antes do commit.

- Clique em Sair na lista de eventos: botão pendente desativado; sucesso termina em `/`, com “Entrar” visível.
- Clique em Sair no topo interno: termina em `/`.
- Falha controlada: permanece na tela, mostra “Não foi possível sair / Tente novamente” e reabilita o botão.
- Em 320px, logout visível em `/eventos`, `/novo`, dashboard e landing autenticada, sem expansão horizontal do cabeçalho.
- Acesso a `/eventos` sem sessão redireciona a `/login`.

Não foi usada uma conta de usuário para testar revogação remota em produção. A verificação de UI não substitui essa verificação. O código usa o método oficial do Supabase e mantém a proteção de rotas.

## Reversão

Reverter o commit do PR restaura os cabeçalhos e a implementação anterior de logout. Nenhuma migração de banco foi criada.
