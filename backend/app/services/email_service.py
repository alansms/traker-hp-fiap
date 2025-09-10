import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

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
        print("Configurações de email incompletas. Verifique SMTP_SERVER, SMTP_USER e SMTP_PASSWORD")
        print(f"SMTP_SERVER: {settings.SMTP_SERVER}")
        print(f"SMTP_USER: {settings.SMTP_USER}")
        print(f"SMTP_PASSWORD: {'*' * (len(settings.SMTP_PASSWORD) if settings.SMTP_PASSWORD else 0)}")
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

        print(f"Tentando conectar ao servidor SMTP: {settings.SMTP_SERVER}:{settings.SMTP_PORT}")

        # Criar contexto SSL para conexão segura
        context = ssl.create_default_context()

        # Usar conexão apropriada com base na porta
        if settings.SMTP_PORT == 465:
            # Porta 465 usa SSL direto
            print("Usando SSL direto (porta 465)")
            server = smtplib.SMTP_SSL(settings.SMTP_SERVER, settings.SMTP_PORT, context=context, timeout=15)
        else:
            # Porta 587 usa STARTTLS
            print("Usando STARTTLS (porta 587 ou outra)")
            server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT, timeout=15)
            server.ehlo()
            server.starttls(context=context)
            server.ehlo()

        server.set_debuglevel(1)  # Ativar debug para ver detalhes da comunicação

        print(f"Autenticando com usuário: {settings.SMTP_USER}")
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)

        print(f"Enviando email para: {to_email}")
        server.sendmail(settings.SMTP_USER, to_email, message.as_string())
        server.quit()

        print(f"Email enviado com sucesso para {to_email}")
        return True

    except Exception as e:
        print(f"Erro ao enviar email: {e}")
        import traceback
        traceback.print_exc()
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
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cadastro Aprovado</title>
            <style>
                body {{
                    font-family: 'Arial', sans-serif;
                    line-height: 1.6;
                    color: #333333;
                    background-color: #f9f9f9;
                    margin: 0;
                    padding: 0;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #ffffff;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                }}
                .header {{
                    text-align: center;
                    padding-bottom: 20px;
                    border-bottom: 1px solid #eeeeee;
                    margin-bottom: 20px;
                }}
                .logo {{
                    max-width: 180px;
                    margin-bottom: 15px;
                }}
                .success-banner {{
                    background-color: #0096D6; /* Azul HP */
                    color: white;
                    text-align: center;
                    padding: 15px;
                    border-radius: 5px;
                    margin-bottom: 25px;
                }}
                h2 {{
                    color: #0096D6;
                    margin-top: 0;
                }}
                .content {{
                    padding: 0 20px;
                }}
                .button {{
                    display: inline-block;
                    background-color: #0096D6;
                    color: #ffffff !important;
                    text-decoration: none;
                    padding: 12px 30px;
                    border-radius: 4px;
                    margin: 20px 0;
                    font-weight: bold;
                    text-align: center;
                }}
                .footer {{
                    margin-top: 30px;
                    text-align: center;
                    color: #777777;
                    font-size: 12px;
                    border-top: 1px solid #eeeeee;
                    padding-top: 20px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="https://raw.githubusercontent.com/HP-Inc/hp-project/main/logo.png" alt="HP Logo" class="logo" onerror="this.src='https://www.hp.com/content/dam/sites/worldwide/hp-logo.svg';">
                </div>
                
                <div class="success-banner">
                    <h2 style="color: white; margin: 0;">Cadastro Aprovado!</h2>
                </div>
                
                <div class="content">
                    <p>Olá <strong>{user_name}</strong>,</p>
                    
                    <p>Temos o prazer de informar que seu cadastro no <strong>Mercado Livre Tracker</strong> foi aprovado!</p>
                    
                    <p>Agora você tem acesso completo à nossa plataforma de monitoramento de produtos do Mercado Livre, 
                    onde poderá acompanhar preços, receber alertas e analisar tendências.</p>
                    
                    <div style="text-align: center;">
                        <a href="{settings.FRONTEND_URL}/auth/login" class="button">Acessar a Plataforma</a>
                    </div>
                    
                    <p>Se você tiver alguma dúvida ou precisar de assistência, não hesite em entrar em contato com nossa equipe de suporte.</p>
                    
                    <p>Atenciosamente,<br>
                    <strong>Equipe Mercado Livre Tracker</strong></p>
                </div>
                
                <div class="footer">
                    <p>© {settings.CURRENT_YEAR if hasattr(settings, 'CURRENT_YEAR') else '2025'} Mercado Livre Tracker. Todos os direitos reservados.</p>
                    <p>Este é um email automático, por favor não responda.</p>
                </div>
            </div>
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
