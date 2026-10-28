import { describe, expect, it } from 'vitest';
import { paleta, PALETAS, tomDaVelocidade } from './paletas';

describe('paletas', () => {
  it('Neon vai de ciano (devagar) a vermelho (rápido) sem dar a volta na roda de cores', () => {
    const neon = paleta('neon');
    expect(tomDaVelocidade(4, neon)).toBe(175);
    expect(tomDaVelocidade(20, neon)).toBe(370);
    expect(tomDaVelocidade(30, neon)).toBe(370);
  });

  it('cada paleta fica no próprio tom', () => {
    const verde = paleta('verde');
    expect(tomDaVelocidade(5, verde)).toBe(165);
    expect(tomDaVelocidade(20, verde)).toBe(88);
    expect(tomDaVelocidade(12, paleta('cinza'))).toBe(215);
  });

  it('paleta desconhecida volta para a Neon', () => {
    expect(paleta('xyz').id).toBe('neon');
  });

  it('ids únicos', () => {
    expect(new Set(PALETAS.map((p) => p.id)).size).toBe(PALETAS.length);
  });
});
