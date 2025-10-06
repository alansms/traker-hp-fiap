from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.security import get_current_active_user
from app.db.session import get_db
from app.models.user import User

router = APIRouter()

@router.get("/")
async def get_logs_simple(
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Endpoint simples para testar logs
    """
    try:
        # Buscar logs diretamente do banco
        result = db.execute(text("""
            SELECT id, level, category, action, description, timestamp, user_id, ip_address
            FROM system_logs 
            ORDER BY timestamp DESC 
            LIMIT :limit
        """), {"limit": limit})
        
        logs = []
        for row in result:
            logs.append({
                "id": row[0],
                "level": row[1],
                "category": row[2],
                "action": row[3],
                "description": row[4],
                "timestamp": row[5].isoformat() if row[5] else None,
                "user_id": row[6],
                "ip_address": row[7]
            })
        
        return {
            "items": logs,
            "total": len(logs),
            "success": True
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar logs: {str(e)}")
