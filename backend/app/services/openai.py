import httpx
from app.core.config import settings
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.settings import SystemSettings

async def get_api_key() -> str:
    """
    Recupera a chave da API OpenAI do banco de dados ou da configuração do ambiente.
    Prioriza a chave armazenada no banco de dados.

    Returns:
        str: Chave da API OpenAI
    """
    # Tenta buscar a chave do banco de dados primeiro
    db = SessionLocal()
    try:
        api_key_setting = db.query(SystemSettings).filter(SystemSettings.key == "openai_api_key").first()
        if api_key_setting and api_key_setting.value:
            return api_key_setting.value
    except Exception as e:
        print(f"Erro ao buscar chave da API no banco de dados: {e}")
    finally:
        db.close()

    # Se não encontrar no banco de dados, usa a configuração do ambiente
    return settings.OPENAI_API_KEY

async def chat_completion(prompt: str, context: str = None) -> dict:
    """
    Envia uma solicitação para a API do OpenAI e retorna a resposta.

    Args:
        prompt: A pergunta ou instrução do usuário
        context: Contexto adicional sobre o projeto (opcional)

    Returns:
        dict: Resposta da API OpenAI
    """
    # Buscar a chave da API (do banco de dados ou da configuração)
    api_key = await get_api_key()

    if not api_key:
        return {
            "success": False,
            "message": "API Key da OpenAI não configurada. Configure a chave nas configurações do sistema."
        }

    # Construir o prompt com contexto
    system_message = """Você é um assistente virtual especializado em ajudar com o sistema Mercado Livre Tracker.
Você pode auxiliar com dúvidas sobre:
- Relatórios de preços e vendas
- Configuração de alertas de preços
- Gerenciamento de produtos monitorados
- Análise de vendedores e reputação
- Funcionalidades do sistema

Mantenha suas respostas concisas, úteis e focadas no contexto do sistema Mercado Livre Tracker.
"""

    if context:
        system_message += f"\n\nContexto adicional sobre o sistema:\n{context}"

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-3.5-turbo",
                    "messages": [
                        {"role": "system", "content": system_message},
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 1000,
                    "temperature": 0.7
                }
            )

            response_data = response.json()

            if response.status_code == 200 and "choices" in response_data:
                return {
                    "success": True,
                    "message": response_data["choices"][0]["message"]["content"]
                }
            else:
                error_message = response_data.get("error", {}).get("message", "Erro desconhecido na API")
                return {
                    "success": False,
                    "message": f"Erro na API OpenAI: {error_message}"
                }

    except Exception as e:
        return {
            "success": False,
            "message": f"Erro ao conectar com a API OpenAI: {str(e)}"
        }
