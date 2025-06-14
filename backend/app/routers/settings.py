from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.settings import SystemSettings

router = APIRouter()

class SettingValue(BaseModel):
    value: Optional[str] = None
    value_json: Optional[Dict[str, Any]] = None
    description: Optional[str] = None

class ApiKeyRequest(BaseModel):
    apiKey: str

class ApiKeyResponse(BaseModel):
    apiKey: Optional[str] = None
    success: bool
    message: str

# Endpoint para obter todas as configurações do sistema
@router.get("/")
async def get_system_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Recupera todas as configurações do sistema.
    Apenas usuários autenticados podem acessar.
    """
    settings = db.query(SystemSettings).all()

    # Converter para dicionário para facilitar o uso no frontend
    settings_dict = {}
    for setting in settings:
        if setting.value is not None:
            settings_dict[setting.key] = setting.value
        elif setting.value_json is not None:
            settings_dict[setting.key] = setting.value_json

    return settings_dict

# Endpoint para salvar configurações do sistema
@router.post("/")
async def save_system_settings(
    settings: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Salva configurações do sistema.
    Apenas usuários autenticados podem acessar.
    """
    # Verificar se o usuário é administrador para algumas configurações
    if not current_user.role == "admin":
        # Filtrar configurações que não-admins podem atualizar
        allowed_settings = ["theme", "notifications"]
        settings = {k: v for k, v in settings.items() if k in allowed_settings}

    # Atualizar ou criar cada configuração
    for key, value in settings.items():
        setting = db.query(SystemSettings).filter(SystemSettings.key == key).first()

        if setting:
            # Atualizar configuração existente
            if isinstance(value, (dict, list)):
                setting.value = None
                setting.value_json = value
            else:
                setting.value = str(value)
                setting.value_json = None
        else:
            # Criar nova configuração
            new_setting = SystemSettings(key=key)
            if isinstance(value, (dict, list)):
                new_setting.value = None
                new_setting.value_json = value
            else:
                new_setting.value = str(value)
                new_setting.value_json = None
            db.add(new_setting)

    db.commit()
    return {"success": True, "message": "Configurações salvas com sucesso"}

# Endpoint para atualizar apenas a chave da API
@router.post("/api-key")
async def update_api_key(
    request: ApiKeyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Atualiza a chave da API OpenAI.
    Apenas administradores podem atualizar.
    """
    # Verificar se o usuário é administrador
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem atualizar a chave da API"
        )

    # Atualizar a chave da API no banco de dados
    api_key_setting = db.query(SystemSettings).filter(SystemSettings.key == "openai_api_key").first()

    if api_key_setting:
        # Atualizar configuração existente
        api_key_setting.value = request.apiKey
    else:
        # Criar nova configuração
        new_setting = SystemSettings(
            key="openai_api_key",
            value=request.apiKey,
            description="Chave da API OpenAI"
        )
        db.add(new_setting)

    db.commit()

    # Atualizar a variável de ambiente em tempo de execução
    import os
    os.environ["OPENAI_API_KEY"] = request.apiKey

    return {"success": True, "message": "Chave da API atualizada com sucesso"}

# Endpoint para salvar a chave da API OpenAI
@router.post("/openai-key")
async def save_openai_key(
    request: ApiKeyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Salva a chave da API OpenAI.
    Apenas administradores podem salvar.
    """
    # Verificar se o usuário é administrador
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem atualizar a chave da API"
        )

    # Atualizar a chave da API no banco de dados
    api_key_setting = db.query(SystemSettings).filter(SystemSettings.key == "openai_api_key").first()

    if api_key_setting:
        # Atualizar configuração existente
        api_key_setting.value = request.apiKey
    else:
        # Criar nova configuração
        new_setting = SystemSettings(
            key="openai_api_key",
            value=request.apiKey,
            description="Chave da API OpenAI"
        )
        db.add(new_setting)

    db.commit()

    # Atualizar a variável de ambiente em tempo de execução
    import os
    os.environ["OPENAI_API_KEY"] = request.apiKey

    return {"success": True, "message": "Chave da API atualizada com sucesso"}

# Endpoint para obter a chave da API OpenAI (mascarada)
@router.get("/openai-key")
async def get_openai_key(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtém a chave da API OpenAI (mascarada).
    Apenas administradores podem visualizar.
    """
    # Verificar se o usuário é administrador
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem visualizar a chave da API"
        )

    # Buscar a chave da API no banco de dados
    api_key_setting = db.query(SystemSettings).filter(SystemSettings.key == "openai_api_key").first()

    if api_key_setting and api_key_setting.value and api_key_setting.value.strip():
        # Mascarar a chave da API para segurança
        key = api_key_setting.value
        masked_key = f"{key[:4]}{'*' * (len(key) - 8)}{key[-4:]}" if len(key) > 8 else "****"
        return {"apiKey": masked_key, "isConfigured": True}

    return {"apiKey": None, "isConfigured": False}

@router.get("/api-key", response_model=ApiKeyResponse)
async def get_api_key(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Recupera a chave da API OpenAI.
    Qualquer usuário autenticado pode obter.
    """
    api_key_setting = db.query(SystemSettings).filter(SystemSettings.key == "openai_api_key").first()

    if api_key_setting and api_key_setting.value:
        return {
            "apiKey": api_key_setting.value,
            "success": True,
            "message": "Chave da API recuperada com sucesso"
        }
    else:
        return {
            "apiKey": None,
            "success": False,
            "message": "Chave da API não configurada"
        }

# Obter configurações de rastreamento
@router.get("/scraping")
async def get_scraping_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Recupera as configurações de rastreamento do sistema.
    """
    settings = db.query(SystemSettings).filter(SystemSettings.key == "scraping").first()

    if not settings or not settings.value_json:
        # Configurações padrão se não existirem
        default_settings = {
            "interval": 6,
            "retryOnError": True,
            "maxRetries": 3,
            "lastRun": None,
            "isActive": False
        }
        return default_settings

    return settings.value_json

# Atualizar configurações de rastreamento
@router.post("/scraping")
async def update_scraping_settings(
    settings: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Atualiza as configurações de rastreamento e agenda as próximas execuções.
    """
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão negada. Apenas administradores e gerentes podem alterar configurações de rastreamento."
        )

    # Obter ou criar configuração de rastreamento
    scraping_setting = db.query(SystemSettings).filter(SystemSettings.key == "scraping").first()

    if scraping_setting:
        scraping_setting.value_json = settings
    else:
        new_setting = SystemSettings(
            key="scraping",
            value=None,
            value_json=settings,
            description="Configurações de rastreamento e coleta de dados"
        )
        db.add(new_setting)

    db.commit()

    # Aqui você poderia adicionar lógica para agendar o próximo rastreamento
    # com base no intervalo definido

    return {"success": True, "message": "Configurações de rastreamento atualizadas com sucesso"}
