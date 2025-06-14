#!/usr/bin/env python
"""
Script para verificar dados específicos no Elasticsearch e validar a presença
de categorias ou produtos que não deveriam estar nos gráficos.
"""
import sys
import os
import json
from datetime import datetime

# Adicionar o diretório do projeto ao PATH para permitir importações
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(project_root)

from app.services.elasticsearch_service import ElasticsearchService

def verificar_dados_especificos():
    """Verifica dados específicos no Elasticsearch para validar sua presença"""
    print(f"{'=' * 50}")
    print("VERIFICAÇÃO DE DADOS ESPECÍFICOS NO ELASTICSEARCH")
    print(f"{'=' * 50}")

    try:
        # Inicializar o serviço
        es_service = ElasticsearchService()

        # 1. Verificar produtos com "Impressora" no título
        query_impressora = {
            "query": {
                "match": {
                    "title": "Impressora"
                }
            },
            "size": 10
        }

        print("\nBuscando produtos com 'Impressora' no título...")
        response = es_service.client.search(index="hp-traker-ml", body=query_impressora)
        hits = response.get('hits', {}).get('hits', [])

        if hits:
            print(f"Encontrados {len(hits)} produtos com 'Impressora' no título:")
            for hit in hits:
                source = hit['_source']
                print(f"  - ID: {hit['_id']}")
                print(f"    Título: {source.get('title', 'N/A')}")
                print(f"    Timestamp: {source.get('timestamp', 'N/A')}")
                print(f"    Termo de busca: {source.get('search_term', 'N/A')}")
                print(f"    URL: {source.get('url', 'N/A')}")
                print("    " + "-" * 40)
        else:
            print("Nenhum produto com 'Impressora' no título encontrado.")

        # 2. Verificar categorias presentes nos dados
        query_categories = {
            "size": 0,
            "aggs": {
                "categories": {
                    "terms": {
                        "field": "category.keyword",
                        "size": 20
                    }
                }
            }
        }

        print("\nVerificando categorias presentes nos dados...")
        try:
            response = es_service.client.search(index="hp-traker-ml", body=query_categories)

            buckets = response.get('aggregations', {}).get('categories', {}).get('buckets', [])

            if buckets:
                print(f"Encontradas {len(buckets)} categorias:")
                for bucket in buckets:
                    print(f"  - {bucket['key']}: {bucket['doc_count']} produtos")
            else:
                print("Nenhuma categoria encontrada na agregação.")

            # 3. Verificar termos de busca utilizados
            query_search_terms = {
                "size": 0,
                "aggs": {
                    "search_terms": {
                        "terms": {
                            "field": "search_term.keyword",
                            "size": 20
                        }
                    }
                }
            }

            print("\nVerificando termos de busca utilizados...")
            response = es_service.client.search(index="hp-traker-ml", body=query_search_terms)

            buckets = response.get('aggregations', {}).get('search_terms', {}).get('buckets', [])

            if buckets:
                print(f"Encontrados {len(buckets)} termos de busca:")
                for bucket in buckets:
                    print(f"  - {bucket['key']}: {bucket['doc_count']} produtos")
            else:
                print("Nenhum termo de busca encontrado na agregação.")

        except Exception as e:
            print(f"Erro ao buscar agregações: {e}")

        return True

    except Exception as e:
        print(f"Erro ao verificar dados no Elasticsearch: {e}")
        return False

if __name__ == "__main__":
    verificar_dados_especificos()
