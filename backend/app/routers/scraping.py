from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Any
import datetime
import logging

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.system_log import SystemLog, LogLevel, LogCategory
from app.models.settings import SystemSettings
# Import both the regular scraper and the enhanced scraper
try:
    from app.scrapers.mercado_livre import run_scraper
    from app.scrapers.enhanced_ml_scraper import run_enhanced_scraper
except Exception as e:
    logger = logging.getLogger(__name__)
    logger.error(f"Erro ao importar scrapers: {e}")
    # Definir funções stub para evitar erros
    async def run_scraper(db):
        logger.error("Scraper não está disponível. A função está sendo chamada, mas não será executada.")
        return {"error": "Scraper indisponível"}

    async def run_enhanced_scraper(db, search_terms=None):
        logger.error("Enhanced scraper não está disponível. A função está sendo chamada, mas não será executada.")
        return {"error": "Enhanced scraper indisponível"}

router = APIRouter()

logger = logging.getLogger(__name__)

# Endpoint original com autenticação
@router.post("/start-secure")
async def start_scraping_secure(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Inicia manualmente o processo de rastreamento.
    Apenas usuários autenticados podem executar.
    """
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão negada. Apenas administradores e gerentes podem iniciar o rastreamento manualmente."
        )

    # Registrar o início do rastreamento
    log = SystemLog(
        action="start_scraping",
        description=f"Rastreamento iniciado manualmente por {current_user.email}",
        user_id=current_user.id,
        ip_address="manual_trigger",
        level=LogLevel.MEDIUM,
        category=LogCategory.SYSTEM
    )
    db.add(log)

    # Atualizar a configuração de rastreamento
    scraping_config = db.query(SystemSettings).filter(SystemSettings.key == "scraping").first()

    if not scraping_config:
        # Criar configuração padrão se não existir
        scraping_config = SystemSettings(
            key="scraping",
            value_json={
                "interval": 6,
                "retryOnError": True,
                "maxRetries": 3,
                "lastRun": datetime.datetime.now().isoformat(),
                "isActive": True
            },
            description="Configurações de rastreamento"
        )
        db.add(scraping_config)
    else:
        # Atualizar configuração existente
        config_data = scraping_config.value_json or {}
        config_data["lastRun"] = datetime.datetime.now().isoformat()
        config_data["isActive"] = True
        scraping_config.value_json = config_data

    db.commit()

    # Iniciar rastreamento em background usando o scraper melhorado
    background_tasks.add_task(run_enhanced_scraper, db)

    return {
        "success": True,
        "message": "Rastreamento melhorado iniciado com sucesso em segundo plano",
        "timestamp": datetime.datetime.now().isoformat()
    }

# Novo endpoint sem autenticação (APENAS PARA DESENVOLVIMENTO)
@router.post("/start")
async def start_scraping(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Inicia manualmente o processo de rastreamento.
    ATENÇÃO: Endpoint sem autenticação (APENAS PARA DESENVOLVIMENTO)
    """
    logger.warning("Endpoint sem autenticação sendo usado para iniciar o scraping")

    # Registrar o início do rastreamento
    log = SystemLog(
        action="start_scraping",
        description=f"Rastreamento iniciado manualmente (modo desenvolvimento sem autenticação)",
        user_id=None,  # Sem usuário identificado
        ip_address="dev_mode",
        level=LogLevel.MEDIUM,
        category=LogCategory.SYSTEM
    )
    db.add(log)

    # Atualizar configuração de rastreamento
    scraping_config = db.query(SystemSettings).filter(SystemSettings.key == "scraping").first()
    if not scraping_config:
        # Criar configuração padrão
        scraping_config = SystemSettings(
            key="scraping",
            value_json={
                "interval": 6,
                "retryOnError": True,
                "maxRetries": 3,
                "lastRun": datetime.datetime.now().isoformat(),
                "isActive": True
            },
            description="Configurações de rastreamento"
        )
        db.add(scraping_config)
    else:
        # Atualizar configuração existente
        config_data = scraping_config.value_json or {}
        config_data["lastRun"] = datetime.datetime.now().isoformat()
        config_data["isActive"] = True
        scraping_config.value_json = config_data

    db.commit()

    # Iniciar rastreamento em background usando o scraper melhorado
    background_tasks.add_task(run_enhanced_scraper, db)

    return {
        "success": True,
        "message": "Rastreamento melhorado iniciado com sucesso em segundo plano (modo desenvolvimento)",
        "timestamp": datetime.datetime.now().isoformat()
    }

@router.get("/status")
async def get_scraping_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna o status atual do rastreamento.
    """
    scraping_config = db.query(SystemSettings).filter(SystemSettings.key == "scraping").first()

    if not scraping_config or not scraping_config.value_json:
        return {
            "isActive": False,
            "lastRun": None,
            "nextRun": None,
            "message": "Rastreamento não configurado"
        }

    config_data = scraping_config.value_json
    last_run = config_data.get("lastRun")
    interval = config_data.get("interval", 6)

    next_run = None
    if last_run:
        try:
            last_run_dt = datetime.datetime.fromisoformat(last_run)
            next_run_dt = last_run_dt + datetime.timedelta(hours=interval)
            next_run = next_run_dt.isoformat()
        except Exception as e:
            logger.error(f"Erro ao calcular próxima execução: {str(e)}")

    return {
        "isActive": config_data.get("isActive", False),
        "lastRun": last_run,
        "nextRun": next_run,
        "interval": interval,
        "message": "Rastreamento em execução" if config_data.get("isActive", False) else "Rastreamento inativo"
    }

@router.get("/search")
async def search_products(
    term: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Realiza uma busca de produtos no Mercado Livre
    """
    if not term:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O termo de busca é obrigatório"
        )

    # Registrar a busca nos logs do sistema
    log = SystemLog(
        action="product_search",
        description=f"Busca de produtos com termo: {term}",
        user_id=current_user.id,
        ip_address=None,
        level=LogLevel.LOW,
        category=LogCategory.SEARCH
    )
    db.add(log)
    db.commit()

    try:
        # Usar o novo scraper em vez do antigo
        import sys
        import os
        from urllib.parse import quote_plus
        import requests
        from bs4 import BeautifulSoup

        # Adicionar o diretório do novo scraper ao path
        new_scraper_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "test_new-scraper")
        if new_scraper_path not in sys.path:
            sys.path.append(new_scraper_path)

        # Importar funções do novo scraper
        try:
            from ml_scraper import request_soup, clean_text

            # Configurações do scraper
            HEADERS = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
                "Referer": "https://www.mercadolivre.com.br/"
            }

            # URL de busca
            SEARCH_URL = "https://lista.mercadolivre.com.br/{}"

            # Realizar a busca
            logger.info(f"Iniciando busca para: {term}")
            search_term = quote_plus(term)
            url = SEARCH_URL.format(search_term)
            logger.info(f"URL de busca: {url}")

            # Fazer a requisição HTTP
            resp = requests.get(url, headers=HEADERS, timeout=10)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")

            # Extrair os resultados com seletores múltiplos para garantir compatibilidade
            results = []

            # Método 1: Seletor padrão de item
            items = soup.select("li.ui-search-layout__item")
            if not items:
                # Método 2: Seletor alternativo
                items = soup.select("div.ui-search-result")
            if not items:
                # Método 3: Seletor mais genérico
                items = soup.select("div[class*='ui-search-result']")

            logger.info(f"Encontrados {len(items)} produtos com os seletores")

            # Processar os resultados
            for i, item in enumerate(items[:20]):  # Limitar a 20 resultados
                try:
                    product = {}

                    # Título (múltiplos seletores para resiliência)
                    title_element = item.select_one(".ui-search-item__title, .shops__item-title, h2")
                    product['title'] = clean_text(title_element)

                    # Link do produto
                    link_element = item.select_one("a.ui-search-link, a.ui-search-result__content, a[href*='/MLB']")
                    product['link'] = link_element["href"] if link_element and link_element.has_attr("href") else "#"

                    # Preço
                    price_element = item.select_one(".price-tag-amount, .ui-search-price__part, .andes-money-amount__fraction")
                    price_text = clean_text(price_element)
                    price_text = re.sub(r'[^\d,]', '', price_text).replace(',', '.')
                    try:
                        product['price'] = float(price_text) if price_text else 0.0
                    except:
                        product['price'] = 0.0

                    # Imagem
                    img_element = item.select_one("img.ui-search-result-image__element, img")
                    product['image'] = img_element["src"] if img_element and img_element.has_attr("src") else \
                                      img_element["data-src"] if img_element and img_element.has_attr("data-src") else ""

                    # Vendedor
                    seller_element = item.select_one(".ui-search-official-store-label, .ui-search-item__brand-discoverability")
                    product['seller'] = clean_text(seller_element) or "Vendedor não identificado"

                    # ID único para a interface
                    product['id'] = f"prod_{i}_{hash(product['link'])}"

                    # Adicionar à lista de resultados
                    results.append(product)
                except Exception as e:
                    logger.error(f"Erro ao processar produto: {str(e)}")
                    continue

            logger.info(f"Busca concluída. Processados {len(results)} produtos.")

            return {
                "success": True,
                "message": f"Busca realizada com sucesso para '{term}'",
                "results": results,
                "count": len(results)
            }

        except ImportError as e:
            logger.error(f"Erro ao importar novo scraper: {str(e)}")
            logger.info("Fazendo fallback para o scraper antigo")
            # Fallback para o scraper antigo caso o novo falhe
            from app.scrapers.mercado_livre import search_products_ml
            results = await search_products_ml(term)

            return {
                "success": True,
                "message": f"Busca realizada com sucesso para '{term}' (scraper antigo)",
                "results": results,
                "count": len(results)
            }

    except Exception as e:
        logger.error(f"Erro na busca de produtos: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar a busca: {str(e)}"
        )
