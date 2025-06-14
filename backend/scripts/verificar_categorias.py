#!/usr/bin/env python
"""
Script para verificar como as categorias estão sendo processadas
e entender por que 'Impressoras' ainda aparece nos gráficos
"""
import sys
import os
import json
from datetime import datetime, timedelta

# Adicionar o diretório do projeto ao PATH para permitir importações
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(project_root)

from app.services.elasticsearch_service import ElasticsearchService
from app.models.product import Product
from app.db.session import SessionLocal

def verificar_categorias():
    """Verifica como as categorias estão sendo processadas"""
    print(f"{'=' * 50}")
    print("VERIFICAÇÃO DE CATEGORIAS")
    print(f"{'=' * 50}")

    try:
        # Inicializar o serviço Elasticsearch
        es_service = ElasticsearchService()

        # Conectar ao banco de dados
        db = SessionLocal()

        # 1. Obter todos os produtos cadastrados no banco de dados
        print("\nProdutos cadastrados no banco de dados:")
        registered_products = db.query(Product).filter(Product.is_active == True).all()

        print(f"Total de produtos cadastrados: {len(registered_products)}")

        families = {}
        for product in registered_products:
            family = product.family or "Sem categoria"
            if family not in families:
                families[family] = 0
            families[family] += 1

        print("\nDistribuição por família/categoria no banco de dados:")
        for family, count in families.items():
            print(f"  - {family}: {count} produtos ({count/len(registered_products)*100:.1f}%)")

        # 2. Verificar títulos que contêm "impressora"
        print("\nBuscando produtos com 'impressora' no título:")
        query_impressora = {
            "query": {
                "match": {
                    "title": "impressora"
                }
            },
            "size": 20
        }

        response = es_service.client.search(index="hp-traker-ml", body=query_impressora)
        hits = response.get('hits', {}).get('hits', [])

        if hits:
            print(f"Encontrados {len(hits)} produtos com 'impressora' no título:")
            for hit in hits:
                source = hit['_source']
                print(f"  - ID: {hit['_id']}")
                print(f"    Título: {source.get('title', 'N/A')}")
                print(f"    Termo de busca: {source.get('search_term', 'N/A')}")
                print(f"    Timestamp: {source.get('timestamp', 'N/A')}")
                print("    " + "-" * 40)
        else:
            print("Nenhum produto com 'impressora' no título encontrado.")

        # 3. Simular o processamento do endpoint category-distribution
        print("\nSimulando o processamento do endpoint category-distribution:")

        # Pegar o início do período (30 dias atrás)
        start_date = (datetime.now() - timedelta(days=30)).isoformat()

        # Definir categorias principais (mesmo código do endpoint)
        main_categories = {
            "Cartuchos": ["cartucho", "tinta", "hp 6", "hp 9"],
            "Tintas": ["tinta", "garrafa", "gt", "ink"],
            "Suprimentos": ["kit", "combo", "refil"]
        }

        # Mapear termos de busca para categorias
        search_term_to_category = {}
        for product in registered_products:
            if not product.search_terms:
                continue

            term = product.search_terms.lower()

            assigned_category = None
            for category, keywords in main_categories.items():
                if any(keyword in term for keyword in keywords):
                    assigned_category = category
                    break

            if not assigned_category:
                assigned_category = product.family or "Outros"

            search_term_to_category[term] = assigned_category

        # Buscar termos de busca no Elasticsearch
        query = {
            "query": {
                "range": {
                    "timestamp": {
                        "gte": start_date
                    }
                }
            },
            "aggs": {
                "search_terms": {
                    "terms": {
                        "field": "search_term.keyword",
                        "size": 100
                    }
                }
            },
            "size": 0
        }

        response = es_service.client.search(index="hp-traker-ml", body=query)

        # Processar os termos de busca
        category_counts = {}

        print("\nTermos de busca e suas categorias:")
        for bucket in response["aggregations"]["search_terms"]["buckets"]:
            search_term = bucket["key"].lower()
            count = bucket["doc_count"]

            # Encontrar a categoria correspondente
            category = "Outros"

            if search_term in search_term_to_category:
                category = search_term_to_category[search_term]
            else:
                for cat, keywords in main_categories.items():
                    if any(keyword in search_term for keyword in keywords):
                        category = cat
                        break

            print(f"  - Termo: '{search_term}', Categoria: '{category}', Contagem: {count}")

            if category not in category_counts:
                category_counts[category] = 0
            category_counts[category] += count

        # Resultado final
        print("\nDistribuição final de categorias:")
        total = sum(category_counts.values())
        for category, count in sorted(category_counts.items(), key=lambda x: x[1], reverse=True):
            percentage = (count / total * 100) if total > 0 else 0
            print(f"  - {category}: {count} produtos ({percentage:.1f}%)")

        # 4. Verificar diretamente títulos no frontend
        print("\nPara verificar se há um problema no frontend:")
        print("1. A página pode estar usando dados em cache do navegador")
        print("2. O componente React pode não estar atualizando com novos dados")
        print("3. Pode haver uma discrepância entre os dados do backend e frontend")

        print("\nSugestões para resolver:")
        print("1. Limpe o cache do navegador")
        print("2. Verifique se o frontend está realmente chamando o endpoint atualizado")
        print("3. Implemente um console.log no frontend para verificar os dados recebidos")
        print("4. Adicione um timestamp à chamada da API para evitar cache: ?t="+datetime.now().isoformat())

        # Fechar a conexão com o banco de dados
        db.close()

        return True

    except Exception as e:
        print(f"Erro ao verificar categorias: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    verificar_categorias()
