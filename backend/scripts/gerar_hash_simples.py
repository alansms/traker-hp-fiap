import sys
import os
from pathlib import Path

# Adicionar o diretório raiz ao path
base_dir = Path(__file__).parent.parent
sys.path.append(str(base_dir))

try:
    # Importando o método de hash de senha do sistema
    from app.core.security import get_password_hash

    # Senha que será usada para o usuário sistemas
    senha = "Admin@2025"

    # Gerar o hash da senha
    hash_senha = get_password_hash(senha)

    print(f"\nSenha definida: {senha}")
    print(f"Hash gerado: {hash_senha}")
    print("\nCopie este hash e substitua 'SENHA_HASH_AQUI' no script SQL!")

except Exception as e:
    print(f"Erro ao gerar hash de senha: {e}")
    print("Verifique se você está executando este script a partir do diretório raiz do backend.")
