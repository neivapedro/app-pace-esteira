// Contas do app: pace (tempo por km ou por milha) <-> velocidade da esteira (km/h ou mph).

export const KM_POR_MILHA = 1.609344;

export type UnidadePace = 'km' | 'mi';
export type UnidadeEsteira = 'kmh' | 'mph';
export type Modo = 'pace' | 'esteira';

/** Faixas das réguas (pace em segundos por unidade, velocidade em décimos). */
export const FAIXA_PACE: Record<UnidadePace, { min: number; max: number }> = {
  km: { min: 150, max: 1200 }, // 2:30 a 20:00 /km
  mi: { min: 240, max: 1920 }, // 4:00 a 32:00 /mi
};
export const FAIXA_ESTEIRA: Record<UnidadeEsteira, { min: number; max: number }> = {
  kmh: { min: 30, max: 250 }, // 3,0 a 25,0 km/h
  mph: { min: 20, max: 155 }, // 2,0 a 15,5 mph
};

/** Esteiras sobem de 0,1 em 0,1. */
export function arredondarEsteira(v: number): number {
  return Math.round(v * 10) / 10;
}

export function limitar(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Segundos por km a partir do pace na unidade escolhida. */
export function paceEmSegPorKm(seg: number, unidade: UnidadePace): number {
  return unidade === 'km' ? seg : seg / KM_POR_MILHA;
}

/** Pace (segundos por unidade) a partir de segundos por km. */
export function paceNaUnidade(segPorKm: number, unidade: UnidadePace): number {
  return unidade === 'km' ? segPorKm : segPorKm * KM_POR_MILHA;
}

export function velocidadeEmKmh(v: number, unidade: UnidadeEsteira): number {
  return unidade === 'kmh' ? v : v * KM_POR_MILHA;
}

export function velocidadeNaUnidade(kmh: number, unidade: UnidadeEsteira): number {
  return unidade === 'kmh' ? kmh : kmh / KM_POR_MILHA;
}

/** Velocidade exata (sem arredondar) para correr no pace escolhido. */
export function velocidadeDoPace(seg: number, up: UnidadePace, ue: UnidadeEsteira): number {
  return velocidadeNaUnidade(3600 / paceEmSegPorKm(seg, up), ue);
}

/** Pace (segundos por unidade) que a esteira dá numa velocidade. */
export function paceDaVelocidade(v: number, ue: UnidadeEsteira, up: UnidadePace): number {
  return paceNaUnidade(3600 / velocidadeEmKmh(v, ue), up);
}

/** 330 -> "5:30" (arredonda para o segundo mais próximo). */
export function formatarPace(seg: number): string {
  const total = Math.round(seg);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** 10.9 -> "10,9" */
export function formatarVelocidade(v: number, casas = 1): string {
  return v.toFixed(casas).replace('.', ',');
}

/** Duração em segundos -> "27:30" ou "1:56:02". */
export function formatarDuracao(seg: number): string {
  const total = Math.round(seg);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

export const PROVAS = [
  { nome: '5 km', km: 5 },
  { nome: '10 km', km: 10 },
  { nome: '21 km', km: 21.0975 },
  { nome: '42 km', km: 42.195 },
];

/** Tempo de prova (segundos) num pace em segundos por km. */
export function tempoDaProva(segPorKm: number, km: number): number {
  return segPorKm * km;
}

export interface Resultado {
  /** Valor escolhido na régua, já formatado. */
  entrada: string;
  unidadeEntrada: string;
  /** O que a pessoa precisa saber. */
  saida: string;
  unidadeSaida: string;
  /** Linha de detalhe (pode ficar vazia). */
  detalhe: string;
  /** Segundos por km efetivos (para os tempos de prova). */
  segPorKm: number;
  kmh: number;
}

/** Monta o que a tela mostra. `valor`: segundos (modo pace) ou décimos (modo esteira). */
export function calcular(modo: Modo, valor: number, up: UnidadePace, ue: UnidadeEsteira): Resultado {
  const rotuloPace = up === 'km' ? '/km' : '/mi';
  const rotuloEsteira = ue === 'kmh' ? 'km/h' : 'mph';
  if (modo === 'pace') {
    const exata = velocidadeDoPace(valor, up, ue);
    const naEsteira = arredondarEsteira(exata);
    const paceReal = paceDaVelocidade(naEsteira, ue, up);
    const detalhe =
      formatarPace(paceReal) !== formatarPace(valor)
        ? `Em ${formatarVelocidade(naEsteira)} ${rotuloEsteira} o pace fica ${formatarPace(paceReal)}${rotuloPace}`
        : `Exato: ${formatarVelocidade(exata, 2)} ${rotuloEsteira}`;
    return {
      entrada: formatarPace(valor),
      unidadeEntrada: rotuloPace,
      saida: formatarVelocidade(naEsteira),
      unidadeSaida: rotuloEsteira,
      detalhe,
      segPorKm: paceEmSegPorKm(valor, up),
      kmh: velocidadeEmKmh(exata, ue),
    };
  }
  const v = valor / 10;
  const pace = paceDaVelocidade(v, ue, up);
  const kmh = velocidadeEmKmh(v, ue);
  return {
    entrada: formatarVelocidade(v),
    unidadeEntrada: rotuloEsteira,
    saida: formatarPace(pace),
    unidadeSaida: rotuloPace,
    detalhe: `${formatarVelocidade(kmh * 1000 / 60, 0)} metros por minuto`,
    segPorKm: 3600 / kmh,
    kmh,
  };
}

/** Converte o valor da régua ao trocar de modo, para a tela continuar no mesmo ritmo. */
export function converterValor(de: Modo, valor: number, up: UnidadePace, ue: UnidadeEsteira): number {
  if (de === 'pace') {
    const f = FAIXA_ESTEIRA[ue];
    return limitar(Math.round(arredondarEsteira(velocidadeDoPace(valor, up, ue)) * 10), f.min, f.max);
  }
  const f = FAIXA_PACE[up];
  return limitar(Math.round(paceDaVelocidade(valor / 10, ue, up)), f.min, f.max);
}
