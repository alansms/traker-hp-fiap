import requests
import json

# Substitua pelos seus dados reais
CLIENT_ID = "SEU_CLIENT_ID"
CLIENT_SECRET = "SEU_CLIENT_SECRET"
REFRESH_TOKEN = "SEU_REFRESH_TOKEN"

def renovar_token():
    url = "https://api.mercadolibre.com/oauth/token"
    payload = {
        "grant_type": "refresh_token",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "refresh_token": REFRESH_TOKEN
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    resp = requests.post(url, data=payload, headers=headers)
    if resp.status_code != 200:
        print("Erro ao renovar token:", resp.status_code, resp.text)
        exit()
    return resp.json()["access_token"]

def buscar_produtos(term):
    access_token = renovar_token()
    ml_url = f"https://api.mercadolibre.com/sites/MLB/search?q={term.replace(' ', '+')}&limit=5&access_token={access_token}"

    resp = requests.get(ml_url, timeout=30)
    if resp.status_code != 200:
        print("Erro:", resp.status_code, resp.text)
        return

    resultados = resp.json()
    for i, item in enumerate(resultados.get("results", []), 1):
        print(f"\n🔹 Produto {i}")
        print("📦 Título:", item.get("title"))
        print("💲 Preço: R$", item.get("price"))
        print("🛍️ Vendedor ID:", item.get("seller", {}).get("id"))
        print("🔗 Link:", item.get("permalink"))

if __name__ == "__main__":
    termo = input("Digite o nome do produto para buscar: ")
    buscar_produtos(termo)