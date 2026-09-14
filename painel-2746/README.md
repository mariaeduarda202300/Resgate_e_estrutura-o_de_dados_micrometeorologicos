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
