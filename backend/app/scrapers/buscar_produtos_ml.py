import requests
from bs4 import BeautifulSoup
import time
import random
import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from elasticsearch import Elasticsearch, helpers
import logging

# Configuração de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configurações do Elasticsearch
ES_INDEX = "hp-traker-ml"
# URL local para o Elasticsearch no Docker
ES_LOCAL_URL = os.getenv("ELASTICSEARCH_URL", "http://elasticsearch:9200")
# Configurações do Elasticsearch na nuvem como fallback
ES_CLOUD_HOST = "https://cce7c968e5f94cb59b5922e251810730.us-central1.gcp.cloud.es.io:443"
ES_CLOUD_API_KEY = "TGFmSlhKY0ItRGtNRXVmY1YxeDg6bThDUFBwdHlwNkgzTDk4eHJFNHBWUQ=="

def get_elasticsearch_client():
    """Retorna um cliente Elasticsearch configurado"""
    # Tentar conectar ao Elasticsearch local primeiro
    try:
        logger.info(f"Tentando conectar ao Elasticsearch local: {ES_LOCAL_URL}")
        client = Elasticsearch(ES_LOCAL_URL)
        # Testar a conexão
        client.info()
        logger.info("Conectado ao Elasticsearch local com sucesso")
        return client
    except Exception as e:
        logger.warning(f"Falha ao conectar ao Elasticsearch local: {e}")
        logger.info("Usando Elasticsearch na nuvem como fallback")
        return Elasticsearch(
            ES_CLOUD_HOST,
            api_key=ES_CLOUD_API_KEY
        )

def save_to_elasticsearch(produtos: List[Dict[str, Any]], busca: str) -> bool:
    """
    Salva os resultados da busca no Elasticsearch

    Args:
        produtos: Lista de produtos para salvar
        busca: Termo de busca usado para encontrar os produtos

    Returns:
        bool: True se salvo com sucesso, False caso contrário
    """
    try:
        # Inicializa o cliente Elasticsearch
        client = get_elasticsearch_client()

        # Prepara os documentos para inserção
        docs = []
        timestamp = datetime.now().isoformat()

        for produto in produtos:
            doc = {
                "_index": ES_INDEX,
                "_source": {
                    "busca": busca,
                    "timestamp": timestamp,
                    "id": str(produto['id']),
                    "titulo": str(produto['titulo']),
                    "preco": float(produto['preco']),
                    "link": str(produto['link']),
                    "vendedor": produto.get('vendedor', 'Não informado'),
                    "avaliacao": float(produto.get('avaliacao')) if produto.get('avaliacao') else None,
                    "num_avaliacoes": int(produto.get('num_avaliacoes', 0)),
                    "comentarios": produto.get('comentarios', []),
                    "fonte": "produto_cadastrado"  # Indica que é uma busca de produto cadastrado
                }
            }
            docs.append(doc)

        # Insere os documentos em lote
        if docs:
            bulk_response = helpers.bulk(client, docs)
            logger.info(f"✓ Dados salvos no Elasticsearch com sucesso!")
            logger.info(f"  - Total de produtos: {len(produtos)}")
            logger.info(f"  - Índice: {ES_INDEX}")
            return True
        else:
            logger.warning("Nenhum produto para salvar")
            return False

    except Exception as e:
        logger.error(f"Erro ao salvar no Elasticsearch: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return False

def extrair_preco(preco_text: str) -> float:
    """Extrai o valor numérico do preço"""
    try:
        # Remove R$, espaços e substitui vírgula por ponto
        preco_limpo = preco_text.replace('R$', '').replace('.', '').replace(',', '.').strip()
        return float(preco_limpo)
    except:
        return 0.0

def search_ml_products(termo_busca: str, save_to_elastic: bool = False) -> List[Dict[str, Any]]:
    """
    Busca produtos no Mercado Livre com base no termo de busca

    Args:
        termo_busca: Termo para buscar no Mercado Livre
        save_to_elastic: Se True, salva os resultados no Elasticsearch

    Returns:
        Lista de produtos encontrados
    """
    logger.info(f"Iniciando busca por: '{termo_busca}'")
    logger.info(f"Salvar no Elasticsearch: {save_to_elastic}")

    # Formata o termo de busca para URL
    termo_formatado = termo_busca.replace(' ', '-')
    url = f'https://lista.mercadolivre.com.br/{termo_formatado}'

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    }

    try:
        # Faz a requisição HTTP
        response = requests.get(url, headers=headers)
        response.raise_for_status()

        # Parseia o HTML
        soup = BeautifulSoup(response.text, 'html.parser')

        # Encontra os produtos
        produtos = []
        items = soup.select('.ui-search-layout__item')

        for item in items[:30]:  # Limita a 30 produtos para não sobrecarregar
            try:
                # Extrai dados básicos do produto
                titulo_elem = item.select_one('.ui-search-item__title')
                link_elem = item.select_one('.ui-search-item__group__element.ui-search-link')
                preco_elem = item.select_one('.price-tag-amount')
                vendedor_elem = item.select_one('.ui-search-official-store-label')

                if not titulo_elem or not link_elem or not preco_elem:
                    continue

                titulo = titulo_elem.text.strip()
                link = link_elem['href']
                preco_text = preco_elem.text.strip()
                preco = extrair_preco(preco_text)
                vendedor = vendedor_elem.text.strip() if vendedor_elem else "Não informado"

                # Cria o objeto de produto
                produto = {
                    'id': hash(f"{titulo}-{link}"),  # ID único baseado em hash
                    'titulo': titulo,
                    'preco': preco,
                    'link': link,
                    'vendedor': vendedor
                }

                produtos.append(produto)
            except Exception as e:
                logger.error(f"Erro ao processar item: {str(e)}")
                continue

        logger.info(f"Encontrados {len(produtos)} produtos para '{termo_busca}'")

        # Salva no Elasticsearch se solicitado
        if save_to_elastic:
            logger.info("Salvando resultados no Elasticsearch...")
            save_to_elasticsearch(produtos, termo_busca)
        else:
            logger.info("Resultados não serão salvos no Elasticsearch (busca individual)")

        return produtos

    except Exception as e:
        logger.error(f"Erro ao buscar produtos: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return []

# Função para busca programada de produtos cadastrados
def scheduled_search_for_registered_products(produtos_cadastrados: List[Dict[str, Any]]):
    """
    Executa busca programada para produtos cadastrados

    Args:
        produtos_cadastrados: Lista de produtos cadastrados no sistema
    """
    logger.info(f"Iniciando busca programada para {len(produtos_cadastrados)} produtos cadastrados")

    for produto in produtos_cadastrados:
        try:
            termo_busca = produto.get('termo_busca')
            produto_id = produto.get('id')

            if not termo_busca:
                logger.warning(f"Produto ID {produto_id} não possui termo de busca definido")
                continue

            logger.info(f"Buscando produto ID {produto_id}: '{termo_busca}'")

            # Executa a busca e salva no Elasticsearch
            resultados = search_ml_products(termo_busca, save_to_elastic=True)

            logger.info(f"Busca concluída para produto ID {produto_id}: {len(resultados)} resultados")

            # Aguarda um tempo entre as buscas para não sobrecarregar o servidor
            time.sleep(random.uniform(2.0, 5.0))

        except Exception as e:
            logger.error(f"Erro ao processar produto ID {produto.get('id')}: {str(e)}")
            continue

    logger.info("Busca programada concluída para todos os produtos cadastrados")
