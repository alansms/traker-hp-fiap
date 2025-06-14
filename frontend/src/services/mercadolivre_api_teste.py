import requests

ACCESS_TOKEN = "APP_USR-6360756636701314-052701-3c1552997010f12a770c521da900f02d-74559385"

def buscar_produtos(query):
    url = f"https://api.mercadolibre.com/sites/MLB/search?q={query}&limit=5"
    headers = {
        "Authorization": f"Bearer {ACCESS_TOKEN}"
    }

    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        resultados = response.json()
        print(f"\n🔍 Resultados para: {query}\n")
        for item in resultados.get("results", []):
            print(f"📦 {item['title']}")
            print(f"💰 R$ {item['price']}")
            print(f"🔗 {item['permalink']}\n")
    else:
        print("❌ Erro na requisição:", response.status_code)
        print(response.text)

if __name__ == "__main__":
    buscar_produtos("cartucho hp 664xl preto")
