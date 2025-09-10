#!/usr/bin/env python
# Script para criar a tabela de usuários e adicionar o usuário administrador diretamente

import psycopg2
import argparse
import hashlib

def create_user_table_and_admin(email, password, full_name="Administrador"):
    """
    Cria a tabela users e adiciona um usuário administrador
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
        print(f"Conectando ao banco de dados PostgreSQL em {conn_params['host']}...")
        conn = psycopg2.connect(**conn_params)
        cursor = conn.cursor()

        print("Conexão estabelecida! Verificando se a tabela users existe...")

        # Verificar se a tabela users já existe
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            );
        """)

        table_exists = cursor.fetchone()[0]

        if not table_exists:
            print("Tabela users não existe. Criando tabela...")

            # Criar a tabela users com os campos mínimos necessários
            cursor.execute("""
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    full_name VARCHAR(255),
                    hashed_password VARCHAR(255) NOT NULL,
                    role VARCHAR(50) DEFAULT 'visitor',
                    is_active BOOLEAN DEFAULT TRUE,
                    is_superuser BOOLEAN DEFAULT FALSE,
                    is_verified BOOLEAN DEFAULT FALSE,
                    approval_status VARCHAR(50) DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)

            conn.commit()
            print("Tabela users criada com sucesso!")
        else:
            print("Tabela users já existe.")

        # Verificar se o usuário administrador já existe
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        # Função simples para hash de senha (em produção use um algoritmo seguro como bcrypt)
        def hash_password(password):
            return hashlib.sha256(password.encode()).hexdigest()

        if not user:
            print(f"Criando usuário administrador: {email}...")

            # Criar o usuário administrador
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

            conn.commit()
            print(f"✅ Usuário administrador {email} criado com sucesso!")

        else:
            print(f"Usuário {email} já existe. Atualizando para administrador...")

            # Atualizar o usuário para administrador
            cursor.execute("""
                UPDATE users 
                SET role = 'admin', 
                    is_superuser = TRUE, 
                    is_active = TRUE,
                    is_verified = TRUE,
                    approval_status = 'approved'
                WHERE email = %s
            """, (email,))

            conn.commit()
            print(f"✅ Usuário {email} atualizado para administrador com sucesso!")

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
    parser = argparse.ArgumentParser(description="Cria a tabela de usuários e adiciona um usuário administrador")
    parser.add_argument("--email", default="alan@smstecnologia.com.br",
                       help="Email do usuário administrador (padrão: alan@smstecnologia.com.br)")
    parser.add_argument("--password", default="@#Pi231179",
                       help="Senha do usuário administrador (padrão: @#Pi231179)")
    parser.add_argument("--name", default="Alan Maximiano",
                       help="Nome completo do usuário (padrão: Alan Maximiano)")

    args = parser.parse_args()

    print("=== Criação de Tabela Users e Usuário Administrador ===")
    create_user_table_and_admin(args.email, args.password, args.name)
    print("=== Script concluído ===")
