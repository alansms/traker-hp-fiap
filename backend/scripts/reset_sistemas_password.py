"""
Script para resetar a senha do usuário sistemas@smstecnologia.com.br
"""
import psycopg2
import sys
import os
from psycopg2.extras import RealDictCursor

# Adicionar o diretório do backend ao path para importar os módulos
sys.path.append('/Users/alansms/Documents/FIAP/2025/mercado-livre-tracker-v2/backend')

try:
    from app.core.security import get_password_hash
except ImportError:
    print("❌ Erro ao importar módulos do backend. Certifique-se de estar no diretório correto.")
    sys.exit(1)

def reset_user_password():
    # Nova senha que vamos definir
    new_password = "sistemas123"

    # Configuração da conexão local
    db_config = {
        'host': 'localhost',
        'port': 5432,
        'database': 'ml_tracker',
        'user': 'postgres',
        'password': 'postgres'
    }

    try:
        # Conectar ao banco de dados
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        print("✅ Conectado ao banco de dados PostgreSQL com sucesso!")

        # Verificar se o usuário existe
        cursor.execute("""
            SELECT id, email, role, is_superuser
            FROM users 
            WHERE email = %s;
        """, ('sistemas@smstecnologia.com.br',))

        user = cursor.fetchone()

        if not user:
            print("❌ Usuário sistemas@smstecnologia.com.br não encontrado!")
            return False

        print(f"✅ Usuário encontrado:")
        print(f"  📧 Email: {user['email']}")
        print(f"  🏷️  Role: {user['role']}")
        print(f"  🔑 Superuser: {user['is_superuser']}")

        # Gerar hash da nova senha
        new_password_hash = get_password_hash(new_password)

        print(f"\n🔐 Gerando novo hash para a senha: '{new_password}'")

        # Atualizar a senha no banco de dados
        cursor.execute("""
            UPDATE users 
            SET hashed_password = %s
            WHERE email = %s;
        """, (new_password_hash, 'sistemas@smstecnologia.com.br'))

        # Confirmar a alteração
        conn.commit()

        print(f"✅ Senha atualizada com sucesso!")
        print(f"📝 Nova senha: {new_password}")
        print(f"🔐 Hash: {new_password_hash}")

        cursor.close()
        conn.close()

        return True

    except Exception as e:
        print(f"❌ Erro ao resetar senha: {e}")
        return False

if __name__ == "__main__":
    print("🔧 Resetando senha do usuário sistemas@smstecnologia.com.br")
    print("=" * 60)

    if reset_user_password():
        print("\n✅ SUCESSO! Agora você pode fazer login com:")
        print("📧 Email: sistemas@smstecnologia.com.br")
        print("🔐 Senha: sistemas123")
    else:
        print("\n❌ Falha ao resetar a senha.")
