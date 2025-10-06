from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import pyotp
import hashlib
import base64
import bcrypt  # Importando bcrypt nativo

from app.core.config import settings

# Algoritmo usado para JWT
ALGORITHM = "HS256"

# Função para gerar hash de senha
def get_password_hash(password: str) -> str:
    """
    Gera um hash seguro para a senha usando bcrypt nativo do Python.
    Para evitar o erro de limite de 72 bytes, primeiro fazemos um hash SHA-256 da senha,
    que sempre produz uma saída de 32 bytes (64 caracteres hexadecimais),
    e então aplicamos o bcrypt a esse hash.
    """
    try:
        # Primeiro, hash a senha com SHA-256 para garantir um tamanho fixo (evita o erro de 72 bytes)
        password_hash = hashlib.sha256(password.encode('utf-8')).hexdigest().encode('utf-8')

        # Usar bcrypt nativo do Python em vez de passlib
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(password_hash, salt)

        # Converter bytes para string
        return hashed.decode('utf-8')
    except Exception as e:
        import logging
        logging.error(f"Erro ao gerar hash de senha: {str(e)}")
        # Abordagem de fallback com SHA-256 simples em caso de erro
        fallback_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
        return f"$sha256${fallback_hash}"  # Formato personalizado para identificar hashes SHA-256

# Função para verificar senha
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica se a senha fornecida corresponde ao hash armazenado.
    Aplica o mesmo processo de hash SHA-256 antes de verificar.
    """
    try:
        # Se estiver usando o fallback SHA-256
        if hashed_password.startswith('$sha256$'):
            hash_value = hashed_password.split('$', 2)[2]
            password_hash = hashlib.sha256(plain_password.encode('utf-8')).hexdigest()
            return password_hash == hash_value

        # Senão, usar o método normal do bcrypt
        # Primeiro aplica SHA-256 à senha
        password_hash = hashlib.sha256(plain_password.encode('utf-8')).hexdigest().encode('utf-8')

        # Verifica usando bcrypt nativo
        return bcrypt.checkpw(password_hash, hashed_password.encode('utf-8'))
    except Exception as e:
        import logging
        logging.error(f"Erro ao verificar senha: {str(e)}")
        return False

# Função para criar token de acesso
def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Função para criar token de atualização
def create_refresh_token(data: Dict[str, Any]) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Função para verificar token
def verify_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

# Função para obter o usuário atual a partir do token
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.security.utils import get_authorization_scheme_param
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = verify_token(token)
    if payload is None:
        raise credentials_exception

    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None or not user.is_active:
        raise credentials_exception

    return user

# Função para obter o usuário atual (opcional, permite acesso sem autenticação)
async def get_current_user_optional(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    try:
        return await get_current_user(token=token, db=db)
    except HTTPException:
        return None

# Função para obter o usuário atual ativo
async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Usuário inativo")
    return current_user

# Função para obter um superusuário ativo (admin)
async def get_current_active_superuser(
    current_user: User = Depends(get_current_active_user),
) -> User:
    if not (current_user.role == "admin" or current_user.is_superuser):
        raise HTTPException(
            status_code=403, detail="Permissões insuficientes"
        )
    return current_user

# Função para gerar segredo para 2FA
def generate_totp_secret() -> str:
    return pyotp.random_base32()

# Função para gerar código TOTP
def generate_totp_code(secret: str) -> str:
    totp = pyotp.TOTP(secret)
    return totp.now()

# Função para verificar código TOTP
def verify_totp_code(secret: str, code: str) -> bool:
    totp = pyotp.TOTP(secret)
    return totp.verify(code)

# Função para gerar token de ativação de conta
def create_activation_token(data: Dict[str, Any]) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

# Função para gerar token de redefinição de senha
def create_password_reset_token(data: Dict[str, Any]) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=1)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
