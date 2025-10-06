#!/usr/bin/env python3
"""
Script para verificar dados de scraping no banco de dados
"""

import sys
import os
from sqlalchemy import text

# Adicionar o diretório raiz do backend ao sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.session import SessionLocal
from app.models.product import Product

def check_scraping_data():
    """Verifica dados de scraping no banco"""
    db = SessionLocal()
    try:
        print("=== VERIFICAÇÃO DE DADOS DE SCRAPING ===\n")
        
        # 1. Total de produtos
        total_products = db.query(Product).count()
        print(f"Total de produtos: {total_products}")
        
        # 2. Produtos ativos
        active_products = db.query(Product).filter(Product.is_active == True).count()
        print(f"Produtos ativos: {active_products}")
        
        # 3. Produtos com last_search preenchido
        products_with_search = db.query(Product).filter(
            Product.is_active == True,
            Product.last_search.isnot(None)
        ).count()
        print(f"Produtos com dados de scraping: {products_with_search}")
        
        # 4. Verificar alguns produtos específicos
        print("\n=== PRODUTOS COM DADOS DE SCRAPING ===")
        products_with_data = db.query(Product).filter(
            Product.is_active == True,
            Product.last_search.isnot(None)
        ).limit(5).all()
        
        for product in products_with_data:
            print(f"- {product.name} (PN: {product.pn}) - Última busca: {product.last_search}")
        
        # 5. Verificar se há produtos sem last_search
        products_without_search = db.query(Product).filter(
            Product.is_active == True,
            Product.last_search.is_(None)
        ).count()
        print(f"\nProdutos ativos sem dados de scraping: {products_without_search}")
        
        # 6. Verificar alguns produtos sem dados
        print("\n=== PRODUTOS SEM DADOS DE SCRAPING ===")
        products_without_data = db.query(Product).filter(
            Product.is_active == True,
            Product.last_search.is_(None)
        ).limit(5).all()
        
        for product in products_without_data:
            print(f"- {product.name} (PN: {product.pn}) - Última busca: {product.last_search}")
        
        return products_with_search > 0
        
    except Exception as e:
        print(f"Erro ao verificar dados: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    has_data = check_scraping_data()
    print(f"\n=== RESULTADO ===")
    print(f"Há dados de scraping: {'SIM' if has_data else 'NÃO'}")
