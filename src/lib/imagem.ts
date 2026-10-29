import type { Paleta } from './paletas';

// Cartão do treino em imagem (formato story, 1080 × 1920) para compartilhar.

export interface DadosCartao {
  nome: string;
  data: string;
  distancia: string;
  linha: string; // "37:00 · 6:54/km"
  barras: { segundos: number; velocidade: number; cor: string }[];
  zonas: { nome: string; cor: string; pct: number }[];
  paleta: Paleta;
  tom: number;
}

const FONTE = '-apple-system, "SF Pro Rounded", system-ui, sans-serif';

function retangulo(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + rr, y);
  c.arcTo(x + w, y, x + w, y + h, rr);
  c.arcTo(x + w, y + h, x, y + h, rr);
  c.arcTo(x, y + h, x, y, rr);
  c.arcTo(x, y, x + w, y, rr);
  c.closePath();
}

export async function gerarCartao(d: DadosCartao): Promise<Blob | null> {
  const W = 1080;
  const H = 1920;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const c = cv.getContext('2d');
  if (!c) return null;
  const { s, l } = d.paleta;
  const cor = (dh: number, ll = l, a = 1) => `hsla(${d.tom + dh}, ${s}%, ${ll}%, ${a})`;

  // Fundo com brilhos na cor da paleta
  c.fillStyle = d.paleta.fundo;
  c.fillRect(0, 0, W, H);
  const brilho = (x: number, y: number, r: number, dh: number, a: number) => {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, cor(dh, 50, a));
    g.addColorStop(1, cor(dh, 50, 0));
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
  };
  brilho(180, 420, 760, 0, 0.55);
  brilho(980, 900, 700, d.paleta.d, 0.4);
  brilho(500, 1900, 800, -d.paleta.d, 0.3);

  c.textBaseline = 'alphabetic';
  c.fillStyle = 'rgba(255,255,255,0.6)';
  c.font = `700 34px ${FONTE}`;
  c.letterSpacing = '6px';
  c.fillText('PACE NA ESTEIRA', 90, 200);
  c.letterSpacing = '0px';
  c.font = `600 36px ${FONTE}`;
  c.fillText(d.data, 90, 256);

  c.fillStyle = '#fff';
  c.font = `800 76px ${FONTE}`;
  c.fillText(d.nome, 90, 420, W - 180);

  // Distância grande com degradê
  c.font = `900 230px ${FONTE}`;
  const g = c.createLinearGradient(0, 520, 0, 760);
  g.addColorStop(0, '#fff');
  g.addColorStop(0.55, cor(0));
  g.addColorStop(1, cor(d.paleta.d, l - 6));
  c.fillStyle = g;
  c.fillText(d.distancia, 80, 740, W - 160);
  c.fillStyle = 'rgba(255,255,255,0.85)';
  c.font = `700 56px ${FONTE}`;
  c.fillText(d.linha, 90, 830, W - 180);

  // Perfil do treino
  const x0 = 90;
  const y0 = 960;
  const larg = W - 180;
  const alt = 420;
  c.fillStyle = 'rgba(255,255,255,0.06)';
  retangulo(c, x0 - 30, y0 - 40, larg + 60, alt + 80, 48);
  c.fill();
  const total = d.barras.reduce((a, b) => a + b.segundos, 0) || 1;
  const vmax = Math.max(...d.barras.map((b) => b.velocidade));
  const vmin = Math.min(...d.barras.map((b) => b.velocidade));
  const vao = d.barras.length > 40 ? 2 : 6;
  let x = x0;
  for (const b of d.barras) {
    const w = Math.max(3, (b.segundos / total) * larg - vao);
    const h = vmax === vmin ? alt * 0.7 : alt * (0.28 + (0.72 * (b.velocidade - vmin)) / (vmax - vmin));
    c.fillStyle = b.cor;
    retangulo(c, x, y0 + alt - h, w, h, Math.min(14, w / 2));
    c.fill();
    x += (b.segundos / total) * larg;
  }

  // Tempo por zona
  let y = 1560;
  c.font = `700 30px ${FONTE}`;
  c.letterSpacing = '4px';
  c.fillStyle = 'rgba(255,255,255,0.55)';
  c.fillText('TEMPO POR ZONA', 90, y);
  c.letterSpacing = '0px';
  y += 34;
  let xx = 90;
  for (const z of d.zonas) {
    const w = (z.pct / 100) * (W - 180);
    c.fillStyle = z.cor;
    retangulo(c, xx, y, Math.max(6, w - 6), 26, 13);
    c.fill();
    xx += w;
  }
  y += 80;
  xx = 90;
  c.font = `700 32px ${FONTE}`;
  for (const z of d.zonas.filter((z) => z.pct >= 4)) {
    c.fillStyle = z.cor;
    c.beginPath();
    c.arc(xx + 10, y - 11, 10, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.85)';
    const t = `${z.nome} ${Math.round(z.pct)}%`;
    c.fillText(t, xx + 30, y);
    xx += c.measureText(t).width + 70;
    if (xx > W - 200) {
      xx = 90;
      y += 54;
    }
  }

  return new Promise((ok) => cv.toBlob((b) => ok(b), 'image/png'));
}

/** Abre a folha de compartilhar do iPhone com a imagem (ou baixa, se não der). */
export async function compartilharImagem(blob: Blob, nome: string): Promise<void> {
  const arquivo = new File([blob], `${nome}.png`, { type: 'image/png' });
  try {
    if (navigator.canShare?.({ files: [arquivo] })) {
      await navigator.share({ files: [arquivo] });
      return;
    }
  } catch {
    return; // cancelado
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = arquivo.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
