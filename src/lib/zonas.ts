// Nível de corrida e zonas de treino pelo método de Jack Daniels (VDOT):
// uma prova recente dá o "índice de forma", e dele saem os tempos previstos
// para outras distâncias e o ritmo de cada tipo de treino. São estimativas.

/** Consumo de oxigênio (ml/kg/min) para correr a v metros por minuto. */
function custo(v: number): number {
  return -4.6 + 0.182258 * v + 0.000104 * v * v;
}

/** Fração do VO2máx que dá para sustentar por t minutos. */
function fracao(t: number): number {
  return 0.8 + 0.1894393 * Math.exp(-0.012778 * t) + 0.2989558 * Math.exp(-0.1932605 * t);
}

/** Velocidade (m/min) que consome esse oxigênio. */
function velocidadeDoVo2(vo2: number): number {
  const a = 0.000104;
  const b = 0.182258;
  return (-b + Math.sqrt(b * b + 4 * a * (vo2 + 4.6))) / (2 * a);
}

/** Índice de forma (VDOT) de uma prova: distância em km e tempo em segundos. */
export function vdot(km: number, segundos: number): number {
  const t = segundos / 60;
  return custo((km * 1000) / t) / fracao(t);
}

/** Tempo previsto (segundos) para a distância, com o mesmo índice de forma. */
export function preverTempo(indice: number, km: number): number {
  let lo = km * 100;
  let hi = km * 1500;
  for (let i = 0; i < 60; i++) {
    const meio = (lo + hi) / 2;
    if (vdot(km, meio) > indice) lo = meio;
    else hi = meio;
  }
  return (lo + hi) / 2;
}

export interface Zona {
  id: 'leve' | 'maratona' | 'limiar' | 'intervalado' | 'tiro';
  nome: string;
  descricao: string;
  cor: string;
  /** Pace em segundos por km: rápido (menor) e lento (maior). */
  rapido: number;
  lento: number;
}

type Faixa = Omit<Zona, 'rapido' | 'lento'> & { de: number; ate: number };

// Fração do índice de forma em cada zona (calibrado na tabela de Daniels: índice 50 =
// maratona 4:31, limiar 4:15, intervalado 3:55, tiro curto 3:40 por km)
const FAIXAS: Faixa[] = [
  { id: 'leve', nome: 'Leve', descricao: 'Rodagem, aquecimento e recuperação', cor: '#3ddc97', de: 0.62, ate: 0.72 },
  { id: 'maratona', nome: 'Maratona', descricao: 'Ritmo de prova longa, confortável e firme', cor: '#4cc9f0', de: 0.79, ate: 0.83 },
  { id: 'limiar', nome: 'Limiar', descricao: 'Forte mas controlado, blocos de 5 a 20 min', cor: '#ffd166', de: 0.86, ate: 0.89 },
  { id: 'intervalado', nome: 'Intervalado', descricao: 'Tiros de 2 a 5 min', cor: '#ff8c42', de: 0.96, ate: 1.0 },
  { id: 'tiro', nome: 'Tiro curto', descricao: 'Tiros de 200 a 400 m, bem rápido', cor: '#ff4d6d', de: 1.04, ate: 1.08 },
];

/** Zonas de treino (pace em s/km) para um índice de forma. */
export function zonas(indice: number): Zona[] {
  return FAIXAS.map(({ de, ate, ...z }) => ({
    ...z,
    rapido: 60000 / velocidadeDoVo2(indice * ate),
    lento: 60000 / velocidadeDoVo2(indice * de),
  }));
}

/** Zona de um pace (s/km), se cair dentro de alguma. */
export function zonaDoPace(lista: Zona[], segPorKm: number): Zona | undefined {
  return lista.find((z) => segPorKm >= z.rapido - 0.5 && segPorKm <= z.lento + 0.5);
}

/** Zona do pace, ou a mais próxima se cair entre duas (para colorir gráficos). */
export function zonaProxima(lista: Zona[], segPorKm: number): Zona {
  const dentro = zonaDoPace(lista, segPorKm);
  if (dentro) return dentro;
  const dist = (z: Zona) => Math.min(Math.abs(segPorKm - z.rapido), Math.abs(segPorKm - z.lento));
  return lista.reduce((a, b) => (dist(b) < dist(a) ? b : a));
}

/** Meio da zona (s/km), para montar treinos. */
export function meioDaZona(z: Zona): number {
  return (z.rapido + z.lento) / 2;
}

export const DISTANCIAS = [
  { nome: '3 km', km: 3 },
  { nome: '5 km', km: 5 },
  { nome: '10 km', km: 10 },
  { nome: '15 km', km: 15 },
  { nome: '21 km', km: 21.0975 },
  { nome: '42 km', km: 42.195 },
];
