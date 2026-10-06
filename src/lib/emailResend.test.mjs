import test from 'node:test';
import assert from 'node:assert/strict';
import { RESEND_COOLDOWN_SECONDS, remainingCooldown, isRateLimitError, traduzErroReenvio } from './emailResend.js';

test('sem envio anterior o reenvio está liberado', () => {
  assert.equal(remainingCooldown(null, 1_000_000), 0);
});

test('logo após o envio faltam 60 s', () => {
  assert.equal(remainingCooldown(1_000_000, 1_000_000), RESEND_COOLDOWN_SECONDS);
});

test('dentro da janela de 60 s o reenvio continua bloqueado', () => {
  assert.equal(remainingCooldown(1_000_000, 1_000_000 + 59_000), 1);
  assert.equal(remainingCooldown(1_000_000, 1_000_000 + 30_500), 30);
});

test('passados 60 s o reenvio é liberado', () => {
  assert.equal(remainingCooldown(1_000_000, 1_000_000 + 60_000), 0);
  assert.equal(remainingCooldown(1_000_000, 1_000_000 + 90_000), 0);
});

test('reconhece erros de limite de envio do Supabase', () => {
  assert.ok(isRateLimitError({ status: 429, message: 'x' }));
  assert.ok(isRateLimitError({ code: 'over_email_send_rate_limit', message: 'x' }));
  assert.ok(isRateLimitError({ message: 'email rate limit exceeded' }));
  assert.ok(isRateLimitError({ message: 'For security purposes, you can only request this after 45 seconds.' }));
  assert.ok(!isRateLimitError({ status: 500, message: 'boom' }));
  assert.ok(!isRateLimitError(null));
});

test('mensagem de limite é clara e a genérica não vaza texto técnico', () => {
  assert.match(traduzErroReenvio({ status: 429 }), /Aguarde alguns minutos/);
  assert.doesNotMatch(traduzErroReenvio({ message: 'boom internal' }), /boom/);
});
