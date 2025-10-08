import socket
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.connection import create_connection

class IPv6HTTPAdapter(HTTPAdapter):
    """Força conexões HTTP via IPv6"""
    
    def __init__(self, *args, **kwargs):
        self.socket_options = HTTPAdapter.DEFAULT_POOLBLOCK
        super(IPv6HTTPAdapter, self).__init__(*args, **kwargs)
    
    def init_poolmanager(self, *args, **kwargs):
        # Force IPv6
        kwargs["socket_options"] = [(socket.AF_INET6, socket.SOCK_STREAM, 0)]
        return super(IPv6HTTPAdapter, self).init_poolmanager(*args, **kwargs)

def get_ipv6_session():
    """Retorna uma sessão requests configurada para usar IPv6"""
    session = requests.Session()
    
    # Força uso de IPv6
    old_create_connection = create_connection
    
    def create_ipv6_connection(address, *args, **kwargs):
        # Força family para IPv6
        kwargs["source_address"] = ("::", 0)
        return old_create_connection(address, *args, **kwargs)
    
    # Monkey patch
    requests.packages.urllib3.util.connection.create_connection = create_ipv6_connection
    
    return session

def force_ipv6():
    """Força todas as conexões socket para usar IPv6"""
    original_getaddrinfo = socket.getaddrinfo
    
    def ipv6_only_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
        return original_getaddrinfo(host, port, socket.AF_INET6, type, proto, flags)
    
    socket.getaddrinfo = ipv6_only_getaddrinfo
