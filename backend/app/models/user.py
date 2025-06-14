from sqlalchemy import Boolean, Column, Integer, String, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.types import DateTime
from sqlalchemy.orm import relationship

from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="visitor")  # admin, analyst, visitor
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    requires_2fa = Column(Boolean, default=False)
    approval_status = Column(String, default="pending")  # pending, approved, rejected

    # Campos para verificação de email
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)
    verification_token_expires_at = Column(DateTime, nullable=True)

    # Campos de auditoria
    created_at = Column(DateTime, default=func.now(), nullable=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=True)

    # Relacionamento com SystemLog - usando string simplificada
    system_logs = relationship("SystemLog", back_populates="user")
