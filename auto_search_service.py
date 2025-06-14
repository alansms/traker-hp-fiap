#!/usr/bin/env python3
"""
Script automatizado para buscar preços no Mercado Livre com base nos produtos cadastrados.
Este script consulta a API local em http://localhost/products para obter a lista de produtos
e então executa buscas automáticas no Mercado Livre.
"""

import os
import sys
import json
import logging
import asyncio
import aiohttp
import datetime
from urllib.parse import urljoin

# Configuração do logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("ml_search_service.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("ml_search_service")

# Configurações
API_BASE_URL = "http://localhost"
PRODUCTS_ENDPOINT = "/products"
SEARCH_ENDPOINT = "/products/{product_id}/search"

# Adicionar o diretório raiz do projeto ao PYTHONPATH
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(script_dir, '..'))
sys.path.insert(0, project_root)

# Importações do projeto
try:
    from backend.app.scrapers.mercado_livre import search_products_ml
    has_direct_import = True
except ImportError:
    logger.warning("Não foi possível importar diretamente o módulo de scraping. Usando a API.")
    has_direct_import = False

async def get_products():
    """
    Obter lista de produtos cadastrados na API.
    """
    try:
        async with aiohttp.ClientSession() as session:
            url = urljoin(API_BASE_URL, PRODUCTS_ENDPOINT)
            logger.info(f"Buscando produtos em: {url}")

            async with session.get(url) as response:
                if response.status != 200:
                    logger.error(f"Erro ao obter produtos: Status {response.status}")
                    return []

                products = await response.json()
                logger.info(f"Encontrados {len(products)} produtos cadastrados")
                return products
    except Exception as e:
        logger.error(f"Erro ao conectar com a API: {str(e)}")
        return []

async def search_product(product_id):
    """
    Realizar busca para um produto específico via API.
    """
    try:
        async with aiohttp.ClientSession() as session:
            url = urljoin(API_BASE_URL, SEARCH_ENDPOINT.format(product_id=product_id))
            logger.info(f"Iniciando busca para produto ID {product_id}")

            async with session.post(url) as response:
                if response.status != 200:
                    logger.error(f"Erro na busca do produto {product_id}: Status {response.status}")
                    return None

                results = await response.json()
                logger.info(f"Busca concluída para produto ID {product_id}: {len(results)} resultados")

                # Buscar detalhes completos do produto para incluir nos metadados
                product_details_url = urljoin(API_BASE_URL, f"{PRODUCTS_ENDPOINT}/{product_id}")
                async with session.get(product_details_url) as product_response:
                    if product_response.status == 200:
                        product_details = await product_response.json()
                        search_terms = product_details.get('search_terms', product_details.get('name', ''))

                        # Estrutura similar à do process_product_direct para consistência
                        result_with_metadata = {
                            "product_id": product_id,
                            "product_name": product_details.get('name', ''),
                            "search_terms": search_terms,
                            "pn": product_details.get('pn', ''),
                            "search_timestamp": datetime.datetime.now().isoformat(),
                            "results": results
                        }

                        # Salvar resultados
                        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
                        filename = f"resultados/busca_api_{search_terms.replace(' ', '_')}_{timestamp}.json"
                        os.makedirs("resultados", exist_ok=True)

                        with open(filename, 'w', encoding='utf-8') as f:
                            json.dump(result_with_metadata, f, ensure_ascii=False, indent=2)

                        logger.info(f"Resultados salvos em {filename} com metadados do produto original")
                    else:
                        logger.warning(f"Não foi possível obter detalhes completos do produto {product_id}")
                        # Salvar apenas os resultados sem metadados completos
                        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
                        filename = f"resultados/busca_api_produto_{product_id}_{timestamp}.json"
                        os.makedirs("resultados", exist_ok=True)

                        with open(filename, 'w', encoding='utf-8') as f:
                            json.dump({"product_id": product_id, "results": results}, f, ensure_ascii=False, indent=2)

                        logger.info(f"Resultados salvos em {filename} sem metadados completos")

                return results
    except Exception as e:
        logger.error(f"Erro ao realizar busca para produto {product_id}: {str(e)}")
        return None

async def process_product_direct(product):
    """
    Processa um produto usando importação direta do scraper (sem API).
    """
    try:
        product_id = product['id']

        # Garantir que estamos usando os termos de busca exatos do cadastro
        if 'search_terms' not in product or not product['search_terms']:
            logger.warning(f"Produto {product_id} não tem termos de busca definidos. Usando o nome como fallback.")
            search_terms = product.get('name', '')
            if not search_terms:
                logger.error(f"Produto {product_id} não tem nome ou termos de busca definidos. Pulando.")
                return None
        else:
            search_terms = product['search_terms']

        logger.info(f"Buscando produto {product_id}: '{search_terms}' (exatamente como cadastrado)")
        results = await search_products_ml(search_terms)

        # Adicionar informações do produto original aos resultados para rastreabilidade
        result_with_metadata = {
            "product_id": product_id,
            "product_name": product.get('name', ''),
            "search_terms": search_terms,
            "pn": product.get('pn', ''),
            "search_timestamp": datetime.datetime.now().isoformat(),
            "results": results
        }

        # Salvar resultados com metadados do produto original
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"resultados/busca_{search_terms.replace(' ', '_')}_{timestamp}.json"
        os.makedirs("resultados", exist_ok=True)

        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(result_with_metadata, f, ensure_ascii=False, indent=2)

        logger.info(f"Resultados salvos em {filename} com metadados do produto original")
        return results
    except Exception as e:
        logger.error(f"Erro ao processar produto {product.get('id')}: {str(e)}")
        return None

async def main():
    """
    Função principal para execução do serviço.
    """
    logger.info("Iniciando serviço de busca de produtos no Mercado Livre")

    try:
        # Obter lista de produtos
        products = await get_products()

        if not products:
            logger.warning("Nenhum produto encontrado para busca")
            return

        # Processar cada produto
        for product in products:
            if not product.get('is_active', True):
                logger.info(f"Produto {product.get('id')} está inativo. Pulando.")
                continue

            if has_direct_import:
                # Usar implementação direta
                await process_product_direct(product)
            else:
                # Usar API
                await search_product(product.get('id'))

            # Pausa entre buscas para evitar sobrecarregar a API
            await asyncio.sleep(2)

        logger.info("Processo de busca concluído com sucesso")
    except Exception as e:
        logger.error(f"Erro durante execução do serviço: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())
