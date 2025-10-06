#!/usr/bin/env python3
"""
Script para popular o Elasticsearch com dados de teste
Usado para demonstração e testes do sistema
"""
import uuid
from datetime import datetime, timedelta
import random
import sys
import os

# Adiciona o diretório pai ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.elasticsearch_service import bulk_index_products

# Lista de produtos HP realistas
PRODUTOS = [
    {
        "pn": "3YM78AB",
        "nome": "Cartucho HP 667 Colorido",
        "preco_base": 85.90,
        "variacao": 15
    },
    {
        "pn": "3YM79AB",
        "nome": "Cartucho HP 667 Preto",
        "preco_base": 79.90,
        "variacao": 12
    },
    {
        "pn": "3YM80AB",
        "nome": "Cartucho HP 667XL Colorido",
        "preco_base": 139.90,
        "variacao": 20
    },
    {
        "pn": "3YM81AB",
        "nome": "Cartucho HP 667XL Preto",
        "preco_base": 129.90,
        "variacao": 18
    },
    {
        "pn": "F6V28AB",
        "nome": "Cartucho HP 664 Tri-color",
        "preco_base": 89.90,
        "variacao": 15
    },
    {
        "pn": "F6V29AB",
        "nome": "Cartucho HP 664 Preto",
        "preco_base": 82.90,
        "variacao": 13
    },
    {
        "pn": "F6V30AB",
        "nome": "Cartucho HP 664XL Tri-color",
        "preco_base": 145.90,
        "variacao": 22
    },
    {
        "pn": "F6V31AB",
        "nome": "Cartucho HP 664XL Preto",
        "preco_base": 135.90,
        "variacao": 20
    },
    {
        "pn": "CZ103AB",
        "nome": "Cartucho HP 662 Preto",
        "preco_base": 75.90,
        "variacao": 12
    },
    {
        "pn": "CZ104AB",
        "nome": "Cartucho HP 662 Tricolor",
        "preco_base": 82.90,
        "variacao": 14
    },
    {
        "pn": "1VV22AL",
        "nome": "Garrafa de Tinta HP GT53 Preto",
        "preco_base": 38.90,
        "variacao": 8
    },
    {
        "pn": "3YM84AB",
        "nome": "Cartucho HP 664XL Preto Original",
        "preco_base": 142.90,
        "variacao": 25
    },
]

# Vendedores realistas
VENDEDORES = [
    "Loja Oficial HP",
    "Magazine Luiza",
    "Americanas",
    "Submarino",
    "Kalunga",
    "Fast Shop",
    "Tintascerto",
    "Super Tintas",
    "Cartuchos Express",
    "HP Store Brasil"
]

def gerar_avaliacao():
    """Gera uma avaliação realista entre 3.5 e 5.0"""
    return round(random.uniform(3.5, 5.0), 1)

def gerar_num_avaliacoes():
    """Gera um número realista de avaliações"""
    return random.randint(50, 5000)

def gerar_dados_historicos(dias=30):
    """
    Gera dados históricos de produtos para os últimos N dias
    """
    print("=" * 80)
    print("🎲 GERADOR DE DADOS DE TESTE PARA O ELASTICSEARCH")
    print("=" * 80)
    print(f"\n📊 Parâmetros:")
    print(f"   - Período: {dias} dias")
    print(f"   - Produtos: {len(PRODUTOS)}")
    print(f"   - Vendedores: {len(VENDEDORES)}")
    print(f"   - Registros por dia por produto: 3-5")
    
    all_products = []
    total_registros = 0
    
    # Data de hoje
    hoje = datetime.now()
    
    print(f"\n🔄 Gerando dados históricos...")
    
    for dia in range(dias):
        # Calcula a data
        data = hoje - timedelta(days=dia)
        data_str = data.strftime('%Y-%m-%d')
        
        registros_dia = 0
        
        # Para cada produto
        for produto in PRODUTOS:
            # Gera de 3 a 5 registros por produto por dia
            num_registros = random.randint(3, 5)
            
            for _ in range(num_registros):
                # Calcula preço com variação
                preco = produto["preco_base"] + random.uniform(-produto["variacao"], produto["variacao"])
                preco = round(preco, 2)
                
                # Escolhe vendedor aleatório
                vendedor = random.choice(VENDEDORES)
                
                # Gera timestamp aleatório no dia
                hora = random.randint(0, 23)
                minuto = random.randint(0, 59)
                segundo = random.randint(0, 59)
                
                timestamp = data.replace(hour=hora, minute=minuto, second=segundo).isoformat()
                
                # Cria documento
                product_data = {
                    "id": f"{produto['pn']}-{uuid.uuid4()}",
                    "pn": produto["pn"],
                    "titulo": produto["nome"],
                    "preco": preco,
                    "busca": produto["nome"],
                    "url": f"https://www.mercadolivre.com.br/produto/{uuid.uuid4()}",
                    "vendedor": vendedor,
                    "timestamp": timestamp,
                    "fonte": "dados-teste",
                    "avaliacao": gerar_avaliacao(),
                    "num_avaliacoes": gerar_num_avaliacoes()
                }
                
                all_products.append(product_data)
                registros_dia += 1
                total_registros += 1
        
        if dia % 7 == 0:
            print(f"   ✓ Dia {data_str}: {registros_dia} registros gerados")
    
    print(f"\n📦 Total de registros gerados: {total_registros}")
    
    # Indexa no Elasticsearch
    print(f"\n📥 Indexando {len(all_products)} produtos no Elasticsearch...")
    
    try:
        # Divide em batches de 500 para não sobrecarregar
        batch_size = 500
        total_batches = (len(all_products) + batch_size - 1) // batch_size
        
        for i in range(0, len(all_products), batch_size):
            batch = all_products[i:i + batch_size]
            batch_num = (i // batch_size) + 1
            
            print(f"   Batch {batch_num}/{total_batches}: Indexando {len(batch)} produtos...")
            
            result = bulk_index_products(batch)
            
            if result:
                print(f"   ✅ Batch {batch_num} indexado com sucesso!")
            else:
                print(f"   ❌ Falha ao indexar batch {batch_num}")
        
        print(f"\n✅ CONCLUÍDO! {len(all_products)} produtos indexados com sucesso!")
        print(f"\n🎉 O dashboard agora deve exibir dados!")
        print(f"   Acesse: http://localhost:3001/dashboard")
        
    except Exception as e:
        print(f"\n❌ Erro ao indexar: {e}")
        import traceback
        traceback.print_exc()

def main():
    """
    Função principal
    """
    # Gera dados para 30 dias
    gerar_dados_historicos(dias=30)
    
    print(f"\n{'='*80}")
    print("🏁 Script concluído!")
    print(f"{'='*80}\n")

if __name__ == "__main__":
    main()

