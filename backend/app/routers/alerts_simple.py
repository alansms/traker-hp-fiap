from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timedelta, timezone

from app.core.security import get_current_active_user
from app.db.session import get_db
from app.models.user import User

router = APIRouter()

@router.get("/")
async def get_alerts_simple(
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Endpoint simples para testar alertas
    """
    try:
        # Buscar alertas diretamente do banco
        result = db.execute(text("""
            SELECT id, title, suspicion_level, created_at, is_verified, price, reference_price
            FROM suspicious_products 
            ORDER BY created_at DESC 
            LIMIT :limit
        """), {"limit": limit})
        
        alerts = []
        for row in result:
            # Calcular dias atrás
            days_ago = (datetime.now(timezone.utc) - row[3]).days
            
            alerts.append({
                "id": row[0],
                "title": row[1],
                "suspicion_level": row[2],
                "created_at": row[3].isoformat(),
                "is_verified": row[4],
                "price": float(row[5]) if row[5] else 0,
                "reference_price": float(row[6]) if row[6] else 0,
                "days_ago": days_ago,
                "status": "Novo" if not row[4] else "Verificado"
            })
        
        return {
            "success": True,
            "data": alerts,
            "total": len(alerts)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar alertas: {str(e)}")

@router.get("/stats")
async def get_alert_stats_simple(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Estatísticas simples dos alertas
    """
    try:
        # Contar alertas por nível
        critical_count = db.execute(text("SELECT COUNT(*) FROM suspicious_products WHERE suspicion_level = 'CRITICAL'")).scalar()
        high_count = db.execute(text("SELECT COUNT(*) FROM suspicious_products WHERE suspicion_level = 'HIGH'")).scalar()
        medium_count = db.execute(text("SELECT COUNT(*) FROM suspicious_products WHERE suspicion_level = 'MEDIUM'")).scalar()
        low_count = db.execute(text("SELECT COUNT(*) FROM suspicious_products WHERE suspicion_level = 'LOW'")).scalar()
        
        # Contar não verificados
        unverified_count = db.execute(text("SELECT COUNT(*) FROM suspicious_products WHERE is_verified = FALSE")).scalar()
        
        return {
            "success": True,
            "stats": {
                "critical": critical_count,
                "high": high_count,
                "medium": medium_count,
                "low": low_count,
                "unverified": unverified_count,
                "total": critical_count + high_count + medium_count + low_count
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao calcular estatísticas: {str(e)}")
