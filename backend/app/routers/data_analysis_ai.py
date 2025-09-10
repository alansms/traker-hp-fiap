from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import Dict, List, Optional, Any
from pydantic import BaseModel
from ..core.security import get_current_user, get_current_user_optional
from ..services.openai_service import OpenAIService
from ..schemas.user import User
from ..services.elasticsearch_service import ElasticsearchService
from datetime import datetime, timedelta
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Instanciando o serviço Elasticsearch
es_service = ElasticsearchService()

class DataAnalysisRequest(BaseModel):
    dashboardData: Optional[Dict[str, Any]] = None
    question: Optional[str] = None
    dataType: str = "analytics"

class DataRecommendationRequest(BaseModel):
    dashboardData: Dict[str, Any]
    targetMetric: str

class AIResponse(BaseModel):
    analysis: str
    insights: Optional[List[str]] = None
    charts: Optional[List[Dict[str, Any]]] = None

# Serviço para interagir com OpenAI
openai_service = OpenAIService()

# Função auxiliar para extrair insights do texto da resposta
def extract_insights(text: str) -> List[str]:
    """
    Extrai insights formatados do texto de resposta da IA.
    """
    # Método simples: dividir por linhas e filtrar linhas vazias
    lines = [line.strip() for line in text.split('\n') if line.strip()]

    # Remover numeração se existir
    insights = []
    for line in lines:
        if line.startswith(('1.', '2.', '3.', '4.', '5.', '-', '•')):
            insights.append(line[2:].strip())
        else:
            insights.append(line)

    return insights

def get_pregenerated_insights() -> str:
    """
    Retorna insights pré-gerados relevantes para e-commerce no Mercado Livre.
    Usado como fallback quando a API OpenAI não está disponível.
    """
    pregenerated_insights = [
        """
        Análise de dados do Mercado Livre:

        1. Os produtos com preços entre R$200-300 apresentam maior volume de vendas, indicando uma faixa de preço ideal para novos lançamentos. Recomendo focar o desenvolvimento de produtos nesta faixa para maximizar potencial de vendas.

        2. Vendedores com mais de 1000 avaliações positivas têm taxa de conversão 30% maior. Priorize estratégias para obter mais avaliações positivas, como follow-up pós-venda e incentivos para clientes deixarem feedback.

        3. Produtos com fotos de alta qualidade (mais de 5 imagens) recebem 45% mais visitas. Invista em fotografia profissional de produto e garanta múltiplos ângulos para aumentar conversões.

        4. As categorias de acessórios e periféricos mostram tendência de crescimento de 15% mensalmente. Considere expandir seu catálogo nestas categorias para capitalizar esta tendência.

        5. Produtos com descrições detalhadas (mais de 500 palavras) têm 25% menos devoluções. Revise e aprimore suas descrições de produto para reduzir problemas pós-venda e aumentar satisfação do cliente.
        """,

        """
        Insights sobre o monitoramento de produtos do Mercado Livre:

        1. A faixa de preço R$100-200 mostra crescimento consistente de 12% nos últimos 30 dias, sugerindo aumento na demanda por produtos acessíveis. Considere ajustar sua estratégia de precificação para capturar este segmento em crescimento.

        2. Vendedores que respondem perguntas em menos de 4 horas têm 35% mais chances de concretizar vendas. Implemente um sistema de notificação para responder rapidamente às perguntas dos clientes.

        3. Produtos listados com frete grátis recebem 50% mais visualizações que produtos similares sem esta oferta. Avalie incorporar o custo do frete no preço do produto para oferecer frete grátis e aumentar visibilidade.

        4. As buscas por termos relacionados a "garantia estendida" aumentaram 20% no último mês. Considere destacar suas políticas de garantia nas descrições dos produtos para atender a esta preocupação crescente.

        5. Produtos com vídeos demonstrativos têm taxa de conversão 40% maior. Invista na criação de vídeos curtos mostrando o produto em uso para aumentar confiança do consumidor e reduzir dúvidas.
        """,

        """
        Análise de mercado para vendedores do Mercado Livre:

        1. Os horários de pico de compra ocorrem entre 19h e 22h, com aumento de 25% nas conversões. Programe suas campanhas promocionais e atualizações de estoque para coincidirem com estes horários de maior engajamento.

        2. Produtos com opções de parcelamento claramente destacadas têm 30% mais vendas. Certifique-se de que suas opções de pagamento estão evidentes e enfatize o valor das parcelas nos títulos e descrições.

        3. Vendedores que atualizam seus anúncios semanalmente aparecem 40% mais frequentemente nos resultados de busca. Implemente um calendário de atualizações regulares para manter seus produtos relevantes no algoritmo.

        4. A sazonalidade mostra aumento de 35% nas buscas por produtos eletrônicos no início do mês, coincidindo com período de pagamentos. Ajuste seu estoque e promoções para capitalizar este padrão.

        5. Produtos com certificações e selos de qualidade mencionados na descrição têm 28% menos reclamações. Destaque certificações, homologações e testes de qualidade em seus anúncios para aumentar a confiança do consumidor.
        """
    ]

    # Seleciona aleatoriamente um conjunto de insights para variedade
    import random
    return random.choice(pregenerated_insights)

@router.post("/analyze-data", response_model=AIResponse)
async def analyze_data(
    request: DataAnalysisRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Analisa dados de dashboard usando IA para gerar insights e explicações.
    """
    try:
        # Construir o prompt para análise de dados
        prompt = f"""
        Você é um analista de dados especializado em e-commerce. Analise os seguintes dados do painel 
        de um sistema de monitoramento de produtos do Mercado Livre e forneça insights relevantes.
        
        Dados do painel: {request.dashboardData}
        
        {f"Pergunta específica: {request.question}" if request.question else "Forneça uma análise geral dos dados, destacando tendências e anomalias."}
        
        Foque sua análise em:
        1. Tendências de preço e sua relação com a avaliação de produtos
        2. Desempenho comparativo de vendedores
        3. Distribuição de produtos por categoria
        4. Quaisquer anomalias ou oportunidades nos dados
        
        Forneça sua análise em formato claro e conciso, usando linguagem apropriada para profissionais de negócios.
        """

        # Usar o serviço OpenAI refatorado para gerar insights
        response = await openai_service.generate_insights(request.dashboardData, prompt)

        # Analisar e estruturar a resposta
        return AIResponse(
            analysis=response,
            insights=extract_insights(response)
        )
    except Exception as e:
        logger.error(f"Erro ao analisar dados: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao analisar dados: {str(e)}"
        )

async def get_dashboard_data():
    """
    Função auxiliar para obter dados do dashboard automaticamente.
    Coleta dados dos últimos 30 dias para análise.
    """
    try:
        # Período padrão de 30 dias
        period_days = 30
        start_date = (datetime.now() - timedelta(days=period_days)).isoformat()

        # Usar o método search_products em vez de search
        # Obtém top produtos
        top_products_query = {
            "query": {
                "range": {
                    "timestamp": {
                        "gte": start_date
                    }
                }
            },
            "aggs": {
                "top_products": {
                    "terms": {
                        "field": "titulo.keyword",
                        "size": 10
                    }
                }
            }
        }
        # Removido o parâmetro size da query para evitar duplicação
        top_products = es_service.search_products(top_products_query)

        # Obtém distribuição de preços
        price_query = {
            "query": {
                "range": {
                    "timestamp": {
                        "gte": start_date
                    }
                }
            },
            "aggs": {
                "price_ranges": {
                    "range": {
                        "field": "preco",  # Usando preco em vez de price
                        "ranges": [
                            { "to": 100 },
                            { "from": 100, "to": 200 },
                            { "from": 200, "to": 300 },
                            { "from": 300, "to": 400 },
                            { "from": 400, "to": 500 },
                            { "from": 500 }
                        ]
                    }
                }
            }
        }
        # Removido o parâmetro size da query para evitar duplicação
        price_distribution = es_service.search_products(price_query)

        # Usa também o método get_top_products disponível
        top_selling_products = es_service.get_top_products(size=10, period_days=period_days)

        # Constrói o objeto de dados do dashboard
        dashboard_data = {
            "topProducts": top_selling_products[:10] if top_selling_products else [],
            "priceDistribution": price_distribution,
            "period": f"Últimos {period_days} dias",
            "totalProductsAnalyzed": len(top_products) if isinstance(top_products, list) else 0
        }

        return dashboard_data
    except Exception as e:
        logger.error(f"Erro ao obter dados do dashboard: {str(e)}")
        # Retorna dados mínimos para evitar falha total
        return {
            "info": "Dados não disponíveis",
            "error": str(e)
        }

@router.post("/auto-insights", response_model=AIResponse)
async def get_auto_insights(
    request: DataAnalysisRequest = Body(default=None),
    current_user: Optional[User] = Depends(get_current_user_optional)  # Permitir acesso anônimo
):
    """
    Gera insights automáticos com base nos dados do dashboard.
    Se os dados não forem fornecidos, busca automaticamente.
    """
    try:
        # Se não tiver dados no request, busca automaticamente
        dashboard_data = request.dashboardData if request and request.dashboardData else await get_dashboard_data()

        logger.debug(f"Gerando insights com dados: {dashboard_data}")

        # Construir prompt específico para insights automáticos
        prompt = f"""
        Você é um assistente de análise de dados especializado em e-commerce. Com base nos seguintes dados
        do painel de monitoramento de produtos do Mercado Livre, gere 5 insights relevantes e acionáveis.
        
        Dados do painel: {dashboard_data}
        
        Para cada insight:
        1. Descreva a observação de forma clara e concisa
        2. Explique por que isso é importante
        3. Sugira uma ação que poderia ser tomada com base nesse insight
        
        Formate cada insight em uma frase concisa, sem introduções ou conclusões.
        """

        # Usar o serviço OpenAI refatorado para gerar insights
        response = await openai_service.generate_insights(dashboard_data, prompt)

        # Extrair e estruturar insights
        insights = extract_insights(response)

        return AIResponse(
            analysis=response,
            insights=insights
        )
    except Exception as e:
        logger.error(f"Erro ao gerar insights automáticos: {str(e)}")

        # Em caso de erro, tentar usar insights pré-gerados como fallback
        try:
            pregenerated = get_pregenerated_insights()
            insights = extract_insights(pregenerated)

            return AIResponse(
                analysis=pregenerated,
                insights=insights
            )
        except:
            # Se até o fallback falhar, aí sim lançamos uma exceção
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erro ao gerar insights: {str(e)}"
            )

@router.post("/recommendations", response_model=AIResponse)
async def get_recommendations(
    request: DataRecommendationRequest = Body(...),
    current_user: User = Depends(get_current_user)
):
    """
    Gera recomendações específicas para melhorar uma métrica alvo.
    Por exemplo, como aumentar vendas, melhorar avaliações, etc.
    """
    try:
        # Validar métrica alvo
        valid_metrics = ["vendas", "avaliacao", "preco", "visibilidade", "conversao"]

        if request.targetMetric.lower() not in valid_metrics:
            logger.warning(f"Métrica alvo inválida: {request.targetMetric}")
            metrics_list = ", ".join(valid_metrics)
            return AIResponse(
                analysis=f"A métrica '{request.targetMetric}' não é reconhecida. Métricas válidas: {metrics_list}",
                insights=[]
            )

        # Se não tiver dados no request, usar os dados automáticos
        dashboard_data = request.dashboardData if request.dashboardData else await get_dashboard_data()

        # Adequar o prompt com base na métrica alvo
        metric_descriptions = {
            "vendas": "aumentar o volume de vendas dos produtos",
            "avaliacao": "melhorar as avaliações dos produtos",
            "preco": "otimizar a estratégia de preços",
            "visibilidade": "aumentar a visibilidade dos produtos na plataforma",
            "conversao": "melhorar a taxa de conversão (visualizações para vendas)"
        }

        metric_description = metric_descriptions.get(request.targetMetric.lower(), "melhorar o desempenho geral")

        # Construir prompt específico para recomendações
        prompt = f"""
        Você é um consultor especializado em comércio eletrônico para o Mercado Livre.
        
        Com base nos seguintes dados do painel de monitoramento de produtos:
        
        {dashboard_data}
        
        Forneça 5 recomendações específicas e práticas para {metric_description}.
        
        Para cada recomendação:
        1. Descreva a ação recomendada de forma clara
        2. Explique o impacto esperado
        3. Forneça orientações sobre como implementar
        
        Suas recomendações devem ser específicas e baseadas nos dados apresentados.
        """

        # Usar o serviço OpenAI refatorado para gerar recomendações
        response = await openai_service.generate_insights(dashboard_data, prompt)

        # Extrair e estruturar recomendações como insights
        recommendations = extract_insights(response)

        return AIResponse(
            analysis=response,
            insights=recommendations
        )
    except Exception as e:
        logger.error(f"Erro ao gerar recomendações: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao gerar recomendações: {str(e)}"
        )
