from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.models.user import User
from app.core.config import settings

def init_db(db: Session) -> None:
    # Verifica se já existe um usuário admin
    user = db.query(User).filter(User.email == "admin@example.com").first()
    if not user:
        user = User(
            email="admin@example.com",
            hashed_password=get_password_hash("admin123"),
            is_active=True,
            is_superuser=True,
            full_name="Admin User"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
