"""
Script para verificar o status atual do usuário sistemas@smstecnologia.com.br
"""
import sys
import os

# Adicionar o diretório raiz do projeto ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.user import User
from app.db.session import SessionLocal

def check_user_status():
    db = None
    try:
        # Conectar ao banco de dados
        db = SessionLocal()
        print("Conectado ao banco de dados com sucesso!")

        # Buscar o usuário sistemas@smstecnologia.com.br
        user = db.query(User).filter(User.email == 'sistemas@smstecnologia.com.br').first()

        if not user:
            print("❌ Usuário sistemas@smstecnologia.com.br NÃO ENCONTRADO no sistema!")
            print("\n📋 Verificando todos os usuários existentes:")
            all_users = db.query(User).all()
            if all_users:
                for u in all_users:
                    print(f"   - {u.email} | Role: {u.role} | Ativo: {u.is_active}")
            else:
                print("   - Nenhum usuário encontrado no banco de dados")
            return False

        # Exibir informações detalhadas sobre o usuário
        print("✅ Usuário ENCONTRADO!")
        print("=" * 50)
        print(f"📧 Email: {user.email}")
        print(f"👤 Nome completo: {user.full_name}")
        print(f"🔑 Função (role): {user.role}")
        print(f"🛡️  Superusuário: {user.is_superuser}")
        print(f"✅ Ativo: {user.is_active}")
        print(f"✔️  Verificado: {user.is_verified}")
        print(f"📋 Status de aprovação: {user.approval_status}")
        print(f"🆔 ID do usuário: {user.id}")
        print("=" * 50)

        # Análise do nível de acesso
        print("\n🔍 ANÁLISE DO NÍVEL DE ACESSO:")
        if user.role == 'admin' and user.is_superuser:
            print("🟢 NÍVEL: ADMINISTRADOR COMPLETO")
            print("   ✅ Pode acessar todas as páginas")
            print("   ✅ Tem privilégios de superusuário")
        elif user.role == 'admin':
            print("🟡 NÍVEL: ADMINISTRADOR BÁSICO")
            print("   ✅ Pode acessar páginas administrativas")
            print("   ⚠️  Não tem privilégios de superusuário")
        elif user.role == 'analyst':
            print("🟠 NÍVEL: ANALISTA")
            print("   ⚠️  Acesso limitado a algumas páginas")
        else:
            print("🔴 NÍVEL: USUÁRIO PADRÃO")
            print("   ❌ Acesso limitado")

        return True

    except Exception as e:
        print(f"❌ Erro ao consultar usuário: {str(e)}")
        return False
    finally:
        if db:
            db.close()

if __name__ == "__main__":
    print("🔍 Verificando status do usuário sistemas@smstecnologia.com.br...")
    print("-" * 60)
    check_user_status()
