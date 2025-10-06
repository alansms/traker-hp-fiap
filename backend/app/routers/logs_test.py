from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.security import get_current_active_user
from app.db.session import get_db
from app.models.user import User

router = APIRouter()

@router.get("/")
async def get_logs_test(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Endpoint de teste para logs
    """
    try:
        # Buscar logs diretamente do banco
        result = db.execute(text("SELECT COUNT(*) FROM system_logs"))
        count = result.scalar()
        
        return {
            "message": "Logs funcionando!",
            "total_logs": count,
            "user": current_user.email,
            "success": True
        }
        
    except Exception as e:
        return {
            "message": f"Erro: {str(e)}",
            "success": False
        }
