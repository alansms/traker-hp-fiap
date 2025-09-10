import requests

# 🔐 Dados do seu app e tokens anteriores
CLIENT_ID = "6360756636701314"
CLIENT_SECRET = "D2KYptsojzR1Kf7ccXq6zw0jmdENbQKr"
REFRESH_TOKEN = "TG-683552f8d375aa00017c38ec-74559385"

def renovar_token():
    url = "https://api.mercadolibre.com/oauth/token"
    data = {
        "grant_type": "refresh_token",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "refresh_token": REFRESH_TOKEN
    }
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }

    print("🔄 Renovando token...")
    resp = requests.post(url, data=data, headers=headers)
    resp.raise_for_status()
    token_data = resp.json()

    print("✅ Novo Access Token:", token_data["access_token"])
    print("🔁 Novo Refresh Token:", token_data["refresh_token"])
    print("⏱️ Expira em:", token_data["expires_in"], "segundos")
    return token_data["access_token"]

def testar_token(token):
    print("\n🔍 Testando token com /users/me...")
    resp = requests.get("https://api.mercadolibre.com/users/me", headers={
        "Authorization": f"Bearer {token}"
    })
    if resp.status_code == 200:
        print("✅ Token válido. Usuário:", resp.json().get("nickname"))
    else:
        print("❌ Token inválido:", resp.status_code)
        print(resp.text)

def buscar_produtos(token, query="cartucho hp 664xl preto"):
    print(f"\n🛒 Buscando produtos para: {query}")
    url = f"https://api.mercadolibre.com/sites/MLB/search?q={query}&limit=5"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    resp = requests.get(url, headers=headers)
    if resp.status_code == 200:
        for item in resp.json()["results"]:
            print(f"📦 {item['title']} - 💰 R$ {item['price']}")
            print(f"🔗 {item['permalink']}\n")
    else:
        print("❌ Erro na busca:", resp.status_code)
        print(resp.text)

if __name__ == "__main__":
    try:
        access_token = renovar_token()
        testar_token(access_token)
        buscar_produtos(access_token)
    except Exception as e:
        print("🚨 Erro geral:", str(e))