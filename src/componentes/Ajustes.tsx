import type { Tela } from '../lib/contexto';
import {
  arredondarEsteira,
  FAIXA_ESTEIRA,
  FAIXA_PACE,
  formatarVelocidade,
  limitar,
  paceEmSegPorKm,
  paceNaUnidade,
  velocidadeEmKmh,
  velocidadeNaUnidade,
  type UnidadeEsteira,
  type UnidadePace,
} from '../lib/pace';
import { amostra, PALETAS } from '../lib/paletas';
import { vibrar } from '../lib/vibrar';
import { vozDisponivel } from '../lib/voz';
import { Folha } from './Folha';
import { Repetidor } from './Repetidor';

export function Ajustes({ p, setP, onFechar }: Tela & { onFechar: () => void }) {
  const mudarUnidadePace = (u: UnidadePace) =>
    setP((a) => {
      if (a.unidadePace === u) return a;
      const f = FAIXA_PACE[u];
      const conv = (s: number) => limitar(Math.round(paceNaUnidade(paceEmSegPorKm(s, a.unidadePace), u)), f.min, f.max);
      return { ...a, unidadePace: u, pace: conv(a.pace), favoritosPace: [...new Set(a.favoritosPace.map(conv))] };
    });

  const mudarUnidadeEsteira = (u: UnidadeEsteira) =>
    setP((a) => {
      if (a.unidadeEsteira === u) return a;
      const f = FAIXA_ESTEIRA[u];
      const conv = (d: number) =>
        limitar(Math.round(arredondarEsteira(velocidadeNaUnidade(velocidadeEmKmh(d / 10, a.unidadeEsteira), u)) * 10), f.min, f.max);
      return { ...a, unidadeEsteira: u, esteira: conv(a.esteira), favoritosEsteira: [...new Set(a.favoritosEsteira.map(conv))] };
    });

  // Calibração: quanto o relógio (GPS ou sensor no tênis) marca quando a esteira mostra 10 km
  const relogio = Math.round(p.fator * 1000) / 100;
  const mudarRelogio = (km: number) => setP((a) => ({ ...a, fator: limitar(Math.round(km * 20) / 20, 8.5, 11.5) / 10 }));

  return (
    <Folha titulo="Ajustes" onFechar={onFechar}>
      {(fechar) => (
        <>
          <div className="cores">
            <span>Cores</span>
            <div className="paletas">
              {PALETAS.map((x) => (
                <button
                  key={x.id}
                  className={`paleta ${x.id === p.paleta ? 'ativo' : ''}`}
                  aria-pressed={x.id === p.paleta}
                  onClick={() => {
                    vibrar();
                    setP((a) => ({ ...a, paleta: x.id }));
                  }}
                >
                  <i style={{ background: amostra(x) }} />
                  {x.nome}
                </button>
              ))}
            </div>
          </div>

          <div className="linha">
            <span>Pace em</span>
            <Opcoes
              valor={p.unidadePace}
              opcoes={[
                ['km', 'min/km'],
                ['mi', 'min/milha'],
              ]}
              onChange={mudarUnidadePace}
            />
          </div>

          <div className="linha">
            <span>Esteira em</span>
            <Opcoes
              valor={p.unidadeEsteira}
              opcoes={[
                ['kmh', 'km/h'],
                ['mph', 'mph'],
              ]}
              onChange={mudarUnidadeEsteira}
            />
          </div>

          <Chave rotulo="Vibrar ao ajustar" valor={p.vibracao} onChange={(v) => setP((a) => ({ ...a, vibracao: v }))} />
          <Chave rotulo="Manter a tela acesa" valor={p.telaAcesa} onChange={(v) => setP((a) => ({ ...a, telaAcesa: v }))} />
          {vozDisponivel() && (
            <>
              <Chave rotulo="Falar a velocidade ao parar a régua" valor={p.falarRegua} onChange={(v) => setP((a) => ({ ...a, falarRegua: v }))} />
              <Chave rotulo="Avisos falados no treino" valor={p.vozTreino} onChange={(v) => setP((a) => ({ ...a, vozTreino: v }))} />
            </>
          )}

          <div className="calibrar">
            <span>Calibrar a esteira</span>
            <p className="nota-texto">Quando a esteira mostra 10 km, quanto marca seu relógio (com sensor no tênis) ou uma pista medida?</p>
            <div className="ajuste grande">
              <Repetidor className="mini" rotulo="Menos 50 metros" onPasso={() => mudarRelogio(relogio - 0.05)}>
                −
              </Repetidor>
              <span className="num">{formatarVelocidade(relogio, 2)} km</span>
              <Repetidor className="mini" rotulo="Mais 50 metros" onPasso={() => mudarRelogio(relogio + 0.05)}>
                +
              </Repetidor>
            </div>
            <p className="nota-texto">
              {p.fator === 1
                ? 'Deixe em 10,00 se a esteira estiver certa.'
                : `A esteira ${p.fator < 1 ? 'mostra a mais' : 'mostra a menos'}: o app corrige a velocidade em ${formatarVelocidade(Math.abs(1 / p.fator - 1) * 100, 1)}%.`}
              {p.fator !== 1 && (
                <button className="botao-texto" onClick={() => mudarRelogio(10)}>
                  Zerar
                </button>
              )}
            </p>
          </div>

          <div className="nota">
            <strong>Dica de treino</strong>
            <p>Na esteira não há vento nem subida. Muitos corredores usam 1% de inclinação para chegar mais perto do esforço da rua.</p>
          </div>

          <div className="nota">
            <strong>Deixar na Tela de Início</strong>
            <p>
              No Safari, toque em <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>. O app abre em tela cheia e funciona sem internet.
            </p>
          </div>

          <p className="versao">Versão {__VERSAO_APP__}</p>
          <button className="folha-ok" onClick={fechar}>
            Pronto
          </button>
        </>
      )}
    </Folha>
  );
}

function Chave({ rotulo, valor, onChange }: { rotulo: string; valor: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="linha">
      <span>{rotulo}</span>
      <input
        type="checkbox"
        className="chave"
        checked={valor}
        onChange={(e) => {
          vibrar();
          onChange(e.target.checked);
        }}
      />
    </label>
  );
}

function Opcoes<T extends string>({ valor, opcoes, onChange }: { valor: T; opcoes: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="opcoes">
      {opcoes.map(([v, nome]) => (
        <button
          key={v}
          className={v === valor ? 'ativo' : ''}
          onClick={() => {
            vibrar();
            onChange(v);
          }}
        >
          {nome}
        </button>
      ))}
    </div>
  );
}
