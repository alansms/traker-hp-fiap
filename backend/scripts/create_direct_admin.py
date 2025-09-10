#!/usr/bin/env python3
import os
import sys
from datetime import datetime
import argparse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import bcrypt

# Configuração do parser de argumentos
parser = argparse.ArgumentParser(description='Criar usuário administrador diretamente no banco de dados')
parser.add_argument('email', type=str, help='Email do usuário admin')
parser.add_argument('password', type=str, help='Senha do usuário admin')
parser.add_argument('full_name', type=str, help='Nome completo do usuário admin')
args = parser.parse_args()

# Dados do usuário a ser criado
email = args.email
password = args.password
full_name = args.full_name

# Configurações de conexão com o banco de dados
DB_USER = os.getenv('POSTGRES_USER', 'postgres')
DB_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'postgres')
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('POSTGRES_DB', 'mercadolivre')

# String de conexão
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

try:
    # Conectar ao banco de dados
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    # Gerar hash da senha
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password_bytes, salt).decode('utf-8')

    # Verificar se o usuário já existe
    user_exists = session.execute(
        f"SELECT id FROM users WHERE email = '{email}'"
    ).fetchone()

    current_time = datetime.utcnow()

    if user_exists:
        # Atualizar usuário existente
        session.execute(
            f"""
            UPDATE users SET 
                hashed_password = '{hashed_password}',
                full_name = '{full_name}',
                is_active = TRUE,
                is_verified = TRUE,
                is_superuser = TRUE,
                role = 'admin',
                approval_status = 'approved',
                updated_at = '{current_time}'
            WHERE email = '{email}'
            """
        )
        print(f"Usuário {email} atualizado com sucesso!")
    else:
        # Inserir novo usuário
        session.execute(
            f"""
            INSERT INTO users (
                email, hashed_password, full_name, is_active, is_verified, 
                is_superuser, role, approval_status, created_at, updated_at
            ) VALUES (
                '{email}', '{hashed_password}', '{full_name}', TRUE, TRUE, 
                TRUE, 'admin', 'approved', '{current_time}', '{current_time}'
            )
            """
        )
        print(f"Usuário admin {email} criado com sucesso!")

    # Confirmar a transação
    session.commit()
    print(f"Credenciais: Email: {email}, Senha: {password}")
    print("Este usuário tem acesso total ao sistema como administrador.")

except Exception as e:
    print(f"Erro ao criar/atualizar usuário admin: {e}")
    if 'session' in locals():
        session.rollback()
    sys.exit(1)
finally:
    if 'session' in locals():
        session.close()
