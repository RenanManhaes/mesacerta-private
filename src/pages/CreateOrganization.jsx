import React, { useState } from "react";
import { Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/components/AuthLayout";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";

// Shown when an authenticated user has zero rows in `memberships`. RLS scopes
// every domain table through is_org_member(organization_id), so a user with
// no membership legitimately sees nothing — this is not a bug, it's the
// isolation boundary (docs/modelo-de-dados.md). The only way to create the
// first organization + membership is the criar_organizacao() RPC: direct
// INSERT into organizations is revoked from `authenticated` on purpose (see
// "Vulnerabilidade crítica corrigida" in that doc) — do not try to work
// around it with a direct insert.
export default function CreateOrganization() {
  const { refreshMemberships, signOut } = useAuth();
  const [nome, setNome] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!nome.trim()) {
      setError("Informe o nome da organização");
      return;
    }
    setLoading(true);
    const { error: rpcError } = await supabase.rpc("criar_organizacao", { p_nome: nome.trim() });
    if (rpcError) {
      setLoading(false);
      setError(rpcError.message || "Não foi possível criar a organização");
      return;
    }
    await refreshMemberships();
    setLoading(false);
  };

  return (
    <AuthLayout
      icon={Building2}
      title="Crie sua organização"
      subtitle="Antes de continuar, dê um nome para o espaço onde seus eventos vão viver"
      footer={
        <button type="button" onClick={() => signOut()} className="text-primary font-medium hover:underline">
          Sair
        </button>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome da organização</Label>
          <Input
            id="nome"
            autoFocus
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Mesa Certa Eventos"
            className="h-12"
            required
          />
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Criando...
            </>
          ) : (
            "Criar organização"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
