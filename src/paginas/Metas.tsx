import { RodaTempo } from '../componentes/Roda';
import { rotuloEsteira, rotuloPace, textoEsteira, textoPace, type Tela } from '../lib/contexto';
import { FAIXA_PACE, formatarDuracao, formatarVelocidade, limitar, paceNaUnidade, PROVAS } from '../lib/pace';
import type { Prova } from '../lib/preferencias';
import { vibrar } from '../lib/vibrar';
import { DISTANCIAS, meioDaZona, preverTempo, vdot, type Zona } from '../lib/zonas';
import { BotaoAjustes } from './Ritmo';

interface Props extends Tela {
  zonas: Zona[] | null;
  onAjustes: () => void;
}

export function Metas({ p, setP, zonas, onAjustes }: Props) {
  // Leva um pace (s/km) para a aba Ritmo
  const usar = (segPorKm: number) => {
    vibrar();
    const f = FAIXA_PACE[p.unidadePace];
    setP((a) => ({ ...a, aba: 'ritmo', modo: 'pace', pace: limitar(Math.round(paceNaUnidade(segPorKm, a.unidadePace)), f.min, f.max) }));
  };

  const metaPace = p.meta.segundos / p.meta.km;
  const indice = p.nivel ? vdot(p.nivel.km, p.nivel.segundos) : null;

  return (
    <>
      <header className="topo">
        <h1 className="titulo">Metas</h1>
        <BotaoAjustes onClick={onAjustes} />
      </header>

      <main className="pagina">
        <section className="cartao vidro">
          <h2>Pace da meta</h2>
          <p className="cartao-sub">Quero correr</p>
          <Distancias valor={p.meta.km} onChange={(km) => setP((a) => ({ ...a, meta: { ...a.meta, km } }))} />
          <p className="cartao-sub">em</p>
          <RodaTempo segundos={p.meta.segundos} onChange={(s) => setP((a) => ({ ...a, meta: { ...a.meta, segundos: s } }))} />
          <div className="resultado-meta">
            <div>
              <span className="rotulo">Pace</span>
              <strong className="num">
                {textoPace(p, metaPace)}
                <small>{rotuloPace(p)}</small>
              </strong>
            </div>
            <div>
              <span className="rotulo">Na esteira</span>
              <strong className="num destaque">
                {textoEsteira(p, metaPace)}
                <small>{rotuloEsteira(p)}</small>
              </strong>
            </div>
          </div>
          <button className="folha-ok" onClick={() => usar(metaPace)}>
            Usar no Ritmo
          </button>
        </section>

        <section className="cartao vidro">
          <h2>Seu nível e zonas</h2>
          {!p.nivel || !indice || !zonas ? (
            <>
              <p className="nota-texto">
                Informe o tempo de uma prova recente (ou um treino forte no tempo). O app calcula seu índice de forma, prevê seus tempos nas outras distâncias e
                monta suas zonas de treino.
              </p>
              <button
                className="folha-ok"
                onClick={() => {
                  vibrar();
                  setP((a) => ({ ...a, nivel: { km: 5, segundos: 1800 } }));
                }}
              >
                Informar uma prova
              </button>
            </>
          ) : (
            <Nivel p={p} setP={setP} nivel={p.nivel} indice={indice} zonas={zonas} usar={usar} />
          )}
        </section>

        <p className="fonte">
          Zonas e previsões pelo método VDOT de Jack Daniels (Daniels' Running Formula). São estimativas: calor, terreno e cansaço mudam o resultado.
        </p>
      </main>
    </>
  );
}

function Nivel({ p, setP, nivel, indice, zonas, usar }: Tela & { nivel: Prova; indice: number; zonas: Zona[]; usar: (s: number) => void }) {
  const mudar = (n: Partial<Prova>) => setP((a) => ({ ...a, nivel: { ...nivel, ...n } }));
  return (
    <>
      <p className="cartao-sub">Prova recente</p>
      <Distancias valor={nivel.km} onChange={(km) => mudar({ km })} />
      <RodaTempo segundos={nivel.segundos} onChange={(segundos) => mudar({ segundos })} />

      <div className="indice">
        <span className="rotulo">Índice de forma (VDOT)</span>
        <strong className="num">{formatarVelocidade(indice, 1)}</strong>
      </div>

      <p className="cartao-sub">Tempos previstos</p>
      <div className="provas provas-previstas">
        {PROVAS.map((x) => (
          <div key={x.nome} className="prova">
            <span>{x.nome}</span>
            <strong className="num">{formatarDuracao(preverTempo(indice, x.km))}</strong>
          </div>
        ))}
      </div>

      <p className="cartao-sub">Zonas de treino · toque para usar</p>
      <div className="zonas">
        {zonas.map((z) => (
          <button key={z.id} className="zona" style={{ ['--zc' as string]: z.cor }} onClick={() => usar(meioDaZona(z))}>
            <i />
            <span className="zona-nome">
              <b>{z.nome}</b>
              <small>{z.descricao}</small>
            </span>
            <span className="zona-ritmo num">
              <b>
                {textoPace(p, z.rapido)}–{textoPace(p, z.lento)}
              </b>
              <small>
                {textoEsteira(p, z.lento)}–{textoEsteira(p, z.rapido)} {rotuloEsteira(p)}
              </small>
            </span>
          </button>
        ))}
      </div>

      <label className="linha">
        <span>Mostrar zonas na régua</span>
        <input type="checkbox" className="chave" checked={p.zonasNaRegua} onChange={(e) => setP((a) => ({ ...a, zonasNaRegua: e.target.checked }))} />
      </label>
      <button className="botao-texto" onClick={() => setP((a) => ({ ...a, nivel: null }))}>
        Apagar prova e zonas
      </button>
    </>
  );
}

function Distancias({ valor, onChange }: { valor: number; onChange: (km: number) => void }) {
  return (
    <div className="distancias">
      {DISTANCIAS.map((d) => (
        <button
          key={d.nome}
          className={`chip vidro ${Math.abs(d.km - valor) < 0.01 ? 'ativo' : ''}`}
          onClick={() => {
            vibrar();
            onChange(d.km);
          }}
        >
          {d.nome}
        </button>
      ))}
    </div>
  );
}
