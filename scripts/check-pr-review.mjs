import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const issue=process.argv[2];
if(!/^mct(57|60|58|59|46|64)$/.test(issue || ''))throw Error('Pass a reviewed issue: mct57, mct60, mct58, mct59, mct46 or mct64');
const directory=`docs/evidencias/revisao/${issue}`;
mkdirSync(directory,{recursive:true});
const commands=[['join-save','node scripts/test-join-save.mjs'],['lint','npm run lint'],['typecheck','npm run typecheck'],['build','npm run build'],['engine','node src/lib/networking/engine.test.mjs']];
if(issue==='mct64')commands.shift();
if(issue==='mct60')commands.unshift(['roles','node scripts/test-mct60.mjs']);
for(const [name,command] of commands){
 const result=spawnSync(command,{shell:true,encoding:'utf8'});
 const output=`$ ${command}\n${result.stdout || ''}${result.stderr || ''}\nEXIT_CODE=${result.status}\n`;
 writeFileSync(`${directory}/${name}.txt`,output);
 console.log(`${command}: EXIT_CODE=${result.status}`);
 if(result.status!==0){console.error(output);process.exit(1);}
}
