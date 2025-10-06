from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from ..db.session import get_db
from ..models.suspicious_product import SuspiciousProduct
from ..core.security import get_current_user
from ..models.user import User
from ..services.intelligent_scraper import IntelligentScraper
from pydantic import BaseModel
from datetime import datetime
import logging

router = APIRouter(tags=["intelligent-scraping"])
logger = logging.getLogger(__name__)

# Schemas
class SuspiciousProductResponse(BaseModel):
    id: int
    product_id: int
    title: str
    price: float
    reference_price: float
    price_difference: float
    price_difference_percentage: float
    seller_name: Optional[str]
    seller_id: Optional[str]
    seller_rating: Optional[float]
    product_url: Optional[str]
    image_url: Optional[str]
    suspicion_level: str
    is_verified: bool
    is_false_positive: bool
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class ScrapingResult(BaseModel):
    success: bool
    message: str
    products_analyzed: int
    suspicious_found: int

class VerificationRequest(BaseModel):
    is_verified: bool
    notes: Optional[str] = ""

# Endpoints
@router.post("/run-scraping", response_model=ScrapingResult)
async def run_intelligent_scraping(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """Executa o scraping inteligente em background"""
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores e gerentes podem executar o scraping"
        )
    
    try:
        scraper = IntelligentScraper()
        
        # Executar em background para não bloquear a resposta
        background_tasks.add_task(scraper.run_intelligent_scraping)
        
        return {
            "success": True,
            "message": "Scraping inteligente iniciado em background",
            "products_analyzed": 0,
            "suspicious_found": 0
        }
        
    except Exception as e:
        logger.error(f"Erro ao iniciar scraping: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao iniciar scraping: {str(e)}"
        )

@router.get("/suspicious-products", response_model=List[SuspiciousProductResponse])
async def get_suspicious_products(
    limit: int = 50,
    suspicion_level: Optional[str] = None,
    is_verified: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista produtos suspeitos encontrados"""
    if current_user.role not in ["admin", "manager", "analyst"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas usuários autorizados podem visualizar produtos suspeitos"
        )
    
    try:
        query = db.query(SuspiciousProduct).filter(
            SuspiciousProduct.is_false_positive == False
        )
        
        if suspicion_level:
            query = query.filter(SuspiciousProduct.suspicion_level == suspicion_level)
        
        if is_verified is not None:
            query = query.filter(SuspiciousProduct.is_verified == is_verified)
        
        suspicious_products = query.order_by(
            SuspiciousProduct.created_at.desc()
        ).limit(limit).all()
        
        return suspicious_products
        
    except Exception as e:
        logger.error(f"Erro ao buscar produtos suspeitos: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar produtos suspeitos: {str(e)}"
        )

@router.put("/suspicious-products/{product_id}/verify")
async def verify_suspicious_product(
    product_id: int,
    verification: VerificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Verifica manualmente um produto suspeito"""
    if current_user.role not in ["admin", "manager", "analyst"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas usuários autorizados podem verificar produtos suspeitos"
        )
    
    try:
        suspicious = db.query(SuspiciousProduct).filter(
            SuspiciousProduct.id == product_id
        ).first()
        
        if not suspicious:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Produto suspeito não encontrado"
            )
        
        suspicious.is_verified = verification.is_verified
        suspicious.notes = verification.notes
        suspicious.updated_at = datetime.now()
        
        db.commit()
        
        return {
            "success": True,
            "message": "Produto suspeito verificado com sucesso"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao verificar produto suspeito: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao verificar produto: {str(e)}"
        )

@router.put("/suspicious-products/{product_id}/false-positive")
async def mark_as_false_positive(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Marca um produto suspeito como falso positivo"""
    if current_user.role not in ["admin", "manager", "analyst"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas usuários autorizados podem marcar como falso positivo"
        )
    
    try:
        suspicious = db.query(SuspiciousProduct).filter(
            SuspiciousProduct.id == product_id
        ).first()
        
        if not suspicious:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Produto suspeito não encontrado"
            )
        
        suspicious.is_false_positive = True
        suspicious.updated_at = datetime.now()
        
        db.commit()
        
        return {
            "success": True,
            "message": "Produto marcado como falso positivo"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao marcar como falso positivo: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao marcar como falso positivo: {str(e)}"
        )

@router.get("/scraping-status")
async def get_scraping_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtém status do scraping e estatísticas"""
    if current_user.role not in ["admin", "manager", "analyst"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas usuários autorizados podem visualizar status"
        )
    
    try:
        # Estatísticas gerais
        total_suspicious = db.query(SuspiciousProduct).count()
        unverified_suspicious = db.query(SuspiciousProduct).filter(
            SuspiciousProduct.is_verified == False,
            SuspiciousProduct.is_false_positive == False
        ).count()
        
        critical_suspicious = db.query(SuspiciousProduct).filter(
            SuspiciousProduct.suspicion_level == "CRITICAL",
            SuspiciousProduct.is_false_positive == False
        ).count()
        
        high_suspicious = db.query(SuspiciousProduct).filter(
            SuspiciousProduct.suspicion_level == "HIGH",
            SuspiciousProduct.is_false_positive == False
        ).count()
        
        # Produtos mais recentes
        recent_suspicious = db.query(SuspiciousProduct).filter(
            SuspiciousProduct.is_false_positive == False
        ).order_by(
            SuspiciousProduct.created_at.desc()
        ).limit(5).all()
        
        return {
            "success": True,
            "data": {
                "total_suspicious": total_suspicious,
                "unverified_suspicious": unverified_suspicious,
                "critical_suspicious": critical_suspicious,
                "high_suspicious": high_suspicious,
                "recent_suspicious": [
                    {
                        "id": p.id,
                        "title": p.title,
                        "price": p.price,
                        "suspicion_level": p.suspicion_level,
                        "created_at": p.created_at.isoformat()
                    } for p in recent_suspicious
                ]
            }
        }
        
    except Exception as e:
        logger.error(f"Erro ao obter status do scraping: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter status: {str(e)}"
        )
