import { useEffect, useRef, type ReactNode } from 'react';
import { vibrar } from '../lib/vibrar';

/** Botão que repete enquanto fica pressionado (e acelera). */
export function Repetidor({ onPasso, rotulo, children, className = 'passo' }: { onPasso: () => void; rotulo: string; children: ReactNode; className?: string }) {
  const passo = useRef(onPasso);
  passo.current = onPasso;
  const timer = useRef<number>(0);

  const parar = () => clearTimeout(timer.current);
  const iniciar = (e: React.PointerEvent) => {
    e.preventDefault();
    parar();
    vibrar();
    passo.current();
    let espera = 380;
    const repetir = () => {
      passo.current();
      vibrar();
      espera = Math.max(45, espera * 0.8);
      timer.current = window.setTimeout(repetir, espera);
    };
    timer.current = window.setTimeout(repetir, espera);
  };

  useEffect(() => parar, []);

  return (
    <button
      type="button"
      className={className}
      aria-label={rotulo}
      onPointerDown={iniciar}
      onPointerUp={parar}
      onPointerLeave={parar}
      onPointerCancel={parar}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPasso();
        }
      }}
    >
      {children}
    </button>
  );
}
