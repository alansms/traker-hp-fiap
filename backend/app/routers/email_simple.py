from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User

router = APIRouter()

@router.get("/")
async def test_email_simple(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Endpoint simples para testar email
    """
    try:
        return {
            "success": True,
            "message": "Endpoint de email funcionando!",
            "user": current_user.email
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
