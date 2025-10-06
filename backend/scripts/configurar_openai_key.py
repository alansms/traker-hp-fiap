#!/usr/bin/env python3
"""
Script para configurar a chave da API OpenAI no banco de dados
"""
import sys
import os
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.db.session import SessionLocal

def configurar_openai_key(api_key):
    """Configura a chave da API OpenAI no banco de dados"""
    db = SessionLocal()
    try:
        # Verificar se já existe uma configuração
        existing = db.execute(text("""
            SELECT id, value FROM system_settings 
            WHERE key = 'openai_api_key'
        """)).fetchone()

        if existing:
            # Atualizar a chave existente
            db.execute(text("""
                UPDATE system_settings 
                SET value = :api_key, updated_at = CURRENT_TIMESTAMP
                WHERE key = 'openai_api_key'
            """), {"api_key": api_key})
            print("✅ Chave da API OpenAI atualizada com sucesso!")
        else:
            # Criar nova configuração
            db.execute(text("""
                INSERT INTO system_settings (key, value, created_at, updated_at)
                VALUES ('openai_api_key', :api_key, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """), {"api_key": api_key})
            print("✅ Chave da API OpenAI criada com sucesso!")

        db.commit()
        
        # Verificar se foi salva corretamente
        result = db.execute(text("""
            SELECT value FROM system_settings 
            WHERE key = 'openai_api_key'
        """)).fetchone()
        
        if result:
            print(f"✅ Chave salva: {result[0][:20]}...")
        else:
            print("❌ Erro ao verificar a chave salva")
            
    except Exception as e:
        print(f"❌ Erro ao configurar chave: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python3 configurar_openai_key.py <sua_chave_openai>")
        print("Exemplo: python3 configurar_openai_key.py sk-1234567890abcdef...")
        sys.exit(1)
    
    api_key = sys.argv[1]
    
    if not api_key.startswith('sk-'):
        print("⚠️ Aviso: A chave da API OpenAI geralmente começa com 'sk-'")
        resposta = input("Deseja continuar mesmo assim? (s/N): ")
        if resposta.lower() != 's':
            print("Operação cancelada.")
            sys.exit(1)
    
    print("🔑 Configurando chave da API OpenAI...")
    configurar_openai_key(api_key)
    print("✅ Configuração concluída!")
