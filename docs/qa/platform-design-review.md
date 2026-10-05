# Revisão da integração visual — 5 de outubro de 2026

Referência: `atualização da plataforma.zip` fornecido pelo usuário.

## Problemas corrigidos

- **P1 — Login com tema antigo:** o estilo era importado somente pelo layout interno. O tema verde e as fontes anteriores continuavam no ponto de entrada público. Tokens agora têm uma única origem em `src/index.css`; a integração visual carrega na aplicação inteira.
- **P1 — Animação ausente no login:** o canvas original com nove mesas, assentos em órbita elíptica e cores variáveis foi integrado com limpeza ao desmontar, ajuste de resolução e tamanho, pausa em aba oculta e preferência de movimento reduzido.
- **P1 — Estado do simulador na troca de evento:** a página podia montar antes de o contexto selecionar o evento da rota. O conteúdo agora aguarda a seleção correta e trata evento inexistente.
- **P2 — Estilos internos incompletos:** listas de participantes, financeiro, despesas e patrocinadores agora usam tabelas em painéis; fornecedores têm cards separados; configurações, receitas e networking usam painéis; abas financeiras e status adotam o novo modelo.
- **P2 — Animações internas incompletas:** entrada das páginas e cards, contadores, barras, progresso e indicador móvel do menu integrados sem alterar seletores financeiros ou motor de networking.
- **P2 — Portais fora do tema:** menu móvel, botões, campos e modais agora mantêm a identidade. Títulos e descrições acessíveis acrescentados ao menu e formulário de inclusão.
- **P2 — Abas cortadas em 320px:** abas e tabelas permitem rolagem dentro do componente, sem ampliar a página.
- **P2 — Concorrência na landing:** navegação rápida entre rodadas cancela contagens anteriores; rolagem por clique é cancelada ao interagir; cards da demonstração funcionam com teclado. Movimento reduzido desliga animações CSS, incluindo pulsos infinitos.

## Evidência de navegador

- Navegação nas 13 telas internas em desktop e celular de 390px; nova verificação das 13 telas em 320px após as correções finais, sem expansão horizontal da página.
- Login em desktop: botão computado `rgb(232, 102, 61)`, fonte Schibsted Grotesk, nove mesas animadas com mudança observada de posições/cores entre capturas.
- Login em 320px: sem expansão horizontal; painel decorativo oculto como no original.
- Menu móvel com título e descrição; indicador da navegação atualizado; diálogo de inclusão com campos arredondados e botões em formato de pílula.
- Abertura direta do simulador de Workshop Vendas B2B usa público 60; evento inexistente mostra a tela de retorno.
- Contadores com preferência de movimento reduzido controlada na fixture mostram os valores finais imediatamente; regra CSS revisada. Essa fixture não emulou a preferência do sistema operacional.
- Card da landing acionado por Enter abre Financeiro. R1 seguido rapidamente de R5 termina na rodada 5 com 525 encontros.
- Nenhum erro de execução observado no console das verificações internas.

## Limites e configuração

As telas internas foram verificadas em uma fixture local temporária com os componentes reais e os dados já existentes, removida antes do commit. Não houve bypass de autenticação publicado nem entrada com credenciais de usuário durante os testes.

A API pública de configurações do Supabase informa `external.google = false`. A opção Google aparece indisponível com orientação para entrada por e-mail; habilitar o provedor exige sua configuração própria. Não foi simulada uma autenticação Google funcional.

O repositório já possui operações demonstrativas como importação de participantes e armazenamento local de eventos. Esta integração visual não migra a persistência nem certifica essas operações como integração de produção. Autenticação por e-mail e regras do motor permanecem preservadas.
