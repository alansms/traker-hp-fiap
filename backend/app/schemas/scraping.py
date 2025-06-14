from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class ScrapingRequest(BaseModel):
    """Esquema para solicitação de scraping/monitoramento."""
    url: str = Field(..., description="URL do produto no Mercado Livre")
    product_id: int = Field(..., description="ID do produto no banco de dados")
    check_interval: int = Field(6, description="Intervalo de verificação em horas")

class ScrapingResponse(BaseModel):
    """Esquema para resposta de operações de scraping."""
    status: str
    message: Optional[str] = None
    url: Optional[str] = None
    check_interval: Optional[int] = None
    file_path: Optional[str] = None
    task_id: Optional[str] = None
    error: Optional[str] = None
