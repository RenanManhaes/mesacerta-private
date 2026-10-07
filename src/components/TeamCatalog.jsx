import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {AlertDialog,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel,AlertDialogAction} from '@/components/ui/alert-dialog';
import SearchSuggestions,{normalizeSearch} from '@/components/common/SearchSuggestions';
const labels={function:'Funções',area:'Áreas'};

export function CatalogField({label,kind,value,onChange,catalog,disabled=false}) {
  const [error,setError]=useState(''),[pending,setPending]=useState(false);
  const options=catalog.items.filter(item=>item.kind===kind);
  const term=normalizeSearch(value);
  const matches=options.filter(item=>normalizeSearch(item.name).includes(term)).slice(0,12).map(item=>({id:item.id,value:item.name}));
  const exists=options.some(item=>normalizeSearch(item.name)===term);
  const create=async()=>{
    setPending(true);setError('');
    try {await catalog.create(kind,value.trim());}catch(err){setError(err.message);}finally{setPending(false);}
  };
  return <div className="space-y-2">
    <p className="text-sm font-medium">{label}</p>
    <SearchSuggestions label={label} value={value} onChange={onChange} options={matches} disabled={disabled || pending} />
    {!disabled && term && !exists && <Button type="button" size="sm" variant="outline" disabled={pending} onClick={create}>{pending?'Salvando…':`Adicionar “${value.trim()}”`}</Button>}
    {(error || catalog.error) && <p role="alert" className="text-sm text-destructive">{error || catalog.error}</p>}
  </div>;
}

export function TeamCatalogManager({open,onOpenChange,catalog}) {
  const [filter,setFilter]=useState('all'),[kind,setKind]=useState('function'),[name,setName]=useState(''),[removal,setRemoval]=useState(null),[error,setError]=useState(''),[pending,setPending]=useState(false);
  const add=async event=>{event.preventDefault();setPending(true);setError('');try{await catalog.create(kind,name.trim());setName('');}catch(err){setError(err.message);}finally{setPending(false);}};
  const remove=async()=>{
    setPending(true);setError('');
    try {await catalog.remove(removal.id,removal.people_count);setRemoval(null);}catch(err){setError(err.message);try{const items=await catalog.reload();setRemoval(items.find(item=>item.id===removal.id) || null);}catch(err){setError(err.message);}}finally{setPending(false);}
  };
  const visible=catalog.items.filter(item=>item.kind!=='title' && (filter==='all' || item.kind===filter));
  return <>
    <Dialog open={open} onOpenChange={value=>{setFilter('all');onOpenChange(value);}}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Funções e áreas</DialogTitle><DialogDescription>Função é o que a pessoa faz. Área é o setor em que trabalha.</DialogDescription></DialogHeader>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-secondary p-3"><strong>Função</strong><p className="text-muted-foreground">Ex.: recepcionar convidados</p></div>
        <div className="rounded-xl bg-secondary p-3"><strong>Área</strong><p className="text-muted-foreground">Ex.: credenciamento</p></div>
      </div>
      <form onSubmit={add} className="space-y-3 rounded-xl border p-3">
        <label className="block text-sm">O que deseja adicionar?<select aria-label="Tipo do novo cadastro" value={kind} onChange={event=>setKind(event.target.value)} className="ml-2 rounded-lg border p-2"><option value="function">Função</option><option value="area">Área</option></select></label>
        <div className="flex gap-2"><input required maxLength={80} aria-label="Nome do novo cadastro" placeholder={kind==='function'?'Ex.: operar som':'Ex.: audiovisual'} value={name} onChange={event=>setName(event.target.value)} className="min-w-0 flex-1 border rounded-lg p-2" /><Button disabled={pending || !name.trim()} type="submit">Adicionar</Button></div>
      </form>
      <label className="text-sm">Mostrar <select aria-label="Filtrar catálogo" value={filter} onChange={event=>setFilter(event.target.value)} className="ml-2 rounded-lg border p-2"><option value="all">Tudo</option>{Object.entries(labels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
      <ul className="max-h-64 overflow-auto divide-y">{visible.map(item=><li key={item.id} className="flex justify-between items-center gap-4 py-3"><span><strong className="block text-sm font-medium">{item.name}</strong><small className="text-muted-foreground">{labels[item.kind]} · {item.people_count} pessoa{item.people_count!==1?'s':''}</small></span><Button type="button" size="sm" variant="outline" aria-label={`Excluir ${item.name}`} onClick={()=>{setError('');setRemoval(item);}}>Excluir</Button></li>)}</ul>
      {!visible.length && <p className="text-sm text-muted-foreground">Nenhum cadastro nesta categoria.</p>}
      {(error || catalog.error) && <p role="alert" className="text-sm text-destructive">{error || catalog.error}</p>}
    </DialogContent></Dialog>
    <AlertDialog open={!!removal} onOpenChange={value=>{if(!value && !pending)setRemoval(null);}}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir “{removal?.name}”?</AlertDialogTitle><AlertDialogDescription>{(()=>{const count=removal?.people_count || 0;return `O item deixa de ser sugerido. Os dados de ${count} pessoa${count!==1?'s':''} que ${count!==1?'usam':'usa'} este item continuam salvos.`;})()}</AlertDialogDescription></AlertDialogHeader>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <AlertDialogFooter><AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel><AlertDialogAction disabled={pending} onClick={event=>{event.preventDefault();remove();}}>{pending?'Excluindo…':'Excluir'}</AlertDialogAction></AlertDialogFooter>
    </AlertDialogContent></AlertDialog>
  </>;
}
