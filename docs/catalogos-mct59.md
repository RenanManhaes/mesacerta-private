# Funções, áreas e cargos — MCT-59

O catálogo pertence à organização. Funções e áreas começam com Produção, Credenciamento, Audiovisual, Comercial, Recepção, Financeiro, Limpeza e Segurança. Cargos começam com Fundador, Coordenador e Assistente. Valores existentes em perfis autenticados também são conservados como sugestões; nenhuma pessoa é importada ou recebe acesso por esse processo.

Na edição da equipe, digitar três caracteres mostra sugestões correspondentes, ignorando caixa e acentos. Um novo valor exige confirmação de criação; o banco recusa novas funções/áreas/cargos no perfil sem essa etapa. O botão ao lado de “+ Nova pessoa” permite gerir os três catálogos. Todos os eventos da organização consultam o mesmo catálogo.

Excluir mostra quantas contas ativas usam o valor em qualquer evento da organização e pede confirmação. A mesma conta em dois eventos conta uma vez. A API exige a contagem atual confirmada, recusa uma confirmação desatualizada e serializa alterações relacionadas ao catálogo por organização. A remoção arquiva a sugestão, preservando os textos dos perfis e as linhas históricas. Contatos de perfis com um valor arquivado continuam editáveis; escolher esse valor de novo para outra pessoa exige criação/restauração explícita da sugestão.

Diretor/fundador gerem o catálogo. Staff não lê nem modifica a tabela pela API. Nenhum texto de função, área ou cargo altera o papel de acesso. O cargo Fundador do criador permanece derivado do papel real e não pode ser modificado pelo editor de perfil.

## Evidências

`node scripts/check-mct59.mjs` grava saídas em `docs/evidencias/mct59/`. `acceptance.txt` demonstra sugestões após três letras no componente real (CA1), confirmação e nova sugestão (CA2), leitura em uma nova instância para outro evento da mesma organização (CA3), aviso/confirmar exclusão com contagem real e conservação dos perfis (CA4). Também cria áreas/cargos no gestor real, persiste ambos e verifica que o papel staff permanece. A negação com JWT staff é HTTP 403/SQLSTATE 42501; leitura direta retorna zero linhas. Os testes da equipe, papéis, convite, persistência e sessão e os quatro comandos obrigatórios continuam passando.

## Limites e riscos

Permissões por função estão excluídas. A sugestão compartilhada é uma escolha administrativa para todos os eventos da organização; não é catálogo público entre organizações. A contagem não inclui cadastros manuais legados sem conta autenticada ou pessoas removidas; esses registros continuam conservados. A migração rejeita nomes existentes maiores que 80 caracteres: conferir e tratar explicitamente antes de aplicação em dados reais, sem truncar silenciosamente. Somente o banco local recebeu migração.

## Dependências, sobreposição e reversão

Incorpora MCT-57, MCT-60 e MCT-58, a partir de main, autorizado pelo usuário. A edição fica em EventTeam e não altera telas de tarefas, busca ou programação do outro agente. O hook novo usa Supabase diretamente, sem interferir no catálogo de tipos de programação da MCT-63.

Reverter a interface mantém os catálogos e perfis. Para permitir novamente texto livre, migrar a função validada para a versão anterior por migração compensatória, sem excluir tabela ou valores. Restaurar uma sugestão arquivada significa limpar `archived_at` após conferir organização e nome; não altera autorizações nem perfis. Manter as restrições de papéis da MCT-60.
