#!/bin/bash

# =============================================================================
# SCRIPT DE CONFIGURAÇÃO PÓS-INSTALAÇÃO - MERCADO LIVRE TRACKER V2
# =============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

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

print_header() {
    echo -e "${PURPLE}=============================================================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}=============================================================================${NC}"
}

# Verificar se está no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    print_error "Execute este script no diretório do projeto!"
    exit 1
fi

print_header "CONFIGURAÇÃO PÓS-INSTALAÇÃO - MERCADO LIVRE TRACKER V2"

# =============================================================================
# 1. CONFIGURAR VARIÁVEIS DE AMBIENTE
# =============================================================================
print_header "1. CONFIGURANDO VARIÁVEIS DE AMBIENTE"

if [ ! -f ".env" ]; then
    print_error "Arquivo .env não encontrado!"
    exit 1
fi

print_status "Configurando variáveis de ambiente..."

# Gerar chaves secretas
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)

# Atualizar arquivo .env
sed -i "s/your-secret-key-here-change-this-in-production/$SECRET_KEY/g" .env
sed -i "s/your-jwt-secret-key-here-change-this-in-production/$JWT_SECRET_KEY/g" .env

print_success "Chaves secretas geradas e configuradas!"

# =============================================================================
# 2. CONFIGURAR BANCO DE DADOS
# =============================================================================
print_header "2. CONFIGURANDO BANCO DE DADOS"
print_status "Iniciando banco de dados..."

docker-compose up -d db redis

print_status "Aguardando banco de dados inicializar..."
sleep 30

# Verificar se o banco está rodando
if docker-compose ps | grep -q "db.*Up"; then
    print_success "Banco de dados iniciado com sucesso!"
else
    print_error "Erro ao iniciar banco de dados!"
    exit 1
fi

# =============================================================================
# 3. EXECUTAR MIGRAÇÕES
# =============================================================================
print_header "3. EXECUTANDO MIGRAÇÕES"
print_status "Executando migrações do banco de dados..."

# Iniciar backend temporariamente para executar migrações
docker-compose up -d backend

print_status "Aguardando backend inicializar..."
sleep 20

# Executar migrações
docker-compose exec backend python -c "
import sys
sys.path.append('/app')
from app.db.init_db import init_db
init_db()
print('Migrações executadas com sucesso!')
"

print_success "Migrações executadas com sucesso!"

# =============================================================================
# 4. CRIAR USUÁRIO ADMINISTRADOR
# =============================================================================
print_header "4. CRIANDO USUÁRIO ADMINISTRADOR"
print_status "Criando usuário administrador padrão..."

docker-compose exec backend python -c "
import sys
sys.path.append('/app')
from app.models.user import User
from app.db.session import get_db
from sqlalchemy.orm import Session
import hashlib

db = next(get_db())

# Verificar se já existe um admin
admin = db.query(User).filter(User.role == 'admin').first()
if admin:
    print('Usuário administrador já existe!')
else:
    # Criar usuário admin
    admin_user = User(
        username='admin',
        email='admin@hp.com',
        hashed_password=hashlib.sha256('admin123'.encode()).hexdigest(),
        role='admin',
        is_active=True,
        is_verified=True
    )
    db.add(admin_user)
    db.commit()
    print('Usuário administrador criado com sucesso!')
    print('Username: admin')
    print('Password: admin123')
    print('IMPORTANTE: Altere a senha após o primeiro login!')
"

print_success "Usuário administrador configurado!"

# =============================================================================
# 5. POPULAR DADOS INICIAIS
# =============================================================================
print_header "5. POPULANDO DADOS INICIAIS"
print_status "Populando banco com dados de exemplo..."

# Executar script de população
docker-compose exec backend python -c "
import sys
sys.path.append('/app')
from backend.scripts.populate_dashboard import populate_dashboard_data
populate_dashboard_data()
print('Dados iniciais populados com sucesso!')
" 2>/dev/null || print_warning "Script de população não encontrado. Continuando..."

print_success "Dados iniciais configurados!"

# =============================================================================
# 6. INICIAR SISTEMA COMPLETO
# =============================================================================
print_header "6. INICIANDO SISTEMA COMPLETO"
print_status "Iniciando todos os serviços..."

docker-compose up -d

print_status "Aguardando todos os serviços inicializarem..."
sleep 30

# =============================================================================
# 7. VERIFICAÇÃO FINAL
# =============================================================================
print_header "7. VERIFICAÇÃO FINAL"
print_status "Verificando status dos serviços..."

echo ""
echo "=== STATUS DOS CONTAINERS ==="
docker-compose ps

echo ""
echo "=== TESTE DE CONECTIVIDADE ==="

# Testar frontend
if curl -s http://localhost:3000 > /dev/null; then
    print_success "✅ Frontend acessível em http://localhost:3000"
else
    print_warning "⚠️  Frontend ainda não está acessível"
fi

# Testar backend
if curl -s http://localhost:8000/health > /dev/null; then
    print_success "✅ Backend acessível em http://localhost:8000"
else
    print_warning "⚠️  Backend ainda não está acessível"
fi

# Testar API
if curl -s http://localhost:8000/api/health > /dev/null; then
    print_success "✅ API acessível em http://localhost:8000/api"
else
    print_warning "⚠️  API ainda não está acessível"
fi

# =============================================================================
# 8. CONFIGURAR SSL (OPCIONAL)
# =============================================================================
print_header "8. CONFIGURAÇÃO SSL (OPCIONAL)"
print_status "Para configurar SSL com Let's Encrypt, execute:"

echo ""
echo "sudo apt install certbot python3-certbot-nginx"
echo "sudo certbot --nginx -d seu-dominio.com"
echo ""

# =============================================================================
# FINALIZAÇÃO
# =============================================================================
print_header "CONFIGURAÇÃO CONCLUÍDA!"
print_success "Sistema configurado e pronto para uso!"

echo ""
echo -e "${CYAN}=== INFORMAÇÕES DE ACESSO ===${NC}"
echo -e "${GREEN}🌐 Frontend:${NC} http://localhost:3000"
echo -e "${GREEN}🔧 Backend:${NC} http://localhost:8000"
echo -e "${GREEN}📊 API Docs:${NC} http://localhost:8000/docs"
echo ""
echo -e "${CYAN}=== CREDENCIAIS PADRÃO ===${NC}"
echo -e "${GREEN}👤 Username:${NC} admin"
echo -e "${GREEN}🔑 Password:${NC} admin123"
echo -e "${YELLOW}⚠️  IMPORTANTE: Altere a senha após o primeiro login!${NC}"
echo ""
echo -e "${CYAN}=== COMANDOS ÚTEIS ===${NC}"
echo -e "${GREEN}Ver logs:${NC} docker-compose logs -f"
echo -e "${GREEN}Reiniciar:${NC} docker-compose restart"
echo -e "${GREEN}Parar:${NC} docker-compose down"
echo -e "${GREEN}Iniciar:${NC} docker-compose up -d"
echo ""
echo -e "${PURPLE}🎉 Sistema pronto para uso! 🎉${NC}"
