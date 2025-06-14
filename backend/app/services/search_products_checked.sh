#!/usr/bin/env bash

ACCESS_TOKEN="APP_USR-6360756636701314-052923-87a11e20670e37dc698e5a04cbc5cdad-74559385"

# Lista de PNs
PNS=(
  "3YM78AB" "3YM79AB" "3YM80AB" "3YM81AB"
  "F6V28AB" "F6V29AB" "F6V30AB" "F6V31AB"
  "CZ103AB" "CZ104AB" "CZ105AB" "CZ106AB"
  "1VV22AL"
)

# Lista de termos de busca, no mesmo índice de PNS
TERMS=(
  "Cartucho HP 667 Colorido"
  "Cartucho HP 667 Preto"
  "Cartucho HP 667XL Colorido"
  "Cartucho HP 667XL Preto"
  "HP 664 Tri-color"
  "HP 664 Preto"
  "HP 664XL Tri-color"
  "HP 664XL Preto"
  "HP 662 Preto"
  "HP 662 Tricolor"
  "HP 662XL Preto"
  "HP 662XL Tricolor"
  "Garrafa de tinta HP GT53 Preto"
)

# Função que faz a requisição e retorna "<body>|<http_code>"
fetch() {
  curl -s -w "|%{http_code}" "$1" \
       -H "Authorization: Bearer ${ACCESS_TOKEN}"
}

for i in "${!PNS[@]}"; do
  pn="${PNS[i]}"
  termo="${TERMS[i]}"
  termo_enc=$(python3 - <<<'import urllib.parse,sys; print(urllib.parse.quote(sys.stdin.read().strip()))' "$termo")
  echo "🔍 $pn → $termo"

  url="https://api.mercadolibre.com/sites/MLB/search?q=${termo_enc}&limit=1"
  resp=$(fetch "$url")
  body="${resp%|*}"
  code="${resp#*|}"

  echo "HTTP Status: $code"
  if [[ "$code" == "200" ]]; then
    echo "$body" | jq '.results[0] | {id, title, price}'
  else
    echo "  → Erro na busca (status $code)."
  fi
  echo
done