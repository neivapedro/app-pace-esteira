import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { limitar } from '../lib/pace';
import type { Etapa } from '../lib/treino';
import { vibrar } from '../lib/vibrar';
import { zonaProxima, type Zona } from '../lib/zonas';

// Gráficos do app (estilo painel): perfil do treino, rosca, linha, colunas,
// minigráfico, espectro de zonas e medidor de indicador.

/** Largura real do elemento (para desenhar o SVG em pixels, sem distorcer). */
function useLargura<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

// ---------- Perfil do treino ----------

const ALFA: Record<Etapa['intensidade'], number> = { leve: 45, ritmo: 72, forte: 100 };

/** Barras do treino: largura = duração, altura = velocidade, cor = zona (ou intensidade). */
export function PerfilTreino({
  etapas,
  zonas,
  progresso,
  mini,
}: {
  etapas: Pick<Etapa, 'pace' | 'segundos' | 'intensidade'>[];
  zonas: Zona[] | null;
  progresso?: number;
  mini?: boolean;
}) {
  if (!etapas.length) return <div className={`perfil ${mini ? 'perfil-mini' : ''}`} />;
  const v = etapas.map((e) => 3600 / e.pace);
  const vmin = Math.min(...v);
  const vmax = Math.max(...v);
  const total = etapas.reduce((s, e) => s + e.segundos, 0);
  let inicio = 0;
  return (
    <div className={`perfil ${mini ? 'perfil-mini' : ''}`} aria-hidden="true">
      {etapas.map((e, i) => {
        const altura = vmax === vmin ? 70 : 28 + (72 * (v[i] - vmin)) / (vmax - vmin);
        const cor = zonas ? zonaProxima(zonas, e.pace).cor : `color-mix(in srgb, var(--cor) ${ALFA[e.intensidade]}%, transparent)`;
        const fill = progresso === undefined ? 100 : limitar(((progresso - inicio) / e.segundos) * 100, 0, 100);
        inicio += e.segundos;
        return <i key={i} style={{ flexGrow: e.segundos, height: `${altura}%`, ['--c' as string]: cor, ['--f' as string]: `${fill}%` }} />;
      })}
      {progresso !== undefined && <b className="perfil-marca" style={{ left: `${limitar((progresso / total) * 100, 0, 100)}%` }} />}
    </div>
  );
}

// ---------- Rosca ----------

export interface Fatia {
  nome: string;
  cor: string;
  valor: number;
}

export function Rosca({ fatias, centro, tam = 150 }: { fatias: Fatia[]; centro?: ReactNode; tam?: number }) {
  const total = fatias.reduce((s, f) => s + f.valor, 0) || 1;
  const R = 40;
  const vao = fatias.length > 1 ? 1.2 : 0;
  let acum = 0;
  return (
    <div className="rosca" style={{ width: tam, height: tam }}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={R} className="rosca-fundo" />
        {fatias.map((f, i) => {
          const pct = (f.valor / total) * 100;
          const el = (
            <circle
              key={i}
              cx="50"
              cy="50"
              r={R}
              pathLength={100}
              className="rosca-fatia"
              style={{ stroke: f.cor, strokeDasharray: `${Math.max(0, pct - vao)} ${100 - Math.max(0, pct - vao)}`, strokeDashoffset: -acum, animationDelay: `${i * 80}ms` }}
            />
          );
          acum += pct;
          return el;
        })}
      </svg>
      {centro && <div className="rosca-centro">{centro}</div>}
    </div>
  );
}

export function Legenda({ fatias, formatar }: { fatias: Fatia[]; formatar: (v: number) => string }) {
  const total = fatias.reduce((s, f) => s + f.valor, 0) || 1;
  return (
    <ul className="legenda">
      {fatias.map((f) => (
        <li key={f.nome}>
          <i style={{ background: f.cor }} />
          <span>{f.nome}</span>
          <b className="num">{formatar(f.valor)}</b>
          <small className="num">{Math.round((f.valor / total) * 100)}%</small>
        </li>
      ))}
    </ul>
  );
}

// ---------- Linha (com balão ao tocar) ----------

export interface Ponto {
  y: number;
  rotulo: string;
  valor: string;
}

export function Linha({ pontos, altura = 150, inverter }: { pontos: Ponto[]; altura?: number; inverter?: boolean }) {
  const [ref, w] = useLargura<HTMLDivElement>();
  const [sel, setSel] = useState<number | null>(null);
  const pad = { t: 30, b: 24, l: 10, r: 10 };
  const ys = pontos.map((p) => p.y);
  let ymin = Math.min(...ys);
  let ymax = Math.max(...ys);
  if (ymin === ymax) {
    ymin -= 1;
    ymax += 1;
  }
  const folga = (ymax - ymin) * 0.12;
  ymin -= folga;
  ymax += folga;
  const x = (i: number) => (pontos.length === 1 ? w / 2 : pad.l + (i * (w - pad.l - pad.r)) / (pontos.length - 1));
  const y = (v: number) => {
    const t = (v - ymin) / (ymax - ymin);
    return pad.t + (inverter ? t : 1 - t) * (altura - pad.t - pad.b);
  };
  const caminho = pontos.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join(' ');
  const area = `${caminho} L${x(pontos.length - 1)},${altura - pad.b} L${x(0)},${altura - pad.b} Z`;

  const tocar = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    let melhor = 0;
    pontos.forEach((_, i) => {
      if (Math.abs(x(i) - px) < Math.abs(x(melhor) - px)) melhor = i;
    });
    if (melhor !== sel) vibrar();
    setSel(melhor);
  };

  return (
    <div
      ref={ref}
      className="linha-grafico"
      style={{ height: altura }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        tocar(e);
      }}
      onPointerMove={(e) => e.buttons && tocar(e)}
      onPointerUp={() => setTimeout(() => setSel(null), 1600)}
    >
      {w > 0 && pontos.length > 0 && (
        <svg width={w} height={altura} aria-hidden="true">
          <defs>
            <linearGradient id="grad-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" className="area-cor-1" />
              <stop offset="1" className="area-cor-2" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((t) => (
            <line key={t} x1={pad.l} x2={w - pad.r} y1={pad.t + t * (altura - pad.t - pad.b)} y2={pad.t + t * (altura - pad.t - pad.b)} className="grade" />
          ))}
          {pontos.length > 1 && <path d={area} fill="url(#grad-area)" className="linha-area" />}
          {pontos.length > 1 && <path d={caminho} className="linha-traco" pathLength={1} />}
          {pontos.map((p, i) => (
            <circle key={i} cx={x(i)} cy={y(p.y)} r={sel === i ? 6 : 3.5} className={`linha-ponto ${sel === i ? 'sel' : ''}`} />
          ))}
          {pontos.length <= 4 &&
            sel === null &&
            pontos.map((p, i) => (
              <text key={`v${i}`} x={x(i)} y={y(p.y) - 12} className="linha-valor" textAnchor={i === 0 ? 'start' : i === pontos.length - 1 ? 'end' : 'middle'}>
                {p.valor.split(' · ')[0]}
              </text>
            ))}
          {pontos.map((p, i) => (
            <text key={`t${i}`} x={x(i)} y={altura - 6} className="linha-rotulo" textAnchor="middle">
              {p.rotulo}
            </text>
          ))}
          {sel !== null && <line x1={x(sel)} x2={x(sel)} y1={pad.t - 6} y2={altura - pad.b} className="linha-guia" />}
        </svg>
      )}
      {sel !== null && w > 0 && (
        <div className="balao vidro" style={{ left: limitar(x(sel), 50, w - 50) }}>
          <small>{pontos[sel].rotulo}</small>
          <b className="num">{pontos[sel].valor}</b>
        </div>
      )}
    </div>
  );
}

// ---------- Colunas ----------

export interface Coluna {
  valor: number;
  rotulo: string;
  texto: string;
  destaque?: boolean;
}

export function Colunas({ itens, altura = 140 }: { itens: Coluna[]; altura?: number }) {
  const [sel, setSel] = useState<number | null>(null);
  const max = Math.max(...itens.map((i) => i.valor), 0.0001);
  useEffect(() => {
    if (sel === null) return;
    const t = setTimeout(() => setSel(null), 2200);
    return () => clearTimeout(t);
  }, [sel]);
  return (
    <div className="colunas" style={{ height: altura }}>
      {itens.map((c, i) => (
        <button
          key={i}
          className={`coluna ${c.destaque ? 'destaque' : ''} ${sel === i ? 'sel' : ''}`}
          onClick={() => {
            vibrar();
            setSel(i);
          }}
          aria-label={`${c.rotulo}: ${c.texto}`}
        >
          <span className="coluna-valor num">{sel === i || (sel === null && c.destaque) ? c.texto : ''}</span>
          <span className="coluna-barra" style={{ height: `${Math.max(2, (c.valor / max) * 100)}%`, animationDelay: `${i * 50}ms` }} />
          <span className="coluna-rotulo">{c.rotulo}</span>
        </button>
      ))}
    </div>
  );
}

// ---------- Minigráfico ----------

export function Mini({ valores }: { valores: number[] }) {
  if (valores.length < 2) return null;
  const max = Math.max(...valores);
  const min = Math.min(...valores);
  const pts = valores.map((v, i) => `${(i / (valores.length - 1)) * 100},${28 - (max === min ? 12 : ((v - min) / (max - min)) * 24)}`);
  return (
    <svg className="mini-grafico" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts.join(' ')} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// ---------- Espectro de zonas ----------

export interface Marcador {
  pace: number; // s/km
  rotulo: string;
}

/** As zonas lado a lado numa régua de pace (devagar à esquerda, rápido à direita). */
export function EspectroZonas({ zonas, marcadores, formatar }: { zonas: Zona[]; marcadores: Marcador[]; formatar: (segPorKm: number) => string }) {
  const lento = Math.max(...zonas.map((z) => z.lento)) + 20;
  const rapido = Math.min(...zonas.map((z) => z.rapido)) - 10;
  const pos = (pace: number) => limitar(((lento - pace) / (lento - rapido)) * 100, 0, 100);
  return (
    <div className="espectro">
      <div className="espectro-trilho">
        {zonas.map((z) => (
          <i key={z.id} style={{ left: `${pos(z.lento)}%`, width: `${pos(z.rapido) - pos(z.lento)}%`, background: z.cor, ['--zc' as string]: z.cor }} />
        ))}
        {marcadores.map((m) => (
          <span key={m.rotulo} className={`espectro-marca ${pos(m.pace) < 15 ? 'borda-esq' : pos(m.pace) > 85 ? 'borda-dir' : ''}`} style={{ left: `${pos(m.pace)}%` }}>
            <b>
              {m.rotulo} <span className="num">{formatar(m.pace)}</span>
            </b>
          </span>
        ))}
      </div>
      <div className="espectro-eixo num">
        <span>{formatar(lento)}</span>
        <span>mais rápido →</span>
        <span>{formatar(rapido)}</span>
      </div>
      <div className="espectro-legenda">
        {zonas.map((z) => (
          <span key={z.id}>
            <i style={{ background: z.cor }} />
            {z.nome}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------- Medidor de indicador (meio círculo) ----------

export function ArcoKpi({ valor, min, max, texto }: { valor: number; min: number; max: number; texto: string }) {
  const pct = limitar((valor - min) / (max - min), 0, 1);
  const R = 40;
  const arco = `M ${50 - R} 52 A ${R} ${R} 0 0 1 ${50 + R} 52`;
  return (
    <div className="arco-kpi">
      <svg viewBox="0 0 100 58" aria-hidden="true">
        <path d={arco} className="kpi-fundo" pathLength={100} />
        <path d={arco} className="kpi-cor" pathLength={100} style={{ strokeDasharray: `${pct * 100} 100` }} />
      </svg>
      <b className="num">{texto}</b>
    </div>
  );
}
