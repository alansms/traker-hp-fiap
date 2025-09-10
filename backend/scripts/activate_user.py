#!/usr/bin/env python
# Script para verificar e ativar um usuário específico no banco de dados

import psycopg2
import argparse

def activate_user(email):
    """
    Ativa um usuário específico no banco de dados e configura todas as permissões
    """
    # Parâmetros de conexão
    conn_params = {
        "host": "localhost",
        "database": "ml_tracker",
        "user": "postgres",
        "password": "postgres",
        "port": "5432"
    }

    try:
        print(f"Conectando ao banco de dados PostgreSQL em {conn_params['host']}...")
        conn = psycopg2.connect(**conn_params)
        cursor = conn.cursor()

        print(f"Conexão estabelecida! Verificando usuário: {email}")

        # Verificar status atual do usuário
        cursor.execute("""
            SELECT id, email, full_name, is_active, is_verified, approval_status, role
            FROM users
            WHERE email = %s
        """, (email,))

        user = cursor.fetchone()

        if not user:
            print(f"❌ Usuário {email} não encontrado no banco de dados.")
            return

        user_id, user_email, user_name, is_active, is_verified, approval_status, role = user

        print(f"Encontrado usuário: {user_name} ({user_email})")
        print(f"Status atual: Ativo={is_active}, Verificado={is_verified}, Aprovação={approval_status}, Papel={role}")

        # Atualizar todos os status para ativar o usuário completamente
        cursor.execute("""
            UPDATE users
            SET is_active = TRUE,
                is_verified = TRUE,
                approval_status = 'approved',
                role = 'admin',
                is_superuser = TRUE
            WHERE id = %s
            RETURNING is_active, is_verified, approval_status, role, is_superuser
        """, (user_id,))

        updated = cursor.fetchone()
        conn.commit()

        if updated:
            is_active, is_verified, approval_status, role, is_superuser = updated
            print(f"\n✅ Usuário {user_name} ({user_email}) atualizado com sucesso!")
            print(f"Novo status: Ativo={is_active}, Verificado={is_verified}, Aprovação={approval_status}, Papel={role}, Superusuário={is_superuser}")
            print(f"O usuário agora está completamente ativado e pode fazer login no sistema.")
        else:
            print(f"❌ Erro ao atualizar o usuário.")

    except Exception as e:
        print(f"❌ Erro: {str(e)}")
        if 'conn' in locals() and conn:
            conn.rollback()
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()
            print("Conexão com o banco de dados fechada.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ativa um usuário específico no banco de dados")
    parser.add_argument("--email", default="alan@smstecnologia.com.br",
                       help="Email do usuário a ser ativado (padrão: alan@smstecnologia.com.br)")

    args = parser.parse_args()

    print("=== Ativação de Usuário ===")
    activate_user(args.email)
    print("=== Script concluído ===")
