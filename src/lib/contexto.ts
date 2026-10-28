import type { Dispatch, SetStateAction } from 'react';
import { esteiraParaPace, formatarPace, formatarVelocidade, paceNaUnidade, type Opcoes } from './pace';
import type { Preferencias } from './preferencias';
import { vdot, zonas, type Zona } from './zonas';

// Ajudantes usados por várias telas.

export interface Tela {
  p: Preferencias;
  setP: Dispatch<SetStateAction<Preferencias>>;
}

export function opcoes(p: Preferencias): Opcoes {
  return { inclinacao: p.inclinacao, fator: p.fator };
}

export function zonasDe(p: Preferencias): Zona[] | null {
  return p.nivel ? zonas(vdot(p.nivel.km, p.nivel.segundos)) : null;
}

export function rotuloPace(p: Preferencias): string {
  return p.unidadePace === 'km' ? '/km' : '/mi';
}

export function rotuloEsteira(p: Preferencias): string {
  return p.unidadeEsteira === 'kmh' ? 'km/h' : 'mph';
}

/** Pace (s/km) -> "5:30" na unidade escolhida. */
export function textoPace(p: Preferencias, segPorKm: number): string {
  return formatarPace(paceNaUnidade(segPorKm, p.unidadePace));
}

/** Pace (s/km) -> velocidade para pôr na esteira, "10,9". */
export function textoEsteira(p: Preferencias, segPorKm: number): string {
  return formatarVelocidade(esteiraParaPace(segPorKm, p.unidadeEsteira, opcoes(p)));
}
