import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2, MailCheck } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { safeReturnTo } from "@/lib/authReturnTo";
import ResendConfirmation from "@/components/ResendConfirmation";

function traduzErro(err) {
  const msg = err?.message || "";
  if (msg.includes("already registered") || msg.includes("already exists")) {
    return "Já existe uma conta com esse e-mail.";
  }
  if (msg.includes("Password should be")) return "A senha precisa ter pelo menos 6 caracteres.";
  return msg || "Não foi possível criar a conta.";
}

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const navigate = useNavigate();
  const returnTo = safeReturnTo();
  // Destino do link do e-mail de confirmação: quem veio de um convite
  // (/entrar?codigo=...&convite=...) volta para o convite, já logado.
  const emailRedirectTo = window.location.origin + returnTo;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }
    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres");
      return;
    }
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo },
    });
    setLoading(false);
    if (signUpError) {
      setError(traduzErro(signUpError));
      return;
    }
    if (data?.session) {
      // Email confirmation is off for this project: signUp already returns
      // an active session, so the user can go straight into the app.
      navigate(returnTo, { replace: true });
      return;
    }
    // Confirmation required: Supabase emailed a confirmation link.
    setRegistered(true);
  };

  if (registered) {
    return (
      <AuthLayout
        icon={MailCheck}
        title="Confirme seu e-mail"
        subtitle={`Enviamos um link de confirmação para ${email}`}
        footer={
          <Link to="/login" className="text-primary font-medium hover:underline">
            Voltar para o login
          </Link>
        }
      >
        <p className="text-sm text-foreground text-center">
          Abra o e-mail que enviamos e clique no link de confirmação. Depois
          disso, você volta para o Mesa Certa já conectado.
        </p>
        <div className="mt-4">
          <ResendConfirmation email={email} emailRedirectTo={emailRedirectTo} startCooldown />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title="Crie sua conta"
      subtitle="Leva menos de um minuto. Criar conta não inicia cobrança."
      visualTitle="Comece pelo próximo evento."
      visualDescription="Importe a lista de convidados e tenha as mesas montadas em minutos."
      footer={
        <>
          Já tem uma conta?{" "}
          <Link
            to={"/login" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")}
            className="text-primary font-medium hover:underline"
          >
            Entrar
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="voce@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmar senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Criando conta...
            </>
          ) : (
            "Criar conta"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
