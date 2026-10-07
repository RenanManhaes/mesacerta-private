import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import React from 'react';
import {create,act} from 'react-test-renderer';
import ts from 'typescript';

// Exercise component interactions with synthetic catalog data. UI primitives
// are simple hosts here; browser geometry and real RPC persistence are separate gates.
const directory=await mkdtemp(resolve('node_modules/.october-ui-'));
let tree;
const render=async element=>{await act(async()=>{tree?.unmount();tree=create(element);});return tree.root;};
const input=()=>tree.root.findByType('input');
const button=text=>tree.root.findAllByType('button').find(node=>node.children.join('')===text);
try {
  await writeFile(join(directory,'mocks.mjs'),`import React from 'react';
export const Input=props=>React.createElement('input',props);
export const Button=({children,variant,size,...props})=>React.createElement('button',props,children);
export const Dialog=({open,children})=>open?React.createElement('section',null,children):null;
export const AlertDialog=({open,children})=>open?React.createElement('section',{role:'alertdialog'},children):null;
const Part=({children,...props})=>React.createElement('div',props,children);
export const DialogContent=Part,DialogHeader=Part,DialogTitle=Part,DialogDescription=Part,AlertDialogContent=Part,AlertDialogHeader=Part,AlertDialogTitle=Part,AlertDialogDescription=Part,AlertDialogFooter=Part;
export const AlertDialogCancel=Button,AlertDialogAction=Button;`);
  for(const [file,target] of [['src/components/common/SearchSuggestions.jsx','search.mjs'],['src/components/common/CityField.jsx','city.mjs'],['src/components/TeamCatalog.jsx','catalog.mjs']]) {
    let source=await readFile(file,'utf8');
    source=source.replaceAll("'@/components/ui/input'","'./mocks.mjs'").replaceAll("'@/components/ui/button'","'./mocks.mjs'").replaceAll("'@/components/ui/dialog'","'./mocks.mjs'").replaceAll("'@/components/ui/alert-dialog'","'./mocks.mjs'").replaceAll("'@/components/common/SearchSuggestions'","'./search.mjs'").replaceAll("'./SearchSuggestions'","'./search.mjs'");
    await writeFile(join(directory,target),ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext}}).outputText);
  }
  const {default:Search}=await import(pathToFileURL(join(directory,'search.mjs')));
  let selected='';
  await render(React.createElement(Search,{label:'Área',value:'',options:[{value:'Tecnologia'},{value:'Produção'}],onChange:value=>{selected=value;}}));
  await act(async()=>input().props.onFocus());
  assert.equal(tree.root.findAll(node=>node.props.role==='option').length,2);
  await act(async()=>input().props.onKeyDown({key:'ArrowUp',preventDefault(){}}));
  await act(async()=>input().props.onKeyDown({key:'Enter',preventDefault(){}}));
  assert.equal(selected,'Produção');
  assert.equal(input().props['aria-expanded'],false);
  console.log('PASS suggestions: focus, keyboard selection and closing');

  const {CatalogField,TeamCatalogManager}=await import(pathToFileURL(join(directory,'catalog.mjs')));
  let created=0;
  const catalog={items:[{id:'a',kind:'area',name:'Tecnologia',people_count:0},{id:'f',kind:'function',name:'Operar som',people_count:1},{id:'t',kind:'title',name:'Fundador',people_count:1}],error:'',create:async(kind,name)=>{assert.equal(kind,'area');assert.equal(name,'Design');created++;}};
  await render(React.createElement(CatalogField,{label:'Área',kind:'area',value:'Design',onChange(){},catalog}));
  await act(async()=>button('Adicionar “Design”').props.onClick());
  assert.equal(created,1);
  assert.equal(tree.root.findAll(node=>node.props.role==='alertdialog').length,0);
  console.log('PASS catalog: add custom area directly, no confirmation');
  await render(React.createElement(TeamCatalogManager,{open:true,onOpenChange(){},catalog}));
  assert.equal(tree.root.findByProps({'aria-label':'Filtrar catálogo'}).props.value,'all');
  assert.equal(tree.root.findAllByType('li').length,2);
  assert.equal(tree.root.findAllByType('button').filter(node=>node.children.join('')==='Excluir').length,2);
  await act(async()=>button('Excluir').props.onClick());
  assert.equal(tree.root.findAll(node=>node.props.role==='alertdialog').length,1);
  console.log('PASS catalog: all categories, no access roles, modal deletion');

  const municipalities=JSON.parse(await readFile('public/data/br-cities.json','utf8'));
  assert.ok(municipalities.length>=5570);
  assert.equal(new Set(municipalities.map(city=>city.uf)).size,27);
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async()=>({ok:true,json:async()=>municipalities});
  try {
    const {default:City}=await import(pathToFileURL(join(directory,'city.mjs')));
    function Harness(){const [value,setValue]=React.useState('Sao P');return React.createElement(City,{value,onChange:setValue});}
    await render(React.createElement(Harness));
    await act(async()=>input().props.onFocus());
    const sp=tree.root.findAll(node=>node.props.role==='option').find(node=>node.children.join('')==='São Paulo/SP');
    assert.ok(sp,'Sao P must suggest São Paulo/SP without accents');
    await act(async()=>sp.props.onClick());
    assert.equal(input().props.value,'São Paulo/SP');
    console.log('PASS cities: nationwide dataset, accent-insensitive lookup and selection');
  } finally {globalThis.fetch=originalFetch;}
} finally {await act(async()=>tree?.unmount());await rm(directory,{recursive:true,force:true});}
