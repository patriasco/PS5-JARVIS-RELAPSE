# JARVIS PS5 Relapse — host real
Base: ntfargo/Relapse-Exploit (MIT). Este diretorio contem todo o motor Relapse original em src/, offsets/ e payloads/.
## Como funciona
- index.html carrega assets/jarvis-ui.js antes de src/site.js (exploit original preservado).
- JARVIS observa as mensagens REAIS que sao emitidas no elemento #console. Nao simula sucesso.
- A narração MP3 requer clicar em 'Ativar voz JARVIS'. Navegadores PS5 podem bloquear autoplay.
- A narracao nao bloqueia USERLAND, KERNEL ou ELF Loader, nem a janela de exploracao.
- Conclusao confirmada apenas quando o ELF loader estiver de fato escutando na porta 9021.
## URL no PS5
1. Para usar no seu PC, execute INICIAR-HOST-REAL-WINDOWS.bat; no PS5, abra http://IP_DO_PC:8000/
2. Para usar GitHub Pages, crie repositório e publique TODO o conteúdo desta pasta NA RAIZ da branch main. Habilite Pages > Deploy from branch > main / (root).
3. O endereço da pagina no GitHub so existira quando o repo for criado e publicado; nao deve ser presumido previamente.
## Firmwares
A base Relapse inclui offsets de firmwares ESPECIFICOS (veja offsets/ e src/firmware.js); intervalo geral 7.00–13.60 NAO garante suporte a firmware nao listado.
## Risco
Codigo de exploracao pode causar crash/panic/reinicio. Teste apenas no seu proprio console, por sua conta e risco. Nao alteramos a cadeia de exploit, apenas a interface.
