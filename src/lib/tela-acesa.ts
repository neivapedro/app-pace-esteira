// Mantém a tela acesa enquanto o app está aberto (Screen Wake Lock, iOS 16.4+ na Tela de Início).

let pedido = false;
let trava: WakeLockSentinel | null = null;

async function travar(): Promise<void> {
  if (!pedido || trava || document.visibilityState !== 'visible' || !('wakeLock' in navigator)) return;
  try {
    trava = await navigator.wakeLock.request('screen');
    trava.addEventListener('release', () => (trava = null));
  } catch {
    trava = null;
  }
}

export function manterTelaAcesa(sim: boolean): void {
  pedido = sim;
  if (sim) void travar();
  else {
    void trava?.release();
    trava = null;
  }
}

if (typeof document !== 'undefined') {
  // O iPhone solta a trava quando o app vai para o fundo: pega de novo ao voltar
  document.addEventListener('visibilitychange', () => void travar());
}
