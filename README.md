# Recomendo Networking

Materiais do **Get Connected Sorocaba 2026** e o **Mesa Certa**, o sistema que monta as rodadas de negócio do evento.

## Mesa Certa

Simulador das rodadas de negócio: distribui os convidados entre as mesas dos patrocinadores sem ninguém repetir mesa, respeita os anfitriões fixos e gera o roteiro individual de cada pessoa.

- Arquivo principal: [`Get Connected Sorocaba 2026/Rodadas de Negocio/rodadas-de-negocio.html`](Get%20Connected%20Sorocaba%202026/Rodadas%20de%20Negocio/rodadas-de-negocio.html)
- Pasta pronta para publicar na Vercel: `Get Connected Sorocaba 2026/Rodadas de Negocio/site-mesacerta`
- Versão no ar: https://mesacerta-brasil.vercel.app
- Versão no Claude: https://claude.ai/artifact/1sx9n33pp9Dz3qVHJL272a
- Regras e objetivos: https://claude.ai/code/artifact/9d27431d-9d29-433e-9635-b3e9b3829cd4

É um arquivo HTML único, sem instalação: abre com dois cliques no navegador.

### Como publicar uma versão nova

```bash
cd "Get Connected Sorocaba 2026/Rodadas de Negocio/site-mesacerta"
npx vercel --prod
```

O arquivo `publicar.bat`, na mesma pasta, faz isso em dois cliques.

## O que tem no repositório

| Pasta | Conteúdo |
| --- | --- |
| `Get Connected Sorocaba 2026/Rodadas de Negocio` | Mesa Certa, planilha das rodadas e pasta de publicação |
| `Get Connected Sorocaba 2026/Campanha de e-mails` | E-mails da campanha do evento |
| `Get Connected Sorocaba 2026/banners-normalizados` | Banners tratados, 1280x533 |
| `Administrativo` | Documentos administrativos do evento |
| `Apresentacao_Get_Connected_Sorocaba_2026` | Materiais da apresentação |

## O que ficou de fora

Por segurança e por limite de tamanho, estes itens não entram no repositório, conforme o `.gitignore`:

- credenciais: `.env.local` e `.vercel`
- dados pessoais de terceiros: `contatos.json`, `planilhas getconneted`, bases de contatos
- `FINANCEIRO`
- `sender-whatsapp`, que tem repositório próprio
- fotos, vídeos e o PPTX da apresentação, de 695 MB, acima do limite de 100 MB por arquivo do GitHub
