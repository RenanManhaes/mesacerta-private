# Verificacao no navegador apos review
```text
PASS Servidor: tela completa, sem overlay Vite
PASS MCT-33.3 aviso sem fixo antes de gerar
PASS MCT-19.2 / MCT-32.3 todas as 196 mesas/rodadas pela UI identicas ao motor
PASS MCT-19.4 / MCT-32.6 cadeira exibe nome cadastrado e abre empresa/papel/mesa atual/proxima
PASS PRD51.13 centro abre dados da mesa
PASS MCT-19.3 / MCT-33.1 rota na UI 14 rodadas em ordem / 14 mesas distintas
PASS MCT-33 busca por nome e codigo
PASS MCT-33 filtro somente com conflito funciona
PASS MCT-33.5 PDF baixado pelo botao da tela
PASS MCT-32.5 viewport375 uma mesa espacial por linha / sem scroll horizontal
PASS PRD51.14 tablet sem scroll horizontal
PASS MCT-32.1/.2 seis cadeiras / quatro ocupadas / duas vazias / fixo com simbolo e texto
PASS PRD51.1/.2 capacidade individual/nome editados e previa antiga invalidada
PASS MCT-33.4 aviso R>=T inevitavel e T-1 visivel antes da geracao
PASS PRD51 estados de anfitriao rotativo e propria mesa visiveis
PASS PRD51 retorno a mesa identificado no desenho
PASS MCT-33.2 pares na tela ordenados mesma-mesa primeiro
PASS MCT-33.6 UI bloqueia menos de duas pessoas
PASS MCT-32.4 componente real com8/cap6 indica excedente2 / seis cadeiras
PASS Review: limites2/30 cadeiras todas no perimetro / sem sobrepor centro
MCT-1 achados reproduzidos: {"percentExpense":10,"zeroQuantity":25,"secondComputedStart":"09:30","reserved":0,"networkingAlert":"Nenhum conflito encontrado nas rodadas de negócio."}
PASS Navegacao e fluxos: zero erros JS/console (APIs isoladas por mock de teste)
21/21 verificacoes de navegador PASS

exit=0
```
