from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..db.session import get_db
from ..models.suspicious_threshold import SuspiciousThreshold
from ..models.trusted_seller import TrustedSeller
from ..core.security import get_current_user
from ..models.user import User
from pydantic import BaseModel
from datetime import datetime
import logging

router = APIRouter(tags=["suspicious-config"])
logger = logging.getLogger(__name__)

# Schemas
class SuspiciousThresholdCreate(BaseModel):
    name: str
    threshold_percentage: float
    description: Optional[str] = None
    is_active: bool = True

class SuspiciousThresholdUpdate(BaseModel):
    name: Optional[str] = None
    threshold_percentage: Optional[float] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class SuspiciousThresholdResponse(BaseModel):
    id: int
    name: str
    threshold_percentage: float
    description: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class TrustedSellerCreate(BaseModel):
    name: str
    store_name: Optional[str] = None
    seller_id: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    rating: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool = True

class TrustedSellerUpdate(BaseModel):
    name: Optional[str] = None
    store_name: Optional[str] = None
    seller_id: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    rating: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None

class TrustedSellerResponse(BaseModel):
    id: int
    name: str
    store_name: Optional[str]
    seller_id: str
    email: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    rating: Optional[str]
    is_active: bool
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

# Endpoints para Suspicious Threshold
@router.get("/thresholds", response_model=List[SuspiciousThresholdResponse])
async def get_thresholds(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista todas as configurações de margem de suspeita"""
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores e gerentes podem acessar esta funcionalidade"
        )
    
    thresholds = db.query(SuspiciousThreshold).all()
    return thresholds

@router.post("/thresholds", response_model=SuspiciousThresholdResponse)
async def create_threshold(
    threshold_data: SuspiciousThresholdCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cria uma nova configuração de margem de suspeita"""
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores e gerentes podem criar configurações"
        )
    
    # Verificar se já existe uma configuração com o mesmo nome
    existing = db.query(SuspiciousThreshold).filter(
        SuspiciousThreshold.name == threshold_data.name
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe uma configuração com este nome"
        )
    
    threshold = SuspiciousThreshold(
        name=threshold_data.name,
        threshold_percentage=threshold_data.threshold_percentage,
        description=threshold_data.description,
        is_active=threshold_data.is_active
    )
    
    db.add(threshold)
    db.commit()
    db.refresh(threshold)
    
    return threshold

@router.put("/thresholds/{threshold_id}", response_model=SuspiciousThresholdResponse)
async def update_threshold(
    threshold_id: int,
    threshold_data: SuspiciousThresholdUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualiza uma configuração de margem de suspeita"""
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores e gerentes podem atualizar configurações"
        )
    
    threshold = db.query(SuspiciousThreshold).filter(
        SuspiciousThreshold.id == threshold_id
    ).first()
    
    if not threshold:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuração não encontrada"
        )
    
    # Atualizar apenas os campos fornecidos
    update_data = threshold_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(threshold, field, value)
    
    threshold.updated_at = datetime.now()
    db.commit()
    db.refresh(threshold)
    
    return threshold

@router.delete("/thresholds/{threshold_id}")
async def delete_threshold(
    threshold_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove uma configuração de margem de suspeita"""
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores e gerentes podem remover configurações"
        )
    
    threshold = db.query(SuspiciousThreshold).filter(
        SuspiciousThreshold.id == threshold_id
    ).first()
    
    if not threshold:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuração não encontrada"
        )
    
    db.delete(threshold)
    db.commit()
    
    return {"message": "Configuração removida com sucesso"}

# Endpoints para Trusted Sellers
@router.get("/trusted-sellers", response_model=List[TrustedSellerResponse])
async def get_trusted_sellers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista todos os vendedores de confiança"""
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores e gerentes podem acessar esta funcionalidade"
        )
    
    sellers = db.query(TrustedSeller).all()
    return sellers

@router.post("/trusted-sellers", response_model=TrustedSellerResponse)
async def create_trusted_seller(
    seller_data: TrustedSellerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Adiciona um novo vendedor de confiança"""
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores e gerentes podem adicionar vendedores"
        )
    
    # Verificar se já existe um vendedor com o mesmo seller_id
    existing = db.query(TrustedSeller).filter(
        TrustedSeller.seller_id == seller_data.seller_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe um vendedor com este ID"
        )
    
    seller = TrustedSeller(
        name=seller_data.name,
        store_name=seller_data.store_name,
        seller_id=seller_data.seller_id,
        email=seller_data.email,
        phone=seller_data.phone,
        address=seller_data.address,
        rating=seller_data.rating,
        notes=seller_data.notes,
        is_active=seller_data.is_active
    )
    
    db.add(seller)
    db.commit()
    db.refresh(seller)
    
    return seller

@router.put("/trusted-sellers/{seller_id}", response_model=TrustedSellerResponse)
async def update_trusted_seller(
    seller_id: int,
    seller_data: TrustedSellerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualiza um vendedor de confiança"""
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores e gerentes podem atualizar vendedores"
        )
    
    seller = db.query(TrustedSeller).filter(
        TrustedSeller.id == seller_id
    ).first()
    
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendedor não encontrado"
        )
    
    # Atualizar apenas os campos fornecidos
    update_data = seller_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(seller, field, value)
    
    seller.updated_at = datetime.now()
    db.commit()
    db.refresh(seller)
    
    return seller

@router.delete("/trusted-sellers/{seller_id}")
async def delete_trusted_seller(
    seller_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove um vendedor de confiança"""
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores e gerentes podem remover vendedores"
        )
    
    seller = db.query(TrustedSeller).filter(
        TrustedSeller.id == seller_id
    ).first()
    
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendedor não encontrado"
        )
    
    db.delete(seller)
    db.commit()
    
    return {"message": "Vendedor removido com sucesso"}

@router.get("/active-threshold")
async def get_active_threshold(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retorna a configuração de margem ativa"""
    threshold = db.query(SuspiciousThreshold).filter(
        SuspiciousThreshold.is_active == True
    ).first()
    
    if not threshold:
        return {
            "success": False,
            "message": "Nenhuma configuração de margem ativa encontrada"
        }
    
    return {
        "success": True,
        "data": {
            "id": threshold.id,
            "name": threshold.name,
            "threshold_percentage": threshold.threshold_percentage,
            "description": threshold.description
        }
    }
