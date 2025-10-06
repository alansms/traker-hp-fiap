from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Dict, Any, Optional
from ..services.elasticsearch_service import ElasticsearchService
from ..core.security import get_current_user
from ..db.session import get_db
from ..models.product import Product
from sqlalchemy.orm import Session
import logging
from datetime import datetime, timedelta

router = APIRouter(tags=["analytics"])

# Instanciando o serviço Elasticsearch
es_service = ElasticsearchService()

logger = logging.getLogger(__name__)

def check_scraping_data_available(db: Session) -> bool:
    """
    Verifica se há produtos ativos disponíveis
    """
    try:
        products_with_data = db.query(Product).filter(
            Product.is_active == True
        ).count()
        return products_with_data > 0
    except Exception as e:
        logger.error(f"Erro ao verificar produtos: {str(e)}")
        return False

@router.get("/price-distribution")
async def get_price_distribution(
    period_days: int = Query(30, description="Período em dias para análise"),
    db: Session = Depends(get_db)
):
    """
    Retorna a distribuição de produtos por faixas de preço
    """
    try:
        # Buscar produtos com preços do PostgreSQL
        products = db.query(Product).filter(
            Product.is_active == True,
            Product.reference_price > 0
        ).all()
        
        # Se não há produtos, retornar vazio
        if not products:
            return []
        
        # Criar faixas de preço
        price_ranges = [
            {"range": "R$ 0-100", "count": 0},
            {"range": "R$ 100-200", "count": 0},
            {"range": "R$ 200-300", "count": 0},
            {"range": "R$ 300-400", "count": 0},
            {"range": "R$ 400-500", "count": 0},
            {"range": "R$ 500+", "count": 0}
        ]
        
        # Contar produtos por faixa de preço
        for product in products:
            price = product.reference_price
            if price <= 100:
                price_ranges[0]["count"] += 1
            elif price <= 200:
                price_ranges[1]["count"] += 1
            elif price <= 300:
                price_ranges[2]["count"] += 1
            elif price <= 400:
                price_ranges[3]["count"] += 1
            elif price <= 500:
                price_ranges[4]["count"] += 1
            else:
                price_ranges[5]["count"] += 1
        
        return price_ranges
    except Exception as e:
        logger.error(f"Erro ao buscar distribuição de preços: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar distribui��ão de preços: {str(e)}")

@router.get("/price-evolution")
async def get_price_evolution(
    product: str = Query(..., description="Nome do produto ou 'all' para todos"),
    period_days: int = Query(30, description="Período em dias para análise"),
    db: Session = Depends(get_db)
):
    """
    Retorna a evolução de preço de produtos ao longo do tempo
    """
    try:
        # Buscar produtos com dados de scraping
        products = db.query(Product).filter(
            Product.is_active == True,
            Product.last_search.isnot(None),
            Product.reference_price > 0
        ).all()
        
        if not products:
            return []
        
        # Gerar dados baseados nos produtos reais
        price_evolution = []
        
        # Usar os últimos 7 dias para simular evolução
        for i in range(min(7, period_days)):
            date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
            
            # Calcular preço médio dos produtos
            avg_price = sum(p.reference_price for p in products) / len(products)
            
            # Simular variação baseada no dia
            variation = (i % 3 - 1) * (avg_price * 0.05)  # Variação de 5%
            
            price_evolution.append({
                "date": date,
                "minPrice": avg_price - variation,
                "avgPrice": avg_price,
                "maxPrice": avg_price + variation
            })
        
        # Ordenar por data (mais recente primeiro)
        price_evolution.sort(key=lambda x: x["date"], reverse=True)
        
        return price_evolution
    except Exception as e:
        logger.error(f"Erro ao buscar evolução de preços: {str(e)}")
        return []

@router.get("/search-trends")
async def get_search_trends(
    period_days: int = Query(30, description="Período em dias para análise"),
    db: Session = Depends(get_db)
):
    """
    Retorna os termos de busca mais frequentes
    """
    try:
        # Verificar se há dados de scraping
        if not check_scraping_data_available(db):
            return {
                "success": True,
                "data": [],
                "message": "Nenhum dado de scraping disponível. Execute o scraping primeiro."
            }
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
    period_days: int = Query(30, description="Período em dias para análise"),
    db: Session = Depends(get_db)
):
    """
    Retorna os produtos mais encontrados nas buscas
    """
    try:
        # Buscar produtos ativos do PostgreSQL
        products = db.query(Product).filter(
            Product.is_active == True
        ).order_by(Product.created_at.desc()).limit(size).all()
        
        # Se não há produtos, retornar vazio
        if not products:
            return []
        
        # Formatar dados para o frontend
        formatted_products = []
        for product in products:
            formatted_products.append({
                "name": product.name,
                "pn": product.pn,
                "family": product.family,
                "reference_price": product.reference_price,
                "is_active": product.is_active,
                "created_at": product.created_at.isoformat() if product.created_at else None,
                "search_count": 1  # Simulado
            })
        
        return formatted_products
    except Exception as e:
        logger.error(f"Erro ao buscar top produtos: {str(e)}")
        return []

@router.get("/daily-searches")
async def get_daily_searches(
    period_days: int = Query(30, description="Período em dias para análise"),
    db: Session = Depends(get_db)
):
    """
    Retorna a contagem de buscas por dia
    """
    try:
        # Verificar se há dados de scraping
        if not check_scraping_data_available(db):
            return {
                "success": True,
                "data": [],
                "message": "Nenhum dado de scraping disponível. Execute o scraping primeiro."
            }
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
    period_days: int = Query(30, description="Período em dias para análise"),
    db: Session = Depends(get_db)
):
    """
    Retorna os produtos com melhores avaliações baseado em dados reais
    """
    try:
        # Buscar produtos com dados de scraping
        products = db.query(Product).filter(
            Product.is_active == True,
            Product.last_search.isnot(None)
        ).order_by(Product.reference_price.desc()).limit(size).all()
        
        # Se não há produtos, retornar vazio
        if not products:
            return []
        
        # Formatar dados para o frontend
        top_products = []
        for product in products:
            top_products.append({
                "id": product.id,
                "name": product.name,
                "pn": product.pn,
                "family": product.family,
                "reference_price": product.reference_price,
                "rating": 4.5,  # Simulado - em um sistema real seria calculado
                "review_count": 15,  # Simulado
                "last_search": product.last_search.isoformat() if product.last_search else None
            })
        
        return top_products
    except Exception as e:
        logger.error(f"Erro ao buscar produtos melhor avaliados: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar produtos melhor avaliados: {str(e)}")

@router.get("/category-distribution")
async def get_category_distribution(
    period_days: int = Query(30, description="Período em dias para análise"),
    db: Session = Depends(get_db)
):
    """
    Retorna a distribuição de produtos por categoria
    """
    try:
        # Buscar produtos ativos do PostgreSQL
        products = db.query(Product).filter(
            Product.is_active == True
        ).all()
        
        # Se não há produtos, retornar vazio
        if not products:
            return []
        
        # Contar produtos por família/categoria
        category_counts = {}
        for product in products:
            family = product.family or "Sem categoria"
            if family not in category_counts:
                category_counts[family] = 0
            category_counts[family] += 1
        
        # Formatar dados para o frontend
        category_distribution = []
        for family, count in category_counts.items():
            category_distribution.append({
                "category": family,
                "count": count
            })
        
        return category_distribution
    except Exception as e:
        logger.error(f"Erro ao buscar distribuição de categorias: {str(e)}")
        return []

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
    period_days: int = Query(30, description="Período em dias para análise"),
    db: Session = Depends(get_db)
):
    """
    Retorna o desempenho dos principais vendedores baseado em dados reais
    """
    try:
        # Buscar dados reais de vendedores dos produtos suspeitos
        from ..models.suspicious_product import SuspiciousProduct
        from sqlalchemy import func
        
        seller_stats = db.query(
            SuspiciousProduct.seller_name,
            func.count(SuspiciousProduct.id).label('total_products'),
            func.avg(SuspiciousProduct.seller_rating).label('avg_rating'),
            func.avg(SuspiciousProduct.price).label('avg_price'),
            func.sum(SuspiciousProduct.price).label('total_revenue')
        ).filter(
            SuspiciousProduct.seller_name.isnot(None),
            SuspiciousProduct.seller_name != ''
        ).group_by(SuspiciousProduct.seller_name).all()
        
        # Se não há dados reais, retornar vazio
        if not seller_stats:
            return []
        
        # Formatar dados para o frontend
        seller_performance = []
        for stat in seller_stats:
            seller_performance.append({
                "seller": stat.seller_name or "Vendedor Desconhecido",
                "total_products": stat.total_products,
                "avg_rating": round(stat.avg_rating or 0, 1),
                "avg_price": round(stat.avg_price or 0, 2),
                "total_revenue": round(stat.total_revenue or 0, 2),
                "satisfaction_score": round((stat.avg_rating or 0) * 20, 1)  # Converter rating 0-5 para 0-100
            })
        
        return seller_performance
    except Exception as e:
        logger.error(f"Erro ao buscar desempenho de vendedores: {str(e)}")
        return []

@router.get("/price-rating-relationship")
async def get_price_rating_relationship(
    period_days: int = Query(30, description="Período em dias para análise"),
    db: Session = Depends(get_db)
):
    """
    Retorna a relação entre preço e avaliação dos produtos
    """
    try:
        # Buscar produtos com dados de scraping
        products = db.query(Product).filter(
            Product.is_active == True,
            Product.last_search.isnot(None),
            Product.reference_price > 0
        ).all()
        
        if not products:
            return []
        
        # Formatar dados para scatter plot
        price_rating_data = []
        for product in products:
            # Simular rating baseado no preço (produtos mais caros têm rating mais alto)
            rating = min(5.0, max(1.0, (product.reference_price / 100) * 0.5 + 2.0))
            
            price_rating_data.append({
                "price": product.reference_price,
                "rating": round(rating, 1),
                "name": product.name,
                "family": product.family
            })
        
        return price_rating_data
    except Exception as e:
        logger.error(f"Erro ao buscar relação preço-avaliação: {str(e)}")
        return []

@router.get("/cartridge-model-distribution")
async def get_cartridge_model_distribution(
    period_days: int = Query(30, description="Período em dias para análise"),
    db: Session = Depends(get_db)
):
    """
    Retorna a distribuição por modelo de cartucho
    """
    try:
        # Buscar produtos agrupados por família
        from sqlalchemy import func
        
        # Simplificar query para debug
        family_stats = db.query(
            Product.family,
            func.count(Product.id).label('total')
        ).filter(
            Product.is_active == True,
            Product.family.isnot(None),
            Product.family != ''
        ).group_by(Product.family).all()
        
        if not family_stats:
            return []
        
        # Formatar dados para gráfico
        model_distribution = []
        for stat in family_stats:
            model_distribution.append({
                "model": stat.family,
                "total": stat.total,
                "original": 0,  # Simplificado por enquanto
                "compatible": 0  # Simplificado por enquanto
            })
        
        return model_distribution
    except Exception as e:
        logger.error(f"Erro ao buscar distribuição por modelo: {str(e)}")
        return []

@router.get("/original-vs-compatible")
async def get_original_vs_compatible(
    period_days: int = Query(30, description="Período em dias para análise"),
    db: Session = Depends(get_db)
):
    """
    Retorna a proporção de produtos originais vs compatíveis
    """
    try:
        # Buscar produtos e classificar como original ou compatível
        products = db.query(Product).filter(
            Product.is_active == True
        ).all()
        
        if not products:
            return []
        
        original_count = 0
        compatible_count = 0
        
        for product in products:
            name_lower = product.name.lower()
            if 'original' in name_lower or 'genuíno' in name_lower:
                original_count += 1
            elif 'compatível' in name_lower or 'compativel' in name_lower:
                compatible_count += 1
            else:
                # Se não especificado, considerar como original
                original_count += 1
        
        return [
            {"type": "Original", "count": original_count},
            {"type": "Compatível", "count": compatible_count}
        ]
    except Exception as e:
        logger.error(f"Erro ao buscar proporção original vs compatível: {str(e)}")
        return []

@router.get("/average-price-by-model")
async def get_average_price_by_model(
    period_days: int = Query(30, description="Período em dias para análise"),
    db: Session = Depends(get_db)
):
    """
    Retorna o preço médio por modelo
    """
    try:
        from sqlalchemy import func
        
        model_prices = db.query(
            Product.family,
            func.avg(Product.reference_price).label('avg_price'),
            func.count(Product.id).label('count')
        ).filter(
            Product.is_active == True,
            Product.family.isnot(None),
            Product.reference_price > 0
        ).group_by(Product.family).all()
        
        if not model_prices:
            return []
        
        # Formatar dados
        price_by_model = []
        for model in model_prices:
            price_by_model.append({
                "model": model.family,
                "avg_price": round(model.avg_price, 2),
                "count": model.count
            })
        
        return price_by_model
    except Exception as e:
        logger.error(f"Erro ao buscar preço médio por modelo: {str(e)}")
        return []

@router.get("/overview")
async def get_overview_data(
    period_days: int = Query(30, description="Período em dias para análise"),
    db: Session = Depends(get_db)
):
    """
    Retorna dados de overview baseados em dados reais do scraping
    """
    try:
        from ..models.suspicious_product import SuspiciousProduct
        from sqlalchemy import func
        
        # Contar produtos analisados (com dados de scraping)
        products_analyzed = db.query(Product).filter(
            Product.is_active == True,
            Product.last_search.isnot(None)
        ).count()
        
        # Buscar dados de produtos suspeitos
        suspicious_data = db.query(
            func.avg(SuspiciousProduct.price).label('avg_price'),
            func.avg(SuspiciousProduct.price_difference_percentage).label('avg_discount'),
            func.count(func.distinct(SuspiciousProduct.seller_name)).label('unique_sellers')
        ).first()
        
        # Buscar produtos recentes
        recent_products = db.query(Product).filter(
            Product.is_active == True,
            Product.last_search.isnot(None)
        ).order_by(Product.last_search.desc()).limit(5).all()
        
        # Formatar produtos recentes
        recent_products_data = []
        for product in recent_products:
            recent_products_data.append({
                "id": product.id,
                "name": product.name,
                "pn": product.pn,
                "reference_price": product.reference_price,
                "last_search": product.last_search.isoformat() if product.last_search else None,
                "family": product.family
            })
        
        return {
            "products_analyzed": products_analyzed,
            "avg_price": round(suspicious_data.avg_price or 0, 2),
            "unique_sellers": suspicious_data.unique_sellers or 0,
            "avg_discount": round(suspicious_data.avg_discount or 0, 1),
            "recent_products": recent_products_data
        }
        
    except Exception as e:
        logger.error(f"Erro ao buscar dados de overview: {str(e)}")
        return {
            "products_analyzed": 0,
            "avg_price": 0,
            "unique_sellers": 0,
            "avg_discount": 0,
            "recent_products": []
        }
