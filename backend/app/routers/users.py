from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
import string

from app.core.security import get_current_user, get_password_hash
from app.db.session import get_db
from app.models.user import User
from app.services.email import send_account_verification_email

router = APIRouter()

@router.get("/")
async def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Recupera a lista de todos os usuários.
    Todos os usuários autenticados podem ver a lista, mas apenas administradores
    podem modificar usuários.
    """
    # Verifica se é um usuário autenticado (verificação já feita por get_current_user)
    # Removida a verificação específica de admin para permitir a visualização

    users = db.query(User).all()
    return users

@router.post("/")
async def create_user(
    user_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cria um novo usuário.
    Apenas administradores têm acesso.
    Envia um email de verificação para o novo usuário.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão insuficiente. Apenas administradores podem criar usuários."
        )

    # Verificar se o email já existe
    existing_user = db.query(User).filter(User.email == user_data["email"]).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já está em uso."
        )

    # Gerar token de verificação aleatório e seguro (64 caracteres)
    alphabet = string.ascii_letters + string.digits
    verification_token = ''.join(secrets.choice(alphabet) for _ in range(64))

    # Definir data de expiração do token (48 horas a partir de agora)
    token_expires_at = datetime.utcnow() + timedelta(hours=48)

    # Criar novo usuário
    hashed_password = get_password_hash(user_data["password"])
    new_user = User(
        email=user_data["email"],
        full_name=user_data["full_name"],
        hashed_password=hashed_password,
        role=user_data["role"],
        # O usuário começa como inativo até verificar o email
        is_active=False,
        requires_2fa=user_data.get("requires_2fa", False),
        # Campos de verificação
        is_verified=False,
        verification_token=verification_token,
        verification_token_expires_at=token_expires_at
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Enviar email de verificação
    await send_account_verification_email(
        to_email=new_user.email,
        user_name=new_user.full_name,
        verification_token=verification_token,
        role=new_user.role
    )

    return new_user

@router.put("/{user_id}")
async def update_user(
    user_id: int,
    user_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Atualiza um usuário existente.
    Apenas administradores têm acesso.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão insuficiente. Apenas administradores podem atualizar usuários."
        )

    # Buscar usuário
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado."
        )

    # Atualizar campos
    user.full_name = user_data["full_name"]
    user.role = user_data["role"]
    user.is_active = user_data["is_active"]
    user.requires_2fa = user_data.get("requires_2fa", False)

    # Atualizar senha se fornecida
    if user_data.get("password") and user_data["password"].strip():
        user.hashed_password = get_password_hash(user_data["password"])

    db.commit()
    db.refresh(user)

    return user

@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove um usuário.
    Apenas administradores têm acesso.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão insuficiente. Apenas administradores podem remover usuários."
        )

    # Não permitir que um usuário exclua a si mesmo
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível excluir seu próprio usuário."
        )

    # Buscar usuário
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado."
        )

    # Excluir usuário
    db.delete(user)
    db.commit()

    return {"message": "Usuário removido com sucesso."}

@router.get("/pending-approval")
async def get_pending_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Recupera a lista de usuários pendentes de aprovação.
    Apenas administradores têm acesso.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão insuficiente. Apenas administradores podem visualizar usuários pendentes."
        )

    pending_users = db.query(User).filter(User.approval_status == "pending").all()
    return pending_users

@router.post("/{user_id}/approve")
async def approve_user(
    user_id: int,
    approval_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Aprova um usuário pendente e define seu nível de acesso.
    Apenas administradores têm acesso.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão insuficiente. Apenas administradores podem aprovar usuários."
        )

    # Verificar se o usuário existe
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado."
        )

    # Verificar se o usuário está pendente de aprovação
    if user.approval_status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Usuário não está pendente de aprovação. Status atual: {user.approval_status}"
        )

    # Atualizar o usuário
    user.approval_status = "approved"
    user.approved_by = current_user.id
    user.approved_at = datetime.utcnow()
    user.is_active = True

    # Atualizar o papel/função do usuário se foi fornecido
    if "role" in approval_data:
        user.role = approval_data["role"]

    db.commit()
    db.refresh(user)

    # Enviar email de notificação ao usuário
    from app.services.email import send_user_approval_notification
    try:
        await send_user_approval_notification(
            to_user_email=user.email,
            user_name=user.full_name,
            is_approved=True
        )
    except Exception as e:
        print(f"Erro ao enviar email de aprovação para {user.email}: {e}")

    return {
        "detail": f"Usuário {user.full_name} aprovado com sucesso com o papel de {user.role}.",
        "user": user
    }

@router.post("/{user_id}/reject")
async def reject_user(
    user_id: int,
    rejection_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Rejeita um usuário pendente.
    Apenas administradores têm acesso.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão insuficiente. Apenas administradores podem rejeitar usuários."
        )

    # Verificar se o usuário existe
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado."
        )

    # Verificar se o usuário está pendente de aprovação
    if user.approval_status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Usuário não está pendente de aprovação. Status atual: {user.approval_status}"
        )

    # Atualizar o usuário
    user.approval_status = "rejected"
    user.rejection_reason = rejection_data.get("reason", "Não especificado")
    user.is_active = False

    db.commit()
    db.refresh(user)

    # Enviar email de notificação ao usuário
    from app.services.email import send_user_approval_notification
    try:
        await send_user_approval_notification(
            to_user_email=user.email,
            user_name=user.full_name,
            is_approved=False,
            rejection_reason=user.rejection_reason
        )
    except Exception as e:
        print(f"Erro ao enviar email de rejeição para {user.email}: {e}")

    return {
        "detail": f"Usuário {user.full_name} rejeitado.",
        "user": user
    }

