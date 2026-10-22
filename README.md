# Koňakové špičky

2D automatizační hra: postav plně automatickou cukrárnu, která sama vyrábí koňakové špičky, větrníky a rakvičky. Jeden HTML soubor, čistý JavaScript a canvas, bez závislostí.

## Spuštění

```
python3 -m http.server 8004
```

a otevřít http://localhost:8004/ (nebo jen otevřít `index.html` v prohlížeči).

## Ovládání

- levé tlačítko: postavit / otevřít stroj / táhnout mapu, pravé tlačítko: odstranit
- R otočit, Q pipeta, 1–9 lišta staveb, WASD posun, kolečko zoom, F celá obrazovka
- T: zakázky, vylepšení a banka (půjčky)

## Test

```
node dev/sim.js
```

Simulace bez prohlížeče: staví linky, kontroluje výrobu, prodej, pásy, ruky, půjčky a ukládání.
