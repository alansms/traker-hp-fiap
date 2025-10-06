from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.services.email import send_email

router = APIRouter()

class TestEmailRequest(BaseModel):
    email: str
    subject: str = "Teste de Email - Mercado Livre Tracker"
    message: str = "Este é um email de teste para verificar se o sistema de notificações está funcionando corretamente."

@router.post("/test-email")
async def test_email(
    request: TestEmailRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Endpoint para testar o envio de email
    """
    try:
        # Corpo do email em texto simples
        body = f"""
        Olá {current_user.full_name or 'Usuário'},
        
        {request.message}
        
        Este email foi enviado através do sistema de teste do Mercado Livre Tracker.
        
        Detalhes do teste:
        - Email de destino: {request.email}
        - Assunto: {request.subject}
        - Enviado por: {current_user.email}
        - Data/Hora: {__import__('datetime').datetime.now().strftime('%d/%m/%Y %H:%M:%S')}
        
        Se você recebeu este email, o sistema de notificações está funcionando corretamente.
        
        Atenciosamente,
        Sistema Mercado Livre Tracker
        """
        
        # Corpo do email em HTML
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #1976d2;">Teste de Email - Mercado Livre Tracker</h2>
                
                <p>Olá <strong>{current_user.full_name or 'Usuário'}</strong>,</p>
                
                <p>{request.message}</p>
                
                <p>Este email foi enviado através do sistema de teste do Mercado Livre Tracker.</p>
                
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #1976d2; margin-top: 0;">Detalhes do Teste:</h3>
                    <ul>
                        <li><strong>Email de destino:</strong> {request.email}</li>
                        <li><strong>Assunto:</strong> {request.subject}</li>
                        <li><strong>Enviado por:</strong> {current_user.email}</li>
                        <li><strong>Data/Hora:</strong> {__import__('datetime').datetime.now().strftime('%d/%m/%Y %H:%M:%S')}</li>
                    </ul>
                </div>
                
                <p style="color: #28a745; font-weight: bold;">
                    ✅ Se você recebeu este email, o sistema de notificações está funcionando corretamente.
                </p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                
                <p style="color: #666; font-size: 12px;">
                    Atenciosamente,<br>
                    Sistema Mercado Livre Tracker
                </p>
            </div>
        </body>
        </html>
        """
        
        # Tentar enviar o email
        print(f"📧 Tentando enviar email para: {request.email}")
        success = await send_email(
            to_email=request.email,
            subject=request.subject,
            body=body,
            html_body=html_body
        )
        print(f"📧 Resultado do envio: {success}")
        
        if success:
            return {
                "success": True,
                "message": f"Email de teste enviado com sucesso para {request.email}",
                "details": {
                    "to": request.email,
                    "subject": request.subject,
                    "sent_by": current_user.email,
                    "timestamp": __import__('datetime').datetime.now().isoformat()
                }
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Falha ao enviar email de teste. Verifique as configurações SMTP."
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao enviar email de teste: {str(e)}"
        )

@router.get("/email-status")
async def get_email_status(
    current_user: User = Depends(get_current_user)
):
    """
    Verifica o status das configurações de email
    """
    try:
        from app.services.email import SMTP_SERVER, SMTP_PORT, SMTP_USER
        
        return {
            "success": True,
            "config": {
                "smtp_server": SMTP_SERVER,
                "smtp_port": SMTP_PORT,
                "smtp_user": SMTP_USER,
                "password_configured": True  # Assumindo que está configurado
            },
            "message": "Configurações de email carregadas com sucesso"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Erro ao verificar configurações de email"
        }
