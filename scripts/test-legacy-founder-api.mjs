import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {account,admin,rpc} from './local-api.mjs';

const old=await account('legacy-api-old-owner');
const renan=await account('legacy-api-confirmed','renannascimento0304@gmail.com');
await rpc(old.client,'criar_organizacao',{p_nome:'Synthetic legacy API'});
const memberships=await old.client.from('memberships').select('organization_id').eq('user_id',old.user.id).single();
assert.ifError(memberships.error);
const org=memberships.data.organization_id,id=randomUUID();
const document={id,name:'Edited document retained',tasks:[],schedule:[],participants:[],modules:{}};
for(const [table,record] of [
 ['platform_workspaces',{organization_id:org,events:[{...document,name:'Legacy backup retained'}]}],
 ['platform_events',{id,organization_id:org,founder_id:old.user.id,document}],
 ['event_members',{event_id:id,user_id:old.user.id,role:'founder'}],
]){const r=await admin.from(table).insert(record);assert.ifError(r.error);}
const corrected=spawnSync('docker',['exec','-i','supabase_db_mesa-certa-qa','psql','-U','postgres','-d','postgres','-X','-q','-1','-v','ON_ERROR_STOP=1'],{input:readFileSync('supabase/migrations/20261006180655_confirmed_legacy_founder.sql','utf8'),encoding:'utf8'});
assert.equal(corrected.status,0,corrected.stderr);
let result=await old.request('rpc/event_invite','POST',{p_event:id,p_role:'director'});
assert.equal(result.status,403);assert.equal(result.body.code,'42501');
console.log(`OLD OWNER JWT DENIED: HTTP ${result.status}, SQLSTATE ${result.body.code}, message=${result.body.message}`);
result=await renan.request('rpc/event_invite','POST',{p_event:id,p_role:'staff'});
assert.equal(result.status,200);
console.log('CONFIRMED FOUNDER JWT ALLOWED: HTTP 200 for invite, without granting organization membership.');
const row=await admin.from('platform_events').select('founder_id,document').eq('id',id).single();
assert.ifError(row.error);assert.equal(row.data.founder_id,renan.user.id);assert.deepEqual(row.data.document,document);
const backup=await admin.from('platform_workspaces').select('events').eq('organization_id',org).single();
assert.ifError(backup.error);assert.equal(backup.data.events[0].name,'Legacy backup retained');
console.log('API MIGRATION PASS: confirmed founder, current document and legacy backup preserved.');
console.log('Local synthetic fixtures retained; no remote access or deletion.');
