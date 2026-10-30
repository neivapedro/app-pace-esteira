import { ArcoKpi, EspectroZonas, Linha } from '../componentes/Graficos';
import { avisar } from '../componentes/Avisos';
import { Pagina } from '../componentes/Pagina';
import { RodaTempo } from '../componentes/Roda';
import { opcoes, rotuloEsteira, rotuloPace, textoEsteira, textoPace, type Tela } from '../lib/contexto';
import { calcular, FAIXA_PACE, formatarDuracao, formatarVelocidade, limitar, paceNaUnidade, PROVAS } from '../lib/pace';
import type { Aba, Preferencias, Prova } from '../lib/preferencias';
import { vibrar } from '../lib/vibrar';
import { DISTANCIAS, meioDaZona, preverTempo, vdot, zonas as calcularZonas, type Zona } from '../lib/zonas';

interface Props extends Tela {
  zonas: Zona[] | null;
  onAjustes: () => void;
  irPara: (aba: Aba, extra?: Partial<Preferencias>) => void;
}

export function Metas({ p, setP, zonas, onAjustes, irPara }: Props) {
  // Leva um pace (s/km) para a aba Ritmo, com a transição do número
  const usar = (segPorKm: number) => {
    vibrar();
    const f = FAIXA_PACE[p.unidadePace];
    irPara('ritmo', { modo: 'pace', pace: limitar(Math.round(paceNaUnidade(segPorKm, p.unidadePace)), f.min, f.max) });
  };

  const metaPace = p.meta.segundos / p.meta.km;
  const indice = p.nivel ? vdot(p.nivel.km, p.nivel.segundos) : null;
  const ritmoAtual = calcular(p.modo, p.modo === 'pace' ? p.pace : p.esteira, p.unidadePace, p.unidadeEsteira, opcoes(p)).segPorKm;

  return (
    <>
      <Pagina titulo="Metas" onAjustes={onAjustes}>
        <section className="cartao superficie">
          <h2>Pace da meta</h2>
          <p className="cartao-sub">Quero correr</p>
          <Distancias valor={p.meta.km} onChange={(km) => setP((a) => ({ ...a, meta: { ...a.meta, km } }))} />
          <p className="cartao-sub">em</p>
          <RodaTempo segundos={p.meta.segundos} onChange={(s) => setP((a) => ({ ...a, meta: { ...a.meta, segundos: s } }))} />
          <div className="resultado-meta">
            <div>
              <span className="rotulo">Pace</span>
              <strong className="num" style={{ viewTransitionName: 'pace-destaque' }}>
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

        <section className="cartao superficie">
          <h2>Seu nível e zonas</h2>
          {!p.nivel || !indice || !zonas ? (
            <>
              <div className="previa-mini" aria-hidden="true">
                <EspectroZonas zonas={calcularZonas(42)} marcadores={[]} formatar={(s) => textoPace(p, s)} />
              </div>
              <p className="nota-texto">
                Informe o tempo de uma prova recente (ou um treino forte no tempo). O app calcula seu índice de forma, prevê seus tempos e monta suas zonas de
                treino.
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
            <Nivel p={p} setP={setP} nivel={p.nivel} indice={indice} zonas={zonas} usar={usar} metaPace={metaPace} ritmoAtual={ritmoAtual} />
          )}
        </section>

        <p className="fonte">
          Zonas e previsões pelo método VDOT de Jack Daniels (Daniels' Running Formula). São estimativas: calor, terreno e cansaço mudam o resultado.
        </p>
      </Pagina>
    </>
  );
}

interface NivelProps extends Tela {
  nivel: Prova;
  indice: number;
  zonas: Zona[];
  usar: (s: number) => void;
  metaPace: number;
  ritmoAtual: number;
}

function Nivel({ p, setP, nivel, indice, zonas, usar, metaPace, ritmoAtual }: NivelProps) {
  const mudar = (n: Partial<Prova>) => setP((a) => ({ ...a, nivel: { ...nivel, ...n } }));
  const previsoes = PROVAS.map((x) => {
    const t = preverTempo(indice, x.km);
    return { ...x, t, pace: t / x.km };
  });
  return (
    <>
      <p className="cartao-sub">Prova recente</p>
      <Distancias valor={nivel.km} onChange={(km) => mudar({ km })} />
      <RodaTempo segundos={nivel.segundos} onChange={(segundos) => mudar({ segundos })} />

      <div className="indice-kpi">
        <ArcoKpi valor={indice} min={30} max={80} texto={formatarVelocidade(indice, 1)} />
        <div>
          <span className="rotulo">Índice de forma</span>
          <p>VDOT de Daniels. Quanto maior, mais rápido. Sobe com treino e com provas melhores.</p>
        </div>
      </div>

      <p className="cartao-sub">Suas zonas · onde estão o Ritmo e a meta</p>
      <EspectroZonas
        zonas={zonas}
        marcadores={[
          { pace: ritmoAtual, rotulo: 'Ritmo' },
          { pace: metaPace, rotulo: 'Meta' },
        ]}
        formatar={(s) => textoPace(p, s)}
      />

      <p className="cartao-sub">Tempos previstos · toque e arraste no gráfico</p>
      <Linha
        inverter
        altura={160}
        pontos={previsoes.map((x) => ({
          y: x.pace,
          rotulo: x.nome,
          valor: `${formatarDuracao(x.t)} · ${textoPace(p, x.pace)}${rotuloPace(p)}`,
        }))}
      />
      <div className="provas provas-previstas">
        {previsoes.map((x) => (
          <div key={x.nome} className="prova">
            <span>{x.nome}</span>
            <strong className="num">{formatarDuracao(x.t)}</strong>
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
      <button
        className="botao-texto"
        onClick={() => {
          const anterior = nivel;
          setP((a) => ({ ...a, nivel: null }));
          avisar('Prova e zonas apagadas', () => setP((a) => ({ ...a, nivel: anterior })));
        }}
      >
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
          className={`chip superficie ${Math.abs(d.km - valor) < 0.01 ? 'ativo' : ''}`}
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
