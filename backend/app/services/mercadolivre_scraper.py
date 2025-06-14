from playwright.async_api import async_playwright
import asyncio
import re
from typing import Dict, List, Optional, Any
import logging
from datetime import datetime
from playwright._impl._errors import TimeoutError

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("mercadolivre_scraper")

class MercadoLivreScraper:
    """
    Scraper para extrair informações de produtos do Mercado Livre
    utilizando Playwright para automação de navegador.
    """
    
    def __init__(self, headless: bool = True, slow_mo: int = 50):
        """
        Inicializa o scraper do Mercado Livre.
        
        Args:
            headless: Se True, executa o navegador em modo headless (sem interface gráfica)
            slow_mo: Tempo em ms para desacelerar as ações do Playwright (útil para debugging)
        """
        self.headless = headless
        self.slow_mo = slow_mo
        self.base_url = "https://www.mercadolivre.com.br"
        self.playwright = None
        self.browser = None
        self.context = None
        self.page = None
        self.timeout = 30000  # 30 segundos de timeout padrão

    async def start(self):
        """Inicia o navegador e cria um novo contexto."""
        try:
            logger.info("Iniciando navegador Playwright")
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(
                headless=self.headless,
                slow_mo=self.slow_mo
            )

            # Configurar o contexto do navegador com viewport e user agent
            self.context = await self.browser.new_context(
                viewport={"width": 1366, "height": 768},
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36"
            )

            # Criar uma nova página e configurar timeout
            self.page = await self.context.new_page()
            self.page.set_default_navigation_timeout(self.timeout)
            self.page.set_default_timeout(self.timeout)

            # Interceptar requisições para otimizar a performance
            await self.page.route("**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2,ttf,otf}",
                lambda route: route.abort())

            logger.info("Navegador iniciado com sucesso")

        except Exception as e:
            logger.error(f"Erro ao iniciar navegador: {str(e)}")
            await self.stop()
            raise

    async def stop(self):
        """Fecha o navegador e libera recursos."""
        logger.info("Fechando navegador")
        try:
            if self.page:
                await self.page.close()
            if self.context:
                await self.context.close()
            if self.browser:
                await self.browser.close()
            if self.playwright:
                await self.playwright.stop()
            logger.info("Navegador fechado com sucesso")
        except Exception as e:
            logger.error(f"Erro ao fechar navegador: {str(e)}")

    async def get_product_reviews(self, link: str) -> List[Dict[str, Any]]:
        """
        Extrai as avaliações em destaque de um produto.

        Args:
            link: URL do produto

        Returns:
            Lista de avaliações com data, nota e comentário
        """
        try:
            await self.page.goto(link, wait_until="networkidle")
            reviews = []

            # Aguarda a seção de avaliações carregar
            review_section = await self.page.wait_for_selector("div.ui-review-capability-filter", timeout=5000)
            if not review_section:
                return []

            # Captura cada avaliação em destaque
            review_elements = await self.page.query_selector_all("div.ui-review-capability-filter > div > div > div > article")

            for review in review_elements:
                try:
                    # Captura a avaliação (5 de 5, etc)
                    rating_text = await review.query_selector("div:has-text('Avaliação')")
                    rating = None
                    if rating_text:
                        rating_content = await rating_text.text_content()
                        rating_match = re.search(r'Avaliação (\d+) de 5', rating_content)
                        if rating_match:
                            rating = int(rating_match.group(1))

                    # Captura a data
                    date_element = await review.query_selector("span:right-of(:text('Avaliação'))")
                    date = await date_element.text_content() if date_element else None

                    # Captura o comentário usando a classe específica
                    comment_element = await review.query_selector("p.ui-review-capability-comments__comment__content")
                    comment = await comment_element.text_content() if comment_element else None

                    if date and rating is not None and comment:
                        reviews.append({
                            "date": date.strip(),
                            "rating": rating,
                            "comment": comment.strip()
                        })

                        # Limita a 4 avaliações em destaque
                        if len(reviews) >= 4:
                            break

                except Exception as e:
                    logger.error(f"Erro ao extrair avaliação específica: {str(e)}")
                    continue

            return reviews

        except Exception as e:
            logger.error(f"Erro ao extrair avaliações: {str(e)}")
            return []

    async def search_product(self, query):
        """
        Pesquisa produtos no Mercado Livre via scraping direto da página de resultados.

        Args:
            query: Termo de busca (ex: nome do produto)

        Returns:
            Lista de produtos com título, preço, link e imagem
        """
        logger.info(f"Pesquisando produtos com query: {query}")
        search_url = f"{self.base_url}/lista/{query.replace(' ', '-')}"

        await self.page.goto(search_url, wait_until="networkidle", timeout=30000)

        products = []
        product_cards = await self.page.query_selector_all("ol.ui-search-layout li.ui-search-layout__item")

        for card in product_cards:
            try:
                title = await card.query_selector("h2.ui-search-item__title")
                title_text = await title.text_content() if title else None

                price = await card.query_selector("span.price-tag-fraction")
                price_text = await price.text_content() if price else None

                link = await card.query_selector("a.ui-search-item__group__element")
                link_href = await link.get_attribute("href") if link else None

                if title_text and price_text and link_href:
                    # Captura as avaliações do produto
                    reviews = await self.get_product_reviews(link_href)

                    products.append({
                        "title": title_text,
                        "price": float(price_text.replace(".", "").replace(",", ".")),
                        "link": link_href,
                        "reviews": reviews
                    })

            except Exception as e:
                logger.error(f"Erro ao extrair dados do produto: {str(e)}")
                continue

        return products
    async def extract_product_details(self, url: str) -> Dict[str, Any]:
        """
        Extrai informações detalhadas de um produto específico.
        
        Args:
            url: URL do produto no Mercado Livre
            
        Returns:
            Dicionário com informações detalhadas do produto
        """
        logger.info(f"Extraindo detalhes do produto: {url}")
        
        # Navegar para a página do produto
        await self.page.goto(url, wait_until="domcontentloaded")
        
        # Esperar carregamento dos elementos principais
        await self.page.wait_for_selector(".ui-pdp-title", timeout=10000)
        
        # Extrair informações detalhadas
        product_details = await self.page.evaluate("""() => {
            // Função auxiliar para extrair texto seguro
            const safeText = (selector) => {
                const element = document.querySelector(selector);
                return element ? element.innerText.trim() : null;
            };
            
            // Função para extrair atributos
            const getAttributes = () => {
                const attributes = {};
                const attributeElements = document.querySelectorAll('.ui-pdp-specs__table .andes-table__row');
                
                attributeElements.forEach(row => {
                    const nameElement = row.querySelector('.andes-table__header');
                    const valueElement = row.querySelector('.andes-table__column');
                    
                    if (nameElement && valueElement) {
                        const name = nameElement.innerText.trim();
                        const value = valueElement.innerText.trim();
                        attributes[name] = value;
                    }
                });
                
                return attributes;
            };
            
            // Extrair preço atual
            const priceElement = document.querySelector('.andes-money-amount__fraction');
            const priceDecimalElement = document.querySelector('.andes-money-amount__cents');
            let price = priceElement ? priceElement.innerText.replace(/\\D/g, '') : '0';
            
            if (priceDecimalElement) {
                price = `${price}.${priceDecimalElement.innerText}`;
            }
            
            // Extrair avaliações
            const ratingElement = document.querySelector('.ui-pdp-reviews__rating');
            const ratingCountElement = document.querySelector('.ui-pdp-reviews__amount');
            
            // Verificar se está disponível
            const availabilityElement = document.querySelector('.ui-pdp-stock-information');
            const isAvailable = !availabilityElement || !availabilityElement.innerText.includes('esgotado');
            
            return {
                title: safeText('.ui-pdp-title'),
                price: parseFloat(price),
                original_price: safeText('.ui-pdp-price__original-value') ? 
                    parseFloat(safeText('.ui-pdp-price__original-value').replace(/[^0-9,.]/g, '').replace(',', '.')) : null,
                seller: {
                    name: safeText('.ui-pdp-seller__header__title'),
                    is_official: !!document.querySelector('.ui-pdp-official-store-label'),
                    url: document.querySelector('.ui-pdp-seller__header__title a')?.href || null,
                },
                rating: ratingElement ? parseFloat(ratingElement.innerText.replace(',', '.')) : null,
                rating_count: ratingCountElement ? parseInt(ratingCountElement.innerText.replace(/\\D/g, '')) : 0,
                available: isAvailable,
                attributes: getAttributes(),
                images: Array.from(document.querySelectorAll('.ui-pdp-gallery__figure img')).map(img => img.src),
                description: safeText('.ui-pdp-description__content'),
                extracted_at: new Date().toISOString()
            };
        }""")
        
        # Extrair informações do vendedor
        product_details['seller_details'] = await self._extract_seller_details(product_details['seller']['url'])
        
        logger.info(f"Detalhes extraídos com sucesso para: {product_details['title']}")
        return product_details
    
    async def _extract_seller_details(self, seller_url: Optional[str]) -> Dict[str, Any]:
        """
        Extrai informações detalhadas do vendedor.
        
        Args:
            seller_url: URL do perfil do vendedor
            
        Returns:
            Dicionário com informações do vendedor
        """
        if not seller_url:
            return {
                "reputation": None,
                "sales_completed": None,
                "is_authorized": False
            }
        
        logger.info(f"Extraindo detalhes do vendedor: {seller_url}")
        
        # Abrir nova página para o vendedor
        seller_page = await self.context.new_page()
        await seller_page.goto(seller_url, wait_until="domcontentloaded")
        
        # Extrair informações do vendedor
        try:
            await seller_page.wait_for_selector(".seller-info", timeout=5000)
            
            seller_details = await seller_page.evaluate("""() => {
                // Função auxiliar para extrair texto seguro
                const safeText = (selector) => {
                    const element = document.querySelector(selector);
                    return element ? element.innerText.trim() : null;
                };
                
                // Verificar se é vendedor oficial/autorizado
                const isAuthorized = !!document.querySelector('.official-store-info');
                
                // Extrair reputação
                const reputationElement = document.querySelector('.seller-reputation-badge');
                const reputation = reputationElement ? 
                    reputationElement.className.includes('positive') ? 'Positiva' :
                    reputationElement.className.includes('neutral') ? 'Neutra' : 'Negativa'
                    : null;
                
                // Extrair vendas concluídas
                const salesText = safeText('.seller-info__sales-completed');
                const salesMatch = salesText ? salesText.match(/(\\d+)/) : null;
                const salesCompleted = salesMatch ? parseInt(salesMatch[1]) : null;
                
                return {
                    reputation: reputation,
                    sales_completed: salesCompleted,
                    is_authorized: isAuthorized,
                    location: safeText('.seller-info__address'),
                    since: safeText('.seller-info__time-in-site')
                };
            }""")
        except Exception as e:
            logger.error(f"Erro ao extrair detalhes do vendedor: {str(e)}")
            seller_details = {
                "reputation": None,
                "sales_completed": None,
                "is_authorized": False,
                "error": str(e)
            }
        
        # Fechar página do vendedor
        await seller_page.close()
        
        return seller_details
    
    async def monitor_price(self, url: str, check_interval: int = 6) -> Dict[str, Any]:
        """
        Monitora o preço de um produto específico.
        
        Args:
            url: URL do produto no Mercado Livre
            check_interval: Intervalo de verificação em horas
            
        Returns:
            Dicionário com informações de preço e timestamp
        """
        logger.info(f"Monitorando preço do produto: {url}")
        
        # Extrair detalhes completos do produto
        product_details = await self.extract_product_details(url)
        
        # Criar registro de monitoramento
        monitoring_record = {
            "product_title": product_details["title"],
            "current_price": product_details["price"],
            "original_price": product_details["original_price"],
            "seller": product_details["seller"]["name"],
            "is_available": product_details["available"],
            "timestamp": datetime.now().isoformat(),
            "check_interval_hours": check_interval,
            "next_check": (datetime.now().timestamp() + (check_interval * 3600)) * 1000  # Próxima verificação em ms
        }
        
        logger.info(f"Monitoramento registrado para: {product_details['title']}")
        return monitoring_record
    
    async def extract_pn_from_title(self, title: str) -> Optional[str]:
        """
        Tenta extrair o Part Number (PN) do título do produto.
        
        Args:
            title: Título do produto
            
        Returns:
            Part Number extraído ou None se não encontrado
        """
        # Padrões comuns de PN para cartuchos de impressora
        patterns = [
            r'(\d[A-Z]{1,2}\d{3,4}[A-Z]{1,2})',  # Padrão HP como 3YM84AB
            r'(T\d{3,6})',                       # Padrão Epson como T544
            r'(LC\d{2,4}[A-Z]{1,2})',            # Padrão Brother como LC3019BK
            r'(PG-\d{3,4})',                     # Padrão Canon como PG-210
            r'(CL-\d{3,4})',                     # Padrão Canon como CL-211
        ]
        
        for pattern in patterns:
            match = re.search(pattern, title)
            if match:
                return match.group(1)
        
        return None
    
    async def check_authorized_seller(self, seller_name: str, authorized_sellers: List[str]) -> bool:
        """
        Verifica se um vendedor está na lista de vendedores autorizados.
        
        Args:
            seller_name: Nome do vendedor
            authorized_sellers: Lista de vendedores autorizados
            
        Returns:
            True se o vendedor estiver autorizado, False caso contrário
        """
        # Normalizar nomes para comparação
        seller_name_normalized = seller_name.lower().strip()
        authorized_sellers_normalized = [s.lower().strip() for s in authorized_sellers]
        
        # Verificar correspondência exata
        if seller_name_normalized in authorized_sellers_normalized:
            return True
        
        # Verificar correspondência parcial (para casos como "Loja Oficial X" vs "X")
        for auth_seller in authorized_sellers_normalized:
            if auth_seller in seller_name_normalized or seller_name_normalized in auth_seller:
                return True
        
        return False
    
    async def batch_process_products(self, urls: List[str]) -> List[Dict[str, Any]]:
        """
        Processa um lote de produtos em paralelo.
        
        Args:
            urls: Lista de URLs de produtos
            
        Returns:
            Lista de detalhes dos produtos processados
        """
        logger.info(f"Processando lote de {len(urls)} produtos")
        
        results = []
        for url in urls:
            try:
                product_details = await self.extract_product_details(url)
                results.append(product_details)
            except Exception as e:
                logger.error(f"Erro ao processar produto {url}: {str(e)}")
                results.append({"url": url, "error": str(e)})
        
        logger.info(f"Lote processado com sucesso: {len(results)} produtos")
        return results

    async def search_products(self, query: str) -> List[Dict[str, Any]]:
        """
        Pesquisa produtos no Mercado Livre.

        Args:
            query: Termo de busca

        Returns:
            Lista de produtos encontrados no formato do schema ProductSearch
        """
        logger.info(f"Iniciando busca por: {query}")
        search_url = f"{self.base_url}/busca/{query.replace(' ', '-')}"

        try:
            await self.page.goto(search_url)
            await self.page.wait_for_selector('.ui-search-layout__item', timeout=5000)

            # Extrai informações dos produtos usando JavaScript
            products = await self.page.evaluate("""() => {
                return Array.from(document.querySelectorAll('.ui-search-layout__item')).slice(0, 20).map(item => {
                    const title = item.querySelector('.ui-search-item__title')?.innerText?.trim() || 'Sem título';
                    const priceElement = item.querySelector('.price-tag-amount');
                    const price = priceElement ? 
                        parseFloat(priceElement.innerText.replace(/[^0-9,]/g, '').replace(',', '.')) : 0;
                    const url = item.querySelector('a.ui-search-item__group__element')?.href || '';
                    const seller = item.querySelector('.ui-search-official-store-label')?.innerText?.trim() || 
                                 item.querySelector('.ui-search-item__brand-title')?.innerText?.trim() || 
                                 'Vendedor não informado';
                    const image = item.querySelector('.ui-search-result-image__element img')?.src || null;
                    
                    // Tenta extrair o PN do título
                    const pnMatch = title.match(/[A-Z0-9]{5,}-[A-Z0-9]{3,}|[A-Z0-9]{5,}/);
                    const pn = pnMatch ? pnMatch[0] : null;
                    
                    return {
                        title,
                        price,
                        url,
                        seller,
                        image,
                        pn
                    };
                });
            }""")

            logger.info(f"Encontrados {len(products)} produtos")
            return products

        except Exception as e:
            logger.error(f"Erro durante a busca: {str(e)}")
            raise Exception(f"Erro ao buscar produtos: {str(e)}")

# Exemplo de uso
async def main():
    scraper = MercadoLivreScraper(headless=True)
    try:
        await scraper.start()
        
        # Exemplo 1: Pesquisar produtos
        products = await scraper.search_product("cartucho hp 664xl preto")
        print(f"Encontrados {len(products)} produtos")
        
        if products:
            # Exemplo 2: Extrair detalhes do primeiro produto
            first_product_url = products[0]["url"]
            details = await scraper.extract_product_details(first_product_url)
            print(f"Detalhes do produto: {details['title']}")
            print(f"Preço: R$ {details['price']}")
            print(f"Vendedor: {details['seller']['name']}")
            print(f"Avaliação: {details['rating']} ({details['rating_count']} avaliações)")
            
            # Exemplo 3: Monitorar preço
            monitoring = await scraper.monitor_price(first_product_url)
            print(f"Monitoramento configurado para verificação a cada {monitoring['check_interval_hours']} horas")
            
    finally:
        await scraper.stop()

if __name__ == "__main__":
    asyncio.run(main())
