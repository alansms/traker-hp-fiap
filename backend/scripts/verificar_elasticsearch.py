#!/usr/bin/env python
"""
Script para verificar se os dados do scraping estão sendo salvos no Elasticsearch Cloud
"""
import sys
import os
import json
from datetime import datetime

# Adicionar o diretório do projeto ao PATH para permitir importações
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(project_root)

from app.services.elasticsearch_service import ElasticsearchService

def verificar_dados_elasticsearch():
    """Verifica se os dados estão sendo indexados no Elasticsearch"""
    print(f"{'=' * 50}")
    print("VERIFICAÇÃO DE DADOS NO ELASTICSEARCH")
    print(f"{'=' * 50}")

    try:
        # Inicializar o serviço
        es_service = ElasticsearchService()

        # Verificar o total de documentos no índice
        response = es_service.client.count(index="hp-traker-ml")
        total_docs = response.get('count', 0)

        print(f"Total de documentos indexados: {total_docs}")

        if total_docs == 0:
            print("Nenhum documento encontrado no Elasticsearch!")
            return False

        # Buscar os documentos mais recentes
        query = {
            "sort": [{"timestamp": {"order": "desc"}}],
            "size": 5
        }

        response = es_service.client.search(
            index="hp-traker-ml",
            body=query
        )

        hits = response.get('hits', {}).get('hits', [])

        if not hits:
            print("Nenhum documento encontrado na busca!")
            return False

        print(f"\nÚltimos {len(hits)} documentos indexados:")
        print("-" * 50)

        for i, hit in enumerate(hits):
            source = hit['_source']
            print(f"Documento {i+1}:")
            print(f"  ID: {hit['_id']}")
            print(f"  Título: {source.get('title', source.get('titulo', 'N/A'))}")
            print(f"  Preço: R$ {source.get('price', source.get('preco', 0))}")
            print(f"  Vendedor: {source.get('seller', source.get('vendedor', 'N/A'))}")
            print(f"  Timestamp: {source.get('timestamp', 'N/A')}")
            print(f"  Termo de busca: {source.get('search_term', source.get('busca', 'N/A'))}")
            print("-" * 50)

        # Verificar agregações por vendedor (Top 5)
        agg_query = {
            "size": 0,
            "aggs": {
                "top_vendedores": {
                    "terms": {
                        "field": "seller.keyword",
                        "size": 5
                    }
                }
            }
        }

        try:
            agg_response = es_service.client.search(
                index="hp-traker-ml",
                body=agg_query
            )

            buckets = agg_response.get('aggregations', {}).get('top_vendedores', {}).get('buckets', [])

            if buckets:
                print("\nTop 5 vendedores:")
                for bucket in buckets:
                    print(f"  {bucket['key']}: {bucket['doc_count']} produtos")

        except Exception as e:
            print(f"Erro ao buscar agregações: {e}")

        return True

    except Exception as e:
        print(f"Erro ao verificar dados no Elasticsearch: {e}")
        return False

if __name__ == "__main__":
    verificar_dados_elasticsearch()
