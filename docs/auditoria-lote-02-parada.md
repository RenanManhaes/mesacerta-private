# Lote 02 — parada obrigatória antes da implementação

Data: 01/10/2026. Solicitação: executar MCT-34 → troca de auth → MCT-5 conforme docs/despachos/codex-lote-02.md.

## Condição de parada atingida

O despacho determina parar se algo exigir mudar engine.js ou as migrations. A policy memberships_insert da migration 20261001150100_core_tenancy.sql permite ingresso indevido em organização já ocupada. Corrigir o isolamento exige alteração da policy no banco; não há correção segura exclusivamente no frontend.

Não foi implementado o lote, nem declarados os critérios cumpridos. Nenhum arquivo de produção da aplicação, migration, engine, piloto ou banco remoto foi alterado.

## Evidência reproduzida

Postgres local em memória com PGlite, dependência instalada exclusivamente em C:/Users/Renan/tmp/mesacerta-lote02-audit. Foram carregadas as seis migrations locais. A única adaptação de ambiente foi omitir o carregamento de pgcrypto (gen_random_uuid disponível nativamente). auth.users e auth.uid foram simulados localmente; authenticated é NOSUPERUSER/NOBYPASSRLS. Dados fictícios em transação revertida ao final.

Esta é reprodução das migrations locais, NÃO prova executada contra o projeto remoto e NÃO substitui os testes de login/isolamento pela aplicação exigidos no despacho.

Comando:
```powershell
node C:/Users/Renan/tmp/mesacerta-lote02-audit/verify-membership-rls.mjs .
```

Saída literal, incluindo oráculo do motor e hash:
```text
APPLIED LOCAL 20261001150000_extensions_and_helpers.sql SHA256=9ac0bb4ad453d61cb646971663b684ee0c30d7a8ebdea957ac8a8111f8501bd4
APPLIED LOCAL 20261001150100_core_tenancy.sql SHA256=665412f168a63993df2b167258605a34876b1cdba1a19deadc56d2f445f8c310
APPLIED LOCAL 20261001150200_domain_entities.sql SHA256=ae58680d7390995e12e50d4d178565e90c04643c8d0960781c33606a6c97fca3
APPLIED LOCAL 20261001150300_networking.sql SHA256=d600d7eca4fd99836d4f1c8f7a348b6d0e9586b007d4238d04bebe732c79440d
APPLIED LOCAL 20261001150400_security_performance_hardening.sql SHA256=43b7de270e554fd2e878e9369971ae25345f267a67e126cd3817c18625a040fc
APPLIED LOCAL 20261001150500_organization_id_cascade.sql SHA256=60cd614a3fa5b5d44eccaf1fd351feec9e08651fdf2a9d35bdb6c8505a44719f
IDENTITY [{"current_user":"authenticated","uid":"20000000-0000-0000-0000-00000000000a","rolbypassrls":false,"rolsuper":false}]
BEFORE cross-tenant events visible=0
MEMBERSHIPS Org B visible to A=0 (actual owner B already exists)
CROSS-TENANT SELF-ENROLLMENT: ALLOWED
AFTER cross-tenant events [{"id":"30000000-0000-0000-0000-00000000000b","nome":"Evento privado B - local"}]
REPRODUCED: authenticated A can self-enroll as owner of B and read B event using unchanged local migration policies.
Local transaction rolled back; no remote Supabase access or mutation.
Cenario real: 76 convidados, 14 mesas, 14 rodadas, 7 por mesa

  ok   a grade tem uma linha por participante
  ok   cada linha tem uma mesa por rodada
  ok   todo participante visita as 14 mesas, sem repetir nenhuma
  ok   lotacao por mesa fica entre floor e ceil de P/T (5–6)
  ok   nenhuma mesa estoura a capacidade
  ok   ninguem reencontra a mesma pessoa na MESMA mesa
  ok   nenhuma dupla se encontra mais de 2 vezes
  ok   a mesma seed reproduz a mesma grade
  ok   reanalisar a grade da os mesmos numeros

  seed escolhida:            1
  tempo de geracao:          217ms
  duplas que se encontram:   2034 de 2850 possiveis (71.4%)
  encontram-se so uma vez:   1688
  reencontros:               346
  contatos por pessoa:       53.5

Motor portado preserva as garantias do cenario real.

Algorithm       Hash                                                                   Path                            
---------       ----                                                                   ----                            
SHA256          761187E4044C44F78B6777E3940A82998AC21F1759705375A4953437859136A2       C:\Users\Renan\Downloads\Tird...



```

## Causa

memberships_select permite visualizar apenas memberships de organizações das quais o usuário já participa. O ramo de bootstrap de memberships_insert faz NOT EXISTS (SELECT FROM memberships WHERE organization_id = alvo). Essa subquery é filtrada por RLS. Para um usuário externo, os membros existentes ficam invisíveis, NOT EXISTS retorna verdadeiro e permite inserir uma nova membership com role owner.

A policy também não vincula o bootstrap ao criador da organização nem exige user_id = auth.uid() nesse ramo. A prova SQL anterior documentada no modelo de dados verificou leituras de usuários já provisionados; não cobriu o ingresso indevido.

Referência primária sobre execução de expressões de policies com os privilégios do chamador:
https://www.postgresql.org/docs/17/ddl-rowsecurity.html
API do Postgres local:
https://pglite.dev/docs/api

## Encaminhamento técnico, não aplicado

O responsável pelas migrations precisa revisar o bootstrap e aplicar uma nova migration versionada. A decisão deve vincular criação da organização e primeira membership ao usuário autenticado, preferencialmente numa operação transacional autorizada, e retirar o ramo público de bootstrap que usa existência filtrada por RLS. Não basta usar SECURITY DEFINER para testar se a organização está vazia: uma organização vazia precisa continuar vinculada ao criador autorizado, evitando corrida/tomada indevida.

Revalidar pelo menos:
- A não consegue cadastrar a si mesmo ou terceiros na organização B.
- Member não promove a si mesmo para owner/admin.
- Owner/admin só administra membros da própria organização.
- Novo usuário consegue criar sua organização e se tornar owner sem janela de tomada por outro usuário.
- Criação com retorno do registro não esbarra na policy SELECT antes da primeira membership.
- Duas sessões reais da aplicação continuam isoladas.

## Acesso ao Supabase

Nenhuma ferramenta Supabase foi exposta nesta sessão. Descoberta de plugins encontrou Supabase disponível, mas não instalado/conectado. Não há variáveis .env* no projeto nem servidor Supabase no config.toml local do Codex. Não inventei URL/chave nem procurei credenciais em fontes privadas. Disponibilizada a opção de habilitar o conector para a retomada. A conexão é necessária para obter os parâmetros e demonstrar critérios 5–9 contra o projeto real.

## Estado dos critérios

1–3 (financeiro): não executados, parada detectada nas pré-condições.
4 (zero referências antigas): não implementado; estado original preservado.
5 (login real): não executado, conector não habilitado.
6 (onboarding de organização): não implementado; bootstrap inseguro precisa de correção.
7–8 (persistência de eventos): não implementados.
9 (isolamento pela aplicação): não demonstrado; achado bloqueante no banco local reproduzido.
10 (gates): oráculo do motor 9/9 e hash preservado; lint/build do lote02 não declarados, sem alterações da aplicação.

## Arquivos, riscos e reversão

Criado apenas este relatório no projeto. Reprodutor e dependência de auditoria ficam em C:/Users/Renan/tmp/mesacerta-lote02-audit, fora da aplicação. Nenhuma alteração de schema ou dado remoto, exclusão de dado, commit, push, deploy, serviço pago ou segundo projeto Supabase.

Risco identificado: ingresso indevido como owner e leitura/escrita entre tenants se as policies remotas forem as mesmas. Sem conexão não afirmo que foi explorado ou validado no projeto remoto.

Não há implementação a reverter. O banco local estava em memória, sua transação foi revertida e a conexão encerrada. O relatório e os artefatos podem ser mantidos como evidência.

## Reprodutor completo

Para repetir, instalar @electric-sql/pglite em diretório isolado e executar o script com o diretório do projeto como argumento. Não editar migrations para executar a prova.

```javascript
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const root = resolve(process.argv[2] || '.');
const pg = new PGlite();
try {
  await pg.exec(`
    create role authenticated nologin nobypassrls;
    create role anon nologin nobypassrls;
    create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema auth, public to authenticated;
    grant execute on function auth.uid() to authenticated;
  `);
  for (const file of readdirSync(resolve(root, 'supabase/migrations')).filter(f => f.endsWith('.sql')).sort()) {
    const original = readFileSync(resolve(root, 'supabase/migrations', file), 'utf8');
    // Embedded Postgres supplies gen_random_uuid natively; pgcrypto extension loading differs.
    const sql = original.replace('create extension if not exists pgcrypto;', '');
    await pg.exec(sql);
    console.log(`APPLIED LOCAL ${file} SHA256=${createHash('sha256').update(original).digest('hex')}`);
  }
  await pg.exec('grant select, insert, update, delete on all tables in schema public to authenticated;');
  await pg.exec(`
    begin;
    insert into auth.users(id) values ('20000000-0000-0000-0000-00000000000a'), ('20000000-0000-0000-0000-00000000000b');
    insert into public.organizations(id,nome) values ('10000000-0000-0000-0000-00000000000a','Org A - local'), ('10000000-0000-0000-0000-00000000000b','Org B - local');
    insert into public.memberships(organization_id,user_id,role) values
      ('10000000-0000-0000-0000-00000000000a','20000000-0000-0000-0000-00000000000a','owner'),
      ('10000000-0000-0000-0000-00000000000b','20000000-0000-0000-0000-00000000000b','owner');
    insert into public.events(id,organization_id,nome) values ('30000000-0000-0000-0000-00000000000b','10000000-0000-0000-0000-00000000000b','Evento privado B - local');
    set local role authenticated;
    set local request.jwt.claim.sub = '20000000-0000-0000-0000-00000000000a';
  `);
  const identity = await pg.query('select current_user, auth.uid() as uid, rolbypassrls, rolsuper from pg_roles where rolname=current_user');
  console.log('IDENTITY', JSON.stringify(identity.rows));
  assert.equal(identity.rows[0].rolbypassrls, false);
  assert.equal(identity.rows[0].rolsuper, false);
  const before = await pg.query("select id from public.events where organization_id='10000000-0000-0000-0000-00000000000b'");
  console.log(`BEFORE cross-tenant events visible=${before.rows.length}`);
  assert.equal(before.rows.length, 0);
  const hidden = await pg.query("select count(*)::int as count from public.memberships where organization_id='10000000-0000-0000-0000-00000000000b'");
  console.log(`MEMBERSHIPS Org B visible to A=${hidden.rows[0].count} (actual owner B already exists)`);
  try {
    await pg.exec("insert into public.memberships(organization_id,user_id,role) values ('10000000-0000-0000-0000-00000000000b','20000000-0000-0000-0000-00000000000a','owner')");
    console.log('CROSS-TENANT SELF-ENROLLMENT: ALLOWED');
  } catch (error) {
    console.log('CROSS-TENANT SELF-ENROLLMENT: DENIED', error.message);
    throw error;
  }
  const after = await pg.query("select id,nome from public.events where organization_id='10000000-0000-0000-0000-00000000000b'");
  console.log('AFTER cross-tenant events', JSON.stringify(after.rows));
  assert.equal(after.rows.length, 1);
  console.log('REPRODUCED: authenticated A can self-enroll as owner of B and read B event using unchanged local migration policies.');
  await pg.exec('rollback');
  console.log('Local transaction rolled back; no remote Supabase access or mutation.');
} finally { await pg.close(); }


```

