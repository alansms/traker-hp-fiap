from typing import List, Optional, Dict, Any
from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from datetime import datetime

from app.db.session import get_db
from app.models.system_log import SystemLog, LogLevel, LogCategory
from app.schemas.system_log import LogCreate, LogFilter

class LogService:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db

    async def create_log(self,
                        level: LogLevel,
                        category: LogCategory,
                        action: str,
                        description: str,
                        request: Optional[Request] = None,
                        user_id: Optional[int] = None,
                        user_email: Optional[str] = None) -> SystemLog:
        """
        Cria um novo registro de log no sistema
        """
        # Obter IP do cliente se o request estiver disponível
        ip_address = None
        if request:
            ip_address = request.client.host if request.client else None

        # Preparar dados para o log - remover user_email pois não existe no modelo SystemLog
        log_data = {
            "level": level,
            "category": category,
            "action": action,
            "description": description,
            "ip_address": ip_address,
            "user_id": user_id
            # Removido o campo user_email que causava o erro
        }

        # Adicionar informação do email no campo description se disponível
        if user_email:
            log_data["description"] = f"{description} (Email: {user_email})"

        log = SystemLog(**log_data)
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    async def get_logs(self,
                      filters: LogFilter,
                      skip: int = 0,
                      limit: int = 100) -> Dict[str, Any]:
        """
        Obtém logs com filtros e paginação
        """
        query = self.db.query(SystemLog)

        # Aplicar filtros
        if filters.start_date:
            query = query.filter(SystemLog.timestamp >= filters.start_date)

        if filters.end_date:
            query = query.filter(SystemLog.timestamp <= filters.end_date)

        if filters.level:
            query = query.filter(SystemLog.level == filters.level)

        if filters.category:
            query = query.filter(SystemLog.category == filters.category)

        if filters.user_id:
            query = query.filter(SystemLog.user_id == filters.user_id)

        if filters.search_term:
            search_term = f"%{filters.search_term}%"
            query = query.filter(
                or_(
                    SystemLog.action.ilike(search_term),
                    SystemLog.description.ilike(search_term)
                    # Removida a referência a SystemLog.user_email que não existe no modelo
                )
            )

        # Contar total antes de aplicar paginação
        total = query.count()

        # Ordenar por timestamp decrescente (mais recentes primeiro)
        query = query.order_by(desc(SystemLog.timestamp))

        # Aplicar paginação
        logs = query.offset(skip).limit(limit).all()

        # Calcular páginas
        pages = (total + limit - 1) // limit if limit > 0 else 1
        page = (skip // limit) + 1 if limit > 0 else 1

        return {
            "items": logs,
            "total": total,
            "page": page,
            "size": limit,
            "pages": pages
        }

    async def get_log_by_id(self, log_id: int) -> Optional[SystemLog]:
        """
        Obtém um log específico pelo ID
        """
        return self.db.query(SystemLog).filter(SystemLog.id == log_id).first()

    async def get_logs_by_user(self, user_id: int, skip: int = 0, limit: int = 100) -> List[SystemLog]:
        """
        Obtém logs de um usuário específico
        """
        return self.db.query(SystemLog).filter(
            SystemLog.user_id == user_id
        ).order_by(desc(SystemLog.timestamp)).offset(skip).limit(limit).all()
