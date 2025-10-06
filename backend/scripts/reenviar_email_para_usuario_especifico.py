#!/usr/bin/env python
"""
Script para reenviar email de verificação para um usuário específico.
"""

import asyncio
import sys
import os
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timedelta
import secrets

# Adiciona o diretório pai ao path para poder importar os módulos da aplicação
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.models.user import User
from app.services.email import send_account_verification_email, send_user_approval_notification

async def reenviar_email_verificacao(email_alvo: str):
    """
    Localiza o usuário com o email especificado e reenvia o email de verificação.

    Args:
        email_alvo: Email do usuário para o qual reenviar a verificação
    """
    db = SessionLocal()
    try:
        # Encontra o usuário pelo email
        usuario = db.query(User).filter(User.email == email_alvo).first()

        if not usuario:
            print(f"Usuário com email {email_alvo} não encontrado.")
            return False

        # Exibe informações do usuário encontrado
        print(f"Usuário encontrado: {usuario.full_name}, Role: {usuario.role}")
        print(f"Status de verificação: {'Verificado' if usuario.is_verified else 'Não verificado'}")
        print(f"Status de aprovação: {'Aprovado' if usuario.is_approved else 'Não aprovado'}")

        # Pergunta qual tipo de email reenviar
        print("\nQual email deseja reenviar?")
        print("1 - Email de verificação de conta")
        print("2 - Email de aprovação de cadastro")
        opcao = input("Digite a opção (1 ou 2): ")

        if opcao == "1":
            # Gera um novo token de verificação
            novo_token = secrets.token_urlsafe(32)
            expiracao_token = datetime.utcnow() + timedelta(hours=48)

            # Atualiza o token no banco de dados
            usuario.verification_token = novo_token
            usuario.verification_token_expires_at = expiracao_token
            db.commit()

            # Reenvia o email de verificação
            resultado = await send_account_verification_email(
                to_email=usuario.email,
                user_name=usuario.full_name,
                verification_token=novo_token,
                role=usuario.role
            )

            if resultado:
                print(f"Email de verificação reenviado com sucesso para {usuario.email}.")
                return True
            else:
                print(f"Falha ao enviar email para {usuario.email}.")
                return False

        elif opcao == "2":
            # Reenvia o email de aprovação
            resultado = await send_user_approval_notification(
                to_user_email=usuario.email,
                user_name=usuario.full_name,
                is_approved=usuario.is_approved,
                rejection_reason=None if usuario.is_approved else "Reenvio solicitado manualmente"
            )

            if resultado:
                print(f"Email de aprovação reenviado com sucesso para {usuario.email}.")
                return True
            else:
                print(f"Falha ao enviar email para {usuario.email}.")
                return False
        else:
            print("Opção inválida.")
            return False

    except Exception as e:
        print(f"Erro ao reenviar email: {str(e)}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        email_alvo = sys.argv[1]
    else:
        email_alvo = input("Digite o email do usuário: ")

    asyncio.run(reenviar_email_verificacao(email_alvo))
