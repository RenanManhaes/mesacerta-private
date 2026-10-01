// Supabase client configuration, read from Vite env vars. See .env.example.
//
// VITE_SUPABASE_PUBLISHABLE_KEY is a publishable key by design: it ships in
// the client bundle and is safe to expose because every table is protected
// by Row Level Security (RLS) — see docs/modelo-de-dados.md. It is not a
// secret and does not need to be treated as one.
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const appParams = {
  supabaseUrl,
  supabaseAnonKey,
};
