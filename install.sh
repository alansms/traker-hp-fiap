#!/bin/bash

# =============================================================================
# SCRIPT DE INSTALAÇÃO - MERCADO LIVRE TRACKER V2
# =============================================================================
# Este script automatiza a instalação completa do projeto em uma nova máquina
# Repositório: https://github.com/alansms/traker-hp-fiap
# =============================================================================

set -e  # Para o script em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Banner do script
print_banner() {
    echo -e "${BLUE}"
    echo "============================================================================="
    echo "                    MERCADO LIVRE TRACKER V2 - INSTALADOR"
    echo "============================================================================="
    echo -e "${NC}"
    echo "Este script irá instalar o sistema completo de rastreamento do Mercado Livre"
    echo "Desenvolvido para FIAP - MBA em Engenharia de Software"
    echo ""
}

# Verificar se o script está sendo executado como root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_warning "Este script não deve ser executado como root!"
        print_status "Execute como usuário normal. O script solicitará senha quando necessário."
        exit 1
    fi
}

# Verificar sistema operacional
check_os() {
    print_status "Verificando sistema operacional..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        print_success "Sistema Linux detectado"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        print_success "Sistema macOS detectado"
    else
        print_error "Sistema operacional não suportado: $OSTYPE"
        exit 1
    fi
}

# Verificar pré-requisitos
check_prerequisites() {
    print_status "Verificando pré-requisitos..."
    
    # Verificar Git
    if ! command -v git &> /dev/null; then
        print_error "Git não está instalado. Instalando..."
        if [[ "$OS" == "linux" ]]; then
            sudo apt-get update && sudo apt-get install -y git
        elif [[ "$OS" == "macos" ]]; then
            if ! command -v brew &> /dev/null; then
                print_error "Homebrew não está instalado. Instale o Homebrew primeiro."
                exit 1
            fi
            brew install git
        fi
    else
        print_success "Git está instalado"
    fi
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker não está instalado!"
        print_status "Instalando Docker..."
        
        if [[ "$OS" == "linux" ]]; then
            # Instalar Docker no Linux
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo usermod -aG docker $USER
            rm get-docker.sh
        elif [[ "$OS" == "macos" ]]; then
            print_warning "Por favor, instale o Docker Desktop para macOS:"
            print_status "https://docs.docker.com/desktop/mac/install/"
            read -p "Pressione Enter após instalar o Docker Desktop..."
        fi
    else
        print_success "Docker está instalado"
    fi
    
    # Verificar Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose não está instalado!"
        print_status "Instalando Docker Compose..."
        
        if [[ "$OS" == "linux" ]]; then
            sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
        elif [[ "$OS" == "macos" ]]; then
            print_warning "Docker Compose deve vir com o Docker Desktop"
        fi
    else
        print_success "Docker Compose está instalado"
    fi
}

# Clonar repositório
clone_repository() {
    print_status "Clonando repositório do GitHub..."
    
    REPO_URL="https://github.com/alansms/traker-hp-fiap.git"
    PROJECT_DIR="mercado-livre-tracker"
    
    if [ -d "$PROJECT_DIR" ]; then
        print_warning "Diretório $PROJECT_DIR já existe!"
        read -p "Deseja remover e clonar novamente? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$PROJECT_DIR"
        else
            print_status "Usando diretório existente..."
            cd "$PROJECT_DIR"
            return
        fi
    fi
    
    git clone "$REPO_URL" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    
    # Mudar para a branch master
    git checkout master
    
    print_success "Repositório clonado com sucesso!"
}

# Criar arquivo .env
create_env_file() {
    print_status "Criando arquivo de configuração .env..."
    
    cat > .env << 'EOF'
# =============================================================================
# CONFIGURAÇÕES DO MERCADO LIVRE TRACKER V2
# =============================================================================

# Segurança
SECRET_KEY=your_secret_key_here_change_this_in_production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Banco de Dados PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123
POSTGRES_DB=ml_tracker
DATABASE_URL=postgresql://postgres:postgres123@db:5432/ml_tracker

# Redis Cache
REDIS_URL=redis://redis:6379/0

# OpenAI (Opcional - para assistente IA)
OPENAI_API_KEY=your_openai_api_key_here

# Email (Opcional - para notificações)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Frontend
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000

# Elasticsearch (Opcional - para busca avançada)
ELASTICSEARCH_URL=http://elasticsearch:9200

# Ambiente
ENVIRONMENT=development
DEBUG=true
EOF

    print_success "Arquivo .env criado!"
    print_warning "IMPORTANTE: Configure as variáveis no arquivo .env antes de iniciar o sistema!"
}

# Construir e iniciar containers
start_containers() {
    print_status "Construindo e iniciando containers Docker..."
    
    # Parar containers existentes se houver
    docker-compose down 2>/dev/null || true
    
    # Construir imagens
    print_status "Construindo imagens Docker..."
    docker-compose build
    
    # Iniciar containers
    print_status "Iniciando containers..."
    docker-compose up -d
    
    # Aguardar containers iniciarem
    print_status "Aguardando containers iniciarem..."
    sleep 30
    
    # Verificar status dos containers
    print_status "Verificando status dos containers..."
    docker-compose ps
}

# Configurar banco de dados
setup_database() {
    print_status "Configurando banco de dados..."
    
    # Aguardar PostgreSQL estar pronto
    print_status "Aguardando PostgreSQL estar pronto..."
    sleep 10
    
    # Executar migrações (se houver)
    print_status "Executando configurações iniciais do banco..."
    docker-compose exec -T backend python -c "
import sys
sys.path.append('/app')
from app.db.database import engine
from app.models import Base
Base.metadata.create_all(bind=engine)
print('Tabelas criadas com sucesso!')
" 2>/dev/null || print_warning "Não foi possível criar tabelas automaticamente"
}

# Verificar instalação
verify_installation() {
    print_status "Verificando instalação..."
    
    # Verificar se containers estão rodando
    if docker-compose ps | grep -q "Up"; then
        print_success "Containers estão rodando!"
    else
        print_error "Alguns containers não estão rodando!"
        docker-compose ps
        return 1
    fi
    
    # Verificar se API está respondendo
    print_status "Testando API..."
    sleep 5
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        print_success "API está respondendo!"
    else
        print_warning "API pode não estar pronta ainda. Aguarde alguns minutos."
    fi
    
    # Verificar se frontend está respondendo
    print_status "Testando frontend..."
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        print_success "Frontend está respondendo!"
    else
        print_warning "Frontend pode não estar pronto ainda. Aguarde alguns minutos."
    fi
}

# Mostrar informações finais
show_final_info() {
    echo ""
    echo -e "${GREEN}============================================================================="
    echo "                    INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
    echo "=============================================================================${NC}"
    echo ""
    echo -e "${BLUE}URLs de Acesso:${NC}"
    echo "  • Frontend: http://localhost:3000"
    echo "  • API Backend: http://localhost:8000"
    echo "  • Documentação API: http://localhost:8000/docs"
    echo ""
    echo -e "${BLUE}Credenciais Padrão:${NC}"
    echo "  • Email: admin@example.com"
    echo "  • Senha: admin123"
    echo ""
    echo -e "${YELLOW}IMPORTANTE:${NC}"
    echo "  1. Configure as variáveis no arquivo .env"
    echo "  2. Altere as credenciais padrão após o primeiro login"
    echo "  3. Configure a chave da OpenAI para usar o assistente IA"
    echo ""
    echo -e "${BLUE}Comandos Úteis:${NC}"
    echo "  • Ver logs: docker-compose logs -f"
    echo "  • Parar sistema: docker-compose down"
    echo "  • Reiniciar: docker-compose restart"
    echo "  • Atualizar: git pull && docker-compose build && docker-compose up -d"
    echo ""
    echo -e "${GREEN}Desenvolvido para FIAP - MBA em Engenharia de Software © 2025${NC}"
    echo ""
}

# Função principal
main() {
    print_banner
    
    # Verificações iniciais
    check_root
    check_os
    check_prerequisites
    
    # Instalação
    clone_repository
    create_env_file
    start_containers
    setup_database
    verify_installation
    
    # Informações finais
    show_final_info
}

# Executar script
main "$@"
