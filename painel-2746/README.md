# 2746 — Painel de Dados da Estação Micrometeorológica

Site estático (HTML/CSS/JS puro) que lê os dados brutos da estação 2746 e
exibe gráficos com [ApexCharts](https://apexcharts.com), filtráveis por
tabela, variável e intervalo de datas.

## Como funciona

- `data/manifest.json` descreve as duas tabelas (`ti` e `tm`), suas colunas
  e a lista de arquivos diários.
- `data/ti/*.json` e `data/tm/*.json` são os dados pré-processados em
  formato colunar, um arquivo por dia (evita carregar os ~524 mil registros
  da tabela TM de uma vez só).
- `assets/js/db.js` é a camada de "banco de dados": ao filtrar um período,
  ele baixa só os arquivos diários necessários (se ainda não estiverem em
  cache) e insere tudo num **IndexedDB** no navegador. As consultas por
  data/variável são feitas direto no IndexedDB, não no JSON.
- `assets/js/app.js` liga os filtros da página ao banco local e ao
  ApexCharts, reamostrando (LTTB) séries com mais de ~4.000 pontos pra o
  gráfico continuar fluido.

Não há back-end: tudo roda no navegador de quem acessa o site, o que
significa que funciona 100% no GitHub Pages.

## Publicar no GitHub Pages

1. Crie um repositório novo no GitHub e suba **todo o conteúdo desta
   pasta** na raiz dele (`index.html`, `dashboard.html`, `assets/`, `data/`):

   ```bash
   git init
   git add .
   git commit -m "Painel 2746"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
   git push -u origin main
   ```

2. No GitHub: **Settings → Pages → Source → Deploy from a branch**,
   selecione a branch `main` e a pasta `/ (root)`. Salve.

3. Em alguns minutos o site fica disponível em
   `https://SEU_USUARIO.github.io/SEU_REPO/`.

## Rodar localmente antes de subir

Como o site faz `fetch()` de arquivos JSON, abrir o `index.html` direto
(`file://`) não funciona em todos os navegadores — é preciso um servidor
estático simples:

```bash
# dentro da pasta do projeto
python3 -m http.server 8000
# depois acesse http://localhost:8000
```

## Estrutura

```
index.html          landing page com visão geral do projeto
dashboard.html       painel com filtros e gráfico
assets/css/style.css estilos
assets/js/db.js       camada de banco de dados (IndexedDB + fetch + LTTB)
assets/js/app.js      controlador do painel
assets/js/home.js     preenche os números da landing page
data/manifest.json    metadados: colunas, rótulos, arquivos por dia
data/ti/*.json        tabela TI, 1 arquivo por dia
data/tm/*.json        tabela TM, 1 arquivo por dia
```

## Re-gerar os dados a partir dos CSVs originais

Se os CSVs (`2746_ti_data.csv`, `2746_tm_data.csv`) mudarem, rode um script
Python com pandas para regerar os JSONs diários e o `manifest.json` (agrupar
por dia, arredondar casas decimais, salvar em formato colunar
`{"t": [...], "coluna": [...]}`). Peça ajuda se precisar do script — a lógica
usada para gerar os arquivos atuais segue exatamente esse formato.
