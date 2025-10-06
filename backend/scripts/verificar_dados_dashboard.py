#!/usr/bin/env python3
"""
Script para verificar e popular dados reais para o dashboard
"""

import sys
import os
from datetime import datetime, timedelta
import random

# Adicionar o diretório raiz do backend ao sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.elasticsearch_service import ElasticsearchService
from app.db.session import SessionLocal
from app.models.product import Product

def verificar_elasticsearch():
    """Verifica se o Elasticsearch está funcionando e tem dados"""
    print("🔍 Verificando Elasticsearch...")
    
    es_service = ElasticsearchService()
    
    if not es_service.client:
        print("❌ Elasticsearch não está disponível")
        return False
    
    try:
        # Verificar se o índice existe
        if not es_service.client.indices.exists(index="hp-traker-ml"):
            print("❌ Índice 'hp-traker-ml' não existe")
            return False
        
        # Contar documentos
        count = es_service.client.count(index="hp-traker-ml")
        total_docs = count['count']
        print(f"✅ Elasticsearch funcionando - {total_docs} documentos encontrados")
        
        if total_docs == 0:
            print("⚠️  Nenhum documento encontrado no índice")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao verificar Elasticsearch: {e}")
        return False

def verificar_produtos_banco():
    """Verifica se há produtos no banco de dados"""
    print("🔍 Verificando produtos no banco de dados...")
    
    db = SessionLocal()
    try:
        produtos = db.query(Product).all()
        print(f"✅ {len(produtos)} produtos encontrados no banco de dados")
        
        if len(produtos) == 0:
            print("⚠️  Nenhum produto encontrado no banco de dados")
            return False
        
        # Mostrar alguns produtos
        for produto in produtos[:5]:
            print(f"  - {produto.name} (PN: {produto.pn})")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao verificar produtos: {e}")
        return False
    finally:
        db.close()

def popular_dados_teste():
    """Popula dados de teste no Elasticsearch"""
    print("📊 Populando dados de teste no Elasticsearch...")
    
    es_service = ElasticsearchService()
    
    if not es_service.client:
        print("❌ Elasticsearch não está disponível para popular dados")
        return False
    
    try:
        # Dados de produtos HP para teste
        produtos_teste = [
            {
                "name": "Cartucho HP 664XL Preto",
                "pn": "3YM84AB",
                "price": 199.90,
                "seller": "HP Store Oficial",
                "rating": 4.8,
                "reviews": 1250,
                "timestamp": datetime.now().isoformat(),
                "category": "Cartuchos",
                "brand": "HP"
            },
            {
                "name": "Cartucho HP 667 Colorido",
                "pn": "3YM78AB", 
                "price": 179.90,
                "seller": "Mercado Livre",
                "rating": 4.6,
                "reviews": 890,
                "timestamp": datetime.now().isoformat(),
                "category": "Cartuchos",
                "brand": "HP"
            },
            {
                "name": "Cartucho HP 667XL Preto",
                "pn": "3YM81AB",
                "price": 219.90,
                "seller": "TechStore",
                "rating": 4.7,
                "reviews": 650,
                "timestamp": datetime.now().isoformat(),
                "category": "Cartuchos",
                "brand": "HP"
            },
            {
                "name": "Cartucho HP 711 Preto",
                "pn": "3YM85AB",
                "price": 89.90,
                "seller": "Office Depot",
                "rating": 4.5,
                "reviews": 420,
                "timestamp": datetime.now().isoformat(),
                "category": "Cartuchos",
                "brand": "HP"
            },
            {
                "name": "Cartucho HP 712 Colorido",
                "pn": "3YM86AB",
                "price": 95.90,
                "seller": "Amazon",
                "rating": 4.4,
                "reviews": 380,
                "timestamp": datetime.now().isoformat(),
                "category": "Cartuchos",
                "brand": "HP"
            }
        ]
        
        # Gerar dados históricos para os últimos 30 dias
        dados_historicos = []
        for produto in produtos_teste:
            # Gerar dados para os últimos 30 dias
            for i in range(30):
                data = datetime.now() - timedelta(days=i)
                preco_variado = produto["price"] + random.uniform(-20, 20)
                
                dados_historicos.append({
                    **produto,
                    "price": round(preco_variado, 2),
                    "timestamp": data.isoformat(),
                    "date": data.strftime("%Y-%m-%d")
                })
        
        # Indexar dados no Elasticsearch
        actions = []
        for doc in dados_historicos:
            actions.append({
                "_index": "hp-traker-ml",
                "_source": doc
            })
        
        # Executar bulk index
        from elasticsearch import helpers
        helpers.bulk(es_service.client, actions)
        
        print(f"✅ {len(dados_historicos)} documentos indexados com sucesso")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao popular dados: {e}")
        return False

def main():
    """Função principal"""
    print("🚀 Verificando dados do Dashboard...")
    print("=" * 50)
    
    # Verificar Elasticsearch
    es_ok = verificar_elasticsearch()
    
    # Verificar produtos no banco
    produtos_ok = verificar_produtos_banco()
    
    print("\n" + "=" * 50)
    
    if not es_ok:
        print("📊 Populando dados de teste no Elasticsearch...")
        if popular_dados_teste():
            print("✅ Dados de teste populados com sucesso!")
        else:
            print("❌ Falha ao popular dados de teste")
    
    if not produtos_ok:
        print("📝 Criando produtos de teste no banco de dados...")
        # Aqui você pode adicionar código para criar produtos de teste
        print("⚠️  Produtos de teste não foram criados automaticamente")
    
    print("\n🎯 Status Final:")
    print(f"  Elasticsearch: {'✅ OK' if es_ok else '❌ Problema'}")
    print(f"  Produtos BD: {'✅ OK' if produtos_ok else '❌ Problema'}")
    
    if es_ok and produtos_ok:
        print("\n🎉 Dashboard deve funcionar corretamente!")
    else:
        print("\n⚠️  Dashboard pode ter problemas - verifique os dados")

if __name__ == "__main__":
    main()
