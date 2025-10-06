#!/usr/bin/env python3
"""
Script simples para configurar a chave da API OpenAI
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.session import SessionLocal

def configurar_openai():
    """Configura uma chave de teste para o OpenAI"""
    db = SessionLocal()
    try:
        # Verificar se a tabela existe
        tables = db.execute(text("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'system_settings'
        """)).fetchall()
        
        if not tables:
            print("❌ Tabela system_settings não encontrada!")
            return False
        
        # Inserir ou atualizar a chave
        db.execute(text("""
            INSERT INTO system_settings (key, value, created_at, updated_at)
            VALUES ('openai_api_key', 'sk-test-key-for-development-only', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (key) DO UPDATE SET 
                value = EXCLUDED.value,
                updated_at = CURRENT_TIMESTAMP
        """))
        db.commit()
        
        print("✅ Chave da API OpenAI configurada com sucesso!")
        return True
        
    except Exception as e:
        print(f"❌ Erro: {str(e)}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    configurar_openai()
