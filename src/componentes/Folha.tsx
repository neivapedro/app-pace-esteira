import { useEffect, useRef, useState, type ReactNode } from 'react';

// Folha que sobe de baixo (como no iPhone). Fecha no fundo, no Esc ou puxando a alça para baixo.

interface Props {
  titulo: string;
  onFechar: () => void;
  children: (fechar: () => void) => ReactNode;
  cheia?: boolean;
}

export function Folha({ titulo, onFechar, children, cheia }: Props) {
  const [saindo, setSaindo] = useState(false);
  const [puxado, setPuxado] = useState(0);
  const inicio = useRef<number | null>(null);
  const aoFechar = useRef(onFechar);
  aoFechar.current = onFechar;

  const fechar = () => {
    setSaindo(true);
    setTimeout(() => aoFechar.current(), 220);
  };

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && fechar();
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, []);

  return (
    <div className={`folha-fundo ${saindo ? 'saindo' : ''}`} onClick={fechar}>
      <div
        className={`folha vidro ${cheia ? 'cheia' : ''}`}
        role="dialog"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
        style={puxado ? { transform: `translateY(${puxado}px)`, transition: 'none' } : undefined}
      >
        <div
          className="folha-topo"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            inicio.current = e.clientY;
          }}
          onPointerMove={(e) => inicio.current !== null && setPuxado(Math.max(0, e.clientY - inicio.current))}
          onPointerUp={() => {
            inicio.current = null;
            if (puxado > 90) fechar();
            setPuxado(0);
          }}
          onPointerCancel={() => {
            inicio.current = null;
            setPuxado(0);
          }}
        >
          <span className="folha-alca" />
          <h2>{titulo}</h2>
        </div>
        <div className="folha-corpo">{children(fechar)}</div>
      </div>
    </div>
  );
}
