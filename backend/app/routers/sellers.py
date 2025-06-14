from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.seller import Seller
from app.models.system_log import SystemLog, LogLevel, LogCategory

router = APIRouter()

# Endpoint público para listar vendedores (sem autenticação)
@router.get("/", response_model=List[Dict[str, Any]])
async def list_sellers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Lista todos os vendedores cadastrados.
    Este endpoint é público para ser usado na página de análise de dados.
    """
    sellers = db.query(Seller).offset(skip).limit(limit).all()

    if not sellers:
        # Se não houver vendedores no banco, criar vendedores padrão
        default_sellers = [
            Seller(name="Mercado Livre", official_store=True, reputation_score=4.8, is_approved=True),
            Seller(name="HP Store Oficial", official_store=True, reputation_score=4.9, is_approved=True),
            Seller(name="Mega Supplies", official_store=False, reputation_score=4.3, is_approved=True),
            Seller(name="Printer Suprimentos", official_store=False, reputation_score=4.2, is_approved=True),
            Seller(name="InfoTec Brasil", official_store=False, reputation_score=4.0, is_approved=True)
        ]

        for seller in default_sellers:
            db.add(seller)

        db.commit()
        sellers = default_sellers

    return [
        {
            "id": seller.id,
            "name": seller.name,
            "official_store": seller.official_store,
            "reputation_score": seller.reputation_score,
            "is_approved": seller.is_approved,
            "total_sales": seller.total_sales
        }
        for seller in sellers
    ]

@router.post("/", response_model=Dict[str, Any])
async def create_seller(
    seller_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cria um novo vendedor.
    """
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão negada. Apenas administradores e gerentes podem cadastrar vendedores."
        )

    # Verificar se o vendedor já existe
    existing_seller = db.query(Seller).filter(Seller.name == seller_data["name"]).first()
    if existing_seller:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vendedor com o nome '{seller_data['name']}' já existe."
        )

    # Criar novo vendedor
    new_seller = Seller(
        name=seller_data["name"],
        url=seller_data.get("url"),
        official_store=seller_data.get("official_store", False),
        reputation_score=seller_data.get("reputation_score", 0.0),
        is_approved=seller_data.get("is_approved", False),
        notes=seller_data.get("notes")
    )

    db.add(new_seller)
    db.commit()
    db.refresh(new_seller)

    # Registrar log
    log = SystemLog(
        action="create_seller",
        description=f"Vendedor cadastrado: {new_seller.name}",
        user_id=current_user.id,
        level=LogLevel.LOW,
        category=LogCategory.SYSTEM
    )
    db.add(log)
    db.commit()

    return {
        "success": True,
        "message": "Vendedor cadastrado com sucesso",
        "seller_id": new_seller.id
    }

@router.put("/{seller_id}", response_model=Dict[str, Any])
async def update_seller(
    seller_id: int,
    seller_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Atualiza um vendedor existente.
    """
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão negada. Apenas administradores e gerentes podem atualizar vendedores."
        )

    # Buscar o vendedor
    seller = db.query(Seller).filter(Seller.id == seller_id).first()
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendedor não encontrado"
        )

    # Atualizar os campos
    for key, value in seller_data.items():
        if hasattr(seller, key):
            setattr(seller, key, value)

    db.commit()
    db.refresh(seller)

    # Registrar log
    log = SystemLog(
        action="update_seller",
        description=f"Vendedor atualizado: {seller.name}",
        user_id=current_user.id,
        level=LogLevel.LOW,
        category=LogCategory.SYSTEM
    )
    db.add(log)
    db.commit()

    return {
        "success": True,
        "message": "Vendedor atualizado com sucesso"
    }

@router.delete("/{seller_id}", response_model=Dict[str, Any])
async def delete_seller(
    seller_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove um vendedor.
    """
    if current_user.role not in ["admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão negada. Apenas administradores podem remover vendedores."
        )

    # Buscar o vendedor
    seller = db.query(Seller).filter(Seller.id == seller_id).first()
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendedor não encontrado"
        )

    # Armazenar o nome para o log
    seller_name = seller.name

    # Remover o vendedor
    db.delete(seller)
    db.commit()

    # Registrar log
    log = SystemLog(
        action="delete_seller",
        description=f"Vendedor removido: {seller_name}",
        user_id=current_user.id,
        level=LogLevel.MEDIUM,
        category=LogCategory.SYSTEM
    )
    db.add(log)
    db.commit()

    return {
        "success": True,
        "message": "Vendedor removido com sucesso"
    }

@router.get("/approved", response_model=List[Dict[str, Any]])
async def list_approved_sellers(
    db: Session = Depends(get_db)
):
    """
    Lista apenas vendedores aprovados.
    Este endpoint é público para ser usado na validação de dados.
    """
    sellers = db.query(Seller).filter(Seller.is_approved == True).all()

    return [
        {
            "id": seller.id,
            "name": seller.name,
            "official_store": seller.official_store,
            "reputation_score": seller.reputation_score
        }
        for seller in sellers
    ]
