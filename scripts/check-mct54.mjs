import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const directory = 'docs/evidencias/mct54';
mkdirSync(directory, {recursive: true});
for (const [name, command] of [
  ['acceptance', 'node scripts/test-mct54.mjs'],
  ['lint', 'npm run lint'],
  ['typecheck', 'npm run typecheck'],
  ['build', 'npm run build'],
  ['engine', 'node src/lib/networking/engine.test.mjs'],
]) {
  const result = spawnSync(command, {shell: true, encoding: 'utf8'});
  const output = `$ ${command}\n${result.stdout || ''}${result.stderr || ''}\nEXIT_CODE=${result.status}\n`;
  writeFileSync(`${directory}/${name}.txt`, output);
  console.log(`${command}: EXIT_CODE=${result.status}`);
  if (result.status !== 0) {
    console.error(output);
    process.exit(1);
  }
}
