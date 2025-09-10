#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import json
import re
import uuid
import time
from datetime import datetime
from urllib.parse import quote_plus, urljoin
import requests
from bs4 import BeautifulSoup
import os

# Adiciona o diretório pai ao path para importar o módulo elasticsearch_service
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.elasticsearch_service import index_product, bulk_index_products

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}

SEARCH_URL = "https://lista.mercadolivre.com.br/{}"

# Produtos de exemplo para busca
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


def request_soup(url):
    """Faz uma requisição HTTP e retorna um objeto BeautifulSoup"""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        resp.raise_for_status()
        return BeautifulSoup(resp.text, "html.parser")
    except requests.RequestException as e:
        print(f"Erro ao fazer requisição para {url}: {e}")
        return None


def find_first_product(term):
    """Busca o primeiro link de produto no resultado de busca.
    Se vier uma página de categoria, extrai o primeiro link válido de produto dentro dela."""
    safe = quote_plus(term)
    url = SEARCH_URL.format(safe)
    soup = request_soup(url)

    if not soup:
        return None

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
    """Extrai texto limpo de um elemento BeautifulSoup"""
    return el.get_text(strip=True) if el else ""


def extract_price(price_text):
    """Extrai valor numérico de uma string de preço"""
    if not price_text:
        return None

    # Remover R$, pontos e substituir vírgula por ponto
    clean = re.sub(r'[^\d,]', '', price_text).replace(',', '.')

    try:
        return float(clean)
    except ValueError:
        return None


def scrape_product_details(product_url):
    """Extrai detalhes completos de um produto do Mercado Livre"""
    soup = request_soup(product_url)
    if not soup:
        return None

    # Identificador único do produto
    product_id_match = re.search(r'MLB-(\d+)', product_url) or re.search(r'MLB(\d+)', product_url)
    product_id = product_id_match.group(1) if product_id_match else str(uuid.uuid4())[:8]

    # Título do produto
    title_element = soup.select_one("h1.ui-pdp-title")
    title = clean_text(title_element)

    # Preço
    price_element = soup.select_one("span.andes-money-amount__fraction")
    price_text = clean_text(price_element)

    # Decimal part
    decimal_element = soup.select_one("span.andes-money-amount__cents")
    if decimal_element:
        decimal_text = clean_text(decimal_element)
        price_text = f"{price_text},{decimal_text}"

    price = extract_price(price_text)

    # Vendedor
    # Atualizando o seletor para corresponder à estrutura atual do site
    seller_element = soup.select_one("button.ui-pdp-seller__link-trigger-button span:last-child")
    if not seller_element:
        # Tentativa alternativa com seletor anterior
        seller_element = soup.select_one("div.ui-pdp-seller__header a.ui-pdp-action-modal__link")
    seller_name = clean_text(seller_element) or "Vendedor não identificado"

    # Reputação do vendedor
    reputation_element = soup.select_one("p.ui-seller-info__status-info")
    reputation = clean_text(reputation_element) or "Não informada"

    # Disponibilidade
    availability_element = soup.select_one("span.ui-pdp-buybox__quantity__available")
    availability_text = clean_text(availability_element)

    stock_match = re.search(r'(\d+)', availability_text) if availability_text else None
    stock = int(stock_match.group(1)) if stock_match else None

    # Extrair informações adicionais
    details = {}
    detail_labels = soup.select("th.andes-table__header")
    detail_values = soup.select("td.andes-table__column")

    for i in range(min(len(detail_labels), len(detail_values))):
        label = clean_text(detail_labels[i])
        value = clean_text(detail_values[i])
        if label and value:
            details[label] = value

    # Frete grátis?
    free_shipping_element = soup.select_one("p.ui-pdp-color--GREEN")
    free_shipping = bool(free_shipping_element and "Frete grátis" in clean_text(free_shipping_element))

    # Imagens do produto
    images = []
    img_elements = soup.select("span.ui-pdp-gallery__wrapper img")
    for img in img_elements:
        if 'src' in img.attrs and img['src'].startswith('http'):
            images.append(img['src'])

    # Avaliações
    rating_element = soup.select_one("p.ui-pdp-reviews__rating__summary__average")
    rating = clean_text(rating_element)
    try:
        rating = float(rating.replace(',', '.'))
    except (ValueError, TypeError):
        rating = None

    # Número de avaliações
    review_count_element = soup.select_one("span.ui-pdp-review__amount")
    review_count_text = clean_text(review_count_element)
    review_count_match = re.search(r'(\d+)', review_count_text) if review_count_text else None
    review_count = int(review_count_match.group(1)) if review_count_match else 0

    # Verificar se é produto original HP
    is_original = any(keyword.lower() in title.lower() for keyword in ["original", "genuíno", "genuino"]) and "hp" in title.lower()

    # Verificar se é produto compatível/alternativo
    is_compatible = any(keyword.lower() in title.lower() for keyword in ["compatível", "compativel", "similar", "recondicionado", "remanufaturado"])

    # Modelo do cartucho (ex: HP 667, HP 664, etc)
    model_match = re.search(r'HP\s+(\d{3}(?:XL)?)', title, re.IGNORECASE)
    cartridge_model = f"HP {model_match.group(1)}" if model_match else "Não identificado"

    # Construir dicionário com todos os detalhes coletados
    product_data = {
        "product_id": product_id,
        "title": title,
        "price": price,
        "url": product_url,
        "seller": seller_name,
        "seller_reputation": reputation,
        "stock": stock,
        "availability": availability_text,
        "details": details,
        "free_shipping": free_shipping,
        "images": images,
        "rating": rating,
        "review_count": review_count,
        "is_original": is_original,
        "is_compatible": is_compatible,
        "cartridge_model": cartridge_model,
        "timestamp": datetime.now().isoformat(),
    }

    return product_data


def search_ml_product(search_term):
    """Busca um produto no Mercado Livre e retorna seus detalhes"""
    try:
        # Encontra o primeiro produto nos resultados de busca
        product_url = find_first_product(search_term)
        if not product_url:
            print(f"Nenhum produto encontrado para: {search_term}")
            return None

        # Extrai detalhes completos do produto
        print(f"Analisando produto: {product_url}")
        product_data = scrape_product_details(product_url)

        if product_data:
            # Adiciona o termo de busca para referência
            product_data["search_term"] = search_term
            return product_data

        return None
    except Exception as e:
        print(f"Erro ao buscar produto para '{search_term}': {str(e)}")
        return None


def search_products_by_dict(products_dict, max_products=None):
    """Busca vários produtos usando um dicionário de códigos e descrições"""
    results = []
    count = 0

    for code, description in products_dict.items():
        if max_products and count >= max_products:
            break

        print(f"Buscando produto: {code} - {description}")
        search_term = description

        # Adiciona um delay para evitar sobrecarga no servidor
        time.sleep(1)

        product_data = search_ml_product(search_term)
        if product_data:
            # Adiciona o código do produto para referência
            product_data["product_code"] = code
            results.append(product_data)
            count += 1

    return results


async def run_enhanced_scraper(db):
    """
    Função que executa o rastreamento de produtos no Mercado Livre
    usando o scraper melhorado, mas apenas para produtos oficialmente
    cadastrados no sistema.
    """
    import logging
    from datetime import datetime

    logger = logging.getLogger(__name__)
    logger.info("Iniciando processo de rastreamento melhorado")

    try:
        from app.models.product import Product

        # Obter produtos cadastrados no banco de dados
        registered_products = db.query(Product).filter(Product.is_active == True).all()

        if not registered_products:
            logger.warning("Nenhum produto registrado encontrado para busca. Verifique se há produtos cadastrados na Gestão de Produtos.")
            return

        logger.info(f"Iniciando busca melhorada para {len(registered_products)} produtos cadastrados no sistema")

        # Lista para armazenar dados de produtos para indexação em lote
        products_to_index = []

        for product in registered_products:
            try:
                # Usar os termos de busca exatos do produto cadastrado
                search_terms = product.search_terms

                if not search_terms:
                    logger.warning(f"Produto ID {product.id} - '{product.name}' não tem termos de busca definidos. Usando nome como fallback.")
                    search_terms = product.name

                # Buscar detalhes avançados no Mercado Livre
                logger.info(f"Buscando produto: {search_terms}")

                # Adiciona um delay entre buscas para evitar bloqueio
                time.sleep(1)

                product_data = search_ml_product(search_terms)

                if product_data:
                    # Adicionar informações do produto do banco de dados
                    product_data["product_db_id"] = product.id
                    product_data["product_name"] = product.name
                    product_data["product_sku"] = product.pn  # Usar pn em vez de sku
                    product_data["category"] = product.family  # Usar family como category
                    product_data["brand"] = "HP"  # Definir brand como HP por padrão

                    # Salvar no Elasticsearch
                    try:
                        # Adicionar o documento à lista para indexação em lote
                        products_to_index.append(product_data)
                        logger.info(f"Produto encontrado e preparado para indexação: {product_data['title']}")
                    except Exception as e:
                        logger.error(f"Erro ao preparar produto para indexação: {str(e)}")
                else:
                    logger.warning(f"Produto não encontrado para: {search_terms}")

                # Registrar data da última busca no banco de dados
                product.last_search = datetime.now()
                db.commit()

                logger.info(f"Busca concluída para produto registrado ID {product.id} - '{search_terms}'")

            except Exception as e:
                logger.error(f"Erro ao processar produto ID {product.id}: {str(e)}")
                continue

        # Indexar produtos em lote no Elasticsearch
        if products_to_index:
            try:
                result = bulk_index_products(products_to_index)
                logger.info(f"Indexação em lote concluída. Resultados: {result}")
            except Exception as e:
                logger.error(f"Erro na indexação em lote: {str(e)}")

        logger.info("Processo de rastreamento melhorado concluído para todos os produtos cadastrados")

    except Exception as e:
        logger.error(f"Erro durante o processo de rastreamento melhorado: {str(e)}")
        return []


def run_scraper(produtos=None, save_to_elasticsearch=True, save_to_csv=True, csv_filename="resultados_ml_enhanced.csv"):
    """Executa o scraper para uma lista de produtos e salva os resultados"""
    if produtos is None:
        produtos = PRODUTOS

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    if csv_filename:
        csv_filename = f"{csv_filename.split('.')[0]}_{timestamp}.csv"

    all_products = []

    # Preparar arquivo CSV se necessário
    if save_to_csv:
        import csv
        csv_file = open(csv_filename, "w", newline="", encoding="utf-8")
        csv_writer = csv.writer(csv_file)
        # Cabeçalho com campos principais
        csv_writer.writerow([
            "PN", "ID", "Título", "Preço Original", "Preço Atual", "Desconto",
            "Vendedor", "Reputação", "Vendas", "Disponibilidade", "Condição",
            "Avaliação", "Num. Avaliações", "URL", "Timestamp"
        ])

    try:
        for pn, term in produtos.items():
            product_info = search_product(pn, term)

            if not product_info:
                continue

            all_products.append(product_info)

            # Salvar no CSV
            if save_to_csv:
                csv_writer.writerow([
                    pn,
                    product_info.get("product_id", ""),
                    product_info.get("title", ""),
                    product_info.get("original_price", ""),
                    product_info.get("current_price", ""),
                    product_info.get("discount", ""),
                    product_info.get("seller", ""),
                    product_info.get("seller_reputation", ""),
                    product_info.get("sales_count", ""),
                    product_info.get("availability", ""),
                    product_info.get("condition", ""),
                    product_info.get("rating", 0),
                    product_info.get("num_reviews", 0),
                    product_info.get("url", ""),
                    product_info.get("timestamp", "")
                ])
                csv_file.flush()  # Força a escrita no arquivo

            # Indexar no Elasticsearch
            if save_to_elasticsearch:
                index_result = index_product(product_info)
                if index_result:
                    print(f"  ✓ Produto '{product_info.get('title')}' indexado no Elasticsearch com sucesso!")
                else:
                    print(f"  ✗ Falha ao indexar produto '{product_info.get('title')}' no Elasticsearch")

            # Pausa para não sobrecarregar o servidor
            time.sleep(1.5)

        # Indexar todos os produtos em bulk (mais eficiente)
        if save_to_elasticsearch and all_products:
            bulk_result = bulk_index_products(all_products)
            if bulk_result:
                print(f"✓ Todos os {len(all_products)} produtos indexados no Elasticsearch com sucesso!")

        return all_products

    finally:
        # Fechar arquivo CSV se estiver aberto
        if save_to_csv:
            csv_file.close()
            print(f"✓ Resultados salvos em {csv_filename}")


def main():
    """Função principal para execução direta do script"""
    if len(sys.argv) > 1:
        # Se houver argumentos, assumir que são termos de busca
        termo = " ".join(sys.argv[1:])
        product_info = search_product("CUSTOM", termo)
        if product_info:
            print(json.dumps(product_info, ensure_ascii=False, indent=2))
    else:
        # Executar o scraper com os produtos padrão
        run_scraper()


if __name__ == "__main__":
    main()

    # Exemplo de uso direto
    print("Iniciando busca de produtos de teste...")
    # Limitar a 3 produtos para teste
    results = search_products_by_dict(PRODUTOS, max_products=3)

    # Exibir resultados
    print(f"\nForam encontrados {len(results)} produtos:")

    for product in results:
        print(f"\nProduto: {product['title']}")
        print(f"Preço: R$ {product['price']}")
        print(f"Vendedor: {product['seller']}")
        print(f"Modelo: {product['cartridge_model']}")
        print(f"Original: {'Sim' if product['is_original'] else 'Não'}")
        print(f"URL: {product['url']}")

    # Salvar resultados em arquivo JSON
    if results:
        filename = f"resultados_ml_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        print(f"\nResultados salvos em: {filename}")

    # Indexar no Elasticsearch
    if es_service and results:
        try:
            for product in results:
                index_product(product)
            print("\nProdutos indexados com sucesso no Elasticsearch")
        except Exception as e:
            print(f"Erro ao indexar no Elasticsearch: {e}")
