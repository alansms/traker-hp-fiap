from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from app.db.session import SessionLocal
from app.models.user import User
from app.routers.auth import get_current_user

router = APIRouter()



@router.get("/database-stats")
async def get_database_stats(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Permissão negada")
    
    db = SessionLocal()
    try:
        from sqlalchemy import text
        
        stats = {
            "products": {
                "total": db.execute(text("SELECT COUNT(*) FROM products")).scalar(),
                "active": db.execute(text("SELECT COUNT(*) FROM products WHERE is_active = true")).scalar(),
                "description": "Produtos monitorados"
            },
            "suspicious_products": {
                "total": db.execute(text("SELECT COUNT(*) FROM suspicious_products")).scalar(),
                "description": "Produtos suspeitos detectados"
            },
            "system_logs": {
                "total": db.execute(text("SELECT COUNT(*) FROM system_logs")).scalar(),
                "description": "Logs do sistema"
            },
            "users": {
                "total": db.execute(text("SELECT COUNT(*) FROM users")).scalar(),
                "active": db.execute(text("SELECT COUNT(*) FROM users WHERE is_active = true")).scalar(),
                "description": "Usuários cadastrados"
            },
            "trusted_sellers": {
                "total": db.execute(text("SELECT COUNT(*) FROM trusted_sellers")).scalar(),
                "description": "Vendedores confiáveis"
            },
            "suspicious_thresholds": {
                "total": db.execute(text("SELECT COUNT(*) FROM suspicious_thresholds")).scalar(),
                "description": "Configurações de detecção"
            },
            "system_settings": {
                "total": db.execute(text("SELECT COUNT(*) FROM system_settings")).scalar(),
                "description": "Configurações do sistema"
            }
        }
        
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()
