from app.core.config import settings
import httpx
import logging
import json
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class OpenAIService:
    """
    Serviço para interagir com a API da OpenAI
    Suporta análise de sentimento e geração de insights/análises
    """

    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.api_base_url = "https://api.openai.com/v1"
        self.model = settings.OPENAI_API_MODEL or "gpt-3.5-turbo"
        self.organization = settings.OPENAI_API_ORGANIZATION
        logger.info(f"OpenAI Service inicializado com modelo: {self.model}")

    async def analyze_sentiment(self, comments: List[str]) -> List[Dict[str, Any]]:
        """
        Analisa o sentimento de uma lista de comentários usando a API da OpenAI

        Args:
            comments: Lista de comentários para análise

        Returns:
            Lista de dicionários com o sentimento de cada comentário
        """
        if not comments:
            return []

        if not self.api_key:
            logger.error("Chave da API OpenAI não configurada")
            return [{"comment": comment, "sentiment": "neutro", "score": 0.5, "confidence": 0.0} for comment in comments]

        try:
            # Agrupamos até 10 comentários por requisição para ser mais eficiente
            results = []
            batch_size = 10

            for i in range(0, len(comments), batch_size):
                batch = comments[i:i+batch_size]
                batch_results = await self._process_comment_batch(batch)
                results.extend(batch_results)

            return results

        except Exception as e:
            logger.error(f"Erro ao analisar sentimentos com OpenAI: {str(e)}")
            # Fallback: retorna neutro para todos os comentários
            return [{"comment": comment, "sentiment": "neutro", "score": 0.5, "confidence": 0.0} for comment in comments]

    async def _process_comment_batch(self, comments: List[str]) -> List[Dict[str, Any]]:
        """
        Processa um lote de comentários com a API da OpenAI
        """
        # Construímos um prompt estruturado para análise de sentimento
        system_prompt = """Você é um especialista em análise de sentimento. 
        Analise os comentários a seguir e classifique cada um como 'positivo', 'neutro', ou 'negativo'.
        Para cada comentário, atribua também uma pontuação de 0.0 a 1.0, onde:
        - Para sentimento negativo: 0.0 a 0.3
        - Para sentimento neutro: 0.4 a 0.6
        - Para sentimento positivo: 0.7 a 1.0
        
        Forneça também um nível de confiança na análise (0.0 a 1.0).
        
        Responda em formato JSON, seguindo exatamente este modelo:
        {
          "results": [
            {
                "comment": "texto do primeiro comentário",
                "sentiment": "positivo|neutro|negativo",
                "score": 0.X,
                "confidence": 0.X
            },
            ...
          ]
        }
        """

        user_prompt = "Comentários para análise:\n"
        for i, comment in enumerate(comments, 1):
            user_prompt += f"{i}. {comment}\n"

        response = await self._call_openai_api(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )

        if not response:
            # Fallback: retorna neutro para todos os comentários do lote
            return [{"comment": comment, "sentiment": "neutro", "score": 0.5, "confidence": 0.0} for comment in comments]

        try:
            # Parsear o JSON retornado pela OpenAI
            results = json.loads(response).get("results", [])

            # Validar o formato e corrigir se necessário
            validated_results = []
            for i, result in enumerate(results):
                if i < len(comments):  # Garantir que temos um comentário correspondente
                    validated_results.append({
                        "comment": comments[i],
                        "sentiment": result.get("sentiment", "neutro"),
                        "score": float(result.get("score", 0.5)),
                        "confidence": float(result.get("confidence", 0.5))
                    })

            return validated_results
        except Exception as e:
            logger.error(f"Erro ao processar resposta da OpenAI: {str(e)}")
            logger.error(f"Resposta recebida: {response}")
            # Fallback: retorna neutro para todos os comentários do lote
            return [{"comment": comment, "sentiment": "neutro", "score": 0.5, "confidence": 0.0} for comment in comments]

    async def generate_insights(self, data: Dict[str, Any], prompt_template: str = None) -> str:
        """
        Gera insights com base em dados usando a API da OpenAI

        Args:
            data: Dicionário com dados para análise
            prompt_template: Template de prompt personalizado (opcional)

        Returns:
            String com a análise/insights gerados
        """
        if not self.api_key:
            logger.error("Chave da API OpenAI não configurada")
            return "Não foi possível gerar insights: Chave da API não configurada."

        try:
            # Se não tiver um prompt personalizado, usar um padrão
            if not prompt_template:
                prompt_template = f"""
                Você é um analista de dados especializado em e-commerce. 
                Analise os seguintes dados do painel de monitoramento de produtos do Mercado Livre 
                e forneça 5 insights relevantes e acionáveis.
                
                Dados do painel: {data}
                
                Para cada insight:
                1. Descreva a observação de forma clara e concisa
                2. Explique por que isso é importante
                3. Sugira uma ação que poderia ser tomada com base nesse insight
                
                Formate cada insight em uma frase concisa, sem introduções ou conclusões.
                """

            messages = [
                {"role": "system", "content": "Você é um analista de dados especializado em e-commerce."},
                {"role": "user", "content": prompt_template}
            ]

            response = await self._call_openai_api(messages=messages, temperature=0.2)

            if not response:
                logger.warning("Resposta vazia da API OpenAI")
                return "Não foi possível gerar insights no momento."

            return response

        except Exception as e:
            logger.error(f"Erro ao gerar insights com OpenAI: {str(e)}")
            return f"Erro ao gerar insights: {str(e)}"

    async def _call_openai_api(self, messages: List[Dict[str, str]], temperature: float = 0.2,
                               response_format: Dict[str, str] = None) -> Optional[str]:
        """
        Método unificado para chamar a API da OpenAI

        Args:
            messages: Lista de mensagens para o modelo
            temperature: Temperatura para geração (0.0 a 1.0)
            response_format: Formato de resposta desejado (opcional)

        Returns:
            Conteúdo da resposta ou None em caso de erro
        """
        if not self.api_key:
            logger.error("Chave da API OpenAI não configurada")
            return None

        # Configurar cabeçalhos com API key e organização (se fornecida)
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        if self.organization:
            headers["OpenAI-Organization"] = self.organization

        # Preparar o payload da requisição
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature
        }

        # Adicionar formato de resposta se especificado
        if response_format:
            payload["response_format"] = response_format

        try:
            logger.debug(f"Chamando API OpenAI com modelo: {self.model}")

            async with httpx.AsyncClient(timeout=60.0) as client:
                # Determinar o endpoint com base no tipo de modelo
                endpoint = f"{self.api_base_url}/chat/completions"

                # Fazer a requisição para a API
                response = await client.post(
                    endpoint,
                    headers=headers,
                    json=payload
                )

                # Verificar se a requisição foi bem-sucedida
                if response.status_code == 200:
                    response_data = response.json()
                    content = response_data["choices"][0]["message"]["content"]
                    return content
                else:
                    logger.error(f"Erro na API da OpenAI: {response.status_code} - {response.text}")
                    return None

        except httpx.TimeoutException:
            logger.error("Timeout na requisição para a API da OpenAI")
            return None
        except Exception as e:
            logger.error(f"Erro ao chamar API da OpenAI: {str(e)}")
            return None

    async def calculate_seller_reputation(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calcula a reputação de um vendedor com base nas avaliações e análise de sentimento
        """
        # Implementação existente
        # ...

        # Retorno padrão
        return {
            "reputation_score": 0.85,
            "classification": "Muito Bom"
        }
