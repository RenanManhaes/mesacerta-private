import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
const result = spawnSync('npx --yes supabase status -o json', {shell: true, encoding: 'utf8'});
assert.equal(result.status, 0, 'Start local Supabase first');
const config = JSON.parse(result.stdout.slice(result.stdout.indexOf('{')));
assert.match(config.API_URL, /^http:\/\/(127\.0\.0\.1|localhost):/);
const options = {auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false}};
const admin = createClient(config.API_URL, config.SERVICE_ROLE_KEY, options);
export async function account(label, specifiedEmail) {
  const email = specifiedEmail || `${label}-${randomUUID()}@example.test`, password = randomUUID();
  let created = await admin.auth.admin.createUser({email, password, email_confirm: true});
  if (specifiedEmail && created.error?.code === 'email_exists') {
    assert.equal(specifiedEmail,'renannascimento0304@gmail.com');
    const existing = await admin.auth.admin.listUsers({page:1,perPage:1000}); assert.ifError(existing.error);
    const user = existing.data.users.find(user=>user.email===specifiedEmail); assert.ok(user);
    created = await admin.auth.admin.updateUserById(user.id,{password});
  }
  assert.ifError(created.error);
  const client = createClient(config.API_URL, config.ANON_KEY, options);
  const login = await client.auth.signInWithPassword({email, password});
  assert.ifError(login.error);
  const request = async (path, method='GET', body) => {
    const response = await fetch(`${config.API_URL}/rest/v1/${path}`, {method, headers: {apikey: config.ANON_KEY, Authorization: `Bearer ${login.data.session.access_token}`, 'Content-Type': 'application/json'}, ...(body === undefined ? {} : {body: JSON.stringify(body)})});
    const responseBody=await response.text();
    return {status: response.status, body: responseBody ? JSON.parse(responseBody) : null};
  };
  return {client, user: created.data.user, request};
}
export async function rpc(client, name, args) {const result = await client.rpc(name,args); assert.ifError(result.error); return result.data;}
export async function permitMultiple(person) {
  const result=await admin.from('user_event_permissions').update({multi_event:true}).eq('user_id',person.user.id).select('multi_event').single();
  assert.ifError(result.error);assert.equal(result.data.multi_event,true);
}
export {admin};
