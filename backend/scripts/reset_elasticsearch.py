#!/usr/bin/env python
"""
Script para limpar o índice do Elasticsearch, removendo dados antigos
e garantindo que apenas os dados em português estejam presentes.
"""

import os
import json
import logging
from elasticsearch import Elasticsearch
from test_elasticsearch import get_elasticsearch_client, ES_INDEX

# Configuração de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def reset_elasticsearch_index():
    """Reseta o índice do Elasticsearch, removendo todos os dados antigos."""
    try:
        # Obtém cliente do Elasticsearch
        client = get_elasticsearch_client()

        # Verifica se o índice existe
        if client.indices.exists(index=ES_INDEX):
            # Remove o índice existente
            client.indices.delete(index=ES_INDEX)
            logger.info(f"Índice '{ES_INDEX}' removido com sucesso.")

            # Recria o índice (test_elasticsearch.py irá fazer isso na próxima execução)
            logger.info(f"Execute 'python -m scripts.test_elasticsearch' para recriar o índice com dados em português.")
            return True
        else:
            logger.warning(f"Índice '{ES_INDEX}' não existe. Nada a fazer.")
            return False

    except Exception as e:
        logger.error(f"Erro ao resetar índice do Elasticsearch: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

if __name__ == "__main__":
    print("=" * 80)
    print("FERRAMENTA DE RESET DO ELASTICSEARCH")
    print("=" * 80)
    print("\nEsta ferramenta irá remover TODOS os dados do índice do Elasticsearch.")
    print("Use com cuidado!")

    confirm = input("\nVocê tem certeza que deseja continuar? (sim/não): ")

    if confirm.lower() in ["sim", "s", "yes", "y"]:
        print("\nRemovendo dados do Elasticsearch...")
        success = reset_elasticsearch_index()

        if success:
            print("\nÍndice removido com sucesso!")
            print("Execute 'python -m scripts.test_elasticsearch' para recriar o índice com dados em português.")
        else:
            print("\nFalha ao resetar o índice. Verifique os logs para mais informações.")
    else:
        print("\nOperação cancelada pelo usuário.")
