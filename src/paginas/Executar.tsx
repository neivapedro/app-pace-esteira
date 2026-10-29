import { useEffect, useMemo, useRef, useState } from 'react';
import { PerfilTreino } from '../componentes/Graficos';
import { IconeAnterior, IconeFechar, IconeMudo, IconePausa, IconePlay, IconeProximo, IconeSom } from '../componentes/Icones';
import { NumeroRolante } from '../componentes/NumeroRolante';
import { Resumo } from '../componentes/Resumo';
import { rotuloEsteira, rotuloPace, textoEsteira, textoPace, type Tela } from '../lib/contexto';
import { formatarDuracao, formatarInclinacao } from '../lib/pace';
import { manterTelaAcesa } from '../lib/tela-acesa';
import { registrar, type Registro } from '../lib/historico';
import { etapaNoTempo, expandir, formatarDistancia, novoId, type Etapa, type Treino } from '../lib/treino';
import { vibrar } from '../lib/vibrar';
import { bipe, calar, falar, lerNumero, prepararAudio } from '../lib/voz';
import type { Zona } from '../lib/zonas';

// Treino em andamento: mostra a velocidade de cada etapa, conta o tempo e avisa
// (voz, bipes) antes de cada troca. O relógio é pelo horário real, então não se perde
// se a tela travar por um instante.

type Estado = 'pronto' | 'contando' | 'rodando' | 'pausado' | 'fim';

interface Props extends Tela {
  treino: Treino;
  onFechar: () => void;
  onCor: (kmh: number | null) => void;
  zonas: Zona[] | null;
  /** Guarda o treino feito no histórico (Painel). */
  onRegistrar: (r: Registro) => void;
}

const CONTAGEM = 3;

export function Executar({ p, setP, treino, onFechar, onCor, zonas, onRegistrar }: Props) {
  const etapas = useMemo(() => expandir(treino), [treino]);
  const total = etapas.reduce((s, e) => s + e.segundos, 0);
  const [estado, setEstado] = useState<Estado>('pronto');
  const [, setTique] = useState(0);
  const [registro, setRegistro] = useState<Registro | null>(null);
  // Tempo acumulado antes da última partida + horário da partida
  const acumulado = useRef(0);
  const partida = useRef<number | null>(null);
  const contagem = useRef(0);
  const avisos = useRef(new Set<string>());
  const etapaAnterior = useRef(-2);
  const voz = p.vozTreino;

  const decorrido = () => acumulado.current + (partida.current !== null ? (performance.now() - partida.current) / 1000 : 0);
  const s = estado === 'fim' ? (registro?.segundos ?? total) : decorrido();
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
      const r = registrar(treino.nome, etapas, total, Date.now(), novoId());
      onRegistrar(r);
      setRegistro(r);
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
      // Mais de 1 minuto feito: guarda o que foi feito e mostra o resumo
      const feito = decorrido();
      if (feito >= 60) {
        acumulado.current = feito;
        partida.current = null;
        calar();
        const r = registrar(treino.nome, etapas, feito, Date.now(), novoId());
        onRegistrar(r);
        setRegistro(r);
        setEstado('fim');
        return;
      }
    }
    onFechar();
  };

  const progressoEtapa = etapa ? 1 - restante / etapa.segundos : 1;
  const R = 46;
  const C = 2 * Math.PI * R;

  return (
    <div className={`executar ${etapa ? `int-${etapa.intensidade}` : ''}`}>
      <header className="executar-topo">
        <button className="icone-botao vidro" aria-label="Encerrar" onClick={estado === 'fim' ? onFechar : sair}>
          <IconeFechar tam={20} />
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
          {voz ? <IconeSom tam={20} /> : <IconeMudo tam={20} />}
        </button>
      </header>

      {estado !== 'fim' && (
        <div className="perfil-andamento">
          <PerfilTreino etapas={etapas} zonas={zonas} progresso={s} />
        </div>
      )}

      {estado === 'fim' && registro ? (
        <Resumo p={p} registro={registro} zonas={zonas} onFechar={onFechar} />
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
              <IconeAnterior tam={26} />
            </button>
            <button className="principal" aria-label={estado === 'rodando' ? 'Pausar' : 'Começar'} onClick={estado === 'pronto' ? comecar : pausar} disabled={estado === 'contando'}>
              {estado === 'rodando' ? <IconePausa tam={34} /> : <IconePlay tam={34} />}
            </button>
            <button aria-label="Próxima etapa" onClick={() => irPara(idx + 1)} disabled={estado === 'pronto' || estado === 'contando' || !proxima}>
              <IconeProximo tam={26} />
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
