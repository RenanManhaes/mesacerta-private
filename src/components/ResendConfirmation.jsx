import React, { useEffect, useRef, useState } from "react";
import { MailCheck, Loader2 } from "lucide-react";
import { supabase } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { remainingCooldown, traduzErroReenvio } from "@/lib/emailResend";

// Botão "Reenviar e-mail" compartilhado entre o cadastro (tela "Confirme seu
// e-mail") e o login (erro "Email not confirmed"). Reenvia o e-mail de
// confirmação com o mesmo emailRedirectTo e trava por 60 s no cliente.
//
// `startCooldown`: true quando o e-mail acabou de ser enviado (cadastro), para
// o cooldown já começar a contar na montagem.
export default function ResendConfirmation({ email, emailRedirectTo, startCooldown = false }) {
  const lastSentAt = useRef(startCooldown ? Date.now() : 0);
  const [left, setLeft] = useState(() => remainingCooldown(lastSentAt.current));
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null); // { kind: "ok" | "erro", text }
  const counting = left > 0;

  useEffect(() => {
    if (!counting) return undefined;
    const id = setInterval(() => setLeft(remainingCooldown(lastSentAt.current)), 1000);
    return () => clearInterval(id);
  }, [counting]);

  const resend = async () => {
    // Guarda também no clique: não depende só do botão estar desabilitado.
    if (sending || remainingCooldown(lastSentAt.current) > 0 || !email) return;
    setSending(true);
    setFeedback(null);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo },
    });
    setSending(false);
    if (error) {
      setFeedback({ kind: "erro", text: traduzErroReenvio(error) });
      return;
    }
    lastSentAt.current = Date.now();
    setLeft(remainingCooldown(lastSentAt.current));
    setFeedback({ kind: "ok", text: `Enviamos um novo e-mail para ${email}.` });
  };

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" className="w-full" onClick={resend} disabled={sending || counting || !email}>
        {sending ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Reenviando...</>
        ) : counting ? (
          `Reenviar e-mail em ${left}s`
        ) : (
          <><MailCheck className="w-4 h-4 mr-2" aria-hidden="true" />Reenviar e-mail</>
        )}
      </Button>
      {feedback && (
        <p
          role={feedback.kind === "erro" ? "alert" : "status"}
          className={"text-sm text-center " + (feedback.kind === "erro" ? "text-destructive" : "text-foreground")}
        >
          {feedback.text}
        </p>
      )}
    </div>
  );
}
