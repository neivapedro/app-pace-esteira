import { useState, type ReactNode } from 'react';
import { BotaoAjustes } from '../paginas/Ritmo';

// Página com título grande que, ao rolar, vira um título pequeno no topo (padrão do iPhone).

export function Pagina({ titulo, onAjustes, children }: { titulo: string; onAjustes: () => void; children: ReactNode }) {
  const [rolado, setRolado] = useState(false);
  return (
    <>
      <header className={`topo topo-pagina ${rolado ? 'rolado' : ''}`}>
        <span className="titulo-compacto" aria-hidden={!rolado}>
          {titulo}
        </span>
        <BotaoAjustes onClick={onAjustes} />
      </header>
      <main className="pagina" onScroll={(e) => setRolado(e.currentTarget.scrollTop > 32)}>
        <h1 className="titulo">{titulo}</h1>
        {children}
      </main>
    </>
  );
}
