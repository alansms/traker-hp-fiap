#!/bin/bash

# =============================================================================
# SCRIPT DE VERIFICAÇÃO DE PRÉ-REQUISITOS
# =============================================================================
# Este script verifica se todos os pré-requisitos estão instalados
# =============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Função para verificar comando
check_command() {
    local cmd=$1
    local name=$2
    local install_instructions=$3
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if command -v "$cmd" &> /dev/null; then
        local version=$(eval "$cmd --version 2>/dev/null | head -n1" || echo "versão desconhecida")
        echo -e "${GREEN}✓${NC} $name está instalado: $version"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}✗${NC} $name NÃO está instalado"
        if [ -n "$install_instructions" ]; then
            echo -e "${YELLOW}  Instruções: $install_instructions${NC}"
        fi
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# Função para verificar versão mínima
check_version() {
    local cmd=$1
    local name=$2
    local min_version=$3
    local install_instructions=$4
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if command -v "$cmd" &> /dev/null; then
        local version=$(eval "$cmd --version 2>/dev/null | head -n1" || echo "versão desconhecida")
        echo -e "${GREEN}✓${NC} $name está instalado: $version"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}✗${NC} $name NÃO está instalado (mínimo: $min_version)"
        if [ -n "$install_instructions" ]; then
            echo -e "${YELLOW}  Instruções: $install_instructions${NC}"
        fi
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# Função para verificar Docker
check_docker() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if command -v docker &> /dev/null; then
        local version=$(docker --version)
        echo -e "${GREEN}✓${NC} Docker está instalado: $version"
        
        # Verificar se Docker está rodando
        if docker info &> /dev/null; then
            echo -e "${GREEN}✓${NC} Docker está rodando"
            PASSED_CHECKS=$((PASSED_CHECKS + 2))
        else
            echo -e "${YELLOW}⚠${NC} Docker está instalado mas não está rodando"
            echo -e "${YELLOW}  Inicie o Docker Desktop ou execute: sudo systemctl start docker${NC}"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
        fi
    else
        echo -e "${RED}✗${NC} Docker NÃO está instalado"
        echo -e "${YELLOW}  Instale em: https://docs.docker.com/get-docker/${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

# Função para verificar Docker Compose
check_docker_compose() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if command -v docker-compose &> /dev/null; then
        local version=$(docker-compose --version)
        echo -e "${GREEN}✓${NC} Docker Compose está instalado: $version"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}✗${NC} Docker Compose NÃO está instalado"
        echo -e "${YELLOW}  Instale em: https://docs.docker.com/compose/install/${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

# Função para verificar espaço em disco
check_disk_space() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    local available_space=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
    
    if [ "$available_space" -ge 5 ]; then
        echo -e "${GREEN}✓${NC} Espaço em disco suficiente: ${available_space}GB disponível"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${YELLOW}⚠${NC} Pouco espaço em disco: ${available_space}GB disponível (recomendado: 5GB+)"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    fi
}

# Função para verificar memória
check_memory() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    local total_memory=$(free -g | awk 'NR==2{print $2}')
    
    if [ "$total_memory" -ge 4 ]; then
        echo -e "${GREEN}✓${NC} Memória suficiente: ${total_memory}GB RAM"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${YELLOW}⚠${NC} Pouca memória: ${total_memory}GB RAM (recomendado: 4GB+)"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    fi
}

# Função para verificar conectividade
check_connectivity() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if ping -c 1 github.com &> /dev/null; then
        echo -e "${GREEN}✓${NC} Conectividade com GitHub OK"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}✗${NC} Sem conectividade com GitHub"
        echo -e "${YELLOW}  Verifique sua conexão com a internet${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

# Função para verificar portas
check_ports() {
    local ports=(3000 8000 5432 6379)
    local port_available=true
    
    for port in "${ports[@]}"; do
        if lsof -i :$port &> /dev/null; then
            echo -e "${YELLOW}⚠${NC} Porta $port está em uso"
            port_available=false
        fi
    done
    
    if [ "$port_available" = true ]; then
        echo -e "${GREEN}✓${NC} Portas necessárias estão livres"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${YELLOW}⚠${NC} Algumas portas estão em uso (3000, 8000, 5432, 6379)"
        echo -e "${YELLOW}  Pare os serviços que usam essas portas ou mude as configurações${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    fi
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
}

# Banner
echo -e "${BLUE}============================================================================="
echo "                    VERIFICAÇÃO DE PRÉ-REQUISITOS"
echo "=============================================================================${NC}"
echo ""

# Verificações básicas
echo -e "${BLUE}Verificando comandos básicos...${NC}"
check_command "git" "Git" "sudo apt-get install git (Ubuntu/Debian) ou brew install git (macOS)"
check_command "curl" "cURL" "sudo apt-get install curl (Ubuntu/Debian) ou brew install curl (macOS)"
check_command "wget" "Wget" "sudo apt-get install wget (Ubuntu/Debian) ou brew install wget (macOS)"

echo ""

# Verificações do Docker
echo -e "${BLUE}Verificando Docker...${NC}"
check_docker
check_docker_compose

echo ""

# Verificações do sistema
echo -e "${BLUE}Verificando recursos do sistema...${NC}"
check_disk_space
check_memory

echo ""

# Verificações de rede
echo -e "${BLUE}Verificando conectividade...${NC}"
check_connectivity
check_ports

echo ""

# Resumo
echo -e "${BLUE}============================================================================="
echo "                              RESUMO"
echo "=============================================================================${NC}"

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}✓ Todos os pré-requisitos estão atendidos!${NC}"
    echo -e "${GREEN}✓ Você pode prosseguir com a instalação.${NC}"
    exit 0
else
    echo -e "${RED}✗ $FAILED_CHECKS verificação(ões) falharam${NC}"
    echo -e "${YELLOW}⚠ Resolva os problemas antes de prosseguir com a instalação.${NC}"
    exit 1
fi
