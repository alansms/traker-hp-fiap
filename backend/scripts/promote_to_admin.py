#!/usr/bin/env python
# Script para promover o usuário Alan Maximiano para administrador

import os
import sys

# Adicionar o diretório do projeto ao PATH para importar os módulos necessários
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

try:
    # Importações específicas do aplicativo
    from app.db.session import SessionLocal, Base, engine
    from app.models.user import User

    def promote_to_admin(user_email_or_name):
        """
        Promove um usuário para o papel de administrador com base no email ou nome
        """
        db = SessionLocal()
        try:
            # Buscar o usuário pelo nome completo ou email
            user = db.query(User).filter(
                (User.full_name.ilike(f"%{user_email_or_name}%")) |
                (User.email.ilike(f"%{user_email_or_name}%"))
            ).first()

            if not user:
                print(f"Usuário com nome ou email contendo '{user_email_or_name}' não encontrado.")
                print("Usuários disponíveis:")
                users = db.query(User).all()
                for u in users:
                    print(f"ID: {u.id}, Nome: {u.full_name}, Email: {u.email}, Papel: {u.role}")
                return

            # Verificar se o usuário já é admin
            if user.role == "admin":
                print(f"O usuário {user.full_name} ({user.email}) já é administrador.")
                return

            # Atualizar o papel para administrador
            old_role = user.role
            user.role = "admin"
            db.commit()

            print(f"Usuário {user.full_name} ({user.email}) promovido de '{old_role}' para 'admin' com sucesso!")

        except Exception as e:
            db.rollback()
            print(f"Erro ao promover usuário: {str(e)}")
        finally:
            db.close()

    if __name__ == "__main__":
        print("Iniciando script para promover usuário para administrador...")
        promote_to_admin("Alan Maximiano")
        print("Script concluído.")

except ImportError as e:
    print(f"Erro ao importar módulos necessários: {str(e)}")
    print(f"Certifique-se de estar executando o script a partir do diretório raiz do projeto.")
    sys.exit(1)
except Exception as e:
    print(f"Erro inesperado: {str(e)}")
    sys.exit(1)
