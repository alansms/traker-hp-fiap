#!/usr/bin/env python
# Script para listar as tabelas disponíveis no banco de dados

import psycopg2
import argparse

def list_tables():
    """
    Conecta ao banco de dados e lista todas as tabelas disponíveis
    """
    # Parâmetros de conexão - ajuste conforme necessário
    conn_params = {
        "host": "localhost",
        "database": "ml_tracker",
        "user": "postgres",
        "password": "postgres",
        "port": "5432"
    }

    try:
        print(f"Tentando conectar ao banco de dados PostgreSQL em {conn_params['host']}...")
        conn = psycopg2.connect(**conn_params)
        cursor = conn.cursor()

        print("Conectado com sucesso! Listando tabelas disponíveis:")

        # Consulta para listar todas as tabelas no esquema público
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)

        tables = cursor.fetchall()

        if tables:
            print("\nTabelas encontradas:")
            for i, table in enumerate(tables, 1):
                print(f"{i}. {table[0]}")

            # Para a primeira tabela, vamos listar as colunas para análise
            if len(tables) > 0:
                first_table = tables[0][0]
                cursor.execute(f"""
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = '{first_table}'
                    ORDER BY ordinal_position;
                """)

                columns = cursor.fetchall()
                print(f"\nColunas da tabela '{first_table}':")
                for col in columns:
                    print(f"  - {col[0]} ({col[1]})")
        else:
            print("Nenhuma tabela encontrada no banco de dados.")

            # Tentar listar os bancos de dados disponíveis
            cursor.execute("SELECT datname FROM pg_database WHERE datistemplate = false;")
            databases = cursor.fetchall()

            print("\nBancos de dados disponíveis:")
            for db in databases:
                print(f"- {db[0]}")

            print("\nO banco de dados parece estar vazio. Talvez seja necessário inicializar as tabelas.")
            print("Verifique se existe um script de inicialização como 'create_tables.py' ou uma migração a ser executada.")

    except Exception as e:
        print(f"Erro ao conectar ou listar tabelas: {str(e)}")
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()
            print("Conexão com o banco de dados fechada.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Lista as tabelas disponíveis no banco de dados")

    print("=== Verificação do Banco de Dados ===")
    list_tables()
    print("=== Script concluído ===")
