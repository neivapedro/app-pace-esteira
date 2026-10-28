import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { AbaBar } from './componentes/AbaBar';
import { Ajustes } from './componentes/Ajustes';
import { opcoes, zonasDe } from './lib/contexto';
import { calcular, limitar } from './lib/pace';
import { aplicarPaleta, paleta } from './lib/paletas';
import { lerPreferencias, salvarPreferencias, type Preferencias } from './lib/preferencias';
import { manterTelaAcesa } from './lib/tela-acesa';
import type { Treino } from './lib/treino';
import { definirVibracao } from './lib/vibrar';
import { Executar } from './paginas/Executar';
import { Metas } from './paginas/Metas';
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
          onCor={setKmhTreino}
          onFechar={() => {
            setExecutando(null);
            setKmhTreino(null);
          }}
        />
      ) : (
        <>
          {p.aba === 'ritmo' && <Ritmo {...tela} zonas={zonas} onAjustes={abrirAjustes} />}
          {p.aba === 'treino' && <Treinos {...tela} zonas={zonas} onAjustes={abrirAjustes} onComecar={setExecutando} />}
          {p.aba === 'metas' && <Metas {...tela} zonas={zonas} onAjustes={abrirAjustes} />}
          <AbaBar aba={p.aba} onAba={(aba) => setP((a) => ({ ...a, aba }))} />
        </>
      )}

      {ajustes && <Ajustes {...tela} onFechar={() => setAjustes(false)} />}
    </div>
  );
}
