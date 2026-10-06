// Lógica pura do reenvio do e-mail de confirmação. Fica separada do componente
// para ser testada com `node --test` sem DOM (ver emailResend.test.mjs).

// Tempo mínimo entre dois reenvios, em segundos. O servidor tem o próprio
// limite (max_frequency / rate limit de e-mails); este é só o freio do cliente.
export const RESEND_COOLDOWN_SECONDS = 60;

// Segundos que ainda faltam para liberar o reenvio. 0 = liberado.
export function remainingCooldown(lastSentAt, now = Date.now(), cooldown = RESEND_COOLDOWN_SECONDS) {
  if (!lastSentAt) return 0;
  const left = Math.ceil((lastSentAt + cooldown * 1000 - now) / 1000);
  return left > 0 ? left : 0;
}

// O Supabase responde 429 / over_email_send_rate_limit / "email rate limit
// exceeded" / "For security purposes, you can only request this after N seconds".
export function isRateLimitError(err) {
  if (!err) return false;
  const msg = String(err.message || '').toLowerCase();
  return (
    err.status === 429 ||
    err.code === 'over_email_send_rate_limit' ||
    err.code === 'over_request_rate_limit' ||
    msg.includes('rate limit') ||
    msg.includes('for security purposes')
  );
}

export function traduzErroReenvio(err) {
  if (isRateLimitError(err)) {
    return 'Muitos pedidos de e-mail em pouco tempo. Aguarde alguns minutos e tente de novo.';
  }
  return 'Não foi possível reenviar o e-mail agora. Tente novamente em instantes.';
}
