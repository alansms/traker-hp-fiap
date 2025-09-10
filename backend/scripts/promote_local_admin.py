#!/usr/bin/env python
# Script para promover um usuário a administrador usando conexão local
# Uso: python promote_local_admin.py [email]

import os
import sys
import argparse

# Adicionar o diretório do projeto ao PATH para importar os módulos necessários
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

# Modificar a variável de ambiente DATABASE_URL para usar localhost
os.environ["DATABASE_URL"] = "postgresql://postgres:postgres@localhost:5432/ml_tracker"

try:
    # Importações específicas do aplicativo
    from app.db.session import SessionLocal
    from app.models.user import User
    from sqlalchemy.exc import OperationalError

    def promote_to_admin(user_email):
        """
        Promove um usuário para o papel de administrador com base no email
        """
        print(f"Tentando conectar ao banco de dados local...")
        try:
            db = SessionLocal()
            print("Conexão bem-sucedida!")

            try:
                # Buscar o usuário pelo email
                user = db.query(User).filter(User.email == user_email).first()

                if not user:
                    print(f"Usuário com email '{user_email}' não encontrado.")
                    print("Usuários disponíveis:")
                    users = db.query(User).all()
                    for u in users:
                        print(f"ID: {u.id}, Nome: {u.full_name}, Email: {u.email}, Papel: {u.role}")
                    return

                # Verificar se o usuário já é admin
                if user.role == "admin" and user.is_superuser:
                    print(f"O usuário {user.full_name} ({user.email}) já é administrador.")
                    return

                # Atualizar o papel para administrador
                old_role = user.role
                user.role = "admin"
                user.is_superuser = True
                user.is_active = True
                user.is_verified = True
                user.approval_status = "approved"

                db.commit()

                print(f"Usuário {user.full_name} ({user.email}) promovido de '{old_role}' para 'admin' com sucesso!")
                print(f"Status do usuário: Ativo={user.is_active}, Superusuário={user.is_superuser}, Verificado={user.is_verified}")

            except Exception as e:
                db.rollback()
                print(f"Erro ao promover usuário: {str(e)}")
            finally:
                db.close()

        except OperationalError as e:
            print(f"Erro de conexão com o banco de dados: {str(e)}")
            print("Verifique se o PostgreSQL está em execução e se as credenciais estão corretas.")
            print("Você pode modificar as credenciais editando este script.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Promove um usuário a administrador")
    parser.add_argument("email", nargs="?", default="alan@smstecnologia.com.br",
                        help="Email do usuário a ser promovido (padrão: alan@smstecnologia.com.br)")

    args = parser.parse_args()
    email = args.email

    print(f"Iniciando promoção do usuário {email} para administrador...")
    promote_to_admin(email)
    print("Script concluído.")
