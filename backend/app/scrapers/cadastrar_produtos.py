#!/usr/bin/env python3
"""
Script para cadastrar produtos HP no banco de dados PostgreSQL
"""
import sys
import os

# Adiciona o diretório pai ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.session import SessionLocal
from models.product import Product
from datetime import datetime

# Lista de produtos HP para cadastrar
PRODUTOS = [
    {
        "name": "Cartucho HP 667 Colorido",
        "pn": "3YM78AB",
        "description": "Cartucho de tinta colorido HP 667 para impressoras Deskjet",
        "search_terms": "Cartucho HP 667 Colorido",
        "reference_price": 85.90,
        "is_active": True
    },
    {
        "name": "Cartucho HP 667 Preto",
        "pn": "3YM79AB",
        "description": "Cartucho de tinta preto HP 667 para impressoras Deskjet",
        "search_terms": "Cartucho HP 667 Preto",
        "reference_price": 79.90,
        "is_active": True
    },
    {
        "name": "Cartucho HP 667XL Colorido",
        "pn": "3YM80AB",
        "description": "Cartucho de tinta colorido HP 667XL alta capacidade",
        "search_terms": "Cartucho HP 667XL Colorido",
        "reference_price": 139.90,
        "is_active": True
    },
    {
        "name": "Cartucho HP 667XL Preto",
        "pn": "3YM81AB",
        "description": "Cartucho de tinta preto HP 667XL alta capacidade",
        "search_terms": "Cartucho HP 667XL Preto",
        "reference_price": 129.90,
        "is_active": True
    },
    {
        "name": "Cartucho HP 664 Tri-color",
        "pn": "F6V28AB",
        "description": "Cartucho de tinta tri-color HP 664",
        "search_terms": "Cartucho HP 664 Tri-color",
        "reference_price": 89.90,
        "is_active": True
    },
    {
        "name": "Cartucho HP 664 Preto",
        "pn": "F6V29AB",
        "description": "Cartucho de tinta preto HP 664",
        "search_terms": "Cartucho HP 664 Preto",
        "reference_price": 82.90,
        "is_active": True
    },
    {
        "name": "Cartucho HP 664XL Tri-color",
        "pn": "F6V30AB",
        "description": "Cartucho de tinta tri-color HP 664XL alta capacidade",
        "search_terms": "Cartucho HP 664XL Tri-color",
        "reference_price": 145.90,
        "is_active": True
    },
    {
        "name": "Cartucho HP 664XL Preto",
        "pn": "F6V31AB",
        "description": "Cartucho de tinta preto HP 664XL alta capacidade",
        "search_terms": "Cartucho HP 664XL Preto",
        "reference_price": 135.90,
        "is_active": True
    },
    {
        "name": "Cartucho HP 662 Preto",
        "pn": "CZ103AB",
        "description": "Cartucho de tinta preto HP 662",
        "search_terms": "Cartucho HP 662 Preto",
        "reference_price": 75.90,
        "is_active": True
    },
    {
        "name": "Cartucho HP 662 Tricolor",
        "pn": "CZ104AB",
        "description": "Cartucho de tinta tri-color HP 662",
        "search_terms": "Cartucho HP 662 Tricolor",
        "reference_price": 82.90,
        "is_active": True
    },
    {
        "name": "Garrafa de Tinta HP GT53 Preto",
        "pn": "1VV22AL",
        "description": "Garrafa de tinta preta HP GT53 para impressoras Tank",
        "search_terms": "Garrafa de Tinta HP GT53 Preto",
        "reference_price": 38.90,
        "is_active": True
    },
    {
        "name": "Cartucho HP 664XL Preto Original",
        "pn": "3YM84AB",
        "description": "Cartucho de tinta preto HP 664XL original alta capacidade",
        "search_terms": "Cartucho HP 664XL Preto Original",
        "reference_price": 142.90,
        "is_active": True
    },
]

def main():
    """
    Cadastra produtos no banco de dados
    """
    print("=" * 80)
    print("📝 CADASTRO DE PRODUTOS NO BANCO DE DADOS")
    print("=" * 80)
    
    db = SessionLocal()
    
    try:
        produtos_cadastrados = 0
        produtos_existentes = 0
        
        for produto_data in PRODUTOS:
            # Verifica se o produto já existe
            existing = db.query(Product).filter(Product.pn == produto_data["pn"]).first()
            
            if existing:
                print(f"⚠️  Produto já existe: {produto_data['name']} (PN: {produto_data['pn']})")
                produtos_existentes += 1
                continue
            
            # Cria novo produto
            produto = Product(
                name=produto_data["name"],
                pn=produto_data["pn"],
                search_terms=produto_data.get("search_terms", produto_data["name"]),
                reference_price=produto_data.get("reference_price", 0.0),
                is_active=produto_data.get("is_active", True),
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            
            db.add(produto)
            print(f"✅ Cadastrado: {produto_data['name']} (PN: {produto_data['pn']}) - R$ {produto_data['reference_price']:.2f}")
            produtos_cadastrados += 1
        
        # Commit das alterações
        db.commit()
        
        print("\n" + "=" * 80)
        print(f"📊 RESUMO:")
        print(f"   Produtos cadastrados: {produtos_cadastrados}")
        print(f"   Produtos já existentes: {produtos_existentes}")
        print(f"   Total: {len(PRODUTOS)}")
        print("=" * 80)
        
        print("\n✅ Cadastro concluído com sucesso!")
        
    except Exception as e:
        print(f"\n❌ Erro ao cadastrar produtos: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()

