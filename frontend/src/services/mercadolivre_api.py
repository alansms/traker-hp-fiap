# capturar_code.py
import http.server
import socketserver
from urllib.parse import urlparse, parse_qs

PORT = 8888

class OAuthCallbackHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        query = urlparse(self.path).query
        params = parse_qs(query)
        code = params.get("code", [""])[0]

        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        self.wfile.write(b"<h1>✅ Code capturado com sucesso. Pode fechar esta aba.</h1>")
        print(f"\n🔐 Code capturado: {code}")
        self.server.code = code

def capturar_code():
    with socketserver.TCPServer(("", PORT), OAuthCallbackHandler) as httpd:
        print(f"🌐 Aguardando callback em http://localhost:{PORT}/callback ...")
        httpd.handle_request()
        return httpd.code

if __name__ == "__main__":
    code = capturar_code()
    print("\n✅ Cole este code no script gerar_token_mercadolivre.py:")
    print(code)