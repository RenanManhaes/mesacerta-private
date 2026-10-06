# Fundador confirmado antes da integração

Confirmação do responsável: `renannascimento0304@gmail.com` é o único fundador
dos eventos reais existentes até 06/10/2026. A idade do proprietário de uma
organização deixa de ser critério de autoria no bootstrap.

`node scripts/test-legacy-founder.mjs` testa PostgreSQL num banco sintético
isolado criado dentro de `supabase_db_mesa-certa-qa`, sem reset ou exclusão.
O schema Auth mínimo é uma fixture para esse teste de migração, não uma prova
de login. As provas com tokens reais estão nos testes de API da corrente.

- [legacy.txt](legacy.txt): conta ausente/não confirmada/ambígua bloqueia;
  Renan recebe o legado mesmo sem membership organizacional; dono anterior
  vira diretor; correção compatível é idempotente; preserva documento editado,
  backup e fundador autenticado de eventos novos.
- [lint.txt](lint.txt), [typecheck.txt](typecheck.txt), [build.txt](build.txt),
  [engine.txt](engine.txt): quatro verificações obrigatórias, `EXIT_CODE=0`.
- [legacy-full.txt](legacy-full.txt): mesma correção após todas as migrações
  dependentes, incluindo os triggers de equipe e a regra comercial.
- [api.txt](api.txt): `node scripts/test-legacy-founder-api.mjs`, com Auth local
  real. Proprietário antigo recebe HTTP 403/42501 ao gerar convite; Renan recebe
  HTTP 200. Documentos atuais e backup continuam preservados.

Arquivos: bootstrap MCT-57, migração corretiva
`20261006180655_confirmed_legacy_founder.sql`, teste e evidências desta pasta.
O bootstrap corrigido atende bancos que ainda não migraram; a correção posterior
atende bancos que aplicaram a versão anterior. Nenhum banco remoto foi alterado.

Risco: a aplicação real deve confirmar que os IDs presentes no backup são o
legado confirmado, além da conta única verificada. IDs não presentes no backup
não são reinterpretados. A declaração do responsável não dispensa o inventário
de dados real antes da aplicação.

Reversão de código: reverter o commit da correção antes de aplicar SQL. Após
aplicação real, restauração de vínculos exige backup prévio e migração corretiva
revisada; não reatribuir papéis por nome nem apagar documentos. Os bancos
sintéticos são conservados para inspeção.
