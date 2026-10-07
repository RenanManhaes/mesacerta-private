import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import ts from 'typescript';

/** Transpila um arquivo do app para ESM puro, trocando imports por mocks locais. */
export async function transpile(input,output,replacements={}) {
  let source=await readFile(input,'utf8');
  for(const [from,to] of Object.entries(replacements))source=source.replaceAll(`'${from}'`,`'${to}'`);
  await writeFile(output,ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext}}).outputText);
}

/** Escreve em `directory` o ConfirmDialog real (sobre primitivos simples de AlertDialog) e teamRoles.
 * Imports: './confirm.mjs' (ConfirmDialog) e './roles.mjs' (teamRoles). */
export async function writeTeamSupport(directory) {
  await writeFile(join(directory,'alert.mjs'),`import React from 'react';
const Close=React.createContext(()=>{});
const Part=({children})=>React.createElement('div',null,children);
export const AlertDialog=({open,onOpenChange,children})=>open?React.createElement(Close.Provider,{value:()=>onOpenChange(false)},React.createElement('section',{role:'alertdialog'},children)):null;
export const AlertDialogContent=Part,AlertDialogHeader=Part,AlertDialogTitle=Part,AlertDialogDescription=Part,AlertDialogFooter=Part;
export const AlertDialogCancel=({children,...props})=>{const close=React.useContext(Close);return React.createElement('button',{...props,onClick:close},children);};
export const AlertDialogAction=({children,...props})=>React.createElement('button',props,children);`);
  await transpile('src/components/common/ConfirmDialog.jsx',join(directory,'confirm.mjs'),{'@/components/ui/alert-dialog':'./alert.mjs'});
  await writeFile(join(directory,'roles.mjs'),await readFile('src/lib/teamRoles.js','utf8'));
}
export const supportImports={'@/components/common/ConfirmDialog':'./confirm.mjs','@/lib/teamRoles':'./roles.mjs'};
