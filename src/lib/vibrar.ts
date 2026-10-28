// Toque leve a cada mudança de valor.
// Android: navigator.vibrate. iPhone (iOS 18+): o Safari não tem vibrate, mas dá um toque
// ao clicar num <input type="checkbox" switch>; o clique precisa vir de um gesto da pessoa.

let ativo = true;
let ultimo = 0;

export function definirVibracao(v: boolean): void {
  ativo = v;
}

export function vibrar(): void {
  if (!ativo) return;
  const agora = performance.now();
  if (agora - ultimo < 40) return;
  ultimo = agora;
  try {
    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate(6);
      return;
    }
    const rotulo = document.createElement('label');
    rotulo.ariaHidden = 'true';
    rotulo.style.display = 'none';
    const chave = document.createElement('input');
    chave.type = 'checkbox';
    chave.setAttribute('switch', '');
    rotulo.appendChild(chave);
    document.head.appendChild(rotulo);
    rotulo.click();
    rotulo.remove();
  } catch {
    /* sem vibração neste aparelho */
  }
}
