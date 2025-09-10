import scrapy

SCRAPERAPI_KEY = "7d54e975abce96fe2fc4ee11cd28cf64"

class ProdutosSpider(scrapy.Spider):
    name = "produtos_scraperapi"
    allowed_domains = ["scraperapi.com"]
    start_urls = [
        f"http://api.scraperapi.com/?api_key={SCRAPERAPI_KEY}&url=https://lista.mercadolivre.com.br/cartucho-hp-664"
    ]

    def parse(self, response):
        for produto in response.css("li.ui-search-layout__item"):
            yield {
                'titulo': produto.css("h2.ui-search-item__title::text").get(),
                'preco': produto.css("span.andes-money-amount__fraction::text").get(),
                'link': produto.css("a.ui-search-link::attr(href)").get(),
            }

        # Captura da próxima página (dentro da resposta já processada pelo ScraperAPI)
        next_page = response.css("li.andes-pagination__button--next a::attr(href)").get()
        if next_page:
            yield scrapy.Request(
                url=f"http://api.scraperapi.com/?api_key={SCRAPERAPI_KEY}&url={next_page}",
                callback=self.parse
            )