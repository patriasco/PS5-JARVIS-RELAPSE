// JARVIS: local-only PLD Manager sender, intentionally separate from Relapse exploit.
// This module is used only with ?autoload=pldmgr, after elfldr is confirmed ready.
// It never sends etaHEN, kstuff, or any other payload. If PLD is absent, stop.
export async function sendInstalledPLD(p, chain, sys, log) {
  if (window.__jarvisPLDAlreadyAttempted) return;
  window.__jarvisPLDAlreadyAttempted = true;

  const paths = [
    "/data/ps5_autoloader/pldmgr_v0.5.2.elf",
    "/data/payloads/pldmgr_v0.5.2.elf",
    "/data/pldmgr_v0.5.2.elf",
    "/mnt/usb0/ps5_autoloader/pldmgr_v0.5.2.elf",
    "/mnt/usb1/ps5_autoloader/pldmgr_v0.5.2.elf",
    "/mnt/usb2/ps5_autoloader/pldmgr_v0.5.2.elf",
  ];

  // Keep one native buffer resident for the duration of the transfer.
  const readBuffer = p.malloc(0x4000, 1);
  const addr = p.malloc(0x10, 1);
  const noSigPipe = p.malloc(4, 1);
  const timeout = p.malloc(0x10, 1);
  p.write4(noSigPipe, 1);
  p.write4(timeout, 12);
  p.write4(timeout.add32(4), 0);
  p.write4(timeout.add32(8), 0);
  p.write4(timeout.add32(12), 0);

  // sockaddr_in (FreeBSD), TCP localhost:9021.
  addr.backing.fill(0);
  addr.backing[0] = 16;
  addr.backing[1] = 2;
  addr.backing[2] = (9021 >> 8) & 255;
  addr.backing[3] = 9021 & 255;
  addr.backing[4] = 127;
  addr.backing[7] = 1;

  let file = -1;
  let socket = -1;
  let chosenPath = "";
  try {
    for (const path of paths) {
      const result = (await chain.syscall(sys.open, p.stringify(path), 0, 0)).low | 0;
      if (result >= 0) {
        file = result;
        chosenPath = path;
        break;
      }
    }
    if (file < 0) {
      throw new Error("PLD Manager não localizado. Salve o ELF em /data/ps5_autoloader/pldmgr_v0.5.2.elf");
    }

    log("PLD Manager localizado: " + chosenPath, "info");
    let length = (await chain.syscall(sys.read, file, readBuffer, 0x4000)).low | 0;
    if (length < 64) throw new Error("PLD Manager: arquivo vazio ou inválido");
    const data = readBuffer.backing;
    if (data[0] !== 0x7f || data[1] !== 0x45 || data[2] !== 0x4c ||
        data[3] !== 0x46 || data[18] !== 0x3e || data[19] !== 0)
      throw new Error("PLD Manager: o arquivo não é um ELF x86-64 válido");

    socket = (await chain.syscall(sys.socket, 2, 1, 0)).low | 0;
    if (socket < 0) throw new Error("PLD Manager: falha ao criar socket local");

    const option1 = (await chain.syscall(sys.setsockopt, socket, 0xffff, 0x0800, noSigPipe, 4)).low | 0;
    const option2 = (await chain.syscall(sys.setsockopt, socket, 0xffff, 0x1005, timeout, 16)).low | 0;
    if (option1 < 0 || option2 < 0) throw new Error("PLD Manager: falha nas opções de socket");

    let connected = false;
    for (let attempt = 0; attempt < 8; attempt++) {
      const rv = (await chain.syscall(sys.connect, socket, addr, 16)).low | 0;
      if (rv >= 0) { connected = true; break; }
      // A socket that failed connect may need to be recreated.
      await chain.syscall(sys.close, socket);
      socket = -1;
      await new Promise(resolve => setTimeout(resolve, 350));
      socket = (await chain.syscall(sys.socket, 2, 1, 0)).low | 0;
      if (socket < 0) break;
    }
    if (!connected) throw new Error("ELF Loader não disponível em 127.0.0.1:9021");

    let total = 0;
    while (length > 0) {
      if (total + length > 4 * 1024 * 1024)
        throw new Error("PLD Manager: arquivo excede o limite de segurança de 4 MiB");
      let sent = 0;
      while (sent < length) {
        const written = (await chain.syscall(sys.write, socket, readBuffer.add32(sent), length - sent)).low | 0;
        if (written <= 0) throw new Error("PLD Manager: envio interrompido em " + (total + sent) + " bytes");
        sent += written;
      }
      total += length;
      length = (await chain.syscall(sys.read, file, readBuffer, 0x4000)).low | 0;
      if (length < 0) throw new Error("PLD Manager: erro ao ler arquivo local");
    }
    log("PLD Manager v0.5.2 enviado automaticamente (" + total + " bytes)", "info");
    return total;
  } finally {
    if (socket >= 0) try { await chain.syscall(sys.close, socket); } catch (_) {}
    if (file >= 0) try { await chain.syscall(sys.close, file); } catch (_) {}
  }
}
