import { describe, expect, it } from 'vitest';
import { formatarVelocidade } from './pace';
import { etapaNoTempo, expandir, modelos, ritmosBase, textoDoTreino, totais, treinosValidos, type PassoSerie, type Treino } from './treino';
import { zonas } from './zonas';

const tiros: Treino = {
  id: 't',
  nome: 'Teste',
  passos: [
    { id: 'a', tipo: 'bloco', bloco: 'aquecer', esforco: { medida: 'tempo', valor: 600, pace: 360 } },
    {
      id: 'b',
      tipo: 'serie',
      vezes: 3,
      forte: { medida: 'distancia', valor: 400, pace: 240 },
      leve: { medida: 'tempo', valor: 90, pace: 420 },
    },
  ],
};

describe('treino', () => {
  it('desenrola as séries em etapas', () => {
    const e = expandir(tiros);
    expect(e.map((x) => x.nome)).toEqual(['Aquecimento', 'Tiro', 'Recuperação', 'Tiro', 'Recuperação', 'Tiro', 'Recuperação']);
    expect(e[1].detalhe).toBe('1 de 3');
    // 400 m a 4:00/km = 96 s
    expect(e[1].segundos).toBeCloseTo(96);
    expect(e[2].inicio).toBeCloseTo(696);
  });

  it('soma tempo e distância', () => {
    const t = totais(tiros);
    expect(t.segundos).toBeCloseTo(600 + 3 * (96 + 90));
    // 10 min a 6:00 = 1667 m; 3 × 400; 3 × 90 s a 7:00 = 3 × 214 m
    expect(t.metros).toBeCloseTo(1666.7 + 1200 + 642.9, 0);
  });

  it('acha a etapa pelo tempo', () => {
    const e = expandir(tiros);
    expect(etapaNoTempo(e, 0)).toBe(0);
    expect(etapaNoTempo(e, 600)).toBe(1);
    expect(etapaNoTempo(e, 10000)).toBe(-1);
  });

  it('sem recuperação quando o leve é zero', () => {
    const t: Treino = { ...tiros, passos: [{ ...(tiros.passos[1] as PassoSerie), leve: { medida: 'tempo', valor: 0, pace: 420 } }] };
    expect(expandir(t).every((x) => x.nome === 'Tiro')).toBe(true);
  });

  it('modelos usam as zonas quando existem', () => {
    const r = ritmosBase(zonas(50), 300);
    expect(r.limiar).toBeLessThan(r.ritmo);
    expect(r.tiro).toBeLessThan(r.forte);
    const m = modelos(r);
    expect(m.length).toBeGreaterThan(4);
    for (const t of m) expect(totais(t).segundos).toBeGreaterThan(900);
  });

  it('texto para compartilhar', () => {
    const txt = textoDoTreino(tiros, 'km', (p) => `${formatarVelocidade(3600 / p)} km/h`);
    expect(txt).toContain('3× 400 m a 15,0 km/h (4:00/km) + 1:30 a 8,6 km/h (7:00/km) leve');
    expect(txt).toContain('Total:');
  });

  it('descarta treino estragado', () => {
    expect(treinosValidos([tiros, { nome: 1 }, null])).toHaveLength(1);
    expect(treinosValidos('x')).toEqual([]);
  });
});
