cat <<'EOF' > search_cascata.sh
#!/usr/bin/env bash

ACCESS_TOKEN="APP_USR-6360756636701314-052923-87a11e20670e37dc698e5a04cbc5cdad-74559385"

declare -A PRODUTOS=(
  [3YM78AB]="HP 667|Cartucho HP 667 Colorido|MLB1743"
  [3YM79AB]="HP 667|Cartucho HP 667 Preto|MLB1743"
  [3YM80AB]="HP 667|Cartucho HP 667XL Colorido|MLB1743"
  [3YM81AB]="HP 667|Cartucho HP 667XL Preto|MLB1743"
  [F6V28AB]="HP 664|HP 664 Tri-color|MLB1743"
  [F6V29AB]="HP 664|HP 664 Preto|MLB1743"
  [F6V30AB]="HP 664|HP 664XL Tri-color|MLB1743"
  [F6V31AB]="HP 664|HP 664XL Preto|MLB1743"
  [CZ103AB]="HP 662|HP 662 Preto|MLB1743"
  [CZ104AB]="HP 662|HP 662 Tricolor|MLB1743"
  [CZ105AB]="HP 662|HP 662XL Preto|MLB1743"
  [CZ106AB]="HP 662|HP 662XL Tricolor|MLB1743"
  [1VV22AL]="HP GT 53|Garrafa de tinta HP GT53 Preto|MLB1743"
)

# Função de busca: só retorna OK se HTTP 200
search() {
  if curl -s -o /dev/null -w "%{http_code}" "$1" | grep -q '^200$'; then
    curl -s "$1" | jq '.results[0] | {id, title, price}'
    return 0
  fi
  return 1
}

for pn in "${!PRODUTOS[@]}"; do
  IFS='|' read family name category <<< "${PRODUTOS[$pn]}"
  echo "🔍 [$pn] tentando PN..."
  if search "https://api.mercadolibre.com/sites/MLB/search?q=${pn}&limit=1&access_token=${ACCESS_TOKEN}"; then
    echo; continue
  fi

  echo "🔍 [$pn] tentando Família+PN..."
  term="${family// /%20}%20${pn}"
  if search "https://api.mercadolibre.com/sites/MLB/search?q=${term}&limit=1&access_token=${ACCESS_TOKEN}"; then
    echo; continue
  fi

  echo "🔍 [$pn] tentando Nome completo..."
  term="${name// /%20}"
  if search "https://api.mercadolibre.com/sites/MLB/search?q=${term}&limit=1&access_token=${ACCESS_TOKEN}"; then
    echo; continue
  fi

  echo "🔍 [$pn] tentando Nome+Categoria..."
  if search "https://api.mercadolibre.com/sites/MLB/search?category=${category}&q=${term}&limit=1&access_token=${ACCESS_TOKEN}"; then
    echo; continue
  fi

  echo "⚠️  [$pn] Nenhum resultado encontrado."
  echo
done
EOF
