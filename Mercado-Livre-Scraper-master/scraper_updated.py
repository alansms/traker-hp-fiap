from bs4 import BeautifulSoup
import requests
import time
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from datetime import datetime
from urllib.parse import quote_plus
from elasticsearch import Elasticsearch, helpers
import json

# Configurações do email do arquivo .env
SMTP_SERVER = 'smtps.uhserver.com'
SMTP_PORT = 465
SMTP_USER = 'suporte@smstecnologia.com.br'
SMTP_PASSWORD = '@#Pipocas@#!!79'

class MercadoLivreScraper:
    def __init__(self):
        self.email_from = SMTP_USER
        self.smtp_password = SMTP_PASSWORD
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        # Configura o índice do Elasticsearch durante a inicialização
        self.setup_elasticsearch_index()


    def setup_elasticsearch_index(self):
        """Configura o índice do Elasticsearch com os mapeamentos adequados"""
        try:
            client = Elasticsearch(
                "https://cce7c968e5f94cb59b5922e251810730.us-central1.gcp.cloud.es.io:443",
                api_key="SHFmNFRaY0ItRGtNRXVmY01Wb0w6b1R2MFpmb1BxR2t0UTRpSnd4V0ZVQQ=="
            )
            index_name = "hp-traker-ml"

            # Define os mapeamentos para os campos
            mappings = {
                "properties": {
                    "busca": {"type": "keyword"},
                    "timestamp": {"type": "date"},
                    "id": {"type": "keyword"},
                    "titulo": {
                        "type": "text",
                        "fields": {
                            "keyword": {"type": "keyword"}
                        }
                    },
                    "preco": {"type": "float"},
                    "link": {"type": "keyword"},
                    "avaliacao": {"type": "float"},
                    "num_avaliacoes": {"type": "integer"},
                    "comentarios": {
                        "type": "text",
                        "fields": {
                            "keyword": {"type": "keyword"}
                        }
                    }
                }
            }

            # Verifica se o índice existe
            if not client.indices.exists(index=index_name):
                # Cria o índice com os mapeamentos
                client.indices.create(
                    index=index_name,
                    mappings=mappings,
                    settings={
                        "number_of_shards": 1,
                        "number_of_replicas": 1
                    }
                )
                print(f"✓ Índice {index_name} criado com sucesso!")
            else:
                # Atualiza os mapeamentos do índice existente
                client.indices.put_mapping(
                    index=index_name,
                    body=mappings
                )
                print(f"✓ Mapeamentos do índice {index_name} atualizados com sucesso!")

            return True

        except Exception as e:
            print(f"Erro ao configurar índice do Elasticsearch: {str(e)}")
            return False

    def search_products(self, query):
        """Busca produtos no Mercado Livre"""
        busca_encoded = quote_plus(query)
        url = f'https://lista.mercadolivre.com.br/{busca_encoded}'

        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()

            # Para debug
            print(f"URL da busca: {url}")

            soup = BeautifulSoup(response.text, 'html.parser')

            produtos = []
            # Primeiro, tenta encontrar o container principal
            main_container = soup.select_one('.ui-search-results')
            if not main_container:
                print("Debug: Container principal não encontrado")
                return produtos

            # Atualização dos seletores para corresponder à estrutura atual do ML
            items = main_container.select('.ui-search-layout__item')

            if not items:
                print("Debug: Tentando seletores alternativos...")
                items = main_container.select('.ui-search-result')

            if not items:
                print("Debug: Tentando mais seletores alternativos...")
                items = main_container.select('[class*="ui-search-layout__item"]')

            if not items:
                print("Debug: Nenhum item encontrado após tentar todos os seletores")
                return produtos

            print(f"Debug: Encontrados {len(items)} items")

            for i, item in enumerate(items, 1):
                try:
                    # Busca o título com seletores mais específicos e atualizados
                    titulo_selectors = [
                        'div[class*="ui-search-item__group"] h2',
                        'div[class*="ui-search-item__group"] span',
                        '.ui-search-item__title',
                        'h2.ui-search-item__title',
                        '.shops__item-title',
                        'div > div > div > div:nth-child(2)',  # Nova estrutura baseado no HTML fornecido
                        'div[class*="ui-search"] h2',
                        'div[class*="ui-search"] span:not(:empty)'
                    ]

                    titulo_elem = None
                    titulo = ""
                    found_title = False

                    for selector in titulo_selectors:
                        if found_title:
                            break
                        elementos = item.select(selector)
                        for elem in elementos:
                            texto = elem.get_text(strip=True)
                            if texto and len(texto) > 5:  # Verificar se o texto não está vazio e tem um tamanho mínimo
                                titulo = texto
                                titulo_elem = elem
                                found_title = True
                                break
                    if not titulo_elem or not titulo:
                        print(f"Debug: Título não encontrado para item {i}")
                        continue

                    print(f"Debug: Título encontrado: {titulo}")

                    # Busca o link com seletores mais específicos
                    link_selectors = [
                        '.ui-search-item__group__element > a',
                        '.ui-search-link',
                        'a[href*="mercadolivre.com.br"]',
                        '.ui-search-result__content a'
                    ]

                    link_elem = None
                    for selector in link_selectors:
                        link_elem = item.select_one(selector)
                        if link_elem:
                            break

                    if not link_elem:
                        print(f"Debug: Link não encontrado para {titulo}")
                        continue

                    link = link_elem['href']
                    print(f"Debug: Link encontrado: {link}")

                    # Busca o preço com seletores mais específicos e padrão de regex
                    preco_selectors = [
                        'span[class*="price-tag"] .price-tag-fraction',
                        '.ui-search-price__second-line .andes-money-amount__fraction',
                        '.andes-money-amount__fraction',
                        '.price-tag-fraction'
                    ]

                    preco = None
                    preco_texto = None

                    # Tenta encontrar o preço usando os seletores
                    for selector in preco_selectors:
                        elementos = item.select(selector)
                        for elem in elementos:
                            texto = elem.get_text(strip=True)
                            if texto and texto.replace('.', '').isdigit():
                                preco_texto = texto
                                break
                        if preco_texto:
                            break

                    # Se não encontrou pelos seletores, tenta extrair do título
                    if not preco_texto:
                        import re
                        # Procura por padrões de preço no título (R$XXXX,XX ou R$XXXX)
                        matches = re.findall(r'R\$\s*(\d+(?:\.\d{3})*(?:,\d{2})?)', titulo)
                        if matches:
                            # Pega o primeiro preço encontrado
                            preco_texto = matches[0].replace('.', '').replace(',', '.')

                    if not preco_texto:
                        print(f"Debug: Preço não encontrado para {titulo}")
                        continue

                    try:
                        preco = float(preco_texto.replace('.', '').replace(',', '.'))
                        print(f"Debug: Preço encontrado: R$ {preco:.2f}")

                        # Busca a avaliação do produto com seletores mais específicos
                        avaliacao_selectors = [
                            '.ui-pdp-review__rating',  # Seletor principal
                            'span[class*="review__rating"]',  # Variação do seletor
                            '.review-summary-average',  # Seletor alternativo
                            'span[class*="ui-search-reviews__rating"]',  # Novo seletor
                            'div.ui-pdp-header__info span.ui-pdp-review__rating'  # Seletor mais específico
                        ]

                        avaliacao = None
                        num_avaliacoes = None

                        # Tenta encontrar a avaliação
                        for selector in avaliacao_selectors:
                            elementos = item.select(selector)
                            for elem in elementos:
                                texto = elem.get_text(strip=True)
                                try:
                                    # Tenta converter considerando formato X.X ou X,X
                                    avaliacao = float(texto.replace(',', '.'))
                                    if 0 <= avaliacao <= 5:  # Valida se é uma nota válida
                                        break
                                except (ValueError, TypeError):
                                    continue
                            if avaliacao is not None:
                                break

                        # Busca o número de avaliações com seletores mais específicos
                        num_avaliacoes_selectors = [
                            '.ui-pdp-review__amount',  # Seletor principal
                            'span[class*="review__amount"]',  # Variação do seletor
                            'span.ui-pdp-review__amount',  # Seletor específico
                            'span[class*="ui-search-reviews__amount"]'  # Novo seletor
                        ]

                        for selector in num_avaliacoes_selectors:
                            elementos = item.select(selector)
                            for elem in elementos:
                                texto = elem.get_text(strip=True).strip('()').replace('.', '')
                                try:
                                    num_avaliacoes = int(texto)
                                    break
                                except (ValueError, TypeError):
                                    continue
                            if num_avaliacoes is not None:
                                break

                        # Busca alternativa para avaliação no texto do título
                        if avaliacao is None:
                            import re
                            avaliacoes_match = re.search(r'Avaliação (\d+[,.]\d+) de 5', titulo)
                            if avaliacoes_match:
                                try:
                                    avaliacao = float(avaliacoes_match.group(1).replace(',', '.'))
                                except (ValueError, TypeError):
                                    pass

                        # Tenta obter os comentários das avaliações usando o link do produto
                        comentarios = []
                        response = requests.get(link, headers=self.headers)
                        if response.status_code == 200:
                            produto_soup = BeautifulSoup(response.text, 'html.parser')

                            # Procura pelos comentários usando o seletor específico
                            comentario_elems = produto_soup.select('p[class*="ui-review-capability-comments__comment__content"][data-testid="comment-content-component"]')
                            for elem in comentario_elems:
                                texto = elem.get_text(strip=True)
                                if texto and texto not in comentarios:  # Evita duplicatas
                                    comentarios.append(texto)

                            print(f"Debug: Encontrados {len(comentarios)} comentários para o produto")

                        # Se não encontrou comentários na página do produto, tenta capturar da preview
                        if not comentarios:
                            comentario_elems = item.select('p[class*="ui-review-capability-comments__comment__content"][data-testid="comment-content-component"]')
                            for elem in comentario_elems:
                                texto = elem.get_text(strip=True)
                                if texto and texto not in comentarios:  # Evita duplicatas
                                    comentarios.append(texto)

                        # Atualiza a estrutura do produto para incluir avaliações e comentários
                        produtos.append({
                            'id': i,
                            'titulo': titulo,
                            'preco': preco,
                            'link': link,
                            'avaliacao': avaliacao if avaliacao else None,
                            'num_avaliacoes': num_avaliacoes if num_avaliacoes else 0,
                            'comentarios': comentarios
                        })
                        print(f"Debug: Produto adicionado com sucesso - {titulo} - R$ {preco:.2f} - Avaliação: {avaliacao if avaliacao else 'N/A'} ({num_avaliacoes if num_avaliacoes else 0} avaliações) - {len(comentarios)} comentários")
                    except ValueError as e:
                        print(f"Debug: Erro ao converter preço '{preco_texto}': {str(e)}")
                        continue

                except Exception as e:
                    print(f"Erro ao processar item {i}: {str(e)}")
                    continue

            return produtos

        except requests.RequestException as e:
            print(f"Erro na busca: {e}")
            return []

    def get_product_info(self, url):
        """Obtém informações atualizadas de um produto específico"""
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')

            titulo = soup.find('h1', class_='ui-pdp-title') or \
                    soup.find('span', class_='ui-pdp-title')

            preco = soup.find('span', class_='andes-money-amount__fraction') or \
                   soup.find('span', class_='price-tag-fraction')

            if not titulo or not preco:
                raise ValueError("Não foi possível encontrar as informações do produto")

            return {
                'titulo': titulo.text.strip(),
                'preco': float(preco.text.replace('.', '').replace(',', '.'))
            }
        except Exception as e:
            print(f"Erro ao obter informações do produto: {e}")
            return None

    def send_email(self, email_to, produto_info, preco_alvo, url):
        try:
            msg = MIMEMultipart()
            msg['From'] = self.email_from
            msg['To'] = email_to
            msg['Subject'] = f"Alerta de Preço - {produto_info['titulo']}"

            body = f"""
            O produto que você está monitorando teve uma queda de preço!
            
            Produto: {produto_info['titulo']}
            Preço Atual: R$ {produto_info['preco']:.2f}
            Preço Alvo: R$ {preco_alvo:.2f}
            
            Link do produto: {url}
            """

            msg.attach(MIMEText(body, 'plain'))

            server = smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT)
            server.login(self.email_from, self.smtp_password)
            server.send_message(msg)
            server.quit()

            print(f"Email de alerta enviado com sucesso para {email_to}")

        except Exception as e:
            print(f"Erro ao enviar email: {e}")

    def monitor_product(self, url, preco_alvo, email_to, intervalo_segundos=300):
        print(f"\nIniciando monitoramento do produto: {url}")
        print(f"Preço alvo: R$ {preco_alvo:.2f}")

        while True:
            try:
                print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Verificando preço...")
                produto_info = self.get_product_info(url)

                if produto_info:
                    print(f"Produto: {produto_info['titulo']}")
                    print(f"Preço atual: R$ {produto_info['preco']:.2f}")

                    if produto_info['preco'] <= preco_alvo:
                        print("Preço alvo atingido! Enviando email...")
                        self.send_email(email_to, produto_info, preco_alvo, url)

                time.sleep(intervalo_segundos)

            except KeyboardInterrupt:
                print("\nMonitoramento interrompido pelo usuário.")
                break
            except Exception as e:
                print(f"Erro inesperado: {e}")
                time.sleep(intervalo_segundos)

    def save_to_elasticsearch(self, produtos, busca):
        """Salva os resultados da busca no Elasticsearch"""
        try:
            # Inicializa o cliente Elasticsearch
            client = Elasticsearch(
                "https://cce7c968e5f94cb59b5922e251810730.us-central1.gcp.cloud.es.io:443",
                api_key="SHFmNFRaY0ItRGtNRXVmY01Wb0w6b1R2MFpmb1BxR2t0UTRpSnd4V0ZVQQ=="
            )
            index_name = "hp-traker-ml"

            # Prepara os documentos para inserção
            docs = []
            timestamp = datetime.now().isoformat()

            for produto in produtos:
                doc = {
                    "_index": index_name,
                    "_source": {
                        "busca": busca,
                        "timestamp": timestamp,
                        "id": str(produto['id']),
                        "titulo": str(produto['titulo']),
                        "preco": float(produto['preco']),
                        "link": str(produto['link']),
                        "avaliacao": float(produto.get('avaliacao')) if produto.get('avaliacao') else None,
                        "num_avaliacoes": int(produto.get('num_avaliacoes', 0)),
                        "comentarios": produto.get('comentarios', [])
                    }
                }
                docs.append(doc)

            # Insere os documentos em lote
            if docs:
                bulk_response = helpers.bulk(client, docs)
                print(f"\n✓ Dados salvos no Elasticsearch com sucesso!")
                print(f"  - Total de produtos: {len(produtos)}")
                print(f"  - Índice: {index_name}")
                return True
            else:
                print("Nenhum produto para salvar")
                return False

        except Exception as e:
            print(f"\nErro ao salvar no Elasticsearch: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

    def save_to_csv(self, produtos, busca):
        """Método mantido para compatibilidade, agora usa Elasticsearch"""
        return self.save_to_elasticsearch(produtos, busca)

    def search_elasticsearch(self, query, max_results=100):
        """Busca produtos no Elasticsearch"""
        try:
            client = Elasticsearch(
                "https://cce7c968e5f94cb59b5922e251810730.us-central1.gcp.cloud.es.io:443",
                api_key="SHFmNFRaY0ItRGtNRXVmY01Wb0w6b1R2MFpmb1BxR2t0UTRpSnd4V0ZVQQ=="
            )
            index_name = "hp-traker-ml"

            # Constrói a query de busca
            body = {
                "size": max_results,
                "query": {
                    "multi_match": {
                        "query": query,
                        "fields": ["titulo^2", "comentarios"],  # ^2 dá mais peso ao título
                        "type": "best_fields"
                    }
                },
                "sort": [
                    {"timestamp": {"order": "desc"}}  # Ordena do mais recente para o mais antigo
                ]
            }

            # Executa a busca
            response = client.search(index=index_name, body=body)

            # Processa os resultados
            hits = response['hits']['hits']
            resultados = []

            for hit in hits:
                source = hit['_source']
                resultados.append({
                    'score': hit['_score'],
                    'titulo': source['titulo'],
                    'preco': source['preco'],
                    'link': source['link'],
                    'avaliacao': source.get('avaliacao'),
                    'num_avaliacoes': source.get('num_avaliacoes', 0),
                    'comentarios': source.get('comentarios', []),
                    'timestamp': source['timestamp']
                })

            print(f"\n✓ Busca realizada com sucesso!")
            print(f"  - Total de resultados: {len(resultados)}")
            return resultados

        except Exception as e:
            print(f"\nErro ao buscar no Elasticsearch: {str(e)}")
            return []

def main():
    scraper = MercadoLivreScraper()

    # Verifica e cria o diretório de saída no início
    save_dir = '/Users/alansms/Documents/FIAP/2025/mercado-livre-tracker-v2/Mercado-Livre-Scraper-master'
    if not os.path.exists(save_dir):
        try:
            os.makedirs(save_dir)
            print(f"Diretório de saída criado: {save_dir}")
        except Exception as e:
            print(f"Erro ao criar diretório de saída: {e}")
            return

    try:
        while True:
            print("\n=== Monitor de Preços do Mercado Livre ===")
            print("1. Buscar produtos")
            print("2. Buscar no histórico")
            print("3. Sair")

            opcao = input("\nEscolha uma opção: ").strip()

            if opcao == "3":
                break

            if opcao == "1":
                try:
                    busca = input("Digite o produto que deseja buscar: ").strip()
                    print("\nBuscando produtos...")
                    produtos = scraper.search_products(busca)

                    if not produtos:
                        print("Nenhum produto encontrado!")
                        continue

                    print("\nProdutos encontrados:")
                    for produto in produtos:
                        print(f"\n{produto['id']}. {produto['titulo']}")
                        print(f"Preço: R$ {produto['preco']:.2f}")
                        print(f"Link: {produto['link']}")

                    # Salva os resultados no Elasticsearch
                    scraper.save_to_elasticsearch(produtos, busca)

                    try:
                        escolha = int(input("\nDigite o número do produto que deseja monitorar (0 para nova busca): "))
                        if escolha == 0:
                            continue

                        produto_escolhido = next((p for p in produtos if p['id'] == escolha), None)
                        if not produto_escolhido:
                            print("Produto não encontrado!")
                            continue

                        preco_alvo = float(input("Digite o preço alvo (ex: 199.99): ").strip())
                        email = input("Digite seu email para receber alertas: ").strip()

                        # Inicia o monitoramento do produto escolhido
                        scraper.monitor_product(
                            produto_escolhido['link'],
                            preco_alvo,
                            email
                        )

                    except ValueError:
                        print("Entrada inválida! Por favor, digite um número.")
                        continue

                except KeyboardInterrupt:
                    print("\nBusca cancelada pelo usuário.")
                    continue

            elif opcao == "2":
                try:
                    termo = input("Digite o termo para buscar no histórico: ").strip()
                    print("\nBuscando no histórico...")
                    resultados = scraper.search_elasticsearch(termo)

                    if not resultados:
                        print("Nenhum resultado encontrado no histórico!")
                        continue

                    print("\nResultados encontrados:")
                    for i, resultado in enumerate(resultados, 1):
                        print(f"\n{i}. {resultado['titulo']}")
                        print(f"Preço: R$ {resultado['preco']:.2f}")
                        print(f"Link: {resultado['link']}")
                        print(f"Data: {resultado['timestamp']}")
                        if resultado['comentarios']:
                            print(f"Comentários: {len(resultado['comentarios'])}")
                            for comentario in resultado['comentarios'][:2]:  # Mostra só os 2 primeiros
                                print(f"  - {comentario}")
                            if len(resultado['comentarios']) > 2:
                                print("  ...")

                except Exception as e:
                    print(f"Erro durante a busca no histórico: {e}")
                    continue

    except Exception as e:
        print(f"Erro inesperado: {e}")
    finally:
        print("\nPrograma encerrado.")

if __name__ == "__main__":
    main()
