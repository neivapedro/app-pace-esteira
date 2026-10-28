# Pace na Esteira

App (PWA) para iPhone: você escolhe o **pace** que quer correr e ele mostra na hora a **velocidade para colocar na esteira**. Sem digitar: é só deslizar a régua. Abre no Safari e fica na Tela de Início, em tela cheia e funcionando sem internet.

Mesma base dos outros apps (React + Vite, GitHub Pages). Não tem login nem banco: tudo fica no próprio celular.

## O que o app faz

| Parte | Conteúdo |
|---|---|
| **Pace → Esteira** | Deslize a régua (ou segure − / +) para escolher o pace; o velocímetro mostra a velocidade já arredondada como a esteira aceita (0,1 em 0,1). Quando o arredondamento muda o pace, avisa (ex.: 9:00/km → 6,7 km/h → "o pace fica 8:57/km"); senão mostra o valor exato. |
| **Esteira → Pace** | O contrário: escolha a velocidade da esteira e veja o pace. |
| **Tempos de prova** | 5 km, 10 km, 21 km e 42 km no ritmo escolhido. |
| **Salvos** | A estrela guarda os ritmos que você usa (aquecimento, ritmo de prova, tiro) para voltar a eles com um toque. |
| **Cor** | O app muda de cor com a velocidade: ciano devagar, roxo no meio, vermelho nos tiros. |
| **Ajustes** | Pace em min/km ou min/milha; esteira em km/h ou mph (esteiras de hotel nos EUA); vibração ao ajustar (iPhone com iOS 18 ou mais novo). |

As contas estão em `src/lib/pace.ts`, com testes em `src/lib/pace.test.ts`.

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
