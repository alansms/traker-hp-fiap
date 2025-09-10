from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime

from ..db.session import SessionLocal
from ..core.config import settings
from ..core.security import ALGORITHM
from ..models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(token: str = Depends(oauth2_scheme), db = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception

    return user

# Verificação para acesso de administrador
async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_superuser and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar este recurso. Requer nível de administrador."
        )
    return current_user

# Verificação para acesso de analista (permite admin também)
async def get_analyst_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ["admin", "analyst"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar este recurso. Requer nível de analista ou superior."
        )
    return current_user

# Verificação para acesso de visitante (permite qualquer usuário autenticado)
async def get_visitor_user(current_user: User = Depends(get_current_user)) -> User:
    # Qualquer usuário autenticado pode acessar recursos de visitante
    return current_user

async def get_scraping_service():
    """
    Retorna uma instância do serviço de scraping.
    Por enquanto, retorna None pois o serviço ainda será implementado.
    """
    return None
