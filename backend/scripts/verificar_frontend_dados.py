#!/usr/bin/env python
"""
Script para verificar categorias no frontend e no backend
"""
import sys
import os
import json
import requests
from datetime import datetime, timedelta

# Adicionar o diretório do projeto ao PATH para permitir importações
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(project_root)

from app.services.elasticsearch_service import ElasticsearchService
from app.db.session import get_db
from sqlalchemy import text

def verificar_categorias_frontend():
    """
    Verifica os dados que o frontend está recebendo do endpoint de categorias
    """
    print(f"{'=' * 50}")
    print("VERIFICAÇÃO DE CATEGORIAS NO FRONTEND")
    print(f"{'=' * 50}")

    try:
        # 1. Chamar o endpoint diretamente para ver o que o frontend está recebendo
        # Use um timestamp para evitar cache
        timestamp = datetime.now().isoformat()

        # Usar localhost para acesso interno do container
        url = f"http://backend:8000/category-distribution?t={timestamp}"

        try:
            print(f"\nTentando acessar o endpoint: {url}")

            # Fazer a requisição diretamente ao backend para ver o que está sendo retornado
            # Isso não passa pelo nginx e ajuda a identificar problemas de rede
            response = requests.get(url)
            if response.status_code == 200:
                data = response.json()
                print("\nDados retornados pelo endpoint de categorias:")
                total = sum(item['value'] for item in data)
                for item in data:
                    percentage = (item['value'] / total * 100) if total > 0 else 0
                    print(f"  - {item['name']}: {item['value']} produtos ({percentage:.1f}%)")
            else:
                print(f"Erro ao acessar o endpoint: {response.status_code}")
        except Exception as e:
            print(f"Erro ao acessar o endpoint diretamente: {e}")
            print("Tentando uma abordagem alternativa...")

        # 2. Verificar dados no Elasticsearch
        es_service = ElasticsearchService()

        # Pegar o início do período (30 dias atrás)
        start_date = (datetime.now() - timedelta(days=30)).isoformat()

        # Verificar produtos com "impressora" no título
        query_impressora = {
            "query": {
                "bool": {
                    "must": [
                        {"range": {"timestamp": {"gte": start_date}}},
                        {"match": {"title": "impressora"}}
                    ]
                }
            },
            "size": 10
        }

        print("\nVerificando produtos com 'impressora' no título (últimos 30 dias):")
        response = es_service.client.search(index="hp-traker-ml", body=query_impressora)
        hits = response.get('hits', {}).get('hits', [])

        if hits:
            print(f"Encontrados {len(hits)} produtos com 'impressora' no título:")
            for hit in hits:
                source = hit['_source']
                print(f"  - Título: {source.get('title', 'N/A')}")
                print(f"    Termo de busca: {source.get('search_term', 'N/A')}")
                print(f"    Timestamp: {source.get('timestamp', 'N/A')}")
        else:
            print("Nenhum produto com 'impressora' no título encontrado.")

        # 3. Verificar produtos do banco de dados usando SQL puro
        db = get_db()
        db_session = next(db)

        print("\nProdutos cadastrados no banco de dados (SQL direto):")
        result = db_session.execute(text("SELECT id, name, family, search_terms FROM products WHERE is_active = true"))

        products_by_family = {}
        search_terms = []

        for row in result:
            family = row[2] or "Sem categoria"
            if family not in products_by_family:
                products_by_family[family] = 0
            products_by_family[family] += 1

            if row[3]:  # search_terms
                search_terms.append(row[3].lower())

        print("\nDistribuição por família/categoria no banco de dados:")
        total_products = sum(products_by_family.values())
        for family, count in products_by_family.items():
            percentage = (count / total_products * 100) if total_products > 0 else 0
            print(f"  - {family}: {count} produtos ({percentage:.1f}%)")

        print("\nTermos de busca cadastrados:")
        for term in search_terms[:10]:  # Limitar a 10 termos para não poluir a saída
            print(f"  - {term}")

        if len(search_terms) > 10:
            print(f"  ... e mais {len(search_terms) - 10} termos")

        # 4. Verificar se há uma categoria "Impressoras" definida no código
        print("\nVerificando possíveis causas para 'Impressoras' aparecer nos gráficos:")
        print("1. Verifique se há dados em cache no navegador")
        print("2. Verifique se o frontend está chamando o endpoint atualizado")
        print("3. Verifique se há categorias hard-coded no frontend")
        print("4. Verifique se o endpoint '/api/analytics/category-distribution' está correto no frontend")

        return True
    except Exception as e:
        print(f"Erro ao verificar categorias: {e}")
        import traceback
        traceback.print_exc()
        return False

# Verificar vendedores reais
def verificar_vendedores():
    """Verifica se os vendedores que aparecem nos gráficos são reais"""
    print(f"\n{'=' * 50}")
    print("VERIFICAÇÃO DE VENDEDORES")
    print(f"{'=' * 50}")

    try:
        # Conectar ao Elasticsearch
        es_service = ElasticsearchService()

        # Pegar o início do período (30 dias atrás)
        start_date = (datetime.now() - timedelta(days=30)).isoformat()

        # Consulta para obter os principais vendedores
        query = {
            "query": {
                "range": {
                    "timestamp": {
                        "gte": start_date
                    }
                }
            },
            "aggs": {
                "sellers": {
                    "terms": {
                        "field": "seller.keyword",
                        "size": 20
                    },
                    "aggs": {
                        "avg_rating": {
                            "avg": {
                                "field": "rating"
                            }
                        },
                        "avg_price": {
                            "avg": {
                                "field": "price"
                            }
                        }
                    }
                }
            },
            "size": 0
        }

        # Executar a consulta
        response = es_service.client.search(index="hp-traker-ml", body=query)

        # Processar os resultados
        print("\nVendedores encontrados no Elasticsearch:")

        sellers = []
        for bucket in response["aggregations"]["sellers"]["buckets"]:
            seller_name = bucket["key"] or "Desconhecido"
            doc_count = bucket["doc_count"]
            avg_rating = round(bucket["avg_rating"]["value"] or 0, 1) if bucket["avg_rating"]["value"] is not None else None
            avg_price = round(bucket["avg_price"]["value"] or 0, 2) if bucket["avg_price"]["value"] is not None else None

            sellers.append({
                "name": seller_name,
                "count": doc_count,
                "avg_rating": avg_rating,
                "avg_price": avg_price
            })

            print(f"  - {seller_name}: {doc_count} produtos, Avaliação: {avg_rating}, Preço médio: R$ {avg_price}")

        # Comparar com os vendedores mencionados
        mentioned_sellers = ["HP Brasil", "Suprimentos Online", "Distribuidora Tech", "InfoShop"]

        print("\nComparando com os vendedores mencionados:")
        for seller in mentioned_sellers:
            found = False
            for es_seller in sellers:
                if seller.lower() in es_seller["name"].lower():
                    found = True
                    print(f"  - {seller}: ENCONTRADO como '{es_seller['name']}'")
                    break

            if not found:
                print(f"  - {seller}: NÃO ENCONTRADO nos dados do Elasticsearch")

        print("\nConclusão sobre vendedores:")
        print("1. Verifique se os vendedores no frontend estão sendo carregados de outra fonte de dados")
        print("2. Verifique se há dados de vendedores hard-coded no frontend")
        print("3. Verifique se o endpoint '/api/analytics/seller-performance' está correto no frontend")

        return True
    except Exception as e:
        print(f"Erro ao verificar vendedores: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    verificar_categorias_frontend()
    verificar_vendedores()
