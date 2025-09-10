#!/usr/bin/env python
# Script para promover um usuário diretamente no banco de dados,
# contornando possíveis problemas com relações nos modelos

import os
import sys
import argparse
import psycopg2
from psycopg2 import sql

def promote_admin_direct(email):
    """
    Conecta diretamente ao banco de dados e promove o usuário para administrador
    """
    # Parâmetros de conexão - ajuste conforme necessário
    conn_params = {
        "host": "localhost",
        "database": "ml_tracker",
        "user": "postgres",
        "password": "postgres",
        "port": "5432"
    }

    try:
        print(f"Tentando conectar ao banco de dados PostgreSQL em {conn_params['host']}...")
        conn = psycopg2.connect(**conn_params)
        cursor = conn.cursor()

        print(f"Conectado com sucesso! Procurando usuário com email: {email}")

        # Primeiro, verifique se o usuário existe
        cursor.execute("SELECT id, email, full_name, role FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        if not user:
            print(f"Usuário com email '{email}' não encontrado no banco de dados.")

            # Listar usuários disponíveis para referência
            cursor.execute("SELECT id, email, full_name, role FROM users LIMIT 10")
            users = cursor.fetchall()

            if users:
                print("\nUsuários disponíveis no sistema:")
                for u in users:
                    print(f"ID: {u[0]}, Email: {u[1]}, Nome: {u[2]}, Papel: {u[3]}")
            else:
                print("Não há usuários cadastrados no sistema.")

            return

        user_id, user_email, user_name, user_role = user
        print(f"Usuário encontrado: {user_name} ({user_email}), Papel atual: {user_role}")

        if user_role == 'admin':
            # Verificar se já é superusuário
            cursor.execute("SELECT is_superuser FROM users WHERE id = %s", (user_id,))
            is_super = cursor.fetchone()[0]

            if is_super:
                print(f"O usuário {user_name} ({user_email}) já é administrador e superusuário.")
                return

        # Atualizar o usuário para administrador
        update_query = """
        UPDATE users 
        SET role = 'admin', 
            is_superuser = TRUE, 
            is_active = TRUE,
            is_verified = TRUE,
            approval_status = 'approved'
        WHERE id = %s
        """

        cursor.execute(update_query, (user_id,))
        conn.commit()

        print(f"✅ Usuário {user_name} ({user_email}) foi promovido para administrador com sucesso!")
        print("   O usuário agora tem privilégios completos no sistema.")

    except Exception as e:
        print(f"❌ Erro ao promover usuário: {str(e)}")
        if 'conn' in locals() and conn:
            conn.rollback()
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()
            print("Conexão com o banco de dados fechada.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Promove um usuário a administrador diretamente no banco de dados")
    parser.add_argument("email", nargs="?", default="alan@smstecnologia.com.br",
                       help="Email do usuário a ser promovido (padrão: alan@smstecnologia.com.br)")

    args = parser.parse_args()
    email = args.email

    print(f"=== Promoção de Usuário para Administrador ===")
    print(f"Iniciando promoção direta do usuário {email}...")
    promote_admin_direct(email)
    print("=== Script concluído ===")
