from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.session import Base

class Seller(Base):
    """
    Modelo para armazenar informações sobre vendedores.
    """
    __tablename__ = "sellers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    url = Column(String(512), nullable=True)
    official_store = Column(Boolean, default=False)
    reputation_score = Column(Float, default=0.0)
    total_sales = Column(Integer, default=0)
    is_approved = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Seller(id={self.id}, name='{self.name}', official_store={self.official_store})>"
