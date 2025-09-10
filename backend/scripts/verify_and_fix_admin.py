#!/usr/bin/env python
"""
Script para verificar e garantir acesso de administrador a um usuário específico
verificando explicitamente todos os campos necessários
"""
import psycopg2
import argparse
import sys
import os

def verify_and_fix_admin_access(email):
    """
    Verifica e corrige o acesso de administrador para um usuário específico
    garantindo que todos os campos necessários estejam configurados corretamente
    """
    # Parâmetros de conexão
    conn_params = {
        "host": "localhost",
        "database": "ml_tracker",
        "user": "postgres",
        "password": "postgres",
        "port": "5432"
    }

    try:
        print(f"Conectando ao banco de dados PostgreSQL...")
        conn = psycopg2.connect(**conn_params)
        cursor = conn.cursor()
        conn.autocommit = False  # Usar transação explícita

        # Verificar todos os usuários no sistema
        cursor.execute("""
            SELECT id, email, full_name, role, is_superuser, is_active, is_verified, approval_status
            FROM users
            ORDER BY id
        """)

        all_users = cursor.fetchall()

        if not all_users:
            print("⚠️ Nenhum usuário encontrado no banco de dados!")
            return

        print("\n=== Usuários no sistema ===")
        print(f"{'ID':<3} {'Email':<35} {'Nome':<20} {'Papel':<10} {'Super':<5} {'Ativo':<5} {'Verif':<5} {'Status':<10}")
        print("-" * 95)
        target_user = None

        for user in all_users:
            user_id, user_email, name, role, is_super, is_active, is_verified, approval = user
            print(f"{user_id:<3} {user_email:<35} {name or 'N/A':<20} {role or 'N/A':<10} {is_super or 'N/A':<5} {is_active or 'N/A':<5} {is_verified or 'N/A':<5} {approval or 'N/A':<10}")

            if user_email == email:
                target_user = user

        if not target_user:
            print(f"\n❌ Usuário {email} não encontrado no sistema!")
            return

        user_id, user_email, name, role, is_super, is_active, is_verified, approval = target_user

        print(f"\n=== Status atual do usuário {email} ===")
        print(f"ID: {user_id}")
        print(f"Nome: {name}")
        print(f"Papel (role): {role}")
        print(f"Superusuário: {is_super}")
        print(f"Ativo: {is_active}")
        print(f"Verificado: {is_verified}")
        print(f"Aprovação: {approval}")

        # Verificar se todas as permissões de administrador estão configuradas corretamente
        needs_update = False

        if role != 'admin':
            print(f"\n⚠️ Campo 'role' não está configurado como 'admin' (valor atual: {role})")
            needs_update = True

        if not is_super:
            print(f"⚠️ Campo 'is_superuser' não está ativado (valor atual: {is_super})")
            needs_update = True

        if not is_active:
            print(f"⚠️ Campo 'is_active' não está ativado (valor atual: {is_active})")
            needs_update = True

        if not is_verified:
            print(f"⚠️ Campo 'is_verified' não está ativado (valor atual: {is_verified})")
            needs_update = True

        if approval != 'approved':
            print(f"⚠️ Campo 'approval_status' não está como 'approved' (valor atual: {approval})")
            needs_update = True

        if not needs_update:
            print(f"\n✅ O usuário {email} já tem todas as configurações de administrador corretas!")
            return

        # Atualizar o usuário para ter acesso completo de administrador
        print(f"\nAtualizando permissões para o usuário {email}...")

        cursor.execute("""
            UPDATE users
            SET role = 'admin',
                is_superuser = TRUE,
                is_active = TRUE,
                is_verified = TRUE,
                approval_status = 'approved'
            WHERE id = %s
            RETURNING id
        """, (user_id,))

        updated = cursor.fetchone()

        if updated:
            conn.commit()
            print(f"✅ Usuário {email} atualizado com SUCESSO!")

            # Verificar as configurações após a atualização
            cursor.execute("""
                SELECT id, email, full_name, role, is_superuser, is_active, is_verified, approval_status
                FROM users
                WHERE id = %s
            """, (user_id,))

            updated_user = cursor.fetchone()
            _, _, name, role, is_super, is_active, is_verified, approval = updated_user

            print(f"\n=== Status APÓS atualização ===")
            print(f"Nome: {name}")
            print(f"Papel (role): {role} ✓")
            print(f"Superusuário: {is_super} ✓")
            print(f"Ativo: {is_active} ✓")
            print(f"Verificado: {is_verified} ✓")
            print(f"Aprovação: {approval} ✓")

            print("\n=== INSTRUÇÕES ===")
            print("1. Saia completamente do sistema (faça logout)")
            print("2. Feche o navegador ou a aba atual")
            print("3. Abra novamente a aplicação")
            print("4. Faça login com suas credenciais originais")
            print("5. Agora você deverá ter acesso completo de administrador!")
        else:
            conn.rollback()
            print(f"❌ Falha ao atualizar o usuário. Nenhuma alteração foi feita.")

    except Exception as e:
        print(f"❌ Erro: {str(e)}")
        if 'conn' in locals() and conn:
            conn.rollback()
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()
            print("\nConexão com o banco de dados fechada.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Verifica e garante acesso de administrador para um usuário")
    parser.add_argument("--email", default="sistemas@smstecnologia.com.br",
                       help="Email do usuário (padrão: sistemas@smstecnologia.com.br)")

    args = parser.parse_args()

    print("=== Verificação e Correção de Permissões de Administrador ===")
    verify_and_fix_admin_access(args.email)
    print("=== Script concluído ===")
