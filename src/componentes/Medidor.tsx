import { useRef, type ReactNode } from 'react';
import { limitar } from '../lib/pace';

// Velocímetro em volta do número principal: o arco enche conforme a velocidade (3 a 25 km/h).
// Dá para girar com o dedo, como um botão de volume: sentido horário = mais rápido.

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

const GRAUS_POR_PASSO = 4;

export function Medidor({ kmh, children, onGirar }: { kmh: number; children: ReactNode; onGirar?: (passos: number) => void }) {
  const pct = limitar((kmh - MIN) / (MAX - MIN), 0, 1);
  const fim = ponto(INICIO + pct * ABERTURA);
  const ref = useRef<HTMLDivElement>(null);
  const giro = useRef<{ angulo: number; resto: number } | null>(null);

  const angulo = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI;
  };

  return (
    <div
      ref={ref}
      className={`medidor ${onGirar ? 'giravel' : ''}`}
      onPointerDown={(e) => {
        if (!onGirar) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        giro.current = { angulo: angulo(e), resto: 0 };
      }}
      onPointerMove={(e) => {
        const g = giro.current;
        if (!g || !onGirar) return;
        const a = angulo(e);
        let d = a - g.angulo;
        if (d > 180) d -= 360;
        if (d < -180) d += 360;
        g.angulo = a;
        g.resto += d;
        const passos = Math.trunc(g.resto / GRAUS_POR_PASSO);
        if (passos) {
          g.resto -= passos * GRAUS_POR_PASSO;
          onGirar(passos);
        }
      }}
      onPointerUp={() => (giro.current = null)}
      onPointerCancel={() => (giro.current = null)}
    >
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
