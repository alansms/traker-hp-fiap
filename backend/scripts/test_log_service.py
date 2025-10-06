#!/usr/bin/env python3
"""
Script para testar o serviço de logs
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.log_service import LogService
from app.schemas.system_log import LogFilter
from app.db.session import SessionLocal

async def test_log_service():
    """Testa o serviço de logs"""
    db = SessionLocal()
    try:
        log_service = LogService(db)
        
        # Criar filtro vazio
        filters = LogFilter()
        
        # Testar busca de logs
        result = await log_service.get_logs(filters, 0, 10)
        
        print(f"✅ Serviço de logs funcionando!")
        print(f"Total de logs: {result['total']}")
        print(f"Página: {result['page']}")
        print(f"Tamanho: {result['size']}")
        print(f"Páginas: {result['pages']}")
        print(f"Items encontrados: {len(result['items'])}")
        
        if result['items']:
            print("\nPrimeiro log:")
            log = result['items'][0]
            print(f"  - ID: {log.id}")
            print(f"  - Level: {log.level}")
            print(f"  - Category: {log.category}")
            print(f"  - Action: {log.action}")
            print(f"  - Description: {log.description[:50]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao testar serviço de logs: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_log_service())
