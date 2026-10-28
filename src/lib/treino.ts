import { formatarDuracao, formatarPace, formatarVelocidade, paceNaUnidade, type UnidadePace } from './pace';
import { meioDaZona, type Zona } from './zonas';

// Treinos de esteira: blocos (aquecer, ritmo, desaquecer...) e séries de tiros
// (N × forte + leve). Paces sempre em segundos por km; a tela converte.

export type Medida = 'tempo' | 'distancia';

export interface Esforco {
  medida: Medida;
  /** Segundos (tempo) ou metros (distância). */
  valor: number;
  /** Pace em segundos por km. */
  pace: number;
}

export type TipoBloco = 'aquecer' | 'ritmo' | 'forte' | 'leve' | 'desaquecer';

export const NOME_BLOCO: Record<TipoBloco, string> = {
  aquecer: 'Aquecimento',
  ritmo: 'Ritmo',
  forte: 'Forte',
  leve: 'Leve',
  desaquecer: 'Desaquecimento',
};

export interface PassoBloco {
  id: string;
  tipo: 'bloco';
  bloco: TipoBloco;
  esforco: Esforco;
}

export interface PassoSerie {
  id: string;
  tipo: 'serie';
  vezes: number;
  forte: Esforco;
  /** Recuperação; valor 0 = sem recuperação. */
  leve: Esforco;
}

export type Passo = PassoBloco | PassoSerie;

export interface Treino {
  id: string;
  nome: string;
  passos: Passo[];
}

/** Uma etapa do treino já "desenrolado", na ordem em que acontece. */
export interface Etapa {
  nome: string;
  /** Ex.: "Tiro 2 de 6". */
  detalhe: string;
  intensidade: 'leve' | 'forte' | 'ritmo';
  segundos: number;
  metros: number;
  pace: number;
  /** Segundo do treino em que a etapa começa. */
  inicio: number;
  medida: Medida;
}

export function novoId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Duração (s) e distância (m) de um esforço. */
export function medir(e: Esforco): { segundos: number; metros: number } {
  if (e.medida === 'tempo') return { segundos: e.valor, metros: (e.valor / e.pace) * 1000 };
  return { segundos: (e.valor / 1000) * e.pace, metros: e.valor };
}

export function expandir(t: Treino): Etapa[] {
  const etapas: Etapa[] = [];
  let inicio = 0;
  const add = (nome: string, detalhe: string, intensidade: Etapa['intensidade'], e: Esforco) => {
    const { segundos, metros } = medir(e);
    if (segundos <= 0) return;
    etapas.push({ nome, detalhe, intensidade, segundos, metros, pace: e.pace, inicio, medida: e.medida });
    inicio += segundos;
  };
  for (const p of t.passos) {
    if (p.tipo === 'bloco') {
      const intensidade = p.bloco === 'forte' ? 'forte' : p.bloco === 'ritmo' ? 'ritmo' : 'leve';
      add(NOME_BLOCO[p.bloco], '', intensidade, p.esforco);
    } else {
      for (let i = 1; i <= p.vezes; i++) {
        add('Tiro', `${i} de ${p.vezes}`, 'forte', p.forte);
        if (p.leve.valor > 0) add('Recuperação', `${i} de ${p.vezes}`, 'leve', p.leve);
      }
    }
  }
  return etapas;
}

export function totais(t: Treino): { segundos: number; metros: number } {
  return expandir(t).reduce((a, e) => ({ segundos: a.segundos + e.segundos, metros: a.metros + e.metros }), { segundos: 0, metros: 0 });
}

/** Índice da etapa em andamento no segundo `s` do treino (-1 se acabou). */
export function etapaNoTempo(etapas: Etapa[], s: number): number {
  for (let i = 0; i < etapas.length; i++) if (s < etapas[i].inicio + etapas[i].segundos) return i;
  return -1;
}

export function formatarMedida(e: Esforco): string {
  if (e.medida === 'tempo') return formatarDuracao(e.valor);
  return e.valor >= 1000 ? `${formatarVelocidade(e.valor / 1000, e.valor % 1000 === 0 ? 0 : 1)} km` : `${e.valor} m`;
}

export function formatarDistancia(m: number): string {
  return m >= 1000 ? `${formatarVelocidade(m / 1000, 2)} km` : `${Math.round(m)} m`;
}

// ---------- Modelos prontos ----------

export interface Ritmos {
  leve: number;
  ritmo: number;
  limiar: number;
  forte: number;
  tiro: number;
}

/** Ritmos dos modelos: das zonas pessoais, ou a partir de um pace de referência. */
export function ritmosBase(zs: Zona[] | null, referencia: number): Ritmos {
  if (zs && zs.length) {
    const z = (id: Zona['id']) => meioDaZona(zs.find((x) => x.id === id)!);
    return { leve: z('leve'), ritmo: z('maratona'), limiar: z('limiar'), forte: z('intervalado'), tiro: z('tiro') };
  }
  return { leve: referencia + 60, ritmo: referencia, limiar: referencia - 20, forte: referencia - 35, tiro: referencia - 50 };
}

const arred = (s: number) => Math.round(s / 5) * 5;
const tempo = (seg: number, pace: number): Esforco => ({ medida: 'tempo', valor: seg, pace: arred(pace) });
const dist = (m: number, pace: number): Esforco => ({ medida: 'distancia', valor: m, pace: arred(pace) });
const bloco = (b: TipoBloco, e: Esforco): PassoBloco => ({ id: novoId(), tipo: 'bloco', bloco: b, esforco: e });
const serie = (vezes: number, forte: Esforco, leve: Esforco): PassoSerie => ({ id: novoId(), tipo: 'serie', vezes, forte, leve });

export function modelos(r: Ritmos): Treino[] {
  return [
    {
      id: 'modelo-rodagem',
      nome: 'Rodagem 30 min',
      passos: [bloco('aquecer', tempo(300, r.leve + 20)), bloco('ritmo', tempo(1200, r.leve)), bloco('desaquecer', tempo(300, r.leve + 30))],
    },
    {
      id: 'modelo-tiros-1min',
      nome: 'Tiros 8 × 1 min',
      passos: [bloco('aquecer', tempo(600, r.leve)), serie(8, tempo(60, r.tiro), tempo(60, r.leve + 30)), bloco('desaquecer', tempo(300, r.leve + 30))],
    },
    {
      id: 'modelo-400',
      nome: 'Tiros 6 × 400 m',
      passos: [bloco('aquecer', tempo(600, r.leve)), serie(6, dist(400, r.tiro), tempo(90, r.leve + 45)), bloco('desaquecer', tempo(300, r.leve + 30))],
    },
    {
      id: 'modelo-intervalado',
      nome: 'Intervalado 5 × 3 min',
      passos: [bloco('aquecer', tempo(600, r.leve)), serie(5, tempo(180, r.forte), tempo(120, r.leve + 30)), bloco('desaquecer', tempo(300, r.leve + 30))],
    },
    {
      id: 'modelo-limiar',
      nome: 'Limiar 3 × 8 min',
      passos: [bloco('aquecer', tempo(600, r.leve)), serie(3, tempo(480, r.limiar), tempo(120, r.leve + 20)), bloco('desaquecer', tempo(300, r.leve + 30))],
    },
    {
      id: 'modelo-progressivo',
      nome: 'Progressivo 30 min',
      passos: [
        bloco('aquecer', tempo(300, r.leve + 20)),
        bloco('leve', tempo(600, r.leve)),
        bloco('ritmo', tempo(600, r.ritmo)),
        bloco('forte', tempo(300, r.limiar)),
        bloco('desaquecer', tempo(300, r.leve + 30)),
      ],
    },
  ];
}

/** Cópia com ids novos (para editar um modelo sem mexer no original). */
export function copiar(t: Treino, nome = t.nome): Treino {
  return { id: novoId(), nome, passos: t.passos.map((p) => ({ ...structuredClone(p), id: novoId() })) };
}

/** Texto para mandar no WhatsApp etc. `esteira(pace)` devolve a velocidade já formatada. */
export function textoDoTreino(t: Treino, up: UnidadePace, esteira: (pace: number) => string): string {
  const pace = (s: number) => `${formatarPace(paceNaUnidade(s, up))}${up === 'km' ? '/km' : '/mi'}`;
  const linha = (e: Esforco) => `${formatarMedida(e)} a ${esteira(e.pace)} (${pace(e.pace)})`;
  const linhas = t.passos.map((p) =>
    p.tipo === 'bloco'
      ? `• ${NOME_BLOCO[p.bloco]}: ${linha(p.esforco)}`
      : `• ${p.vezes}× ${linha(p.forte)}${p.leve.valor > 0 ? ` + ${linha(p.leve)} leve` : ''}`,
  );
  const tot = totais(t);
  return [`🏃 ${t.nome}`, ...linhas, `Total: ${formatarDuracao(tot.segundos)} · ${formatarDistancia(tot.metros)}`].join('\n');
}

/** Lê treinos guardados, descartando o que estiver estragado. */
export function treinosValidos(v: unknown): Treino[] {
  if (!Array.isArray(v)) return [];
  const esforcoOk = (e: unknown): e is Esforco => {
    const x = e as Esforco;
    return !!x && (x.medida === 'tempo' || x.medida === 'distancia') && x.valor >= 0 && x.pace > 0;
  };
  return v
    .filter((t): t is Treino => !!t && typeof (t as Treino).id === 'string' && typeof (t as Treino).nome === 'string' && Array.isArray((t as Treino).passos))
    .map((t) => ({
      ...t,
      passos: t.passos.filter((p) =>
        p && p.tipo === 'bloco' ? esforcoOk(p.esforco) && p.bloco in NOME_BLOCO : p && p.tipo === 'serie' && p.vezes > 0 && esforcoOk(p.forte) && esforcoOk(p.leve),
      ),
    }))
    .slice(0, 50);
}
