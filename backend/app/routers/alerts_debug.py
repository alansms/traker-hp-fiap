from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.security import get_current_active_user
from app.db.session import get_db
from app.models.user import User

router = APIRouter()

@router.get("/")
async def get_alerts_debug(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Endpoint de debug para alertas
    """
    try:
        # Buscar alertas diretamente do banco
        result = db.execute(text("SELECT id, title, suspicion_level, created_at, is_verified FROM suspicious_products ORDER BY created_at DESC LIMIT 5"))
        
        alerts = []
        for row in result:
            alerts.append({
                "id": row[0],
                "title": row[1],
                "suspicion_level": row[2],
                "created_at": row[3].isoformat() if row[3] else None,
                "is_verified": row[4]
            })
        
        return {
            "success": True,
            "alerts": alerts,
            "total": len(alerts),
            "user": current_user.email
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "alerts": [],
            "total": 0
        }
