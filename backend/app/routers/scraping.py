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
from app.scrapers.mercado_livre import run_scraper
from app.scrapers.enhanced_ml_scraper import run_enhanced_scraper

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
        # Chamar o scraper para realizar a busca em tempo real
        from app.scrapers.mercado_livre import search_products_ml
        results = await search_products_ml(term)

        return {
            "success": True,
            "message": f"Busca realizada com sucesso para '{term}'",
            "results": results,
            "count": len(results)
        }
    except Exception as e:
        logger.error(f"Erro na busca de produtos: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar a busca: {str(e)}"
        )
