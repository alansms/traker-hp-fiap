from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class ReviewSchema(BaseModel):
    """Esquema para avaliações de produtos."""
    date: str
    rating: int
    comment: str

class ProductSearch(BaseModel):
    """Esquema para resultados de busca de produtos."""
    id: str
    title: str
    price: float
    link: str
    rating: Optional[float] = None
    review_count: Optional[int] = 0
    reviews: Optional[List[str]] = []  # Lista de comentários em texto
    seller: Optional[str] = None
    image: Optional[str] = None

class ProductCreate(BaseModel):
    """Esquema para criação de produtos para monitoramento."""
    name: str
    pn: str
    url: str
    family: Optional[str] = None
    printer_models: Optional[List[str]] = []
    reference_price: Optional[float] = 0.0
    check_interval: Optional[int] = 6  # Em horas

class ProductResponse(BaseModel):
    """Esquema para resposta detalhada de produto."""
    title: str
    price: float
    original_price: Optional[float] = None
    seller: Dict[str, Any]
    seller_details: Dict[str, Any]
    rating: Optional[float] = None
    rating_count: Optional[int] = 0
    reviews: Optional[List[ReviewSchema]] = []  # Lista de avaliações
    available: bool
    attributes: Dict[str, str] = {}
    images: List[str] = []
    description: Optional[str] = None
    extracted_at: str
    pn: Optional[str] = None
    printer_models: Optional[List[str]] = []
    color: Optional[str] = None
    yield_pages: Optional[str] = None
