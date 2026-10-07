import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from '@/lib/app-params';
import { createTabAuthStorage, tabAuthStorageKey } from '@/lib/tabAuthStorage';

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error(
    'Supabase env vars ausentes: defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY (ver .env.example).'
  );
}

// MCT-79: cada aba mantém a própria conta (ver src/lib/tabAuthStorage.js).
// A chave-base é a mesma que a SDK usava por padrão, para migrar quem já está logado.
function defaultStorageKey() {
  try { return `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`; } catch { return 'sb-mesacerta-auth-token'; }
}
const baseKey = defaultStorageKey();
const instanceKey = tabAuthStorageKey(baseKey);

const tabStorage = createTabAuthStorage(baseKey, instanceKey);
// Chamado ao sair de propósito: a aba fica sem conta até um novo login.
export const releaseTabSession = () => tabStorage.release();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: tabStorage,
    storageKey: instanceKey,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
