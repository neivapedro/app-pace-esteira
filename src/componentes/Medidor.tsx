import type { ReactNode } from 'react';
import { limitar } from '../lib/pace';

// Velocímetro em volta do número principal: o arco enche conforme a velocidade (3 a 25 km/h).

const CX = 100;
const CY = 100;
const R = 84;
const INICIO = 135;
const ABERTURA = 270;
const MIN = 3;
const MAX = 25;

function ponto(graus: number, r = R) {
  const a = (graus * Math.PI) / 180;
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
}

const a = ponto(INICIO);
const b = ponto(INICIO + ABERTURA);
const ARCO = `M ${a.x} ${a.y} A ${R} ${R} 0 1 1 ${b.x} ${b.y}`;

const TRACOS = Array.from({ length: MAX - MIN + 1 }, (_, i) => {
  const kmh = MIN + i;
  const g = INICIO + ((kmh - MIN) / (MAX - MIN)) * ABERTURA;
  const maior = kmh % 5 === 0;
  const p1 = ponto(g, R + 9);
  const p2 = ponto(g, R + (maior ? 15 : 12));
  return { kmh, maior, p1, p2 };
});

export function Medidor({ kmh, children }: { kmh: number; children: ReactNode }) {
  const pct = limitar((kmh - MIN) / (MAX - MIN), 0, 1);
  const fim = ponto(INICIO + pct * ABERTURA);
  return (
    <div className="medidor">
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <defs>
          <linearGradient id="grad-arco" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" className="arco-cor-1" />
            <stop offset="1" className="arco-cor-2" />
          </linearGradient>
        </defs>
        {TRACOS.map((t) => (
          <line key={t.kmh} x1={t.p1.x} y1={t.p1.y} x2={t.p2.x} y2={t.p2.y} className={t.maior ? 'traco maior' : 'traco'} />
        ))}
        <path d={ARCO} className="arco-fundo" pathLength={100} />
        <path d={ARCO} className="arco-brilho" pathLength={100} style={{ strokeDashoffset: 100 - pct * 100 }} />
        <path d={ARCO} className="arco" pathLength={100} style={{ strokeDashoffset: 100 - pct * 100 }} />
        <circle cx={fim.x} cy={fim.y} r={7} className="arco-ponta" />
      </svg>
      <div className="medidor-miolo">{children}</div>
    </div>
  );
}
