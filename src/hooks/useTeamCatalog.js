import {useEffect,useState,useCallback} from 'react';
import {supabase} from '@/api/supabaseClient';
export function useTeamCatalog(orgId) {
  const [items,setItems]=useState([]),[error,setError]=useState('');
  const reload=useCallback(async()=>{
    const {data,error}=await supabase.rpc('team_catalog_list',{p_org:orgId});
    if(error)throw new Error(error.message);
    setItems(data);setError('');return data;
  },[orgId]);
  useEffect(()=>{let active=true;supabase.rpc('team_catalog_list',{p_org:orgId}).then(({data,error})=>{if(active){setItems(data || []);setError(error?.message || '');}});return()=>{active=false;};},[orgId]);
  const create=async(kind,name)=>{
    const {data,error}=await supabase.rpc('team_catalog_create',{p_org:orgId,p_kind:kind,p_name:name});
    if(error)throw new Error(error.message);
    await reload();return data;
  };
  const remove=async(id,count)=>{
    const {error}=await supabase.rpc('team_catalog_remove',{p_catalog:id,p_confirm_count:count});
    if(error)throw new Error(error.message);
    await reload();
  };
  return {items,error,reload,create,remove};
}
