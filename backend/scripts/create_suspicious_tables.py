#!/usr/bin/env python3
"""
Script para criar as tabelas de detecção de suspeitos
"""

import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Adicionar o diretório raiz do backend ao sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.session import engine, Base
from app.models.suspicious_threshold import SuspiciousThreshold
from app.models.trusted_seller import TrustedSeller
from app.models.suspicious_product import SuspiciousProduct

def create_tables():
    """Cria as tabelas necessárias para detecção de suspeitos"""
    print("🔧 Criando tabelas para detecção de suspeitos...")
    
    try:
        # Primeiro, criar as tabelas sem foreign keys
        from app.models.suspicious_threshold import SuspiciousThreshold
        from app.models.trusted_seller import TrustedSeller
        
        # Criar tabelas de configuração primeiro
        SuspiciousThreshold.__table__.create(engine, checkfirst=True)
        TrustedSeller.__table__.create(engine, checkfirst=True)
        
        print("✅ Tabelas de configuração criadas")
        
        # Agora criar a tabela de produtos suspeitos (com foreign key)
        from app.models.suspicious_product import SuspiciousProduct
        SuspiciousProduct.__table__.create(engine, checkfirst=True)
        
        print("✅ Tabela de produtos suspeitos criada")
        
        # Verificar se as tabelas foram criadas
        with engine.connect() as conn:
            # Verificar tabela de thresholds
            result = conn.execute(text("""
                SELECT COUNT(*) FROM information_schema.tables 
                WHERE table_name = 'suspicious_thresholds'
            """))
            if result.scalar() > 0:
                print("✅ Tabela 'suspicious_thresholds' criada")
            else:
                print("❌ Tabela 'suspicious_thresholds' não encontrada")
            
            # Verificar tabela de trusted sellers
            result = conn.execute(text("""
                SELECT COUNT(*) FROM information_schema.tables 
                WHERE table_name = 'trusted_sellers'
            """))
            if result.scalar() > 0:
                print("✅ Tabela 'trusted_sellers' criada")
            else:
                print("❌ Tabela 'trusted_sellers' não encontrada")
            
            # Verificar tabela de suspicious products
            result = conn.execute(text("""
                SELECT COUNT(*) FROM information_schema.tables 
                WHERE table_name = 'suspicious_products'
            """))
            if result.scalar() > 0:
                print("✅ Tabela 'suspicious_products' criada")
            else:
                print("❌ Tabela 'suspicious_products' não encontrada")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao criar tabelas: {e}")
        return False

def create_default_threshold():
    """Cria uma configuração padrão de margem"""
    print("📊 Criando configuração padrão de margem...")
    
    try:
        from app.db.session import SessionLocal
        from app.models.suspicious_threshold import SuspiciousThreshold
        from datetime import datetime
        
        db = SessionLocal()
        
        # Verificar se já existe uma configuração padrão
        existing = db.query(SuspiciousThreshold).filter(
            SuspiciousThreshold.name == "Margem Padrão"
        ).first()
        
        if existing:
            print("✅ Configuração padrão já existe")
            return True
        
        # Criar configuração padrão
        default_threshold = SuspiciousThreshold(
            name="Margem Padrão",
            threshold_percentage=10.0,
            description="Configuração padrão para detecção de produtos suspeitos com margem de 10%",
            is_active=True,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        db.add(default_threshold)
        db.commit()
        
        print("✅ Configuração padrão criada com sucesso!")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao criar configuração padrão: {e}")
        return False
    finally:
        db.close()

def main():
    """Função principal"""
    print("🚀 Configurando sistema de detecção de suspeitos...")
    print("=" * 60)
    
    # Criar tabelas
    if not create_tables():
        print("❌ Falha ao criar tabelas")
        return False
    
    print()
    
    # Criar configuração padrão
    if not create_default_threshold():
        print("❌ Falha ao criar configuração padrão")
        return False
    
    print()
    print("🎉 Sistema de detecção de suspeitos configurado com sucesso!")
    print()
    print("📋 Próximos passos:")
    print("1. Acesse as configurações em /settings")
    print("2. Configure as margens de suspeita")
    print("3. Adicione vendedores de confiança")
    print("4. Execute o scraping inteligente")
    
    return True

if __name__ == "__main__":
    main()
