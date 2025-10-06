from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_
from datetime import datetime, timedelta, timezone
import httpx

from app.db.session import get_db
from app.models.suspicious_product import SuspiciousProduct
from app.models.product import Product
from app.core.security import get_current_user
from app.models.user import User
from app.scrapers.enhanced_ml_scraper import find_first_product

router = APIRouter(tags=["alerts"])

@router.get("/")
async def get_alerts(
    limit: int = Query(50, description="Número máximo de alertas a retornar"),
    offset: int = Query(0, description="Número de alertas a pular"),
    suspicion_level: Optional[str] = Query(None, description="Filtrar por nível de suspeita"),
    is_verified: Optional[bool] = Query(None, description="Filtrar por status de verificação"),
    is_false_positive: Optional[bool] = Query(None, description="Filtrar por falsos positivos"),
    days: int = Query(30, description="Número de dias para buscar alertas"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Busca alertas de produtos suspeitos com filtros opcionais.
    """
    try:
        # Buscar todos os alertas (simplificado para debug)
        alerts = db.query(SuspiciousProduct).order_by(desc(SuspiciousProduct.created_at)).limit(limit).all()
        
        # Converter para formato de resposta
        alerts_data = []
        for alert in alerts:
            # Calcular dias atrás
            days_ago = (datetime.now(timezone.utc) - alert.created_at).days
            if alert.product_id:
                product = db.query(Product).filter(Product.id == alert.product_id).first()
            
            alert_data = {
                "id": alert.id,
                "type": "fake_product" if alert.suspicion_level in ["HIGH", "CRITICAL"] else "price_drop",
                "product": {
                    "id": alert.product_id,
                    "name": product.name if product else alert.title,
                    "pn": product.pn if product else "N/A",
                    "referencePrice": alert.reference_price
                },
                "currentPrice": alert.price,
                "percentChange": alert.price_difference_percentage,
                "seller": alert.seller_name or "Vendedor não identificado",
                "sellerRating": alert.seller_rating or 0.0,
                "riskLevel": alert.suspicion_level,
                "createdAt": alert.created_at.isoformat() if alert.created_at else None,
                "read": alert.is_verified,
                "description": f"Preço {abs(alert.price_difference_percentage):.0f}% {'abaixo' if alert.price_difference_percentage < 0 else 'acima'} do valor de referência - {'POSSÍVEL FALSIFICAÇÃO' if alert.suspicion_level in ['HIGH', 'CRITICAL'] else 'ATENÇÃO'}",
                "isVerified": alert.is_verified,
                "isFalsePositive": alert.is_false_positive,
                "notes": alert.notes,
                "productUrl": alert.product_url,
                "imageUrl": alert.image_url
            }
            alerts_data.append(alert_data)
        
        return {
            "success": True,
            "alerts": alerts_data,
            "total": len(alerts_data),
            "message": f"Encontrados {len(alerts_data)} alertas"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar alertas: {str(e)}"
        )

@router.get("/{alert_id}/validate-url")
async def validate_alert_url(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Valida e resolve a URL do anúncio do alerta. Retorna a URL final quando disponível.
    """
    alert = db.query(SuspiciousProduct).filter(SuspiciousProduct.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alerta não encontrado")

    # 1) Se tivermos ml_item_id, usar API pública do Mercado Livre para obter o permalink exato
    ml_item_id = getattr(alert, 'ml_item_id', None)
    if ml_item_id:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                ml_res = await client.get(f"https://api.mercadolibre.com/items/{ml_item_id}")
                if ml_res.status_code == 200:
                    payload = ml_res.json()
                    permalink = payload.get("permalink")
                    status_ml = payload.get("status")  # active | paused | closed | ...
                    # Persistir permalink caso não esteja salvo
                    if permalink and not alert.product_url:
                        alert.product_url = permalink
                        db.commit()
                    if permalink:
                        return {
                            "available": status_ml == "active",
                            "url": permalink,
                            "permalink": permalink,
                            "status_ml": status_ml,
                            "ml_item_id": ml_item_id
                        }
        except Exception:
            # Ignorar falha e seguir para validação por HTTP
            pass

    # 2) Sem ml_item_id ou sem sucesso na API: tentar validar a URL existente
    if not alert.product_url:
        # Fallback: tentar encontrar o primeiro resultado exato pela busca (nome + PN)
        try:
            search_terms = (alert.title or "").strip()
            product = db.query(Product).filter(Product.id == alert.product_id).first()
            if product:
                # Prioriza PN e nome
                composed = f"{product.name or ''} {product.pn or ''}".strip()
                if composed:
                    search_terms = composed
            url_guess = find_first_product(search_terms) if search_terms else None
            if url_guess:
                # Persistir para os próximos acessos
                alert.product_url = url_guess
                db.commit()
                return {"available": True, "url": url_guess, "ml_item_id": ml_item_id, "resolved": "search"}
        except Exception:
            pass
        return {"available": False, "reason": "missing", "message": "Alerta não possui URL do anúncio", "ml_item_id": ml_item_id}

    url = alert.product_url
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=10) as client:
            # Alguns anúncios exigem GET para resolver redirecionamentos
            resp = await client.get(url, headers={"user-agent": "Mozilla/5.0"})
            final_url = str(resp.url)
            if resp.status_code == 200:
                # Alguns links de listagem chegam como página de resultados com o item_id no querystring
                # Ex.: ...pdp_filters=item_id:MLB3897978171...
                import re
                m = re.search(r"item_id:?\s*(MLB\d+)", final_url)
                if m:
                    candidate_id = m.group(1)
                    try:
                        async with httpx.AsyncClient(timeout=10) as c2:
                            r2 = await c2.get(f"https://api.mercadolibre.com/items/{candidate_id}")
                            if r2.status_code == 200:
                                payload2 = r2.json()
                                permalink2 = payload2.get("permalink")
                                status2 = payload2.get("status")
                                if permalink2:
                                    if not alert.product_url:
                                        alert.product_url = permalink2
                                        db.commit()
                                    return {"available": status2 == "active", "url": permalink2, "status_ml": status2, "ml_item_id": candidate_id}
                    except Exception:
                        pass
                return {"available": True, "url": final_url, "ml_item_id": ml_item_id}
            # 404/410 ou outros códigos
            return {"available": False, "status": resp.status_code, "url": final_url, "ml_item_id": ml_item_id}
    except Exception as e:
        return {"available": False, "reason": "error", "message": str(e), "ml_item_id": ml_item_id}

@router.get("/stats")
async def get_alert_stats(
    days: int = Query(30, description="Número de dias para calcular estatísticas"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna estatísticas dos alertas.
    """
    try:
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Contar alertas por nível de suspeita
        critical_count = db.query(SuspiciousProduct).filter(
            and_(
                SuspiciousProduct.created_at >= cutoff_date,
                SuspiciousProduct.suspicion_level == "CRITICAL"
            )
        ).count()
        
        high_count = db.query(SuspiciousProduct).filter(
            and_(
                SuspiciousProduct.created_at >= cutoff_date,
                SuspiciousProduct.suspicion_level == "HIGH"
            )
        ).count()
        
        medium_count = db.query(SuspiciousProduct).filter(
            and_(
                SuspiciousProduct.created_at >= cutoff_date,
                SuspiciousProduct.suspicion_level == "MEDIUM"
            )
        ).count()
        
        # Contar alertas não verificados
        unverified_count = db.query(SuspiciousProduct).filter(
            and_(
                SuspiciousProduct.created_at >= cutoff_date,
                SuspiciousProduct.is_verified == False
            )
        ).count()
        
        # Contar possíveis falsificações (HIGH + CRITICAL + MEDIUM)
        fake_product_count = critical_count + high_count + medium_count
        
        return {
            "success": True,
            "stats": {
                "critical": critical_count,
                "highRisk": high_count,
                "medium": medium_count,
                "possibleCounterfeit": fake_product_count,
                "unread": unverified_count,
                "total": critical_count + high_count + medium_count
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao calcular estatísticas: {str(e)}"
        )

@router.patch("/{alert_id}/mark-read")
async def mark_alert_as_read(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Marca um alerta como lido/verificado.
    """
    try:
        alert = db.query(SuspiciousProduct).filter(SuspiciousProduct.id == alert_id).first()
        
        if not alert:
            raise HTTPException(status_code=404, detail="Alerta não encontrado")
        
        alert.is_verified = True
        db.commit()
        
        return {
            "success": True,
            "message": "Alerta marcado como lido"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao marcar alerta como lido: {str(e)}"
        )

@router.patch("/{alert_id}/mark-false-positive")
async def mark_alert_as_false_positive(
    alert_id: int,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Marca um alerta como falso positivo.
    """
    try:
        alert = db.query(SuspiciousProduct).filter(SuspiciousProduct.id == alert_id).first()
        
        if not alert:
            raise HTTPException(status_code=404, detail="Alerta não encontrado")
        
        alert.is_false_positive = True
        alert.is_verified = True
        if notes:
            alert.notes = notes
        db.commit()
        
        return {
            "success": True,
            "message": "Alerta marcado como falso positivo"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao marcar alerta como falso positivo: {str(e)}"
        )

@router.delete("/{alert_id}")
async def delete_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Exclui um alerta.
    """
    try:
        alert = db.query(SuspiciousProduct).filter(SuspiciousProduct.id == alert_id).first()
        
        if not alert:
            raise HTTPException(status_code=404, detail="Alerta não encontrado")
        
        db.delete(alert)
        db.commit()
        
        return {
            "success": True,
            "message": "Alerta excluído com sucesso"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao excluir alerta: {str(e)}"
        )
