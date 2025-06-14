from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.services.openai import chat_completion
from app.models.user import User
from app.core.security import get_current_user

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None

class ChatResponse(BaseModel):
    message: str
    success: bool

@router.post("/ask", response_model=ChatResponse)
async def ask_assistant(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Envia uma pergunta para o assistente virtual baseado em GPT
    """
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Serviço de assistente virtual não configurado"
        )

    # Construir contexto personalizado baseado no usuário
    user_context = f"Usuário: {current_user.full_name}, Perfil: {current_user.role}"
    if request.context:
        user_context += f"\n{request.context}"

    # Enviar a pergunta para o serviço OpenAI
    response = await chat_completion(request.message, user_context)

    if not response["success"]:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=response["message"]
        )

    return {
        "success": True,
        "message": response["message"]
    }
