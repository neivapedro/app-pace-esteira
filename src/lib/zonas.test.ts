import { describe, expect, it } from 'vitest';
import { formatarPace } from './pace';
import { preverTempo, vdot, zonaDoPace, zonas } from './zonas';

describe('índice de forma (VDOT)', () => {
  it('bate com a tabela de Daniels', () => {
    expect(vdot(5, 19 * 60 + 57)).toBeCloseTo(50, 0);
    expect(vdot(10, 50 * 60 + 3)).toBeCloseTo(40, 0);
  });

  it('prevê outras distâncias', () => {
    // Índice 50: 10 km em ~41:21 e meia em ~1:31:35 (tabela de Daniels)
    expect(preverTempo(50, 10) / 60).toBeCloseTo(41.35, 0);
    expect(preverTempo(50, 21.0975) / 60).toBeCloseTo(91.6, 0);
    // Volta ao mesmo tempo da prova
    expect(preverTempo(vdot(5, 1500), 5)).toBeCloseTo(1500, 0);
  });

  it('zonas do índice 50', () => {
    const z = zonas(50);
    const pace = (id: string, lado: 'rapido' | 'lento') => formatarPace(z.find((x) => x.id === id)![lado]);
    expect(pace('limiar', 'rapido')).toBe('4:13');
    expect(pace('intervalado', 'rapido')).toBe('3:50');
    expect(pace('leve', 'lento')).toBe('5:38');
    // Ordem: cada zona mais rápida que a anterior
    for (let i = 1; i < z.length; i++) expect(z[i].rapido).toBeLessThan(z[i - 1].rapido);
  });

  it('acha a zona de um pace', () => {
    const z = zonas(50);
    expect(zonaDoPace(z, 255)?.id).toBe('limiar');
    expect(zonaDoPace(z, 320)?.id).toBe('leve');
    expect(zonaDoPace(z, 400)).toBeUndefined();
  });
});
