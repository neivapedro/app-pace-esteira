import { flushSync } from 'react-dom';

// Troca de tela com animação (View Transitions do Safari 18+). Sem suporte, troca direto.

type ComTransicao = Document & { startViewTransition?: (f: () => void) => unknown };

export function comTransicao(mudar: () => void): void {
  const d = document as ComTransicao;
  const reduzir = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!d.startViewTransition || reduzir) {
    mudar();
    return;
  }
  d.startViewTransition(() => flushSync(mudar));
}
