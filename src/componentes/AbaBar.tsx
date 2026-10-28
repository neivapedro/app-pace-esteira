import type { ReactNode } from 'react';
import type { Aba } from '../lib/preferencias';
import { vibrar } from '../lib/vibrar';

// Barra de abas flutuante de vidro (estilo iOS 26): a "lente" desliza até a aba escolhida.

const ABAS: { id: Aba; nome: string; icone: ReactNode }[] = [
  {
    id: 'ritmo',
    nome: 'Ritmo',
    icone: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 17a8 8 0 1 1 15 0" />
        <path d="M12 13l4-4" />
        <circle cx="12" cy="13" r="1.4" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'treino',
    nome: 'Treino',
    icone: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17h3l2-6 3 10 3-14 2 10h5" />
      </svg>
    ),
  },
  {
    id: 'metas',
    nome: 'Metas',
    icone: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="4.5" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
      </svg>
    ),
  },
];

export function AbaBar({ aba, onAba }: { aba: Aba; onAba: (a: Aba) => void }) {
  const i = ABAS.findIndex((a) => a.id === aba);
  return (
    <nav className="abas vidro" style={{ ['--i' as string]: i }} aria-label="Seções">
      <span className="abas-lente" aria-hidden="true" />
      {ABAS.map((a) => (
        <button
          key={a.id}
          className={a.id === aba ? 'ativo' : ''}
          aria-current={a.id === aba ? 'page' : undefined}
          onClick={() => {
            if (a.id !== aba) vibrar();
            onAba(a.id);
          }}
        >
          {a.icone}
          <span>{a.nome}</span>
        </button>
      ))}
    </nav>
  );
}
