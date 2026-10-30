import { useEffect, useState } from 'react';
import { vibrar } from '../lib/vibrar';

// Confirmação e avisos no estilo do app (no lugar do alerta padrão do navegador).
// confirmar() abre uma folha com duas opções; avisar() mostra um aviso curto com "Desfazer".

interface Pedido {
  titulo: string;
  texto?: string;
  confirmar: string;
  perigo?: boolean;
  resolver: (ok: boolean) => void;
}

interface Aviso {
  id: number;
  texto: string;
  desfazer?: () => void;
}

let abrirPedido: ((p: Pedido) => void) | null = null;
let mostrarAviso: ((a: Aviso) => void) | null = null;

export function confirmar(o: Omit<Pedido, 'resolver'>): Promise<boolean> {
  return new Promise((resolver) => {
    if (abrirPedido) abrirPedido({ ...o, resolver });
    else resolver(window.confirm(o.titulo));
  });
}

export function avisar(texto: string, desfazer?: () => void): void {
  mostrarAviso?.({ id: Date.now(), texto, desfazer });
}

export function AvisosHost() {
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  useEffect(() => {
    abrirPedido = setPedido;
    mostrarAviso = setAviso;
    return () => {
      abrirPedido = null;
      mostrarAviso = null;
    };
  }, []);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), aviso.desfazer ? 5000 : 2400);
    return () => clearTimeout(t);
  }, [aviso]);

  const responder = (ok: boolean) => {
    vibrar();
    pedido?.resolver(ok);
    setPedido(null);
  };

  return (
    <>
      {pedido && (
        <div className="pedido-fundo" onClick={() => responder(false)}>
          <div className="pedido" role="alertdialog" aria-label={pedido.titulo} onClick={(e) => e.stopPropagation()}>
            <div className="pedido-cartao vidro">
              <b>{pedido.titulo}</b>
              {pedido.texto && <p>{pedido.texto}</p>}
              <button className={`folha-ok ${pedido.perigo ? 'perigo' : ''}`} onClick={() => responder(true)}>
                {pedido.confirmar}
              </button>
            </div>
            <button className="botao-secundario vidro" onClick={() => responder(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
      {aviso && (
        <div key={aviso.id} className={`aviso vidro ${aviso.desfazer ? '' : 'sem-acao'}`} role="status">
          <span>{aviso.texto}</span>
          {aviso.desfazer && (
            <button
              onClick={() => {
                vibrar();
                aviso.desfazer?.();
                setAviso(null);
              }}
            >
              Desfazer
            </button>
          )}
        </div>
      )}
    </>
  );
}
