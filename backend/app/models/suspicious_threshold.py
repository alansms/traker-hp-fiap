from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.db.session import Base

class SuspiciousThreshold(Base):
    """Modelo para configuração de margem de suspeita"""
    __tablename__ = "suspicious_thresholds"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)  # Nome da configuração
    threshold_percentage = Column(Float, nullable=False)  # Porcentagem de margem (ex: 10.0 para 10%)
    description = Column(Text)  # Descrição da configuração
    is_active = Column(Boolean, default=True)  # Se a configuração está ativa
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<SuspiciousThreshold(name='{self.name}', threshold={self.threshold_percentage}%)>"
