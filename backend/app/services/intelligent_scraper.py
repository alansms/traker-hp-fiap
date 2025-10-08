#!/usr/bin/env python3
"""
Serviço de scraping inteligente que busca produtos suspeitos
baseado nos produtos cadastrados e vendedores de confiança
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from ..db.session import SessionLocal
from ..models.product import Product
from ..models.trusted_seller import TrustedSeller
from ..models.suspicious_threshold import SuspiciousThreshold
from ..models.suspicious_product import SuspiciousProduct
from ..scrapers.enhanced_ml_scraper import search_ml_product
from ..scrapers.ipv6_adapter import force_ipv6

logger = logging.getLogger(__name__)

class IntelligentScraper:
    """Scraper inteligente para detectar produtos suspeitos"""
    
    def __init__(self):
        self.db = SessionLocal()
    
    def __del__(self):
        if hasattr(self, 'db'):
            self.db.close()
    
    async def get_active_threshold(self) -> Optional[SuspiciousThreshold]:
        """Obtém a configuração de margem ativa"""
        try:
            threshold = self.db.query(SuspiciousThreshold).filter(
                SuspiciousThreshold.is_active == True
            ).first()
            return threshold
        except Exception as e:
            logger.error(f"Erro ao buscar configuração de margem: {e}")
            return None
    
    async def get_trusted_sellers(self) -> List[TrustedSeller]:
        """Obtém lista de vendedores de confiança"""
        try:
            sellers = self.db.query(TrustedSeller).filter(
                TrustedSeller.is_active == True
            ).all()
            return sellers
        except Exception as e:
            logger.error(f"Erro ao buscar vendedores de confiança: {e}")
            return []
    
    async def get_products_to_search(self, limit: int = 20) -> List[Product]:
        """Obtém produtos ativos para busca com limite"""
        try:
            # Buscar produtos ativos que não foram buscados recentemente
            cutoff_time = datetime.now() - timedelta(hours=6)  # Últimas 6 horas
            
            products = self.db.query(Product).filter(
                and_(
                    Product.is_active == True,
                    or_(
                        Product.last_search.is_(None),
                        Product.last_search < cutoff_time
                    )
                )
            ).limit(limit).all()  # Limitar a 5 produtos por execução
            
            return products
        except Exception as e:
            logger.error(f"Erro ao buscar produtos para análise: {e}")
            return []
    
    def calculate_suspicion_level(self, price_difference_percentage: float) -> str:
        """Calcula o nível de suspeita baseado na diferença de preço"""
        if price_difference_percentage >= 70:
            return "CRITICAL"
        elif price_difference_percentage >= 50:
            return "HIGH"
        elif price_difference_percentage >= 30:
            return "MEDIUM"
        else:
            return "LOW"
    
    async def is_trusted_seller(self, seller_id: str) -> bool:
        """Verifica se o vendedor é de confiança"""
        trusted_sellers = await self.get_trusted_sellers()
        return any(seller.seller_id == seller_id for seller in trusted_sellers)
    
    def validate_product_match(self, registered_product: Product, found_product: dict) -> bool:
        """Valida se o produto encontrado corresponde ao produto cadastrado"""
        try:
            # Extrair informações do produto encontrado
            found_title = found_product.get('title', '').lower()
            found_seller = found_product.get('seller_name', '').lower()
            
            # Verificar se contém palavras-chave do produto cadastrado
            product_name_lower = registered_product.name.lower()
            key_words = product_name_lower.split()
            
            # Remover palavras muito comuns que podem causar falsos negativos
            common_words = {'hp', 'cartucho', 'tinta', 'de', 'da', 'do', 'para', 'com', 'em', 'no', 'na', 'xl', 'xl', 'preto', 'colorido', 'tricolor', 'magenta', 'ciano', 'amarelo'}
            filtered_words = [word for word in key_words if word not in common_words and len(word) > 2]
            
            # Se não há palavras significativas, usar todas as palavras
            if not filtered_words:
                filtered_words = key_words
            
            # Pelo menos 60% das palavras-chave devem estar presentes (reduzido de 70%)
            matches = sum(1 for word in filtered_words if word in found_title)
            match_percentage = matches / len(filtered_words) if filtered_words else 0
            
            logger.info(f"Validação de produto - {registered_product.name}")
            logger.info(f"Palavras-chave: {filtered_words}")
            logger.info(f"Título encontrado: {found_title}")
            logger.info(f"Correspondência: {matches}/{len(filtered_words)} ({match_percentage:.1%})")
            
            if match_percentage < 0.6:
                logger.info(f"Baixa correspondência de palavras-chave: {match_percentage:.1%}")
                return False
            
            # Verificar se é produto original (se o produto cadastrado for original)
            if 'original' in product_name_lower and 'compatível' in found_title:
                logger.info("Produto original cadastrado, mas encontrado compatível")
                return False
            
            # Verificar se é produto compatível (se o produto cadastrado for compatível)
            if 'compatível' in product_name_lower and 'original' in found_title:
                logger.info("Produto compatível cadastrado, mas encontrado original")
                return False
            
            logger.info(f"✅ Produto validado com sucesso: {found_title}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao validar produto: {e}")
            return False
    
    async def analyze_product(self, product: Product, search_results: List[Dict]) -> List[SuspiciousProduct]:
        """Analisa os resultados de busca de um produto"""
        suspicious_products = []
        threshold = await self.get_active_threshold()
        
        if not threshold:
            logger.warning("Nenhuma configuração de margem ativa encontrada")
            return suspicious_products
        
        reference_price = product.reference_price
        if reference_price <= 0:
            logger.warning(f"Produto {product.name} não tem preço de referência válido")
            return suspicious_products
        
        for result in search_results:
            try:
                # Verificar se o vendedor é de confiança
                seller_id = result.get('seller_id', '')
                if await self.is_trusted_seller(seller_id):
                    logger.info(f"Vendedor {seller_id} é de confiança, ignorando produto")
                    continue
                
                # Calcular diferença de preço
                found_price = float(result.get('price', 0))
                if found_price <= 0:
                    logger.info(f"Preço inválido encontrado: {found_price} para {result.get('title', '')}")
                    continue
                
                price_difference = reference_price - found_price
                price_difference_percentage = (price_difference / reference_price) * 100
                
                logger.info(f"Análise de preço - Produto: {result.get('title', '')}")
                logger.info(f"Preço de referência: R$ {reference_price:.2f}")
                logger.info(f"Preço encontrado: R$ {found_price:.2f}")
                logger.info(f"Diferença: R$ {price_difference:.2f} ({price_difference_percentage:.1f}%)")
                logger.info(f"Margem configurada: {threshold.threshold_percentage}%")
                
                # Verificar se está abaixo da margem configurada
                if price_difference_percentage >= threshold.threshold_percentage:
                    # Criar registro de produto suspeito
                    suspicion_level = self.calculate_suspicion_level(price_difference_percentage)
                    
                    suspicious_product = SuspiciousProduct(
                        product_id=product.id,
                        title=result.get('title', ''),
                        price=found_price,
                        reference_price=reference_price,
                        price_difference=price_difference,
                        price_difference_percentage=price_difference_percentage,
                        seller_name=result.get('seller_name', ''),
                        seller_id=seller_id,
                        seller_rating=result.get('seller_rating', 0),
                        product_url=result.get('url', ''),
                        ml_item_id=result.get('ml_item_id', ''),
                        image_url=result.get('image_url', ''),
                        suspicion_level=suspicion_level,
                        notes=f"Detectado automaticamente - {threshold.name}"
                    )
                    
                    suspicious_products.append(suspicious_product)
                    logger.info(f"Produto suspeito detectado: {result.get('title', '')} - {price_difference_percentage:.1f}% abaixo do preço de referência")
                
            except Exception as e:
                logger.error(f"Erro ao analisar produto: {e}")
                continue
        
        return suspicious_products
    
    async def run_intelligent_scraping(self) -> Dict[str, Any]:
        # Forçar uso de IPv6
        force_ipv6()

        """Executa o scraping inteligente"""
        logger.info("Iniciando scraping inteligente...")
        
        try:
            # Obter produtos para busca
            products = await self.get_products_to_search()
            if not products:
                logger.info("Nenhum produto encontrado para análise")
                return {
                    "success": True,
                    "message": "Nenhum produto encontrado para análise",
                    "products_analyzed": 0,
                    "suspicious_found": 0
                }
            
            total_suspicious = 0
            products_analyzed = 0
            
            for product in products:
                try:
                    logger.info(f"Analisando produto: {product.name}")
                    
                    # Buscar produtos no Mercado Livre com validação específica
                    search_results = search_ml_product(product.search_terms)
                    if not search_results:
                        logger.warning(f"Nenhum resultado encontrado para: {product.name}")
                        continue
                    
                    # Validar se o produto encontrado corresponde ao produto cadastrado
                    if not self.validate_product_match(product, search_results):
                        logger.info(f"Produto encontrado não corresponde ao produto cadastrado: {product.name}")
                        continue
                    
                    search_results = [search_results]  # Converter para lista
                    
                    # Adicionar delay para evitar sobrecarga
                    import time
                    time.sleep(2)  # 2 segundos entre buscas
                    
                    # Analisar resultados
                    suspicious_products = await self.analyze_product(product, search_results)
                    
                    # Salvar produtos suspeitos
                    for suspicious in suspicious_products:
                        self.db.add(suspicious)
                        total_suspicious += 1
                    
                    # Atualizar timestamp da última busca
                    product.last_search = datetime.now()
                    
                    products_analyzed += 1
                    logger.info(f"Produto {product.name} analisado - {len(suspicious_products)} suspeitos encontrados")
                    
                except Exception as e:
                    logger.error(f"Erro ao processar produto {product.name}: {e}")
                    continue
            
            # Salvar todas as alterações
            self.db.commit()
            
            logger.info(f"Scraping inteligente concluído - {products_analyzed} produtos analisados, {total_suspicious} suspeitos encontrados")
            
            return {
                "success": True,
                "message": "Scraping inteligente concluído com sucesso",
                "products_analyzed": products_analyzed,
                "suspicious_found": total_suspicious
            }
            
        except Exception as e:
            logger.error(f"Erro durante scraping inteligente: {e}")
            self.db.rollback()
            return {
                "success": False,
                "message": f"Erro durante scraping: {str(e)}",
                "products_analyzed": 0,
                "suspicious_found": 0
            }
    
    async def get_suspicious_products(self, limit: int = 50) -> List[SuspiciousProduct]:
        """Obtém produtos suspeitos encontrados"""
        try:
            suspicious = self.db.query(SuspiciousProduct).filter(
                SuspiciousProduct.is_false_positive == False
            ).order_by(
                SuspiciousProduct.created_at.desc()
            ).limit(limit).all()
            
            return suspicious
        except Exception as e:
            logger.error(f"Erro ao buscar produtos suspeitos: {e}")
            return []
    
    async def mark_as_false_positive(self, suspicious_id: int) -> bool:
        """Marca um produto suspeito como falso positivo"""
        try:
            suspicious = self.db.query(SuspiciousProduct).filter(
                SuspiciousProduct.id == suspicious_id
            ).first()
            
            if not suspicious:
                return False
            
            suspicious.is_false_positive = True
            suspicious.updated_at = datetime.now()
            self.db.commit()
            
            return True
        except Exception as e:
            logger.error(f"Erro ao marcar como falso positivo: {e}")
            return False
    
    async def verify_suspicious_product(self, suspicious_id: int, is_verified: bool, notes: str = "") -> bool:
        """Verifica manualmente um produto suspeito"""
        try:
            suspicious = self.db.query(SuspiciousProduct).filter(
                SuspiciousProduct.id == suspicious_id
            ).first()
            
            if not suspicious:
                return False
            
            suspicious.is_verified = is_verified
            suspicious.notes = notes
            suspicious.updated_at = datetime.now()
            self.db.commit()
            
            return True
        except Exception as e:
            logger.error(f"Erro ao verificar produto suspeito: {e}")
            return False
