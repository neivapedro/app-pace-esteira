import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './estilos.css';
import './estilos/vidro.css';
import './estilos/paginas.css';
import './estilos/executar.css';
import './estilos/graficos.css';
import { App } from './App';
import { registrarServiceWorker } from './lib/versao';

registrarServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
