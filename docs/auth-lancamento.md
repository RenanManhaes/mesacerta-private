# Login no lançamento: checklist do dashboard do Supabase (MCT-67)

Para quem faz: o dono do projeto, no dashboard do Supabase hospedado. Nenhum
passo daqui é feito por código: o repositório só deixa o app pronto para a
confirmação de e-mail. Nada disto vale para o Supabase local (esse segue o
`supabase/config.toml`).

Fora de escopo deste documento: login com Google, restringir quem pode se
cadastrar (MCT-64) e contratar o provedor de SMTP.

## Por que a ordem importa

O SMTP embutido do Supabase serve só para teste: limite muito baixo de e-mails
por hora e só entrega para membros da equipe do projeto. Ligar "Confirm email"
com ele faz cadastros reais ficarem sem e-mail e sem conseguir entrar. E, sem a
URL de produção na lista de redirecionamento, o link do e-mail leva a página
errada e o convite se perde.

**Ordem: SMTP -> URLs -> senha vazada -> só então "Confirm email" -> teste.**

## Passo a passo

### 1. SMTP próprio (Authentication -> Emails -> SMTP Settings)

Decisão pendente com o dono: qual provedor (Resend, Postmark, SES, Brevo etc.).
Sem essa decisão, **não passe do passo 1**.

1. Escolha o provedor e verifique o domínio de envio (SPF, DKIM e, de
   preferência, DMARC no DNS).
2. Em *Enable Custom SMTP*: preencha remetente (ex.: `nao-responda@<domínio>`),
   nome do remetente (`Mesa Certa`), host, porta, usuário e senha.
3. Em *Authentication -> Rate Limits*, ajuste o limite de e-mails por hora para
   o volume esperado do lançamento.
4. Envie um e-mail de teste (recuperar senha para uma conta sua) e confirme
   que chega na caixa de entrada, não no spam.

### 2. URLs (Authentication -> URL Configuration)

1. **Site URL**: `https://<domínio>` (produção, sem barra no final).
2. **Redirect URLs**: adicione `https://<domínio>/**`.
   - O `/**` é obrigatório: o link de confirmação volta para
     `https://<domínio>/entrar?codigo=...&convite=...` (retorno do convite). Se
     a URL não casar com a lista, o Supabase cai no Site URL e o convite se
     perde.
   - Remova entradas de desenvolvimento que não devam existir em produção.
     Se usar previews do Vercel, adicione o padrão do preview só se for
     preciso testar o fluxo neles.

### 3. Senhas vazadas (Authentication -> Sign In / Providers -> Password / Attack Protection)

1. Ative *Prevent use of leaked passwords* (verifica contra a base do
   HaveIBeenPwned).
2. Se a opção aparecer bloqueada, ela depende do plano pago do Supabase; anote
   a decisão no Linear em vez de pular em silêncio.
3. Mantenha o mínimo de senha em 6 ou mais (o app já exige 6).

### 4. Ligar a confirmação (Authentication -> Sign In / Providers -> Email)

Só depois dos passos 1 a 3 estarem feitos e testados:

1. Em *Email*, ative **Confirm email**.
2. Em *Authentication -> Emails -> Templates -> Confirm signup*, mantenha o
   link `{{ .ConfirmationURL }}` (é ele que carrega o redirecionamento ao
   convite). Traduza o texto se quiser, mas não troque o link.

### 5. Teste de fumaça (use e-mails reais, em produção ou em um projeto de teste)

1. Abra um link de convite (`/entrar?codigo=...&convite=...`) deslogado, clique
   em *Criar conta* e cadastre-se.
2. Confira que a tela "Confirme seu e-mail" aparece e que o botão
   *Reenviar e-mail* fica travado por 60 s.
3. Abra o e-mail e clique no link: deve cair de volta em `/entrar?codigo=...`,
   já logado, com o código preenchido.
4. Tente entrar com outra conta ainda não confirmada: o login deve mostrar o
   aviso e o botão de reenvio.
5. Reenvie várias vezes seguidas: deve aparecer a mensagem de limite, não um
   erro técnico.

## O que muda para quem já tem conta

Quem se cadastrou com a confirmação desligada já está confirmado e não precisa
fazer nada. A mudança vale só para novos cadastros.

## Reverter

Desative *Confirm email* no mesmo painel. O código continua funcionando nos
dois modos: com confirmação desligada o `signUp` devolve sessão e o usuário
entra direto.

## Referência rápida

| Onde no dashboard | Valor |
|---|---|
| URL Configuration -> Site URL | `https://<domínio>` |
| URL Configuration -> Redirect URLs | `https://<domínio>/**` |
| Providers -> Email -> Confirm email | ligado (por último) |
| SMTP Settings | provedor próprio (decisão pendente) |
| Password / Attack Protection | leaked password protection ligada |
