from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..db.session import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..models.suspicious_product import SuspiciousProduct
from ..models.product import Product
from pydantic import BaseModel
from datetime import datetime
import logging

router = APIRouter(tags=["data-cleanup"])
logger = logging.getLogger(__name__)

class CleanupResult(BaseModel):
    success: bool
    message: str
    tables_cleaned: list
    records_deleted: int

@router.post("/clear-scraping-data", response_model=CleanupResult)
async def clear_scraping_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Limpa todos os dados de scraping e produtos suspeitos
    """
    if current_user.role not in ["admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem limpar dados de scraping"
        )
    
    try:
        logger.info(f"Usuário {current_user.email} iniciou limpeza de dados de scraping")
        
        # Contar registros antes da limpeza
        suspicious_count = db.query(SuspiciousProduct).count()
        
        # Limpar tabela de produtos suspeitos
        db.query(SuspiciousProduct).delete()
        
        # Resetar timestamps de última busca dos produtos
        db.execute(text("""
            UPDATE products 
            SET last_search = NULL 
            WHERE last_search IS NOT NULL
        """))
        
        # Commit das alterações
        db.commit()
        
        logger.info(f"Limpeza concluída: {suspicious_count} produtos suspeitos removidos")
        
        return {
            "success": True,
            "message": f"Base de dados de scraping limpa com sucesso. {suspicious_count} registros removidos.",
            "tables_cleaned": ["suspicious_products", "products_last_search"],
            "records_deleted": suspicious_count
        }
        
    except Exception as e:
        logger.error(f"Erro ao limpar dados de scraping: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao limpar dados: {str(e)}"
        )

@router.post("/clear-all-data", response_model=CleanupResult)
async def clear_all_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Limpa TODOS os dados do sistema (CUIDADO!)
    """
    if current_user.role not in ["admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem limpar todos os dados"
        )
    
    try:
        logger.warning(f"Usuário {current_user.email} iniciou limpeza COMPLETA do sistema")
        
        # Contar registros antes da limpeza
        suspicious_count = db.query(SuspiciousProduct).count()
        products_count = db.query(Product).count()
        
        # Limpar todas as tabelas relacionadas ao scraping
        db.query(SuspiciousProduct).delete()
        db.query(Product).delete()
        
        # Resetar sequências (PostgreSQL)
        db.execute(text("ALTER SEQUENCE products_id_seq RESTART WITH 1"))
        db.execute(text("ALTER SEQUENCE suspicious_products_id_seq RESTART WITH 1"))
        
        # Commit das alterações
        db.commit()
        
        logger.warning(f"Limpeza COMPLETA concluída: {suspicious_count} suspeitos + {products_count} produtos removidos")
        
        return {
            "success": True,
            "message": f"TODOS os dados foram limpos. {suspicious_count + products_count} registros removidos.",
            "tables_cleaned": ["suspicious_products", "products"],
            "records_deleted": suspicious_count + products_count
        }
        
    except Exception as e:
        logger.error(f"Erro ao limpar todos os dados: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao limpar dados: {str(e)}"
        )

@router.get("/data-stats")
async def get_data_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtém estatísticas dos dados do sistema
    """
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores e gerentes podem visualizar estatísticas"
        )
    
    try:
        # Contar registros
        total_products = db.query(Product).count()
        active_products = db.query(Product).filter(Product.is_active == True).count()
        total_suspicious = db.query(SuspiciousProduct).count()
        unverified_suspicious = db.query(SuspiciousProduct).filter(
            SuspiciousProduct.is_verified == False,
            SuspiciousProduct.is_false_positive == False
        ).count()
        
        # Produtos com última busca
        products_with_search = db.execute(text("""
            SELECT COUNT(*) FROM products WHERE last_search IS NOT NULL
        """)).scalar()
        
        return {
            "success": True,
            "data": {
                "total_products": total_products,
                "active_products": active_products,
                "products_with_search": products_with_search,
                "total_suspicious": total_suspicious,
                "unverified_suspicious": unverified_suspicious,
                "last_updated": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Erro ao obter estatísticas: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter estatísticas: {str(e)}"
        )

@router.post("/reset-product-search-timestamps")
async def reset_product_search_timestamps(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Reseta apenas os timestamps de última busca dos produtos
    """
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores e gerentes podem resetar timestamps"
        )
    
    try:
        # Resetar timestamps de última busca
        result = db.execute(text("""
            UPDATE products 
            SET last_search = NULL 
            WHERE last_search IS NOT NULL
        """))
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Timestamps de busca resetados. {result.rowcount} produtos atualizados.",
            "records_updated": result.rowcount
        }
        
    except Exception as e:
        logger.error(f"Erro ao resetar timestamps: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao resetar timestamps: {str(e)}"
        )
