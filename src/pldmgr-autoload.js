// JARVIS V5.2 experimental: send ONLY the existing local PLD Manager v0.5.2 ELF.
// No automatic activation: main.js requires the explicit URL option autoload=pldmgr.
// A successful TCP transfer does not prove the PLD Manager executed on the console.
const LOCAL_PLDMGR = "/data/pldmgr/payloads/pldmgr/pldmgr_v0.5.2.elf";
const MAX_ELF_SIZE = 4 * 1024 * 1024;
const BLOCK = 0x4000;

function checkElfHeader(data) {
  if (data.length < 64 || data[0] !== 0x7f || data[1] !== 0x45 ||
      data[2] !== 0x4c || data[3] !== 0x46 ||
      data[4] !== 2 || data[5] !== 1 || data[6] !== 1 ||
      data[18] !== 0x3e || data[19] !== 0)
    throw new Error("Arquivo PLD inválido (exige ELF64 x86-64 little-endian)");
  // At least one loadable program header must be present in a normal PS5 ELF.
  const phoff = data[32] + data[33] * 256 + data[34] * 65536 + data[35] * 16777216;
  const phentsize = data[54] + 256 * data[55];
  const phnum = data[56] + 256 * data[57];
  if (phoff < 64 || phentsize < 56 || phnum < 1 || phnum > 128)
    throw new Error("Cabeçalho PLD sem tabela de segmentos válida");
}

export async function sendInstalledPLD(p, chain, sys, log) {
  if (window.__jarvisPLDState) {
    throw new Error("Autoload PLD já iniciado nesta sessão; não repetir");
  }
  window.__jarvisPLDState = "locating";
  const resultCode = value => value.low | 0;
  let fd = -1, socket = -1;
  try {
    const readPtr = p.malloc(BLOCK, 1);
    const socketAddr = p.malloc(16, 1);
    const nosigpipe = p.malloc(4, 1);
    const timeout = p.malloc(16, 1);
    // Native FreeBSD sockaddr_in: length, AF_INET, port network order, 127.0.0.1.
    socketAddr.backing.fill(0);
    socketAddr.backing[0] = 16;
    socketAddr.backing[1] = 2;
    socketAddr.backing[2] = (9021 >>> 8) & 255;
    socketAddr.backing[3] = 9021 & 255;
    socketAddr.backing[4] = 127;
    socketAddr.backing[7] = 1;
    p.write4(nosigpipe, 1);
    p.write4(timeout, 5);
    p.write4(timeout.add32(4), 0);
    p.write4(timeout.add32(8), 0);
    p.write4(timeout.add32(12), 0);

    fd = resultCode(await chain.syscall(sys.open, p.stringify(LOCAL_PLDMGR), 0, 0));
    if (fd < 0) throw new Error("PLD Manager não encontrado: " + LOCAL_PLDMGR);

    // Read and validate the complete ELF BEFORE connecting or transferring data.
    // This prevents sending an invalid or oversized, partially transferred ELF.
    const chunks = [];
    let total = 0, count;
    while ((count = resultCode(await chain.syscall(sys.read, fd, readPtr, BLOCK))) > 0) {
      if (total + count > MAX_ELF_SIZE) throw new Error("ELF maior que 4 MiB; envio cancelado");
      chunks.push(readPtr.backing.slice(0, count));
      total += count;
    }
    if (count < 0) throw new Error("Falha de leitura do PLD no PS5");
    if (!chunks.length || total < 64) throw new Error("Arquivo PLD vazio ou incompleto");
    checkElfHeader(chunks[0]);
    window.__jarvisPLDState = "validated";
    log("PLD localizado e validado: " + total + " bytes", "info");

    // The loader on supported Relapse releases may bind only to localhost.
    // Create a NEW socket each attempt and set options again on that socket.
    let ready = false;
    for (let attempt = 0; attempt < 6; attempt++) {
      socket = resultCode(await chain.syscall(sys.socket, 2, 1, 0));
      if (socket < 0) throw new Error("Falha ao criar socket local PS5");
      const opt1 = resultCode(await chain.syscall(sys.setsockopt, socket, 0xffff, 0x0800, nosigpipe, 4));
      const opt2 = resultCode(await chain.syscall(sys.setsockopt, socket, 0xffff, 0x1005, timeout, 16));
      if (opt1 < 0 || opt2 < 0) throw new Error("Falha ao configurar opções do socket");
      const rv = resultCode(await chain.syscall(sys.connect, socket, socketAddr, 16));
      if (rv >= 0) { ready = true; break; }
      await chain.syscall(sys.close, socket);
      socket = -1;
      if (attempt < 5) await new Promise(resolve => setTimeout(resolve, 400));
    }
    if (!ready) throw new Error("ELF Loader local indisponível em 127.0.0.1:9021");
    window.__jarvisPLDState = "sending";
    log("Conexão local 9021 confirmada; enviando PLD Manager", "info");

    let sent = 0;
    for (const chunk of chunks) {
      readPtr.backing.set(chunk, 0);
      let offset = 0;
      while (offset < chunk.length) {
        const n = resultCode(await chain.syscall(sys.write, socket, readPtr.add32(offset), chunk.length - offset));
        if (n <= 0 || n > chunk.length - offset)
          throw new Error("Falha durante envio do PLD em " + (sent + offset) + " bytes");
        offset += n;
      }
      sent += chunk.length;
    }
    window.__jarvisPLDState = "sent";
    log("PLD Manager transferido: " + sent + " bytes; execução ainda não confirmada", "info");
    return { path: LOCAL_PLDMGR, bytes: sent, transferred: true };
  } catch (e) {
    window.__jarvisPLDState = "failed";
    throw e;
  } finally {
    if (socket >= 0) try { await chain.syscall(sys.close, socket); } catch (_) {}
    if (fd >= 0) try { await chain.syscall(sys.close, fd); } catch (_) {}
  }
}
