#!/usr/bin/env bash
# Mede Lighthouse mobile (mediana de N execuções) contra um servidor já rodando.
# Uso: bash scripts/lighthouse.sh http://localhost:3200 3 / /imoveis /simulador
BASE=${1:-http://localhost:3000}; N=${2:-3}; shift 2
CHROME=$(node -e "console.log(require('@playwright/test').chromium.executablePath())")
SAIDA=${SAIDA_LH:-lighthouse-relatorios}; mkdir -p "$SAIDA"
for r in "$@"; do
  n=$(echo "$r" | tr '/' '_')
  for i in $(seq 1 "$N"); do
    MSYS_NO_PATHCONV=1 CHROME_PATH="$CHROME" npx --yes lighthouse "$BASE$r" --quiet --chrome-flags="--headless=new" \
      --output=json --output-path="$SAIDA/lh$n-$i.json" --only-categories=performance,accessibility,best-practices,seo >/dev/null 2>&1
  done
  node -e "
    const fs=require('fs'); const rs=[...Array($N)].map((_,i)=>JSON.parse(fs.readFileSync('$SAIDA/lh$n-'+(i+1)+'.json')));
    const med=a=>a.sort((x,y)=>x-y)[Math.floor(a.length/2)];
    const cat=k=>Math.round(med(rs.map(r=>r.categories[k].score))*100);
    const aud=k=>med(rs.map(r=>r.audits[k].numericValue));
    console.log('$r | Performance', cat('performance'), '| Acessibilidade', cat('accessibility'), '| Boas práticas', cat('best-practices'), '| SEO', cat('seo'), '| LCP', (aud('largest-contentful-paint')/1000).toFixed(1)+'s', '| TBT', Math.round(aud('total-blocking-time'))+'ms', '| CLS', aud('cumulative-layout-shift').toFixed(3));
  "
done
