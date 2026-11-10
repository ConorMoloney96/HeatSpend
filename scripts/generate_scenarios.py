"""Regenerate the browser scenario data from the bundled CSO oil index."""
import json
import math
import random
from pathlib import Path
from statistics import mean

dist = Path(__file__).resolve().parents[1] / "docs"
index = json.loads((dist / "benchmarks.js").read_text().split("const oilIndex = ", 1)[1].strip().removesuffix(";"))
levels = [value for _, value in index]
annual_moves = [math.log(current / previous) for previous, current in zip(levels, levels[12:])]
center = mean(annual_moves)
shocks = [move - center for move in annual_moves]
randomizer = random.Random(47)
paths = [[round(randomizer.choice(shocks), 6) for _ in range(15)] for _ in range(1000)]
(dist / "price-scenarios.js").write_text("const priceScenarios = " + json.dumps(paths, separators=(",", ":")) + ";\n")
