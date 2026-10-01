# Mesa Certa — Briefing de situação

**Data:** 01/10/2026
**Para:** Renan (decisor)

---

## Onde o projeto está, em uma frase

A plataforma compila e tem as telas esqueletadas, o motor de rodadas que rodou no
evento real foi portado e testado, e o Jev foi calibrado. **Não tem banco de
dados, não tem autenticação própria, não tem segurança, e nada está publicado.**

## O que foi feito

| | Estado | Evidência |
|---|---|---|
| Motor de rodadas portado do HTML legado | ✅ | `engine.test.mjs` 9/9, 76×14×14 em 213ms |
| Motor ligado à tela de Networking | ✅ | import quebrado corrigido, build passa |
| Auditoria da base técnica | ✅ | `docs/auditoria-baseline.md` |
| Jev calibrado em 7 campos | ✅ | marco 09 no Linear, custo < US$ 0,02 |
| Deduplicação de pessoas e empresas | ✅ | `src/lib/pessoas/`, testes passando |
| Backlog estruturado | ✅ | 33 issues, 9 marcos |
| **Banco de dados** | ❌ | nada. Modelo atual: `{ role: admin \| user }` |
| **Autenticação própria** | ❌ | existe o esqueleto do Base44, não o nosso |
| **Segurança / RLS** | ❌ | MCT-4, não começada |
| **Publicado na Vercel** | ❌ | build pronta, falta o deploy |
| **Identidade visual** | 🔄 | em execução |
| **Desenho espacial das mesas** (§29, obrigatório) | ❌ | MCT-32 |

## Erro de prioridade que eu cometi

Gastei cinco rodadas de agente e várias horas calibrando o Jev — probabilidade
de nome duplicado, inferência de segmento por empresa — enquanto a plataforma não
tinha decisão de backend, autenticação nem banco.

A calibragem produziu resultados reais e necessários, e custou menos de US$ 0,02
de API. Mas ela otimiza o **módulo opcional de Networking** num produto que ainda
não consegue guardar uma conta de usuário. A ordem estava errada.

Eu sabia que MCT-3 a MCT-12 estavam travadas numa decisão e fiquei registrando
"aguardando você" em vez de forçar a decisão com uma recomendação. Isso é meu
erro, não falta de informação.

**Corrigido:** a decisão de backend foi tomada hoje (Supabase) e a prioridade
passou para fundação.

## A decisão que destravou tudo

**Supabase**, tomada em 01/10/2026. Destrava dez issues.

O swap é menor do que parecia: o acoplamento ao Base44 está contido em **9
arquivos, todos de autenticação**. As telas de negócio não tocam o Base44. E não
existe modelo de dados para migrar — o único esquema declarado é
`{ role: admin | user }`, então o modelo do PRD §47 nasce do zero.

É o melhor momento possível para trocar: depois de qualquer dado real entrar,
não seria.

## O que o Jev de fato entregou

Sete campos medidos com gabarito. A conclusão que importa:

**O limiar de confiança não serve para tudo.** Três de seis campos não têm o
sinal que o desenho pressupunha — o modelo erra com confiança alta e nenhum
limiar separa acerto de erro.

| Serve para automatizar | Não serve |
|---|---|
| `situacao` (−0,95) | `dedup_pessoa` (−0,10) |
| `dedup_empresa` (−0,92) | `papel` (−0,16) |
| `despesas.tipo_custo` (−0,54) | `segmento` (+0,09) |

Dois achados com consequência de produto:

1. **`dedup_pessoa` não pode fundir automaticamente.** O Jev ali serve para
   ordenar a fila de revisão humana. Já implementado assim.
2. **Segmento não se infere do nome da empresa.** 0% de acerto em nomes opacos —
   e nome opaco é o caso comum (8 das 14 patrocinadoras reais). Com uma linha de
   descrição, 100%. Isso acrescentou um campo obrigatório à MCT-24 e bloqueou a
   MCT-23 nela.

## Ordem de execução recomendada

### Agora — fundação (bloqueia todo o resto)

1. **MCT-3** — Supabase provisionado, schema do PRD §47, migrations versionadas
2. **MCT-4** — organizações, usuários, eventos e RLS. É aqui que mora o
   isolamento entre clientes; sem isso a plataforma não pode receber um segundo
   cliente.
3. **Trocar o auth do Base44 pelo do Supabase** — 9 arquivos
4. **MCT-5** — tirar o `localStorage` de fonte de verdade

### Em paralelo, sem conflito

5. **Identidade visual** (marco 07) — em execução
6. **MCT-32** — desenho espacial das mesas. Requisito obrigatório do PRD §29 e
   o que diferencia o produto visualmente.
7. **MCT-33** — rota individual, conflitos, avisos, export PDF. Enquanto isso não
   existir, o cliente tem motivo racional para continuar usando o HTML antigo.

### Depois da fundação

8. MCT-6 a MCT-12 — pessoas, capacidade, financeiro integrado
9. Marco 09 (Jev) — a calibragem já está feita; é só aplicar

## Riscos abertos

**O legado ainda é melhor que a plataforma para operar um evento.** O HTML em
`mesacerta-tau.vercel.app` tem rota individual, análise de conflitos, avisos de
cadastro e export PDF. A plataforma não. Não aposentar o legado antes de MCT-32 e
MCT-33.

**Ligar a integração Git da Vercel e substituir o conteúdo do repositório são
seguros isolados e perigosos juntos** — o primeiro push publicaria a plataforma
inacabada em produção. Ver `docs/unificacao.md`.

**O repositório `mesacerta-private` guarda contrato assinado e acervo do evento.**
A decisão foi substituir o conteúdo; isso preserva o histórico do git, mas o
HEAD deixa de ter o acervo.

**Sem RLS, não existe segundo cliente.** MCT-4 não é melhoria, é pré-condição
comercial.

## Números do evento real, para referência

Get Connected Sorocaba 2026 — 14 mesas, 7 lugares, 76 convidados, 48 cortesias.
Faturamento previsto R$ 31.206, despesas R$ 29.719, margem 4,8%, ponto de
equilíbrio em 18 ingressos pagos.

Margem de 4,8% é apertada. Quando o módulo financeiro estiver de pé, esse é o
primeiro número que o produto tem de deixar óbvio para o organizador.
