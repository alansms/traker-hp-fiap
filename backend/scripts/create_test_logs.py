#!/usr/bin/env python3
"""
Script para criar logs de teste no sistema
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.session import SessionLocal
from datetime import datetime, timedelta
import random

def create_test_logs():
    """Cria logs de teste no sistema"""
    db = SessionLocal()
    try:
        # Verificar se a tabela existe
        tables = db.execute(text("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'system_logs'
        """)).fetchall()
        
        if not tables:
            print("❌ Tabela system_logs não encontrada!")
            return False
        
        # Limpar logs existentes
        db.execute(text("DELETE FROM system_logs"))
        db.commit()
        
        # Criar logs de teste (usando valores corretos do enum)
        test_logs = [
            # Logs de autenticação
            ("HIGH", "SECURITY", "login_attempt", "Tentativa de login falhada para usuário admin@hp.com", 1),
            ("LOW", "SECURITY", "login_success", "Login realizado com sucesso para admin@hp.com", 1),
            ("HIGH", "SECURITY", "password_change", "Senha alterada pelo usuário admin@hp.com", 1),
            
            # Logs de produtos
            ("MEDIUM", "PRODUCT", "product_created", "Produto 'Cartucho HP 664XL' cadastrado com sucesso", 1),
            ("MEDIUM", "PRODUCT", "product_updated", "Produto 'Cartucho HP 667' atualizado", 1),
            ("HIGH", "PRODUCT", "product_deleted", "Produto 'Cartucho HP 662' excluído", 1),
            ("LOW", "PRODUCT", "product_viewed", "Produto 'Cartucho HP 664XL' visualizado", 1),
            
            # Logs de scraping
            ("MEDIUM", "SYSTEM", "scraping_started", "Iniciado scraping de produtos no Mercado Livre", None),
            ("LOW", "SYSTEM", "scraping_progress", "Scraping: 15 produtos processados", None),
            ("HIGH", "SYSTEM", "scraping_error", "Erro no scraping: Timeout na conexão com Mercado Livre", None),
            ("MEDIUM", "SYSTEM", "scraping_completed", "Scraping finalizado: 25 produtos encontrados", None),
            
            # Logs de usuários
            ("HIGH", "USER", "user_approved", "Usuário maria@empresa.com aprovado pelo administrador", 1),
            ("HIGH", "USER", "user_rejected", "Usuário joao@empresa.com rejeitado pelo administrador", 1),
            ("HIGH", "USER", "user_deleted", "Usuário pedro@empresa.com excluído do sistema", 1),
            ("LOW", "USER", "user_profile_updated", "Perfil do usuário admin@hp.com atualizado", 1),
            
            # Logs de sistema
            ("MEDIUM", "SYSTEM", "backup_created", "Backup do banco de dados criado com sucesso", None),
            ("HIGH", "SYSTEM", "database_error", "Erro na conexão com o banco de dados PostgreSQL", None),
            ("LOW", "SYSTEM", "system_startup", "Sistema iniciado com sucesso", None),
            ("LOW", "SYSTEM", "api_request", "Requisição para /api/products realizada", 1),
            
            # Logs de alertas
            ("HIGH", "SYSTEM", "alert_created", "Alerta de produto suspeito criado: Cartucho HP 667", None),
            ("MEDIUM", "SYSTEM", "alert_resolved", "Alerta de produto suspeito resolvido", None),
            ("HIGH", "SECURITY", "security_breach", "Tentativa de acesso não autorizado detectada", None),
        ]
        
        # Inserir logs com timestamps variados
        for i, (level, category, action, description, user_id) in enumerate(test_logs):
            # Criar timestamp variado (últimos 7 dias)
            hours_ago = random.randint(1, 168)  # 1 a 168 horas (7 dias)
            timestamp = datetime.now() - timedelta(hours=hours_ago)
            
            db.execute(text("""
                INSERT INTO system_logs (level, category, action, description, user_id, timestamp, ip_address)
                VALUES (:level, :category, :action, :description, :user_id, :timestamp, :ip_address)
            """), {
                "level": level,
                "category": category,
                "action": action,
                "description": description,
                "user_id": user_id,
                "timestamp": timestamp,
                "ip_address": f"192.168.1.{random.randint(100, 200)}"
            })
        
        db.commit()
        
        # Verificar quantos logs foram criados
        count = db.execute(text("SELECT COUNT(*) FROM system_logs")).scalar()
        print(f"✅ {count} logs de teste criados com sucesso!")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao criar logs: {str(e)}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    create_test_logs()
