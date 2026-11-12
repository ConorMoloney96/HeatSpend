"""Fetch public supplier listings without submitting quote or order forms."""
import json
import re
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request, urlopen

OUTPUT = Path(__file__).resolve().parents[1] / "docs" / "supplier-prices.json"
VOLUMES = (300, 500, 1000)


class ProductTags(HTMLParser):
    def __init__(self):
        super().__init__()
        self.products = []

    def handle_starttag(self, tag, attrs):
        product = dict(attrs).get("data-wnd_product_item_data")
        if tag == "a" and product:
            self.products.append(json.loads(product))


def parse_prices(provider, html):
    if provider == "Dublin Oil":
        matches = re.findall(r'<option\s+value="([\d.]+)"\s+data-name="Kerosene (\d+)\s*L"', html)
        return {int(litres): float(price) for price, litres in matches}
    if provider == "Duffy Oils":
        matches = re.findall(
            r'<div id="qty">(\d+)L</div><div id="ftype">HOME HEATING OIL</div>'
            r'<div id="prcwrap"><div id="prc"><sup>&euro;</sup>([\d,]+)<sup>(\.\d\d)</sup>',
            html,
        )
        return {int(litres): float(euros.replace(",", "") + cents) for litres, euros, cents in matches}

    parser = ProductTags()
    parser.feed(html)
    prices = {}
    for product in parser.products:
        quantity = re.fullmatch(r"(\d+)\s+Litres", product.get("name", ""), re.I)
        if quantity and product.get("category") == "Kerosene Pricing":
            prices[int(quantity[1])] = float(product["price"])
    return prices


def main():
    providers = [
        ("Dublin Oil", "County Dublin", "https://dublinoil.ie/"),
        ("Duffy Oils", "Parts of Louth, Cavan and Monaghan", "https://duffyoils.ie/"),
        ("KFS Oils", "County Wexford", "https://www.kfsoils.ie/all-products/"),
    ]
    previous = json.loads(OUTPUT.read_text()) if OUTPUT.exists() else []
    rows = []
    successes = 0
    for provider, area, source in providers:
        try:
            request = Request(source, headers={"User-Agent": "HeatSpend public price checker/1.0"})
            with urlopen(request, timeout=20) as response:
                prices = parse_prices(provider, response.read().decode("utf-8", errors="replace"))
            if any(not 0.3 <= prices.get(litres, 0) / litres <= 5 for litres in VOLUMES):
                raise ValueError("Expected three plausible prices for the listed quantities")
            checked = datetime.now(timezone.utc).isoformat(timespec="seconds")
            rows.extend(dict(provider=provider, area=area, source=source, litres=litres,
                             total=prices[litres], checked=checked) for litres in VOLUMES)
            successes += 1
            print(f"{provider}: {[(litres, prices[litres]) for litres in VOLUMES]}")
        except Exception as error:
            print(f"{provider}: {error}")
            rows.extend(row for row in previous if row["provider"] == provider)
    if not successes:
        raise SystemExit("No supplier prices refreshed")
    OUTPUT.write_text(json.dumps(rows, indent=2) + "\n")


if __name__ == "__main__":
    main()
