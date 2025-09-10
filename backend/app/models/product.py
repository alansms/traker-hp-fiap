from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from typing import List, Optional

from app.db.session import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    pn = Column(String, index=True)  # Part Number
    search_terms = Column(String, nullable=False)  # Termos de busca para ML
    url = Column(String)
    family = Column(String)
    printer_models = Column(JSON)  # Lista de modelos de impressora compatíveis
    reference_price = Column(Float, default=0.0)
    check_interval = Column(Integer, default=6)  # Em horas
    is_active = Column(Boolean, default=True)

    # Campos de auditoria
    created_at = Column(DateTime, default=func.now(), nullable=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=True)
    last_search = Column(DateTime, nullable=True)

    # Relacionamentos podem ser adicionados aqui para histórico de preços, etc.
