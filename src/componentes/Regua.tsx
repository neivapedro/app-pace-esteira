import { memo, useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import { formatarInclinacao, formatarPace, limitar } from '../lib/pace';
import { vibrar } from '../lib/vibrar';

// Régua deslizante: a rolagem nativa do iPhone (com embalo e encaixe em cada traço)
// escolhe o valor que fica embaixo do marcador do meio.

export interface Escala {
  id: string;
  /** Largura de cada traço (px). */
  largura: number;
  classe: (v: number) => 'maior' | 'medio' | 'menor';
  rotulo: (v: number) => string;
  /** Rótulo em destaque (minuto cheio). */
  destaque?: (v: number) => boolean;
}

const dezCinco = (v: number) => (v % 10 === 0 ? 'maior' : v % 5 === 0 ? 'medio' : 'menor');

/** Pace: número a cada 10 s, traço médio a cada 5 s. */
export const ESCALA_PACE: Escala = { id: 'pace', largura: 12, classe: dezCinco, rotulo: formatarPace, destaque: (v) => v % 60 === 0 };
/** Esteira (décimos): número a cada 1 km/h, médio no 0,5. */
export const ESCALA_ESTEIRA: Escala = { id: 'esteira', largura: 14, classe: dezCinco, rotulo: (v) => String(v / 10) };
/** Inclinação (meios por cento): número a cada 1%. */
export const ESCALA_INCLINACAO: Escala = {
  id: 'inclinacao',
  largura: 16,
  classe: (v) => (v % 2 === 0 ? 'maior' : 'menor'),
  rotulo: (v) => formatarInclinacao(v / 2),
};

export interface FaixaRegua {
  de: number;
  ate: number;
  cor: string;
}

/**
 * Liga uma lista rolável a um índice: a rolagem da pessoa muda o índice, e um índice
 * vindo de fora (botões, salvos) rola até ele sem "brigar" com o valor no caminho.
 */
export function useRolagem(ref: RefObject<HTMLDivElement | null>, eixo: 'x' | 'y', passo: number, indice: number, total: number, aoMudar: (i: number) => void) {
  const atual = useRef(indice);
  const alvo = useRef<number | null>(null);
  const prazo = useRef(0);
  const montado = useRef(false);
  const cb = useRef(aoMudar);
  cb.current = aoMudar;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const pos = indice * passo;
    if (!montado.current) {
      montado.current = true;
      if (eixo === 'x') el.scrollLeft = pos;
      else el.scrollTop = pos;
      return;
    }
    if (indice === atual.current) return;
    atual.current = indice;
    alvo.current = indice;
    clearTimeout(prazo.current);
    prazo.current = window.setTimeout(() => (alvo.current = null), 700);
    el.scrollTo(eixo === 'x' ? { left: pos, behavior: 'smooth' } : { top: pos, behavior: 'smooth' });
  }, [indice, passo, eixo, ref]);

  useEffect(() => () => clearTimeout(prazo.current), []);

  const aoRolar = () => {
    const el = ref.current;
    if (!el) return;
    const i = limitar(Math.round((eixo === 'x' ? el.scrollLeft : el.scrollTop) / passo), 0, total - 1);
    if (alvo.current !== null) {
      if (i === alvo.current) alvo.current = null;
      return;
    }
    if (i !== atual.current) {
      atual.current = i;
      vibrar();
      cb.current(i);
    }
  };

  // A pessoa pegou a lista: vale o que estiver embaixo do dedo
  const assumir = () => (alvo.current = null);

  return { aoRolar, assumir };
}

const Marcas = memo(function Marcas({ escala, min, max }: { escala: Escala; min: number; max: number }) {
  const itens = [];
  for (let v = min; v <= max; v++) {
    const c = escala.classe(v);
    itens.push(
      <span key={v} className={`marca ${c}${escala.destaque?.(v) ? ' cheio' : ''}`}>
        {c === 'maior' && <b>{escala.rotulo(v)}</b>}
      </span>,
    );
  }
  return <>{itens}</>;
});

interface Props {
  escala: Escala;
  min: number;
  max: number;
  valor: number;
  onChange: (v: number) => void;
  onToque?: () => void;
  faixas?: FaixaRegua[];
}

export function Regua({ escala, min, max, valor, onChange, onToque, faixas }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const L = escala.largura;
  const { aoRolar, assumir } = useRolagem(ref, 'x', L, valor - min, max - min + 1, (i) => onChange(min + i));
  const marcas = useMemo(() => <Marcas escala={escala} min={min} max={max} />, [escala, min, max]);

  const pegar = () => {
    assumir();
    onToque?.();
  };

  return (
    <div className="regua" style={{ ['--l' as string]: `${L}px` }}>
      <div
        ref={ref}
        className="regua-trilho"
        onScroll={aoRolar}
        onTouchStart={pegar}
        onPointerDown={pegar}
        onWheel={pegar}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={valor}
        aria-valuetext={escala.rotulo(valor)}
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
        {faixas?.map((f, i) => {
          const de = limitar(Math.min(f.de, f.ate), min, max);
          const ate = limitar(Math.max(f.de, f.ate), min, max);
          if (ate <= de) return null;
          return (
            <i
              key={i}
              className="regua-faixa"
              style={{ left: `calc(50% - ${L / 2}px + ${(de - min) * L}px)`, width: (ate - de + 1) * L, background: f.cor }}
            />
          );
        })}
      </div>
      <div className="regua-ponteiro" aria-hidden="true" />
    </div>
  );
}
