#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import json
import re
from urllib.parse import quote_plus, urljoin
import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}

SEARCH_URL = "https://lista.mercadolivre.com.br/{}"


def request_soup(url):
    resp = requests.get(url, headers=HEADERS, timeout=10)
    resp.raise_for_status()
    return BeautifulSoup(resp.text, "html.parser")


def find_first_product(term):
    """Busca o primeiro link de produto no resultado de busca.
    Se vier uma página de categoria, extrai o primeiro link válido de produto dentro dela."""
    safe = quote_plus(term)
    url = SEARCH_URL.format(safe)
    soup = request_soup(url)

    # 1) seletor padrão de resultado
    link = soup.select_one("a.ui-search-result__content.ui-search-link")
    if link and link.get("href"):
        return link["href"]

    # 2) se for página de categoria, identificar o container de resultados:
    container = soup.select_one("ol.ui-search-layout, div.ui-search-results")
    if container:
        item = container.select_one("a.ui-search-result__content")
        if item and item.get("href"):
            return item["href"]

    # 3) fallback mais amplo: varre <a> procurando URLs de detalhe
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if "/p/" in href and re.search(r"MLB\d+", href):
            return href

    return None


def clean_text(el):
    return el.get_text(strip=True) if el else ""


def parse_product_page(url):
    soup = request_soup(url)

    def sel(q): return soup.select_one(q)

    # título
    title = clean_text(sel("h1.ui-pdp-title"))

    # vendedor e vendas
    seller = clean_text(sel("button.ui-pdp-seller__link-trigger-button span:last-child"))
    sales_count = clean_text(sel(".ui-pdp-seller__header__info-container__subtitle-one-line p"))

    # preços e condições
    original_price = clean_text(sel("s.ui-pdp-price__original-value"))
    current_price = clean_text(sel("div.ui-pdp-price__second-line span.andes-money-amount"))
    discount = clean_text(sel(".ui-pdp-price__second-line__label .andes-money-amount__discount"))
    installments = clean_text(sel("#pricing_price_subtitle"))
    stock_available = clean_text(sel(".ui-pdp-buybox__quantity__available"))

    # características
    characteristics = {}
    for row in soup.select(".ui-pdp-specs__table tr"):
        th = row.select_one("th")
        td = row.select_one("td")
        if th and td:
            characteristics[th.get_text(strip=True)] = td.get_text(strip=True)

    # opiniões em destaque
    highlighted_summary = clean_text(sel(".ui-review-capability__summary__plain_text__summary_container"))
    highlighted_comments = [c.get_text(strip=True)
                            for c in soup.select(".ui-review-capability-comments__comment__content")]

    # sumário de opiniões
    opinions_text = clean_text(sel(".ui-review-capability__summary__description__text"))
    total_label = clean_text(sel(".total-opinion")) or f"{len(highlighted_comments)} comentários"

    # comentários completos
    opinions_comments = highlighted_comments.copy()

    return {
        "title": title,
        "characteristics": characteristics,
        "seller": seller,
        "sales_count": sales_count,
        "original_price": original_price,
        "current_price": current_price,
        "discount": discount,
        "installments": installments,
        "stock_available": stock_available,
        "highlighted_opinions": {
            "summary": highlighted_summary,
            "comments": highlighted_comments
        },
        "opinions_summary": {
            "text": opinions_text,
            "total_comments": total_label
        },
        "opinions_comments": opinions_comments
    }


def strip_stopwords(term):
    return re.sub(r'\b(de|da|do|e|com|para)\b', '', term, flags=re.IGNORECASE).strip()


def main():
    term = input("Digite nome, modelo ou URL do produto: ").strip()

    if term.lower().startswith("http"):
        detail_url = term
    else:
        print(f"Buscando primeiro resultado para: {term}")
        detail_url = find_first_product(term)

        if not detail_url:
            fallback = strip_stopwords(term)
            if fallback and fallback.lower() != term.lower():
                print(f"Nenhum achado. Tentando busca broad com: {fallback}")
                detail_url = find_first_product(fallback)

        if not detail_url:
            print("Nenhum produto encontrado.")
            sys.exit(1)

    # normaliza URL relativa
    if detail_url.startswith("/"):
        detail_url = urljoin("https://www.mercadolivre.com.br", detail_url)

    print("Produto encontrado:", detail_url)
    info = parse_product_page(detail_url)
    print(json.dumps(info, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()