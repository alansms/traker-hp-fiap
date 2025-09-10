"""
Script para promover o usuário admin@example.com para administrador
"""
from app.models.user import User
from app.db.session import SessionLocal

def promote_admin():
    try:
        # Conectar ao banco de dados
        db = SessionLocal()

        # Buscar o usuário admin@example.com
        user = db.query(User).filter(User.email == 'admin@example.com').first()

        if not user:
            print("Usuário admin@example.com não encontrado! Criando usuário...")
            # Criar o usuário administrador se não existir
            from app.core.security import get_password_hash
            new_admin = User(
                email='admin@example.com',
                full_name='Administrador',
                hashed_password=get_password_hash('admin123'),
                role='admin',
                is_active=True,
                is_superuser=True,
                is_verified=True,
                approval_status='approved'
            )
            db.add(new_admin)
            db.commit()
            print("Usuário admin@example.com criado com sucesso como administrador!")
            return

        # Atualizar o papel e status do usuário
        print(f"Encontrado usuário: {user.email}, Papel atual: {user.role}, Is_Superuser: {user.is_superuser}")

        user.role = 'admin'
        user.is_superuser = True
        user.is_active = True
        user.is_verified = True
        user.approval_status = 'approved'

        db.commit()
        print(f"Usuário {user.email} promovido para administrador com sucesso!")

    except Exception as e:
        print(f"Erro ao promover usuário: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    promote_admin()
