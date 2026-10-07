import {useId,useRef,useState} from 'react';
import {Input} from '@/components/ui/input';

export const normalizeSearch = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').trim();

// One editable value, with optional suggestions. Unlisted text remains valid.
export default function SearchSuggestions({label,value,onChange,options,disabled=false,placeholder='',className='',onFocus=()=>{},onSelect=null}) {
  const id=useId(), box=useRef(null);
  const [open,setOpen]=useState(false),[active,setActive]=useState(-1);
  const select=option=>{(onSelect||(o=>onChange(o.value)))(option);setOpen(false);setActive(-1);};
  return <div ref={box} className={`relative ${className}`} onBlur={event=>{if(!box.current?.contains(event.relatedTarget))setOpen(false);}}>
    <Input aria-label={label} role="combobox" aria-autocomplete="list" aria-expanded={open && options.length>0} aria-controls={`${id}-list`} aria-activedescendant={open && active>=0 && options[active]?`${id}-${active}`:undefined}
      disabled={disabled} value={value || ''} placeholder={placeholder}
      onFocus={()=>{setOpen(true);onFocus?.();}} onChange={event=>{onChange(event.target.value);setActive(-1);setOpen(true);}}
      onKeyDown={event=>{
        if(event.key==='Escape'){setOpen(false);setActive(-1);return;}
        if((event.key==='ArrowDown' || event.key==='ArrowUp') && options.length){event.preventDefault();setOpen(true);setActive(index=>event.key==='ArrowDown'?(index+1)%options.length:(index<=0?options.length-1:index-1));}
        if(event.key==='Enter' && open && active>=0 && options[active]){event.preventDefault();select(options[active]);}
      }}/>
    {open && options.length>0 && !disabled && <div id={`${id}-list`} role="listbox" aria-label={`Sugestões de ${label}`} className="absolute z-50 mt-1 w-full max-h-56 overflow-auto rounded-xl border bg-white p-1 shadow-lg">
      {options.map((option,index)=><button key={option.id || option.value} id={`${id}-${index}`} type="button" role="option" aria-selected={active===index} tabIndex={-1}
        className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${active===index?'bg-accent':'hover:bg-accent'}`}
        onMouseDown={event=>event.preventDefault()} onClick={()=>select(option)}>{option.label || option.value}</button>)}
    </div>}
  </div>;
}
