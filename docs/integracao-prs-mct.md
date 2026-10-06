# Preparação da integração das PRs #28–34

Autorização de merge recebida do responsável em 06/10/2026, após atualização do
PRD. Ordem: #28 → #29 → #30 → #31 → #32, seguida das documentais #33 e #34.
As PRs antigas #3 e #9 têm objetivos separados e sua inclusão foi consultada.

## Correção posterior à revisão

A confirmação de que Renan é o único fundador dos eventos reais existentes
substitui a inferência de proprietário mais antigo. O bootstrap MCT-57 agora
exige uma única conta verificada `renannascimento0304@gmail.com` e registra o
vínculo fundador mesmo sem membership organizacional. Uma migração posterior
corrige ambientes que já aplicaram o bootstrap anterior, somente para IDs
presentes no backup legado, preservando documentos e os criadores dos eventos
novos. Conta ausente, não confirmada ou identidade normalizada ambígua bloqueia
a migração. A correção foi incorporada a todas as branches dependentes.

Evidências em [fundador](evidencias/integracao/fundador/README.md): PostgreSQL
isolado, regressão com todas as migrações e API com tokens Auth reais locais.
`api.txt` comprova proprietário antigo HTTP 403/42501 e Renan HTTP 200 para
gerar convite. Não houve consulta ou mutação em dados de cliente.

## Verificação da corrente

`node scripts/check-mct46.mjs` encerrou todos os comandos com `EXIT_CODE=0`:
limite, catálogos, convites, equipe, papéis/API direta, interface, persistência,
foco, lint, typecheck, build e motor. Saídas em
[docs/evidencias/mct46](evidencias/mct46). `roles.txt` comprova staff negado com
HTTP 403 em alterações de campos protegidos e criação de tarefa; exclusão não
atinge a linha e leitura administrativa independente confirma conservação.

As branches anteriores também rodaram `node scripts/check-pr-review.mjs
mct57|mct60|mct58|mct59`, com quatro comandos obrigatórios e regressão de
salvamento antes da entrada. Execuções paralelas de build esgotaram memória
local; saídas de falha foram conservadas em `docs/evidencias/integracao/memoria`.
Repetições em sequência passaram. Não foi necessário alterar dependências,
configuração do build ou lógica do produto para resolver essa limitação local.

## Banco e publicação

O código versionado está preparado e testado localmente; a aplicação das
migrações no banco real é uma etapa distinta, coordenada com a aplicação.
Inventariar os IDs do backup e confirmar a conta/UUID real antes de aplicar.
Nenhuma migração remota, exclusão de dados ou contratação foi feita.

Foi confirmado por leitura da Vercel que o domínio `mesacerta-brasil.vercel.app`
está em produção no commit de main `a4c062b`. O contrato anterior proíbe deploy
de produção. A publicação automática precisa ser conciliada com a autorização
de merge antes de qualquer alteração em main; não considerar um merge prova
de banco atualizado ou operação completa do produto.

## Reversão

Antes de aplicar SQL real, reverter merges em ordem inversa, preservando o PRD
histórico e os backups. Depois de aplicar SQL, reversão de vínculo fundador
exige backup dos vínculos anterior à migração e uma correção revisada; não
inferir autoria pela idade da conta nem remover documentos. O motor permanece
inalterado.
