from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from typing import List, Optional, Union
from datetime import datetime
from sqlalchemy.orm import Session
import csv
from io import StringIO

from app.core.security import get_current_active_superuser, get_current_active_user
from app.db.session import get_db
from app.schemas.system_log import LogResponse, LogFilter, LogsPagination
from app.services.log_service import LogService
from app.models.system_log import LogLevel, LogCategory
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=LogsPagination)
async def get_logs(
    request: Request,
    response: Response,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    level: Optional[LogLevel] = Query(None),
    category: Optional[LogCategory] = Query(None),
    user_id: Optional[int] = Query(None),
    search_term: Optional[str] = Query(None),
    export: Optional[str] = Query(None, description="Formato de exportação (csv)"),
    current_user: User = Depends(get_current_active_user),
    log_service: LogService = Depends()
):
    """
    Obter logs do sistema com filtros e paginação.
    Apenas administradores ou usuários com permissão podem acessar.
    Opcionalmente exporta os dados em formato CSV.
    """
    # Converter strings de data para objetos datetime
    start_datetime = None
    if start_date:
        try:
            start_datetime = datetime.fromisoformat(start_date)
        except ValueError:
            pass

    end_datetime = None
    if end_date:
        try:
            end_datetime = datetime.fromisoformat(end_date)
        except ValueError:
            pass

    filters = LogFilter(
        start_date=start_datetime,
        end_date=end_datetime,
        level=level,
        category=category,
        user_id=user_id,
        search_term=search_term
    )

    # Registrar esta consulta nos logs
    await log_service.create_log(
        level=LogLevel.LOW,
        category=LogCategory.SYSTEM,
        action="logs_access",
        description=f"Usuário consultou logs do sistema com filtros: {filters}",
        request=request,
        user_id=current_user.id,
        user_email=current_user.email
    )

    result = await log_service.get_logs(filters, skip, limit)

    # Se solicitada exportação em CSV
    if export and export.lower() == 'csv':
        # Criar o arquivo CSV em memória
        output = StringIO()
        writer = csv.writer(output)

        # Escrever cabeçalho
        writer.writerow(['ID', 'Timestamp', 'Level', 'Category', 'Action',
                         'Description', 'IP Address', 'User ID'])

        # Escrever dados
        for log in result['items']:
            writer.writerow([
                log.id,
                log.timestamp.isoformat(),
                log.level.value,
                log.category.value,
                log.action,
                log.description,
                log.ip_address or '',
                log.user_id or ''
            ])

        # Configurar resposta
        response.headers["Content-Disposition"] = f"attachment; filename=logs_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        response.headers["Content-Type"] = "text/csv"
        return output.getvalue()

    # Caso contrário, retornar o objeto de paginação normal
    return result

@router.get("/me", response_model=List[LogResponse])
async def get_my_logs(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    log_service: LogService = Depends()
):
    """
    Obter logs do usuário atual.
    Qualquer usuário autenticado pode acessar seus próprios logs.
    """
    # Registrar esta consulta nos logs
    await log_service.create_log(
        level=LogLevel.LOW,
        category=LogCategory.USER,
        action="logs_access_own",
        description=f"Usuário consultou seus próprios logs",
        request=request,
        user_id=current_user.id,
        user_email=current_user.email
    )

    logs = await log_service.get_logs_by_user(current_user.id, skip, limit)
    return logs

@router.get("/{log_id}", response_model=LogResponse)
async def get_log_by_id(
    log_id: int,
    current_user: User = Depends(get_current_active_superuser),
    log_service: LogService = Depends()
):
    """
    Obter um log específico pelo ID.
    Apenas administradores podem acessar.
    """
    log = await log_service.get_log_by_id(log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Log não encontrado")
    return log
