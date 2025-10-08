"""
Gerenciador de rotas IPv4/IPv6 com alternância inteligente
"""
import socket
import time
import logging
from datetime import datetime
from typing import Literal, Dict
import redis
import json

logger = logging.getLogger(__name__)

class RouteManager:
    def __init__(self, redis_url="redis://redis:6379/0"):
        """Inicializa gerenciador de rotas"""
        try:
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
        except:
            self.redis_client = None
            logger.warning("Redis não disponível, usando memória local")
        
        self.current_ip_version = "ipv6"  # Começa com IPv6
        self.request_count = 0
        self.requests_per_switch = 3
        self.blocked_routes = {"ipv4": False, "ipv6": False}
        self.block_count = {"ipv4": 0, "ipv6": 0}
        self.last_switch = datetime.now()
        
    def get_status(self) -> Dict:
        """Retorna status atual das rotas"""
        if self.redis_client:
            try:
                data = self.redis_client.get("route_status")
                if data:
                    return json.loads(data)
            except:
                pass
        
        return {
            "current_ip": self.current_ip_version,
            "request_count": self.request_count,
            "next_switch_in": self.requests_per_switch - self.request_count,
            "ipv4_blocked": self.blocked_routes["ipv4"],
            "ipv6_blocked": self.blocked_routes["ipv6"],
            "ipv4_block_count": self.block_count["ipv4"],
            "ipv6_block_count": self.block_count["ipv6"],
            "last_switch": self.last_switch.isoformat()
        }
    
    def save_status(self):
        """Salva status no Redis"""
        if self.redis_client:
            try:
                status = self.get_status()
                self.redis_client.setex("route_status", 3600, json.dumps(status))
            except Exception as e:
                logger.error(f"Erro ao salvar status: {e}")
    
    def report_429(self, ip_version: str = None):
        """Registra bloqueio 429"""
        if ip_version is None:
            ip_version = self.current_ip_version
        
        self.block_count[ip_version] += 1
        self.blocked_routes[ip_version] = True
        
        logger.warning(f"🚫 Rota {ip_version.upper()} BLOQUEADA (429) - Total: {self.block_count[ip_version]}")
        self.save_status()
        
        # Se a rota atual foi bloqueada, troca imediatamente
        if ip_version == self.current_ip_version:
            self.switch_route()
    
    def clear_block(self, ip_version: str):
        """Limpa bloqueio de uma rota"""
        self.blocked_routes[ip_version] = False
        logger.info(f"✅ Rota {ip_version.upper()} desbloqueada")
        self.save_status()
    
    def switch_route(self):
        """Alterna para a próxima rota disponível"""
        # Tenta alternar para a outra rota
        next_route = "ipv4" if self.current_ip_version == "ipv6" else "ipv6"
        
        # Se a próxima rota está bloqueada, mantém a atual
        if self.blocked_routes[next_route]:
            logger.warning(f"⚠️ {next_route.upper()} está bloqueada, mantendo {self.current_ip_version.upper()}")
            return False
        
        old_route = self.current_ip_version
        self.current_ip_version = next_route
        self.request_count = 0
        self.last_switch = datetime.now()
        
        logger.info(f"🔄 Alternando rota: {old_route.upper()} → {next_route.upper()}")
        self.save_status()
        return True
    
    def before_request(self):
        """Chamado antes de cada requisição"""
        self.request_count += 1
        
        # Alterna após N requisições
        if self.request_count >= self.requests_per_switch:
            self.switch_route()
        
        logger.debug(f"📡 Usando {self.current_ip_version.upper()} ({self.request_count}/{self.requests_per_switch})")
        self.save_status()
        
        return self.current_ip_version
    
    def force_ipv4(self):
        """Força uso de IPv4"""
        original_getaddrinfo = socket.getaddrinfo
        
        def ipv4_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
            return original_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
        
        socket.getaddrinfo = ipv4_getaddrinfo
        logger.info("🌐 IPv4 ativado")
    
    def force_ipv6(self):
        """Força uso de IPv6"""
        original_getaddrinfo = socket.getaddrinfo
        
        def ipv6_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
            return original_getaddrinfo(host, port, socket.AF_INET6, type, proto, flags)
        
        socket.getaddrinfo = ipv6_getaddrinfo
        logger.info("🌐 IPv6 ativado")
    
    def apply_current_route(self):
        """Aplica a rota atual"""
        if self.current_ip_version == "ipv4":
            self.force_ipv4()
        else:
            self.force_ipv6()

# Instância global
_route_manager = None

def get_route_manager() -> RouteManager:
    """Retorna instância singleton do gerenciador"""
    global _route_manager
    if _route_manager is None:
        _route_manager = RouteManager()
    return _route_manager
