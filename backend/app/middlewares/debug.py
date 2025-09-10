from fastapi import Request
import logging

# Configurar o logger
logger = logging.getLogger("api")
logger.setLevel(logging.DEBUG)

async def log_request_details(request: Request):
    """
    Middleware para logar detalhes da requisição, incluindo o corpo para depuração
    """
    # Obter a URL da requisição
    url = f"{request.url.path}"
    method = request.method

    # Log da requisição recebida
    logger.debug(f"Requisição recebida: {method} {url}")

    # Para métodos POST/PUT, tentar logar o corpo da requisição
    if method in ["POST", "PUT"]:
        try:
            # Necessário guardar o corpo para não consumir o stream
            body_bytes = await request.body()
            # Converter para string e logar
            body_str = body_bytes.decode('utf-8')
            logger.debug(f"Corpo da requisição: {body_str}")
            # Reconstruir o body para que possa ser lido novamente
            request._body = body_bytes
        except Exception as e:
            logger.error(f"Erro ao logar corpo da requisição: {str(e)}")

    # Continuar o processamento normal
    return None
