-- Mesa Certa — 0007: corrige escalação de privilégio em memberships_insert
--
-- VULNERABILIDADE (confirmada e reproduzida nesta sessão, ver prova em
-- docs/modelo-de-dados.md): memberships_insert permitia
--
--   with check ( is_org_admin(organization_id)
--                or not exists (select 1 from memberships m2
--                               where m2.organization_id = memberships.organization_id) )
--
-- A segunda cláusula era o "bootstrap" — deixar o primeiro usuário de uma
-- organização nova reivindicá-la como owner. O defeito: a subquery
-- `exists (select 1 from memberships m2 where ...)` roda sob a sessão do
-- chamador, logo está sujeita à RLS de SELECT de memberships
-- (`is_org_member(organization_id)`). Um atacante que não é membro de
-- organização nenhuma não VÊ nenhuma linha de memberships de organização
-- nenhuma — então `not exists` é sempre verdadeiro para qualquer
-- organization_id, inclusive organizações que já têm owner. Qualquer
-- usuário autenticado podia se inserir como owner de qualquer organização
-- alheia e, a partir daí, ler todo o dado dela (as outras 19 tabelas usam
-- is_org_member, que passa a enxergar a membership recém-criada).
--
-- Raiz do erro: usar como predicado de segurança uma subquery cujo
-- resultado depende da própria RLS do chamador. "Não existe membership
-- visível para mim" não é o mesmo fato que "não existe membership".
--
-- CORREÇÃO: elimina o bootstrap da policy. Criação de organização passa a
-- ser atômica dentro de uma função SECURITY DEFINER
-- (criar_organizacao), que insere organizations e memberships num único
-- statement (CTE), então nunca existe organização sem owner e a policy de
-- INSERT em memberships não precisa (e não pode) abrir exceção nenhuma.

-- 1) Função atômica de criação de organização.
create or replace function public.criar_organizacao(p_nome text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_org_id uuid;
begin
  if v_user_id is null then
    raise exception 'criar_organizacao requer um usuário autenticado (auth.uid() é nulo)';
  end if;

  -- Único statement: organização e membership de owner nascem juntas ou a
  -- transação inteira desfaz (erro de FK/constraint em qualquer um dos dois
  -- aborta os dois). Nunca existe uma organização sem membro.
  with nova_org as (
    insert into public.organizations (nome) values (p_nome)
    returning id
  ), nova_membership as (
    insert into public.memberships (organization_id, user_id, role)
    select nova_org.id, v_user_id, 'owner' from nova_org
    returning organization_id
  )
  select nova_org.id into v_org_id from nova_org;

  return v_org_id;
end;
$$;

comment on function public.criar_organizacao(text) is
  'Único caminho para criar uma organização: insere organizations + membership de owner (auth.uid()) atomicamente. SECURITY DEFINER para poder inserir em organizations, cujo INSERT direto é revogado de authenticated. Substitui o bootstrap que existia em memberships_insert (vulnerável — ver migration 0007).';

revoke all on function public.criar_organizacao(text) from public;
grant execute on function public.criar_organizacao(text) to authenticated;
revoke execute on function public.criar_organizacao(text) from anon;

-- 2) memberships_insert perde a cláusula de bootstrap. Só admin/owner da
--    organização insere membership — sem exceção, sem subquery de escape.
drop policy memberships_insert on public.memberships;

create policy memberships_insert on public.memberships
  for insert to authenticated
  with check (public.is_org_admin(organization_id));

-- 3) INSERT direto em organizations deixa de ser possível para
--    authenticated — o único caminho passa a ser criar_organizacao(), que
--    roda como o dono da função (bypassa RLS/GRANT de authenticated por
--    ser SECURITY DEFINER). A policy organizations_insert (with check true)
--    fica órfã/inofensiva: sem privilégio de INSERT na tabela, a policy
--    nunca chega a ser avaliada para authenticated.
revoke insert on public.organizations from authenticated;

comment on policy organizations_insert on public.organizations is
  'Órfã por design desde a migration 0007: INSERT em organizations foi revogado de authenticated (REVOKE INSERT), então esta policy nunca é avaliada para esse role — o único caminho de criação é a função criar_organizacao() (SECURITY DEFINER). Mantida (e não dropada) só para não deixar a tabela sem nenhuma policy de INSERT registrada caso um grant futuro reabra o caminho por engano — nesse caso, quem reabrir o GRANT também tem de revisar esta policy.';
