#!/usr/bin/env python
"""
Script para ativar completamente o usuário alan@smstecnologia.com.br
e verificar seu status atual no banco de dados
"""

from sqlalchemy import text
from sqlalchemy.orm import Session
from app.db.session import SessionLocal

def ativar_usuario_completo():
    """Ativa completamente o usuário alan@smstecnologia.com.br"""
    db = SessionLocal()
    try:
        # Primeiro verificamos o status atual
        usuario = db.execute(text("""
            SELECT id, email, full_name, is_active, is_verified, approval_status, role 
            FROM users 
            WHERE email = 'alan@smstecnologia.com.br'
        """)).fetchone()

        if not usuario:
            print("Usuário alan@smstecnologia.com.br não encontrado no banco de dados!")
            return False

        print("\n=== STATUS ATUAL DO USUÁRIO ===")
        print(f"ID: {usuario[0]}")
        print(f"Email: {usuario[1]}")
        print(f"Nome: {usuario[2]}")
        print(f"Ativo: {usuario[3]}")
        print(f"Verificado: {usuario[4]}")
        print(f"Status de Aprovação: {usuario[5]}")
        print(f"Função: {usuario[6]}")
        print("==============================\n")

        # Agora ativamos todas as flags necessárias
        db.execute(text("""
            UPDATE users 
            SET is_active = TRUE, 
                is_verified = TRUE,
                approval_status = 'approved'
            WHERE email = 'alan@smstecnologia.com.br'
        """))
        db.commit()

        # Verificamos o status atualizado
        usuario_atualizado = db.execute(text("""
            SELECT id, email, full_name, is_active, is_verified, approval_status, role 
            FROM users 
            WHERE email = 'alan@smstecnologia.com.br'
        """)).fetchone()

        print("\n=== STATUS ATUALIZADO DO USUÁRIO ===")
        print(f"ID: {usuario_atualizado[0]}")
        print(f"Email: {usuario_atualizado[1]}")
        print(f"Nome: {usuario_atualizado[2]}")
        print(f"Ativo: {usuario_atualizado[3]}")
        print(f"Verificado: {usuario_atualizado[4]}")
        print(f"Status de Aprovação: {usuario_atualizado[5]}")
        print(f"Função: {usuario_atualizado[6]}")
        print("===================================\n")

        print("✅ Usuário ativado com sucesso! Agora você deve conseguir fazer login.")
        return True

    except Exception as e:
        print(f"❌ Erro ao ativar usuário: {str(e)}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    ativar_usuario_completo()
