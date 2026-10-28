import { memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { formatarPace, limitar } from '../lib/pace';
import { vibrar } from '../lib/vibrar';

// Régua deslizante: a rolagem nativa do iPhone (com embalo e encaixe em cada traço)
// escolhe o valor que fica embaixo do marcador do meio.

type Tipo = 'pace' | 'esteira';

interface Props {
  tipo: Tipo;
  min: number;
  max: number;
  valor: number;
  onChange: (v: number) => void;
  onToque?: () => void;
}

const LARGURA: Record<Tipo, number> = { pace: 12, esteira: 14 };

// Pace: número a cada 10 s, traço médio a cada 5 s. Esteira: número a cada 1 km/h, médio no 0,5.
function classe(v: number): 'maior' | 'medio' | 'menor' {
  return v % 10 === 0 ? 'maior' : v % 5 === 0 ? 'medio' : 'menor';
}

function rotulo(tipo: Tipo, v: number): string {
  return tipo === 'pace' ? formatarPace(v) : String(v / 10);
}

const Marcas = memo(function Marcas({ tipo, min, max }: { tipo: Tipo; min: number; max: number }) {
  const itens = [];
  for (let v = min; v <= max; v++) {
    const c = classe(v);
    itens.push(
      <span key={v} className={`marca ${c}${tipo === 'pace' && v % 60 === 0 ? ' cheio' : ''}`}>
        {c === 'maior' && <b>{rotulo(tipo, v)}</b>}
      </span>,
    );
  }
  return <>{itens}</>;
});

export function Regua({ tipo, min, max, valor, onChange, onToque }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const L = LARGURA[tipo];
  // Último valor que a régua mandou (ou recebeu): evita a régua brigar com o próprio valor
  const atual = useRef(valor);
  // Rolagem feita pelo app (botões, favoritos): enquanto anda, não muda o valor no caminho
  const alvo = useRef<number | null>(null);
  const prazo = useRef<number>(0);
  const montado = useRef(false);
  const aoMudar = useRef(onChange);
  aoMudar.current = onChange;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!montado.current) {
      montado.current = true;
      el.scrollLeft = (valor - min) * L;
      return;
    }
    if (valor === atual.current) return;
    atual.current = valor;
    alvo.current = valor;
    clearTimeout(prazo.current);
    prazo.current = window.setTimeout(() => (alvo.current = null), 700);
    el.scrollTo({ left: (valor - min) * L, behavior: 'smooth' });
  }, [valor, min, L]);

  useEffect(() => () => clearTimeout(prazo.current), []);

  const aoRolar = () => {
    const el = ref.current;
    if (!el) return;
    const v = limitar(min + Math.round(el.scrollLeft / L), min, max);
    if (alvo.current !== null) {
      if (v === alvo.current) alvo.current = null;
      return;
    }
    if (v !== atual.current) {
      atual.current = v;
      vibrar();
      aoMudar.current(v);
    }
  };

  const assumir = () => {
    // A pessoa pegou a régua: vale o que estiver embaixo do dedo
    alvo.current = null;
    onToque?.();
  };

  const marcas = useMemo(() => <Marcas tipo={tipo} min={min} max={max} />, [tipo, min, max]);

  return (
    <div className="regua" style={{ ['--l' as string]: `${L}px` }}>
      <div
        ref={ref}
        className="regua-trilho"
        onScroll={aoRolar}
        onTouchStart={assumir}
        onPointerDown={assumir}
        onWheel={assumir}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={valor}
        aria-valuetext={rotulo(tipo, valor)}
        tabIndex={0}
        onKeyDown={(e) => {
          const passo = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
          if (passo) {
            e.preventDefault();
            onChange(limitar(valor + passo, min, max));
          }
        }}
      >
        <span className="regua-borda" />
        {marcas}
        <span className="regua-borda" />
      </div>
      <div className="regua-ponteiro" aria-hidden="true" />
    </div>
  );
}
