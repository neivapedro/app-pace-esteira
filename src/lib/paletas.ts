import { limitar } from './pace';

// Paletas de cor do app. Em cada uma o tom anda de h0 (devagar) até h1 (tiro),
// então a cor continua reagindo à velocidade, só que dentro da família escolhida.

export interface Paleta {
  id: string;
  nome: string;
  h0: number;
  h1: number;
  /** Saturação das cores de destaque (%). */
  s: number;
  /** Claridade das cores de destaque (%). */
  l: number;
  /** Claridade das manchas de luz do fundo (%). */
  lb: number;
  /** Distância de tom entre as duas cores do degradê. */
  d: number;
  fundo: string;
  /** Cor do texto em cima do destaque (botão ativo). */
  tinta: string;
}

export const PALETAS: Paleta[] = [
  { id: 'neon', nome: 'Neon', h0: 175, h1: 370, s: 100, l: 66, lb: 50, d: 42, fundo: '#06060b', tinta: '#fff' },
  { id: 'cinza', nome: 'Grafite', h0: 215, h1: 215, s: 8, l: 80, lb: 42, d: 0, fundo: '#0a0a0c', tinta: '#111114' },
  { id: 'marrom', nome: 'Café', h0: 36, h1: 18, s: 45, l: 64, lb: 34, d: 10, fundo: '#0e0a07', tinta: '#1a0f08' },
  { id: 'verde', nome: 'Verde', h0: 165, h1: 88, s: 80, l: 58, lb: 40, d: 18, fundo: '#050b08', tinta: '#03140b' },
  { id: 'laranja', nome: 'Laranja', h0: 42, h1: 8, s: 100, l: 60, lb: 48, d: 14, fundo: '#0d0705', tinta: '#fff' },
  { id: 'azul', nome: 'Oceano', h0: 195, h1: 235, s: 95, l: 64, lb: 46, d: 20, fundo: '#050810', tinta: '#fff' },
  { id: 'rosa', nome: 'Rosa', h0: 318, h1: 345, s: 95, l: 68, lb: 48, d: 16, fundo: '#0c0509', tinta: '#fff' },
  { id: 'vermelho', nome: 'Vermelho', h0: 8, h1: -8, s: 90, l: 60, lb: 44, d: 12, fundo: '#0d0505', tinta: '#fff' },
];

export function paleta(id: string): Paleta {
  return PALETAS.find((p) => p.id === id) ?? PALETAS[0];
}

/** Tom da cor pela velocidade: 5 km/h no início da paleta, 20 km/h no fim. */
export function tomDaVelocidade(kmh: number, p: Paleta = PALETAS[0]): number {
  const t = limitar((kmh - 5) / 15, 0, 1);
  return p.h0 + t * (p.h1 - p.h0);
}

/** Degradê da amostra (bolinha) de cada paleta nos Ajustes. */
export function amostra(p: Paleta): string {
  const meio = (p.h0 + p.h1) / 2;
  return `linear-gradient(135deg, hsl(${p.h0} ${p.s}% ${p.l}%), hsl(${meio + p.d} ${p.s}% ${p.l - 6}%) 55%, hsl(${p.h1} ${p.s}% ${p.l - 14}%))`;
}

/** Aplica a paleta na página (variáveis do estilos.css e cor da barra do iPhone). */
export function aplicarPaleta(p: Paleta, kmh: number): void {
  const r = document.documentElement.style;
  r.setProperty('--h', String(Math.round(tomDaVelocidade(kmh, p))));
  r.setProperty('--s', `${p.s}%`);
  r.setProperty('--lum', `${p.l}%`);
  r.setProperty('--lb', `${p.lb}%`);
  r.setProperty('--d', String(p.d));
  r.setProperty('--fundo', p.fundo);
  r.setProperty('--tinta', p.tinta);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', p.fundo);
}
