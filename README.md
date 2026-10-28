# Pace na Esteira

App (PWA) para iPhone: você escolhe o **pace** que quer correr e ele mostra na hora a **velocidade para colocar na esteira**. Sem digitar: é só deslizar a régua. Abre no Safari e fica na Tela de Início, em tela cheia e funcionando sem internet.

Mesma base dos outros apps (React + Vite, GitHub Pages). Não tem login nem banco: tudo fica no próprio celular.

## O que o app faz

Três abas numa barra flutuante de vidro (visual do iOS 26):

| Aba | Conteúdo |
|---|---|
| **Ritmo** | Deslize a régua, segure − / + ou **gire o velocímetro com o dedo** para escolher o pace; a velocidade da esteira aparece na hora, já arredondada de 0,1 em 0,1. Os números **rolam como um odômetro** e ficam **mais grossos e brilhantes** quanto mais rápido. Também tem o modo inverso (Esteira → Pace), os tempos de 5, 10, 21 e 42 km, os ritmos salvos na estrela e, tracejados, os **mais usados** (aparecem sozinhos). O botão de **inclinação** ajusta a velocidade para manter o esforço do pace escolhido. Com zonas definidas, elas aparecem como **faixas coloridas na régua** e o nome da zona aparece embaixo do velocímetro. |
| **Treino** | Modelos prontos (rodagem, tiros de 1 min, tiros de 400 m, intervalado, limiar, progressivo) com os ritmos das suas zonas, e editor sem digitar: blocos e séries de tiros por tempo ou distância. No **treino em andamento**: velocidade de cada etapa em destaque, contagem regressiva, a próxima etapa, **avisos falados** ("Tiro 2 de 8. Coloque 13,3"), bipes de 3-2-1 e tela sempre acesa. Dá para compartilhar o treino como texto (WhatsApp etc.). |
| **Metas** | **Pace da meta** (distância + tempo nas rodas, sem digitar). **Seu nível**: com uma prova recente, calcula o índice de forma (VDOT de Jack Daniels), os tempos previstos e as **zonas de treino** (leve, maratona, limiar, intervalado, tiro curto). Toque numa zona para levá-la à aba Ritmo. |
| **Ajustes** | 8 paletas de cores, pace em min/km ou min/milha, esteira em km/h ou mph, vibração, tela sempre acesa, voz e **calibração da esteira** (quanto o relógio marca quando a esteira mostra 10 km). |

Contas em `src/lib/` com testes ao lado:
- `pace.ts`: conversões, inclinação (equação de corrida do ACSM: cada 1% ≈ 4,5% a mais de velocidade no plano) e calibração;
- `zonas.ts`: índice de forma, previsões e zonas (método VDOT, conferido com a tabela de Daniels);
- `treino.ts`: treinos, modelos e a sequência de etapas;
- `usos.ts`: ritmos mais usados.

Recursos do iPhone usados: tela acesa (Screen Wake Lock), voz do sistema, vibração ao ajustar (iOS 18+), funciona sem internet. Não dá para usar Dynamic Island, widgets, tela bloqueada nem Apple Watch: isso exigiria um app nativo da App Store.

## Rodar localmente

```bash
npm install
npm run dev     # app em http://localhost:5173
npm test        # testes
```

Ícone e telas de abertura: `python3 scripts/gerar-icones.py` (precisa do Pillow).

## Colocar no ar (uma vez)

### 1. GitHub

1. **Settings → General → Danger Zone → Change visibility → Public.** O GitHub Pages grátis exige repositório público (só o código fica visível; o app não guarda dados no servidor).
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. **Actions → Publicar app → Run workflow** (ou qualquer atualização da `main`).

O app fica em <https://neivapedro.github.io/app-pace-esteira/>.

### 2. No iPhone

1. Abra <https://neivapedro.github.io/app-pace-esteira/> no **Safari**.
2. Toque em **Compartilhar** → **Adicionar à Tela de Início**.
3. Abra pelo ícone.

Atualizações: o app confere a versão sozinho quando é reaberto e se atualiza.
