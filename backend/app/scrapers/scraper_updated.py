from bs4 import BeautifulSoup
import requests
import time
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from datetime import datetime
from urllib.parse import quote_plus
import json
import uuid

# Configurações do email do arquivo .env
SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtps.uhserver.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', '465'))
SMTP_USER = os.getenv('SMTP_USER', 'suporte@smstecnologia.com.br')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '@#Pipocas@#!!79')

class MercadoLivreScraper:
    def __init__(self, headless=False):
        self.email_from = SMTP_USER
        self.smtp_password = SMTP_PASSWORD
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        self.headless = headless

    async def start(self):
        # Método para compatibilidade com API assíncrona
        pass

    async def stop(self):
        # Método para compatibilidade com API assíncrona
        pass

    def search_products(self, query):
        """Busca produtos no Mercado Livre"""
        busca_encoded = quote_plus(query)
        url = f'https://lista.mercadolivre.com.br/{busca_encoded}'

        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'html.parser')

            produtos = []
            # Primeiro, tenta encontrar o container principal
            main_container = soup.select_one('.ui-search-results')
            if not main_container:
                print("Container principal não encontrado")
                return produtos

            # Atualização dos seletores para corresponder à estrutura atual do ML
            items = main_container.select('.ui-search-layout__item')

            if not items:
                print("Tentando seletores alternativos...")
                items = main_container.select('.ui-search-result')

            if not items:
                print("Tentando mais seletores alternativos...")
                items = main_container.select('[class*="ui-search-layout__item"]')

            if not items:
                print("Nenhum item encontrado após tentar todos os seletores")
                return produtos

            for i, item in enumerate(items, 1):
                try:
                    # Busca o título com seletores mais específicos e atualizados
                    titulo_selectors = [
                        'div[class*="ui-search-item__group"] h2',
                        'div[class*="ui-search-item__group"] span',
                        '.ui-search-item__title',
                        'h2.ui-search-item__title',
                        '.shops__item-title',
                        'div > div > div > div:nth-child(2)',
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
                            if texto and len(texto) > 5:
                                titulo = texto
                                titulo_elem = elem
                                found_title = True
                                break
                    if not titulo_elem or not titulo:
                        continue

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
                        continue

                    link = link_elem['href']

                    # Busca o preço com seletores mais específicos
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
                        continue

                    try:
                        preco = float(preco_texto.replace('.', '').replace(',', '.'))

                        # Busca a avaliação do produto com seletores mais específicos
                        avaliacao_selectors = [
                            '.ui-pdp-review__rating',
                            'span[class*="review__rating"]',
                            '.review-summary-average',
                            'span[class*="ui-search-reviews__rating"]',
                            'div.ui-pdp-header__info span.ui-pdp-review__rating'
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
                            '.ui-pdp-review__amount',
                            'span[class*="review__amount"]',
                            'span.ui-pdp-review__amount',
                            'span[class*="ui-search-reviews__amount"]'
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

                        # Tenta obter os comentários das avaliações usando o link do produto
                        comentarios = []

                        # Gerar um ID único para o produto
                        produto_id = str(uuid.uuid4())

                        # Adicionar o produto à lista de resultados
                        produto = {
                            'id': produto_id,
                            'titulo': titulo,
                            'link': link,
                            'preco': preco,
                            'avaliacao': avaliacao,
                            'num_avaliacoes': num_avaliacoes,
                            'comentarios': comentarios
                        }

                        produtos.append(produto)

                    except Exception as e:
                        print(f"Erro ao processar preço: {str(e)}")
                        continue

                except Exception as e:
                    print(f"Erro ao processar item: {str(e)}")
                    continue

            return produtos

        except Exception as e:
            print(f"Erro na busca: {str(e)}")
            return []

    async def extract_product_details(self, url):
        """Extrai detalhes completos de um produto específico"""
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'html.parser')

            # Extrair título do produto
            titulo_elem = soup.select_one('h1.ui-pdp-title')
            titulo = titulo_elem.get_text(strip=True) if titulo_elem else "Título não encontrado"

            # Extrair preço
            preco_elem = soup.select_one('span.andes-money-amount__fraction')
            preco = 0.0
            if preco_elem:
                preco_texto = preco_elem.get_text(strip=True)
                try:
                    preco = float(preco_texto.replace('.', ''))
                except ValueError:
                    preco = 0.0

            # Extrair imagem principal
            imagem_elem = soup.select_one('img.ui-pdp-image')
            imagem_url = imagem_elem['src'] if imagem_elem and 'src' in imagem_elem.attrs else None

            # Extrair descrição
            descricao_elem = soup.select_one('p.ui-pdp-description__content')
            descricao = descricao_elem.get_text(strip=True) if descricao_elem else "Sem descrição"

            # Extrair avaliações
            avaliacao_elem = soup.select_one('span.ui-pdp-review__rating')
            avaliacao = 0.0
            if avaliacao_elem:
                try:
                    avaliacao = float(avaliacao_elem.get_text(strip=True).replace(',', '.'))
                except ValueError:
                    avaliacao = 0.0

            # Extrair comentários
            comentarios = []
            comentario_elems = soup.select('p.ui-review-capability-comments__comment__content')
            for elem in comentario_elems:
                comentarios.append(elem.get_text(strip=True))

            # Criar objeto de resposta
            return {
                "id": str(uuid.uuid4()),
                "title": titulo,
                "price": preco,
                "description": descricao,
                "image_url": imagem_url,
                "link": url,
                "rating": avaliacao,
                "reviews": comentarios,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }

        except Exception as e:
            print(f"Erro ao extrair detalhes do produto: {str(e)}")
            raise

    async def monitor_price(self, url, check_interval=3600):
        """Iniciar monitoramento de preço de um produto"""
        try:
            # Extrair detalhes iniciais do produto
            product_details = await self.extract_product_details(url)

            return {
                "product_id": product_details["id"],
                "product_title": product_details["title"],
                "current_price": product_details["price"],
                "monitoring_started": datetime.now().isoformat(),
                "check_interval_seconds": check_interval
            }

        except Exception as e:
            print(f"Erro ao iniciar monitoramento: {str(e)}")
            raise

    async def batch_process_products(self, urls):
        """Processa vários produtos em lote"""
        results = []
        for url in urls:
            try:
                product_details = await self.extract_product_details(url)
                results.append(product_details)
            except Exception as e:
                print(f"Erro ao processar produto {url}: {str(e)}")
                # Continua processando mesmo com erro em um item

        return results
