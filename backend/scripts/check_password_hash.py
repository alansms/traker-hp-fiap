"""
Script para verificar o hash da senha do usuário sistemas@smstecnologia.com.br
"""
import psycopg2
from psycopg2.extras import RealDictCursor
from app.core.security import verify_password

def check_password_hash():
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

        # Buscar o hash da senha do usuário
        cursor.execute("""
            SELECT email, hashed_password
            FROM users 
            WHERE email = %s;
        """, ('sistemas@smstecnologia.com.br',))

        user = cursor.fetchone()

        if not user:
            print("❌ Usuário não encontrado!")
            return

        print(f"📧 Email: {user['email']}")
        print(f"🔐 Hash da senha: {user['hashed_password']}")

        # Testar senhas comuns
        common_passwords = [
            "sistemas123",
            "123456",
            "admin123",
            "sistema123",
            "sistemas",
            "admin",
            "password",
            "123",
            "Sistemas123",
            "smstecnologia",
            "sms123"
        ]

        print("\n🔍 Testando senhas comuns:")
        for password in common_passwords:
            try:
                if verify_password(password, user['hashed_password']):
                    print(f"✅ SENHA ENCONTRADA: '{password}'")
                    return password
                else:
                    print(f"❌ '{password}' - incorreta")
            except Exception as e:
                print(f"❌ Erro ao verificar '{password}': {e}")

        print("\n⚠️  Nenhuma senha comum funcionou. O hash da senha está acima para referência.")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"❌ Erro ao conectar ao banco de dados: {e}")

if __name__ == "__main__":
    print("🔍 Verificando hash da senha do usuário sistemas@smstecnologia.com.br")
    print("=" * 60)
    check_password_hash()
