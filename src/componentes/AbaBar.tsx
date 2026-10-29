import type { ReactNode } from 'react';
import type { Aba } from '../lib/preferencias';
import { vibrar } from '../lib/vibrar';
import { IconeMetas, IconePainel, IconeRitmo, IconeTreino } from './Icones';

// Barra de abas flutuante de vidro (estilo iOS 26): a "lente" desliza até a aba escolhida.

const ABAS: { id: Aba; nome: string; icone: ReactNode }[] = [
  { id: 'ritmo', nome: 'Ritmo', icone: <IconeRitmo /> },
  { id: 'treino', nome: 'Treino', icone: <IconeTreino /> },
  { id: 'metas', nome: 'Metas', icone: <IconeMetas /> },
  { id: 'painel', nome: 'Painel', icone: <IconePainel /> },
];

export function AbaBar({ aba, onAba }: { aba: Aba; onAba: (a: Aba) => void }) {
  const i = ABAS.findIndex((a) => a.id === aba);
  return (
    <nav className="abas vidro" style={{ ['--i' as string]: i, ['--n' as string]: ABAS.length }} aria-label="Seções">
      <span className="abas-lente" aria-hidden="true" />
      {ABAS.map((a) => (
        <button
          key={a.id}
          className={a.id === aba ? 'ativo' : ''}
          aria-current={a.id === aba ? 'page' : undefined}
          onClick={() => {
            if (a.id === aba) return;
            vibrar();
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
