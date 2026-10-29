import { describe, expect, it } from 'vitest';
import { anotarNivel, inicioDaSemana, registrar, semanas, tempoPorZona, variacao, type Registro } from './historico';
import { expandir, type Treino } from './treino';
import { zonas } from './zonas';

const treino: Treino = {
  id: 't',
  nome: 'Teste',
  passos: [
    { id: 'a', tipo: 'bloco', bloco: 'aquecer', esforco: { medida: 'tempo', valor: 600, pace: 360 } },
    { id: 'b', tipo: 'bloco', bloco: 'forte', esforco: { medida: 'tempo', valor: 300, pace: 240 } },
  ],
};

const dia = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();

describe('histórico', () => {
  it('registra o treino inteiro ou só o que foi feito', () => {
    const e = expandir(treino);
    const tudo = registrar('Teste', e, 900, 0, 'x');
    expect(tudo.concluido).toBe(true);
    expect(tudo.segundos).toBe(900);
    // 10 min a 6:00 = 1667 m; 5 min a 4:00 = 1250 m
    expect(tudo.metros).toBe(2917);
    const metade = registrar('Teste', e, 750, 0, 'y');
    expect(metade.concluido).toBe(false);
    expect(metade.trechos.map((t) => t.segundos)).toEqual([600, 150]);
  });

  it('semana começa na segunda', () => {
    // 29/10/2026 é quinta; a semana começa em 26/10
    expect(new Date(inicioDaSemana(dia(2026, 10, 29))).getDate()).toBe(26);
    expect(new Date(inicioDaSemana(dia(2026, 10, 26, 0))).getDate()).toBe(26);
    expect(new Date(inicioDaSemana(dia(2026, 11, 1))).getDate()).toBe(26);
  });

  it('soma por semana', () => {
    const r = (data: number, km: number): Registro => ({ id: String(data), data, nome: '', segundos: 1800, metros: km * 1000, concluido: true, trechos: [] });
    const h = [r(dia(2026, 10, 27), 5), r(dia(2026, 10, 29), 6), r(dia(2026, 10, 20), 8)];
    const s = semanas(h, dia(2026, 10, 29), 3);
    expect(s.map((x) => Math.round(x.km))).toEqual([0, 8, 11]);
    expect(s[2].treinos).toBe(2);
    expect(variacao(11, 8)).toBeCloseTo(37.5);
    expect(variacao(5, 0)).toBeNull();
  });

  it('tempo por zona e por intensidade', () => {
    const reg = registrar('Teste', expandir(treino), 900, 0, 'x');
    const semZonas = tempoPorZona([reg], null);
    expect(semZonas.map((f) => [f.nome, f.segundos])).toEqual([
      ['Leve', 600],
      ['Forte', 300],
    ]);
    // Índice 50: 6:00 fica abaixo do leve (vai para o mais próximo) e 4:00 cai no limiar/intervalado
    const comZonas = tempoPorZona([reg], zonas(50));
    expect(comZonas.reduce((s, f) => s + f.segundos, 0)).toBe(900);
    expect(comZonas[0].id).toBe('leve');
  });

  it('um ponto de nível por dia', () => {
    let l = anotarNivel([], 40, dia(2026, 10, 1, 10));
    l = anotarNivel(l, 41, dia(2026, 10, 1, 18));
    expect(l).toHaveLength(1);
    expect(l[0].vdot).toBe(41);
    l = anotarNivel(l, 42, dia(2026, 10, 5));
    expect(l).toHaveLength(2);
  });
});
