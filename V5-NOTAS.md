# PS5 JARVIS — V5 estável (13/10/2026)

## Site principal
https://patriasco.github.io/PS5-JARVIS-RELAPSE/?v=5

Esta versão mantém o Relapse, o botão **INICIAR DESBLOQUEIO**, a esfera de partículas e a voz, com melhorias de baixo risco:

- Corrigida a mensagem que indicava a porta 9021 como aberta sem confirmação.
- Corrigida a flag que podia deixar a animação pausada após a conclusão/falha.
- Reduzido o pré-carregamento de áudio (`preload=none`).
- O modo `?noaudio=1` agora evita fontes de áudio na página e não tenta reproduzir a voz.
- O menu de dois modos continua no repositório, mas **não é mais utilizado pelo novo atalho ELF V5**.

## Atalho da aba Mídia
O instalador **PS5-JARVIS-Atalho-Principal-V5.elf** foi gerado no PC a partir do instalador V3 previamente confirmado pelo usuário. Ele utiliza o mesmo Title ID `JARV00002`, com versão de conteúdo `01.003.000`, e aponta para **somente o site principal** (`?v=5`). A compilação foi validada, mas a V5 **ainda não foi testada no PS5 real**.

## PLD Manager e estabilidade
O módulo `src/pldmgr-autoload.js` permanece sem integração ao fluxo de exploração; portanto **não existe autoload ativo do PLD Manager nesta versão**. O código de Kernel/WebKit, shellcode e offsets foi preservado.

A auditoria de 13/10 identificou condições com risco de falsos sucessos, limpeza AIO incompleta e falhas na recuperação de estados. Essas alterações não foram publicadas sem testes no hardware. O carregamento do PLD só deverá ser ativado após verificar a prontidão real da porta 9021 no próprio console, com confirmação de transferência e proteção contra envios repetidos.

## Reversão
Branch de backup: `backup-jarvis-pre-v5-20261013`.

## Testes
- JavaScript de `index.html`, `src/site.js` e `src/main.js` verificado por `node --check`.
- GitHub Pages: HTTP 200, páginas Normal e `?noaudio=1` sem erros JavaScript no Edge.
- Nenhum teste de exploit, KP ou carregamento de PLD foi executado automaticamente no PS5.
