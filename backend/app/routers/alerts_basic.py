from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.security import get_current_active_user
from app.db.session import get_db
from app.models.user import User

router = APIRouter()

@router.get("/")
async def get_alerts_basic(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Endpoint básico para testar alertas
    """
    try:
        # Buscar alertas diretamente do banco
        result = db.execute(text("SELECT COUNT(*) FROM suspicious_products"))
        count = result.scalar()
        
        return {
            "message": "Alertas funcionando!",
            "total_alerts": count,
            "user": current_user.email,
            "success": True
        }
        
    except Exception as e:
        return {
            "message": f"Erro: {str(e)}",
            "success": False
        }
