@echo off
cd /d "%~dp0"
copy /Y "..\rodadas-de-negocio.html" "index.html" >nul
npx vercel@59.25.4 deploy --prod --yes
if errorlevel 1 (
  echo.
  echo O deploy falhou. Confira a mensagem acima antes de fechar esta janela.
) else (
  echo.
  echo Mesa Certa publicado com sucesso na Vercel.
)
pause
