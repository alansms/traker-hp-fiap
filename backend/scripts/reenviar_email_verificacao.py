#!/usr/bin/env python
"""
Script para reenviar email de verificação para o último usuário cadastrado no sistema.
"""

import asyncio
import sys
import os
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timedelta
import secrets

# Adiciona o diretório pai ao path para poder importar os módulos da aplicação
sys.path.append("/app")

from app.db.session import SessionLocal
from app.models.user import User
from app.services.email import send_account_verification_email

async def reenviar_email_verificacao():
    """
    Localiza o último usuário cadastrado e reenvia o email de verificação.
    """
    db = SessionLocal()
    try:
        # Encontra o último usuário cadastrado
        ultimo_usuario = db.query(User).order_by(desc(User.created_at)).first()

        if not ultimo_usuario:
            print("Nenhum usuário encontrado no sistema.")
            return False

        # Se o usuário já está verificado, pergunta se deseja reenviar mesmo assim
        if ultimo_usuario.is_verified:
            print(f"Usuário {ultimo_usuario.email} já está verificado. Reenviar email mesmo assim? (s/n)")
            resposta = input().lower()
            if resposta != 's':
                print("Operação cancelada.")
                return False

        # Gera um novo token de verificação
        novo_token = secrets.token_urlsafe(32)
        expiracao_token = datetime.utcnow() + timedelta(hours=48)

        # Atualiza o token no banco de dados
        ultimo_usuario.verification_token = novo_token
        ultimo_usuario.verification_token_expires_at = expiracao_token
        db.commit()

        # Reenvia o email de verificação
        resultado = await send_account_verification_email(
            to_email=ultimo_usuario.email,
            user_name=ultimo_usuario.full_name,
            verification_token=novo_token,
            role=ultimo_usuario.role
        )

        if resultado:
            print(f"Email de verificação reenviado com sucesso para {ultimo_usuario.email}.")
            return True
        else:
            print(f"Falha ao enviar email para {ultimo_usuario.email}.")
            return False

    except Exception as e:
        print(f"Erro ao reenviar email de verificação: {str(e)}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(reenviar_email_verificacao())
