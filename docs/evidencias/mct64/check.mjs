import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const directory='docs/evidencias/mct64';
mkdirSync(directory,{recursive:true});
const path='docs/spike-cadastro-mct64.md';
const document=readFileSync(path,'utf8');
const lines=document.split('\n');
const output=[];
for(const [criterion,phrases] of [
 ['CA1',['Código do evento','Compra aprovada','Liberação manual pelo fundador da plataforma','account_releases','expires_at','state','Pedido de acesso — recomendado']],
 ['CA2',['Recomendação explícita','Custo da recomendação','R$ 0 de contratação nesta spike','30–46 horas de desenvolvimento']],
]) {
 for(const phrase of phrases){const index=lines.findIndex(line=>line.includes(phrase));assert.ok(index>=0,phrase);output.push(`${criterion} ${path}:${index+1}: ${lines[index]}`);}
}
const estimates=[...document.matchAll(/\| [^\n]+ \| (\d+)–(\d+) horas \|/g)];
assert.equal(estimates.length,5);
const lower=estimates.reduce((sum,row)=>sum+Number(row[1]),0),upper=estimates.reduce((sum,row)=>sum+Number(row[2]),0);
assert.ok(document.includes(`${lower}–${upper} horas de desenvolvimento`));
output.push(`CA2 COST_CALCULATION: ${estimates.length} work items; sum(min)=${lower} hours; sum(max)=${upper} hours; documentary spike contracts R$0.`);
const sourceDiff=spawnSync('git',['diff','--name-only','origin/main','--','src','supabase','package.json','package-lock.json','vite.config.js','vercel.json','.github'],{encoding:'utf8'});
assert.equal(sourceDiff.status,0);assert.equal(sourceDiff.stdout.trim(),'');
output.push('CA3 $ git diff --name-only origin/main -- src supabase package.json package-lock.json vite.config.js vercel.json .github');
output.push('CA3 OUTPUT: <empty>; zero application/Auth/database/configuration/dependency changes. No production deployment or Auth configuration command executed.');
const register=spawnSync('git',['diff','--exit-code','origin/main','--','src/pages/Register.jsx','src/lib/AuthContext.jsx','src/api/supabaseClient.js'],{encoding:'utf8'});
assert.equal(register.status,0);output.push('CA3 $ git diff --exit-code origin/main -- src/pages/Register.jsx src/lib/AuthContext.jsx src/api/supabaseClient.js => EXIT_CODE=0');
writeFileSync(`${directory}/acceptance.txt`,`$ node ${directory}/check.mjs\n${output.join('\n')}\nEXIT_CODE=0\n`);
console.log(output.join('\n'));
for(const [name,command] of [['lint','npm run lint'],['typecheck','npm run typecheck'],['build','npm run build'],['engine','node src/lib/networking/engine.test.mjs']]) {
 const result=spawnSync(command,{shell:true,encoding:'utf8'});
 writeFileSync(`${directory}/${name}.txt`,`$ ${command}\n${result.stdout || ''}${result.stderr || ''}\nEXIT_CODE=${result.status}\n`);
 console.log(`${command}: EXIT_CODE=${result.status}`);
 if(result.status!==0)process.exit(1);
}
