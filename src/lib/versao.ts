// Funciona sem internet (service worker) e se atualiza sozinho quando há versão nova no ar.

export function registrarServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });

  // O iPhone costuma reabrir o app de onde parou, sem recarregar. Ao voltar para ele,
  // confere a versão no ar e recarrega se mudou (os valores ficam guardados no celular).
  let conferindo = false;
  const conferir = () => {
    if (conferindo || !navigator.onLine) return;
    conferindo = true;
    fetch(`${import.meta.env.BASE_URL}versao.json?t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((v: { versao?: string } | null) => {
        if (v?.versao && v.versao !== __VERSAO_APP__) location.reload();
      })
      .catch(() => {})
      .finally(() => (conferindo = false));
  };
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && conferir());
}
