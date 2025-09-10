# Script para gerar o hash de senha para o usuário sistemas
from app.core.security import get_password_hash
import sys
import os
import pathlib

# Adicionar o diretório raiz ao sys.path para importar os módulos da aplicação
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))

# Senha para o usuário sistemas
senha = "Admin@2025"  # Você pode mudar esta senha se desejar

# Gerar o hash da senha
senha_hash = get_password_hash(senha)

print(f"\nSenha original: {senha}")
print(f"Hash gerado: {senha_hash}\n")

# Também vamos atualizar o script SQL automaticamente
script_path = os.path.join(os.path.dirname(__file__), "reset_users_create_sistemas.sql")

with open(script_path, "r") as f:
    conteudo = f.read()

# Substituir o placeholder pelo hash real
conteudo_atualizado = conteudo.replace("'SENHA_HASH_AQUI'", f"'{senha_hash}'")

with open(script_path, "w") as f:
    f.write(conteudo_atualizado)

print(f"Script SQL atualizado com o hash da senha.")
print(f"Você pode executar o script SQL para resetar os usuários agora.")
