import { expect, it } from 'vitest';
import { chaveUso, maisUsados, registrarUso, type Usos } from './usos';

it('mostra os mais usados, sem repetir os salvos', () => {
  let u: Usos = {};
  for (let i = 0; i < 3; i++) u = registrarUso(u, chaveUso('pace', 'km', 330));
  for (let i = 0; i < 5; i++) u = registrarUso(u, chaveUso('pace', 'km', 300));
  u = registrarUso(u, chaveUso('pace', 'km', 280)); // só uma vez: não entra
  u = registrarUso(u, chaveUso('esteira', 'kmh', 120));
  u = registrarUso(u, chaveUso('esteira', 'kmh', 120));
  expect(maisUsados(u, 'pace', 'km', [])).toEqual([300, 330]);
  expect(maisUsados(u, 'pace', 'km', [300])).toEqual([330]);
  expect(maisUsados(u, 'esteira', 'kmh', [])).toEqual([120]);
});

it('guarda no máximo 40', () => {
  let u: Usos = {};
  for (let i = 0; i < 60; i++) u = registrarUso(u, chaveUso('pace', 'km', 200 + i));
  expect(Object.keys(u).length).toBeLessThanOrEqual(40);
});
