import { useEffect, useMemo, useRef, useState } from 'react';
import { Folha } from '../componentes/Folha';
import { Medidor } from '../componentes/Medidor';
import { NumeroRolante } from '../componentes/NumeroRolante';
import { ESCALA_ESTEIRA, ESCALA_INCLINACAO, ESCALA_PACE, Regua, type FaixaRegua } from '../componentes/Regua';
import { Repetidor } from '../componentes/Repetidor';
import { opcoes, type Tela } from '../lib/contexto';
import {
  calcular,
  converterValor,
  esteiraParaPace,
  FAIXA_ESTEIRA,
  FAIXA_PACE,
  formatarDuracao,
  formatarInclinacao,
  formatarPace,
  formatarVelocidade,
  limitar,
  paceNaUnidade,
  PROVAS,
  tempoDaProva,
  type Modo,
} from '../lib/pace';
import { chaveUso, maisUsados, registrarUso } from '../lib/usos';
import { vibrar } from '../lib/vibrar';
import { falar, lerNumero, lerPace } from '../lib/voz';
import { zonaDoPace, type Zona } from '../lib/zonas';

interface Props extends Tela {
  zonas: Zona[] | null;
  onAjustes: () => void;
}

export function Ritmo({ p, setP, zonas, onAjustes }: Props) {
  const [inclinacao, setInclinacao] = useState(false);
  const o = opcoes(p);
  const valor = p.modo === 'pace' ? p.pace : p.esteira;
  const faixa = p.modo === 'pace' ? FAIXA_PACE[p.unidadePace] : FAIXA_ESTEIRA[p.unidadeEsteira];
  const r = calcular(p.modo, valor, p.unidadePace, p.unidadeEsteira, o);
  const unidade = p.modo === 'pace' ? p.unidadePace : p.unidadeEsteira;
  const favoritos = p.modo === 'pace' ? p.favoritosPace : p.favoritosEsteira;
  const sugeridos = maisUsados(p.usos, p.modo, unidade, favoritos);
  const salvo = favoritos.includes(valor);
  const zona = zonas ? zonaDoPace(zonas, r.segPorKm) : undefined;

  const mudarValor = (v: number) => {
    const n = limitar(v, faixa.min, faixa.max);
    setP((a) => (a.modo === 'pace' ? { ...a, pace: n } : { ...a, esteira: n }));
  };

  // Valor parado alguns segundos: conta como "usado" e, se ligado, fala a velocidade
  const primeiro = useRef(true);
  useEffect(() => {
    if (primeiro.current) {
      primeiro.current = false;
      return;
    }
    const fala = p.falarRegua
      ? window.setTimeout(() => falar(p.modo === 'pace' ? `${lerNumero(r.saida)}` : `${lerPace(r.saida)} por ${p.unidadePace === 'km' ? 'quilômetro' : 'milha'}`), 900)
      : 0;
    const uso = window.setTimeout(() => setP((a) => ({ ...a, usos: registrarUso(a.usos, chaveUso(p.modo, unidade, valor)) })), 3000);
    return () => {
      clearTimeout(fala);
      clearTimeout(uso);
    };
  }, [valor, p.modo, unidade]);

  const trocarModo = (m: Modo) => {
    if (m === p.modo) return;
    vibrar();
    setP((a) => {
      const v = converterValor(a.modo, a.modo === 'pace' ? a.pace : a.esteira, a.unidadePace, a.unidadeEsteira, opcoes(a));
      return m === 'pace' ? { ...a, modo: m, pace: v } : { ...a, modo: m, esteira: v };
    });
  };

  const alternarFavorito = () => {
    vibrar();
    setP((a) => {
      const chave = a.modo === 'pace' ? 'favoritosPace' : 'favoritosEsteira';
      const v = a.modo === 'pace' ? a.pace : a.esteira;
      const lista = a[chave].includes(v) ? a[chave].filter((x) => x !== v) : [...a[chave], v].sort((x, y) => x - y).slice(-12);
      return { ...a, [chave]: lista };
    });
  };

  // Zonas pessoais como faixas coloridas na régua
  const faixas = useMemo<FaixaRegua[] | undefined>(() => {
    if (!zonas || !p.zonasNaRegua) return undefined;
    return zonas.map((z) =>
      p.modo === 'pace'
        ? { de: Math.ceil(paceNaUnidade(z.rapido, p.unidadePace)), ate: Math.floor(paceNaUnidade(z.lento, p.unidadePace)), cor: z.cor }
        : {
            de: Math.round(esteiraParaPace(z.lento, p.unidadeEsteira, o) * 10),
            ate: Math.round(esteiraParaPace(z.rapido, p.unidadeEsteira, o) * 10),
            cor: z.cor,
          },
    );
  }, [zonas, p.zonasNaRegua, p.modo, p.unidadePace, p.unidadeEsteira, p.inclinacao, p.fator]);

  const rotuloValor = (v: number) => (p.modo === 'pace' ? formatarPace(v) : formatarVelocidade(v / 10));
  const passo = p.modo === 'pace' ? '1 s' : '0,1';

  return (
    <>
      <header className="topo">
        <div className="segmento vidro" data-lado={p.modo}>
          <span className="segmento-pilula" />
          <button className={p.modo === 'pace' ? 'ativo' : ''} onClick={() => trocarModo('pace')}>
            Pace <Seta /> Esteira
          </button>
          <button className={p.modo === 'esteira' ? 'ativo' : ''} onClick={() => trocarModo('esteira')}>
            Esteira <Seta /> Pace
          </button>
        </div>
        <BotaoAjustes onClick={onAjustes} />
      </header>

      <main className="palco">
        <div className="entrada">
          <span className="rotulo">{p.modo === 'pace' ? (p.inclinacao > 0 ? 'Esforço de' : 'Seu pace') : 'Velocidade da esteira'}</span>
          <div className="entrada-valor" key={p.modo}>
            <NumeroRolante texto={r.entrada} className="num" />
            <span className="unid">{r.unidadeEntrada}</span>
          </div>
        </div>

        <Medidor
          kmh={r.kmh}
          onGirar={(n) => {
            vibrar();
            mudarValor(p.modo === 'pace' ? valor - n : valor + n);
          }}
        >
          <span className="rotulo">{p.modo === 'pace' ? 'Coloque na esteira' : 'Seu pace'}</span>
          <span className="saida" key={p.modo}>
            <NumeroRolante texto={r.saida} />
          </span>
          <span className="saida-unid">{r.unidadeSaida}</span>
        </Medidor>

        <p className="detalhe">
          {zona && (
            <span className="zona-tag" style={{ ['--zc' as string]: zona.cor }}>
              {zona.nome}
            </span>
          )}
          {r.detalhe}
        </p>
      </main>

      <section className="provas vidro" aria-label="Tempo nas provas">
        {PROVAS.map((prova) => (
          <div key={prova.nome} className="prova">
            <span>{prova.nome}</span>
            <strong className="num">{formatarDuracao(tempoDaProva(r.segPorKm, prova.km))}</strong>
          </div>
        ))}
      </section>

      <section className="favoritos">
        <button className={`estrela vidro ${salvo ? 'ligada' : ''}`} onClick={alternarFavorito} aria-label={salvo ? 'Tirar dos salvos' : 'Salvar este valor'}>
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" />
          </svg>
        </button>
        <div className="chips">
          {favoritos.length === 0 && sugeridos.length === 0 ? (
            <span className="chips-vazio">Salve seus ritmos na estrela</span>
          ) : (
            <>
              {favoritos.map((f) => (
                <button
                  key={`f${f}`}
                  className={`chip vidro num ${f === valor ? 'ativo' : ''}`}
                  onClick={() => {
                    vibrar();
                    mudarValor(f);
                  }}
                >
                  {rotuloValor(f)}
                </button>
              ))}
              {sugeridos.map((f) => (
                <button
                  key={`s${f}`}
                  className={`chip sugerido num ${f === valor ? 'ativo' : ''}`}
                  aria-label={`Ritmo mais usado: ${rotuloValor(f)}`}
                  onClick={() => {
                    vibrar();
                    mudarValor(f);
                  }}
                >
                  {rotuloValor(f)}
                </button>
              ))}
            </>
          )}
        </div>
        <button className={`inclinacao-botao vidro ${p.inclinacao > 0 ? 'ligada' : ''}`} onClick={() => setInclinacao(true)} aria-label="Inclinação da esteira">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 19h18L3 9z" />
          </svg>
          <span className="num">{formatarInclinacao(p.inclinacao)}</span>
        </button>
      </section>

      <section className="controle">
        <div className="regua-area vidro">
          <Repetidor onPasso={() => mudarValor(valor - 1)} rotulo={`Menos ${passo}`}>
            −
          </Repetidor>
          <Regua
            key={`${p.modo}-${p.unidadePace}-${p.unidadeEsteira}`}
            escala={p.modo === 'pace' ? ESCALA_PACE : ESCALA_ESTEIRA}
            min={faixa.min}
            max={faixa.max}
            valor={valor}
            onChange={mudarValor}
            faixas={faixas}
            onToque={() => !p.dicaVista && setP((a) => ({ ...a, dicaVista: true }))}
          />
          <Repetidor onPasso={() => mudarValor(valor + 1)} rotulo={`Mais ${passo}`}>
            +
          </Repetidor>
        </div>
        <p className={`dica ${p.dicaVista ? 'some' : ''}`}>Deslize a régua ou gire o velocímetro</p>
      </section>

      {inclinacao && <Inclinacao {...{ p, setP }} onFechar={() => setInclinacao(false)} />}
    </>
  );
}

function Inclinacao({ p, setP, onFechar }: Tela & { onFechar: () => void }) {
  const meios = Math.round(p.inclinacao * 2);
  const mudar = (m: number) => setP((a) => ({ ...a, inclinacao: limitar(m, 0, 30) / 2 }));
  return (
    <Folha titulo="Inclinação" onFechar={onFechar}>
      {(fechar) => (
        <>
          <div className="inclinacao-valor">
            <NumeroRolante texto={formatarVelocidade(p.inclinacao, 1)} className="num" />
            <span>%</span>
          </div>
          <div className="regua-area vidro">
            <Repetidor onPasso={() => mudar(meios - 1)} rotulo="Menos 0,5%">
              −
            </Repetidor>
            <Regua escala={ESCALA_INCLINACAO} min={0} max={30} valor={meios} onChange={mudar} />
            <Repetidor onPasso={() => mudar(meios + 1)} rotulo="Mais 0,5%">
              +
            </Repetidor>
          </div>
          <p className="nota-texto">
            Com subida, a mesma velocidade cansa mais. O app ajusta a velocidade da esteira para manter o <b>esforço</b> do pace escolhido (cada 1% vale
            cerca de 4,5% a mais de velocidade no plano, pela equação de corrida do ACSM).
          </p>
          <p className="nota-texto">Se você usa 1% só para imitar a rua, deixe em 0% aqui.</p>
          <div className="folha-botoes">
            <button className="botao-secundario vidro" onClick={() => mudar(0)}>
              Zerar
            </button>
            <button className="folha-ok" onClick={fechar}>
              Pronto
            </button>
          </div>
        </>
      )}
    </Folha>
  );
}

export function BotaoAjustes({ onClick }: { onClick: () => void }) {
  return (
    <button className="icone-botao vidro" aria-label="Ajustes" onClick={onClick}>
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
        <circle cx="16" cy="7" r="2.2" />
        <circle cx="10" cy="17" r="2.2" />
      </svg>
    </button>
  );
}

function Seta() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}
