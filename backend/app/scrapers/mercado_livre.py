import asyncio
import aiohttp
import logging
import re
import json
import uuid
import os
import sys
from datetime import datetime
from bs4 import BeautifulSoup
from urllib.parse import quote
from collections import defaultdict
from statistics import mean, median

# Adicionar o diretório raiz do projeto ao PYTHONPATH
# Isso permite importações absolutas em vez de relativas
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(script_dir, '..', '..'))
sys.path.insert(0, project_root)

# Importar com caminho absoluto em vez de relativo
try:
    from app.services.elasticsearch_service import ElasticsearchService
    es_service = ElasticsearchService()
except ImportError:
    print("AVISO: Não foi possível importar ElasticsearchService.")
    print("Os dados serão coletados, mas não serão enviados para o Elasticsearch.")
    es_service = None

logger = logging.getLogger(__name__)

# Configurar o logger para mostrar informações no console quando executado diretamente
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

async def search_products_ml(search_term):
    """
    Realiza uma busca de produtos no Mercado Livre e retorna os resultados

    Args:
        search_term (str): Termo de busca para encontrar produtos

    Returns:
        list: Lista de produtos encontrados com suas informações
    """
    try:
        # Formatar o termo de busca para URL
        encoded_term = quote(search_term)
        search_url = f"https://lista.mercadolivre.com.br/{encoded_term}"

        logger.info(f"Iniciando busca para: {search_term}")
        logger.info(f"URL de busca: {search_url}")

        # Configurar headers para simular um navegador
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Referer': 'https://www.mercadolivre.com.br/'
        }

        async with aiohttp.ClientSession() as session:
            async with session.get(search_url, headers=headers) as response:
                if response.status != 200:
                    logger.error(f"Erro ao acessar o Mercado Livre. Status: {response.status}")
                    return []

                html_content = await response.text()

                # Analisar o HTML
                soup = BeautifulSoup(html_content, 'html.parser')

                # Encontrar todos os itens de produto
                products = []
                product_items = soup.select('.ui-search-layout__item')

                for item in product_items[:20]:  # Limitar a 20 resultados para performance
                    try:
                        # Extrair informações do produto
                        product = {}

                        # T����tulo
                        title_element = item.select_one('.ui-search-item__title')
                        product['title'] = title_element.text.strip() if title_element else 'Título não disponível'

                        # Link
                        link_element = item.select_one('.ui-search-link')
                        product['link'] = link_element['href'] if link_element else '#'

                        # Preço
                        price_element = item.select_one('.price-tag-amount')
                        price_text = price_element.text.strip() if price_element else '0'
                        # Limpar a formatação do preço
                        price_text = re.sub(r'[^\d,]', '', price_text).replace(',', '.')
                        try:
                            product['price'] = float(price_text) if price_text else 0.0
                        except:
                            product['price'] = 0.0

                        # Preço anterior (para identificar descontos)
                        old_price_element = item.select_one('.ui-search-price__second-line .price-tag-amount')
                        if old_price_element:
                            old_price_text = old_price_element.text.strip()
                            old_price_text = re.sub(r'[^\d,]', '', old_price_text).replace(',', '.')
                            try:
                                product['old_price'] = float(old_price_text) if old_price_text else 0.0
                                product['discount'] = round((1 - product['price'] / product['old_price']) * 100, 2) if product['old_price'] > 0 else 0
                            except:
                                product['old_price'] = 0.0
                                product['discount'] = 0.0
                        else:
                            product['old_price'] = 0.0
                            product['discount'] = 0.0

                        # Imagem
                        img_element = item.select_one('.ui-search-result-image__element img')
                        product['image'] = img_element['src'] if img_element and 'src' in img_element.attrs else img_element['data-src'] if img_element and 'data-src' in img_element.attrs else ''

                        # Verificar se é frete grátis
                        free_shipping_element = item.select_one('.ui-search-item__shipping')
                        product['free_shipping'] = 'Frete grátis' in (free_shipping_element.text.strip() if free_shipping_element else '')

                        # Prazo de entrega
                        shipping_info_element = item.select_one('.ui-search-item__shipping')
                        if shipping_info_element:
                            shipping_text = shipping_info_element.text.strip()
                            # Extrair prazo de entrega usando regex
                            delivery_match = re.search(r'Chega \w+ (\d+\s*(?:a|e|até)\s*\d+\s*\w+)', shipping_text)
                            if delivery_match:
                                product['delivery_time'] = delivery_match.group(1)
                            else:
                                product['delivery_time'] = 'Não especificado'
                        else:
                            product['delivery_time'] = 'Não especificado'

                        # Vendedor
                        seller_element = item.select_one('.ui-search-official-store-label')
                        if seller_element:
                            product['seller'] = seller_element.text.strip()
                            product['is_official_store'] = True
                        else:
                            seller_element = item.select_one('.ui-search-item__brand-discoverability')
                            if seller_element:
                                product['seller'] = seller_element.text.strip()
                                product['is_official_store'] = False
                            else:
                                product['seller'] = 'Vendedor não identificado'
                                product['is_official_store'] = False

                        # Número de vendas ou avaliações
                        rating_element = item.select_one('.ui-search-reviews__rating-number')
                        product['rating'] = float(rating_element.text.strip()) if rating_element else 0.0

                        # Quantidade de avaliações
                        reviews_element = item.select_one('.ui-search-reviews__amount')
                        if reviews_element:
                            reviews_text = reviews_element.text.strip()
                            reviews_match = re.search(r'(\d+)', reviews_text)
                            product['review_count'] = int(reviews_match.group(1)) if reviews_match else 0
                        else:
                            product['review_count'] = 0

                        # Verificar se é produto internacional
                        international_element = item.select_one('.ui-search-item__group--shipping .ui-search-item__international-icon')
                        product['is_international'] = bool(international_element)

                        # Verificar se é produto MercadoLivre Full
                        full_element = item.select_one('.ui-search-item__highlight-label__text')
                        product['is_mercado_livre_full'] = 'FULL' in (full_element.text.strip() if full_element else '')

                        # Extrair modelo do cartucho
                        model_match = re.search(r'HP\s+(\d{3}(?:XL)?)', product['title'], re.IGNORECASE)
                        if model_match:
                            product['cartridge_model'] = f"HP {model_match.group(1)}"
                        else:
                            product['cartridge_model'] = 'Não identificado'

                        # Verificar se é original
                        product['is_original'] = any(keyword in product['title'].lower() for keyword in ['original', 'genuíno', 'genuino', 'hp original'])

                        # Verificar se é remanufaturado/recondicionado
                        product['is_remanufactured'] = any(keyword in product['title'].lower() for keyword in ['remanufaturado', 'recondicionado', 'compatível', 'compativel', 'similar'])

                        # Adicionar informações de metadados
                        product['search_term'] = search_term
                        product['search_date'] = datetime.now().isoformat()

                        # Localização do vendedor
                        location_element = item.select_one('.ui-search-item__group__element .ui-search-item__location')
                        product['location'] = location_element.text.strip() if location_element else 'Não especificado'

                        # Adicionar o produto à lista
                        products.append(product)
                    except Exception as e:
                        logger.error(f"Erro ao processar produto: {str(e)}")
                        continue

                logger.info(f"Busca concluída para '{search_term}'. Encontrados {len(products)} produtos.")
                return products

    except Exception as e:
        logger.error(f"Erro durante a busca de produtos: {str(e)}")
        return []

async def save_last_search_results(results, filename=None):
    """
    Salva os resultados da última busca em um arquivo JSON para análise posterior

    Args:
        results (list): Lista de produtos encontrados
        filename (str, optional): Nome do arquivo para salvar. Se None, usa um nome padrão.

    Returns:
        str: Caminho do arquivo salvo
    """
    try:
        # Criar diretório para resultados se não existir
        results_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'resultados')
        os.makedirs(results_dir, exist_ok=True)

        # Nome do arquivo padrão com timestamp
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"ultima_busca_{timestamp}.json"

        # Caminho completo do arquivo
        file_path = os.path.join(results_dir, filename)

        # Salvar resultados como JSON
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)

        logger.info(f"Resultados da busca salvos em: {file_path}")
        return file_path

    except Exception as e:
        logger.error(f"Erro ao salvar resultados da busca: {str(e)}")
        return None

def get_last_search_file():
    """
    Encontra o arquivo da última busca salva

    Returns:
        str: Caminho do arquivo mais recente ou None se nenhum for encontrado
    """
    try:
        results_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'resultados')
        if not os.path.exists(results_dir):
            logger.error("Diretório de resultados não encontrado")
            return None

        # Listar todos os arquivos JSON no diretório de resultados
        json_files = [f for f in os.listdir(results_dir) if f.endswith('.json') and f.startswith('ultima_busca_')]

        if not json_files:
            logger.error("Nenhum arquivo de resultado encontrado")
            return None

        # Ordenar por data de modificação (mais recente primeiro)
        json_files.sort(key=lambda x: os.path.getmtime(os.path.join(results_dir, x)), reverse=True)

        # Retornar o caminho do arquivo mais recente
        return os.path.join(results_dir, json_files[0])

    except Exception as e:
        logger.error(f"Erro ao buscar último arquivo de resultados: {str(e)}")
        return None

def evaluate_search_results(results=None, file_path=None):
    """
    Avalia os resultados da última busca e fornece estatísticas e insights

    Args:
        results (list, optional): Lista de produtos para avaliar. Se None, tenta carregar do arquivo.
        file_path (str, optional): Caminho para o arquivo de resultados. Se None, usa o mais recente.

    Returns:
        dict: Estatísticas e insights sobre os resultados
    """
    try:
        # Se nenhum resultado foi fornecido, tentar carregar do arquivo
        if not results:
            if not file_path:
                file_path = get_last_search_file()

            if not file_path or not os.path.exists(file_path):
                logger.error("Arquivo de resultados não encontrado")
                return {"erro": "Nenhum resultado de busca encontrado"}

            # Carregar resultados do arquivo
            with open(file_path, 'r', encoding='utf-8') as f:
                results = json.load(f)

        if not results:
            return {"erro": "Nenhum resultado disponível para análise"}

        # Inicializar estatísticas
        stats = {
            "total_produtos": len(results),
            "termos_busca": set(),
            "faixa_precos": {
                "min": float('inf'),
                "max": 0,
                "media": 0,
                "mediana": 0
            },
            "vendedores": defaultdict(int),
            "produtos_originais": 0,
            "produtos_remanufaturados": 0,
            "frete_gratis": 0,
            "produtos_internacionais": 0,
            "modelos_cartucho": defaultdict(int),
            "produtos_mercado_livre_full": 0,
            "avaliacoes": {
                "media": 0,
                "produtos_avaliados": 0
            }
        }

        # Preços para cálculo de média e mediana
        precos = []
        avaliacoes = []

        # Processar cada produto
        for produto in results:
            # Termos de busca
            stats["termos_busca"].add(produto.get('search_term', 'Não especificado'))

            # Faixa de preços
            preco = produto.get('price', 0)
            if preco > 0:
                precos.append(preco)
                stats["faixa_precos"]["min"] = min(stats["faixa_precos"]["min"], preco)
                stats["faixa_precos"]["max"] = max(stats["faixa_precos"]["max"], preco)

            # Vendedores
            vendedor = produto.get('seller', 'Não especificado')
            stats["vendedores"][vendedor] += 1

            # Tipos de produto
            if produto.get('is_original', False):
                stats["produtos_originais"] += 1

            if produto.get('is_remanufactured', False):
                stats["produtos_remanufaturados"] += 1

            # Frete grátis
            if produto.get('free_shipping', False):
                stats["frete_gratis"] += 1

            # Produtos internacionais
            if produto.get('is_international', False):
                stats["produtos_internacionais"] += 1

            # Modelos de cartucho
            modelo = produto.get('cartridge_model', 'Não identificado')
            stats["modelos_cartucho"][modelo] += 1

            # Produtos MercadoLivre Full
            if produto.get('is_mercado_livre_full', False):
                stats["produtos_mercado_livre_full"] += 1

            # Avaliações
            avaliacao = produto.get('rating', 0)
            if avaliacao > 0:
                avaliacoes.append(avaliacao)
                stats["avaliacoes"]["produtos_avaliados"] += 1

        # Calcular estatísticas de preço
        if precos:
            stats["faixa_precos"]["media"] = round(mean(precos), 2)
            stats["faixa_precos"]["mediana"] = round(median(precos), 2)
        else:
            stats["faixa_precos"]["min"] = 0

        # Calcular média de avaliações
        if avaliacoes:
            stats["avaliacoes"]["media"] = round(mean(avaliacoes), 1)

        # Converter termos de busca para lista
        stats["termos_busca"] = list(stats["termos_busca"])

        # Encontrar os 5 vendedores mais frequentes
        top_vendedores = sorted(stats["vendedores"].items(), key=lambda x: x[1], reverse=True)[:5]
        stats["top_vendedores"] = dict(top_vendedores)

        # Encontrar os 5 modelos de cartucho mais frequentes
        top_modelos = sorted(stats["modelos_cartucho"].items(), key=lambda x: x[1], reverse=True)[:5]
        stats["top_modelos_cartucho"] = dict(top_modelos)

        return stats

    except Exception as e:
        logger.error(f"Erro ao avaliar resultados da busca: {str(e)}")
        return {"erro": f"Erro ao analisar resultados: {str(e)}"}

async def run_scraper(db):
    """
    Função que executa o rastreamento de produtos no Mercado Livre,
    mas apenas para produtos oficialmente cadastrados no sistema.
    """
    logger.info("Iniciando processo de rastreamento programado")

    try:
        from app.models.product import Product

        # Obter produtos cadastrados no banco de dados
        registered_products = db.query(Product).filter(Product.is_active == True).all()

        if not registered_products:
            logger.warning("Nenhum produto registrado encontrado para busca. Verifique se há produtos cadastrados na Gestão de Produtos.")
            return

        logger.info(f"Iniciando busca para {len(registered_products)} produtos cadastrados no sistema")

        for product in registered_products:
            try:
                # Usar os termos de busca exatos do produto cadastrado
                search_terms = product.search_terms

                if not search_terms:
                    logger.warning(f"Produto ID {product.id} - '{product.name}' não tem termos de busca definidos. Usando nome como fallback.")
                    search_terms = product.name

                # Buscar no Mercado Livre
                results = await search_products_ml(search_terms)

                # Registrar resultados e atualizar data da última busca
                product.last_search = datetime.now()

                # Aqui você poderia salvar os resultados em um histórico ou no Elasticsearch

                logger.info(f"Busca concluída para produto registrado ID {product.id} - '{search_terms}'")

            except Exception as e:
                logger.error(f"Erro ao processar produto ID {product.id}: {str(e)}")
                continue

        logger.info("Processo de rastreamento concluído para todos os produtos cadastrados")

    except Exception as e:
        logger.error(f"Erro durante o processo de rastreamento: {str(e)}")
        return []

# Adicionar uma função para avaliar a última busca realizada (para ser chamada externamente)
async def avaliar_ultima_busca():
    """
    Avalia os resultados da última busca realizada e exibe um resumo

    Returns:
        dict: Estatísticas e insights sobre os resultados
    """
    print("\n" + "=" * 50)
    print("AVALIAÇÃO DA ÚLTIMA BUSCA")
    print("=" * 50)

    # Obter caminho do último arquivo de resultados
    arquivo_resultados = get_last_search_file()

    if not arquivo_resultados:
        print("Nenhum resultado de busca anterior encontrado.")
        print("Execute o scraper primeiro para gerar resultados.")
        return {"erro": "Nenhum resultado de busca anterior encontrado"}

    print(f"Analisando resultados do arquivo: {os.path.basename(arquivo_resultados)}")

    # Avaliar os resultados
    avaliacao = evaluate_search_results(file_path=arquivo_resultados)

    if "erro" in avaliacao:
        print(f"Erro: {avaliacao['erro']}")
        return avaliacao

    # Exibir resumo da avaliação
    print(f"\nTotal de produtos encontrados: {avaliacao['total_produtos']}")
    print(f"Termos de busca utilizados: {', '.join(avaliacao['termos_busca'])}")

    if avaliacao['faixa_precos']['min'] > 0:
        print(f"Faixa de preços: R$ {avaliacao['faixa_precos']['min']:.2f} a R$ {avaliacao['faixa_precos']['max']:.2f}")
        print(f"Preço médio: R$ {avaliacao['faixa_precos']['media']:.2f}")
        print(f"Preço mediano: R$ {avaliacao['faixa_precos']['mediana']:.2f}")

    print(f"Produtos originais: {avaliacao['produtos_originais']} ({(avaliacao['produtos_originais']/avaliacao['total_produtos']*100):.1f}%)")
    print(f"Produtos remanufaturados/compatíveis: {avaliacao['produtos_remanufaturados']} ({(avaliacao['produtos_remanufaturados']/avaliacao['total_produtos']*100):.1f}%)")
    print(f"Produtos com frete grátis: {avaliacao['frete_gratis']} ({(avaliacao['frete_gratis']/avaliacao['total_produtos']*100):.1f}%)")
    print(f"Produtos internacionais: {avaliacao['produtos_internacionais']} ({(avaliacao['produtos_internacionais']/avaliacao['total_produtos']*100):.1f}%)")
    print(f"Produtos MercadoLivre Full: {avaliacao['produtos_mercado_livre_full']} ({(avaliacao['produtos_mercado_livre_full']/avaliacao['total_produtos']*100):.1f}%)")

    print("\nTop 5 vendedores:")
    for vendedor, count in avaliacao['top_vendedores'].items():
        print(f"  - {vendedor}: {count} produtos")

    print("\nTop 5 modelos de cartucho:")
    for modelo, count in avaliacao['top_modelos_cartucho'].items():
        print(f"  - {modelo}: {count} produtos")

    if avaliacao['avaliacoes']['produtos_avaliados'] > 0:
        print(f"\nAvaliação média: {avaliacao['avaliacoes']['media']} estrelas (em {avaliacao['avaliacoes']['produtos_avaliados']} produtos avaliados)")

    print("=" * 50)

    return avaliacao

# Bloco de execução direta - permite executar o script como um programa standalone
if __name__ == "__main__":
    print("=" * 80)
    print("SCRAPER DO MERCADO LIVRE")
    print("=" * 80)

    # Produtos que serão pesquisados quando o script for executado diretamente
    PRODUTOS_DIRETOS = [
        "Cartucho HP 712",
        "HP 711 cartridge",
        "Kit Cartucho HP 712 Original",
        "Cartucho HP 664",
        "Cartucho HP 667"
    ]

    # Verificar se o usuário quer executar o scraper ou avaliar a última busca
    if len(sys.argv) > 1 and sys.argv[1] == "--avaliar":
        # Executar avaliação da última busca
        asyncio.run(avaliar_ultima_busca())
    else:
        # Executar o scraper normalmente
        print(f"\nIniciando pesquisa de {len(PRODUTOS_DIRETOS)} produtos no Mercado Livre...")

        # Executar o loop assíncrono
        async def main():
            results = []
            for produto in PRODUTOS_DIRETOS:
                print(f"\nPesquisando: {produto}")
                produtos_encontrados = await search_products_ml(produto)
                results.extend(produtos_encontrados)
                print(f"Encontrados {len(produtos_encontrados)} produtos para '{produto}'")

                # Mostrar alguns detalhes dos produtos encontrados
                for i, p in enumerate(produtos_encontrados[:3]):  # Mostrar apenas os 3 primeiros
                    print(f"  {i+1}. {p['title'][:50]}... | R$ {p['price']:.2f} | Vendedor: {p['seller']}")

                if len(produtos_encontrados) > 3:
                    print(f"  ... e mais {len(produtos_encontrados) - 3} produtos.")

                # Pequena pausa entre as buscas
                await asyncio.sleep(1)

            print(f"\nTotal: {len(results)} produtos encontrados em todas as buscas.")

            # Salvar resultados para análise posterior
            arquivo_salvo = await save_last_search_results(results)
            print(f"Resultados salvos em: {arquivo_salvo}")

            # Se tivermos um serviço Elasticsearch configurado, vamos enviar os dados
            if es_service:
                print("\nEnviando dados para o Elasticsearch...")

                # Preparar documentos para o Elasticsearch
                es_documents = []
                for product in results:
                    # Criar um ID único para o documento
                    product_id = str(uuid.uuid4())

                    # Converter o produto para o formato esperado pelo Elasticsearch
                    es_doc = {
                        "id": product_id,
                        "titulo": product['title'],
                        "preco": product['price'],
                        "url": product['link'],
                        "busca": product['search_term'],
                        "vendedor": product['seller'],
                        "timestamp": product['search_date'],
                        "avaliacao": product['rating'],
                        "num_avaliacoes": product.get('review_count', 0),
                        "imagem": product.get('image', ''),
                        "frete_gratis": product.get('free_shipping', False),
                        "fonte": "mercado-livre-scraper"
                    }
                    es_documents.append(es_doc)

                # Enviar em lote para o Elasticsearch
                if es_documents:
                    bulk_result = es_service.bulk_index_products(es_documents)

                    if bulk_result:
                        print(f"✅ {len(es_documents)} produtos enviados com sucesso para o Elasticsearch!")
                    else:
                        print("❌ Falha ao enviar produtos para o Elasticsearch")

            # Avaliar os resultados da busca
            print("\nAvaliando resultados da busca...")
            avaliacao = evaluate_search_results(results)
            print("\n" + "=" * 50)
            print("RESUMO DA BUSCA")
            print("=" * 50)
            print(f"Total de produtos encontrados: {avaliacao['total_produtos']}")

            if avaliacao['faixa_precos']['min'] > 0:
                print(f"Faixa de preços: R$ {avaliacao['faixa_precos']['min']:.2f} a R$ {avaliacao['faixa_precos']['max']:.2f}")
                print(f"Preço médio: R$ {avaliacao['faixa_precos']['media']:.2f}")
                print(f"Preço mediano: R$ {avaliacao['faixa_precos']['mediana']:.2f}")

            print(f"Produtos originais: {avaliacao['produtos_originais']} ({(avaliacao['produtos_originais']/avaliacao['total_produtos']*100):.1f}%)")
            print(f"Produtos remanufaturados/compatíveis: {avaliacao['produtos_remanufaturados']} ({(avaliacao['produtos_remanufaturados']/avaliacao['total_produtos']*100):.1f}%)")
            print(f"Produtos com frete grátis: {avaliacao['frete_gratis']} ({(avaliacao['frete_gratis']/avaliacao['total_produtos']*100):.1f}%)")

            print("\nTop 5 vendedores:")
            for vendedor, count in avaliacao['top_vendedores'].items():
                print(f"  - {vendedor}: {count} produtos")

            print("\nTop 5 modelos de cartucho:")
            for modelo, count in avaliacao['top_modelos_cartucho'].items():
                print(f"  - {modelo}: {count} produtos")

            if avaliacao['avaliacoes']['produtos_avaliados'] > 0:
                print(f"\nAvaliação média: {avaliacao['avaliacoes']['media']} estrelas (em {avaliacao['avaliacoes']['produtos_avaliados']} produtos avaliados)")

            print("=" * 50)

            return results

        try:
            results = asyncio.run(main())
            print("\n✅ Processo concluído com sucesso!")
        except Exception as e:
            print(f"\n❌ Erro durante a execução: {str(e)}")
            import traceback
            print(traceback.format_exc())
