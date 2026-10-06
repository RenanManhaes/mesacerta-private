import {useState} from 'react';
import SearchSuggestions,{normalizeSearch} from './SearchSuggestions';

let citiesRequest;
const loadCities=()=>{
  if(!citiesRequest) citiesRequest=fetch('/data/br-cities.json').then(response=>{
    if(!response.ok)throw new Error('Não foi possível carregar as cidades.');
    return response.json();
  }).catch(error=>{citiesRequest=null;throw error;});
  return citiesRequest;
};

export default function CityField({value,onChange}) {
  const [cities,setCities]=useState([]),[error,setError]=useState('');
  const term=normalizeSearch(value);
  const options=term.length<2?[]:cities.filter(city=>normalizeSearch(`${city.name}/${city.uf}`).includes(term)).slice(0,12).map(city=>({id:city.id,value:`${city.name}/${city.uf}`}));
  const load=()=>loadCities().then(data=>{setCities(data);setError('');}).catch(error=>setError(error.message));
  return <div>
    <SearchSuggestions label="Cidade / local" value={value} onChange={onChange} options={options} onFocus={load} placeholder="Digite a cidade, ex.: São Paulo" className="mt-1.5" />
    {error && <p role="status" className="mt-1 text-xs text-muted-foreground">{error} Você pode preencher o local manualmente.</p>}
  </div>;
}
