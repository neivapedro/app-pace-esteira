import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { AbaBar } from './componentes/AbaBar';
import { Ajustes } from './componentes/Ajustes';
import { opcoes, zonasDe } from './lib/contexto';
import { anotarNivel } from './lib/historico';
import { calcular, limitar } from './lib/pace';
import { aplicarPaleta, paleta } from './lib/paletas';
import { lerPreferencias, salvarPreferencias, type Aba, type Preferencias } from './lib/preferencias';
import { manterTelaAcesa } from './lib/tela-acesa';
import { comTransicao } from './lib/transicao';
import type { Treino } from './lib/treino';
import { definirVibracao } from './lib/vibrar';
import { vdot } from './lib/zonas';
import { Executar } from './paginas/Executar';
import { Metas } from './paginas/Metas';
import { Painel } from './paginas/Painel';
import { Ritmo } from './paginas/Ritmo';
import { Treinos } from './paginas/Treinos';

export function App() {
  const [p, setP] = useState<Preferencias>(lerPreferencias);
  const [ajustes, setAjustes] = useState(false);
  const [executando, setExecutando] = useState<Treino | null>(null);
  const [kmhTreino, setKmhTreino] = useState<number | null>(null);

  const zonas = useMemo(() => zonasDe(p), [p.nivel]);
  const r = calcular(p.modo, p.modo === 'pace' ? p.pace : p.esteira, p.unidadePace, p.unidadeEsteira, opcoes(p));
  // Cor e "força" do número: pelo esforço do Ritmo ou da etapa do treino em andamento
  const kmh = kmhTreino ?? r.kmh;

  useEffect(() => salvarPreferencias(p), [p]);
  useEffect(() => definirVibracao(p.vibracao), [p.vibracao]);
  useEffect(() => {
    if (!executando) manterTelaAcesa(p.telaAcesa);
  }, [p.telaAcesa, executando]);
  useLayoutEffect(() => {
    aplicarPaleta(paleta(p.paleta), kmh);
    document.documentElement.style.setProperty('--forca', limitar((kmh - 6) / 14, 0, 1).toFixed(3));
  }, [p.paleta, kmh]);

  // Evolução do índice de forma: anota quando a prova muda (espera parar de girar as rodas)
  useEffect(() => {
    if (!p.nivel) return;
    const indice = vdot(p.nivel.km, p.nivel.segundos);
    const t = setTimeout(
      () =>
        setP((a) => {
          // Só anota se o índice mudou (abrir o app noutro dia não cria ponto repetido)
          const ultimo = a.niveis[a.niveis.length - 1];
          if (ultimo && Math.abs(ultimo.vdot - indice) < 0.05) return a;
          return { ...a, niveis: anotarNivel(a.niveis, indice, Date.now()) };
        }),
      1500,
    );
    return () => clearTimeout(t);
  }, [p.nivel?.km, p.nivel?.segundos]);

  const irPara = (aba: Aba, extra?: Partial<Preferencias>) => comTransicao(() => setP((a) => ({ ...a, ...extra, aba })));
  const abrirAjustes = () => setAjustes(true);
  const tela = { p, setP };

  return (
    <div className={`app aba-${p.aba}`}>
      <div className="fundo" aria-hidden="true">
        <i className="bolha b1" />
        <i className="bolha b2" />
        <i className="bolha b3" />
      </div>

      {executando ? (
        <Executar
          key={executando.id}
          {...tela}
          treino={executando}
          zonas={zonas}
          onCor={setKmhTreino}
          onRegistrar={(reg) => setP((a) => ({ ...a, historico: [...a.historico, reg].slice(-400) }))}
          onFechar={() =>
            comTransicao(() => {
              setExecutando(null);
              setKmhTreino(null);
            })
          }
        />
      ) : (
        <>
          {p.aba === 'ritmo' && <Ritmo {...tela} zonas={zonas} onAjustes={abrirAjustes} />}
          {p.aba === 'treino' && <Treinos {...tela} zonas={zonas} onAjustes={abrirAjustes} onComecar={(t) => comTransicao(() => setExecutando(t))} />}
          {p.aba === 'metas' && <Metas {...tela} zonas={zonas} onAjustes={abrirAjustes} irPara={irPara} />}
          {p.aba === 'painel' && <Painel {...tela} zonas={zonas} onAjustes={abrirAjustes} irPara={irPara} />}
          <AbaBar aba={p.aba} onAba={(aba) => irPara(aba)} />
        </>
      )}

      {ajustes && <Ajustes {...tela} onFechar={() => setAjustes(false)} />}
    </div>
  );
}
