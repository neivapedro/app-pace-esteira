# Gera o ícone (velocímetro em degradê) e as telas de abertura do iPhone:
#   python3 scripts/gerar-icones.py
# O iPhone arredonda os cantos do ícone sozinho.
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

raiz = Path(__file__).resolve().parent.parent
publico = raiz / 'public'
FUNDO = (6, 6, 11)

# Degradê do arco: ciano -> roxo -> rosa -> laranja (as cores do app, do devagar ao tiro)
CORES = [(0, 229, 255), (124, 77, 255), (255, 46, 160), (255, 122, 26)]


def cor(t):
    t = max(0.0, min(1.0, t)) * (len(CORES) - 1)
    i = min(int(t), len(CORES) - 2)
    f = t - i
    a, b = CORES[i], CORES[i + 1]
    return tuple(round(a[k] + (b[k] - a[k]) * f) for k in range(3))


def velocimetro(tam, pct=0.78):
    """Arte do velocímetro em fundo transparente, desenhada em 4x e reduzida (bordas lisas)."""
    s = tam * 4
    c = s / 2
    r = s * 0.34
    larg = s * 0.085
    inicio, abertura = 135, 270

    def ponto(graus, raio):
        a = math.radians(graus)
        return (c + raio * math.cos(a), c + raio * math.sin(a))

    arte = Image.new('RGBA', (s, s), (0, 0, 0, 0))

    # Trilho apagado
    d = ImageDraw.Draw(arte)
    caixa = [c - r, c - r, c + r, c + r]
    d.arc(caixa, inicio, inicio + abertura, fill=(255, 255, 255, 34), width=round(larg))
    for g in (inicio, inicio + abertura):
        x, y = ponto(g, r - larg / 2)
        d.ellipse([x - larg / 2, y - larg / 2, x + larg / 2, y + larg / 2], fill=(255, 255, 255, 34))

    # Arco colorido (em camada própria para o brilho)
    arco = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    da = ImageDraw.Draw(arco)
    passos = 400
    fim = pct * abertura
    for i in range(passos + 1):
        t = i / passos
        x, y = ponto(inicio + t * fim, r - larg / 2)
        rr = larg / 2
        da.ellipse([x - rr, y - rr, x + rr, y + rr], fill=cor(t * pct) + (255,))

    brilho = arco.filter(ImageFilter.GaussianBlur(s * 0.035))
    arte = Image.alpha_composite(arte, brilho)
    arte = Image.alpha_composite(arte, brilho)
    arte = Image.alpha_composite(arte, arco)

    # Traços do mostrador
    d = ImageDraw.Draw(arte)
    for i in range(12):
        g = inicio + i * abertura / 11
        p1 = ponto(g, r + larg * 0.55)
        p2 = ponto(g, r + larg * (1.05 if i % 2 == 0 else 0.85))
        d.line([p1, p2], fill=(255, 255, 255, 150 if i % 2 == 0 else 80), width=round(s * 0.012))

    # Ponteiro branco apontando para o fim do arco
    g = inicio + fim
    ponta = ponto(g, r * 0.78)
    perp = math.radians(g + 90)
    base = s * 0.032
    b1 = (c + base * math.cos(perp), c + base * math.sin(perp))
    b2 = (c - base * math.cos(perp), c - base * math.sin(perp))
    sombra = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    ds = ImageDraw.Draw(sombra)
    ds.polygon([b1, ponta, b2], fill=(255, 255, 255, 255))
    ds.ellipse([c - s * 0.06, c - s * 0.06, c + s * 0.06, c + s * 0.06], fill=(255, 255, 255, 255))
    arte = Image.alpha_composite(arte, sombra.filter(ImageFilter.GaussianBlur(s * 0.02)))
    arte = Image.alpha_composite(arte, sombra)
    d = ImageDraw.Draw(arte)
    d.ellipse([c - s * 0.025, c - s * 0.025, c + s * 0.025, c + s * 0.025], fill=FUNDO + (255,))

    return arte.resize((tam, tam), Image.LANCZOS)


def fundo(larg, alt, brilho_y=0.5):
    """Fundo escuro com um brilho roxo atrás do velocímetro."""
    img = Image.new('RGB', (larg, alt), FUNDO)
    glow = Image.new('RGB', (larg, alt), FUNDO)
    d = ImageDraw.Draw(glow)
    raio = min(larg, alt) * 0.42
    cx, cy = larg / 2, alt * brilho_y
    d.ellipse([cx - raio, cy - raio, cx + raio, cy + raio], fill=(58, 22, 110))
    glow = glow.filter(ImageFilter.GaussianBlur(raio * 0.55))
    return Image.blend(img, glow, 0.9)


def icone(tam, escala=1.0):
    img = fundo(tam, tam, 0.52).convert('RGBA')
    arte = velocimetro(round(tam * escala))
    pos = ((tam - arte.width) // 2, round((tam - arte.height) / 2 + tam * 0.04 * escala))
    img.alpha_composite(arte, pos)
    return img.convert('RGB')


base = icone(1024)
for nome, tam in [('icone-512.png', 512), ('icone-192.png', 192), ('apple-touch-icon.png', 180)]:
    base.resize((tam, tam), Image.LANCZOS).save(publico / nome, optimize=True)
icone(512, 0.8).save(publico / 'icone-maskable-512.png', optimize=True)

# Telas de abertura (mesmos tamanhos do index.html)
TAMANHOS = [
    (1320, 2868), (1290, 2796), (1260, 2736), (1206, 2622), (1179, 2556), (1284, 2778),
    (1170, 2532), (1125, 2436), (1242, 2688), (828, 1792), (1242, 2208), (750, 1334),
]
(publico / 'abertura').mkdir(exist_ok=True)
arte = velocimetro(1024)
for larg, alt in TAMANHOS:
    img = fundo(larg, alt, 0.5).convert('RGBA')
    lado = round(larg * 0.5)
    a = arte.resize((lado, lado), Image.LANCZOS)
    img.alpha_composite(a, ((larg - lado) // 2, (alt - lado) // 2))
    img.convert('RGB').save(publico / 'abertura' / f'abertura-{larg}x{alt}.png', optimize=True)

print('ícones e aberturas gerados')
