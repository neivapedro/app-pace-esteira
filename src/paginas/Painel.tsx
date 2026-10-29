import { ArcoKpi, Colunas, Legenda, Linha, Mini, PerfilTreino, Rosca } from '../componentes/Graficos';
import { IconeLixo } from '../componentes/Icones';
import { rotuloPace, textoPace, type Tela } from '../lib/contexto';
import { semanas, tempoPorZona, variacao, type Registro } from '../lib/historico';
import { formatarDuracao, formatarVelocidade } from '../lib/pace';
import type { Aba, Preferencias } from '../lib/preferencias';
import { formatarDistancia } from '../lib/treino';
import { vibrar } from '../lib/vibrar';
import type { Zona } from '../lib/zonas';
import { BotaoAjustes } from './Ritmo';

interface Props extends Tela {
  zonas: Zona[] | null;
  onAjustes: () => void;
  irPara: (aba: Aba, extra?: Partial<Preferencias>) => void;
}

const DIA = 86400000;

function horas(seg: number): string {
  const h = Math.floor(seg / 3600);
  const m = Math.round((seg % 3600) / 60);
  return h ? `${h}h${String(m).padStart(2, '0')}` : `${m} min`;
}

const diaMes = (t: number) => new Date(t).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

// Dados de exemplo para a prévia apagada (antes do primeiro treino)
function exemplo(): Registro[] {
  const agora = Date.now();
  return Array.from({ length: 14 }, (_, i) => ({
    id: `ex${i}`,
    data: agora - i * 4 * DIA,
    nome: 'Exemplo',
    segundos: 1800 + (i % 3) * 600,
    metros: 5000 + (i % 4) * 1200,
    concluido: true,
    trechos: [
      { pace: 390, segundos: 600, intensidade: 'leve' as const },
      { pace: 300, segundos: 900, intensidade: 'ritmo' as const },
      { pace: 260, segundos: 300, intensidade: 'forte' as const },
    ],
  }));
}

export function Painel({ p, setP, zonas, onAjustes, irPara }: Props) {
  const vazio = p.historico.length === 0;
  const h = vazio ? exemplo() : p.historico;
  const agora = Date.now();
  const sem = semanas(h, agora, 8);
  const atual = sem[sem.length - 1];
  const anterior = sem[sem.length - 2];
  const fatias = tempoPorZona(h, zonas, agora - 30 * DIA).map((f) => ({ nome: f.nome, cor: f.cor, valor: f.segundos }));
  const tempo30 = fatias.reduce((s, f) => s + f.valor, 0);
  const niveis = p.niveis;
  const ultimos = [...p.historico].reverse().slice(0, 6);

  return (
    <>
      <header className="topo">
        <h1 className="titulo">Painel</h1>
        <BotaoAjustes onClick={onAjustes} />
      </header>

      <main className="pagina">
        <div className={`painel ${vazio ? 'previa' : ''}`}>
          <div className="kpis">
            <Kpi titulo="Distância" valor={formatarVelocidade(atual.km, 1)} unidade="km" delta={variacao(atual.km, anterior.km)} serie={sem.map((s) => s.km)} />
            <Kpi titulo="Tempo" valor={horas(atual.segundos)} delta={variacao(atual.segundos, anterior.segundos)} serie={sem.map((s) => s.segundos)} />
            <Kpi titulo="Treinos" valor={String(atual.treinos)} delta={variacao(atual.treinos, anterior.treinos)} serie={sem.map((s) => s.treinos)} />
          </div>
          <p className="kpis-nota">Esta semana · comparado com a anterior</p>

          <section className="cartao vidro">
            <div className="cartao-titulo">
              <h2>Distância por semana</h2>
              <span className="num">{formatarVelocidade(sem.reduce((s, x) => s + x.km, 0), 1)} km em 8 sem.</span>
            </div>
            <Colunas
              itens={sem.map((s, i) => ({
                valor: s.km,
                rotulo: i === sem.length - 1 ? 'Atual' : diaMes(s.inicio),
                texto: `${formatarVelocidade(s.km, 1)} km`,
                destaque: i === sem.length - 1,
              }))}
            />
          </section>

          <section className="cartao vidro">
            <div className="cartao-titulo">
              <h2>Tempo por zona</h2>
              <span>últimos 30 dias</span>
            </div>
            {fatias.length ? (
              <div className="rosca-linha">
                <Rosca
                  fatias={fatias}
                  tam={136}
                  centro={
                    <>
                      <b className="num">{horas(tempo30)}</b>
                      <small>no total</small>
                    </>
                  }
                />
                <Legenda fatias={fatias} formatar={horas} />
              </div>
            ) : (
              <p className="nota-texto">Nenhum treino nos últimos 30 dias.</p>
            )}
            {!zonas && <p className="nota-texto pequena">Informe uma prova em Metas para ver por zona de treino.</p>}
          </section>
        </div>

        {vazio && (
          <div className="previa-convite vidro">
            <b>Seu painel aparece aqui</b>
            <p>Faça um treino na aba Treino. Distância, tempo e zonas entram sozinhos.</p>
            <button className="folha-ok" onClick={() => irPara('treino')}>
              Ir para Treinos
            </button>
          </div>
        )}

        <section className="cartao vidro">
          <div className="cartao-titulo">
            <h2>Índice de forma</h2>
            {niveis.length > 0 && <span>{niveis.length > 1 ? `desde ${diaMes(niveis[0].data)}` : 'primeiro registro'}</span>}
          </div>
          {niveis.length ? (
            <>
              <ArcoKpi valor={niveis[niveis.length - 1].vdot} min={30} max={80} texto={formatarVelocidade(niveis[niveis.length - 1].vdot, 1)} />
              {niveis.length > 1 && (
                <Linha pontos={niveis.slice(-12).map((n) => ({ y: n.vdot, rotulo: diaMes(n.data), valor: formatarVelocidade(n.vdot, 1) }))} altura={150} />
              )}
              <p className="nota-texto pequena">Atualize a prova em Metas sempre que fizer um tempo novo para acompanhar a evolução.</p>
            </>
          ) : (
            <>
              <p className="nota-texto">Informe uma prova recente em Metas para acompanhar a evolução da sua forma.</p>
              <button className="botao-secundario vidro largo" onClick={() => irPara('metas')}>
                Ir para Metas
              </button>
            </>
          )}
        </section>

        {ultimos.length > 0 && (
          <section>
            <h2 className="secao">Últimos treinos</h2>
            <div className="lista">
              {ultimos.map((r) => {
                const km = r.metros / 1000;
                return (
                  <div key={r.id} className="registro vidro">
                    <div className="registro-topo">
                      <span className="registro-data">{new Date(r.data).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}</span>
                      <b>{r.nome}</b>
                      {!r.concluido && <span className="selo">parcial</span>}
                      <button
                        className="registro-apagar"
                        aria-label="Apagar do histórico"
                        onClick={() => {
                          if (!confirm('Apagar este treino do histórico?')) return;
                          vibrar();
                          setP((a) => ({ ...a, historico: a.historico.filter((x) => x.id !== r.id) }));
                        }}
                      >
                        <IconeLixo tam={16} />
                      </button>
                    </div>
                    <PerfilTreino etapas={r.trechos} zonas={zonas} mini />
                    <div className="registro-numeros num">
                      <span>{formatarDistancia(r.metros)}</span>
                      <span>{formatarDuracao(r.segundos)}</span>
                      <span>
                        {km > 0 ? textoPace(p, r.segundos / km) : '–'}
                        {rotuloPace(p)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </>
  );
}

function Kpi({ titulo, valor, unidade, delta, serie }: { titulo: string; valor: string; unidade?: string; delta: number | null; serie: number[] }) {
  return (
    <div className="kpi vidro">
      <span className="rotulo">{titulo}</span>
      <b className="num">
        {valor}
        {unidade && <small>{unidade}</small>}
      </b>
      {delta === null ? (
        <span className="delta neutro">—</span>
      ) : (
        <span className={`delta ${delta >= 0 ? 'sobe' : 'desce'}`}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(Math.round(delta))}%
        </span>
      )}
      <Mini valores={serie} />
    </div>
  );
}
