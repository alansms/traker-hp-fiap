#!/usr/bin/env python
"""
Script para garantir que o usuário alan@smstecnologia.com.br esteja aprovado no sistema
"""

import sys
import os
from sqlalchemy import text
from app.db.session import SessionLocal

def aprovar_usuario():
    """
    Verifica e aprova o usuário alan@smstecnologia.com.br no sistema
    """
    db = SessionLocal()
    try:
        # Verificar se o usuário existe
        user = db.execute(text(
            "SELECT id, email, full_name, is_active, is_verified, approval_status, role "
            "FROM users WHERE email = 'alan@smstecnologia.com.br'"
        )).fetchone()

        if not user:
            print("Usuário não encontrado. Não foi possível aprovar.")
            return False

        print(f"Usuário encontrado: {user[1]} - {user[2]}")

        # Atualizar o status de aprovação para 'approved'
        db.execute(text(
            "UPDATE users SET approval_status = 'approved', is_active = true "
            "WHERE email = 'alan@smstecnologia.com.br'"
        ))
        db.commit()

        # Verificar se a atualização foi bem-sucedida
        user_atualizado = db.execute(text(
            "SELECT id, email, full_name, is_active, is_verified, approval_status, role "
            "FROM users WHERE email = 'alan@smstecnologia.com.br'"
        )).fetchone()

        print(f"Status atualizado: {user_atualizado[5]}")
        print(f"Status de ativação: {'Ativo' if user_atualizado[3] else 'Inativo'}")

        return True

    except Exception as e:
        print(f"Erro ao aprovar usuário: {str(e)}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    if aprovar_usuario():
        print("✅ Usuário aprovado com sucesso!")
    else:
        print("❌ Falha ao aprovar usuário.")
