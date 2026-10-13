import { establishPrimitive } from "./webkit.js";
import { installWindowP } from "./utils/mem.js";

const output = document.getElementById("console");

function writeLog(message, type = "log", replace = false) {
  let line = replace ? output.lastElementChild : null;
  if (!line) {
    line = document.createElement("div");
    output.appendChild(line);
  }
  let marker = "*";
  if (type === "error") marker = "-";
  if (type === "info" || type === "success") marker = "+";
  line.textContent = `[${marker}] ${message}`;
  output.scrollTop = output.scrollHeight;
}

function writeEvent(name, detail, type) {
  writeLog(detail == null || detail === "" ? name : `${name}: ${detail}`,
    type || (name === "Failed" ? "error" : "log"));
}

window.writeLog = writeLog;
window.jb = { mark: writeEvent };

async function getPrimitive() {
  writeLog("Starting WebKit exploit");
  const primitive = installWindowP(await establishPrimitive(writeEvent));
  if (!primitive || typeof primitive.read8 !== "function")
    throw new Error("Memory primitive unavailable");

  writeLog("ARW ready", "success");
  return primitive;
}

function getWebKitBase() {
  const ctor = globalThis.__ps5NativeCtor;
  if (typeof ctor !== "number" || typeof OFFSET_wk_host_constructor_candidates === "undefined")
    throw new Error("WebKit base inputs are unavailable");

  for (const offset of OFFSET_wk_host_constructor_candidates) {
    const base = ctor - offset;
    if (base >= 0x800000000 && base < 0x900000000 && base % 0x4000 === 0)
      return base;
  }

  throw new Error("WebKit base not found");
}

async function run() {
  const rejection = window.firmware.rejection();
  if (rejection)
    throw new Error(rejection);
  writeLog("Credits: Sonic_Iso, Jordy, ntfargo, ufm42, Dr. Yenyen, TheFlow, SlidyBat, Flatz, cow, nhk, bollarz, Sleirsgoevy, EchoStretch, EarthOnion", "info");
  writeLog(`Agent: ${navigator.userAgent}`, "info");
  writeLog(`Firmware: ${window.fw_str} · JARVIS versão 5.1`, "info");
  const primitive = await getPrimitive();
  writeLog(`WebKit base: 0x${getWebKitBase().toString(16)}`, "info");

  await import("./relapse_exploit.js");
  await main(primitive);
}

// USER-INITIATED RUN: loading this page never starts the exploit.
let hasStarted = false;
const startButton = document.getElementById("btnStartExploit");
if (startButton) {
  startButton.disabled = true;
  startButton.textContent = "VALIDANDO FIRMWARE...";
  const enableWhenReady = () => {
    if (!window.__jarvisOffsetsReady || window.firmware.rejection()) return;
    startButton.disabled = false;
    startButton.textContent = "INICIAR DESBLOQUEIO";
  };
  const failOffsets = () => {
    startButton.disabled = true;
    startButton.textContent = "OFFSETS INDISPONÍVEIS";
    writeLog("Firmware ou offsets indisponíveis. Desbloqueio não iniciado.", "error");
  };
  if (window.firmware.rejection()) {
    startButton.textContent = "FIRMWARE NÃO SUPORTADO";
    writeLog(window.firmware.rejection(), "error");
  } else {
    enableWhenReady();
    window.addEventListener("jarvis:offsets-ready", enableWhenReady, { once: true });
    window.addEventListener("jarvis:offsets-error", failOffsets, { once: true });
  }
  startButton.addEventListener("click", () => {
    if (hasStarted || !window.__jarvisOffsetsReady || startButton.disabled) return;
    hasStarted = true;
    startButton.disabled = true;
    startButton.textContent = "DESBLOQUEIO EM EXECUÇÃO...";
    // Diagnostic mode: run Relapse without audio to isolate browser load from KEXP.
    const silentDiagnostic = new URLSearchParams(window.location.search).get("noaudio") === "1";
    if (silentDiagnostic) {
      writeLog("JARVIS diagnóstico: voz desativada nesta execução", "info");
    } else if (typeof window.jarvisStartVoice === "function") {
      try { window.jarvisStartVoice(); } catch (_) { /* audio must not block exploit */ }
    }
    writeLog("Desbloqueio iniciado pelo usuário", "info");
    run().then(() => {
      // main() has finished and reported that the loader was dispatched.
      // We have NOT established that port 9021 accepts connections.
      writeLog("Fluxo Relapse finalizado; Loader despachado, porta 9021 não verificada", "info");
      window.dispatchEvent(new Event("jarvis:exploit-flow-finished"));
      startButton.textContent = "FLUXO FINALIZADO";
    }).catch((error) => {
      // Explicit terminal marker distinguishes a real rejection from recoverable
      // WebKit "Failed" retry logs and unsupported audio codecs.
      writeLog("ERRO FINAL: " + (error instanceof Error ? error.message : String(error)), "error");
      startButton.textContent = "FALHA · RECARREGUE PARA TENTAR NOVAMENTE";
    }).finally(() => { window.__jarvisExploitActive = false; window.dispatchEvent(new Event('jarvis:execution-ended')); });
  });
} else {
  writeLog("Botão de iniciar não encontrado; exploit não executado", "error");
}
