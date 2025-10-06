#!/usr/bin/env python
"""
Script de teste para verificar a funcionalidade do assistente virtual
"""
import asyncio
import aiohttp
import json

async def test_chat_assistant():
    """Testa as funcionalidades principais do assistente virtual"""
    base_url = "http://localhost:8000"

    # Lista de testes a serem executados
    test_questions = [
        "Como posso ver o histórico de preços de um produto?",
        "Como configurar um alerta de preço?",
        "Como analisar a reputação de um vendedor?",
        "Quais relatórios estão disponíveis no sistema?"
    ]

    async with aiohttp.ClientSession() as session:
        # Teste 1: Verificar se o servidor está online
        try:
            async with session.get(f"{base_url}/") as response:
                print(f"✓ Servidor está online: {response.status == 200}")
        except Exception as e:
            print(f"✗ Erro ao conectar com o servidor: {str(e)}")
            return

        # Teste 2: Tentar fazer login
        try:
            login_data = {
                "email": "alan@smstecnologia.com.br",
                "password": "@#Pi231179"
            }
            async with session.post(f"{base_url}/api/auth/login", json=login_data) as response:
                result = await response.json()
                print(f"✓ Login realizado: {response.status == 200}")
                if response.status == 200:
                    token = result.get('access_token')
                    headers = {'Authorization': f'Bearer {token}'}
                else:
                    print(f"✗ Erro no login: {result}")
                    return
        except Exception as e:
            print(f"✗ Erro durante o login: {str(e)}")
            return

        # Teste 3: Testar perguntas ao assistente virtual
        for question in test_questions:
            try:
                async with session.post(
                    f"{base_url}/api/chat/ask",
                    headers=headers,
                    json={"message": question}
                ) as response:
                    result = await response.json()
                    print(f"\nTestando pergunta: {question}")
                    print(f"Status: {response.status}")
                    print(f"Resposta: {result.get('message', 'Sem resposta')}")
            except Exception as e:
                print(f"✗ Erro ao testar pergunta '{question}': {str(e)}")

if __name__ == "__main__":
    print("Iniciando testes do assistente virtual...")
    asyncio.run(test_chat_assistant())
