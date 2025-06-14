# Mercado Livre Tracker

Sistema de rastreamento de preços e análise de reputação de produtos no Mercado Livre, com foco em produtos específicos como cartuchos de tinta.

## Funcionalidades Principais

- Rastreamento de preços com histórico e comparativo
- Análise de vendedores (autorizado vs não autorizado)
- Dashboard visual com filtros e alertas
- Integração com tabela de preços de referência
- Notificações por variação de preço
- Assistente IA integrado com GPT-4

## Tecnologias Utilizadas

- **Backend**: FastAPI 0.110+, SQLAlchemy, JWT, PostgreSQL 15
- **Frontend**: React 18+, TailwindCSS, Zustand
- **Scraping**: Playwright
- **Cache/Filas**: Redis
- **IA**: OpenAI GPT-4
- **Containerização**: Docker e Docker Compose

## Estrutura do Projeto

```
mercado-livre-tracker/
├── backend/                  # API FastAPI
│   ├── app/
│   │   ├── core/             # Configurações centrais
│   │   ├── db/               # Configurações de banco de dados
│   │   ├── middlewares/      # Middlewares da aplicação
│   │   ├── models/           # Modelos SQLAlchemy
│   │   ├── routers/          # Rotas da API
│   │   ├── schemas/          # Schemas Pydantic
│   │   ├── services/         # Lógica de negócios
│   │   ├── tasks/            # Tarefas assíncronas
│   │   ├── utils/            # Funções utilitárias
│   │   └── main.py           # Ponto de entrada da aplicação
│   ├── tests/                # Testes automatizados
│   ├── scripts/              # Scripts utilitários
│   ├── Dockerfile            # Configuração Docker para backend
│   └── requirements.txt      # Dependências Python
├── frontend/                 # Aplicação React
│   ├── public/               # Arquivos públicos
│   ├── src/
│   │   ├── assets/           # Imagens e recursos
│   │   ├── components/       # Componentes React
│   │   ├── hooks/            # Hooks personalizados
│   │   ├── pages/            # Páginas da aplicação
│   │   │   ├── Auth/         # Páginas de autenticação
│   │   │   ├── Dashboard/    # Dashboard principal
│   │   │   ├── Products/     # Gerenciamento de produtos
│   │   │   ├── Sellers/      # Gerenciamento de vendedores
│   │   │   ├── Alerts/       # Visualização de alertas
│   │   │   └── Settings/     # Configurações do sistema
│   │   ├── services/         # Serviços para API
│   │   ├── store/            # Gerenciamento de estado (Zustand)
│   │   ├── styles/           # Estilos globais
│   │   └── utils/            # Funções utilitárias
│   └── Dockerfile            # Configuração Docker para frontend
├── nginx/                    # Configuração do proxy reverso
│   └── nginx.conf            # Arquivo de configuração do Nginx
└── docker-compose.yml        # Orquestração de serviços
```

## Requisitos de Sistema

- Docker e Docker Compose
- Git
- Chave de API da OpenAI (para o assistente IA)
- Servidor SMTP para envio de emails (opcional)

## Guia de Instalação

### 1. Clonar o Repositório

```bash
# Execute no terminal
git clone https://github.com/seu-usuario/mercado-livre-tracker.git
cd mercado-livre-tracker
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
# Execute no terminal
touch .env
```

Edite o arquivo `.env` com as seguintes variáveis:

```
# Segurança
SECRET_KEY=sua_chave_secreta_aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Banco de Dados
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=ml_tracker
DATABASE_URL=postgresql://postgres:postgres@db:5432/ml_tracker

# Redis
REDIS_URL=redis://redis:6379/0

# OpenAI
OPENAI_API_KEY=

# Email
SMTP_SERVER=seu_servidor_smtp
SMTP_PORT=587
SMTP_USER=seu_usuario_smtp
SMTP_PASSWORD=sua_senha_smtp

# Frontend
FRONTEND_URL=http://localhost:3000
```

### 3. Construir e Iniciar os Contêineres

```bash
# Execute no terminal
docker-compose build
docker-compose up -d
```

Este comando irá:
1. Construir as imagens Docker para backend e frontend
2. Iniciar os serviços PostgreSQL, Redis, backend, frontend e Nginx
3. Configurar a rede entre os contêineres

### 4. Verificar os Serviços em Execução

```bash
# Execute no terminal
docker-compose ps
```

Você deverá ver todos os serviços no estado "Up":
- ml-tracker-backend
- ml-tracker-frontend
- ml-tracker-db
- ml-tracker-redis
- ml-tracker-nginx

### 5. Acessar a Aplicação

- **Frontend**: http://localhost:3000
- **API Backend**: http://localhost:8000
- **Documentação da API**: http://localhost:8000/docs

## Executando Serviços Individualmente

### Backend (FastAPI)

```bash
# Execute no terminal
cd backend
python -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend (React)

```bash
# Execute no terminal
cd frontend
npm install
npm start
```

## Solução de Problemas Comuns

### Problema: Contêineres não iniciam corretamente

Verifique os logs para identificar o problema:

```bash
# Execute no terminal
docker-compose logs -f
```

Para ver logs de um serviço específico:

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Problema: Erro de conexão com o banco de dados

Verifique se o serviço do PostgreSQL está em execução:

```bash
# Execute no terminal
docker-compose ps db
```

Se necessário, reinicie o serviço:

```bash
# Execute no terminal
docker-compose restart db
```

### Problema: Erro ao conectar com Redis

Verifique se o serviço Redis está em execução:

```bash
# Execute no terminal
docker-compose ps redis
```

Se necessário, reinicie o serviço:

```bash
# Execute no terminal
docker-compose restart redis
```

### Problema: Erro na API do OpenAI

Verifique se a chave da API está configurada corretamente no arquivo `.env`.

## Comandos Docker Úteis

### Iniciar todos os serviços

```bash
# Execute no terminal
docker-compose up -d
```

### Parar todos os serviços

```bash
# Execute no terminal
docker-compose down
```

### Reiniciar um serviço específico

```bash
# Execute no terminal
docker-compose restart [serviço]  # Ex: docker-compose restart backend
```

### Ver logs de todos os serviços

```bash
# Execute no terminal
docker-compose logs -f

# Ou para um serviço específico
docker-compose logs -f backend  # Para logs do backend
docker-compose logs -f frontend  # Para logs do frontend
```

### Reconstruir serviços após alterações

```bash
# Execute no terminal
docker-compose build [serviço]  # Ex: docker-compose build backend
docker-compose up -d
```

## Níveis de Permissão

O sistema possui três níveis de permissão:

1. **Admin**:
   - Acesso total ao sistema
   - Gerenciamento de usuários
   - Importação de listas de preços e vendedores
   - Configurações do sistema

2. **Analista**:
   - Cadastro e monitoramento de produtos
   - Visualização de dados e gráficos
   - Geração de relatórios
   - Uso do assistente IA

3. **Visitante**:
   - Visualização de dados existentes
   - Sem permissão para cadastrar ou modificar

## Importação de Dados

### Importar Lista de Preços de Referência

```bash
# Execute no terminal
docker-compose exec backend python -m scripts.import_prices /caminho/para/lista_precos.xlsx
```

### Importar Lista de Vendedores Autorizados

```bash
# Execute no terminal
docker-compose exec backend python -m scripts.import_sellers /caminho/para/lista_vendedores.xlsx
```

## Verificação Pós-Instalação

Após a instalação, verifique se:

1. Todos os serviços estão em execução (`docker-compose ps`)
2. O frontend está acessível em http://localhost:3000
3. A API está acessível em http://localhost:8000
4. A documentação da API está acessível em http://localhost:8000/docs
5. É possível fazer login com as credenciais padrão:
   - Email: admin@example.com
   - Senha: admin123

## Desenvolvimento

### Estrutura de Arquivos Frontend

```
frontend/src/
├── assets/           # Recursos estáticos
├── components/       # Componentes reutilizáveis
│   ├── Layout/       # Componentes de layout (Sidebar, Topbar)
│   ├── Dashboard/    # Componentes do dashboard
│   ├── Products/     # Componentes de produtos
│   ├── Alerts/       # Componentes de alertas
│   └── ...
├── hooks/            # Hooks personalizados
├── pages/            # Páginas da aplicação
│   ├── Auth/         # Login, Registro, Recuperação de senha
│   ├── Dashboard/    # Dashboard principal
│   ├── Products/     # Listagem e detalhes de produtos
│   ├── Sellers/      # Listagem e detalhes de vendedores
│   ├── Alerts/       # Listagem de alertas
│   └── Settings/     # Configurações do sistema
├── services/         # Serviços para comunicação com API
├── store/            # Gerenciamento de estado (Zustand)
├── styles/           # Estilos globais
└── utils/            # Funções utilitárias
```

### Estrutura de Arquivos Backend

```
backend/app/
├── core/             # Configurações centrais
│   ├── config.py     # Configurações da aplicação
│   └── security.py   # Funções de segurança
├── db/               # Configurações de banco de dados
│   └── session.py    # Configuração da sessão
├── middlewares/      # Middlewares da aplicação
├── models/           # Modelos SQLAlchemy
│   ├── user.py       # Modelo de usuário
│   ├── product.py    # Modelo de produto
│   ├── price.py      # Modelo de preço
│   └── ...
├── routers/          # Rotas da API
│   ├── auth.py       # Rotas de autenticação
│   ├── users.py      # Rotas de usuários
│   ├── products.py   # Rotas de produtos
│   └── ...
├── schemas/          # Schemas Pydantic
├── services/         # Lógica de negócios
│   ├── auth.py       # Serviço de autenticação
│   ├── scraper.py    # Serviço de scraping
│   └── ...
├── tasks/            # Tarefas assíncronas
└── utils/            # Funções utilitárias
```

## Contribuição

Para contribuir com o projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Faça commit das suas alterações (`git commit -m 'Adiciona nova funcionalidade'`)
4. Faça push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.

## Importante

O sistema de autenticação foi modificado para utilizar 2FA (Duas Fases) em vez do modelo antigo de autenticação simples. Agora, além da senha, é necessário inserir um código de verificação gerado pelo aplicativo Authenticator. Isso adiciona mais segurança ao sistema.

```python
# No arquivo models.py

from sqlalchemy import Column, Integer, String

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    username = Column(String(50), nullable=False)
    password = Column(String(255), nullable=False)
    # Novo campo adicionado
    twofa_secret = Column(String(255), nullable=False)

# No arquivo schemas.py

from pydantic import BaseModel
from typing import Optional

class UserSchema(BaseModel):
    username: str
    password: str
    # Novo campo adicionado
    twofa_code: Optional[str]
```

```python
# No arquivo auth.py (services/auth.py)

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError, DataError

from ..models import User
from ..schemas import UserSchema

def verify_user_credentials(username: str, password: str, twofa_code: Optional[str] = None) -> User:
    user = get_user_by_username(username)

    if not user or not check_password(password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                             detail='Invalid username and/or password')

    # Verificar se o código de verificação 2FA está correto
    if twofa_code and twofa_code != get_twofa_code(user.twofa_secret):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                             detail='Invalid 2FA code')

    return user

def get_user_by_username(username: str) -> User:
    # Implementar lógica de busca do usuário
    pass

def check_password(password: str, hashed_password: str) -> bool:
    # Implementar função para verificar a senha
    pass

def get_twofa_code(secret_key: str) -> str:
    # Implementar função para gerar o código de verificação 2FA
    pass
```

```python
# No arquivo routes/a
# 
# uth.py

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

from ..services.auth import verify_user_credentials

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/token",
    schemeName="bearer",
)

@router.post("/token")
async def get_token(username: str, password: str, twofa_code: Optional[str] = None):
    user = verify_user_credentials(username, password, twofa_code=twofa_code)
    # Gerar o token de autenticação
    return {"access_token": "token_value", "token_type": "bearer"}
```