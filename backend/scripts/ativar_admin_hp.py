#!/usr/bin/env python3
"""
Script para ativar o usuário admin@hp.com
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.session import SessionLocal

def ativar_admin_hp():
    """Ativa o usuário admin@hp.com"""
    db = SessionLocal()
    try:
        # Verificar se o usuário existe
        usuario = db.execute(text("""
            SELECT id, email, full_name, is_active, is_verified, approval_status, role 
            FROM users 
            WHERE email = 'admin@hp.com'
        """)).fetchone()

        if not usuario:
            print("Usuário admin@hp.com não encontrado no banco de dados!")
            return False

        print(f"Usuário encontrado: {usuario[1]} - {usuario[2]}")

        # Ativar o usuário
        db.execute(text("""
            UPDATE users 
            SET is_active = TRUE, 
                is_verified = TRUE,
                approval_status = 'approved'
            WHERE email = 'admin@hp.com'
        """))
        db.commit()

        print("✅ Usuário admin@hp.com ativado com sucesso!")
        return True

    except Exception as e:
        print(f"❌ Erro ao ativar usuário: {str(e)}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    ativar_admin_hp()
