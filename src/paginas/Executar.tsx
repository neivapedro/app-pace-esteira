import { useEffect, useMemo, useRef, useState } from 'react';
import { NumeroRolante } from '../componentes/NumeroRolante';
import { rotuloEsteira, rotuloPace, textoEsteira, textoPace, type Tela } from '../lib/contexto';
import { formatarDuracao, formatarInclinacao } from '../lib/pace';
import { manterTelaAcesa } from '../lib/tela-acesa';
import { etapaNoTempo, expandir, formatarDistancia, type Etapa, type Treino } from '../lib/treino';
import { vibrar } from '../lib/vibrar';
import { bipe, calar, falar, lerNumero, prepararAudio } from '../lib/voz';

// Treino em andamento: mostra a velocidade de cada etapa, conta o tempo e avisa
// (voz, bipes) antes de cada troca. O relógio é pelo horário real, então não se perde
// se a tela travar por um instante.

type Estado = 'pronto' | 'contando' | 'rodando' | 'pausado' | 'fim';

interface Props extends Tela {
  treino: Treino;
  onFechar: () => void;
  onCor: (kmh: number | null) => void;
}

const CONTAGEM = 3;

export function Executar({ p, setP, treino, onFechar, onCor }: Props) {
  const etapas = useMemo(() => expandir(treino), [treino]);
  const total = etapas.reduce((s, e) => s + e.segundos, 0);
  const [estado, setEstado] = useState<Estado>('pronto');
  const [, setTique] = useState(0);
  // Tempo acumulado antes da última partida + horário da partida
  const acumulado = useRef(0);
  const partida = useRef<number | null>(null);
  const contagem = useRef(0);
  const avisos = useRef(new Set<string>());
  const etapaAnterior = useRef(-2);
  const voz = p.vozTreino;

  const decorrido = () => acumulado.current + (partida.current !== null ? (performance.now() - partida.current) / 1000 : 0);
  const s = estado === 'fim' ? total : decorrido();
  const idx = estado === 'fim' ? -1 : Math.max(0, etapaNoTempo(etapas, s));
  const etapa: Etapa | undefined = etapas[idx];
  const proxima: Etapa | undefined = etapas[idx + 1];
  const restante = etapa ? etapa.inicio + etapa.segundos - s : 0;

  const dizer = (t: string) => voz && falar(t);
  const anunciar = (e: Etapa) =>
    dizer(`${e.nome}${e.detalhe ? ` ${e.detalhe}` : ''}. Coloque ${lerNumero(textoEsteira(p, e.pace))}. ${e.medida === 'distancia' ? formatarDistancia(e.metros) : duracaoFalada(e.segundos)}.`);

  // Tela acesa durante o treino (volta ao ajuste do app ao sair)
  useEffect(() => {
    manterTelaAcesa(true);
    return () => {
      manterTelaAcesa(p.telaAcesa);
      calar();
      onCor(null);
    };
  }, []);

  // Cor do app acompanha o esforço da etapa
  useEffect(() => {
    if (etapa) onCor(3600 / etapa.pace);
  }, [etapa?.pace]);

  // Relógio
  useEffect(() => {
    if (estado !== 'rodando' && estado !== 'contando') return;
    const id = window.setInterval(() => setTique((n) => n + 1), 200);
    return () => clearInterval(id);
  }, [estado]);

  // Contagem 3-2-1 antes de começar
  useEffect(() => {
    if (estado !== 'contando') return;
    const passou = (performance.now() - contagem.current) / 1000;
    const falta = CONTAGEM - Math.floor(passou);
    const chave = `c${falta}`;
    if (falta > 0 && !avisos.current.has(chave)) {
      avisos.current.add(chave);
      bipe();
    }
    if (passou >= CONTAGEM) {
      bipe(true);
      partida.current = performance.now();
      setEstado('rodando');
    }
  });

  // Avisos durante o treino
  useEffect(() => {
    if (estado !== 'rodando') return;
    if (s >= total) {
      acumulado.current = total;
      partida.current = null;
      setEstado('fim');
      bipe(true);
      dizer('Treino concluído. Parabéns!');
      return;
    }
    if (idx !== etapaAnterior.current) {
      if (etapaAnterior.current >= -1 && etapa) {
        bipe(true);
        anunciar(etapa);
      }
      etapaAnterior.current = idx;
    }
    if (!proxima) return;
    const seg = Math.ceil(restante);
    if (seg === 6 && !avisos.current.has(`p${idx}`)) {
      avisos.current.add(`p${idx}`);
      dizer(`Prepare: ${lerNumero(textoEsteira(p, proxima.pace))}`);
    }
    if (seg <= 3 && seg >= 1 && !avisos.current.has(`b${idx}-${seg}`)) {
      avisos.current.add(`b${idx}-${seg}`);
      bipe();
    }
  });

  const comecar = () => {
    prepararAudio();
    vibrar();
    avisos.current.clear();
    etapaAnterior.current = -1;
    contagem.current = performance.now();
    setEstado('contando');
  };

  const pausar = () => {
    vibrar();
    if (estado === 'rodando') {
      acumulado.current = decorrido();
      partida.current = null;
      setEstado('pausado');
      calar();
    } else if (estado === 'pausado') {
      prepararAudio();
      partida.current = performance.now();
      setEstado('rodando');
    }
  };

  const irPara = (i: number) => {
    vibrar();
    const alvo = etapas[Math.max(0, Math.min(etapas.length - 1, i))];
    acumulado.current = alvo.inicio;
    if (partida.current !== null) partida.current = performance.now();
    // Rodando: anuncia a etapa nova; pausado: só posiciona
    etapaAnterior.current = estado === 'rodando' ? -1 : i;
    setTique((n) => n + 1);
  };

  const sair = () => {
    if (estado === 'rodando' || estado === 'pausado') {
      if (!confirm('Encerrar o treino?')) return;
    }
    onFechar();
  };

  const progressoEtapa = etapa ? 1 - restante / etapa.segundos : 1;
  const R = 46;
  const C = 2 * Math.PI * R;

  return (
    <div className={`executar ${etapa ? `int-${etapa.intensidade}` : ''}`}>
      <header className="executar-topo">
        <button className="icone-botao vidro" aria-label="Encerrar" onClick={sair}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <div className="executar-nome">
          <b>{treino.nome}</b>
          <small className="num">
            {formatarDuracao(Math.min(s, total))} de {formatarDuracao(total)}
            {p.inclinacao > 0 && ` · ${formatarInclinacao(p.inclinacao)}`}
          </small>
        </div>
        <button
          className={`icone-botao vidro ${voz ? '' : 'mudo'}`}
          aria-label={voz ? 'Desligar voz' : 'Ligar voz'}
          onClick={() => {
            vibrar();
            setP((a) => ({ ...a, vozTreino: !a.vozTreino }));
            if (voz) calar();
          }}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 9v6h4l5 4V5L8 9z" />
            {voz ? <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /> : <path d="M17 9l5 6M22 9l-5 6" />}
          </svg>
        </button>
      </header>

      <div className="faixa-treino" aria-hidden="true">
        {etapas.map((e, i) => (
          <i
            key={i}
            className={`seg-${e.intensidade} ${i < idx || estado === 'fim' ? 'feito' : i === idx ? 'atual' : ''}`}
            style={{ flexGrow: e.segundos }}
          />
        ))}
      </div>

      {estado === 'fim' ? (
        <main className="executar-fim">
          <div className="trofeu">🏁</div>
          <h2>Treino concluído!</h2>
          <p className="num">
            {formatarDuracao(total)} · {formatarDistancia(etapas.reduce((m, e) => m + e.metros, 0))}
          </p>
          <button className="folha-ok" onClick={onFechar}>
            Fechar
          </button>
        </main>
      ) : (
        <main className="executar-palco">
          <div className="anel">
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r={R} className="anel-fundo" />
              <circle cx="50" cy="50" r={R} className="anel-cor" style={{ strokeDasharray: C, strokeDashoffset: C * (1 - progressoEtapa) }} />
            </svg>
            <div className="anel-miolo">
              <span className="rotulo">
                {etapa?.nome}
                {etapa?.detalhe ? ` · ${etapa.detalhe}` : ''}
              </span>
              <span className="saida">{etapa && <NumeroRolante texto={textoEsteira(p, etapa.pace)} />}</span>
              <span className="saida-unid">
                {rotuloEsteira(p)} · {etapa && textoPace(p, etapa.pace)}
                {rotuloPace(p)}
              </span>
              <span className={`restante num ${restante <= 3.2 && estado === 'rodando' ? 'pisca' : ''}`}>
                {estado === 'contando' ? CONTAGEM - Math.floor((performance.now() - contagem.current) / 1000) : formatarDuracao(Math.ceil(restante))}
              </span>
              {etapa?.medida === 'distancia' && estado !== 'contando' && (
                <small className="num">faltam ≈ {formatarDistancia((restante / etapa.segundos) * etapa.metros)}</small>
              )}
            </div>
          </div>

          {proxima ? (
            <div className="proxima vidro">
              <span className="rotulo">Depois</span>
              <b>
                {proxima.nome}
                {proxima.detalhe ? ` ${proxima.detalhe}` : ''}
              </b>
              <span className="num">
                {textoEsteira(p, proxima.pace)} {rotuloEsteira(p)} · {proxima.medida === 'distancia' ? formatarDistancia(proxima.metros) : formatarDuracao(proxima.segundos)}
              </span>
            </div>
          ) : (
            <div className="proxima vidro">
              <span className="rotulo">Depois</span>
              <b>Fim do treino</b>
            </div>
          )}

          <div className="controles vidro">
            <button aria-label="Etapa anterior" onClick={() => irPara(s - (etapa?.inicio ?? 0) > 3 ? idx : idx - 1)} disabled={estado === 'pronto' || estado === 'contando'}>
              <svg viewBox="0 0 24 24" width="26" height="26">
                <path d="M7 6v12M18 6l-9 6 9 6z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </button>
            <button className="principal" aria-label={estado === 'rodando' ? 'Pausar' : 'Começar'} onClick={estado === 'pronto' ? comecar : pausar} disabled={estado === 'contando'}>
              {estado === 'rodando' ? (
                <svg viewBox="0 0 24 24" width="34" height="34">
                  <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="34" height="34">
                  <path d="M8 5v14l11-7z" fill="currentColor" />
                </svg>
              )}
            </button>
            <button aria-label="Próxima etapa" onClick={() => irPara(idx + 1)} disabled={estado === 'pronto' || estado === 'contando' || !proxima}>
              <svg viewBox="0 0 24 24" width="26" height="26">
                <path d="M17 6v12M6 6l9 6-9 6z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          {estado === 'pronto' && <p className="dica">Toque no play. Aumente o volume para ouvir os avisos.</p>}
          {estado === 'pausado' && <p className="dica">Pausado</p>}
        </main>
      )}
    </div>
  );
}

function duracaoFalada(seg: number): string {
  const s = Math.round(seg);
  const m = Math.floor(s / 60);
  const r = s % 60;
  const min = m ? `${m} ${m === 1 ? 'minuto' : 'minutos'}` : '';
  const sg = r ? `${r} segundos` : '';
  return [min, sg].filter(Boolean).join(' e ');
}
