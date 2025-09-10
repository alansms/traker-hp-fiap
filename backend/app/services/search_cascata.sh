#!/usr/bin/env bash

ACCESS_TOKEN="APP_USR-6360756636701314-052923-87a11e20670e37dc698e5a04cbc5cdad-74559385"

declare -A PRODUTOS=(
  [3YM78AB]="Cartucho HP 667 Colorido"
  [3YM79AB]="Cartucho HP 667 Preto"
  [3YM80AB]="Cartucho HP 667XL Colorido"
  [3YM81AB]="Cartucho HP 667XL Preto"
  [F6V28AB]="HP 664 Tri-color"
  [F6V29AB]="HP 664 Preto"
  [F6V30AB]="HP 664XL Tri-color"
  [F6V31AB]="HP 664XL Preto"
  [CZ103AB]="HP 662 Preto"
  [CZ104AB]="HP 662 Tricolor"
  [CZ105AB]="HP 662XL Preto"
  [CZ106AB]="HP 662XL Tricolor"
  [1VV22AL]="Garrafa de tinta HP GT53 Preto"
)

# Faz a requisição e retorna body e status code
# Usage: response=$(fetch "$url"); body="${response%%|*}"; code="${response##*|}"
fetch() {
  local url="$1"
  # -s: silencioso, -w: código, -o: body em stdout
  local result
  result=$(curl -s -w "|%{http_code}" "$url" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}")
  echo "$result"
}

for pn in "${!PRODUTOS[@]}"; do
  termo="${PRODUTOS[$pn]}"
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