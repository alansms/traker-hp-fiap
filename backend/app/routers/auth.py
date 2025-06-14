from datetime import timedelta, datetime
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
import secrets

from app.core.config import settings
from app.core.security import create_access_token, verify_password, get_password_hash, get_current_user
from app.db.session import get_db
from app.models.user import User
from app.services.email import send_password_reset_email, send_account_verification_email

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário inativo"
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_superuser": user.is_superuser
        }
    }

@router.post("/verify-2fa")
async def verify_2fa(
    email: str,
    code: str,
    db: Session = Depends(get_db)
) -> Any:
    """
    Verify 2FA code and complete login
    """
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado"
        )

    # TODO: Implementar verificação real do código 2FA
    # Por enquanto, qualquer código é aceito para desenvolvimento
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_superuser": user.is_superuser
        }
    }

@router.post("/logout")
async def logout() -> Any:
    """
    Logout endpoint that invalidates the user session

    In a real-world scenario, this could:
    - Add the token to a blacklist
    - Clear server-side sessions
    - Perform any other cleanup tasks

    For now, we just return a success message as the frontend
    will handle removing the token from storage
    """
    return {"detail": "Logout realizado com sucesso"}

class RegisterRequest(BaseModel):
    email: EmailStr = Field(..., description="Email do usuário")
    full_name: str = Field(..., min_length=1, description="Nome completo do usuário")
    password: str = Field(..., min_length=6, description="Senha do usuário")

    class Config:
        json_schema_extra = {
            "example": {
                "email": "usuario@exemplo.com",
                "full_name": "Nome Completo",
                "password": "senha123"
            }
        }

@router.post("/register", response_model=dict)
async def register(
    register_data: RegisterRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Register a new user
    """
    # Depuração - imprimir dados recebidos
    print(f"Dados de registro recebidos: {register_data.dict()}")

    try:
        # Verificar se usuário já existe
        existing_user = db.query(User).filter(User.email == register_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email já cadastrado"
            )

        # Criar novo usuário
        new_user = User(
            email=register_data.email,
            full_name=register_data.full_name,
            hashed_password=get_password_hash(register_data.password),
            role="visitor",
            is_active=False,
            is_superuser=False,
            approval_status="pending",
            verification_token=secrets.token_urlsafe(32),
            verification_token_expires_at=datetime.utcnow() + timedelta(hours=48)
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Enviar email de verificação
        try:
            await send_account_verification_email(
                new_user.email,
                new_user.verification_token,
                new_user.role
            )
        except Exception as e:
            print(f"Erro ao enviar email de verificação: {e}")
            # Continue com o registro mesmo se o envio de email falhar
            # mas registre o erro

        return {
            "message": "Usuário registrado com sucesso. Aguarde a aprovação do administrador.",
            "email": new_user.email,
            "requires_approval": True
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao registrar usuário: {str(e)}"
        )

# Modelo para solicitação de redefinição de senha
class PasswordResetRequest(BaseModel):
    email: str

# Modelo para verificação do código de redefinição
class VerifyResetCodeRequest(BaseModel):
    email: str
    code: str

# Modelo para redefinição de senha
class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    password: str

# Dicionário para armazenar códigos de redefinição temporários (em produção, isso deve ser armazenado em banco de dados)
reset_codes = {}

@router.get("/request-password-reset")
async def get_password_reset_form() -> Any:
    """
    Show password reset form page or return form data structure
    """
    return {
        "message": "Use POST method to submit password reset request",
        "required_fields": ["email"]
    }

@router.post("/request-password-reset")
async def request_password_reset(
    request: PasswordResetRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Handle password reset request
    """
    user = db.query(User).filter(User.email == request.email).first()
    if user and user.is_active:
        try:
            # Generate password reset token and send email
            await send_password_reset_email(user.email)
            return {"message": "Se o email existir em nossa base, você receberá instruções para redefinir sua senha."}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao enviar email de redefinição de senha"
            )

    # Return same message even if user doesn't exist (security best practice)
    return {"message": "Se o email existir em nossa base, você receberá instruções para redefinir sua senha."}

@router.post("/verify-reset-code")
async def verify_reset_code(
    verify_request: VerifyResetCodeRequest
) -> Any:
    """
    Verifica o código de redefinição de senha
    """
    # Verificar se o código é válido
    stored_code = reset_codes.get(verify_request.email)
    if not stored_code or stored_code != verify_request.code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código inválido ou expirado"
        )

    # Retornar sucesso
    return {"detail": "Código verificado com sucesso"}

@router.post("/reset-password")
async def reset_password(
    reset_request: ResetPasswordRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Redefine a senha do usuário
    """
    # Verificar se o código é válido
    stored_code = reset_codes.get(reset_request.email)
    if not stored_code or stored_code != reset_request.code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código inválido ou expirado"
        )

    # Buscar o usuário
    user = db.query(User).filter(User.email == reset_request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )

    # Atualizar a senha
    user.hashed_password = get_password_hash(reset_request.password)
    db.commit()

    # Limpar o código usado
    del reset_codes[reset_request.email]

    # Retornar sucesso
    return {"detail": "Senha redefinida com sucesso"}

@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)) -> Any:
    """
    Retorna informações do usuário atualmente autenticado
    """
    return {
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": current_user.role,
            "is_superuser": current_user.is_superuser
        }
    }

@router.get("/verify-account/{token}")
async def verify_account(
    token: str,
    db: Session = Depends(get_db)
) -> Any:
    """
    Verifica o token de ativação de conta enviado por email
    """
    # Buscar usuário com este token de verificação
    user = db.query(User).filter(User.verification_token == token).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token de verificação inválido"
        )

    # Verificar se o token não expirou
    if user.verification_token_expires_at and user.verification_token_expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token de verificação expirado. Solicite ao administrador uma nova conta."
        )

    # Atualizar o usuário para ativo e verificado
    user.is_verified = True
    user.is_active = True
    user.verification_token = None  # Limpar o token após uso

    db.commit()

    # Retornar sucesso e os dados do usuário
    return {
        "detail": "Conta verificada com sucesso. Você já pode fazer login.",
        "user": {
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }

class ResendVerificationRequest(BaseModel):
    email: str

@router.post("/resend-verification")
async def resend_verification(
    request: ResendVerificationRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Reenvia o email de verificação para usuários já cadastrados mas não verificados
    """
    # Buscar usuário pelo email
    user = db.query(User).filter(User.email == request.email).first()

    if not user:
        # Para evitar enumeração de usuários, retornamos a mesma mensagem
        return {"message": "Se o email estiver cadastrado, um novo link de verificação será enviado."}

    # Verificar se o usuário já está verificado
    if user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este usuário já está verificado."
        )

    # Gerar novo token de verificação
    verification_token = secrets.token_urlsafe(32)
    token_expiry = datetime.utcnow() + timedelta(hours=48)

    # Atualizar token no banco de dados
    user.verification_token = verification_token
    user.verification_token_expires_at = token_expiry
    db.commit()

    # Enviar novo email de verificação
    try:
        await send_account_verification_email(
            user.email,
            user.full_name,
            verification_token,
            user.role
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao enviar email de verificação. Por favor, tente novamente mais tarde."
        )

    return {"message": "Se o email estiver cadastrado, um novo link de verificação será enviado."}
