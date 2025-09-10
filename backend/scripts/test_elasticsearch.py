#!/usr/bin/env python
"""
Script para inserir documentos de exemplo no Elasticsearch.
Este script pode ser usado para testar a conexão com o Elasticsearch
e verificar se os documentos estão sendo corretamente indexados.
"""

import os
import json
import pytest
from datetime import datetime
from elasticsearch import Elasticsearch, helpers
import logging

# Configuração de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configurações do Elasticsearch
ES_INDEX = "hp-traker-ml"

def get_elasticsearch_client():
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
        client = Elasticsearch(es_local_url)
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

def setup_index(client):
    """Configura o índice no Elasticsearch caso não exista"""
    try:
        if not client.indices.exists(index=ES_INDEX):
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
                    "timestamp": {"type": "date"},
                    "preco": {"type": "float"},
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

            client.indices.create(
                index=ES_INDEX,
                body={"mappings": mappings}
            )
            logger.info(f"Índice '{ES_INDEX}' criado com sucesso!")
        else:
            logger.info(f"Índice '{ES_INDEX}' já existe.")
    except Exception as e:
        logger.error(f"Erro ao configurar índice: {e}")
        raise

def get_sample_documents():
    """Retorna uma lista de documentos de exemplo para testes"""
    return [
        {
            "avaliacao": 36.196564554933545,
            "busca": "cartucho-hp-667",
            "comentarios": [
                {
                    "data": "2025-06-11T03:05:23.907Z",
                    "texto": "Ótimo produto, durou bastante",
                    "usuario": "cliente-satisfeito"
                }
            ],
            "fonte": "mercado-livre",
            "id": "sample-keyword-id-1",
            "link": "https://www.mercadolivre.com.br/cartucho-hp-667",
            "num_avaliacoes": 23,
            "preco": 54.038881328646696,
            "timestamp": "2025-06-11T03:05:23.907Z",
            "titulo": "Cartucho HP 667 Colorido Original - Ótima qualidade de impressão e rendimento superior. Compatível com diversas impressoras da linha HP DeskJet. Ideal para impressões de fotos e documentos coloridos com alta fidelidade. Tecnologia avançada que previne entupimentos e garante maior durabilidade do equipamento. Econômico e com selo de garantia da HP.",
            "vendedor": "HP Store Oficial"
        },
        {
            "avaliacao": 65.43241550894064,
            "busca": "cartucho-hp-664",
            "comentarios": [
                {
                    "data": "2025-06-11T03:05:23.907Z",
                    "texto": "Produto muito bom, recomendo a todos",
                    "usuario": "comprador-feliz"
                }
            ],
            "fonte": "mercado-livre",
            "id": "sample-keyword-id-2",
            "link": "https://www.mercadolivre.com.br/cartucho-hp-664",
            "num_avaliacoes": 87,
            "preco": 89.03929129003753,
            "timestamp": "2025-06-11T03:05:23.907Z",
            "titulo": "Cartucho HP 664 Preto Original - Excelente opção para impressões de documentos em preto e branco com alta qualidade. Desenvolvido com tecnologia anti-fraude e chip inteligente. Compatível com impressoras HP DeskJet 2136, 2676, 3776 e outras da linha. Fácil instalação e alto rendimento, garantindo economia e resultados profissionais em cada impressão.",
            "vendedor": "Mega Supplies"
        },
        {
            "avaliacao": 0.1697259479204738,
            "busca": "kit-cartuchos-hp",
            "comentarios": [
                {
                    "data": "2025-06-11T03:05:23.907Z",
                    "texto": "Chegou antes do prazo. Muito satisfeito",
                    "usuario": "cliente-vip"
                }
            ],
            "fonte": "mercado-livre",
            "id": "sample-keyword-id-3",
            "link": "https://www.mercadolivre.com.br/kit-cartuchos-hp",
            "num_avaliacoes": 24,
            "preco": 113.64865438409163,
            "timestamp": "2025-06-11T03:05:23.907Z",
            "titulo": "Kit Cartuchos HP 662 Preto e Colorido - Combo econômico para suas impressões diárias. Contém um cartucho preto e um colorido originais da HP, compatíveis com impressoras DeskJet 1516, 2546, 3546 e modelos similares. Proporciona impressões nítidas de textos e gráficos coloridos vibrantes. Embalagem selada com garantia de autenticidade e validade estendida.",
            "vendedor": "Printer Suprimentos"
        }
    ]

def insert_sample_documents():
    """Insere documentos de exemplo no Elasticsearch"""
    try:
        # Obtém cliente do Elasticsearch
        client = get_elasticsearch_client()

        # Configura o índice
        setup_index(client)

        # Documentos de exemplo
        docs = get_sample_documents()

        # Formata os documentos para o bulk API
        bulk_docs = []
        for doc in docs:
            bulk_docs.append({
                "_index": ES_INDEX,
                "_id": doc["id"],  # Usa o ID do documento como ID no Elasticsearch
                "_source": doc
            })

        # Insere os documentos usando a API bulk
        if bulk_docs:
            bulk_response = helpers.bulk(client, bulk_docs)
            logger.info(f"Resposta do bulk: {bulk_response}")
            logger.info(f"Inseridos {bulk_response[0]} documentos com sucesso!")
            return True

        return False

    except Exception as e:
        logger.error(f"Erro ao inserir documentos: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

def search_sample_documents():
    """Realiza uma busca simples para verificar os documentos inseridos"""
    try:
        # Obtém cliente do Elasticsearch
        client = get_elasticsearch_client()

        # Busca por todos os documentos no índice
        search_query = {
            "query": {
                "match_all": {}
            }
        }

        response = client.search(index=ES_INDEX, body=search_query)

        # Exibe os resultados
        hits = response["hits"]["hits"]
        logger.info(f"Encontrados {len(hits)} documentos:")

        for hit in hits:
            logger.info(f"ID: {hit['_id']}")
            logger.info(f"Título: {hit['_source']['titulo'][:50]}...")
            logger.info(f"Avaliação: {hit['_source']['avaliacao']}")
            logger.info(f"Preço: {hit['_source']['preco']}")
            logger.info("-" * 50)

        return hits

    except Exception as e:
        logger.error(f"Erro ao buscar documentos: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return []

# Funções de teste para o pytest
@pytest.fixture
def es_client():
    """Fixture para fornecer um cliente Elasticsearch configurado para os testes"""
    try:
        client = get_elasticsearch_client()
        return client
    except Exception as e:
        pytest.skip(f"Não foi possível conectar ao Elasticsearch: {e}")

@pytest.fixture
def setup_test_index(es_client):
    """Fixture para configurar o índice de teste"""
    try:
        setup_index(es_client)
        yield es_client
        # Não removemos o índice após os testes para manter os dados para inspeção
    except Exception as e:
        pytest.skip(f"Não foi possível configurar o índice de teste: {e}")

def test_elasticsearch_connection():
    """Testa a conexão com o Elasticsearch"""
    try:
        client = get_elasticsearch_client()
        info = client.info()
        assert info["cluster_name"] is not None
        print(f"Conectado ao Elasticsearch: {info['cluster_name']}")
    except Exception as e:
        pytest.fail(f"Falha na conexão com o Elasticsearch: {e}")

def test_index_creation(es_client):
    """Testa a criação do índice no Elasticsearch"""
    try:
        setup_index(es_client)
        assert es_client.indices.exists(index=ES_INDEX)
        print(f"Índice '{ES_INDEX}' criado/verificado com sucesso!")
    except Exception as e:
        pytest.fail(f"Falha na criação do índice: {e}")

def test_document_insertion(setup_test_index):
    """Testa a inserção de documentos no Elasticsearch"""
    try:
        docs = get_sample_documents()
        # Usamos apenas o primeiro documento para o teste
        test_doc = docs[0]

        # Insere o documento
        result = setup_test_index.index(
            index=ES_INDEX,
            id=test_doc["id"],
            body=test_doc,
            refresh=True  # Garante que o documento seja imediatamente pesquisável
        )

        assert result["result"] == "created" or result["result"] == "updated"
        print(f"Documento inserido com sucesso: {result['result']}")

        # Verifica se o documento foi realmente inserido
        get_result = setup_test_index.get(index=ES_INDEX, id=test_doc["id"])
        assert get_result["found"] == True
        assert get_result["_source"]["titulo"] == test_doc["titulo"]
        print(f"Documento recuperado com sucesso: {test_doc['id']}")
    except Exception as e:
        pytest.fail(f"Falha na inserção de documento: {e}")

def test_search_documents(setup_test_index):
    """Testa a busca de documentos no Elasticsearch"""
    try:
        # Primeiro garantimos que temos pelo menos um documento no índice
        docs = get_sample_documents()
        for doc in docs:
            setup_test_index.index(
                index=ES_INDEX,
                id=doc["id"],
                body=doc,
                refresh=True
            )

        # Busca por todos os documentos
        search_query = {
            "query": {
                "match_all": {}
            }
        }

        response = setup_test_index.search(index=ES_INDEX, body=search_query)
        hits = response["hits"]["hits"]

        assert len(hits) >= 1  # Devemos encontrar pelo menos um documento
        print(f"Busca retornou {len(hits)} documentos")

        # Teste de busca por termo específico
        keyword_query = {
            "query": {
                "match": {
                    "titulo": "National Park"
                }
            }
        }

        keyword_response = setup_test_index.search(index=ES_INDEX, body=keyword_query)
        keyword_hits = keyword_response["hits"]["hits"]

        assert len(keyword_hits) >= 1  # Devemos encontrar pelo menos um documento
        print(f"Busca por 'National Park' retornou {len(keyword_hits)} documentos")
    except Exception as e:
        pytest.fail(f"Falha na busca de documentos: {e}")

if __name__ == "__main__":
    print("=" * 80)
    print("FERRAMENTA DE TESTE DO ELASTICSEARCH")
    print("=" * 80)
    print("\n1. Inserindo documentos de exemplo...")

    success = insert_sample_documents()

    if success:
        print("\n2. Realizando busca para verificar os documentos inseridos...")
        search_sample_documents()

        print("\nProcesso concluído com sucesso!")
    else:
        print("\nFalha ao inserir documentos. Verifique os logs para mais informações.")
