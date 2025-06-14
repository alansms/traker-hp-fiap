import os, requests, pprint

APP_ID     = "5570849993628124"
APP_SECRET = "vsO9y0Gl3QSedRwmG9KcPes4eEHQfOuh"

def get_app_token():
    r = requests.post(
        "https://api.mercadolibre.com/oauth/token",
        data={
            "grant_type": "client_credentials",
            "client_id": APP_ID,
            "client_secret": APP_SECRET,
        },
        timeout=10,
    ).json()
    return r["access_token"]

def get_item(item_id):
    token = get_app_token()           # token de app dura ~6 h
    hdrs  = {
        "Authorization": f"Bearer {token}",
        "X-Client-Id": APP_ID,
        "X-Caller-Id": APP_ID,
        "Accept": "application/json",
        "version": "v2",
    }
    r = requests.get(
        f"https://api.mercadolibre.com/items/{item_id}",
        params={"caller.id": APP_ID, "attributes": "title,price"},
        headers=hdrs,
        timeout=10,
    )
    print("status", r.status_code)
    pprint.pprint(r.json())

if __name__ == "__main__":
    get_item("MLB3768013601")     # troque por anúncio ativo