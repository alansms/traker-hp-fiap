from fastapi import APIRouter, Depends, HTTPException
from app.core.security import get_current_user
from app.core.config import settings
import httpx

router = APIRouter()

@router.get("/validate-openai-key", response_model=dict)
async def validate_openai_key(current_user = Depends(get_current_user)):
    """
    Valida se a chave da OpenAI está funcionando corretamente.
    Requer autenticação como admin.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Apenas administradores podem validar a chave da API")

    if not settings.OPENAI_API_KEY:
        return {"valid": False, "message": "Chave da API não configurada no servidor"}

    try:
        # Faz uma requisição simples para a API da OpenAI
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-3.5-turbo",
                    "messages": [
                        {"role": "system", "content": "Você é um assistente útil."},
                        {"role": "user", "content": "Teste de validação da API. Responda apenas com 'OK'."}
                    ],
                    "max_tokens": 10,
                    "temperature": 0.1
                }
            )

            # Verifica se a resposta foi bem-sucedida
            if response.status_code == 200:
                return {"valid": True, "message": "Chave da API está funcionando corretamente"}
            else:
                error_data = response.json()
                return {"valid": False, "message": f"Erro na API: {error_data.get('error', {}).get('message', 'Erro desconhecido')}"}

    except Exception as e:
        return {"valid": False, "message": f"Erro ao conectar com a API da OpenAI: {str(e)}"}

async def test_openai_key(api_key: str) -> tuple[bool, str]:
    """
    Testa se uma chave da API OpenAI é válida.

    Args:
        api_key: A chave da API a ser testada

    Returns:
        tuple: (is_valid, message)
    """
    if not api_key or not api_key.strip():
        return False, "Chave de API vazia"

    try:
        # Faz uma requisição simples para a API da OpenAI
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-3.5-turbo",
                    "messages": [
                        {"role": "system", "content": "Você é um assistente útil."},
                        {"role": "user", "content": "Teste de validação da API. Responda apenas com 'OK'."}
                    ],
                    "max_tokens": 10,
                    "temperature": 0.1
                }
            )

            # Verifica se a resposta foi bem-sucedida
            if response.status_code == 200:
                return True, "Chave da API está funcionando corretamente"
            else:
                error_data = response.json()
                return False, f"Erro na API: {error_data.get('error', {}).get('message', 'Erro desconhecido')}"

    except Exception as e:
        return False, f"Erro ao conectar com a API da OpenAI: {str(e)}"
