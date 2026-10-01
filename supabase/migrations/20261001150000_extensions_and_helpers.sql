-- Mesa Certa — 0001: extensões e funções auxiliares
--
-- Decisões registradas aqui (valem para todas as migrations seguintes):
--
-- 1. Chaves primárias: uuid, geradas com gen_random_uuid() (pgcrypto/pgcrypto
--    já vem habilitado no Supabase via extensão "pgcrypto" ou nativamente em
--    PG13+ com gen_random_uuid() do core). Habilitamos pgcrypto por segurança.
--
-- 2. Dinheiro: numeric(14,2), nunca float/double precision. Representa reais
--    com 2 casas decimais (não centavos em integer). Motivo: o PRD tem
--    despesas percentuais (§14, ex. "4% da receita") e valor_unitário ×
--    quantidade — contas fracionárias que, em cents-as-integer, forçariam
--    conversão cents↔reais espalhada pela aplicação. numeric é exato (sem
--    erro de ponto flutuante binário) nas duas representações; escolhemos a
--    que exige menos tradução na camada de UI, que já pensa em reais.
--    Percentuais ficam em numeric(5,2) (pontos percentuais, ex. 4.00 = 4%).
--
-- 3. Tenancy: toda tabela de domínio carrega organization_id (uuid, FK para
--    organizations), além de event_id quando pertence a um evento. O
--    organization_id é denormalizado (não exige join até events para a RLS
--    filtrar) e mantido consistente por trigger (ver set_organization_id()
--    abaixo), nunca escrito livremente pelo cliente.
--
-- 4. "Enum" de domínio: implementado como CHECK constraint sobre text, não
--    como CREATE TYPE ... AS ENUM. ALTER TYPE ADD VALUE tem restrições
--    transacionais incômodas; CHECK é trivial de alterar em migration nova.

create extension if not exists pgcrypto;

-- updated_at automático
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- is_org_member() é criada na migration 0002, depois que a tabela
-- memberships existir (funções SQL validam os objetos referenciados na
-- criação).
