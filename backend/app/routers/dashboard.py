from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any, Optional
from ..services.elasticsearch_service import ElasticsearchService
from ..services.openai_service import OpenAIService
from ..core.security import get_current_user
import logging
from datetime import datetime, timedelta

router = APIRouter(tags=["dashboard"])

# Instanciando os serviços
es_service = ElasticsearchService()
openai_service = OpenAIService()

logger = logging.getLogger(__name__)

@router.get("/top-products")
async def get_top_products(
    size: int = Query(10, description="Número de produtos a retornar"),
    period_days: int = Query(30, description="Período em dias para análise")
):
    """
    Retorna os produtos mais encontrados nas buscas
    """
    try:
        products = es_service.get_top_products(size, period_days)
        return {
            "success": True,
            "data": products,
            "message": f"Top {len(products)} produtos encontrados"
        }
    except Exception as e:
        logger.error(f"Erro ao buscar top produtos: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar produtos: {str(e)}")

@router.get("/price-evolution")
async def get_price_evolution(
    product: str = Query(..., description="Nome do produto para análise"),
    period_days: int = Query(30, description="Período em dias para análise")
):
    """
    Retorna a evolução de preço de um produto específico
    """
    try:
        price_data = es_service.get_price_evolution(product, period_days)
        return {
            "success": True,
            "data": price_data,
            "message": f"Evolução de preço para '{product}' nos últimos {period_days} dias"
        }
    except Exception as e:
        logger.error(f"Erro ao buscar evolução de preço: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar evolução de preço: {str(e)}")

@router.get("/search-trends")
async def get_search_trends(
    period_days: int = Query(30, description="Período em dias para análise")
):
    """
    Retorna os termos mais buscados
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
                        "field": "busca.keyword",
                        "size": 10
                    }
                }
            },
            "size": 0  # Não precisamos dos documentos, apenas das agregações
        }

        # Executa a consulta no Elasticsearch
        response = es_service.client.search(index="hp-traker-ml", body=query)

        # Processa os resultados - Formato que o frontend espera: {termo: string, buscas: number}
        search_trends = []
        for bucket in response["aggregations"]["search_terms"]["buckets"]:
            search_trends.append({
                "termo": bucket["key"],  # Mudando de "term" para "termo"
                "buscas": bucket["doc_count"]  # Mudando de "count" para "buscas"
            })

        return {
            "success": True,
            "data": search_trends,
            "message": f"{len(search_trends)} termos de busca encontrados"
        }
    except Exception as e:
        logger.error(f"Erro ao buscar tendências de busca: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar tendências de busca: {str(e)}")

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

        # Processa os resultados - Formato que o frontend espera: {data: string, buscas: number}
        daily_searches = []
        for bucket in response["aggregations"]["searches_per_day"]["buckets"]:
            # Formata a data como YYYY-MM-DD
            date_str = datetime.fromtimestamp(bucket["key"] / 1000).strftime('%Y-%m-%d')

            daily_searches.append({
                "data": date_str,  # Mudando de "date" para "data"
                "buscas": bucket["doc_count"]  # Mudando de "count" para "buscas"
            })

        return {
            "success": True,
            "data": daily_searches,
            "message": f"Dados de buscas diárias para os últimos {period_days} dias"
        }
    except Exception as e:
        logger.error(f"Erro ao buscar buscas diárias: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar buscas diárias: {str(e)}")

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
                        "field": "preco",
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

        # Processa os resultados - Formato que o frontend espera: {faixa_preco: string, quantidade: number}
        price_distribution = []
        for bucket in response["aggregations"]["price_ranges"]["buckets"]:
            range_label = "R$ 0-100" if bucket["key"] == "*-100.0" else \
                         f"R$ {int(float(bucket['from']))}-{int(float(bucket['to']))}" if "from" in bucket and "to" in bucket else \
                         f"R$ {int(float(bucket['from']))}+" if "from" in bucket else \
                         "Sem preço"

            price_distribution.append({
                "faixa_preco": range_label,  # Mudando de "range" para "faixa_preco"
                "quantidade": bucket["doc_count"]  # Mudando de "count" para "quantidade"
            })

        return {
            "success": True,
            "data": price_distribution,
            "message": f"Distribuição de preços em {len(price_distribution)} faixas"
        }
    except Exception as e:
        logger.error(f"Erro ao buscar distribuição de preços: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar distribuição de preços: {str(e)}")

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
                    "avaliacao": {
                        "order": "desc"
                    }
                }
            ],
            "size": size
        }

        # Executa a consulta no Elasticsearch
        response = es_service.client.search(index="hp-traker-ml", body=query)

        # Processa os resultados - Formato que o frontend espera: {produto: string, avaliacao_media: number, num_avaliacoes: number, preco_medio: number}
        top_rated = []
        for hit in response["hits"]["hits"]:
            product = hit["_source"]
            top_rated.append({
                "produto": product.get("titulo", "Sem título"),  # Mudando de "titulo" para "produto"
                "avaliacao_media": product.get("avaliacao", 0),  # Mudando de "avaliacao" para "avaliacao_media"
                "num_avaliacoes": 1,  # Valor padrão pois não temos esse dado específico no Elasticsearch
                "preco_medio": product.get("preco", 0)  # Mudando de "preco" para "preco_medio"
            })

        return {
            "success": True,
            "data": top_rated,
            "message": f"Top {len(top_rated)} produtos melhor avaliados"
        }
    except Exception as e:
        logger.error(f"Erro ao buscar produtos melhor avaliados: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar produtos melhor avaliados: {str(e)}")
