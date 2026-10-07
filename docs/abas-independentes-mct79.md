# Abas com contas diferentes — MCT-79

**Objetivo.** Duas abas do mesmo navegador podem ficar em contas diferentes. Entrar ou sair em uma aba não muda a outra, e recarregar (F5) mantém a conta daquela aba. Nenhuma credencial vai para dados do evento.

## Por que acontecia

O Supabase Auth guardava uma única sessão em `localStorage` e avisava as outras abas por `BroadcastChannel` (nome = `storageKey`). Entrar com outra conta numa aba trocava a sessão guardada e avisava as demais.

## O que foi feito

Código: `src/lib/tabAuthStorage.js` (adaptador de armazenamento) e `src/api/supabaseClient.js` (opções `storage` e `storageKey`). Só opções públicas do `supabase-js` 2.117.

- **Uma sessão por conta** em `localStorage` (`<base>:u:<id da conta>`), cada uma com a própria cadeia de refresh token.
- **Cada aba fixa a sua conta** em `sessionStorage` (`<base>:tab`). `sessionStorage` é por aba e sobrevive ao F5.
- **Aba nova herda a última conta que entrou** (`<base>:last`). Abrir o site de novo, ou um link de e-mail/convite em outra aba, continua funcionando sem pedir login à toa. Um link com tokens (confirmação de e-mail, convite) vira a conta do link **somente naquela aba**.
- **Sair** (`LogoutButton` → `signOut({scope:'local'})` → `releaseTabSession`) remove só a conta da aba e deixa a aba sem conta. Ela não herda a conta de outra aba.
- **`storageKey` único por carregamento da página**: o canal de broadcast da SDK deixa de ser compartilhado e as abas não trocam mais avisos de login/logout. O adaptador converte esse nome para a chave estável, então nada gravado depende dele.
- **Migração**: a sessão no formato antigo (`sb-<projeto>-auth-token`) é movida para o formato novo na primeira leitura; ninguém é deslogado no deploy.
- Chaves que não são a sessão (ex.: verificador PKCE) continuam compartilhadas em `localStorage`, para o link do e-mail poder terminar em outra aba.

## Decisão: por que não só `sessionStorage`

A sugestão inicial era guardar a sessão inteira em `sessionStorage` e copiar a última sessão para abas novas. Isso foi descartado por dois motivos:

1. **Reuso de refresh token.** Copiar a sessão para outra aba duplica o refresh token. A primeira aba que renova invalida o token da outra; quando a segunda renova, o Supabase detecta reuso e **revoga a sessão inteira**, derrubando as duas abas. Com uma sessão por conta, abas na mesma conta compartilham a mesma cadeia de token.
2. **Fechar a aba não pode ser sair.** Só com `sessionStorage`, fechar o navegador e abrir o site de novo exigiria login. Com a "última conta" em `localStorage`, isso continua como antes.

## Comportamentos que valem saber

- Duas abas na **mesma conta** compartilham a sessão: sair numa delas encerra a conta nas duas (é a mesma sessão). Contas **diferentes** são totalmente independentes.
- Trocar de conta na mesma aba sem sair deixa a sessão anterior guardada no navegador até alguém sair dessa conta. O fluxo normal (Sair, depois entrar) remove a anterior.
- Se a sessão de uma aba expira, a aba mantém sua conta fixada; entrar de novo na mesma conta (em outra aba) devolve a sessão a ela, como o aviso de "sessão expirou" já orienta.
- `ResetPassword` continua usando `signOut()` global de propósito (troca de senha revoga todas as sessões da conta).
- O fluxo de login atual usa tokens no endereço (implícito); o código PKCE, se for ligado no futuro, continua compartilhado entre abas.

## Prova

- `node --test src/lib/tabAuthStorage.test.mjs` — regras do adaptador (isolamento, F5, renovação, sair, herança, migração).
- `NODE_PATH=/usr/local/lib/node_modules_global node scripts/test-mct79.mjs` — Chromium real contra o app (vite) e o Supabase local: aba A conta 1, aba B conta 2, F5, renovação de token, sair em B, aba nova, link com tokens e migração. A identidade de cada aba é conferida no servidor com o token da própria aba. O teste falha no cliente antigo (A passa a ser a conta 2 quando B entra).

## Reverter

Reverter o commit restaura `createClient` com o armazenamento padrão. Quem já usa a versão nova fica com chaves `sb-…:u:`/`:last`/`:tab` sem uso e é pedido login uma vez (a sessão no formato novo não é relida pelo cliente antigo).
