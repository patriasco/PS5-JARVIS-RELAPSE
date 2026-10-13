# PS5 JARVIS V5.2 — versão principal

Site único: https://patriasco.github.io/PS5-JARVIS-RELAPSE/?v=5.2

## Melhorias publicadas

- O botão **INICIAR DESBLOQUEIO** aguarda o carregamento dos offsets do firmware suportado.
- Falha ou firmware incompatível bloqueiam o início.
- O retorno do Kernel não é anunciado como porta 9021 aberta sem confirmação real.
- A animação pode voltar após término ou erro.
- Avisos de áudio ou tentativas recuperáveis do WebKit não são classificados como falhas terminais do desbloqueio. Somente o erro capturado pelo fluxo principal ou uma falha de firmware/offsets encerra o estado da interface.
- Diagnóstico `?noaudio=1` não inclui fontes de áudio.
- Voz original em WAV/AAC/MP3 continua no modo normal.
- O site nunca inicia o desbloqueio automaticamente só por ser aberto.

## ELF do atalho principal

Compilado localmente a partir da base do instalador V3 funcional:
`PS5-JARVIS-Atalho-Principal-V5-2.elf`.

- Title ID: `JARV00002`
- Versão de conteúdo: `01.005.000`
- URL: `https://patriasco.github.io/PS5-JARVIS-RELAPSE/?v=5.2`
- ELF x86-64 com entry point válido; SHA-256: `1079697bb9bd2705f747d61197898bf434206ab72c24d439684700ff3f9ed166`.
- O ícone abre **apenas o site principal**, sem o antigo menu de dois botões.

## PLD Manager: experimental, separado da versão principal

A branch [experimento-pldmgr-v5-2](https://github.com/patriasco/PS5-JARVIS-RELAPSE/tree/experimento-pldmgr-v5-2) contém uma integração **opt-in** para estudar o envio de `/data/pldmgr/payloads/pldmgr/pldmgr_v0.5.2.elf` ao Loader local em `127.0.0.1:9021`.

- A versão principal **não** executa automaticamente o PLD Manager.
- O código experimental ainda não passou por validação no hardware; não se deve tratá-lo como pronto nem executá-lo repetidamente.
- Envio de bytes e execução comprovada são estados diferentes.
- O módulo foi verificado quanto à sintaxe, mas o teste simulado completo foi bloqueado pela ferramenta.
- O Kernel Relapse, offsets, shellcode e binários originais permanecem preservados na versão principal.

## Limites dos testes e reversão

- JavaScript da interface e de `src/site.js` passou no `node --check`.
- V5.2 não foi testado no PS5 real; não há evidência de redução da taxa de KP.
- Não foi realizada conexão real à porta 9021 ou execução do PLD.
- Backup pré-V5: [backup-jarvis-pre-v5-20261013](https://github.com/patriasco/PS5-JARVIS-RELAPSE/tree/backup-jarvis-pre-v5-20261013).
