#!/usr/bin/env python
# Script para criar um novo usuário administrador no sistema

import psycopg2
import hashlib
import argparse

def create_admin_user(email, password, full_name):
    """
    Cria um novo usuário administrador no banco de dados
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

        print(f"Conexão estabelecida! Verificando se o usuário {email} já existe...")

        # Verificar se o usuário já existe
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        # Função simples para hash de senha (em produção use um algoritmo seguro como bcrypt)
        def hash_password(password):
            return hashlib.sha256(password.encode()).hexdigest()

        if user:
            print(f"Usuário {email} já existe. Atualizando para administrador...")

            # Atualizar o usuário existente para administrador
            cursor.execute("""
                UPDATE users 
                SET role = 'admin', 
                    is_superuser = TRUE, 
                    is_active = TRUE,
                    is_verified = TRUE,
                    approval_status = 'approved'
                WHERE email = %s
                RETURNING id
            """, (email,))

            user_id = cursor.fetchone()[0]
            conn.commit()

            print(f"✅ Usuário {email} promovido a administrador com sucesso!")

        else:
            print(f"Usuário {email} não existe. Criando novo usuário administrador...")

            # Criar o novo usuário administrador
            cursor.execute("""
                INSERT INTO users (
                    email, 
                    full_name, 
                    hashed_password, 
                    role, 
                    is_active, 
                    is_superuser, 
                    is_verified, 
                    approval_status
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                email,
                full_name,
                hash_password(password),
                'admin',
                True,
                True,
                True,
                'approved'
            ))

            user_id = cursor.fetchone()[0]
            conn.commit()

            print(f"✅ Novo usuário administrador {email} criado com sucesso!")

        # Verificar os detalhes do usuário após a atualização/criação
        cursor.execute("""
            SELECT email, full_name, role, is_active, is_superuser, is_verified, approval_status
            FROM users
            WHERE id = %s
        """, (user_id,))

        user_details = cursor.fetchone()
        email, name, role, is_active, is_superuser, is_verified, approval_status = user_details

        print("\nDetalhes do usuário administrador:")
        print(f"Email: {email}")
        print(f"Nome: {name}")
        print(f"Função: {role}")
        print(f"Ativo: {is_active}")
        print(f"Superusuário: {is_superuser}")
        print(f"Verificado: {is_verified}")
        print(f"Status de aprovação: {approval_status}")

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
    parser = argparse.ArgumentParser(description="Cria um novo usuário administrador")
    parser.add_argument("--email", default="sistemas@smstecnologia.com.br",
                       help="Email do usuário (padrão: sistemas@smstecnologia.com.br)")
    parser.add_argument("--password", default="Sistemas@123",
                       help="Senha do usuário (padrão: Sistemas@123)")
    parser.add_argument("--name", default="Sistema SMS",
                       help="Nome completo do usuário (padrão: Sistema SMS)")

    args = parser.parse_args()

    print("=== Criação/Promoção de Usuário Administrador ===")
    create_admin_user(args.email, args.password, args.name)
    print("=== Script concluído ===")
