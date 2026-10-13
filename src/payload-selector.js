// PS5 JARVIS — executor manual de apenas um payload já instalado no console.
// Este arquivo só é carregado depois de o Relapse despachar o ELF Loader.
// O comando file:/ é suportado pelo ps5-elfldr; nada é enviado sem clique do usuário.
const PAYLOADS = Object.freeze({
  pldmgr: "file:/data/pldmgr/payloads/pldmgr/pldmgr_v0.5.2.elf"
});
const PORT_LOADER = 9021;
const PORT_MANAGER = 8084;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function fillAddress(buf, port) {
  const data = buf.backing;
  data.fill(0);
  data[0] = 16;
  data[1] = 2; // AF_INET, PS5/FreeBSD
  data[2] = (port >>> 8) & 255;
  data[3] = port & 255;
  data[4] = 127;
  data[7] = 1;
}

export async function executeSelectedPayload(p, chain, sys, key, report) {
  if (!Object.prototype.hasOwnProperty.call(PAYLOADS, key))
    throw new Error("Carga útil não configurada");
  if (window.__jarvisPayloadSubmissionStarted)
    throw new Error("Esta carga já foi solicitada. Não repetir sem reiniciar a sessão.");
  window.__jarvisPayloadSubmissionStarted = true;

  const code = v => v.low | 0;
  const addr = p.malloc(16, 1);
  const data = p.malloc(256, 1);
  const noSigPipe = p.malloc(4, 1);
  const timeout = p.malloc(16, 1);
  p.write4(noSigPipe, 1);
  p.write4(timeout, 5);
  p.write4(timeout.add32(4), 0);
  p.write4(timeout.add32(8), 0);
  p.write4(timeout.add32(12), 0);

  const line = PAYLOADS[key] + "\n";
  if (line.length >= 256) throw new Error("Caminho de carga útil muito longo");
  data.backing.fill(0);
  for (let i=0; i<line.length; i++) data.backing[i] = line.charCodeAt(i);
  let sock = -1;

  async function closeCurrent() {
    if (sock >= 0) {
      try { await chain.syscall(sys.close, sock); } catch (_) {}
      sock = -1;
    }
  }
  async function connectLocal(port, configure) {
    fillAddress(addr, port);
    sock = code(await chain.syscall(sys.socket, 2, 1, 0));
    if (sock < 0) throw new Error("Não foi possível criar socket");
    if (configure) {
      const opts = [
        await chain.syscall(sys.setsockopt, sock, 0xffff, 0x0800, noSigPipe, 4),
        await chain.syscall(sys.setsockopt, sock, 0xffff, 0x1005, timeout, 16)
      ];
      if (opts.some(n => code(n) < 0)) throw new Error("Falha ao configurar socket");
    }
    return code(await chain.syscall(sys.connect, sock, addr, 16)) >= 0;
  }

  try {
    let connected = false;
    for (let i=0; i<6; i++) {
      if (await connectLocal(PORT_LOADER, true)) { connected=true; break; }
      await closeCurrent();
      if (i<5) await delay(450);
    }
    if (!connected) throw new Error("ELF Loader não respondeu em 127.0.0.1:9021");
    report("Loader local acessível. Solicitando " + key + "...");

    let sent = 0;
    while (sent < line.length) {
      const wrote = code(await chain.syscall(sys.write, sock, data.add32(sent), line.length - sent));
      if (wrote <= 0 || wrote > line.length-sent)
        throw new Error("A solicitação ao Loader foi interrompida");
      sent += wrote;
    }
    await closeCurrent();
    report("Comando enviado ao ELF Loader. Verificando o serviço 8084...");

    let managerReady = false;
    for (let i=0; i<8; i++) {
      await delay(650);
      try { managerReady = await connectLocal(PORT_MANAGER, false); }
      finally { await closeCurrent(); }
      if (managerReady) break;
    }
    return {commandSent:true, managerReady, name:key, servicePort:PORT_MANAGER};
  } finally {
    await closeCurrent();
  }
}
