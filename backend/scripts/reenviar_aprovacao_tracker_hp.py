#!/usr/bin/env python
"""
Script para reenviar email de aprovação para alan@smstecnologia.com.br
"""

import asyncio
import sys
import os

# Adiciona o diretório raiz ao path para importar os módulos da aplicação
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.email import send_user_approval_notification

if __name__ == "__main__":
    print("Iniciando reenvio de email para alan@smstecnologia.com.br...")
    resultado = asyncio.run(send_user_approval_notification(
        to_user_email="alan@smstecnologia.com.br",
        user_name="Alan SMS",
        is_approved=True,
        rejection_reason=None
    ))

    if resultado:
        print("✅ Email reenviado com sucesso!")
    else:
        print("❌ Falha ao reenviar o email. Verifique os logs para mais detalhes.")
