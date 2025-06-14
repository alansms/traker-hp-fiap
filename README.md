# Trader HP FIAP

<div align="center">
  <img src="frontend/logo_hp.png" alt="Logo HP" width="200"/>
  <br>
  <h3>Sistema de rastreamento e análise de preços de produtos HP no Mercado Livre</h3>
</div>

## 📋 Sumário

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [API](#api)
- [Desenvolvimento](#desenvolvimento)
- [Solução de Problemas](#solução-de-problemas)
- [Segurança](#segurança)
- [Contribuição](#contribuição)
- [Licença](#licença)

## 🔍 Visão Geral

O Trader HP é um sistema completo para monitoramento e análise de preços de produtos HP no Mercado Livre, com foco especial em cartuchos de tinta e outros suprimentos. O sistema permite rastrear vendedores autorizados e não autorizados, criar alertas de variação de preço e gerar relatórios detalhados.

## ✨ Funcionalidades

### Principais recursos:

- **Rastreamento de Preços**: Histórico e análise comparativa de preços
- **Análise de Vendedores**: Identificação de vendedores autorizados vs não autorizados
- **Dashboard Analítico**: Visualização de dados com filtros customizáveis
- **Sistema de Alertas**: Notificações por email sobre variações significativas de preço
- **Autenticação Segura**: Sistema de login com autenticação de dois fatores (2FA)
- **Assistente IA**: Integração com GPT-4 para análises avançadas
- **Exportação de Dados**: Relatórios em múltiplos formatos (PDF, XLSX, CSV)

## 🛠️ Tecnologias

### Stack principal:

- **Backend**:
  - FastAPI 0.110+
  - SQLAlchemy 2.0+
  - PostgreSQL 15
  - Redis (cache e filas)
  - JWT (autenticação)

- **Frontend**:
  - React 18+
  - TailwindCSS
  - Zustand (gerenciamento de estado)
  - Chart.js (visualizações)

- **Scraping**:
  - Playwright

- **Infraestrutura**:
  - Docker e Docker Compose
  - Nginx (proxy reverso)

- **IA**:
  - OpenAI GPT-4

## 🏗️ Arquitetura

### Estrutura de diretórios:

```
trader-hp/
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
│   │   ├── services/         # Serviços para API
│   │   ├── store/            # Gerenciamento de estado (Zustand)
│   │   ├── styles/           # Estilos globais
│   │   └── utils/            # Funções utilitárias
│   └── Dockerfile            # Configuração Docker para frontend
├── nginx/                    # Configuração do proxy reverso
│   └── nginx.conf            # Arquivo de configuração do Nginx
└── docker-compose.yml        # Orquestração de serviços
```

## 📦 Instalação

### Pré-requisitos:

- Docker e Docker Compose
- Git
- Chave de API da OpenAI (para o assistente IA)
- Servidor SMTP para envio de emails (opcional)

### Passos para instalação:

1. **Clone o repositório:**

```bash
git clone https://github.com/alansms/trader-hp-fiap.git
cd trader-hp-fiap
```

2. **Configure as variáveis de ambiente:**

Crie um arquivo `.env` na raiz do projeto com as seguintes configurações:

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

3. **Inicie os contêineres:**

```bash
docker-compose build
docker-compose up -d
```

4. **Verifique a instalação:**

```bash
docker-compose ps
```

## ⚙️ Configuração

### Níveis de permissão:

O sistema possui três níveis de acesso:

1. **Admin**
   - Acesso total ao sistema
   - Gerenciamento de usuários
   - Configuração de parâmetros globais

2. **Analista**
   - Monitoramento e análise de produtos
   - Criação de relatórios
   - Configuração de alertas

3. **Visitante**
   - Visualização de dados existentes
   - Acesso limitado ao dashboard

### Usuário padrão:

Após a instalação, você pode acessar o sistema com as seguintes credenciais:

- **Email:** admin@example.com
- **Senha:** admin123

> **Importante**: Altere estas credenciais imediatamente após o primeiro login!

## 🚀 Uso

### Acessando a aplicação:

- **Frontend:** http://localhost:3000
- **API Backend:** http://localhost:8000
- **Documentação da API:** http://localhost:8000/docs

### Operações básicas:

1. **Autenticação:**
   - Faça login usando suas credenciais
   - Configure o autenticador 2FA (recomendado)

2. **Monitoramento de produtos:**
   - Adicione produtos para rastrear via URL ou código
   - Configure intervalos de atualização de preços

3. **Configuração de alertas:**
   - Defina limites de preço para receber notificações
   - Configure canais de notificação (email, sistema)

4. **Geração de relatórios:**
   - Crie relatórios periódicos ou sob demanda
   - Exporte dados em diversos formatos

## 🔌 API

A API REST do sistema está disponível em `http://localhost:8000` com documentação completa via Swagger UI em `http://localhost:8000/docs`.

### Endpoints principais:

- `/api/auth`: Autenticação e gerenciamento de tokens
- `/api/products`: Gerenciamento de produtos monitorados
- `/api/sellers`: Informações sobre vendedores
- `/api/prices`: Histórico e análise de preços
- `/api/alerts`: Configuração e histórico de alertas
- `/api/reports`: Geração de relatórios personalizados

## 💻 Desenvolvimento

### Executando serviços individualmente:

#### Backend:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend:

```bash
cd frontend
npm install
npm start
```

### Importação de dados:

```bash
# Importar lista de preços de referência
docker-compose exec backend python -m scripts.import_prices /caminho/para/lista_precos.xlsx

# Importar lista de vendedores autorizados
docker-compose exec backend python -m scripts.import_sellers /caminho/para/lista_vendedores.xlsx
```

## 🔧 Solução de Problemas

### Problemas comuns e soluções:

#### Contêineres não iniciam:

```bash
# Verificar logs
docker-compose logs -f

# Reiniciar serviços
docker-compose restart
```

#### Erro de conexão com banco de dados:

```bash
# Verificar status do PostgreSQL
docker-compose ps db

# Reiniciar o serviço
docker-compose restart db
```

#### Erro na API do OpenAI:

Verifique se a chave da API está configurada corretamente no arquivo `.env`.

## 🔒 Segurança

### Autenticação de dois fatores:

O sistema utiliza autenticação de dois fatores (2FA) para maior segurança:

```python
# Modelo de usuário com suporte a 2FA
class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    username = Column(String(50), nullable=False)
    password = Column(String(255), nullable=False)
    twofa_secret = Column(String(255), nullable=False)
```

Para configurar o 2FA:
1. Acesse as configurações da sua conta
2. Escaneie o código QR com um aplicativo autenticador
3. Insira o código gerado para validar

### Comandos Docker úteis:

```bash
# Iniciar todos os serviços
docker-compose up -d

# Parar todos os serviços
docker-compose down

# Reiniciar um serviço específico
docker-compose restart [serviço]

# Ver logs
docker-compose logs -f [serviço]

# Reconstruir após alterações
docker-compose build [serviço]
docker-compose up -d
```

## 🔄 Controle de Versão (Git)

### Fluxo de trabalho com Git

Para contribuir com o projeto e garantir que suas alterações sejam devidamente salvas no repositório:

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/seu-usuario/trader-hp-fiap.git
   cd trader-hp-fiap
   ```

2. **Crie uma branch para suas alterações**:
   ```bash
   git checkout -b feature/nome-da-sua-feature
   ```

3. **Faça suas alterações e commits**:
   ```bash
   git add .
   git commit -m "Descrição clara das alterações realizadas"
   ```

4. **Envie suas alterações para o repositório remoto**:
   ```bash
   git push origin feature/nome-da-sua-feature
   ```

5. **Crie um Pull Request** para que suas alterações sejam revisadas e incorporadas à branch principal.

### Boas práticas para commits

- Faça commits pequenos e focados em uma única alteração
- Use mensagens de commit claras e descritivas
- Sempre teste suas alterações antes de fazer commit
- Mantenha seu repositório local atualizado:
  ```bash
  git pull origin main
  ```

### Resolução de conflitos

Se ocorrerem conflitos durante o merge:

1. Resolva os conflitos localmente
2. Teste a aplicação após a resolução
3. Faça commit das alterações resolvidas
4. Continue com o push ou merge

## 👥 Contribuição

Para contribuir com o projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Faça commit das suas alterações (`git commit -m 'Adiciona nova funcionalidade'`)
4. Faça push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.

---

<div align="center">
  <p>Desenvolvido para FIAP - MBA em Engenharia de Software © 2025</p>
</div>
