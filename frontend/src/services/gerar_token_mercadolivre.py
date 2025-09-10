import requests

CLIENT_ID = "6360756636701314"
CLIENT_SECRET = "D2KYptsojzR1Kf7ccXq6zw0jmdENbQKr"
REDIRECT_URI = "https://884d-179-185-246-151.ngrok-free.app/callback"
AUTHORIZATION_CODE = "TG-683552b8d85e650001e631ea-74559385"

def gerar_token():
    url = "https://api.mercadolibre.com/oauth/token"
    data = {
        "grant_type": "authorization_code",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "code": AUTHORIZATION_CODE,
        "redirect_uri": REDIRECT_URI
    }
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }

    response = requests.post(url, data=data, headers=headers)
    try:
        response.raise_for_status()
        token = response.json()
        print("\n✅ Access Token:", token.get("access_token"))
        print("🔁 Refresh Token:", token.get("refresh_token"))
        print("⏱️ Expira em:", token.get("expires_in"), "segundos")
    except Exception as e:
        print("❌ Erro ao gerar token:", e)
        print("Resposta da API:", response.text)

if __name__ == "__main__":
    gerar_token()