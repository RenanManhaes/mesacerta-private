import {useId,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Dialog,DialogContent,DialogHeader,DialogTitle} from '@/components/ui/dialog';
const normalize=value=>String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').trim();
const labels={function:'Funções',area:'Áreas',title:'Cargos'};
export function CatalogField({label,kind,value,onChange,catalog,disabled=false}) {
  const id=useId();
  const [confirm,setConfirm]=useState(false),[error,setError]=useState(''),[pending,setPending]=useState(false),[open,setOpen]=useState(false);
  const options=catalog.items.filter(item=>item.kind===kind);
  const term=normalize(value);
  const matches=term.length>=3?options.filter(item=>normalize(item.name).includes(term)):[];
  const exists=options.some(item=>normalize(item.name)===term);
  const create=async()=>{
    setPending(true);setError('');
    try {await catalog.create(kind,value.trim());setConfirm(false);setOpen(false);}catch(err){setError(err.message);}finally{setPending(false);}
  };
  return <div className="space-y-2">
    <label htmlFor={id}>{label}</label>
    <input id={id} aria-label={label} role="combobox" aria-autocomplete="list" aria-expanded={open && matches.length>0} aria-controls={`${id}-options`} value={value || ''} disabled={disabled} onFocus={()=>setOpen(true)} onChange={e=>{onChange(e.target.value);setOpen(true);setConfirm(false);}} className="w-full rounded-md border p-2 bg-card" />
    {open && matches.length>0 && <ul id={`${id}-options`} role="listbox" aria-label={`Sugestões de ${label}`}>{matches.map(item=><li key={item.id} role="option" aria-selected={normalize(item.name)===term}><button type="button" onClick={()=>{onChange(item.name);setOpen(false);}}>{item.name}</button></li>)}</ul>}
    {!disabled && term && !exists && <Button type="button" variant="outline" onClick={()=>setConfirm(true)}>Criar “{value.trim()}”</Button>}
    {confirm && <div role="alertdialog" aria-label={`Confirmar novo valor de ${label}`}><p>Criar “{value.trim()}” em {labels[kind]} para os eventos desta organização?</p><Button type="button" disabled={pending} onClick={create}>Confirmar criação</Button><Button type="button" variant="outline" onClick={()=>setConfirm(false)}>Cancelar criação</Button></div>}
    {(error || catalog.error) && <p role="alert">{error || catalog.error}</p>}
  </div>;
}

export function TeamCatalogManager({open,onOpenChange,catalog}) {
  const [kind,setKind]=useState('function'),[name,setName]=useState(''),[removal,setRemoval]=useState(null),[error,setError]=useState(''),[pending,setPending]=useState(false);
  const add=async e=>{e.preventDefault();setPending(true);setError('');try{await catalog.create(kind,name);setName('');}catch(err){setError(err.message);}finally{setPending(false);}};
  const remove=async()=>{
    setPending(true);setError('');
    try {await catalog.remove(removal.id,removal.people_count);setRemoval(null);}catch(err){setError(err.message);try{const items=await catalog.reload();setRemoval(items.find(item=>item.id===removal.id) || null);}catch(err){setError(err.message);}}finally{setPending(false);}
  };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Gerenciar funções, áreas e cargos</DialogTitle></DialogHeader>
    <label>Catálogo <select aria-label="Catálogo" value={kind} onChange={e=>{setKind(e.target.value);setRemoval(null);}}>{Object.entries(labels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
    <form onSubmit={add} className="flex gap-2"><input required maxLength={80} aria-label="Novo valor do catálogo" value={name} onChange={e=>setName(e.target.value)} className="border rounded p-2" /><Button disabled={pending} type="submit">Adicionar ao catálogo</Button></form>
    <ul className="max-h-64 overflow-auto">{catalog.items.filter(item=>item.kind===kind).map(item=><li key={item.id} className="flex justify-between items-center gap-4 py-2"><span>{item.name} — {item.people_count} pessoa{item.people_count!==1?'s':''}</span><Button type="button" variant="outline" onClick={()=>{setError('');setRemoval(item);}}>Excluir {item.name}</Button></li>)}</ul>
    {removal && <div role="alertdialog" aria-label="Confirmar exclusão do catálogo"><p>{removal.people_count} pessoa{removal.people_count!==1?'s':''} usa{removal.people_count!==1?'m':''} “{removal.name}”. Excluir das sugestões? Os dados das pessoas serão preservados.</p><Button disabled={pending} type="button" onClick={remove}>Confirmar exclusão</Button><Button type="button" variant="outline" onClick={()=>setRemoval(null)}>Cancelar exclusão</Button></div>}
    {(error || catalog.error) && <p role="alert">{error || catalog.error}</p>}
  </DialogContent></Dialog>;
}
