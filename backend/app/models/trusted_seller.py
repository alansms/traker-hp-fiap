from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.db.session import Base

class TrustedSeller(Base):
    """Modelo para vendedores de confiança"""
    __tablename__ = "trusted_sellers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)  # Nome do vendedor
    store_name = Column(String(200))  # Nome da loja
    seller_id = Column(String(100), unique=True)  # ID do vendedor no Mercado Livre
    email = Column(String(255))  # Email de contato
    phone = Column(String(20))  # Telefone
    address = Column(Text)  # Endereço
    rating = Column(String(10))  # Avaliação do vendedor
    is_active = Column(Boolean, default=True)  # Se o vendedor está ativo
    notes = Column(Text)  # Observações
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<TrustedSeller(name='{self.name}', seller_id='{self.seller_id}')>"
