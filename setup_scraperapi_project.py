import os

project_name = "mercado_livre_scraper"
spider_name = "produtos"
api_key_placeholder = "7d54e975abce96fe2fc4ee11cd28cf64"

base_path = os.path.join(os.getcwd(), project_name)
spiders_path = os.path.join(base_path, project_name, "spiders")

# Arquivos e seus conteúdos
files = {
    os.path.join(base_path, "scrapy.cfg"): f"""\
[settings]
default = {project_name}.settings
""",

    os.path.join(base_path, project_name, "__init__.py"): "",
    os.path.join(base_path, project_name, "items.py"): """\
import scrapy

class MercadoLivreItem(scrapy.Item):
    titulo = scrapy.Field()
    preco = scrapy.Field()
    link = scrapy.Field()
    avaliacao = scrapy.Field()
    vendedor = scrapy.Field()
""",

    os.path.join(base_path, project_name, "middlewares.py"): "",
    os.path.join(base_path, project_name, "pipelines.py"): "",
    os.path.join(base_path, project_name, "settings.py"): f"""\
BOT_NAME = '{project_name}'

SPIDER_MODULES = ['{project_name}.spiders']
NEWSPIDER_MODULE = '{project_name}.spiders'

ROBOTSTXT_OBEY = False

SCRAPEOPS_API_KEY = '{api_key_placeholder}'

FEEDS = {{
    'produtos.csv': {{
        'format': 'csv',
        'encoding': 'utf8',
        'overwrite': True
    }}
}}

DOWNLOAD_DELAY = 1
""",

    os.path.join(spiders_path, "__init__.py"): "",
    os.path.join(spiders_path, f"{spider_name}.py"): """\
import scrapy
from ..items import MercadoLivreItem
import sys

class ProdutosSpider(scrapy.Spider):
    name = 'produtos'
    
    def start_requests(self):
        # Solicita o termo de busca ao usuário
        print("Digite o produto que deseja buscar:")
        termo_busca = input().strip()
        
        # Codifica o termo de busca para URL
        url = f'https://lista.mercadolivre.com.br/{termo_busca}'
        yield scrapy.Request(url=url, callback=self.parse)

    def parse(self, response):
        produtos = response.css('div.ui-search-result__wrapper')
        
        for produto in produtos:
            item = MercadoLivreItem()
            
            item['titulo'] = produto.css('h2.ui-search-item__title::text').get()
            item['link'] = produto.css('a.ui-search-item__group__element::attr(href)').get()
            
            # Extrai o preço
            preco = produto.css('span.andes-money-amount__fraction::text').get()
            item['preco'] = preco.strip() if preco else 'Não informado'
            
            # Extrai avaliação (estrelas)
            avaliacao = produto.css('span.ui-search-reviews__rating-number::text').get()
            item['avaliacao'] = avaliacao if avaliacao else 'Sem avaliação'
            
            # Faz uma requisição adicional para a página do produto para obter o vendedor
            yield scrapy.Request(
                url=item['link'],
                callback=self.parse_product_details,
                meta={'item': item}
            )
        
        # Paginação
        next_page = response.css('a.andes-pagination__link[title="Seguinte"]::attr(href)').get()
        if next_page:
            yield scrapy.Request(url=next_page, callback=self.parse)

    def parse_product_details(self, response):
        item = response.meta['item']
        
        # Extrai o nome do vendedor
        vendedor = response.css('span.ui-pdp-seller__link-trigger::text').get()
        if not vendedor:
            vendedor = response.css('div.ui-seller-info span::text').get()
        
        item['vendedor'] = vendedor.strip() if vendedor else 'Vendedor não informado'
        
        yield item
"""
}

# Criar diretórios
os.makedirs(spiders_path, exist_ok=True)

# Criar arquivos
for file_path, content in files.items():
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Projeto Scrapy criado com sucesso!")
print("Para executar o spider, navegue até o diretório do projeto e execute:")
print(f"scrapy crawl {spider_name}")
