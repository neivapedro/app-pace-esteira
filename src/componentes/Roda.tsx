import { useRef } from 'react';
import { useRolagem } from './Regua';

// Roda de seleção no estilo do relógio do iPhone (rolagem vertical com encaixe).

const ALTURA = 44;

interface Props {
  valores: number[];
  valor: number;
  onChange: (v: number) => void;
  formatar?: (v: number) => string;
  rotulo: string;
  sufixo?: string;
}

export function Roda({ valores, valor, onChange, formatar = (v) => String(v).padStart(2, '0'), rotulo, sufixo }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const indice = Math.max(0, valores.indexOf(valor));
  const { aoRolar, assumir } = useRolagem(ref, 'y', ALTURA, indice, valores.length, (i) => onChange(valores[i]));
  return (
    <div className="roda">
      <div
        ref={ref}
        className="roda-lista"
        onScroll={aoRolar}
        onTouchStart={assumir}
        onPointerDown={assumir}
        onWheel={assumir}
        role="spinbutton"
        aria-label={rotulo}
        aria-valuenow={valor}
        tabIndex={0}
        onKeyDown={(e) => {
          const d = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
          if (d) {
            e.preventDefault();
            const i = Math.min(valores.length - 1, Math.max(0, indice + d));
            onChange(valores[i]);
          }
        }}
      >
        <span className="roda-borda" />
        {valores.map((v) => (
          <span key={v} className={`roda-item num ${v === valor ? 'ativo' : ''}`}>
            {formatar(v)}
          </span>
        ))}
        <span className="roda-borda" />
      </div>
      {sufixo && <span className="roda-sufixo">{sufixo}</span>}
    </div>
  );
}

/** Três rodas (horas, minutos, segundos) para escolher um tempo. */
export function RodaTempo({ segundos, onChange, maxHoras = 9 }: { segundos: number; onChange: (s: number) => void; maxHoras?: number }) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = Math.round(segundos % 60);
  const faixa = (n: number) => Array.from({ length: n }, (_, i) => i);
  const juntar = (hh: number, mm: number, ss: number) => onChange(Math.max(1, hh * 3600 + mm * 60 + ss));
  return (
    <div className="rodas">
      <div className="rodas-faixa" aria-hidden="true" />
      <Roda valores={faixa(maxHoras + 1)} valor={h} onChange={(v) => juntar(v, m, s)} formatar={String} rotulo="Horas" sufixo="h" />
      <Roda valores={faixa(60)} valor={m} onChange={(v) => juntar(h, v, s)} rotulo="Minutos" sufixo="min" />
      <Roda valores={faixa(60)} valor={s} onChange={(v) => juntar(h, m, v)} rotulo="Segundos" sufixo="s" />
    </div>
  );
}
