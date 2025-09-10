#!/usr/bin/env python
# Script para garantir que um usuário tenha permissões de administrador
# Mantém a senha original do usuário

import sys
import os
import psycopg2

def force_admin_access(email):
    """
    Garante que um usuário tenha permissões de administrador completas
    Mantém a senha original
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
        print(f"Conectando ao banco de dados PostgreSQL...")
        conn = psycopg2.connect(**conn_params)
        cursor = conn.cursor()

        # Verificar se o usuário existe
        cursor.execute("""
            SELECT id, email, full_name, role, is_superuser 
            FROM users 
            WHERE email = %s
        """, (email,))

        user = cursor.fetchone()

        if not user:
            print(f"❌ Usuário {email} não encontrado no banco de dados.")
            return

        user_id, user_email, user_name, role, is_superuser = user
        print(f"Usuário encontrado: {user_name} ({user_email})")
        print(f"Status atual: Papel={role}, Superusuário={is_superuser}")

        # Atualizar apenas as permissões, mantendo a senha original
        update_query = """
            UPDATE users 
            SET role = 'admin', 
                is_superuser = TRUE, 
                is_active = TRUE,
                is_verified = TRUE,
                approval_status = 'approved'
            WHERE id = %s
            RETURNING id
        """

        # Executar a atualização
        cursor.execute(update_query, (user_id,))
        updated = cursor.fetchone()

        if updated:
            conn.commit()
            print(f"✅ Usuário {user_email} promovido a administrador com sucesso!")
            print(f"A senha original foi mantida.")
            print(f"O usuário agora tem permissões completas de administrador.")
            print(f"Por favor, saia e faça login novamente com a senha original para aplicar as alterações.")
        else:
            print(f"❌ Falha ao atualizar o usuário.")

        # Verificar as alterações
        cursor.execute("""
            SELECT id, email, full_name, role, is_superuser, is_active, is_verified, approval_status
            FROM users 
            WHERE id = %s
        """, (user_id,))

        updated_user = cursor.fetchone()
        if updated_user:
            _, email, name, role, is_super, is_active, is_verified, approval = updated_user
            print("\nStatus atual do usuário:")
            print(f"Email: {email}")
            print(f"Nome: {name}")
            print(f"Papel: {role}")
            print(f"Superusuário: {is_super}")
            print(f"Ativo: {is_active}")
            print(f"Verificado: {is_verified}")
            print(f"Aprovação: {approval}")

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
    import argparse

    parser = argparse.ArgumentParser(description="Garante que um usuário tenha permissões de administrador")
    parser.add_argument("--email", default="sistemas@smstecnologia.com.br",
                       help="Email do usuário (padrão: sistemas@smstecnologia.com.br)")

    args = parser.parse_args()

    print("=== Garantindo Acesso de Administrador (Mantendo Senha Original) ===")
    force_admin_access(args.email)
    print("=== Script concluído ===")
