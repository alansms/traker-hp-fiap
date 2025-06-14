#!/usr/bin/env python
"""
Serviço para interagir com o Elasticsearch.
Este módulo fornece uma classe para conectar, indexar e buscar dados no Elasticsearch.
"""

import os
import uuid
import logging
from datetime import datetime, timedelta
from elasticsearch import Elasticsearch, helpers
from typing import Dict, List, Any, Optional

# Configuração de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configurações do Elasticsearch
ES_INDEX = "hp-traker-ml"

class ElasticsearchService:
    """Classe para interagir com o Elasticsearch."""

    def __init__(self):
        """Inicializa o serviço Elasticsearch."""
        self.client = self.get_elasticsearch_client()
        self.setup_index()

    def get_elasticsearch_client(self):
        """Obtém um cliente Elasticsearch configurado com base nas variáveis de ambiente"""
        # Tenta usar o Elasticsearch local primeiro
        es_local_url = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")
        es_cloud_url = os.getenv("ELASTICSEARCH_CLOUD_URL",
                              "https://cce7c968e5f94cb59b5922e251810730.us-central1.gcp.cloud.es.io:443")
        es_api_key = os.getenv("ELASTICSEARCH_API_KEY",
                              "TGFmSlhKY0ItRGtNRXVmY1YxeDg6bThDUFBwdHlwNkgzTDk4eHJFNHBWUQ==")

        try:
            # Tenta conectar ao Elasticsearch local
            logger.info(f"Tentando conectar ao Elasticsearch local: {es_local_url}")
            client = Elasticsearch(
                es_local_url,
                request_timeout=30,
                max_retries=3,
                retry_on_timeout=True,
                # Definir configurações específicas de compatibilidade
                api_key=None,
                basic_auth=None,
                bearer_auth=None,
                headers={
                    "Accept": "application/vnd.elasticsearch+json; compatible-with=8",
                    "Content-Type": "application/vnd.elasticsearch+json; compatible-with=8"
                }
            )
            # Verifica a conexão
            client.info()
            logger.info("Conectado ao Elasticsearch local com sucesso!")
            return client
        except Exception as e:
            logger.warning(f"Falha ao conectar ao Elasticsearch local: {e}")

            # Tenta conectar ao Elasticsearch na nuvem
            logger.info(f"Tentando conectar ao Elasticsearch na nuvem: {es_cloud_url}")
            try:
                client = Elasticsearch(es_cloud_url, api_key=es_api_key)
                client.info()
                logger.info("Conectado ao Elasticsearch na nuvem com sucesso!")
                return client
            except Exception as cloud_e:
                logger.error(f"Falha ao conectar ao Elasticsearch na nuvem: {cloud_e}")
                raise

    def setup_index(self):
        """Configura o índice no Elasticsearch caso não exista"""
        try:
            if not self.client.indices.exists(index=ES_INDEX):
                logger.info(f"Criando índice '{ES_INDEX}' no Elasticsearch...")
                # Configuração para texto com keyword
                mappings = {
                    "properties": {
                        "titulo": {
                            "type": "text",
                            "fields": {
                                "keyword": {
                                    "type": "keyword",
                                    "ignore_above": 256
                                }
                            }
                        },
                        "busca": {
                            "type": "text",
                            "fields": {
                                "keyword": {
                                    "type": "keyword",
                                    "ignore_above": 256
                                }
                            }
                        },
                        "vendedor": {
                            "type": "text",
                            "fields": {
                                "keyword": {
                                    "type": "keyword",
                                    "ignore_above": 256
                                }
                            }
                        },
                        "pn": {"type": "keyword"},  # Part Number
                        "timestamp": {"type": "date"},
                        "preco": {"type": "float"},
                        "url": {"type": "keyword"},
                        "avaliacao": {"type": "float"},
                        "num_avaliacoes": {"type": "integer"},
                        "comentarios": {
                            "type": "nested",
                            "properties": {
                                "usuario": {"type": "keyword"},
                                "texto": {"type": "text"},
                                "data": {"type": "date"}
                            }
                        }
                    }
                }

                self.client.indices.create(
                    index=ES_INDEX,
                    body={"mappings": mappings}
                )
                logger.info(f"Índice '{ES_INDEX}' criado com sucesso!")
            else:
                logger.info(f"Índice '{ES_INDEX}' já existe.")
        except Exception as e:
            logger.error(f"Erro ao configurar índice: {e}")
            raise

    def index_product(self, product_data: Dict[str, Any]) -> bool:
        """
        Indexa um produto no Elasticsearch

        Args:
            product_data: Dicionário com os dados do produto

        Returns:
            bool: True se o documento foi indexado com sucesso, False caso contrário
        """
        try:
            # Garantir que temos um ID único para o documento
            if "id" not in product_data:
                product_data["id"] = str(uuid.uuid4())

            # Garantir que temos um timestamp
            if "timestamp" not in product_data:
                product_data["timestamp"] = datetime.now().isoformat()

            # Indexar o documento
            response = self.client.index(
                index=ES_INDEX,
                id=product_data["id"],
                body=product_data,
                refresh=True  # Garantir que o documento esteja disponível imediatamente para consulta
            )

            logger.info(f"Produto indexado com sucesso: {response['result']} - ID: {product_data['id']}")
            return True
        except Exception as e:
            logger.error(f"Erro ao indexar produto: {e}")
            return False

    def bulk_index_products(self, products: List[Dict[str, Any]]) -> bool:
        """
        Indexa vários produtos no Elasticsearch usando a API Bulk

        Args:
            products: Lista de dicionários com os dados dos produtos

        Returns:
            bool: True se os documentos foram indexados com sucesso, False caso contrário
        """
        try:
            # Formatar documentos para a API Bulk
            bulk_docs = []
            for product in products:
                # Garantir que temos um ID único para o documento
                if "id" not in product:
                    product["id"] = str(uuid.uuid4())

                # Garantir que temos um timestamp
                if "timestamp" not in product:
                    product["timestamp"] = datetime.now().isoformat()

                bulk_docs.append({
                    "_index": ES_INDEX,
                    "_id": product["id"],
                    "_source": product
                })

            if bulk_docs:
                bulk_response = helpers.bulk(self.client, bulk_docs)
                logger.info(f"Resposta do bulk: {bulk_response}")
                logger.info(f"Inseridos {bulk_response[0]} produtos com sucesso!")
                return True

            return False
        except Exception as e:
            logger.error(f"Erro ao indexar produtos em bulk: {e}")
            return False

    def search_products(self, query: Dict[str, Any] = None, size: int = 100) -> List[Dict[str, Any]]:
        """
        Busca produtos no Elasticsearch

        Args:
            query: Query de busca (opcional, padrão é match_all)
            size: Número máximo de resultados

        Returns:
            Lista de documentos encontrados
        """
        try:
            if query is None:
                query = {
                    "query": {
                        "match_all": {}
                    }
                }

            response = self.client.search(
                index=ES_INDEX,
                body=query,
                size=size
            )

            hits = response["hits"]["hits"]
            logger.info(f"Encontrados {len(hits)} produtos")

            # Converter os hits para uma lista de dicionários
            results = []
            for hit in hits:
                product = hit["_source"]
                product["_id"] = hit["_id"]
                product["_score"] = hit["_score"]
                results.append(product)

            return results
        except Exception as e:
            logger.error(f"Erro ao buscar produtos: {e}")
            return []

    def get_top_products(self, size: int = 10, period_days: int = 30):
        """
        Retorna os produtos mais encontrados nas buscas, filtrando
        apenas pelos produtos que estão cadastrados no sistema.
        Usa uma abordagem mais rigorosa para garantir que apenas produtos registrados apareçam.
        """
        try:
            # Calcula a data de início do período
            start_date = (datetime.now() - timedelta(days=period_days)).isoformat()

            # Obter produtos cadastrados no banco de dados
            from ..models.product import Product
            from ..db.session import SessionLocal

            db = SessionLocal()
            registered_products = db.query(Product).filter(Product.is_active == True).all()

            # Se não houver produtos cadastrados, retorna lista vazia
            if not registered_products:
                logger.warning("Não há produtos cadastrados no banco de dados.")
                return []

            # Extrair IDs dos produtos cadastrados para referência
            registered_product_ids = [p.id for p in registered_products]

            # Extrair termos de busca exatos dos produtos cadastrados
            exact_product_terms = []

            for product in registered_products:
                # Adicionar identificadores exatos
                if product.name:
                    exact_product_terms.append(product.name.lower())
                if product.pn:
                    exact_product_terms.append(product.pn.lower())

            # Fechar a conexão com o banco de dados
            db.close()

            # Buscar produtos por ID diretamente - primeira abordagem
            direct_id_query = {
                "query": {
                    "bool": {
                        "must": [
                            {
                                "range": {
                                    "timestamp": {
                                        "gte": start_date
                                    }
                                }
                            }
                        ],
                        "should": [
                            {
                                "terms": {
                                    "product_db_id": registered_product_ids
                                }
                            }
                        ],
                        "minimum_should_match": 1
                    }
                },
                "sort": [
                    {
                        "timestamp": {
                            "order": "desc"
                        }
                    }
                ],
                "size": size
            }

            # Executa a consulta direta por ID
            direct_response = self.client.search(index=ES_INDEX, body=direct_id_query)

            # Se encontrou resultados suficientes pela busca direta, retorna esses resultados
            if len(direct_response["hits"]["hits"]) >= size:
                return self._process_product_results(direct_response["hits"]["hits"], size)

            # Caso contrário, tenta uma segunda abordagem com termos exatos
            exact_terms_query = {
                "query": {
                    "bool": {
                        "must": [
                            {
                                "range": {
                                    "timestamp": {
                                        "gte": start_date
                                    }
                                }
                            }
                        ],
                        "should": [
                            {
                                "terms": {
                                    "title.keyword": exact_product_terms
                                }
                            }
                        ],
                        "minimum_should_match": 1
                    }
                },
                "sort": [
                    {
                        "timestamp": {
                            "order": "desc"
                        }
                    }
                ],
                "size": size
            }

            # Executa a consulta por termos exatos
            exact_response = self.client.search(index=ES_INDEX, body=exact_terms_query)

            # Combina os resultados de ambas as consultas, removendo duplicatas
            combined_results = {}

            # Adiciona os resultados da busca direta por ID
            for hit in direct_response["hits"]["hits"]:
                doc_id = hit["_id"]
                if doc_id not in combined_results:
                    combined_results[doc_id] = hit

            # Adiciona os resultados da busca por termos exatos
            for hit in exact_response["hits"]["hits"]:
                doc_id = hit["_id"]
                if doc_id not in combined_results:
                    combined_results[doc_id] = hit

            # Converte para lista e ordena por timestamp (mais recente primeiro)
            hits_list = list(combined_results.values())
            hits_list.sort(key=lambda x: x["_source"].get("timestamp", ""), reverse=True)

            # Retorna os resultados processados
            return self._process_product_results(hits_list, size)

        except Exception as e:
            logger.error(f"Erro ao buscar top produtos: {str(e)}")
            return []

    def _process_product_results(self, hits, size):
        """
        Processa os resultados da busca e formata para o formato esperado pela API
        """
        top_products = []
        for hit in hits[:size]:  # Limita ao tamanho solicitado
            product = hit["_source"]
            top_products.append({
                "id": product.get("id", hit["_id"]),
                "title": product.get("title", "Sem título"),
                "price": product.get("price", 0),
                "seller": product.get("seller", "Desconhecido"),
                "url": product.get("url", ""),
                "timestamp": product.get("timestamp", ""),
                "product_db_id": product.get("product_db_id", None)
            })

        return top_products

    def get_price_evolution(self, product: str, period_days: int = 30) -> List[Dict[str, Any]]:
        """
        Retorna a evolução de preço de um produto específico

        Args:
            product: Nome do produto
            period_days: Período em dias para a análise

        Returns:
            Lista com a evolução de preço do produto
        """
        try:
            # Calcula a data de início do período
            start_date = (datetime.now() - timedelta(days=period_days)).isoformat()

            # Consulta para encontrar o histórico de preços
            query = {
                "query": {
                    "bool": {
                        "must": [
                            {
                                "match": {
                                    "titulo": product
                                }
                            },
                            {
                                "range": {
                                    "timestamp": {
                                        "gte": start_date
                                    }
                                }
                            }
                        ]
                    }
                },
                "sort": [
                    {
                        "timestamp": {
                            "order": "asc"
                        }
                    }
                ],
                "size": 1000  # Limite razoável para histórico
            }

            response = self.client.search(index=ES_INDEX, body=query)

            # Processa os resultados
            result = []
            for hit in response["hits"]["hits"]:
                result.append({
                    "timestamp": hit["_source"]["timestamp"],
                    "preco": hit["_source"]["preco"],
                    "vendedor": hit["_source"].get("vendedor", "Desconhecido")
                })

            return result
        except Exception as e:
            logger.error(f"Erro ao buscar evolução de preço: {e}")
            return []


# Funções de compatibilidade para manter scripts existentes funcionando
def get_elasticsearch_client():
    """Função de compatibilidade que retorna um cliente Elasticsearch"""
    service = ElasticsearchService()
    return service.client

def setup_index(client):
    """Função de compatibilidade para configurar o índice"""
    service = ElasticsearchService()
    # O índice já foi configurado no construtor, então não precisamos fazer nada aqui
    return

def index_product(product_data):
    """Função de compatibilidade para indexar um produto"""
    service = ElasticsearchService()
    return service.index_product(product_data)

def bulk_index_products(products):
    """Função de compatibilidade para indexar produtos em massa"""
    service = ElasticsearchService()
    return service.bulk_index_products(products)

def search_products(query=None, size=100):
    """Função de compatibilidade para buscar produtos"""
    service = ElasticsearchService()
    return service.search_products(query, size)
