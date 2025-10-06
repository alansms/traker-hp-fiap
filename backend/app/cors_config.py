from fastapi.middleware.cors import CORSMiddleware

def configure_cors(app):
    """
    Configura o CORS (Cross-Origin Resource Sharing) para permitir requisições do frontend.
    Esta função deve ser chamada no arquivo main.py.
    """
    # Lista de origens permitidas
    origins = [
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8000",
        "http://127.0.0.1",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:8000",
        # Adicione qualquer outra origem que você esteja usando
    ]

    # Adiciona o middleware CORS com configurações amplas para desenvolvimento
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Permite todas as origens (use com cautela em produção)
        allow_credentials=True,
        allow_methods=["*"],  # Permite todos os métodos
        allow_headers=["*"],  # Permite todos os cabeçalhos
    )

    print("CORS configurado para permitir todas as origens durante o desenvolvimento")
