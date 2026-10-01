# Auditoria técnica — lote 01

Data: 30/09/2026. Executor: Codex. Escopo autorizado: MCT-1 → MCT-19 → MCT-33 → MCT-32. Histórico, revisão e evidências também registrados nas quatro issues do Linear.

## Origem e execução

- Origem: `../Layout base44.zip`, SHA256 `ADE564796B266FEA6B8C8EC0260297204696CF18BA2DCCA62F0F701EF33FC246`. Versão declarada do aplicativo: `base44-app@0.0.0`; não há versão de release no ZIP.
- Node 24.19.0, npm 11.2.0, Windows/PowerShell. React instalado 18.3.1; Vite 8.3.1; SDK Base44 0.8.52; plugin Base44 1.0.44; jsPDF 4.2.1.
- Lockfile: `package-lock.json` produzido pelo npm. Instalação inicial concluída, com quatro vulnerabilidades reportadas (duas baixas e duas moderadas); não aplicado `audit fix --force`.
- Não há `.git` neste diretório do aplicativo. Não houve commit, push, deploy, modificação do legado, exclusão de dados ou contratação de serviço.
- Saídas literais anteriores às mudanças: [auditoria-baseline.md](auditoria-baseline.md). Saídas finais: [auditoria-gates-finais.md](auditoria-gates-finais.md). UI: [auditoria-browser.md](auditoria-browser.md). Dependências: [auditoria-dependencias.md](auditoria-dependencias.md). Arquivos: [auditoria-arquivos.md](auditoria-arquivos.md).

## Arquitetura atual

React/Vite inicia `App.jsx`. `AuthProvider` consulta configurações públicas e autenticação pelo SDK; `ProtectedRoute` controla as rotas. `EventProvider` fornece eventos aos módulos. Páginas financeiras, dashboard, capacidade e programação consomem funções de `src/lib/selectors.js`. Networking agora recebe as pessoas desse contexto, cria listas distintas de móveis e fixos e chama o motor fiel através de `components/networking/model.js`.

**Persistência confirmada:** `src/context/EventContext.jsx:19` lê `mesacerta_v1` do localStorage; linha 29 escreve todo o estado de eventos nele. Na ausência de dados, usa `demoData`. Não há chamada ao backend para CRUD dos eventos nesse contexto. Isso contradiz a regra de não manter dados reais exclusivamente no navegador. A correção é do marco de persistência, excluído deste lote. Não foi criado um novo caminho de persistência; a prévia da distribuição fica apenas em estado React e não é publicada/versionada.

**Acoplamento ao SDK:** `src/api/base44Client.js` instancia o cliente; `src/lib/app-params.js` lê variáveis Vite e token; `AuthContext.jsx` consulta public settings/User.me/logout; Login/Register/ForgotPassword/ResetPassword usam autenticação, OTP e recuperação; `PageNotFound.jsx` também consulta o usuário. `vite.config.js` usa plugin Base44 para HMR, navegação, analytics e edição visual. Componentes de imagem têm integração Base44. Os módulos operacionais usam EventContext, não entidades do SDK. A escolha Base44/Supabase permanece aberta; este lote não a resolve.

**JEV:** documentação principal e integração do piloto estudadas. O modelo é adequado para classificação/julgamento semântico tipado; cálculos, capacidade, conflito e distribuição continuam no código. Nenhuma alteração no piloto ou chamada paga ao JEV. Não foram lidos segredos. Não se afirma ter validado o piloto em produção ou esgotado toda a documentação externa.

## Achados confirmados e não reproduzidos

| Achado | Classificação e evidência |
|---|---|
| Import do mock removido quebra build | Confirmado no build inicial; integração MCT-19 corrige a chamada. |
| 19 imports sem uso | Confirmado pelo lint inicial; removidos mecanicamente com eslint na faixa autorizada. |
| Typecheck da base falha | Confirmado. Props de forwardRef inferidas como `{}`, opcionais obrigatórios, ImportMeta.env, Date e cabeçalhos OAuth. Mantido resultado literal, sem desabilitar checagem. |
| Integração expõe erros de tipo no motor | Seis diagnósticos adicionais ao tornar engine.js alcançável pelo tsc. Código/hash do motor inalterado; não é regressão do algoritmo. Não corrigido pois o despacho proíbe editar esse arquivo. |
| Networking gera pessoas pelo total de contagens | Mock removido já não estava presente. Seu comportamento histórico consta na documentação, não é executável no estado inicial. Import quebrado confirmado; geração nominal agora usa exclusivamente pessoas cadastradas. |
| Dashboard declara ausência de conflitos sem análise | Confirmado em `selectors.js:150–151`, reproduzido pelo teste de navegador mesmo sem distribuição. Não corrigido aqui. |
| Custo percentual calcula sobre público | Confirmado: receita esperada 1000, público100 e despesa10% produzem10, não100; saída JSON no teste. |
| Quantidade zero vira uma unidade | Confirmado: despesa fixa qty0/unit25 produz25 em expenseTotal. |
| Capacidade não deriva de participantes | Confirmado: uma pessoa Confirmado com ev.confirmed0 continua reserva0. Política de contagem precisa ser definida no marco correspondente. |
| Programação encadeia horários | Confirmado: atividade às11:00 após primeira09:00/duração30 recebe computedStart09:30. A regra de preservação dos horários é trabalho próprio. |
| Motor fiel não tem testes | Não reproduzido: oráculo existente passa nove verificações, antes e depois. |
| SDK/backend operacional pronto | Não reproduzido: build emite falta de appId/baseUrl; frontend sem backend configurado retorna404 de public settings. UI testada com mock de autenticação, sem afirmar integração real. |

Saída do diagnóstico dinâmico em `browser.test.mjs`:

```text
MCT-1 achados reproduzidos: {"percentExpense":10,"zeroQuantity":25,"secondComputedStart":"09:30","reserved":0,"networkingAlert":"Nenhum conflito encontrado nas rodadas de negócio."}
```

## Revisão aplicada

Discussão registrada no Linear; revisão feita pelo executor, não apresentada como revisão humana independente.

| Problema discutido | Correção / decisão |
|---|---|
| Callback pendente poderia gerar prévia obsoleta | Timer cancelado ao trocar evento/pessoas/regras e ao desmontar; geração desabilita edição enquanto está pendente. |
| PDF dividia roteiro sem identificar continuação | Mantém blocos completos quando cabem; roteiro longo recebe cabeçalho de continuação. Testado com nomes/empresas extensos e 60 rodadas. |
| jsPDF no bundle inicial | Exportador importado sob demanda; bundle principal caiu de1093,36kB para693,44kB. Aviso >500kB permanece. |
| Cadastro sem identificador | Bloqueado antes de executar motor. |
| Diálogo mobile e identificação acessível | Largura calc corrigida e aria-label com nome da pessoa/mesa. |
| Ocupação somente fora do centro | Centro agora também mostra ocupação/capacidade. |
| Limites de cadeiras e estados | Testes nos extremos2/30 e nos estados anfitrião rotativo/Casa/retorno. |
| Capacidades individuais versus API global | Cadastro/desenho mantêm capacidade individual. Motor usa a menor capacidade global, com aviso explícito, bloqueio de insuficiência e validação final de cada mesa. Não otimiza lugares excedentes das mesas maiores; alterar esse contrato seria trabalho futuro, não mudança silenciosa no motor. |

## Limites, riscos e reversão

- Persistência/colaboração multiusuário/publicação/versionamento excluídos conforme as issues. Backend real e dados nominais do evento não foram testados. Fixtures usam nomes de teste e as contagens do cenário real76/14/14/7; as capturas não são a lista nominal original.
- typecheck continua falhando; todas as saídas estão documentadas. O aplicativo compila, mas isso não significa prontidão para produção. Quatro vulnerabilidades npm e bundle >500kB permanecem como dívida.
- Motor síncrono pode bloquear a UI em cenários grandes; não foi alterado nem convertido para worker neste lote. Os limites de entrada reduzem risco, não demonstram latência em todos os cenários.
- Diagrama suporta2..30 lugares. Nomes longos são truncados nas cadeiras e completos no tooltip/diálogo/PDF. Aprovação estética humana prevista no despacho permanece separada dos testes automáticos.
- Vite no Windows encerrou uma execução com EBUSY ao observar um arquivo de auditoria sendo escrito. Logs de navegador passaram a ser gravados fora do projeto; execução final usa CHOKIDAR_USEPOLLING=1. Sem alteração da configuração compartilhada.
- Reversão: restaurar apenas os arquivos listados em auditoria-arquivos.md a partir de `C:/Users/Renan/tmp/mesacerta-lote01/pages` e `components`. Remover exclusivamente os novos arquivos de `src/components/networking` se for desejado reverter o lote; não executar remoção recursiva genérica. Guardar os docs para rastreabilidade. Não apagar localStorage/dados nem arquivos de outro agente. A reversão de Networking retorna ao import quebrado anterior.
- engine.js SHA256 antes/depois: `761187E4044C44F78B6777E3940A82998AC21F1759705375A4953437859136A2`.

## Aceite por issue

### MCT-1

1. Build reproduzível: `npm ci` seguido de `npm run build`, resultados em gates finais.
2. Lint/typecheck registrados: baseline e gates finais contêm comandos, saída literal e exit code. Typecheck não aprovado.
3. Achados classificados: tabela acima; diagnóstico dinâmico tem saída literal no log do navegador.
4. Sem mudança funcional de produção: MCT-1 contém documentação/instalação/remoção de imports. Mudanças funcionais locais atribuídas a MCT-19/33/32. Não houve deploy.

### MCT-19

| Critério | Comando/evidência literal |
|---|---|
| 1 Lint/build e nenhuma referência ao módulo removido em código | `npm run lint`, `npm run build`, `rg -n 'lib/networking/distribution' src`: zero ocorrências; logs finais. Documentação histórica conserva a referência, não é import executável. |
| 2 UI idêntica76/14/14/7 | `node src/components/networking/browser.test.mjs`: `PASS MCT-19.2 / MCT-32.3 todas as 196 mesas/rodadas pela UI identicas ao motor`; teste model confirma SHA256 da grade `44e9ac203dc2912fde494a6fcffcbbe415a9b3727d8fdee2ba1fd9ee07df0fdd`. |
| 3 Rota14 distintas | Testes model/browser: `PASS MCT-19.3 / MCT-33.1 rota na UI 14 rodadas em ordem / 14 mesas distintas`. |
| 4 Nomes cadastrados | `PASS MCT-19.4 / MCT-32.6 cadeira exibe nome cadastrado e abre empresa/papel/mesa atual/proxima`; fixture não cria pessoas no código de produção. |
| 5 Motor9/9 | `node src/lib/networking/engine.test.mjs`, nove linhas ok e exit0; hash preservado. |

### MCT-33

| Critério | Comando/evidência literal de browser.test.mjs e PDF |
|---|---|
| 1 Rotas ordenadas | `PASS MCT-19.3 / MCT-33.1 rota na UI 14 rodadas em ordem / 14 mesas distintas`. |
| 2 Duplas ordenadas | `PASS MCT-33.2 pares na tela ordenados mesma-mesa primeiro`; model também verifica desempate por encontros. |
| 3 Aviso antes de gerar | `PASS MCT-33.3 aviso sem fixo antes de gerar`, nenhuma mesa gerada no momento da asserção. |
| 4 R>=T/T−1 | `PASS MCT-33.4 aviso R>=T inevitavel e T-1 visivel antes da geracao`. |
| 5 PDF todas pessoas/rodadas | Botão da UI baixa PDF; extração pypdf confirma76 pessoas/1064 entradas; fixos16 entradas; roteiro longo120 entradas. Saída no relatório PDF. |
| 6 Menos2 bloqueia | `PASS MCT-33.6 UI bloqueia menos de duas pessoas`; model testa exceção antes do motor. |

### MCT-32

| Critério | Comando/evidência literal de browser.test.mjs |
|---|---|
| 1 4/6 e vazios | `PASS MCT-32.1/.2 seis cadeiras / quatro ocupadas / duas vazias / fixo com simbolo e texto`. |
| 2 Fixo sem depender de cor | Mesma saída; bandeira/texto/borda dupla e pessoa real na cadeira. |
| 3 Rodada atualiza todas mesas | `PASS MCT-19.2 / MCT-32.3 todas as 196 mesas/rodadas pela UI identicas ao motor`. |
| 4 8/6 excede2 | `PASS MCT-32.4 componente real com8/cap6 indica excedente2 / seis cadeiras`. Caso renderizado no harness do componente real, pois produção bloqueia grade inválida. |
| 5 Mobile375 | `PASS MCT-32.5 viewport375 uma mesa espacial por linha / sem scroll horizontal`. |
| 6 Clique pessoa | `PASS MCT-19.4 / MCT-32.6 cadeira exibe nome cadastrado e abre empresa/papel/mesa atual/proxima`. |

PRD§51, todos os17 critérios: 1–2 cadastro/nome/capacidade via controles (`PASS PRD51.1/.2`); 3–4 mesas/perímetro e teste de geometria2/30; 5–6 contagens4/6; 7–8 fixo na cadeira e marca; 9 correspondência dos196 conjuntos; 10 rodada; 11 excedente; 12 clique cadeira; 13 centro (`PASS PRD51.13`); 14 desktop/tablet/mobile; 15 rotas; 16 conflitos; 17 motor/hash/oráculo. Não se afirma revisão estética independente nem publicação de dados reais.
