// PS5 JARVIS: envio manual de payloads residentes no PS5, sem reiniciar o Relapse.
// Nunca executar por importacao ou apos a conclusao do exploit. Requer clique no menu.
const PAYLOADS = Object.freeze({
  pldmgr: "file:/data/pldmgr/payloads/pldmgr/pldmgr_v0.5.2.elf"
});
const PORT_LOADER = 9021;
const PORT_MANAGER = 8084;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function address(ptr, port) {
  // FreeBSD/PS5 sockaddr_in: sin_len, AF_INET, network byte order, 127.0.0.1
  ptr.backing.fill(0);
  ptr.backing[0] = 16;
  ptr.backing[1] = 2;
  ptr.backing[2] = (port >> 8) & 255;
  ptr.backing[3] = port & 255;
  ptr.backing[4] = 127;
  ptr.backing[7] = 1;
}

export async function executeSelectedPayload(p, chain, sys, key, report = () => {}) {
  if (!Object.prototype.hasOwnProperty.call(PAYLOADS, key))
    throw new Error("Payload não configurado");
  if (!p || !chain || !sys || typeof chain.syscall !== "function")
    throw new Error("Contexto nativo do PS5 indisponível");
  if (window.__jarvisPayloadBusy)
    throw new Error("Já existe uma solicitação em andamento");
  if (window.__jarvisPayloadSubmissionStarted)
    throw new Error("Já houve uma tentativa de envio; reinicie a sessão para evitar duplicação");

  window.__jarvisPayloadBusy = true;
  let sock = -1;
  let sentBytes = 0;
  const toInt = value => value.low | 0;

  async function closeSocket() {
    if (sock < 0) return;
    const old = sock; sock = -1;
    try { await chain.syscall(sys.close, old); } catch (_) {}
  }

  try {
    const addr = p.malloc(16, 1);
    const buffer = p.malloc(256, 1);
    const noSigPipe = p.malloc(4, 1);
    const timeout = p.malloc(16, 1);
    p.write4(noSigPipe, 1);
    p.write4(timeout, 5);
    p.write4(timeout.add32(4), 0);
    p.write4(timeout.add32(8), 0);
    p.write4(timeout.add32(12), 0);

    const line = PAYLOADS[key] + "\n";
    if (line.length >= 256) throw new Error("Comando muito extenso");
    buffer.backing.fill(0);
    for (let i = 0; i < line.length; i++) buffer.backing[i] = line.charCodeAt(i);

    async function connect(port, configure) {
      address(addr, port);
      sock = toInt(await chain.syscall(sys.socket, 2, 1, 0));
      if (sock < 0) throw new Error("Falha ao criar socket TCP");
      if (configure) {
        // Use FreeBSD SO_NOSIGPIPE and SO_SNDTIMEO for the socket sending the command.
        if (toInt(await chain.syscall(sys.setsockopt, sock, 0xffff, 0x0800, noSigPipe, 4)) < 0 ||
            toInt(await chain.syscall(sys.setsockopt, sock, 0xffff, 0x1005, timeout, 16)) < 0)
          throw new Error("Não foi possível configurar o socket");
      }
      return toInt(await chain.syscall(sys.connect, sock, addr, 16)) >= 0;
    }

    // The service may already be running. Never start a second copy in that case.
    try {
      if (await connect(PORT_MANAGER, false)) {
        report("Porta 8084 já acessível; o Loader não receberá novo comando.");
        return { commandSent: false, managerReady: true, alreadyRunning: true, name: key };
      }
    } finally { await closeSocket(); }

    let loaderReady = false;
    for (let i = 0; i < 6; i++) {
      try {
        if (await connect(PORT_LOADER, true)) { loaderReady = true; break; }
      } finally {
        if (!loaderReady) await closeSocket();
      }
      if (i < 5) await delay(450);
    }
    if (!loaderReady)
      throw new Error("ELF Loader indisponível em 127.0.0.1:9021");
    report("Conexão TCP na porta 9021 estabelecida. Solicitando o ELF instalado...");

    // From the first write attempt onward, the result may be indeterminate.
    // Never automatically retry: the Loader may have already accepted the command.
    window.__jarvisPayloadSubmissionStarted = true;
    while (sentBytes < line.length) {
      const wrote = toInt(await chain.syscall(sys.write, sock, buffer.add32(sentBytes), line.length - sentBytes));
      if (wrote <= 0 || wrote > line.length - sentBytes)
        throw new Error("Socket interrompeu o envio do comando");
      sentBytes += wrote;
    }
    await closeSocket();
    report("Comando escrito no socket; aguardando resposta TCP do serviço 8084...");

    let managerReady = false;
    for (let i = 0; i < 12; i++) {
      await delay(650);
      try { managerReady = await connect(PORT_MANAGER, false); }
      finally { await closeSocket(); }
      if (managerReady) break;
    }
    return { commandSent: true, managerReady, alreadyRunning: false, name: key, bytesSent: sentBytes };
  } catch (error) {
    if (window.__jarvisPayloadSubmissionStarted)
      throw new Error("Estado após tentativa de envio não confirmado: " + String(error && error.message || error));
    throw error;
  } finally {
    await closeSocket();
    window.__jarvisPayloadBusy = false;
  }
}
