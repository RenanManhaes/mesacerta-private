\set ON_ERROR_STOP off
insert into auth.users (id, email, aud, role, instance_id) values
 ('00000000-0000-0000-0000-0000000000a1','a@x.com','authenticated','authenticated','00000000-0000-0000-0000-000000000000'),
 ('00000000-0000-0000-0000-0000000000b2','b@x.com','authenticated','authenticated','00000000-0000-0000-0000-000000000000');
insert into public.organizations (id, nome) values ('11111111-1111-1111-1111-111111111111','Org A'),('22222222-2222-2222-2222-222222222222','Org B');
insert into public.memberships (organization_id, user_id, role) values
 ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-0000000000a1','owner'),
 ('22222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-0000000000b2','owner');
\echo '--- 1. organizacao nova nasce com 8 tipos'
select o.nome, count(t.*) as tipos from public.organizations o left join public.activity_types t on t.organization_id=o.id group by o.nome order by 1;
\echo '--- 2. membro da Org A so enxerga os tipos da Org A'
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000a1',false);
select count(*) as visiveis, count(distinct organization_id) as orgs from public.activity_types;
\echo '--- 3. criar tipo novo (ok)'
insert into public.activity_types (organization_id, name) values ('11111111-1111-1111-1111-111111111111','Workshop') returning name;
\echo '--- 4. duplicado sem diferenciar maiusculas (deve falhar)'
insert into public.activity_types (organization_id, name) values ('11111111-1111-1111-1111-111111111111','workshop');
\echo '--- 5. criar na Org B (deve falhar por RLS)'
insert into public.activity_types (organization_id, name) values ('22222222-2222-2222-2222-222222222222','Invasor');
\echo '--- 6. renomear e excluir na propria org'
update public.activity_types set name='Oficina' where name='Workshop' returning name;
delete from public.activity_types where name='Oficina' returning name;
\echo '--- 7. excluir tipo da Org B (0 linhas afetadas)'
delete from public.activity_types where organization_id='22222222-2222-2222-2222-222222222222' returning name;
\echo '--- 8. nome vazio / com espacos nas pontas (deve falhar)'
insert into public.activity_types (organization_id, name) values ('11111111-1111-1111-1111-111111111111','   ');
insert into public.activity_types (organization_id, name) values ('11111111-1111-1111-1111-111111111111',' Extra ');
reset role;
\echo '--- 9. anon nao le'
set role anon; select count(*) from public.activity_types; reset role;
\echo '--- 10. funcao de seed nao executavel por authenticated'
set role authenticated; select private.seed_activity_types('11111111-1111-1111-1111-111111111111'); reset role;
