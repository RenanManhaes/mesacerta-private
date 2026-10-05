import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { findType, normalizeTypeName, sortTypes } from '@/lib/activityTypes';

// Tipos de atividade da organização (tabela public.activity_types, protegida por RLS).
// Valem para todos os eventos da organização.
export function useActivityTypes(orgId) {
  const qc = useQueryClient();
  const key = ['activity_types', orgId];
  const query = useQuery({
    queryKey: key,
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase.from('activity_types').select('id,name').eq('organization_id', orgId);
      if (error) throw error;
      return sortTypes(data || []);
    },
  });
  const types = query.data || [];
  /** @returns {{ id: string, name: string }[]} */
  const cached = () => /** @type {any} */ (qc.getQueryData(key)) || types;
  const put = (next) => qc.setQueryData(key, sortTypes(next));

  // Cria o tipo se ainda não existir (sem diferenciar maiúsculas/acentos). Devolve o tipo existente ou o novo.
  const create = async (rawName) => {
    const name = normalizeTypeName(rawName);
    if (!name) throw new Error('Informe o nome do tipo.');
    const current = cached();
    const existing = findType(current, name);
    if (existing) return existing;
    const { data, error } = await supabase.from('activity_types').insert({ organization_id: orgId, name }).select('id,name').single();
    if (error) {
      if (error.code === '23505') { // outra pessoa criou o mesmo nome ao mesmo tempo
        await qc.invalidateQueries({ queryKey: key });
        return findType(cached(), name) || { id: null, name };
      }
      throw error;
    }
    put([...current, data]);
    return data;
  };

  const rename = async (id, rawName) => {
    const name = normalizeTypeName(rawName);
    if (!name) throw new Error('Informe o nome do tipo.');
    const current = cached();
    const clash = findType(current, name);
    if (clash && clash.id !== id) throw new Error('Já existe um tipo com esse nome.');
    const { data, error } = await supabase.from('activity_types').update({ name }).eq('id', id).select('id,name').single();
    if (error) throw error.code === '23505' ? new Error('Já existe um tipo com esse nome.') : error;
    put(current.map((t) => (t.id === id ? data : t)));
    return data;
  };

  const remove = async (id) => {
    const { error } = await supabase.from('activity_types').delete().eq('id', id);
    if (error) throw error;
    put(cached().filter((t) => t.id !== id));
  };

  return { types, loading: query.isLoading, error: query.error, create, rename, remove };
}
