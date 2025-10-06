from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.session import get_db

router = APIRouter()

@router.get("/")
async def get_alerts_test(
    db: Session = Depends(get_db)
):
    """
    Endpoint de teste para alertas (sem autenticação)
    """
    try:
        # Buscar alertas diretamente do banco
        result = db.execute(text("SELECT COUNT(*) FROM suspicious_products"))
        count = result.scalar()
        
        return {
            "message": "Alertas funcionando!",
            "total_alerts": count,
            "success": True
        }
        
    except Exception as e:
        return {
            "message": f"Erro: {str(e)}",
            "success": False
        }
