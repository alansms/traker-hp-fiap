"""
Script para criar um usuário administrador diretamente no banco de dados
"""
from app.models.user import User
from app.db.session import SessionLocal
from app.core.security import get_password_hash
from sqlalchemy.exc import IntegrityError
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_admin_user():
    """Cria ou atualiza um usuário administrador no banco de dados"""
    db = SessionLocal()
    try:
        # Buscar o usuário admin@example.com
        admin = db.query(User).filter(User.email == 'admin@example.com').first()

        if admin:
            logger.info(f"Usuário admin encontrado: {admin.email}, role: {admin.role}, is_superuser: {admin.is_superuser}")
            # Atualizar o usuário existente para administrador
            admin.role = 'admin'
            admin.is_superuser = True
            admin.is_active = True
            admin.is_verified = True
            admin.approval_status = 'approved'
            db.commit()
            logger.info(f"Usuário {admin.email} atualizado para administrador com sucesso!")
        else:
            # Criar um novo usuário administrador
            new_admin = User(
                email='admin@example.com',
                full_name='Administrador do Sistema',
                hashed_password=get_password_hash('admin123'),
                role='admin',
                is_superuser=True,
                is_active=True,
                is_verified=True,
                approval_status='approved'
            )
            db.add(new_admin)
            db.commit()
            logger.info(f"Novo usuário administrador criado: admin@example.com")

        # Verificar se o usuário foi atualizado/criado corretamente
        admin = db.query(User).filter(User.email == 'admin@example.com').first()
        logger.info(f"Status atual do admin: email={admin.email}, role={admin.role}, is_superuser={admin.is_superuser}, is_active={admin.is_active}")

        return True
    except IntegrityError as e:
        logger.error(f"Erro de integridade ao criar usuário admin: {str(e)}")
        db.rollback()
        return False
    except Exception as e:
        logger.error(f"Erro ao criar usuário admin: {str(e)}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = create_admin_user()
    if success:
        print("✅ Usuário admin@example.com configurado com sucesso!")
        print("   Email: admin@example.com")
        print("   Senha: admin123")
    else:
        print("❌ Erro ao configurar usuário administrador.")
