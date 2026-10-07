-- Corrige a ordem entre MCT-67 e MCT-46.
--
-- A migration 20261006190000_private_org_helpers moveu is_org_member/is_org_admin
-- para o schema `private` e reescreveu as funções que as chamavam pelo nome.
-- A migration seguinte, 20261006210000_event_limit_three, recriou
-- public.event_create com o nome antigo `public.is_org_member`. Num banco
-- montado na ordem das migrations, criar evento falha com
-- "function public.is_org_member(uuid) does not exist".
--
-- Esta migration repete a reescrita da MCT-67 para qualquer função que ainda
-- cite o nome antigo. Se nada citar (banco já correto), não faz nada.
-- Não altera dados nem permissões.

do $$
declare
  fn record;
  def text;
begin
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

  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private')
      and p.prosrc ~ 'public\.is_org_(member|admin)'
  ) then
    raise exception 'Ainda há função referenciando public.is_org_*';
  end if;
end
$$;
