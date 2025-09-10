from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Dict, Any, Optional
from ..services.elasticsearch_service import ElasticsearchService
from ..core.security import get_current_user
import logging
from datetime import datetime, timedelta

router = APIRouter(tags=["analytics"])

# Instanciando o serviço Elasticsearch
es_service = ElasticsearchService()

logger = logging.getLogger(__name__)

@router.get("/price-distribution")
async def get_price_distribution(
    period_days: int = Query(30, description="Período em dias para análise")
):
    """
    Retorna a distribuição de produtos por faixas de preço
    """
    try:
        # Calcula a data de início do período
        start_date = (datetime.now() - timedelta(days=period_days)).isoformat()

        # Cria a consulta para o Elasticsearch
        query = {
            "query": {
                "range": {
                    "timestamp": {
                        "gte": start_date
                    }
                }
            },
            "aggs": {
                "price_ranges": {
                    "range": {
                        "field": "price",  # Usando "price" em vez de "preco"
                        "ranges": [
                            { "to": 100 },
                            { "from": 100, "to": 200 },
                            { "from": 200, "to": 300 },
                            { "from": 300, "to": 400 },
                            { "from": 400, "to": 500 },
                            { "from": 500 }
                        ]
                    }
                }
            },
            "size": 0  # Não precisamos dos documentos, apenas das agregações
        }

        # Executa a consulta no Elasticsearch
        response = es_service.client.search(index="hp-traker-ml", body=query)

        # Processa os resultados
        price_distribution = []
        for bucket in response["aggregations"]["price_ranges"]["buckets"]:
            range_label = "R$ 0-100" if bucket["key"] == "*-100.0" else \
                         f"R$ {int(bucket['from'])}-{int(bucket['to'])}" if "from" in bucket and "to" in bucket else \
                         f"R$ {int(bucket['from'])}+" if "from" in bucket else \
                         "Sem preço"

            price_distribution.append({
                "range": range_label,
                "count": bucket["doc_count"]
            })

        return price_distribution
    except Exception as e:
        logger.error(f"Erro ao buscar distribuição de preços: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar distribui��ão de preços: {str(e)}")

@router.get("/price-evolution")
async def get_price_evolution(
    product: str = Query(..., description="Nome do produto ou 'all' para todos"),
    period_days: int = Query(30, description="Período em dias para análise")
):
    """
    Retorna a evolução de preço de produtos ao longo do tempo
    """
    try:
        # Calcula a data de início do período
        start_date = (datetime.now() - timedelta(days=period_days)).isoformat()

        # Prepara a consulta base
        query_base = {
            "range": {
                "timestamp": {
                    "gte": start_date
                }
            }
        }

        # Adiciona filtro de produto se não for 'all'
        if product.lower() != 'all':
            query = {
                "bool": {
                    "must": [
                        query_base,
                        {
                            "match": {
                                "title": product  # Usando "title" em vez de "titulo"
                            }
                        }
                    ]
                }
            }
        else:
            query = query_base

        # Cria a consulta para o Elasticsearch com agregação por data
        agg_query = {
            "query": query,
            "aggs": {
                "price_over_time": {
                    "date_histogram": {
                        "field": "timestamp",
                        "calendar_interval": "1d"  # Intervalo de 1 dia
                    },
                    "aggs": {
                        "avg_price": {
                            "avg": {
                                "field": "price"  # Usando "price" em vez de "preco"
                            }
                        },
                        "min_price": {
                            "min": {
                                "field": "price"  # Usando "price" em vez de "preco"
                            }
                        },
                        "max_price": {
                            "max": {
                                "field": "price"  # Usando "price" em vez de "preco"
                            }
                        }
                    }
                }
            },
            "size": 0  # Não precisamos dos documentos, apenas das agregações
        }

        # Executa a consulta no Elasticsearch
        response = es_service.client.search(index="hp-traker-ml", body=agg_query)

        # Processa os resultados
        price_history = []
        for bucket in response["aggregations"]["price_over_time"]["buckets"]:
            # Só inclui pontos que tenham dados
            if bucket["doc_count"] > 0:
                # Formata a data como YYYY-MM
                date_str = datetime.fromtimestamp(bucket["key"] / 1000).strftime('%Y-%m')

                price_history.append({
                    "date": date_str,
                    "avgPrice": round(bucket["avg_price"]["value"], 2) if bucket["avg_price"]["value"] is not None else 0,
                    "minPrice": round(bucket["min_price"]["value"], 2) if bucket["min_price"]["value"] is not None else 0,
                    "maxPrice": round(bucket["max_price"]["value"], 2) if bucket["max_price"]["value"] is not None else 0
                })

        return price_history
    except Exception as e:
        logger.error(f"Erro ao buscar evolução de preço: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar evolução de preço: {str(e)}")

@router.get("/search-trends")
async def get_search_trends(
    period_days: int = Query(30, description="Período em dias para análise")
):
    """
    Retorna os termos de busca mais frequentes
    """
    try:
        # Calcula a data de início do período
        start_date = (datetime.now() - timedelta(days=period_days)).isoformat()

        # Cria a consulta para o Elasticsearch
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
                        "field": "search_term.keyword",  # Usando "search_term" em vez de "busca"
                        "size": 10
                    }
                }
            },
            "size": 0  # Não precisamos dos documentos, apenas das agregações
        }

        # Executa a consulta no Elasticsearch
        response = es_service.client.search(index="hp-traker-ml", body=query)

        # Processa os resultados
        search_trends = []
        for bucket in response["aggregations"]["search_terms"]["buckets"]:
            search_trends.append({
                "term": bucket["key"],
                "count": bucket["doc_count"]
            })

        return search_trends
    except Exception as e:
        logger.error(f"Erro ao buscar tendências de busca: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar tendências de busca: {str(e)}")

@router.get("/top-products")
async def get_top_products(
    size: int = Query(10, description="Número de produtos a retornar"),
    period_days: int = Query(30, description="Período em dias para análise")
):
    """
    Retorna os produtos mais encontrados nas buscas
    """
    try:
        # Obtém os produtos do Elasticsearch
        return es_service.get_top_products(size, period_days)
    except Exception as e:
        logger.error(f"Erro ao buscar top produtos: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar top produtos: {str(e)}")

@router.get("/daily-searches")
async def get_daily_searches(
    period_days: int = Query(30, description="Período em dias para análise")
):
    """
    Retorna a contagem de buscas por dia
    """
    try:
        # Calcula a data de início do período
        start_date = (datetime.now() - timedelta(days=period_days)).isoformat()

        # Cria a consulta para o Elasticsearch
        query = {
            "query": {
                "range": {
                    "timestamp": {
                        "gte": start_date
                    }
                }
            },
            "aggs": {
                "searches_per_day": {
                    "date_histogram": {
                        "field": "timestamp",
                        "calendar_interval": "1d"
                    }
                }
            },
            "size": 0  # Não precisamos dos documentos, apenas das agregações
        }

        # Executa a consulta no Elasticsearch
        response = es_service.client.search(index="hp-traker-ml", body=query)

        # Processa os resultados
        daily_searches = []
        for bucket in response["aggregations"]["searches_per_day"]["buckets"]:
            # Formata a data como YYYY-MM-DD
            date_str = datetime.fromtimestamp(bucket["key"] / 1000).strftime('%Y-%m-%d')

            daily_searches.append({
                "date": date_str,
                "count": bucket["doc_count"]
            })

        return daily_searches
    except Exception as e:
        logger.error(f"Erro ao buscar buscas diárias: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar buscas diárias: {str(e)}")

@router.get("/top-rated-products")
async def get_top_rated_products(
    size: int = Query(10, description="Número de produtos a retornar"),
    period_days: int = Query(30, description="Período em dias para análise")
):
    """
    Retorna os produtos com melhores avaliações
    """
    try:
        # Calcula a data de início do período
        start_date = (datetime.now() - timedelta(days=period_days)).isoformat()

        # Cria a consulta para o Elasticsearch
        query = {
            "query": {
                "range": {
                    "timestamp": {
                        "gte": start_date
                    }
                }
            },
            "sort": [
                {
                    "rating": {  # Usando "rating" em vez de "avaliacao"
                        "order": "desc"
                    }
                }
            ],
            "size": size
        }

        # Executa a consulta no Elasticsearch
        response = es_service.client.search(index="hp-traker-ml", body=query)

        # Processa os resultados
        top_rated = []
        for hit in response["hits"]["hits"]:
            product = hit["_source"]
            top_rated.append({
                "id": product.get("id", hit["_id"]),
                "title": product.get("title", "Sem título"),  # Usando "title" em vez de "titulo"
                "price": product.get("price", 0),  # Usando "price" em vez de "preco"
                "rating": product.get("rating", 0),  # Usando "rating" em vez de "avaliacao"
                "seller": product.get("seller", "Desconhecido"),  # Usando "seller" em vez de "vendedor"
                "timestamp": product.get("timestamp", "")
            })

        return top_rated
    except Exception as e:
        logger.error(f"Erro ao buscar produtos melhor avaliados: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar produtos melhor avaliados: {str(e)}")

@router.get("/category-distribution")
async def get_category_distribution(
    period_days: int = Query(30, description="Período em dias para análise")
):
    """
    Retorna a distribuição de produtos por categoria com base nas categorias reais
    da base de dados em vez de extrair do título
    """
    try:
        # Calcula a data de início do período
        start_date = (datetime.now() - timedelta(days=period_days)).isoformat()

        # Obter produtos cadastrados no banco de dados para definir categorias válidas
        from ..models.product import Product
        from ..db.session import SessionLocal

        db = SessionLocal()
        registered_products = db.query(Product).filter(Product.is_active == True).all()

        # Extrair informações de família/categoria dos produtos registrados
        valid_families = {}
        for product in registered_products:
            family = product.family or "Sem categoria"
            if family not in valid_families:
                valid_families[family] = []
            valid_families[family].append(product.search_terms.lower() if product.search_terms else "")

        # Adicionar categorias principais com base nos produtos registrados
        main_categories = {
            "Cartuchos": ["cartucho", "tinta", "hp 6", "hp 9"],
            "Tintas": ["tinta", "garrafa", "gt", "ink"],
            "Suprimentos": ["kit", "combo", "refil"]
        }

        # Mapear termos de busca para categorias principais
        search_term_to_category = {}
        for product in registered_products:
            if not product.search_terms:
                continue

            term = product.search_terms.lower()

            # Determinar a categoria principal com base no termo de busca
            assigned_category = None
            for category, keywords in main_categories.items():
                if any(keyword in term for keyword in keywords):
                    assigned_category = category
                    break

            # Se não foi categorizado em nenhuma principal, usar a família
            if not assigned_category:
                assigned_category = product.family or "Outros"

            search_term_to_category[term] = assigned_category

        # Fechar a conexão com o banco de dados
        db.close()

        # Cria a consulta para o Elasticsearch para buscar termos de busca
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

        # Executa a consulta no Elasticsearch
        response = es_service.client.search(index="hp-traker-ml", body=query)

        # Inicializar contagem de categorias
        category_counts = {}

        # Processar os termos de busca encontrados no Elasticsearch
        for bucket in response["aggregations"]["search_terms"]["buckets"]:
            search_term = bucket["key"].lower()
            count = bucket["doc_count"]

            # Encontrar a categoria correspondente ao termo de busca
            category = "Outros"  # Categoria padrão

            # Verificar nas categorias mapeadas
            if search_term in search_term_to_category:
                category = search_term_to_category[search_term]
            else:
                # Se não encontrar o termo exato, verificar se o termo contém alguma das palavras-chave
                for cat, keywords in main_categories.items():
                    if any(keyword in search_term for keyword in keywords):
                        category = cat
                        break

            # Adicionar à contagem
            if category not in category_counts:
                category_counts[category] = 0
            category_counts[category] += count

        # Formatar para o resultado esperado
        category_distribution = [
            {"name": category, "value": count}
            for category, count in category_counts.items()
            if count > 0  # Exclui categorias vazias
        ]

        # Ordenar por contagem (maior primeiro)
        category_distribution.sort(key=lambda x: x["value"], reverse=True)

        return category_distribution
    except Exception as e:
        logger.error(f"Erro ao buscar distribuição por categoria: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar distribuição por categoria: {str(e)}")

@router.get("/stock-availability")
async def get_stock_availability(
    period_days: int = Query(30, description="Período em dias para análise")
):
    """
    Retorna a disponibilidade de estoque dos produtos inferida pelos dados
    """
    try:
        # Calcula a data de início do período
        start_date = (datetime.now() - timedelta(days=period_days)).isoformat()

        # Cria a consulta para o Elasticsearch para obter todos os produtos
        query = {
            "query": {
                "range": {
                    "timestamp": {
                        "gte": start_date
                    }
                }
            },
            "size": 1000,  # Limitar a 1000 resultados para não sobrecarregar
            "_source": ["price", "title", "free_shipping"]  # Usando campos em inglês
        }

        # Executa a consulta no Elasticsearch
        response = es_service.client.search(index="hp-traker-ml", body=query)

        # Categorias de disponibilidade
        availability_counts = {
            "Em Estoque": 0,
            "Frete Grátis": 0,
            "Promoção": 0,
            "Esgotado": 0
        }

        # Processar os produtos
        for hit in response["hits"]["hits"]:
            source = hit["_source"]

            # Verificar frete grátis
            if source.get("free_shipping") == True:
                availability_counts["Frete Grátis"] += 1
            else:
                availability_counts["Em Estoque"] += 1

            # Verificar se parece ser uma promoção pelo título
            title = source.get("title", "").lower()
            if "promoção" in title or "promocao" in title or "desconto" in title or "oferta" in title:
                availability_counts["Promoção"] += 1

            # Produtos sem preço ou com preço zero são considerados esgotados
            if source.get("price") is None or source.get("price") == 0:
                availability_counts["Esgotado"] += 1
                # Subtrair de Em Estoque se foi contabilizado lá
                if source.get("free_shipping") != True:
                    availability_counts["Em Estoque"] -= 1

        # Formatar para o resultado esperado
        stock_availability = [
            {"status": status, "count": count}
            for status, count in availability_counts.items()
            if count > 0  # Exclui status sem ocorrências
        ]

        # Ordenar por contagem (maior primeiro)
        stock_availability.sort(key=lambda x: x["count"], reverse=True)

        return stock_availability
    except Exception as e:
        logger.error(f"Erro ao buscar disponibilidade de estoque: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar disponibilidade de estoque: {str(e)}")

@router.get("/seller-performance")
async def get_seller_performance(
    period_days: int = Query(30, description="Período em dias para análise")
):
    """
    Retorna o desempenho dos principais vendedores
    """
    try:
        # Calcula a data de início do período
        start_date = (datetime.now() - timedelta(days=period_days)).isoformat()

        # Cria a consulta para o Elasticsearch
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
                        "field": "seller.keyword",  # Usando "seller" em vez de "vendedor"
                        "size": 10
                    },
                    "aggs": {
                        "avg_rating": {
                            "avg": {
                                "field": "rating"  # Usando "rating" em vez de "avaliacao"
                            }
                        },
                        "avg_price": {
                            "avg": {
                                "field": "price"  # Usando "price" em vez de "preco"
                            }
                        }
                    }
                }
            },
            "size": 0
        }

        # Executa a consulta no Elasticsearch
        response = es_service.client.search(index="hp-traker-ml", body=query)

        # Processa os resultados
        seller_performance = []
        for bucket in response["aggregations"]["sellers"]["buckets"]:
            # Estimar número de vendas baseado em popularidade (doc_count)
            estimated_sales = bucket["doc_count"] * 10  # Multiplicador arbitrário para ilustração

            seller_performance.append({
                "name": bucket["key"] or "Desconhecido",
                "reputation": round(bucket["avg_rating"]["value"] or 4.0, 1),  # Default para 4.0 se null
                "sales": estimated_sales,
                "products": bucket["doc_count"],
                "avgPrice": round(bucket["avg_price"]["value"] or 0, 2)
            })

        # Ordena por número de produtos (popularidade)
        seller_performance.sort(key=lambda x: x["products"], reverse=True)

        return seller_performance
    except Exception as e:
        logger.error(f"Erro ao buscar desempenho de vendedores: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar desempenho de vendedores: {str(e)}")
