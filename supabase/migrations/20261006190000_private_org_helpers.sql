-- MCT-67: tira is_org_member/is_org_admin da API pública (RPC) sem quebrar RLS.
--
-- Problema: as duas funções moram em `public`, que o PostgREST expõe. Qualquer
-- usuário logado podia chamar `rpc('is_org_member', ...)` e sondar em quais
-- organizações um UUID é membro/admin. O advisor do Supabase acusa isso
-- (SECURITY DEFINER executável por `authenticated`).
--
-- Por que NÃO basta `revoke execute ... from authenticated`:
-- as policies de RLS (organizations, memberships, events, activity_types,
-- notification_reads, platform_workspaces etc.) chamam as funções diretamente,
-- e o Postgres avalia a policy com o papel de quem consulta (`authenticated`).
-- Sem EXECUTE para `authenticated`, toda leitura/escrita dessas tabelas passa a
-- falhar com "permission denied for function". Revogar quebraria o app inteiro.
--
-- Solução escolhida: mover as funções para o schema `private`, que não está em
-- `[api] schemas` (PostgREST não enxerga, logo não existe RPC).
--   * Policies guardam a função pelo OID, não pelo nome: `ALTER FUNCTION ... SET
--     SCHEMA` mantém todas as policies funcionando sem recriá-las.
--   * `authenticated` mantém EXECUTE (necessário à RLS) e já tem USAGE em
--     `private` (migration platform_workspace).
--   * Corpos de funções que chamam `public.is_org_*` por nome são reescritos
--     abaixo (event_create, private.platform_team, private.platform_add_member).
--     Um bloco final falha a migration se sobrar qualquer referência antiga.
-- `public.criar_organizacao` não é tocada: continua sendo o caminho de criação
-- de organização.

alter function public.is_org_member(uuid) set schema private;
alter function public.is_org_admin(uuid) set schema private;

revoke execute on function private.is_org_member(uuid) from public, anon;
revoke execute on function private.is_org_admin(uuid) from public, anon;
grant execute on function private.is_org_member(uuid) to authenticated, service_role;
grant execute on function private.is_org_admin(uuid) to authenticated, service_role;

do $$
declare
  fn record;
  def text;
begin
  -- Reescreve o corpo das funções que citam as helpers pelo nome antigo.
  -- CREATE OR REPLACE preserva dono, config (search_path) e GRANTs.
  for fn in
    select p.oid
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private')
      and p.prosrc ~ 'public\.is_org_(member|admin)'
  loop
    def := pg_get_functiondef(fn.oid);
    def := regexp_replace(def, 'public\.is_org_(member|admin)', 'private.is_org_\1', 'g');
    execute def;
  end loop;

  -- Trava de segurança: nada em public/private pode continuar apontando para o
  -- nome antigo (falharia só em runtime, longe daqui).
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private')
      and p.prosrc ~ 'public\.is_org_(member|admin)'
  ) then
    raise exception 'MCT-67: ainda há função referenciando public.is_org_*';
  end if;
end
$$;

comment on function private.is_org_member(uuid) is
  'Verdadeiro se o usuário autenticado (auth.uid()) é membro da organização. Usada em policies RLS. Fica em private: não é RPC (MCT-67).';
comment on function private.is_org_admin(uuid) is
  'Verdadeiro se o usuário autenticado é owner ou admin da organização. Usada em policies RLS. Fica em private: não é RPC (MCT-67).';
