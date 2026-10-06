import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import React from 'react';
import {act,create} from 'react-test-renderer';
import {MemoryRouter,useLocation} from 'react-router-dom';
import ts from 'typescript';

const directory=await mkdtemp(resolve('node_modules/.join-review-'));
let tree,location;const calls=[];let fail=true;
globalThis.__joinReview={
 useAuth:()=>({isAuthenticated:true}),
 useEvent:()=>({flush:async()=>{calls.push('save');if(fail)throw Error('Synthetic unsaved network failure');},reloadEvents:()=>calls.push('reload')}),
 supabase:{rpc:async()=>{calls.push('join');return {data:{id:'invited',role:'staff'}};}},
};
try {
 await writeFile(join(directory,'mocks.mjs'),`import React from 'react';export const useAuth=()=>globalThis.__joinReview.useAuth();export const useEvent=()=>globalThis.__joinReview.useEvent();export const supabase=globalThis.__joinReview.supabase;export const Button=props=>React.createElement('button',props);export const Input=props=>React.createElement('input',props);`);
 await writeFile(join(directory,'access.mjs'),`export const eventHome=(id)=>'/event/'+id+'/tarefas';`);
 let source=await readFile('src/pages/JoinEvent.jsx','utf8');
 for(const module of ['@/lib/AuthContext','@/context/EventContext','@/api/supabaseClient','@/components/ui/button','@/components/ui/input'])source=source.replaceAll(`'${module}'`,"'./mocks.mjs'");
 source=source.replaceAll("'@/lib/eventAccess'","'./access.mjs'");
 await writeFile(join(directory,'join.mjs'),ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext}}).outputText);
 const {default:JoinEvent}=await import(pathToFileURL(join(directory,'join.mjs')));
 function Probe(){location=useLocation().pathname;return React.createElement(JoinEvent);}
 await act(async()=>{tree=create(React.createElement(MemoryRouter,{initialEntries:['/entrar?codigo=ABCD1234'],future:{v7_startTransition:true,v7_relativeSplatPath:true}},React.createElement(Probe)));});
 await act(async()=>{await tree.root.findByType('form').props.onSubmit({preventDefault(){}});});
 assert.deepEqual(calls,['save']);assert.equal(location,'/entrar');
 assert.match(tree.root.findByProps({role:'alert'}).children.join(''),/unsaved network failure/);
 console.log('REVIEW JoinEvent network failure: save rejects; zero join RPCs, zero reloads, route retained and visible error. Unsaved provider state is never reset.');
 calls.length=0;fail=false;
 await act(async()=>{await tree.root.findByType('form').props.onSubmit({preventDefault(){}});});
 assert.deepEqual(calls,['save','join','reload']);assert.ok(location.startsWith('/event/invited/'));
 console.log('REVIEW JoinEvent success: actual form awaits save before join RPC and reload, then navigates to invited event.');
}finally{
 if(tree)act(()=>tree.unmount());delete globalThis.__joinReview;
 await rm(directory,{recursive:true,force:true});
}
