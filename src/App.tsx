import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Medidor } from './componentes/Medidor';
import { Regua } from './componentes/Regua';
import { Ajustes } from './componentes/Ajustes';
import {
  arredondarEsteira,
  calcular,
  converterValor,
  FAIXA_ESTEIRA,
  FAIXA_PACE,
  formatarDuracao,
  formatarPace,
  formatarVelocidade,
  limitar,
  paceEmSegPorKm,
  paceNaUnidade,
  PROVAS,
  tempoDaProva,
  velocidadeEmKmh,
  velocidadeNaUnidade,
  type Modo,
  type UnidadeEsteira,
  type UnidadePace,
} from './lib/pace';
import { aplicarPaleta, paleta } from './lib/paletas';
import { lerPreferencias, salvarPreferencias, type Preferencias } from './lib/preferencias';
import { definirVibracao, vibrar } from './lib/vibrar';

export function App() {
  const [p, setP] = useState<Preferencias>(lerPreferencias);
  const [ajustes, setAjustes] = useState(false);

  const valor = p.modo === 'pace' ? p.pace : p.esteira;
  const faixa = p.modo === 'pace' ? FAIXA_PACE[p.unidadePace] : FAIXA_ESTEIRA[p.unidadeEsteira];
  const r = calcular(p.modo, valor, p.unidadePace, p.unidadeEsteira);
  const favoritos = p.modo === 'pace' ? p.favoritosPace : p.favoritosEsteira;
  const salvo = favoritos.includes(valor);

  useEffect(() => salvarPreferencias(p), [p]);
  useEffect(() => definirVibracao(p.vibracao), [p.vibracao]);
  useLayoutEffect(() => aplicarPaleta(paleta(p.paleta), r.kmh), [p.paleta, r.kmh]);

  const mudarValor = (v: number) => {
    const n = limitar(v, faixa.min, faixa.max);
    setP((a) => (a.modo === 'pace' ? { ...a, pace: n } : { ...a, esteira: n }));
  };

  const trocarModo = (m: Modo) => {
    if (m === p.modo) return;
    vibrar();
    setP((a) => {
      const v = converterValor(a.modo, a.modo === 'pace' ? a.pace : a.esteira, a.unidadePace, a.unidadeEsteira);
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

  const rotuloValor = (v: number) => (p.modo === 'pace' ? formatarPace(v) : formatarVelocidade(v / 10));
  const passo = p.modo === 'pace' ? '1 s' : '0,1';

  return (
    <div className="app">
      <div className="fundo" aria-hidden="true">
        <i className="bolha b1" />
        <i className="bolha b2" />
        <i className="bolha b3" />
      </div>

      <header className="topo">
        <div className="segmento" data-lado={p.modo}>
          <span className="segmento-pilula" />
          <button className={p.modo === 'pace' ? 'ativo' : ''} onClick={() => trocarModo('pace')}>
            Pace <Seta /> Esteira
          </button>
          <button className={p.modo === 'esteira' ? 'ativo' : ''} onClick={() => trocarModo('esteira')}>
            Esteira <Seta /> Pace
          </button>
        </div>
        <button className="icone-botao" aria-label="Ajustes" onClick={() => setAjustes(true)}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
            <circle cx="16" cy="7" r="2.2" />
            <circle cx="10" cy="17" r="2.2" />
          </svg>
        </button>
      </header>

      <main className="palco">
        <div className="entrada">
          <span className="rotulo">{p.modo === 'pace' ? 'Seu pace' : 'Velocidade da esteira'}</span>
          <div className="entrada-valor" key={p.modo}>
            <span className="num">{r.entrada}</span>
            <span className="unid">{r.unidadeEntrada}</span>
          </div>
        </div>

        <Medidor kmh={r.kmh}>
          <span className="rotulo">{p.modo === 'pace' ? 'Coloque na esteira' : 'Seu pace'}</span>
          <span className="saida num" key={p.modo}>
            {r.saida}
          </span>
          <span className="saida-unid">{r.unidadeSaida}</span>
        </Medidor>

        <p className="detalhe">{r.detalhe}</p>
      </main>

      <section className="provas" aria-label="Tempo nas provas">
        {PROVAS.map((prova) => (
          <div key={prova.nome} className="prova">
            <span>{prova.nome}</span>
            <strong className="num">{formatarDuracao(tempoDaProva(r.segPorKm, prova.km))}</strong>
          </div>
        ))}
      </section>

      <section className="favoritos">
        <button className={`estrela ${salvo ? 'ligada' : ''}`} onClick={alternarFavorito} aria-label={salvo ? 'Tirar dos salvos' : 'Salvar este valor'}>
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" />
          </svg>
        </button>
        <div className="chips">
          {favoritos.length === 0 ? (
            <span className="chips-vazio">Salve seus ritmos na estrela</span>
          ) : (
            favoritos.map((f) => (
              <button
                key={f}
                className={`chip num ${f === valor ? 'ativo' : ''}`}
                onClick={() => {
                  vibrar();
                  mudarValor(f);
                }}
              >
                {rotuloValor(f)}
              </button>
            ))
          )}
        </div>
      </section>

      <section className="controle">
        <div className="regua-area">
          <Repetidor onPasso={() => mudarValor(valor - 1)} rotulo={`Menos ${passo}`}>
            −
          </Repetidor>
          <Regua
            key={`${p.modo}-${p.unidadePace}-${p.unidadeEsteira}`}
            tipo={p.modo}
            min={faixa.min}
            max={faixa.max}
            valor={valor}
            onChange={mudarValor}
            onToque={() => !p.dicaVista && setP((a) => ({ ...a, dicaVista: true }))}
          />
          <Repetidor onPasso={() => mudarValor(valor + 1)} rotulo={`Mais ${passo}`}>
            +
          </Repetidor>
        </div>
        <p className={`dica ${p.dicaVista ? 'some' : ''}`}>Deslize a régua para ajustar</p>
      </section>

      {ajustes && (
        <Ajustes
          p={p}
          onFechar={() => setAjustes(false)}
          onUnidadePace={mudarUnidadePace}
          onUnidadeEsteira={mudarUnidadeEsteira}
          onVibracao={(v) => setP((a) => ({ ...a, vibracao: v }))}
          onPaleta={(id) => setP((a) => ({ ...a, paleta: id }))}
        />
      )}
    </div>
  );
}

function Seta() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

/** Botão que repete enquanto fica pressionado (e acelera). */
function Repetidor({ onPasso, rotulo, children }: { onPasso: () => void; rotulo: string; children: string }) {
  const passo = useRef(onPasso);
  passo.current = onPasso;
  const timer = useRef<number>(0);

  const parar = () => clearTimeout(timer.current);
  const iniciar = (e: React.PointerEvent) => {
    e.preventDefault();
    parar();
    vibrar();
    passo.current();
    let espera = 380;
    const repetir = () => {
      passo.current();
      vibrar();
      espera = Math.max(45, espera * 0.8);
      timer.current = window.setTimeout(repetir, espera);
    };
    timer.current = window.setTimeout(repetir, espera);
  };

  useEffect(() => parar, []);

  return (
    <button
      className="passo"
      aria-label={rotulo}
      onPointerDown={iniciar}
      onPointerUp={parar}
      onPointerLeave={parar}
      onPointerCancel={parar}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPasso();
        }
      }}
    >
      {children}
    </button>
  );
}
