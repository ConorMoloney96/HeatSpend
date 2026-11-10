const benchmarks = {
  "oil": [
    1.61,
    "\u20ac1.61/L \u00b7 discounted 1,000 L kerosene",
    "SEAI \u00b7 1 Oct 2026",
    "https://www.seai.ie/sites/default/files/publications/Domestic-Fuel-Cost-Comparison.pdf"
  ],
  "energy": [
    10.18,
    "10.18 kWh/L \u00b7 kerosene",
    "SEAI \u00b7 1 Oct 2026",
    "https://www.seai.ie/sites/default/files/publications/Domestic-Fuel-Cost-Comparison.pdf"
  ],
  "pellet": [
    0.1068,
    "\u20ac0.1068/kWh fuel \u00b7 bulk pellets",
    "SEAI \u00b7 1 Oct 2026",
    "https://www.seai.ie/sites/default/files/publications/Domestic-Fuel-Cost-Comparison.pdf"
  ],
  "electric": [
    0.3392,
    "\u20ac0.3392/kWh \u00b7 household band DD",
    "Eurostat \u00b7 Jan\u2013Jun 2026",
    "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/nrg_pc_204?geo=IE&currency=EUR&tax=I_TAX"
  ],
  "gas": [
    0.1183,
    "\u20ac0.1183/kWh \u00b7 household band D2",
    "Eurostat \u00b7 Jan\u2013Jun 2026",
    "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/nrg_pc_202?geo=IE&currency=EUR&tax=I_TAX"
  ]
};
const oilIndex = [["2023-12", 100.0], ["2024-01", 98.4], ["2024-02", 104.4], ["2024-03", 101.0], ["2024-04", 102.4], ["2024-05", 99.4], ["2024-06", 96.2], ["2024-07", 100.9], ["2024-08", 96.9], ["2024-09", 92.1], ["2024-10", 93.7], ["2024-11", 93.4], ["2024-12", 93.7], ["2025-01", 99.9], ["2025-02", 100.6], ["2025-03", 95.7], ["2025-04", 92.8], ["2025-05", 88.4], ["2025-06", 87.5], ["2025-07", 95.5], ["2025-08", 93.1], ["2025-09", 91.0], ["2025-10", 92.2], ["2025-11", 95.8], ["2025-12", 94.6], ["2026-01", 92.0], ["2026-02", 93.3], ["2026-03", 156.3], ["2026-04", 167.4], ["2026-05", 141.5], ["2026-06", 130.1], ["2026-07", 122.2], ["2026-08", 134.6], ["2026-09", 144.3]];
