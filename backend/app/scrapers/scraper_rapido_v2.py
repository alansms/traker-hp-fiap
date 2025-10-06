#!/usr/bin/env python3
"""
Scraper atualizado do Mercado Livre - Versão 2025
Atualizado com os seletores CSS corretos
"""
import requests
from bs4 import BeautifulSoup
import time
import uuid
from datetime import datetime
import sys
import os

# Adiciona o diretório pai ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.elasticsearch_service import index_product, bulk_index_products

# Lista de produtos HP para buscar
PRODUTOS = {
    "3YM78AB": "Cartucho HP 667 Colorido",
    "3YM79AB": "Cartucho HP 667 Preto",
    "3YM80AB": "Cartucho HP 667XL Colorido",
    "3YM81AB": "Cartucho HP 667XL Preto",
    "F6V28AB": "Cartucho HP 664 Tri-color",
    "F6V29AB": "Cartucho HP 664 Preto",
    "F6V30AB": "Cartucho HP 664XL Tri-color",
    "F6V31AB": "Cartucho HP 664XL Preto",
    "CZ103AB": "Cartucho HP 662 Preto",
    "CZ104AB": "Cartucho HP 662 Tricolor",
    "CZ105AB": "Cartucho HP 662XL Preto",
    "CZ106AB": "Cartucho HP 662XL Tricolor",
    "1VV22AL": "Garrafa de Tinta HP GT53 Preto",
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
}

def extract_price(price_element):
    """
    Extrai e formata o preço de um elemento HTML
    """
    try:
        if not price_element:
            return None
        
        # Tenta pegar os elementos de inteiro e decimal
        integer = price_element.select_one('.andes-money-amount__fraction')
        if not integer:
            # Tenta outro seletor
            integer = price_element.select_one('span.andes-money-amount__fraction')
        
        if integer:
            price_text = integer.get_text(strip=True).replace('.', '').replace(',', '.')
            return float(price_text)
        
        # Se não encontrou, tenta pegar todo o texto e limpar
        price_text = price_element.get_text(strip=True)
        price_text = price_text.replace('R$', '').replace('.', '').replace(',', '.').strip()
        return float(price_text)
    except Exception as e:
        print(f"    [ERRO] ao extrair preço: {e}")
        return None

def fetch_products(pn, search_term, max_results=5):
    """
    Busca produtos no Mercado Livre
    
    Args:
        pn: Part Number do produto
        search_term: Termo de busca
        max_results: Número máximo de resultados a retornar
    
    Returns:
        Lista de produtos encontrados
    """
    try:
        # Monta a URL de busca
        url = f"https://lista.mercadolivre.com.br/{search_term.replace(' ', '-')}"
        print(f"\n🔍 Buscando: {search_term}")
        print(f"    URL: {url}")
        
        # Faz a requisição
        response = requests.get(url, headers=HEADERS, timeout=15)
        response.raise_for_status()
        
        # Parse do HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Tenta diferentes seletores para encontrar os produtos
        product_items = []
        
        # Tentativa 1: Seletor principal
        product_items = soup.select('li.ui-search-layout__item')
        
        if not product_items:
            # Tentativa 2: Seletor alternativo
            product_items = soup.select('.ui-search-result__wrapper')
        
        if not product_items:
            # Tentativa 3: Outro seletor
            product_items = soup.select('ol.ui-search-layout li')
        
        print(f"    ✅ Encontrados {len(product_items)} itens na página")
        
        products = []
        for idx, item in enumerate(product_items[:max_results]):
            try:
                # Extrai o título
                title_elem = item.select_one('h2.ui-search-item__title') or \
                            item.select_one('.ui-search-item__title') or \
                            item.select_one('h2')
                
                title = title_elem.get_text(strip=True) if title_elem else None
                
                if not title:
                    continue
                
                # Extrai o link
                link_elem = item.select_one('a.ui-search-link') or \
                           item.select_one('a.ui-search-item__group__element')
                
                link = link_elem.get('href') if link_elem else None
                
                # Extrai o preço
                price_elem = item.select_one('.andes-money-amount') or \
                            item.select_one('.price-tag-fraction')
                
                price = extract_price(price_elem)
                
                # Extrai informações do vendedor (se disponível)
                seller_elem = item.select_one('.ui-search-official-store-label') or \
                             item.select_one('.ui-search-item__brand-discoverability')
                
                seller = seller_elem.get_text(strip=True) if seller_elem else "Vendedor não identificado"
                
                # Verifica se é Mercado Livre Full
                is_full = item.select_one('.ui-search-item__shipping') is not None
                
                if title and price:
                    product = {
                        'pn': pn,
                        'title': title,
                        'price': price,
                        'link': link,
                        'seller': seller,
                        'is_full': is_full
                    }
                    products.append(product)
                    print(f"    [{idx+1}] {title[:60]}... - R$ {price:.2f}")
                
            except Exception as e:
                print(f"    [ERRO] ao processar item {idx+1}: {e}")
                continue
        
        return products
        
    except requests.exceptions.Timeout:
        print(f"    ⏱️ Timeout ao buscar produtos")
        return []
    except requests.exceptions.RequestException as e:
        print(f"    ❌ Erro na requisição: {e}")
        return []
    except Exception as e:
        print(f"    ❌ Erro inesperado: {e}")
        return []

def main():
    """
    Função principal que executa o scraping
    """
    print("=" * 80)
    print("🚀 SCRAPER DO MERCADO LIVRE - VERSÃO ATUALIZADA 2025")
    print("=" * 80)
    
    all_products = []
    total_found = 0
    
    for pn, search_term in PRODUTOS.items():
        print(f"\n{'='*80}")
        print(f"📦 PN: {pn}")
        
        # Busca produtos
        products = fetch_products(pn, search_term, max_results=5)
        
        if not products:
            print(f"    ⚠️ Nenhum produto encontrado para '{search_term}'")
            time.sleep(2)  # Pausa maior quando não encontra nada
            continue
        
        # Processa cada produto encontrado
        for product in products:
            timestamp = datetime.now().isoformat()
            
            # Cria documento para o Elasticsearch
            product_data = {
                "id": f"{pn}-{uuid.uuid4()}",
                "pn": pn,
                "titulo": product['title'],
                "preco": product['price'],
                "busca": search_term,
                "url": product['link'],
                "vendedor": product['seller'],
                "timestamp": timestamp,
                "fonte": "scraper-mercadolivre-v2",
                "avaliacao": 4.5,  # Valor padrão
                "num_avaliacoes": 100,  # Valor padrão
                "is_full": product['is_full']
            }
            
            all_products.append(product_data)
            total_found += 1
        
        # Respeita rate limit (2 segundos entre buscas)
        print(f"    💤 Aguardando 2 segundos...")
        time.sleep(2)
    
    # Indexa todos os produtos no Elasticsearch em bulk
    print(f"\n{'='*80}")
    print(f"📊 RESUMO:")
    print(f"    Total de produtos encontrados: {total_found}")
    print(f"    Total de PNs buscados: {len(PRODUTOS)}")
    print(f"{'='*80}\n")
    
    if all_products:
        print("📥 Indexando produtos no Elasticsearch...")
        try:
            bulk_result = bulk_index_products(all_products)
            if bulk_result:
                print(f"✅ {len(all_products)} produtos indexados com sucesso no Elasticsearch!")
            else:
                print("❌ Falha ao indexar produtos no Elasticsearch")
        except Exception as e:
            print(f"❌ Erro ao indexar: {e}")
    else:
        print("⚠️ Nenhum produto para indexar")
    
    print("\n🏁 Scraping concluído!")

if __name__ == "__main__":
    main()

