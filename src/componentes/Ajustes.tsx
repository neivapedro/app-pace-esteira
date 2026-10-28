import { useEffect, useState } from 'react';
import type { UnidadeEsteira, UnidadePace } from '../lib/pace';
import type { Preferencias } from '../lib/preferencias';
import { vibrar } from '../lib/vibrar';

interface Props {
  p: Preferencias;
  onFechar: () => void;
  onUnidadePace: (u: UnidadePace) => void;
  onUnidadeEsteira: (u: UnidadeEsteira) => void;
  onVibracao: (v: boolean) => void;
}

export function Ajustes({ p, onFechar, onUnidadePace, onUnidadeEsteira, onVibracao }: Props) {
  const [saindo, setSaindo] = useState(false);
  const fechar = () => {
    setSaindo(true);
    setTimeout(onFechar, 220);
  };

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && fechar();
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  });

  return (
    <div className={`folha-fundo ${saindo ? 'saindo' : ''}`} onClick={fechar}>
      <div className="folha" role="dialog" aria-label="Ajustes" onClick={(e) => e.stopPropagation()}>
        <span className="folha-alca" />
        <h2>Ajustes</h2>

        <div className="linha">
          <span>Pace em</span>
          <Opcoes
            valor={p.unidadePace}
            opcoes={[
              ['km', 'min/km'],
              ['mi', 'min/milha'],
            ]}
            onChange={onUnidadePace}
          />
        </div>

        <div className="linha">
          <span>Esteira em</span>
          <Opcoes
            valor={p.unidadeEsteira}
            opcoes={[
              ['kmh', 'km/h'],
              ['mph', 'mph'],
            ]}
            onChange={onUnidadeEsteira}
          />
        </div>

        <label className="linha">
          <span>Vibrar ao ajustar</span>
          <input type="checkbox" className="chave" checked={p.vibracao} onChange={(e) => onVibracao(e.target.checked)} />
        </label>

        <div className="nota">
          <strong>Dica de treino</strong>
          <p>Na esteira não há vento nem subida. Muitos corredores usam 1% de inclinação para chegar mais perto do esforço da rua.</p>
        </div>

        <div className="nota">
          <strong>Deixar na Tela de Início</strong>
          <p>
            No Safari, toque em <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>. O app abre em tela cheia e funciona sem internet.
          </p>
        </div>

        <p className="versao">Versão {__VERSAO_APP__}</p>
        <button className="folha-ok" onClick={fechar}>
          Pronto
        </button>
      </div>
    </div>
  );
}

function Opcoes<T extends string>({ valor, opcoes, onChange }: { valor: T; opcoes: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="opcoes">
      {opcoes.map(([v, nome]) => (
        <button
          key={v}
          className={v === valor ? 'ativo' : ''}
          onClick={() => {
            vibrar();
            onChange(v);
          }}
        >
          {nome}
        </button>
      ))}
    </div>
  );
}
