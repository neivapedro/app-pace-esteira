import { useMemo, useState } from 'react';
import { textoPace, rotuloPace, type Tela } from '../lib/contexto';
import { tempoPorZona, type Registro } from '../lib/historico';
import { compartilharImagem, gerarCartao } from '../lib/imagem';
import { formatarDuracao, formatarVelocidade } from '../lib/pace';
import { paleta, tomDaVelocidade } from '../lib/paletas';
import { formatarDistancia } from '../lib/treino';
import { vibrar } from '../lib/vibrar';
import { zonaProxima, type Zona } from '../lib/zonas';
import { Legenda, PerfilTreino, Rosca } from './Graficos';
import { IconeCheck, IconeCompartilhar } from './Icones';

// Fim do treino: comemoração, números, gráfico do treino, tempo por zona e imagem para compartilhar.

const CORES_CONFETE = ['#ff4d6d', '#ffd166', '#3ddc97', '#4cc9f0', '#b388ff', '#ff8c42'];

export function Resumo({ p, registro, zonas, onFechar }: Pick<Tela, 'p'> & { registro: Registro; zonas: Zona[] | null; onFechar: () => void }) {
  const [gerando, setGerando] = useState(false);
  const fatias = tempoPorZona([registro], zonas).map((f) => ({ nome: f.nome, cor: f.cor, valor: f.segundos }));
  const km = registro.metros / 1000;
  const paceMedio = km > 0 ? registro.segundos / km : 0;
  const confete = useMemo(
    () =>
      Array.from({ length: 46 }, (_, i) => ({
        left: `${Math.random() * 100}%`,
        background: CORES_CONFETE[i % CORES_CONFETE.length],
        animationDelay: `${Math.random() * 0.6}s`,
        animationDuration: `${2.2 + Math.random() * 1.6}s`,
        ['--giro' as string]: `${Math.random() * 720 - 360}deg`,
        ['--deriva' as string]: `${Math.random() * 120 - 60}px`,
      })),
    [],
  );

  const compartilhar = async () => {
    vibrar();
    setGerando(true);
    const pal = paleta(p.paleta);
    const total = fatias.reduce((s, f) => s + f.valor, 0) || 1;
    const blob = await gerarCartao({
      nome: registro.nome,
      data: new Date(registro.data).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }),
      distancia: `${formatarVelocidade(km, 2)} km`,
      linha: `${formatarDuracao(registro.segundos)} · ${textoPace(p, paceMedio)}${rotuloPace(p)}`,
      barras: registro.trechos.map((t) => ({
        segundos: t.segundos,
        velocidade: 3600 / t.pace,
        cor: zonas ? zonaProxima(zonas, t.pace).cor : `hsla(${tomDaVelocidade(3600 / t.pace, pal)}, ${pal.s}%, ${pal.l}%, ${t.intensidade === 'forte' ? 1 : t.intensidade === 'ritmo' ? 0.75 : 0.5})`,
      })),
      zonas: fatias.map((f) => ({ nome: f.nome, cor: f.cor, pct: (f.valor / total) * 100 })),
      paleta: pal,
      tom: tomDaVelocidade(km > 0 ? 3600 / paceMedio : 10, pal),
    });
    setGerando(false);
    if (blob) await compartilharImagem(blob, registro.nome);
  };

  return (
    <main className="resumo">
      {registro.concluido && (
        <div className="confete" aria-hidden="true">
          {confete.map((s, i) => (
            <i key={i} style={s} />
          ))}
        </div>
      )}
      <div className="resumo-check">
        <IconeCheck tam={40} />
      </div>
      <h2>{registro.concluido ? 'Treino concluído!' : 'Treino encerrado'}</h2>
      <p className="resumo-nome">{registro.nome}</p>

      <div className="resumo-numeros">
        <div>
          <span className="rotulo">Distância</span>
          <b className="num">{formatarDistancia(registro.metros)}</b>
        </div>
        <div>
          <span className="rotulo">Tempo</span>
          <b className="num">{formatarDuracao(registro.segundos)}</b>
        </div>
        <div>
          <span className="rotulo">Pace médio</span>
          <b className="num">
            {paceMedio ? textoPace(p, paceMedio) : '–'}
            <small>{rotuloPace(p)}</small>
          </b>
        </div>
      </div>

      <div className="cartao superficie resumo-cartao">
        <span className="rotulo">Seu treino</span>
        <PerfilTreino etapas={registro.trechos} zonas={zonas} />
        {fatias.length > 0 && (
          <div className="resumo-zonas">
            <Rosca fatias={fatias} tam={120} centro={<b className="num">{formatarDuracao(registro.segundos)}</b>} />
            <Legenda fatias={fatias} formatar={formatarDuracao} />
          </div>
        )}
      </div>

      <div className="folha-botoes resumo-botoes">
        <button className="botao-secundario superficie" onClick={compartilhar} disabled={gerando}>
          <IconeCompartilhar tam={18} /> {gerando ? 'Gerando…' : 'Compartilhar'}
        </button>
        <button className="folha-ok" onClick={onFechar}>
          Fechar
        </button>
      </div>
    </main>
  );
}
