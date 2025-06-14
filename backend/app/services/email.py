import smtplib
import ssl
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def send_email(to_email: str, subject: str, body: str, html_body: str = None) -> bool:
    """
    Envia um email usando as configurações SMTP definidas

    Args:
        to_email: Email do destinatário
        subject: Assunto do email
        body: Corpo do email em texto simples
        html_body: Corpo do email em HTML (opcional)

    Returns:
        bool: True se o email foi enviado com sucesso, False caso contrário
    """
    # Verificar se as configurações de email estão definidas
    if not all([settings.SMTP_SERVER, settings.SMTP_USER, settings.SMTP_PASSWORD]):
        logger.error("Configurações de email incompletas")
        logger.debug(f"SMTP_SERVER: {settings.SMTP_SERVER}")
        logger.debug(f"SMTP_USER: {settings.SMTP_USER}")
        logger.debug(f"SMTP_PORT: {settings.SMTP_PORT}")
        return False

    try:
        # Criar mensagem
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = settings.SMTP_USER
        message["To"] = to_email

        # Adicionar versão em texto
        message.attach(MIMEText(body, "plain"))

        # Adicionar versão em HTML, se fornecida
        if html_body:
            message.attach(MIMEText(html_body, "html"))

        logger.info(f"Tentando conectar ao servidor SMTP: {settings.SMTP_SERVER}:{settings.SMTP_PORT}")

        # Criar contexto SSL para conexão segura
        context = ssl.create_default_context()

        try:
            if settings.SMTP_PORT == 465:
                # Porta 465 usa SSL direto
                logger.info("Usando SSL direto (porta 465)")
                with smtplib.SMTP_SSL(settings.SMTP_SERVER, settings.SMTP_PORT, context=context, timeout=30) as server:
                    logger.info("Tentando login no servidor SMTP")
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    logger.info("Login bem-sucedido, enviando email")
                    server.send_message(message)
                    logger.info("Email enviado com sucesso")
                    return True
            else:
                # Outras portas usam STARTTLS
                logger.info(f"Usando STARTTLS (porta {settings.SMTP_PORT})")
                with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT, timeout=30) as server:
                    server.starttls(context=context)
                    logger.info("Tentando login no servidor SMTP")
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    logger.info("Login bem-sucedido, enviando email")
                    server.send_message(message)
                    logger.info("Email enviado com sucesso")
                    return True

        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"Erro de autenticação SMTP: {str(e)}")
            return False
        except smtplib.SMTPException as e:
            logger.error(f"Erro SMTP: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Erro ao enviar email: {str(e)}")
            return False

    except Exception as e:
        logger.error(f"Erro ao configurar mensagem de email: {str(e)}")
        return False

async def send_password_reset_email(to_email: str, reset_code: str) -> bool:
    """
    Envia um email com código de redefinição de senha

    Args:
        to_email: Email do destinatário
        reset_code: Código de redefinição de senha

    Returns:
        bool: True se o email foi enviado com sucesso, False caso contrário
    """
    subject = "Redefinição de Senha - Mercado Livre Tracker"

    # Corpo em texto simples
    body = f"""
    Olá,
    
    Recebemos uma solicitação para redefinir sua senha no Mercado Livre Tracker.
    
    Seu código de verificação é: {reset_code}
    
    Se você não solicitou esta redefinição, por favor ignore este email.
    
    Atenciosamente,
    Equipe Mercado Livre Tracker
    """

    # Corpo em HTML
    html_body = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #1976d2; color: white; padding: 10px 20px; }}
            .content {{ padding: 20px; border: 1px solid #ddd; }}
            .code {{ font-size: 24px; font-weight: bold; color: #1976d2; padding: 10px; background-color: #f5f5f5; letter-spacing: 5px; }}
            .footer {{ font-size: 12px; color: #777; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Redefinição de Senha</h2>
            </div>
            <div class="content">
                <p>Olá,</p>
                <p>Recebemos uma solicitação para redefinir sua senha no Mercado Livre Tracker.</p>
                <p>Seu código de verificação é:</p>
                <p class="code">{reset_code}</p>
                <p>Se você não solicitou esta redefinição, por favor ignore este email.</p>
                <p>Atenciosamente,<br>Equipe Mercado Livre Tracker</p>
            </div>
            <div class="footer">
                Este é um email automático, não responda a esta mensagem.
            </div>
        </div>
    </body>
    </html>
    """

    return await send_email(to_email, subject, body, html_body)

async def send_account_verification_email(to_email: str, user_name: str, verification_token: str, role: str) -> bool:
    """
    Envia um email com link de verificação de conta

    Args:
        to_email: Email do destinatário
        user_name: Nome do usuário
        verification_token: Token de verificação
        role: Papel/função do usuário (admin, analyst, visitor)

    Returns:
        bool: True se o email foi enviado com sucesso, False caso contrário
    """
    subject = "Verificação de Conta - Mercado Livre Tracker"

    # Criando URL de verificação
    verification_url = f"{settings.FRONTEND_URL}/auth/verify/{verification_token}"

    # Traduzindo o role para português
    role_labels = {
        "admin": "Administrador",
        "analyst": "Analista",
        "visitor": "Visitante"
    }
    role_label = role_labels.get(role, role)

    # Corpo em texto simples
    body = f"""
    Olá {user_name},
    
    Uma conta foi criada para você no sistema Mercado Livre Tracker com a função de {role_label}.
    
    Para ativar sua conta, por favor clique no link abaixo ou copie e cole no seu navegador:
    
    {verification_url}
    
    Este link expirará em 48 horas.
    
    Se você não solicitou esta conta, por favor ignore este email.
    
    Atenciosamente,
    Equipe Mercado Livre Tracker
    """

    # Corpo em HTML
    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
            <h2 style="color: #2a41e8;">Verificação de Conta - Mercado Livre Tracker</h2>
            <p>Olá <strong>{user_name}</strong>,</p>
            <p>Uma conta foi criada para você no sistema <strong>Mercado Livre Tracker</strong> com a função de <strong>{role_label}</strong>.</p>
            <p>Para ativar sua conta, por favor clique no botão abaixo:</p>
            <p style="text-align: center;">
                <a href="{verification_url}" style="display: inline-block; padding: 10px 20px; background-color: #2a41e8; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Verificar Minha Conta</a>
            </p>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="background-color: #f5f5f5; padding: 10px; word-break: break-all;">{verification_url}</p>
            <p><em>Este link expirará em 48 horas.</em></p>
            <p>Se você não solicitou esta conta, por favor ignore este email.</p>
            <p>Atenciosamente,<br>Equipe Mercado Livre Tracker</p>
        </div>
    </body>
    </html>
    """

    return await send_email(to_email, subject, body, html_body)

async def send_user_approval_request_email(to_admin_email: str, new_user_email: str, new_user_name: str) -> bool:
    """
    Envia um email para o administrador sobre a solicitação de aprovação de um novo usuário

    Args:
        to_admin_email: Email do administrador
        new_user_email: Email do novo usuário
        new_user_name: Nome do novo usuário

    Returns:
        bool: True se o email foi enviado com sucesso, False caso contrário
    """
    subject = "Nova Solicitação de Cadastro - Mercado Livre Tracker"

    # Corpo em texto simples
    body = f"""
    Olá Administrador,
    
    Um novo usuário se registrou no Mercado Livre Tracker e precisa de aprovação.
    
    Detalhes do usuário:
    Nome: {new_user_name}
    Email: {new_user_email}
    
    Por favor, acesse o painel administrativo para aprovar ou rejeitar este cadastro.
    
    Atenciosamente,
    Equipe Mercado Livre Tracker
    """

    # Corpo em HTML
    html_body = f"""
    <html>
        <body>
            <h2>Nova Solicitação de Cadastro</h2>
            <p>Um novo usuário se registrou no Mercado Livre Tracker e precisa de aprovação.</p>
            
            <h3>Detalhes do usuário:</h3>
            <p><strong>Nome:</strong> {new_user_name}</p>
            <p><strong>Email:</strong> {new_user_email}</p>
            
            <p>Por favor, acesse o <a href="{settings.FRONTEND_URL}/admin/users">painel administrativo</a> para aprovar ou rejeitar este cadastro.</p>
            
            <p>Atenciosamente,<br>
            Equipe Mercado Livre Tracker</p>
        </body>
    </html>
    """

    return await send_email(to_admin_email, subject, body, html_body)

async def send_user_approval_notification(to_user_email: str, user_name: str, is_approved: bool, rejection_reason: str = None) -> bool:
    """
    Envia um email para o usuário informando sobre a aprovação ou rejeição do cadastro

    Args:
        to_user_email: Email do usuário
        user_name: Nome do usuário
        is_approved: Se o cadastro foi aprovado ou rejeitado
        rejection_reason: Motivo da rejeição (se aplicável)

    Returns:
        bool: True se o email foi enviado com sucesso, False caso contrário
    """
    subject = f"Seu cadastro foi {'aprovado' if is_approved else 'rejeitado'} - Mercado Livre Tracker"

    if is_approved:
        # Corpo em texto simples para aprovação
        body = f"""
        Olá {user_name},
        
        Temos o prazer de informar que seu cadastro no Mercado Livre Tracker foi aprovado!
        
        Você já pode acessar a plataforma com suas credenciais.
        
        Atenciosamente,
        Equipe Mercado Livre Tracker
        """

        # Corpo em HTML para aprovação
        html_body = f"""
        <html>
            <body>
                <h2>Cadastro Aprovado!</h2>
                <p>Olá {user_name},</p>
                
                <p>Temos o prazer de informar que seu cadastro no Mercado Livre Tracker foi aprovado!</p>
                
                <p>Você já pode <a href="{settings.FRONTEND_URL}/auth/login">acessar a plataforma</a> com suas credenciais.</p>
                
                <p>Atenciosamente,<br>
                Equipe Mercado Livre Tracker</p>
            </body>
        </html>
        """
    else:
        # Corpo em texto simples para rejeição
        body = f"""
        Olá {user_name},
        
        Infelizmente, seu cadastro no Mercado Livre Tracker foi rejeitado.
        
        Motivo: {rejection_reason or "Não especificado"}
        
        Se você tiver dúvidas, entre em contato com nossa equipe de suporte.
        
        Atenciosamente,
        Equipe Mercado Livre Tracker
        """

        # Corpo em HTML para rejeição
        html_body = f"""
        <html>
            <body>
                <h2>Cadastro Não Aprovado</h2>
                <p>Olá {user_name},</p>
                
                <p>Infelizmente, seu cadastro no Mercado Livre Tracker foi rejeitado.</p>
                
                <p><strong>Motivo:</strong> {rejection_reason or "Não especificado"}</p>
                
                <p>Se você tiver dúvidas, entre em contato com nossa equipe de suporte.</p>
                
                <p>Atenciosamente,<br>
                Equipe Mercado Livre Tracker</p>
            </body>
        </html>
        """

    return await send_email(to_user_email, subject, body, html_body)
