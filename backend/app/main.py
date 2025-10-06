import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import engine, Base, SessionLocal
from app.db.init_db import init_db
from app.routers import auth, chat, openai, scraping, users, settings as settings_router, logs, logs_simple, logs_test, logs_basic, dashboard, products, analytics, data_analysis_ai, products_import, dashboard_postgres, suspicious_config, intelligent_scraping, data_cleanup, scraping_control, alerts, alerts_simple, alerts_basic, alerts_test, alerts_debug, email_test, email_simple
from app.middlewares.logging import LoggingMiddleware
from app.middlewares.debug import log_request_details  # Importando o middleware de depuração

# Criar tabelas no banco de dados
Base.metadata.create_all(bind=engine)

# Inicializar o banco de dados com dados padrão (incluindo usuário admin)
db = SessionLocal()
try:
    init_db(db)
finally:
    db.close()

app = FastAPI(
    title="Mercado Livre Tracker API",
    description="API para rastreamento de preços e análise de reputação de produtos no Mercado Livre",
    version="1.0.0"
)

# Configuração CORS corrigida para resolver o erro de credenciais com wildcard
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:3001",  # Origem do frontend que está causando o erro
    "http://127.0.0.1",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Usando a lista específica de origens
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Adicionar middleware de logging
app.add_middleware(LoggingMiddleware)

# Adicionar middleware de depuração para inspecionar requisições
@app.middleware("http")
async def debug_request(request: Request, call_next):
    await log_request_details(request)
    response = await call_next(request)
    return response

# Incluir routers
app.include_router(auth.router, prefix="/api/auth", tags=["Autenticação"])
app.include_router(chat.router, prefix="/api/chat", tags=["Assistente Virtual"])
app.include_router(openai.router, prefix="/api/openai", tags=["OpenAI"])
app.include_router(scraping.router, prefix="/api/scraping", tags=["Scraping"])
app.include_router(users.router, prefix="/api/users", tags=["Usuários"])
app.include_router(settings_router.router, prefix="/api/settings", tags=["Configurações"])
app.include_router(logs.router, prefix="/api/logs", tags=["Logs do Sistema"])
app.include_router(logs_simple.router, prefix="/api/logs-simple", tags=["Logs Simples"])
app.include_router(logs_test.router, prefix="/api/logs-test", tags=["Logs Teste"])
app.include_router(logs_basic.router, prefix="/api/logs-basic", tags=["Logs Básico"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(dashboard_postgres.router, prefix="/api/dashboard-postgres", tags=["Dashboard PostgreSQL"])
app.include_router(products.router, prefix="/api/products", tags=["Produtos"])
app.include_router(products_import.router, prefix="/api/products", tags=["Importação de Produtos"])  # Novo router de importação
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])  # Adicionando a rota de analytics
app.include_router(data_analysis_ai.router, prefix="/api/ai", tags=["Análise de Dados com IA"])
app.include_router(suspicious_config.router, prefix="/api/suspicious", tags=["Configuração de Suspeitos"])
app.include_router(intelligent_scraping.router, prefix="/api/scraping", tags=["Scraping Inteligente"])
app.include_router(data_cleanup.router, prefix="/api/cleanup", tags=["Limpeza de Dados"])
app.include_router(scraping_control.router, prefix="/api/scraping-control", tags=["Controle de Scraping"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alertas"])
app.include_router(alerts_simple.router, prefix="/api/alerts-simple", tags=["Alertas Simples"])
app.include_router(alerts_basic.router, prefix="/api/alerts-basic", tags=["Alertas Básico"])
app.include_router(alerts_test.router, prefix="/api/alerts-test", tags=["Alertas Teste"])
app.include_router(alerts_debug.router, prefix="/api/alerts-debug", tags=["Alertas Debug"])
app.include_router(email_test.router, prefix="/api/email", tags=["Teste de Email"])
app.include_router(email_simple.router, prefix="/api/email-simple", tags=["Email Simples"])

# Rota pública para busca de produtos (sem autenticação)
@app.get("/api/scraping/search-public", tags=["Scraping Público"])
async def search_products_public(query: str):
    """
    Endpoint público para busca de produtos no Mercado Livre
    """
    try:
        from app.scrapers.scraper_updated import MercadoLivreScraper
        from app.schemas.product import ProductSearch

        # Log para depuração
        print(f"Pesquisando por: {query}")

        scraper = MercadoLivreScraper()
        products = scraper.search_products(query)

        # Converte os resultados para o formato esperado pelo frontend
        from typing import List
        formatted_products: List[ProductSearch] = []

        for product in products:
            try:
                formatted_product = ProductSearch(
                    id=str(product['id']),
                    title=product['titulo'],
                    price=float(product['preco']),
                    link=product['link'],
                    rating=float(product['avaliacao']) if product.get('avaliacao') else None,
                    review_count=int(product['num_avaliacoes']) if product.get('num_avaliacoes') else 0,
                    reviews=product.get('comentarios', [])
                )
                formatted_products.append(formatted_product)
            except Exception as e:
                print(f"Erro ao formatar produto: {str(e)}")
                continue

        print(f"Encontrados {len(formatted_products)} produtos")

        # Converter para dicionários para visualizar o formato exato da resposta
        import json
        response_data = [product.dict() for product in formatted_products]
        print(f"Resposta enviada ao frontend: {json.dumps(response_data[:2], ensure_ascii=False)}")

        return formatted_products
    except Exception as e:
        print(f"Erro na busca pública: {str(e)}")
        return {"error": str(e)}

# Endpoint direto para depuração
@app.get("/api/scraping/search-direct")
async def search_products_direct(query: str):
    """
    Endpoint direto para depuração de busca de produtos
    """
    try:
        from app.scrapers.scraper_updated import MercadoLivreScraper
        scraper = MercadoLivreScraper()
        products = scraper.search_products(query)
        return {"query": query, "results": products}
    except Exception as e:
        return {"error": str(e)}

# Rota pública para produtos recentes (sem autenticação)
@app.get("/api/products/recent-public")
async def get_recent_products_public(limit: int = 5):
    """
    Endpoint público para obter os produtos mais recentemente atualizados.
    Este endpoint é usado na página de análise de dados.
    """
    try:
        from app.models.product import Product
        from app.db.session import SessionLocal
        import json

        db = SessionLocal()
        try:
            # Buscar os produtos mais recentes pelo timestamp
            products = db.query(Product)\
                .filter(Product.is_active == True)\
                .order_by(Product.last_search.desc().nullslast())\
                .limit(limit)\
                .all()

            result = [
                {
                    "id": product.id,
                    "name": product.name,
                    "pn": product.pn,
                    "search_terms": product.search_terms,
                    "reference_price": product.reference_price,
                    "last_search": product.last_search.isoformat() if product.last_search else None,
                    "is_active": product.is_active,
                    "family": product.family,
                    "seller": "Mercado Livre"  # Valor padrão para o vendedor
                }
                for product in products
            ]
            return result
        finally:
            db.close()
    except Exception as e:
        print(f"Erro ao buscar produtos recentes: {str(e)}")
        return []

@app.get("/")
async def root():
    return {
        "message": "Bem-vindo à API do Mercado Livre Tracker",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
