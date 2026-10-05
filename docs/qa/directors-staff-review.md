# Diretores e Staffs

A nova aba em Planejamento cadastra a equipe operacional de cada evento (`staffMembers`): nome, cargo Diretor/Staff, área, e-mail, telefone e situação ativa. Esse cadastro não cria contas nem concede permissões de acesso. Usa a persistência existente dos eventos por organização no Supabase, sem nova migration.

Tarefas selecionam o responsável cadastrado pelo identificador (`ownerId`) e preservam o nome (`owner`) para compatibilidade. Renomear uma pessoa atualiza o nome nas suas tarefas. Inativar impede novas atribuições, mantendo as existentes. Responsáveis anteriores em texto são preservados como cadastro anterior até escolher uma pessoa ou Sem responsável. Cada evento possui sua própria lista.

## Evidência de aceite

- Navegador, componentes reais em fixture temporária: cadastrar Ana Revisão como Diretor/Produção → atribuir Briefing de equipe → cartão da pessoa mostra uma tarefa pendente → renomear para Ana Silva → tarefa mantém vínculo e mostra novo nome → criar nova tarefa pelo menu Adicionar com Ana Silva selecionada. Fixture removida antes do commit.
- `node --test src/lib/staff.test.mjs`: duas verificações PASS de atribuição ativa, preservação das demais tarefas/eventos, atualização de nome por identidade, inativação e nomes legados.
- `npm test`: 17 testes/grupos PASS; lint, tipos e build exit 0.
- Não foi gravado cadastro de teste na conta real do usuário. A gravação autenticada utiliza o fluxo existente de eventos.

## Arquivos

Staff.jsx, TaskOwnerSelect.jsx, staff.js e staff.test.mjs; integração em App.jsx, Sidebar.jsx, TopBar.jsx, Tasks.jsx, AddMenu.jsx, demoData.js e package.json.

## Reversão

Reverter o commit desta funcionalidade e restaurar o deployment anterior. Os dados `staffMembers` e `ownerId` podem permanecer no documento do evento; o campo `owner` mantém os responsáveis legíveis na interface anterior. Não remover dados como parte da reversão.
