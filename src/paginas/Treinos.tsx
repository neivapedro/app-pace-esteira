import { useState } from 'react';
import { Folha } from '../componentes/Folha';
import { PerfilTreino } from '../componentes/Graficos';
import { IconeCiclo, IconeFechar, IconeMais, IconePlay, IconeSubir, IconeTrocar } from '../componentes/Icones';
import { Repetidor } from '../componentes/Repetidor';
import { opcoes, rotuloEsteira, rotuloPace, textoEsteira, textoPace, type Tela } from '../lib/contexto';
import { calcular, formatarDuracao, limitar, paceEmSegPorKm, paceNaUnidade } from '../lib/pace';
import {
  copiar,
  formatarDistancia,
  formatarMedida,
  modelos,
  NOME_BLOCO,
  novoId,
  ritmosBase,
  expandir,
  textoDoTreino,
  totais,
  type Esforco,
  type Passo,
  type TipoBloco,
  type Treino,
} from '../lib/treino';
import { vibrar } from '../lib/vibrar';
import type { Zona } from '../lib/zonas';
import { BotaoAjustes } from './Ritmo';

interface Props extends Tela {
  zonas: Zona[] | null;
  onAjustes: () => void;
  onComecar: (t: Treino) => void;
}

function resumo(t: Treino): string {
  const tot = totais(t);
  const tiros = t.passos.reduce((n, x) => n + (x.tipo === 'serie' ? x.vezes : 0), 0);
  return [formatarDuracao(tot.segundos), formatarDistancia(tot.metros), tiros ? `${tiros} tiros` : ''].filter(Boolean).join(' · ');
}

export function Treinos({ p, setP, zonas, onAjustes, onComecar }: Props) {
  const [editando, setEditando] = useState<string | null>(null);
  // Sem zonas, os modelos partem do pace que está na aba Ritmo
  const referencia = calcular(p.modo, p.modo === 'pace' ? p.pace : p.esteira, p.unidadePace, p.unidadeEsteira, opcoes(p)).segPorKm;
  const lista = modelos(ritmosBase(zonas, referencia));
  const treino = p.treinos.find((t) => t.id === editando);

  const adicionar = (t: Treino) => {
    vibrar();
    setP((a) => ({ ...a, treinos: [t, ...a.treinos] }));
    setEditando(t.id);
  };

  return (
    <>
      <header className="topo">
        <h1 className="titulo">Treinos</h1>
        <BotaoAjustes onClick={onAjustes} />
      </header>

      <main className="pagina">
        <section>
          <h2 className="secao">Meus treinos</h2>
          {p.treinos.length === 0 ? (
            <div className="vazio vidro">
              <div className="previa-mini" aria-hidden="true">
                <PerfilTreino etapas={expandir(lista[1])} zonas={zonas} />
              </div>
              <b>Nenhum treino ainda</b>
              <p>Toque num modelo abaixo para copiar e ajustar do seu jeito.</p>
            </div>
          ) : (
            <div className="lista">
              {p.treinos.map((t) => (
                <div key={t.id} className="treino vidro">
                  <button className="treino-info" onClick={() => setEditando(t.id)}>
                    <b>{t.nome}</b>
                    <small>{resumo(t)}</small>
                    <PerfilTreino etapas={expandir(t)} zonas={zonas} mini />
                  </button>
                  <button
                    className="play"
                    aria-label={`Começar ${t.nome}`}
                    onClick={() => {
                      vibrar();
                      onComecar(t);
                    }}
                  >
                    <IconePlay tam={22} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="secao">Modelos</h2>
          <p className="secao-sub">
            {zonas ? 'Ritmos das suas zonas (aba Metas).' : `Ritmos a partir de ${textoPace(p, referencia)}${rotuloPace(p)}, o pace da aba Ritmo.`} Toque para
            copiar e ajustar.
          </p>
          <div className="lista">
            {lista.map((m) => (
              <button key={m.id} className="treino modelo vidro" onClick={() => adicionar(copiar(m))}>
                <span className="treino-info">
                  <b>{m.nome}</b>
                  <small>{resumo(m)}</small>
                  <PerfilTreino etapas={expandir(m)} zonas={zonas} mini />
                </span>
                <span className="mais" aria-hidden="true">
                  <IconeMais tam={18} />
                </span>
              </button>
            ))}
            <button
              className="treino modelo vidro"
              onClick={() =>
                adicionar({
                  id: novoId(),
                  nome: 'Meu treino',
                  passos: [{ id: novoId(), tipo: 'bloco', bloco: 'aquecer', esforco: { medida: 'tempo', valor: 600, pace: Math.round(referencia + 60) } }],
                })
              }
            >
              <span className="treino-info">
                <b>Treino em branco</b>
                <small>Monte do seu jeito</small>
              </span>
              <span className="mais" aria-hidden="true">
                <IconeMais tam={18} />
              </span>
            </button>
          </div>
        </section>
      </main>

      {treino && (
        <Editor
          p={p}
          zonas={zonas}
          setP={setP}
          treino={treino}
          onFechar={() => setEditando(null)}
          onComecar={() => {
            setEditando(null);
            onComecar(treino);
          }}
        />
      )}
    </>
  );
}

function Editor({ p, setP, treino, zonas, onFechar, onComecar }: Tela & { treino: Treino; zonas: Zona[] | null; onFechar: () => void; onComecar: () => void }) {
  const mudar = (f: (t: Treino) => Treino) => setP((a) => ({ ...a, treinos: a.treinos.map((t) => (t.id === treino.id ? f(t) : t)) }));
  const mudarPasso = (id: string, f: (x: Passo) => Passo) => mudar((t) => ({ ...t, passos: t.passos.map((x) => (x.id === id ? f(x) : x)) }));
  const tot = totais(treino);
  const pacePadrao = treino.passos.length ? (treino.passos[treino.passos.length - 1] as Passo & { esforco?: Esforco }).esforco?.pace ?? 360 : 360;

  const compartilhar = async () => {
    const texto = textoDoTreino(treino, p.unidadePace, (pace) => `${textoEsteira(p, pace)} ${rotuloEsteira(p)}`);
    try {
      if (navigator.share) await navigator.share({ text: texto });
      else await navigator.clipboard.writeText(texto);
    } catch {
      /* cancelado */
    }
  };

  return (
    <Folha titulo="Editar treino" onFechar={onFechar} cheia>
      {(fechar) => (
        <>
          <input
            className="nome-treino"
            value={treino.nome}
            maxLength={40}
            aria-label="Nome do treino"
            onChange={(e) => mudar((t) => ({ ...t, nome: e.target.value }))}
          />

          <div className="perfil-editor">
            <PerfilTreino etapas={expandir(treino)} zonas={zonas} />
          </div>

          <div className="passos">
            {treino.passos.map((x, i) => (
              <div key={x.id} className="passo-cartao">
                <div className="passo-topo">
                  {x.tipo === 'bloco' ? (
                    <button
                      className="tipo-ciclo"
                      aria-label="Trocar o tipo do bloco"
                      onClick={() => {
                        vibrar();
                        const tipos = Object.keys(NOME_BLOCO) as TipoBloco[];
                        mudarPasso(x.id, (y) => ({ ...(y as typeof x), bloco: tipos[(tipos.indexOf(x.bloco) + 1) % tipos.length] }));
                      }}
                    >
                      {NOME_BLOCO[x.bloco]}
                      <IconeCiclo tam={14} />
                    </button>
                  ) : (
                    <div className="serie-vezes">
                      <b>Série</b>
                      <Repetidor className="mini" rotulo="Menos uma vez" onPasso={() => mudarPasso(x.id, (y) => ({ ...(y as typeof x), vezes: Math.max(1, x.vezes - 1) }))}>
                        −
                      </Repetidor>
                      <span className="num">{x.vezes}×</span>
                      <Repetidor className="mini" rotulo="Mais uma vez" onPasso={() => mudarPasso(x.id, (y) => ({ ...(y as typeof x), vezes: Math.min(30, x.vezes + 1) }))}>
                        +
                      </Repetidor>
                    </div>
                  )}
                  <div className="passo-acoes">
                    {i > 0 && (
                      <button
                        aria-label="Subir"
                        onClick={() =>
                          mudar((t) => {
                            const ps = [...t.passos];
                            [ps[i - 1], ps[i]] = [ps[i], ps[i - 1]];
                            return { ...t, passos: ps };
                          })
                        }
                      >
                        <IconeSubir tam={16} />
                      </button>
                    )}
                    <button aria-label="Apagar" onClick={() => mudar((t) => ({ ...t, passos: t.passos.filter((y) => y.id !== x.id) }))}>
                      <IconeFechar tam={16} />
                    </button>
                  </div>
                </div>
                {x.tipo === 'bloco' ? (
                  <EditorEsforco p={p} e={x.esforco} onChange={(e) => mudarPasso(x.id, (y) => ({ ...(y as typeof x), esforco: e }))} />
                ) : (
                  <>
                    <span className="passo-rotulo">Tiro</span>
                    <EditorEsforco p={p} e={x.forte} onChange={(e) => mudarPasso(x.id, (y) => ({ ...(y as typeof x), forte: e }))} />
                    <span className="passo-rotulo">Recuperação</span>
                    <EditorEsforco p={p} e={x.leve} permiteZero onChange={(e) => mudarPasso(x.id, (y) => ({ ...(y as typeof x), leve: e }))} />
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="adicionar">
            <button
              className="botao-secundario vidro"
              onClick={() =>
                mudar((t) => ({ ...t, passos: [...t.passos, { id: novoId(), tipo: 'bloco', bloco: 'ritmo', esforco: { medida: 'tempo', valor: 300, pace: pacePadrao } }] }))
              }
            >
              + Bloco
            </button>
            <button
              className="botao-secundario vidro"
              onClick={() =>
                mudar((t) => ({
                  ...t,
                  passos: [
                    ...t.passos,
                    {
                      id: novoId(),
                      tipo: 'serie',
                      vezes: 6,
                      forte: { medida: 'tempo', valor: 60, pace: Math.max(150, pacePadrao - 60) },
                      leve: { medida: 'tempo', valor: 60, pace: pacePadrao + 30 },
                    },
                  ],
                }))
              }
            >
              + Série de tiros
            </button>
          </div>

          <p className="total num">
            Total {formatarDuracao(tot.segundos)} · {formatarDistancia(tot.metros)}
          </p>

          <div className="folha-botoes">
            <button className="botao-secundario vidro" onClick={compartilhar}>
              Compartilhar
            </button>
            <button className="folha-ok" disabled={!treino.passos.length} onClick={onComecar}>
              Começar
            </button>
          </div>
          <button
            className="botao-texto perigo"
            onClick={() => {
              if (confirm(`Apagar "${treino.nome}"?`)) {
                fechar();
                setP((a) => ({ ...a, treinos: a.treinos.filter((t) => t.id !== treino.id) }));
              }
            }}
          >
            Apagar treino
          </button>
        </>
      )}
    </Folha>
  );
}

function EditorEsforco({ p, e, onChange, permiteZero }: { p: Tela['p']; e: Esforco; onChange: (e: Esforco) => void; permiteZero?: boolean }) {
  const tempo = e.medida === 'tempo';
  const passoMedida = tempo ? 15 : 100;
  const minimo = permiteZero ? 0 : passoMedida;
  const mudarMedida = (d: number) => onChange({ ...e, valor: limitar(e.valor + d * passoMedida, minimo, tempo ? 3 * 3600 : 42200) });
  // Pace anda de 5 em 5 segundos na unidade escolhida
  const mudarPace = (d: number) => {
    const atual = Math.round(paceNaUnidade(e.pace, p.unidadePace) / 5) * 5;
    onChange({ ...e, pace: Math.round(paceEmSegPorKm(limitar(atual + d * 5, 120, 1800), p.unidadePace)) });
  };
  const trocar = () => onChange(tempo ? { ...e, medida: 'distancia', valor: 400 } : { ...e, medida: 'tempo', valor: 60 });

  return (
    <div className="esforco">
      <div className="esforco-col">
        <button className="medida-troca" onClick={trocar} aria-label="Trocar entre tempo e distância">
          {tempo ? 'Tempo' : 'Distância'} <IconeTrocar tam={12} />
        </button>
        <div className="ajuste">
          <Repetidor className="mini" rotulo="Menos" onPasso={() => mudarMedida(-1)}>
            −
          </Repetidor>
          <span className="num">{e.valor === 0 ? 'sem' : formatarMedida(e)}</span>
          <Repetidor className="mini" rotulo="Mais" onPasso={() => mudarMedida(1)}>
            +
          </Repetidor>
        </div>
      </div>
      <div className="esforco-col">
        <span className="esforco-rotulo num">
          {textoEsteira(p, e.pace)} {rotuloEsteira(p)}
        </span>
        <div className="ajuste">
          <Repetidor className="mini" rotulo="Mais rápido" onPasso={() => mudarPace(-1)}>
            −
          </Repetidor>
          <span className="num">
            {textoPace(p, e.pace)}
            <small>{rotuloPace(p)}</small>
          </span>
          <Repetidor className="mini" rotulo="Mais devagar" onPasso={() => mudarPace(1)}>
            +
          </Repetidor>
        </div>
      </div>
    </div>
  );
}
