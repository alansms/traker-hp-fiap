from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base

class SuspiciousProduct(Base):
    """Modelo para produtos suspeitos encontrados"""
    __tablename__ = "suspicious_products"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))  # Referência ao produto cadastrado
    title = Column(String(500), nullable=False)  # Título do produto no ML
    price = Column(Float, nullable=False)  # Preço encontrado
    reference_price = Column(Float, nullable=False)  # Preço de referência cadastrado
    price_difference = Column(Float, nullable=False)  # Diferença de preço
    price_difference_percentage = Column(Float, nullable=False)  # Diferença em porcentagem
    seller_name = Column(String(200))  # Nome do vendedor
    seller_id = Column(String(100))  # ID do vendedor
    ml_item_id = Column(String(50))  # ID do item no Mercado Livre (ex: MLB123456789)
    seller_rating = Column(Float)  # Avaliação do vendedor
    product_url = Column(Text)  # URL do produto
    image_url = Column(Text)  # URL da imagem
    suspicion_level = Column(String(20), nullable=False)  # Nível de suspeita (LOW, MEDIUM, HIGH, CRITICAL)
    is_verified = Column(Boolean, default=False)  # Se foi verificado manualmente
    is_false_positive = Column(Boolean, default=False)  # Se é falso positivo
    notes = Column(Text)  # Observações
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relacionamento com produto
    # product = relationship("Product", back_populates="suspicious_products")

    def __repr__(self):
        return f"<SuspiciousProduct(title='{self.title}', price={self.price}, suspicion_level='{self.suspicion_level}')>"
