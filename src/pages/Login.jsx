import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Loader2, ArrowRight } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { safeReturnTo } from "@/lib/authReturnTo";

function traduzErro(err) {
  const msg = err?.message || "";
  if (msg.includes("Invalid login credentials")) return "E-mail ou senha inválidos.";
  if (msg.includes("Email not confirmed")) {
    return "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.";
  }
  return msg || "Não foi possível entrar.";
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  // Post-login destination (e.g. a protected route sends users here with
  // returnTo so they land back where they tried to go). Same-origin only.
  const returnTo = safeReturnTo();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(traduzErro(signInError));
      return;
    }
    navigate(returnTo, { replace: true });
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="Bem-vindo de volta"
      subtitle="Entre para abrir seus eventos."
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link
            to={"/register" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")}
            className="text-primary font-medium hover:underline"
          >
            Criar conta
          </Link>
        </>
      }
    >
      <div className="platform-auth-google">
        <Button type="button" variant="outline" disabled title="Entrada com Google indisponível. Use seu e-mail." aria-describedby="google-unavailable"><GoogleIcon className="w-4 h-4" />Continuar com Google</Button>
        <p id="google-unavailable">Google indisponível. Entre com seu e-mail.</p>
      </div>
      <div className="platform-auth-divider">ou com e-mail</div>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="voce@empresa.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Esqueci a senha
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Entrando...
            </>
          ) : (
            <>Entrar <ArrowRight className="w-4 h-4" aria-hidden="true" /></>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
