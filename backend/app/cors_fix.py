# Este script deve ser colado no main.py na seção de configuração CORS
# Substitua a seção existente de configuração CORS por este código
# Configurar CORS - versão atualizada para permitir acesso externo
origins = [
    settings.FRONTEND_URL,
    "http://localhost",
    "http://localhost:3000",
    "http://173.21.101.62",
    "http://173.21.101.62:3000",
    "http://173.21.101.62:8000",
    "http://172.21.101.185",       # Adicionando o IP específico que está sendo usado
    "http://172.21.101.185:3000",  # Adicionando com a porta 3000
    "http://172.21.101.185:8000",  # Adicionando com a porta 8000
    "http://172.21.101.185:80",    # Adicionando com a porta 80
    "*",  # Permite todas as origens durante desenvolvimento
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
