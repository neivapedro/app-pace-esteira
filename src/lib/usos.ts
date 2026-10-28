// Ritmos mais usados: conta os valores em que a pessoa "para" a régua por alguns segundos.

export type Usos = Record<string, number>;

export function chaveUso(modo: string, unidade: string, valor: number): string {
  return `${modo}:${unidade}:${valor}`;
}

export function registrarUso(u: Usos, chave: string): Usos {
  const novo = { ...u, [chave]: (u[chave] ?? 0) + 1 };
  const entradas = Object.entries(novo);
  // Guarda só os 40 mais usados
  if (entradas.length <= 40) return novo;
  return Object.fromEntries(entradas.sort((a, b) => b[1] - a[1]).slice(0, 40));
}

/** Até `n` valores mais usados (2 vezes ou mais) deste modo e unidade, fora os já salvos. */
export function maisUsados(u: Usos, modo: string, unidade: string, salvos: number[], n = 3): number[] {
  const prefixo = `${modo}:${unidade}:`;
  return Object.entries(u)
    .filter(([k, c]) => k.startsWith(prefixo) && c >= 2)
    .map(([k, c]) => [Number(k.slice(prefixo.length)), c] as const)
    .filter(([v]) => Number.isFinite(v) && !salvos.includes(v))
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([v]) => v)
    .sort((a, b) => a - b);
}

export function usosValidos(v: unknown): Usos {
  if (!v || typeof v !== 'object') return {};
  return Object.fromEntries(Object.entries(v as Record<string, unknown>).filter(([, c]) => typeof c === 'number' && c > 0)) as Usos;
}
