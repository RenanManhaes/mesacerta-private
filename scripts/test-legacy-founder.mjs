import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync,readdirSync} from 'node:fs';
import {randomUUID} from 'node:crypto';

// Isolated database inside the explicitly local QA container. No reset, remote
// access or deletion. Auth is a minimal schema fixture here; API/JWT tests run
// separately against the local Supabase Auth service.
const container='supabase_db_mesa-certa-qa';
const database=`mct_legacy_${randomUUID().replaceAll('-','')}`;
function sql(source,expected=0){
 const r=spawnSync('docker',['exec','-i',container,'psql','-U','postgres','-d',database,'-X','-q','-t','-A','-1','-v','ON_ERROR_STOP=1'],{input:source,encoding:'utf8'});
 assert.equal(r.status,expected,r.stderr);
 return `${r.stdout}${r.stderr}`;
}
const created=spawnSync('docker',['exec',container,'createdb','-U','postgres',database],{encoding:'utf8'});
assert.equal(created.status,0,created.stderr);
sql(`create schema auth; create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`);
const bootstrap='20261006145217_event_access_invites.sql';
for(const file of readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')&&f<bootstrap).sort())sql(readFileSync(`supabase/migrations/${file}`,'utf8'));
const org=randomUUID(),oldOwner=randomUUID(),renan=randomUUID(),legacy=randomUUID(),fresh=randomUUID();
sql(`insert into auth.users(id,email,email_confirmed_at) values('${oldOwner}','old-owner@example.test',now());
 insert into public.organizations(id,nome) values('${org}','Synthetic legacy');
 insert into public.memberships(organization_id,user_id,role) values('${org}','${oldOwner}','owner');
 insert into public.platform_workspaces(organization_id,events) values('${org}','[{"id":"${legacy}","name":"Original document"}]');`);
const source=readFileSync(`supabase/migrations/${bootstrap}`,'utf8');
assert.match(sql(source,3),/conta/);
assert.equal(sql(`select to_regclass('public.platform_events') is null;`).trim(),'t');
console.log('MISSING ACCOUNT PASS: bootstrap fails atomically with legacy data and no verified Renan; no partial platform_events table.');
sql(`insert into auth.users(id,email) values('${renan}','renannascimento0304@gmail.com');`);
assert.match(sql(source,3),/conta/);
console.log('UNVERIFIED ACCOUNT PASS: bootstrap refuses an unverified founder account.');
sql(`update auth.users set email_confirmed_at=now() where id='${renan}';`);
sql(source);
assert.equal(sql(`select founder_id from public.platform_events where id='${legacy}';`).trim(),renan);
assert.equal(sql(`select role from public.event_members where event_id='${legacy}' and user_id='${renan}';`).trim(),'founder');
assert.equal(sql(`select role from public.event_members where event_id='${legacy}' and user_id='${oldOwner}';`).trim(),'director');
console.log('BOOTSTRAP PASS: confirmed Renan is founder even without org membership; oldest owner becomes director; original document retained.');
sql(`select set_config('request.jwt.claim.sub','${oldOwner}',true);
 select public.event_create('${org}','{"id":"${fresh}","name":"New event"}');
 update public.platform_events set founder_id='${oldOwner}',document=document||'{"name":"Edited after bootstrap"}' where id='${legacy}';
 update public.event_members set role=case when user_id='${oldOwner}' then 'founder' else 'staff' end where event_id='${legacy}';`);
const correction=readFileSync('supabase/migrations/20261006180655_confirmed_legacy_founder.sql','utf8');
assert.match(sql(`insert into auth.users(id,email) values('${randomUUID()}','RENANNASCIMENTO0304@gmail.com');\n${correction}`,3),/conta/);
console.log('AMBIGUOUS ACCOUNT PASS: compatibility refuses duplicate normalized identities, including an unverified duplicate; transaction rolls back.');
sql(correction); sql(correction);
assert.equal(sql(`select founder_id from public.platform_events where id='${legacy}';`).trim(),renan);
assert.equal(sql(`select document->>'name' from public.platform_events where id='${legacy}';`).trim(),'Edited after bootstrap');
assert.equal(sql(`select role from public.event_members where event_id='${legacy}' and user_id='${oldOwner}';`).trim(),'director');
assert.equal(sql(`select role from public.event_members where event_id='${legacy}' and user_id='${renan}';`).trim(),'founder');
assert.equal(sql(`select founder_id from public.platform_events where id='${fresh}';`).trim(),oldOwner);
assert.equal(sql(`select events->0->>'name' from public.platform_workspaces where organization_id='${org}';`).trim(),'Original document');
console.log('COMPATIBILITY PASS: old fallback corrected idempotently, current edits and legacy backup retained; new authenticated creator unchanged.');
console.log(`Local synthetic database retained: ${database}. No remote access or deletion.`);
