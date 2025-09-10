# scrap_ml_bs4.py
import requests
from bs4 import BeautifulSoup
import csv
import time
import uuid
from datetime import datetime
import os
import sys

# Adiciona o diretório pai ao path para importar o módulo elasticsearch_service
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.elasticsearch_service import index_product, bulk_index_products

PRODUTOS = {
    "3YM78AB": "HP 667 Colorido",
    "3YM79AB": "HP 667 Preto",
    "3YM80AB": "HP 667XL Colorido",
    "3YM81AB": "HP 667XL Preto",
    "F6V28AB": "HP 664 Tri-color",
    "F6V29AB": "HP 664 Preto",
    "F6V30AB": "HP 664XL Tri-color",
    "F6V31AB": "HP 664XL Preto",
    "CZ103AB": "HP 662 Preto",
    "CZ104AB": "HP 662 Tricolor",
    "CZ105AB": "HP 662XL Preto",
    "CZ106AB": "HP 662XL Tricolor",
    "1VV22AL": "HP GT53 Preto",
}

HEADERS = {
    "User-Agent": "Mozilla/5.0"
}

def fetch(pn, term):
    url = f"https://lista.mercadolivre.com.br/{term.replace(' ', '-')}"
    r = requests.get(url, headers=HEADERS)
    soup = BeautifulSoup(r.text, "html.parser")
    item = soup.select_one(".ui-search-result__content-wrapper")
    if not item:
        return None, None, None
    title = item.select_one(".ui-search-result__content-title").get_text(strip=True)
    int_part = item.select_one(".andes-money-amount__integer-part").get_text(strip=True).replace(".", "")
    frac = item.select_one(".andes-money-amount__fraction-part").get_text(strip=True)
    price = float(f"{int_part}.{frac}")

    # Tenta obter a URL do produto
    link_elem = soup.select_one(".ui-search-result__content-wrapper a.ui-search-link")
    link = link_elem.get('href') if link_elem else None

    return title, price, link

# Salva os resultados no CSV e no Elasticsearch
with open("resultados.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["PN", "Título Encontrado", "Preço (R$)", "URL", "Timestamp"])

    # Lista para armazenar os produtos para envio em bulk
    all_products = []

    for pn, term in PRODUTOS.items():
        print(f"Buscando {pn} → {term}…")
        title, price, url = fetch(pn, term)
        timestamp = datetime.now().isoformat()

        print(f"  → {title} | R$ {price}\n")
        writer.writerow([pn, title or "", price or "", url or "", timestamp])

        # Cria o documento para o Elasticsearch
        if title and price:
            product_data = {
                "id": f"{pn}-{uuid.uuid4()}",
                "pn": pn,
                "titulo": title,
                "preco": price,
                "busca": term,
                "url": url,
                "timestamp": timestamp,
                "vendedor": "Mercado Livre",
                "fonte": "scraper-mercadolivre",
                "avaliacao": 0,
                "num_avaliacoes": 0
            }

            # Adiciona o produto à lista para indexação em bulk
            all_products.append(product_data)

            # Também indexa individualmente para garantir (opcional)
            index_result = index_product(product_data)
            if index_result:
                print(f"  ✓ Produto '{title}' indexado no Elasticsearch com sucesso!")
            else:
                print(f"  ✗ Falha ao indexar produto '{title}' no Elasticsearch")

        time.sleep(1)  # respeita rate limit

    # Indexa todos os produtos em bulk (mais eficiente)
    if all_products:
        bulk_result = bulk_index_products(all_products)
        if bulk_result:
            print(f"✓ Todos os {len(all_products)} produtos indexados no Elasticsearch com sucesso!")
        else:
            print("✗ Falha ao indexar produtos em bulk no Elasticsearch")

print("✅ resultados.csv gerado e dados enviados para o Elasticsearch.")
