# Code review — landing-page-v1 — MCT-43

## Atualização final — corrigida, mesclada e publicada

Os achados abaixo são o histórico da revisão inicial. Foram corrigidos em 01/10/2026; lint, typecheck (zero erros), testes e build passaram. PR #1 mesclado em main: `ae132d1c5004c5b270cf173bf8926aa0e839879a`.

Site: https://mesacerta-brasil.vercel.app . Deployment READY: `dpl_CWEXLAQipQ3X5Nct1KHfvTKtN24v`, build do commit `81e3c2bd3b4478265e9c156b6619499c4ac05032`. Vitrine e login verificados em produção; site legado preservado. Tipagem herdada resolvida na MCT-44. Ressalva: CodeRabbit indisponível; revisão manual e equivalência de runtime documentadas no PR/Linear.

PR: https://github.com/RenanManhaes/mesacerta-private/pull/1 . Relatório versionado: `docs/entrega-landing-page-v1.md` na branch remota/main.

## Histórico da revisão inicial

Data: 01/10/2026. Pedido: página como vitrine pública, botão de login para clientes; abrir PR e fazer merge somente se aprovada.

## Contexto e parecer

**Reprovada para merge nesta revisão.** A intenção funcional básica foi atendida, mas a branch introduz três erros de tipagem e não passa a verificação obrigatória.

Repositório: `RenanManhaes/mesacerta-private`.
Base da plataforma: `main`, SHA `40b322438d033545fc52918651f29e11f259cd68`.
Branch revisada: `landing-page-v1`, SHA `66980cae6738aea90857b69b30205cd86891d5e9`.
GitHub informa `acervo-evento` como branch padrão; ela não é o destino adequado para esta alteração da plataforma.
Commits revisados: `2641f62`, `9a120ec`, `66980ca`.
Diff: somente `src/App.jsx` e `src/pages/LandingPage.jsx`, 677 inserções e quatro remoções.

Revisão aplicada com critérios do AIOX QA; verificação de elegibilidade de PR/merge com AIOX DevOps. Alterações locais de outros trabalhos preservadas. Código revisado em worktree separado, sem trocar a branch do diretório principal.

## Achados

### P1 — Três erros novos de tipagem na lista de alertas

Arquivo: `src/pages/LandingPage.jsx`, linhas 440, 442 e 443.

Os arrays de alerta misturam componentes Lucide e strings. A inferência de cada posição resulta em `string | ForwardRefExoticComponent<...>`. Isso torna `text` inválido como `key` e `level`/`text` inválidos como conteúdo React no typecheck.

Saída de `npm run typecheck` na branch:

```text
src/pages/LandingPage.jsx(440,26): error TS2322 ... is not assignable to type 'Key'.
src/pages/LandingPage.jsx(442,107): error TS2322 ... is not assignable to type 'ReactNode'.
src/pages/LandingPage.jsx(443,53): error TS2322 ... is not assignable to type 'ReactNode'.
TYPECHECK_EXIT=2
TOTAL_ERRORS=249
```

Comparação com `main` em outra worktree limpa:

```text
TYPECHECK_BASE_EXIT=2
BASE_ERRORS=246
```

Correção recomendada: representar alertas como objetos `{ icon, level, text }` ou tipar explicitamente as tuplas. Não esconder com `@ts-ignore` nem desligar a verificação. A diferença de três erros é da branch; os outros 246 já existem na base e não devem ser atribuídos à landing.

### P2 — Controles não comunicam estado expandido ou selecionado

Arquivo: `src/pages/LandingPage.jsx`, botão do menu perto da linha 320, capítulos perto da linha 479 e FAQ perto da linha 631.

O menu mantém o rótulo “Abrir menu” mesmo aberto e não informa `aria-expanded`/`aria-controls`. A FAQ não expõe seu estado expandido; capítulos e seleção do evento também não informam estado selecionado. Evidência do navegador: menu aberto, login móvel visível, `aria-expanded = null`.

Recomendação: rótulos Abrir/Fechar, atributos de expansão e associação ao conteúdo, estado selecionado para capítulos/seleção. A troca automática de evento a cada 5,2 segundos também precisa de controle de pausa e respeito à preferência por movimento reduzido; `useReducedMotion` está na landing, mas não no temporizador do preview.

### P2 — Texto de preços expõe linguagem interna e não oferece contato comercial

Arquivo: `src/pages/LandingPage.jsx`, seção de planos perto da linha 588.

“Ainda dependem da liberação operacional da venda” e “A landing não simula checkout” explicam implementação para o visitante. Os cartões de preço não têm ação de interesse/demonstração; as ações finais levam apenas ao login. Isso atende o acesso do cliente existente, mas limita a utilidade comercial da vitrine para quem ainda não é cliente.

Recomendação: comunicar claramente “Vendas ainda não abertas” e oferecer uma ação real de interesse/demonstração quando houver um canal definido. Não inventar checkout nem criar contato sem destino operacional. Esta é melhoria comercial; o login existente funciona.

## Verificações realizadas

| Verificação | Resultado |
|---|---|
| `git diff --check origin/main...HEAD` | Sem erros |
| `npm run lint` | Passou |
| `npm run build` | Passou, 2362 módulos; aviso de bundle grande |
| `npm run typecheck` | Falhou: 249 erros, três introduzidos pela landing |
| `node src/lib/networking/engine.test.mjs` | 9/9; motor não modificado |
| Página pública sem sessão | Renderiza título, seções, planos e navegação |
| Desktop 1440 × 1000 | Entrar visível no cabeçalho; sem overflow horizontal ou overlay Vite |
| Celular 375 × 812 | Menu abre; Entrar na plataforma visível; sem overflow horizontal observado |
| Link Entrar na plataforma | Navega para `/login`; formulário com e-mail e senha renderiza |
| Acesso anônimo a `/novo` | Redireciona para `/login` |
| Âncoras da página | Nenhuma âncora aponta para ID inexistente |

A página depende da configuração Supabase existente da aplicação. A primeira tentativa sem variáveis mostrou tela branca e erro `supabaseUrl is required`; isso foi uma falta de configuração do ambiente de revisão, não uma regressão comprovada da branch. Para a verificação anônima foram usadas apenas configurações locais fictícias (`https://review.invalid` e chave placeholder), sem credenciais reais e sem alteração dos arquivos da aplicação.

Não foi executado login com senha real nem validada a jornada autenticada contra um backend. Pela leitura do diff, `/` mostra `Events` quando há sessão e a landing quando não há; as demais rotas operacionais continuam sob `ProtectedRoute`.

CodeRabbit não pôde ser executado: WSL contém apenas `docker-desktop`, e `wsl bash -lc ...` retornou `/bin/sh: bash: not found`. Não há parecer automatizado de CodeRabbit nesta entrega.

## Observações herdadas da base

- `EventProvider` já usa localStorage e envolve as rotas públicas. No teste anônimo apareceu a chave `mesacerta_v1`; isso é comportamento herdado, não criado pela landing. Separar providers públicos e operacionais é assunto de integração com a equipe responsável, sem alterar auth/EventContext nesta revisão.
- `index.html` mantém `lang="en"`, favicon Base44 e não possui meta description. Para uma vitrine em português, convém ajustar idioma, identidade e descrição antes de divulgação. Esses elementos já existem na base.
- A rota pública aguarda `authChecked` porque continua dentro da aplicação autenticada. O site deve ser avaliado também com sessão expirada/rede lenta antes de campanha; este cenário não foi demonstrado nesta revisão.

## Decisão e próximos passos

Não houve criação de PR, push, merge ou deploy: a autorização de Renan foi condicionada a estar OK, e a branch não passou os gates. A skill AIOX DevOps exige typecheck aprovado antes de PR/push; além dos três erros novos, a base ainda possui 246 erros a resolver no fluxo apropriado.

Revisão entregue no Linear, MCT-43. A branch remota permanece intacta. Sem modificação de código de aplicação. Artefatos visuais estão na worktree `C:\Users\Renan\Downloads\TirdMind\Mesa Certa\review-landing-page-v1`: `landing-desktop.png` e `landing-mobile-menu.png`. Logs de tipagem: `typecheck-review.log` nessa worktree e `typecheck-baseline.log` na worktree `review-landing-baseline`.

Para repetir: usar os SHAs registrados, instalar/reutilizar dependências compatíveis, configurar as variáveis Supabase do ambiente apropriado e executar os comandos da tabela. Os artefatos desta revisão não foram commitados.
