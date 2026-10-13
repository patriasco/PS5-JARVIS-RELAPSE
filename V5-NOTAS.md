# PS5 JARVIS — V5.1 (13/10/2026)

**Site principal:** https://patriasco.github.io/PS5-JARVIS-RELAPSE/?v=5.1

## Melhorias verificadas
- Interface JARVIS com botão **INICIAR DESBLOQUEIO**, sem início automático.
- Botão bloqueado até carregar os offsets correspondentes ao firmware.
- Firmware não suportado ou offsets não carregados impedem o início.
- O site não anuncia que a porta 9021 está aberta sem confirmação.
- Retorno sem despacho do ELF Loader é tratado como erro, não conclusão.
- A esfera de partículas retoma o desenho quando o fluxo JS termina.
- Modo `?noaudio=1`: não disponibiliza fontes de áudio ao navegador.
- Modo normal mantém as alternativas WAV, AAC/M4A e MP3.
- O atalho ELF principal abre **somente este site**, sem menu.

## Testes no PC
- Navegador PC sem firmware PS5: botão bloqueado corretamente.
- User agent PS5 firmware 7.00: offsets carregam e botão fica habilitado.
- Diagnóstico PS5 7.00 com `noaudio=1`: nenhuma fonte de áudio ativa.
- Os três testes passaram com HTTP 200 e zero erros JavaScript.
- ELF V5.1 compilado com entrada ELF `0x710`, mantendo Title ID `JARV00002`.
- SHA256: `b5b1e4136e73f7b67122fadca4895054aa24dd2375bc026475322c1cb28240b6`.

## Limitações e pendências
**Não foi afirmada compatibilidade comprovada no PS5 real para a V5.1.**

O WebKit, a exploração do Kernel, os offsets e o shellcode permanecem originais. A auditoria do Codex identificou inconsistências no controle de sucesso, limpeza AIO e recuperação do Kernel, que exigem validação isolada antes de serem modificadas.

O PLD Manager **ainda não inicia automaticamente pelo JARVIS**. O módulo de autoload existe mas não é conectado ao fluxo principal. Enviar um ELF não comprova que ele foi executado. A prontidão local do ELF Loader na porta 9021 ainda requer confirmação dentro do console.

O atalho **PS5-JARVIS-Atalho-Principal-V5-1.elf** é somente o instalador do ícone da aba Mídia. Não carrega payloads.

**Reversão:** branch `backup-jarvis-pre-v5-20261013`.
