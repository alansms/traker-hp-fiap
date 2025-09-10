import asyncio
from playwright.async_api import async_playwright
import csv

# Mapeamento de PN → termo de busca (título parcial)
PRODUTOS = {
    "3YM78AB": "HP 667 Colorido",
    "3YM79AB": "HP 667 Preto",
    "3YM80AB": "HP 667XL Colorido",
    "3YM81AB": "HP 667XL Preto",
    "F6V28AB": "HP 664 Tri-color",
    "F6V29AB": "HP 664 Preto",
    "F6V30AB": "HP 664XL Tri-color",
    "F6V31AB": "HP 664XL Preto",
    "CZ103AB": "HP 662 Preto",
    "CZ104AB": "HP 662 Tricolor",
    "CZ105AB": "HP 662XL Preto",
    "CZ106AB": "HP 662XL Tricolor",
    "1VV22AL": "HP GT53 Preto",
}

async def fetch(page, pn, term):
    url = f"https://lista.mercadolivre.com.br/{term.replace(' ', '-')}"
    await page.goto(url)
    await page.wait_for_selector(".ui-search-result__content-title", timeout=10000)
    title_el = await page.query_selector(".ui-search-result__content-title")
    price_int = await page.query_selector(".andes-money-amount__integer-part")
    price_frac = await page.query_selector(".andes-money-amount__fraction-part")
    title = title_el.inner_text() if title_el else ""
    price = 0.0
    if price_int:
        integer = await price_int.inner_text()
        fraction = await (price_frac.inner_text() if price_frac else "00")
        price = float(integer.replace(".", "") + "." + fraction)
    return title.strip(), price

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        results = []
        for pn, term in PRODUTOS.items():
            print(f"Buscando {pn} → {term} …")
            try:
                title, price = await fetch(page, pn, term)
            except Exception as e:
                title, price = "", 0.0
            print(f"  → {title} | R$ {price}\n")
            results.append([pn, term, title, price])
        await browser.close()

    # Exportar para CSV
    with open("resultados.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["PN","Busca","Título Encontrado","Preço (R$)"])
        writer.writerows(results)
    print("✅ Resultados salvos em resultados.csv")

if __name__ == "__main__":
    asyncio.run(main())