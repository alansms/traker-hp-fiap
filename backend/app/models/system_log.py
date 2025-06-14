from sqlalchemy import Column, Integer, String, DateTime, Enum, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.db.session import Base

class LogLevel(str, enum.Enum):
    CRITICAL = "critical"  # Ações críticas como exclusão de contas, alterações de permissões
    HIGH = "high"          # Ações importantes como aprovação/rejeição de usuários
    MEDIUM = "medium"      # Ações regulares como adição/remoção de produtos
    LOW = "low"            # Ações informativas como login/logout, consultas

class LogCategory(str, enum.Enum):
    SECURITY = "security"  # Ações relacionadas à segurança
    USER = "user"          # Ações relacionadas a usuários
    PRODUCT = "product"    # Ações relacionadas a produtos
    SEARCH = "search"      # Ações relacionadas a buscas
    SYSTEM = "system"      # Ações do sistema
    OTHER = "other"        # Outras ações

class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    level = Column(Enum(LogLevel), index=True)
    category = Column(Enum(LogCategory), index=True)
    action = Column(String(255), index=True)
    description = Column(Text)
    ip_address = Column(String(45))  # IPv6 pode ter até 45 caracteres

    # Relacionamento com User - usando string simples
    user = relationship("User", back_populates="system_logs")

    class Config:
        orm_mode = True
