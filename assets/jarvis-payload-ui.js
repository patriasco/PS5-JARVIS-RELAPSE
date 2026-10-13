// PS5 JARVIS | Seletor manual + autostart opcional (LIGADO por padrão).
// Sem autoload no page load, sem repetir USERLAND/KERNEL e sem alterar o ELF instalado.
// Somente a conclusão real do fluxo Relapse dispara o modo automático.
(function () {
  'use strict';
  const STORE_KEY = 'jarvis:pldmgr:auto:v1';
  const openButton = document.getElementById('btnPayloadMode');
  const panel = document.getElementById('payloadPanel');
  const launch = document.getElementById('payloadStartPLD');
  const closeButton = document.getElementById('payloadCancel');
  const status = document.getElementById('payloadStatus');
  const manager = document.getElementById('payloadOpenManager');
  const toggle = document.getElementById('payloadAutoToggle');
  const hint = document.getElementById('payloadAutoHint');
  const autoStatus = document.getElementById('payloadAutoStatus');
  if (!openButton || !panel || !launch || !closeButton || !status ||
      !manager || !toggle || !hint || !autoStatus) return;

  let autoEnabled = true; // Primeiro acesso = AUTOMÁTICO LIGADO.
  let busy = false, flowFinished = false, submissionLocked = false, autoAttempted = false;
  try { autoEnabled = window.localStorage.getItem(STORE_KEY) !== 'off'; }
  catch (_) { /* navegador sem storage: automático segue como padrão da sessão */ }

  function reportStatus(message, state) {
    status.textContent = message;
    status.setAttribute('data-state', state || 'idle');
    autoStatus.textContent = message;
    autoStatus.setAttribute('data-state', state || 'idle');
  }
  function renderPreference() {
    toggle.setAttribute('aria-checked', autoEnabled ? 'true' : 'false');
    toggle.textContent = 'PLD MANAGER AUTOMÁTICO: ' + (autoEnabled ? 'LIGADO' : 'DESLIGADO');
    hint.textContent = autoEnabled
      ? 'Após INICIAR DESBLOQUEIO, o JARVIS solicita o PLD Manager automaticamente.'
      : 'Modo manual: após desbloquear, abra PAYLOADS e clique EXECUTAR.';
  }
  function logStatus(message, type) {
    if (typeof window.writeLog === 'function')
      window.writeLog('PAYLOADS: ' + message, type || 'info');
  }
  function canRun() {
    return flowFinished && !busy && !submissionLocked &&
      !window.__jarvisPayloadSubmissionStarted && !window.__jarvisPayloadBusy &&
      typeof window.__jarvisPayloadSender === 'function';
  }
  function refreshButtons() {
    launch.disabled = !canRun();
    closeButton.disabled = busy;
    toggle.disabled = busy;
  }
  function openMenu() {
    if (openButton.disabled || openButton.hidden || !flowFinished) return;
    panel.style.display = 'flex';
    panel.setAttribute('aria-hidden', 'false');
    refreshButtons();
    closeButton.focus();
  }
  function closeMenu() {
    if (busy) return;
    panel.style.display = 'none';
    panel.setAttribute('aria-hidden', 'true');
    openButton.focus();
  }

  async function requestPLD(origin) {
    if (!canRun()) return;
    busy = true;
    refreshButtons();
    reportStatus(origin === 'auto'
      ? 'Automático: verificando PLD Manager 8084 e ELF Loader 9021...'
      : 'Manual: verificando PLD Manager 8084 e ELF Loader 9021...', 'busy');
    try {
      // Mesmo sender comprovado no modo manual. Não chama run()/main() outra vez.
      const result = await window.__jarvisPayloadSender('pldmgr', function (message) {
        reportStatus(String(message), 'busy');
        logStatus(String(message), 'info');
      });
      if (result.alreadyRunning) {
        submissionLocked = true;
        reportStatus('Serviço na porta 8084 já acessível. Nenhum comando foi enviado novamente. Processo não identificado diretamente.', 'ok');
      } else if (result.commandSent && result.managerReady) {
        submissionLocked = true;
        reportStatus('Comando enviado ao Loader; porta 8084 acessível. Execução do ELF não comprovada diretamente.', 'ok');
      } else if (result.commandSent) {
        submissionLocked = true;
        reportStatus('Comando enviado ao Loader; serviço 8084 não respondeu. Execução não confirmada.', 'error');
      } else {
        reportStatus('O envio do comando não foi confirmado.', 'error');
      }
      if (result.managerReady) manager.style.display = 'block';
      logStatus(status.textContent, result.managerReady ? 'success' : 'info');
    } catch (error) {
      // Um erro antes de write permite tentativa MANUAL; depois de write, não repetir.
      submissionLocked = !!window.__jarvisPayloadSubmissionStarted;
      const detail = String(error && error.message || error);
      reportStatus('Falha ao solicitar PLD Manager: ' + detail +
        (submissionLocked ? ' Não repetir nesta sessão.' : ' Abra PAYLOADS para tentar manualmente.'), 'error');
      logStatus(status.textContent, 'error');
    } finally {
      busy = false;
      refreshButtons();
    }
  }

  toggle.addEventListener('click', function () {
    if (busy) return;
    autoEnabled = !autoEnabled;
    try { window.localStorage.setItem(STORE_KEY, autoEnabled ? 'on' : 'off'); }
    catch (_) { autoStatus.textContent = 'Preferência não pôde ser salva neste navegador; válida apenas nesta página.'; }
    renderPreference();
    if (flowFinished) {
      // Alterar a configuração depois do fluxo não dispara carga inesperada.
      reportStatus('Preferência atualizada. Válida para o próximo desbloqueio; nesta sessão use PAYLOADS.', 'idle');
    }
  });
  openButton.addEventListener('click', openMenu);
  closeButton.addEventListener('click', closeMenu);
  launch.addEventListener('click', function () { requestPLD('manual'); });

  window.addEventListener('keydown', function (event) {
    if (panel.style.display !== 'flex') return;
    if (event.key === 'Escape' && !busy) { event.preventDefault(); closeMenu(); }
    if (event.key !== 'Tab') return;
    const focusables = [launch, manager, closeButton].filter(function (el) {
      return !el.disabled && el.style.display !== 'none';
    });
    if (!focusables.length) return;
    if (event.shiftKey && document.activeElement === focusables[0]) {
      event.preventDefault(); focusables[focusables.length - 1].focus();
    } else if (!event.shiftKey && document.activeElement === focusables[focusables.length - 1]) {
      event.preventDefault(); focusables[0].focus();
    }
  });

  window.addEventListener('jarvis:exploit-flow-finished', function () {
    if (flowFinished) return; // Ignore event duplicado.
    if (typeof window.__jarvisPayloadSender !== 'function') {
      reportStatus('Fluxo concluído sem o contexto de payloads; envio não iniciado.', 'error');
      return;
    }
    flowFinished = true;
    refreshButtons();
    if (autoEnabled && !autoAttempted) {
      autoAttempted = true;
      requestPLD('auto');
    } else if (!autoEnabled) {
      reportStatus('Modo manual selecionado. Abra PAYLOADS para escolher EXECUTAR.', 'idle');
    }
  });

  renderPreference();
  refreshButtons();
})();
