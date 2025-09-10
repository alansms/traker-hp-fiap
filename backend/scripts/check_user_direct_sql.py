"""
Script para verificar o status do usuário sistemas@smstecnologia.com.br usando SQL direto
"""
import psycopg2
import os
import requests
import json
from psycopg2.extras import RealDictCursor

def check_user_with_sql():
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

        # Verificar se a tabela users existe
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'users';
        """)

        if not cursor.fetchone():
            print("❌ Tabela 'users' não encontrada no banco de dados!")
            return False

        # Buscar o usuário específico
        cursor.execute("""
            SELECT id, email, full_name, role, is_active, is_superuser, 
                   approval_status, is_verified, created_at
            FROM users 
            WHERE email = %s;
        """, ('sistemas@smstecnologia.com.br',))

        user = cursor.fetchone()

        if not user:
            print("❌ Usuário sistemas@smstecnologia.com.br NÃO ENCONTRADO no sistema!")
            print("\n📋 Verificando todos os usuários existentes:")

            cursor.execute("""
                SELECT email, role, is_active, is_superuser, approval_status
                FROM users 
                ORDER BY created_at DESC;
            """)

            all_users = cursor.fetchall()
            for u in all_users:
                print(f"  📧 {u['email']} | Role: {u['role']} | Ativo: {u['is_active']} | Super: {u['is_superuser']} | Status: {u['approval_status']}")

            return False

        print(f"\n✅ Usuário encontrado no banco de dados:")
        print(f"  📧 Email: {user['email']}")
        print(f"  👤 Nome: {user['full_name']}")
        print(f"  🏷️  Role: {user['role']}")
        print(f"  ✅ Ativo: {user['is_active']}")
        print(f"  🔑 Superuser: {user['is_superuser']}")
        print(f"  📋 Status Aprovação: {user['approval_status']}")
        print(f"  ✔️  Verificado: {user['is_verified']}")
        print(f"  📅 Criado em: {user['created_at']}")

        # Verificar se tem as permissões corretas
        if user['role'] == 'admin' and user['is_superuser'] and user['is_active']:
            print("\n✅ Usuário tem todas as permissões necessárias!")
        else:
            print("\n⚠️  Usuário pode ter problemas de permissão:")
            if user['role'] != 'admin':
                print(f"  - Role não é admin: {user['role']}")
            if not user['is_superuser']:
                print(f"  - Não é superuser: {user['is_superuser']}")
            if not user['is_active']:
                print(f"  - Não está ativo: {user['is_active']}")

        cursor.close()
        conn.close()
        return user

    except Exception as e:
        print(f"❌ Erro ao conectar ao banco de dados: {e}")
        return False

def test_api_endpoint():
    """Testa o endpoint /me da API para verificar se retorna os dados corretos"""
    print("\n🔍 Testando endpoint /me da API...")

    try:
        # Primeiro fazer login para obter o token
        login_url = "http://localhost:8000/api/auth/login"
        login_data = {
            "email": "sistemas@smstecnologia.com.br",
            "password": "sistemas123"  # Assumindo esta senha - ajuste se necessário
        }

        # Fazer login
        headers = {"Content-Type": "application/json"}
        response = requests.post(login_url, json=login_data, headers=headers)

        if response.status_code != 200:
            print(f"❌ Erro no login: Status {response.status_code}")
            print(f"Response: {response.text}")
            return False

        token_data = response.json()
        access_token = token_data.get("access_token")

        if not access_token:
            print("❌ Token de acesso não encontrado na resposta do login")
            return False

        print("✅ Login realizado com sucesso!")

        # Testar endpoint /me
        me_url = "http://localhost:8000/api/auth/me"
        auth_headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        me_response = requests.get(me_url, headers=auth_headers)

        if me_response.status_code != 200:
            print(f"❌ Erro no endpoint /me: Status {me_response.status_code}")
            print(f"Response: {me_response.text}")
            return False

        user_data = me_response.json()

        print("\n✅ Dados retornados pelo endpoint /me:")
        print(json.dumps(user_data, indent=2, ensure_ascii=False))

        # Verificar campos importantes
        if 'role' in user_data:
            print(f"\n🏷️  Campo 'role' encontrado: {user_data['role']}")
        else:
            print("\n❌ Campo 'role' NÃO encontrado na resposta!")

        if 'is_superuser' in user_data:
            print(f"🔑 Campo 'is_superuser' encontrado: {user_data['is_superuser']}")
        else:
            print("❌ Campo 'is_superuser' NÃO encontrado na resposta!")

        return user_data

    except requests.exceptions.ConnectionError:
        print("❌ Erro de conexão - verifique se o backend está rodando em http://localhost:8000")
        return False
    except Exception as e:
        print(f"❌ Erro ao testar API: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Verificando status do usuário sistemas@smstecnologia.com.br")
    print("=" * 60)

    # Verificar no banco de dados
    print("\n1️⃣  VERIFICAÇÃO NO BANCO DE DADOS:")
    db_user = check_user_with_sql()

    # Testar endpoint da API
    print("\n2️⃣  TESTE DO ENDPOINT /ME:")
    api_user = test_api_endpoint()

    # Comparar resultados
    print("\n3️⃣  COMPARAÇÃO DOS RESULTADOS:")
    if db_user and api_user:
        print("✅ Usuário encontrado tanto no DB quanto na API")

        # Comparar campos importantes
        db_role = db_user.get('role')
        api_role = api_user.get('role')

        if db_role == api_role:
            print(f"✅ Role consistente: DB={db_role}, API={api_role}")
        else:
            print(f"❌ Role inconsistente: DB={db_role}, API={api_role}")

        db_superuser = db_user.get('is_superuser')
        api_superuser = api_user.get('is_superuser')

        if db_superuser == api_superuser:
            print(f"✅ is_superuser consistente: DB={db_superuser}, API={api_superuser}")
        else:
            print(f"❌ is_superuser inconsistente: DB={db_superuser}, API={api_superuser}")

    elif db_user and not api_user:
        print("⚠️  Usuário existe no DB mas API não funcionou")
    elif not db_user and api_user:
        print("⚠️  API funcionou mas usuário não encontrado no DB")
    else:
        print("❌ Problemas tanto no DB quanto na API")
