#!/usr/bin/env python3
"""
Script para testar o endpoint de logs
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.session import SessionLocal
from app.models.system_log import SystemLog, LogLevel, LogCategory

def test_logs():
    """Testa se os logs estão sendo retornados corretamente"""
    db = SessionLocal()
    try:
        # Verificar se há logs no banco
        count = db.execute(text("SELECT COUNT(*) FROM system_logs")).scalar()
        print(f"Total de logs no banco: {count}")
        
        if count == 0:
            print("❌ Nenhum log encontrado no banco de dados!")
            return False
        
        # Buscar alguns logs
        logs = db.execute(text("""
            SELECT id, level, category, action, description, timestamp, user_id, ip_address
            FROM system_logs 
            ORDER BY timestamp DESC 
            LIMIT 5
        """)).fetchall()
        
        print(f"\n✅ {len(logs)} logs encontrados:")
        for log in logs:
            print(f"  - ID: {log[0]}, Level: {log[1]}, Category: {log[2]}, Action: {log[3]}")
            print(f"    Description: {log[4][:50]}...")
            print(f"    Timestamp: {log[5]}, User: {log[6]}, IP: {log[7]}")
            print()
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao testar logs: {str(e)}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    test_logs()
