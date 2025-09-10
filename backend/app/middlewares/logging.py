import logging
import time
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

# Configuração do logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("api")

class LoggingMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Log da requisição
        start_time = time.time()
        logger.info(
            f"Request: {request.method} {request.url}"
        )

        # Processa a requisição
        response = await call_next(request)

        # Log da resposta com tempo de processamento
        process_time = time.time() - start_time
        logger.info(
            f"Response: {request.method} {request.url} - Status: {response.status_code} - Time: {process_time:.2f}s"
        )

        return response
