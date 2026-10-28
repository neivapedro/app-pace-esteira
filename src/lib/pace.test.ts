import { describe, expect, it } from 'vitest';
import {
  arredondarEsteira,
  calcular,
  converterValor,
  formatarDuracao,
  formatarPace,
  formatarVelocidade,
  paceDaVelocidade,
  tempoDaProva,
  velocidadeDoPace,
} from './pace';

describe('conversões', () => {
  it('pace por km para km/h', () => {
    expect(velocidadeDoPace(300, 'km', 'kmh')).toBeCloseTo(12);
    expect(velocidadeDoPace(330, 'km', 'kmh')).toBeCloseTo(10.909, 3);
    expect(velocidadeDoPace(360, 'km', 'kmh')).toBeCloseTo(10);
  });

  it('pace por km para mph', () => {
    // 5:00/km = 12 km/h = 7,456 mph
    expect(velocidadeDoPace(300, 'km', 'mph')).toBeCloseTo(7.456, 3);
  });

  it('pace por milha para mph', () => {
    // 8:00/mi = 7,5 mph
    expect(velocidadeDoPace(480, 'mi', 'mph')).toBeCloseTo(7.5);
  });

  it('velocidade para pace', () => {
    expect(paceDaVelocidade(12, 'kmh', 'km')).toBeCloseTo(300);
    expect(paceDaVelocidade(10, 'kmh', 'km')).toBeCloseTo(360);
    expect(paceDaVelocidade(6, 'mph', 'mi')).toBeCloseTo(600);
  });

  it('arredonda como a esteira (0,1)', () => {
    expect(arredondarEsteira(10.909)).toBe(10.9);
    expect(arredondarEsteira(10.95)).toBe(11);
    expect(arredondarEsteira(13.333)).toBe(13.3);
  });
});

describe('formatação', () => {
  it('pace', () => {
    expect(formatarPace(330)).toBe('5:30');
    expect(formatarPace(305.4)).toBe('5:05');
    expect(formatarPace(359.6)).toBe('6:00');
  });

  it('velocidade com vírgula', () => {
    expect(formatarVelocidade(10.9)).toBe('10,9');
    expect(formatarVelocidade(12)).toBe('12,0');
  });

  it('duração', () => {
    expect(formatarDuracao(1650)).toBe('27:30');
    expect(formatarDuracao(tempoDaProva(330, 21.0975))).toBe('1:56:02');
    expect(formatarDuracao(tempoDaProva(300, 42.195))).toBe('3:30:59');
  });
});

describe('tela', () => {
  it('modo pace mostra a velocidade da esteira', () => {
    const r = calcular('pace', 330, 'km', 'kmh');
    expect(r.entrada).toBe('5:30');
    expect(r.saida).toBe('10,9');
    expect(r.unidadeSaida).toBe('km/h');
    expect(r.detalhe).toBe('Exato: 10,91 km/h');
  });

  it('avisa quando o arredondamento da esteira muda o pace', () => {
    // 9:00/km = 6,667 km/h -> 6,7 km/h = 8:57/km
    const r = calcular('pace', 540, 'km', 'kmh');
    expect(r.saida).toBe('6,7');
    expect(r.detalhe).toBe('Em 6,7 km/h o pace fica 8:57/km');
  });

  it('modo esteira mostra o pace', () => {
    const r = calcular('esteira', 120, 'km', 'kmh');
    expect(r.entrada).toBe('12,0');
    expect(r.saida).toBe('5:00');
    expect(r.unidadeSaida).toBe('/km');
    expect(r.detalhe).toBe('200 metros por minuto');
  });

  it('troca de modo mantém o ritmo', () => {
    expect(converterValor('pace', 330, 'km', 'kmh')).toBe(109);
    expect(converterValor('esteira', 120, 'km', 'kmh')).toBe(300);
    // Fora da faixa: fica no limite
    expect(converterValor('esteira', 30, 'km', 'kmh')).toBe(1200);
  });
});
