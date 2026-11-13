const volume = document.querySelector('#oil-volume');
const body = document.querySelector('#supplier-prices');
const status = document.querySelector('#supplier-status');
const totalFormat = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });
const dateFormat = new Intl.DateTimeFormat('en-IE', {
  timeZone: 'Europe/Dublin', dateStyle: 'medium', timeStyle: 'short'
});
const latestData = 'https://raw.githubusercontent.com/ConorMoloney96/HeatSpend/main/docs/supplier-prices.json';
let prices = [];

async function getPrices(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!response.ok) throw new Error('Price data unavailable');
  const rows = await response.json();
  if (!Array.isArray(rows) || rows.length === 0) throw new Error('No prices available');
  return rows;
}

function renderPrices() {
  const rows = prices.filter(row => row.litres === Number(volume.value));
  body.replaceChildren();
  for (const row of rows) {
    const tr = body.insertRow();
    const supplier = document.createElement('a');
    supplier.href = row.source;
    supplier.textContent = row.provider;
    tr.insertCell().append(supplier);
    tr.insertCell().textContent = row.area;
    tr.insertCell().textContent = totalFormat.format(row.total);
    tr.insertCell().textContent = '€' + (row.total / row.litres).toFixed(3);
    const checked = new Date(row.checked);
    const older = Date.now() - checked.getTime() > 30 * 60 * 60 * 1000;
    tr.insertCell().textContent = dateFormat.format(checked) + (older ? ' · Older listing' : '');
  }
  status.textContent = rows.length
    ? 'Selected supplier listings. Compare quotes for the same delivery address.'
    : 'No supplier prices are available for this volume.';
}

async function loadPrices() {
  const snapshots = await Promise.allSettled([
    getPrices('supplier-prices.json'),
    getPrices(latestData)
  ]);
  let newestCheck = 0;
  for (const snapshot of snapshots) {
    if (snapshot.status !== 'fulfilled') continue;
    const checked = Math.max(...snapshot.value.map(row => Date.parse(row.checked)));
    if (checked > newestCheck) {
      newestCheck = checked;
      prices = snapshot.value;
    }
  }
  if (!prices.length) {
    status.textContent = 'Supplier prices could not load. Use the source links below to check recent prices.';
    return;
  }
  renderPrices();
}

volume.addEventListener('change', renderPrices);
loadPrices();
