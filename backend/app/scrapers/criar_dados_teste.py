import asyncio
import json
import os
from datetime import datetime

# Diretório de resultados
results_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'resultados')
os.makedirs(results_dir, exist_ok=True)

# Simulação de dados de busca
mock_data = [
    {
        "title": "Cartucho HP 712 Original Preto 80ml",
        "link": "https://produto.mercadolivre.com.br/exemplo1",
        "price": 299.90,
        "seller": "HP Store Oficial",
        "is_original": True,
        "is_remanufactured": False,
        "free_shipping": True,
        "is_international": False,
        "is_mercado_livre_full": True,
        "cartridge_model": "HP 712",
        "rating": 4.8,
        "review_count": 150,
        "search_term": "Cartucho HP 712",
        "search_date": datetime.now().isoformat()
    },
    {
        "title": "Kit 4 Cartuchos HP 711 Compatível Colorido",
        "link": "https://produto.mercadolivre.com.br/exemplo2",
        "price": 189.90,
        "seller": "SuperTintas",
        "is_original": False,
        "is_remanufactured": True,
        "free_shipping": True,
        "is_international": False,
        "is_mercado_livre_full": False,
        "cartridge_model": "HP 711",
        "rating": 4.2,
        "review_count": 87,
        "search_term": "HP 711 cartridge",
        "search_date": datetime.now().isoformat()
    },
    {
        "title": "Cartucho HP 664 Preto Original Ink Advantage",
        "link": "https://produto.mercadolivre.com.br/exemplo3",
        "price": 74.90,
        "seller": "HP Store Oficial",
        "is_original": True,
        "is_remanufactured": False,
        "free_shipping": True,
        "is_international": False,
        "is_mercado_livre_full": True,
        "cartridge_model": "HP 664",
        "rating": 4.9,
        "review_count": 320,
        "search_term": "Cartucho HP 664",
        "search_date": datetime.now().isoformat()
    },
    {
        "title": "Cartucho Hp 664xl Preto Original Alto Rendimento",
        "link": "https://produto.mercadolivre.com.br/exemplo4",
        "price": 129.90,
        "seller": "HP Store Oficial",
        "is_original": True,
        "is_remanufactured": False,
        "free_shipping": True,
        "is_international": False,
        "is_mercado_livre_full": True,
        "cartridge_model": "HP 664",
        "rating": 4.7,
        "review_count": 245,
        "search_term": "Cartucho HP 664",
        "search_date": datetime.now().isoformat()
    },
    {
        "title": "Cartucho HP 667 Colorido Compatível Premium",
        "link": "https://produto.mercadolivre.com.br/exemplo5",
        "price": 69.90,
        "seller": "InkMaster",
        "is_original": False,
        "is_remanufactured": True,
        "free_shipping": False,
        "is_international": False,
        "is_mercado_livre_full": False,
        "cartridge_model": "HP 667",
        "rating": 4.1,
        "review_count": 56,
        "search_term": "Cartucho HP 667",
        "search_date": datetime.now().isoformat()
    },
    {
        "title": "Kit Cartucho HP 712 Original Preto E Colorido",
        "link": "https://produto.mercadolivre.com.br/exemplo6",
        "price": 499.90,
        "seller": "HP Store Oficial",
        "is_original": True,
        "is_remanufactured": False,
        "free_shipping": True,
        "is_international": False,
        "is_mercado_livre_full": True,
        "cartridge_model": "HP 712",
        "rating": 4.9,
        "review_count": 112,
        "search_term": "Kit Cartucho HP 712 Original",
        "search_date": datetime.now().isoformat()
    },
    {
        "title": "Cartucho Alternativo Para HP 711 Magenta",
        "link": "https://produto.mercadolivre.com.br/exemplo7",
        "price": 59.90,
        "seller": "EcoCartuchos",
        "is_original": False,
        "is_remanufactured": True,
        "free_shipping": False,
        "is_international": True,
        "is_mercado_livre_full": False,
        "cartridge_model": "HP 711",
        "rating": 3.8,
        "review_count": 42,
        "search_term": "HP 711 cartridge",
        "search_date": datetime.now().isoformat()
    },
    {
        "title": "Cartucho HP 712 Remanufaturado Preto Alto Rendimento",
        "link": "https://produto.mercadolivre.com.br/exemplo8",
        "price": 149.90,
        "seller": "ReciclaToner",
        "is_original": False,
        "is_remanufactured": True,
        "free_shipping": True,
        "is_international": False,
        "is_mercado_livre_full": False,
        "cartridge_model": "HP 712",
        "rating": 4.0,
        "review_count": 78,
        "search_term": "Cartucho HP 712",
        "search_date": datetime.now().isoformat()
    },
    {
        "title": "Cartucho HP 667 Original Preto para DeskJet",
        "link": "https://produto.mercadolivre.com.br/exemplo9",
        "price": 79.90,
        "seller": "HP Store Oficial",
        "is_original": True,
        "is_remanufactured": False,
        "free_shipping": True,
        "is_international": False,
        "is_mercado_livre_full": True,
        "cartridge_model": "HP 667",
        "rating": 4.8,
        "review_count": 187,
        "search_term": "Cartucho HP 667",
        "search_date": datetime.now().isoformat()
    },
    {
        "title": "Kit 3 Cartuchos HP 664 Compatível Colorido",
        "link": "https://produto.mercadolivre.com.br/exemplo10",
        "price": 119.90,
        "seller": "PrinterSupplies",
        "is_original": False,
        "is_remanufactured": True,
        "free_shipping": True,
        "is_international": False,
        "is_mercado_livre_full": False,
        "cartridge_model": "HP 664",
        "rating": 4.3,
        "review_count": 132,
        "search_term": "Cartucho HP 664",
        "search_date": datetime.now().isoformat()
    }
]

# Função para salvar os resultados
async def save_mock_results():
    # Nome do arquivo baseado na data e hora atuais
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"ultima_busca_{timestamp}.json"
    file_path = os.path.join(results_dir, filename)

    # Salvar resultados como JSON
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(mock_data, f, ensure_ascii=False, indent=2)

    print(f"Dados de simulação salvos em: {file_path}")
    return file_path

# Executar o script
if __name__ == "__main__":
    print("Criando dados de simulação para avaliação...")
    asyncio.run(save_mock_results())
    print("\nAgora você pode executar 'python3 mercado_livre.py --avaliar' para testar a avaliação")
