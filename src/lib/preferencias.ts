import { PALETAS } from './paletas';
import { FAIXA_ESTEIRA, FAIXA_PACE, limitar, type Modo, type UnidadeEsteira, type UnidadePace } from './pace';
import { treinosValidos, type Treino } from './treino';
import { usosValidos, type Usos } from './usos';

// Tudo fica só no celular (localStorage). Sem login e sem internet.

export type Aba = 'ritmo' | 'treino' | 'metas';

export interface Prova {
  km: number;
  segundos: number;
}

export interface Preferencias {
  aba: Aba;
  modo: Modo;
  pace: number; // segundos por unidade
  esteira: number; // décimos (109 = 10,9)
  unidadePace: UnidadePace;
  unidadeEsteira: UnidadeEsteira;
  vibracao: boolean;
  paleta: string;
  favoritosPace: number[];
  favoritosEsteira: number[];
  dicaVista: boolean;
  /** Inclinação da esteira em % (passos de 0,5). */
  inclinacao: number;
  /** Velocidade real ÷ velocidade mostrada (calibração). 1 = esteira certa. */
  fator: number;
  telaAcesa: boolean;
  /** Falar a velocidade quando a régua para. */
  falarRegua: boolean;
  /** Avisos falados durante o treino. */
  vozTreino: boolean;
  usos: Usos;
  /** Meta de prova (aba Metas). */
  meta: Prova;
  /** Prova recente que define as zonas (null = sem zonas). */
  nivel: Prova | null;
  zonasNaRegua: boolean;
  treinos: Treino[];
}

const CHAVE = 'app-pace-esteira:preferencias';

export const PADRAO: Preferencias = {
  aba: 'ritmo',
  modo: 'pace',
  pace: 330,
  esteira: 109,
  unidadePace: 'km',
  unidadeEsteira: 'kmh',
  vibracao: true,
  paleta: 'neon',
  favoritosPace: [],
  favoritosEsteira: [],
  dicaVista: false,
  inclinacao: 0,
  fator: 1,
  telaAcesa: true,
  falarRegua: false,
  vozTreino: true,
  usos: {},
  meta: { km: 10, segundos: 3600 },
  nivel: null,
  zonasNaRegua: true,
  treinos: [],
};

function numeros(v: unknown): number[] {
  return Array.isArray(v) ? v.filter((n): n is number => typeof n === 'number' && Number.isFinite(n)).slice(0, 12) : [];
}

function prova(v: unknown): Prova | null {
  const p = v as Prova;
  return p && typeof p.km === 'number' && p.km > 0 && typeof p.segundos === 'number' && p.segundos > 0 ? { km: p.km, segundos: p.segundos } : null;
}

export function lerPreferencias(): Preferencias {
  let p: Partial<Preferencias> = {};
  try {
    p = JSON.parse(localStorage.getItem(CHAVE) || '{}') || {};
  } catch {
    /* sem armazenamento: usa o padrão */
  }
  const unidadePace: UnidadePace = p.unidadePace === 'mi' ? 'mi' : 'km';
  const unidadeEsteira: UnidadeEsteira = p.unidadeEsteira === 'mph' ? 'mph' : 'kmh';
  const fp = FAIXA_PACE[unidadePace];
  const fe = FAIXA_ESTEIRA[unidadeEsteira];
  const bool = (v: unknown, padrao: boolean) => (typeof v === 'boolean' ? v : padrao);
  return {
    aba: p.aba === 'treino' || p.aba === 'metas' ? p.aba : 'ritmo',
    modo: p.modo === 'esteira' ? 'esteira' : 'pace',
    pace: typeof p.pace === 'number' ? limitar(Math.round(p.pace), fp.min, fp.max) : PADRAO.pace,
    esteira: typeof p.esteira === 'number' ? limitar(Math.round(p.esteira), fe.min, fe.max) : PADRAO.esteira,
    unidadePace,
    unidadeEsteira,
    vibracao: p.vibracao !== false,
    paleta: PALETAS.some((x) => x.id === p.paleta) ? (p.paleta as string) : PADRAO.paleta,
    favoritosPace: numeros(p.favoritosPace),
    favoritosEsteira: numeros(p.favoritosEsteira),
    dicaVista: p.dicaVista === true,
    inclinacao: typeof p.inclinacao === 'number' ? limitar(Math.round(p.inclinacao * 2) / 2, 0, 15) : 0,
    fator: typeof p.fator === 'number' ? limitar(p.fator, 0.85, 1.15) : 1,
    telaAcesa: bool(p.telaAcesa, true),
    falarRegua: bool(p.falarRegua, false),
    vozTreino: bool(p.vozTreino, true),
    usos: usosValidos(p.usos),
    meta: prova(p.meta) ?? PADRAO.meta,
    nivel: prova(p.nivel),
    zonasNaRegua: bool(p.zonasNaRegua, true),
    treinos: treinosValidos(p.treinos),
  };
}

export function salvarPreferencias(p: Preferencias): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(p));
  } catch {
    /* sem armazenamento: só não guarda */
  }
}
