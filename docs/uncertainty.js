const uncertainty = document.querySelector('#price-uncertainty');
const scenarioOutput = document.querySelector('#scenario-results');
const scenarioInputs = ['oil', 'electric', 'link', 'cop'].map(id =>
  document.querySelector('#scenario-' + id)
);

function renderUncertainty() {
  if (!uncertainty.open) return;
  if (!scenarioInputs.every(input => input.checkValidity())) {
    scenarioOutput.textContent = 'Enter a valid value in each scenario field.';
    return;
  }

  const [oilTrend, electricTrend, link, cop] = scenarioInputs.map(input => Number(input.value) / 100);
  const outcomes = [[], []];
  for (const path of priceScenarios) {
    const savings = [-state.install[1], -state.install[4]];
    for (let year = 0; year < path.length; year++) {
      const shock = year === 0 ? 0 : path[year];
      const costs = calculate({
        ...state,
        oil: state.oil * (1 + oilTrend) ** year * Math.exp(shock),
        electric: state.electric * (1 + electricTrend) ** year * Math.exp(shock * link),
        cop: state.cop * cop
      });
      savings[0] += costs[0] - costs[1];
      savings[1] += costs[0] - costs[4];
    }
    savings.forEach((value, index) => outcomes[index].push(value));
  }

  const signedMoney = value => (value < 0 ? '−' : '') + money(Math.abs(value));
  scenarioOutput.innerHTML = outcomes.map((values, index) => {
    values.sort((a, b) => a - b);
    const percentile = fraction => signedMoney(values[Math.round(fraction * (values.length - 1))]);
    const share = values.filter(value => value > 0.005).length / values.length;
    const percent = new Intl.NumberFormat('en-IE', { style: 'percent', maximumFractionDigits: 1 }).format(share);
    return `<article><h3>${names[index === 0 ? 1 : 4]}</h3>
      <strong>${percent}</strong> of modelled scenarios cost less than keeping oil
      <p>Median 15-year saving: <b>${percentile(0.5)}</b></p>
      <p>Middle 80% of savings: ${percentile(0.1)} to ${percentile(0.9)}</p>
    </article>`;
  }).join('');
}

uncertainty.addEventListener('toggle', renderUncertainty);
uncertainty.addEventListener('input', renderUncertainty);
document.addEventListener('heatspend-ireland:comparison-updated', renderUncertainty);
