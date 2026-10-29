import type { Etapa } from './treino';
import { zonaProxima, type Zona } from './zonas';

// Histórico de treinos feitos e da evolução do índice de forma, para o Painel.

export interface TrechoFeito {
  pace: number; // s/km
  segundos: number;
  intensidade: Etapa['intensidade'];
}

export interface Registro {
  id: string;
  data: number; // ms
  nome: string;
  segundos: number;
  metros: number;
  concluido: boolean;
  trechos: TrechoFeito[];
}

export interface PontoNivel {
  data: number;
  vdot: number;
}

/** O que foi feito até o segundo `ate` do treino (tudo, se terminou). */
export function registrar(nome: string, etapas: Etapa[], ate: number, data: number, id: string): Registro {
  const trechos: TrechoFeito[] = [];
  let metros = 0;
  for (const e of etapas) {
    if (e.inicio >= ate) break;
    const seg = Math.min(e.segundos, ate - e.inicio);
    trechos.push({ pace: e.pace, segundos: Math.round(seg), intensidade: e.intensidade });
    metros += e.metros * (seg / e.segundos);
  }
  const total = etapas.reduce((s, e) => s + e.segundos, 0);
  return {
    id,
    data,
    nome,
    segundos: Math.round(trechos.reduce((s, t) => s + t.segundos, 0)),
    metros: Math.round(metros),
    concluido: ate >= total - 1,
    trechos,
  };
}

/** Segunda-feira 0h da semana de `t` (horário local). */
export function inicioDaSemana(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  const dia = (d.getDay() + 6) % 7; // segunda = 0
  d.setDate(d.getDate() - dia);
  return d.getTime();
}

export interface Semana {
  inicio: number;
  km: number;
  segundos: number;
  treinos: number;
}

/** As últimas `n` semanas (a última é a atual), da mais antiga para a mais nova. */
export function semanas(h: Registro[], agora: number, n = 8): Semana[] {
  const atual = inicioDaSemana(agora);
  const lista: Semana[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(atual);
    d.setDate(d.getDate() - 7 * i);
    lista.push({ inicio: d.getTime(), km: 0, segundos: 0, treinos: 0 });
  }
  for (const r of h) {
    const s = lista.find((x, i) => r.data >= x.inicio && (i === lista.length - 1 || r.data < lista[i + 1].inicio));
    if (!s) continue;
    s.km += r.metros / 1000;
    s.segundos += r.segundos;
    s.treinos += 1;
  }
  return lista;
}

/** Variação em % (null se não dá para comparar). */
export function variacao(atual: number, anterior: number): number | null {
  if (anterior <= 0) return null;
  return ((atual - anterior) / anterior) * 100;
}

export interface FatiaZona {
  id: string;
  nome: string;
  cor: string;
  segundos: number;
}

const INTENSIDADES: Record<TrechoFeito['intensidade'], { nome: string; cor: string }> = {
  leve: { nome: 'Leve', cor: '#3ddc97' },
  ritmo: { nome: 'Ritmo', cor: '#ffd166' },
  forte: { nome: 'Forte', cor: '#ff4d6d' },
};

/** Tempo em cada zona (ou em cada intensidade, sem zonas) dos treinos desde `desde`. */
export function tempoPorZona(h: Registro[], zonas: Zona[] | null, desde = 0): FatiaZona[] {
  const mapa = new Map<string, FatiaZona>();
  const somar = (id: string, nome: string, cor: string, s: number) => {
    const f = mapa.get(id) ?? { id, nome, cor, segundos: 0 };
    f.segundos += s;
    mapa.set(id, f);
  };
  for (const r of h) {
    if (r.data < desde) continue;
    for (const t of r.trechos) {
      if (zonas) {
        const z = zonaProxima(zonas, t.pace);
        somar(z.id, z.nome, z.cor, t.segundos);
      } else {
        const i = INTENSIDADES[t.intensidade];
        somar(t.intensidade, i.nome, i.cor, t.segundos);
      }
    }
  }
  const ordem = zonas ? zonas.map((z) => z.id) : ['leve', 'ritmo', 'forte'];
  return ordem.map((id) => mapa.get(id)).filter((f): f is FatiaZona => !!f && f.segundos > 0);
}

/** Guarda o índice de forma do dia (um ponto por dia). */
export function anotarNivel(lista: PontoNivel[], vdot: number, agora: number): PontoNivel[] {
  const ultimo = lista[lista.length - 1];
  const ponto = { data: agora, vdot: Math.round(vdot * 10) / 10 };
  // Mesmo dia no horário do celular: troca o ponto do dia
  if (ultimo && new Date(ultimo.data).toDateString() === new Date(agora).toDateString()) return [...lista.slice(0, -1), ponto];
  return [...lista, ponto].slice(-100);
}

export function historicoValido(v: unknown): Registro[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter(
      (r): r is Registro =>
        !!r && typeof r.id === 'string' && typeof r.data === 'number' && typeof r.segundos === 'number' && typeof r.metros === 'number' && Array.isArray(r.trechos),
    )
    .slice(-400);
}

export function niveisValidos(v: unknown): PontoNivel[] {
  if (!Array.isArray(v)) return [];
  return v.filter((p): p is PontoNivel => !!p && typeof p.data === 'number' && typeof p.vdot === 'number').slice(-100);
}
