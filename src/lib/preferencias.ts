import { PALETAS } from './paletas';
import { FAIXA_ESTEIRA, FAIXA_PACE, limitar, type Modo, type UnidadeEsteira, type UnidadePace } from './pace';

// Tudo fica só no celular (localStorage). Sem login e sem internet.

export interface Preferencias {
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
}

const CHAVE = 'app-pace-esteira:preferencias';

export const PADRAO: Preferencias = {
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
};

function numeros(v: unknown): number[] {
  return Array.isArray(v) ? v.filter((n): n is number => typeof n === 'number' && Number.isFinite(n)).slice(0, 12) : [];
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
  return {
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
  };
}

export function salvarPreferencias(p: Preferencias): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(p));
  } catch {
    /* sem armazenamento: só não guarda */
  }
}
