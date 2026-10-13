# PS5 JARVIS — endereço permanente

**Site principal:** https://patriasco.github.io/PS5-JARVIS-RELAPSE/

O atalho da aba **Mídia** agora deve usar a URL principal acima, **sem parâmetros de versão**. O ELF `PS5-JARVIS-ATALHO-PERMANENTE.elf` (Title ID `JARV00002`) só precisa ser instalado uma vez, usando o carregador ELF que funcionou nas versões anteriores.

**Fluxo obrigatório para novas versões:** atualizar `index.html` e os arquivos necessários no branch `main` deste GitHub, mantendo a mesma URL principal. Quando scripts, offsets, áudio ou estilos mudarem, atualizar também suas referências de versão/cache dentro do site. Não gerar outro ELF para cada atualização.

O cache do GitHub Pages ou do navegador PS5 pode atrasar a exibição de uma atualização; isso não muda a URL do atalho. O ELF não executa o desbloqueio automaticamente e não inicia sozinho o PLD Manager.

---

# PS5 Relapse Exploit
Supported firmware: 7.00 through 13.60.

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