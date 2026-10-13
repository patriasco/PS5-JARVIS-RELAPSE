# PS5 JARVIS — endereço permanente

**Site principal:** https://patriasco.github.io/PS5-JARVIS-RELAPSE/

O atalho da aba **Mídia** agora deve usar a URL principal acima, **sem parâmetros de versão**. O ELF `PS5-JARVIS-ATALHO-PERMANENTE.elf` (Title ID `JARV00002`) só precisa ser instalado uma vez, usando o carregador ELF que funcionou nas versões anteriores.

**Fluxo obrigatório para novas versões:** atualizar `index.html` e os arquivos necessários no branch `main` deste GitHub, mantendo a mesma URL principal. Quando scripts, offsets, áudio ou estilos mudarem, atualizar também suas referências de versão/cache dentro do site. Não gerar outro ELF para cada atualização.

O cache do GitHub Pages ou do navegador PS5 pode atrasar a exibição de uma atualização; isso não muda a URL do atalho. O ELF não executa o desbloqueio automaticamente e não inicia sozinho o PLD Manager.

---

# PS5 Relapse Exploit
Supported firmware: 7.00 through 13.60.

## PAYLOADS manual no JARVIS

No endereço permanente [PS5 JARVIS](https://patriasco.github.io/PS5-JARVIS-RELAPSE/), o botão **PAYLOADS** inicia o fluxo Relapse depois do clique do usuário. Somente se esse fluxo retornar com o ELF Loader despachado a página exibe a seleção:

- **PLD MANAGER v0.5.2** — solicita ao ELF Loader local em `127.0.0.1:9021` o arquivo `file:/data/pldmgr/payloads/pldmgr/pldmgr_v0.5.2.elf`. Em seguida tenta confirmar o serviço local na porta `8084`.
- **NÃO CARREGAR** — fecha o seletor e não envia nenhuma carga.

A solicitação depende de um clique separado. Não reinicia o exploit, não instala outro ELF e não envia etaHEN ou kstuff. O arquivo PLD Manager deve estar previamente presente nesse caminho no PS5; o projeto não o inclui no GitHub.

**Validação:** os arquivos de JavaScript passaram na checagem de sintaxe, o GitHub Pages respondeu HTTP 200 e o fluxo visual passou em um teste simulado de navegador de PC. **Ainda não foi executado no PS5 real** e um teste simulado não comprova que a porta 9021 ou o PLD Manager realmente funcionem no console. Caso a solicitação seja enviada e a porta 8084 não responda, a interface informa que a execução não está confirmada; não repita o envio na mesma sessão.

O instalador **PS5-JARVIS-ATALHO-PERMANENTE.elf** continua apontando para a mesma URL principal, sem precisar ser recompilado para esta atualização.

## Usage
The default payloads are stored in `payloads/` after a successful run, the ELF loader listens on port `9021`.

## Stability notes
Webkit may need several attempts, reload the page if the browser stalls. The kernel exploit may hang or panic the console, so reboot before trying again if that happens.

## Exploit chain
Browser stage uses JSC info leaks and a structured clone object pool mismatch to corrupt a typedarray. The kernel stage combines a address leak with an `aio_multi_wait` uaf race to establish kernel r/w.

## Credits
- Sonic_Iso: Kernel Exploit
- Jordy: Webkit Exploit and Kernel Bug
- ntfargo: Exploit Dev
- ufm42: Exploit Dev
- Dr. Yenyen: Testing

Other helps:
- TheFlow, SlidyBat, Flatz, cow, nhk, bollarz, Sleirsgoevy, EchoStretch, EarthOnion.
 
## Disclaimer
This project is intended for **educational and security research purposes only**. It does not endorse piracy, unauthorized access, or misuse of commercial devices. Use it only on devices you own or are authorized to test, and comply with applicable laws and regulations.

The software is provided as-is, without warranty. You assume the risks of using it, including system instability, data loss, and account bans. The maintainers accept no liability for resulting damage.