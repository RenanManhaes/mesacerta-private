# Unificação: GitHub + Base44

> Documento histórico da unificação. Para requisitos atuais, backend utilizado,
> identidade visual e situação das 19 issues MCT-46–64, consultar o
> [PRD Mesa Certa v1.2](PRD_Mesa_Certa_v1.2.md), atualizado em 06/10/2026.
> Os itens “Falta” e o ponto de decisão de backend abaixo registram aquele
> momento, não uma declaração atual de pendência. Os limites do motor e a
> cautela de publicação continuam válidos.

O que cada peça é, o que foi feito e o que falta.

## As três peças

**1. O motor real** — `mesacerta-private`, em
`Get Connected Sorocaba 2026/Rodadas de Negocio/rodadas-de-negocio.html`.

O repositório do GitHub **não é um repositório de código**: é o acervo do evento
(contratos, apresentação, campanhas de e-mail, banners). A ferramenta mora
dentro dele, num HTML único de 1403 linhas, com localStorage e export por jsPDF.
`site-mesacerta/index.html` é byte a byte o mesmo arquivo — é a cópia publicada
na Vercel, não uma versão diferente.

**2. O rascunho do Base44** — `Layout base44.zip`.

131 arquivos: React + Vite + shadcn/ui, com todas as páginas do PRD já
esqueletadas (Dashboard, Financial, Expenses, Revenues, Sponsors, Suppliers,
Participants, Schedule, Tasks, Capacity, Simulator, Networking), layout,
sidebar, rotas e contexto de evento.

**3. A planilha** — `Base da configuração - MesaCerta.xlsx`, o controle
financeiro e de fornecedores do cliente. Já usada como fonte de dados reais em
`../jev-pilot/`.

## Os dois motores não são comparáveis

O Base44 gerou seu próprio `src/lib/networking/distribution.js`, 100 linhas.
Ele **não distribui pessoas** — gera participantes fictícios a partir de
contagens:

```js
for (let i = 0; i < fixedHosts; i++)
  hosts.push({ id: `FH${i}`, ..., company: `Empresa ${i + 1}` });
```

É guloso simples: para cada pessoa, escolhe a mesa não visitada com menos
conhecidos. E tem código morto — o laço que deveria contar `repeatedTables` está
vazio, então `conflicts` sempre subconta:

```js
allIds.forEach(id => {
  // a participant should never repeat a table while rounds <= tables...
});
```

O motor real faz outra coisa: divide os participantes em turmas, desloca cada
turma por permutações cíclicas (garantindo que todo mundo passe por todas as
mesas) e então **otimiza as permutações por recozimento simulado** para
minimizar reencontros, com até 250 mil iterações e busca em múltiplas seeds.

**Decisão:** o rascunho do Base44 vira a casca; o motor real vira o miolo.

## Feito

- `mesa-certa/` criado a partir do zip do Base44.
- `src/lib/networking/distribution.js` (mock) **removido**.
- `src/lib/networking/engine.js` — port fiel do motor real: `build`,
  `balancear`, `evitarCasa`, `analyze`, mais `gerarDistribuicao` encapsulando o
  pipeline com busca de seed que antes vivia solto no `setTimeout` da UI.
- `src/lib/networking/engine.test.mjs` — prova que o port preserva as garantias
  do cenário que rodou no evento.

```
$ node src/lib/networking/engine.test.mjs

Cenario real: 76 convidados, 14 mesas, 14 rodadas, 7 por mesa

  ok   a grade tem uma linha por participante
  ok   cada linha tem uma mesa por rodada
  ok   todo participante visita as 14 mesas, sem repetir nenhuma
  ok   lotacao por mesa fica entre floor e ceil de P/T (5–6)
  ok   nenhuma mesa estoura a capacidade
  ok   ninguem reencontra a mesma pessoa na MESMA mesa
  ok   nenhuma dupla se encontra mais de 2 vezes
  ok   a mesma seed reproduz a mesma grade
  ok   reanalisar a grade da os mesmos numeros

  seed escolhida:            1
  tempo de geracao:          213ms
  duplas que se encontram:   2034 de 2850 possiveis (71.4%)
  encontram-se so uma vez:   1688
  reencontros:               346
  contatos por pessoa:       53.5
```

## Falta

**Porta do motor para a UI.** `src/pages/event/Networking.jsx` ainda chama a
assinatura antiga do mock. Precisa passar a consumir `gerarDistribuicao` e
receber pessoas reais em vez de contagens.

**Desenho das mesas (PRD §29–38).** É requisito visual obrigatório e o Base44
não entregou: as mesas precisam de representação espacial vista de cima, com uma
cadeira desenhada por lugar da capacidade, lugares vazios visíveis, anfitrião
com marca própria. O HTML original tem a lógica de estados de cadeira
(`returning`, `casa`) pronta para ser aproveitada.

**Entidade `Seat` (PRD §47).** O motor trabalha com `tab[pessoa][rodada] = mesa`
— mesa, não cadeira. O PRD pede `Seat` como posição real. É camada de
apresentação sobre a grade, não mudança de algoritmo.

**O que o HTML tem e o Base44 não.** Antes de aposentar o arquivo original,
portar: análise de conflitos por dupla, aba de rota individual, export PDF dos
roteiros, e os avisos de cadastro (mesa sem anfitrião fixo, fixo sem mesa,
menos de 2 pessoas rodando).

**Backend.** O PRD §48 pede Supabase; o esqueleto veio amarrado ao SDK do
Base44 (`@base44/sdk`, `src/api/base44Client.js`). Decidir se o Base44 fica como
backend ou se é só andaime de UI a ser trocado.

## Deploy — qual projeto Vercel é qual

Decidido em 30/09/2026. Errar isto publica no lugar errado.

| Projeto Vercel | URL | Papel |
|---|---|---|
| `mesacerta` | **mesacerta-tau.vercel.app** | **EM USO.** É o link que circula. Não publicar aqui. |
| `mesacerta-brasil` | **mesacerta-brasil.vercel.app** | Destino da plataforma nova. |

Os deploys historicamente eram manuais (`publicar.bat` → `vercel deploy --prod`),
sem vínculo com Git — por isso `git push` não publicava nada.

Ao ligar a integração Git do `mesacerta-brasil`, isso muda: **todo push na branch
de produção passa a publicar sozinho**. Combinado com a decisão de substituir o
conteúdo do repositório, um push descuidado vira deploy de produção. Ligar a
integração e substituir o repositório são seguros isolados e perigosos juntos.

O legado (`rodadas-de-negocio.html`) só deve ser aposentado depois que MCT-33
(rota, conflitos, avisos, PDF) e MCT-32 (desenho das mesas) estiverem prontas.
Antes disso, a plataforma é pior que ele para quem opera um evento.
