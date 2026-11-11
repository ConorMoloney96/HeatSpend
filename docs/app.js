const defaults={demand:15000,oil:1.05,energy:10.35,eff:85,electric:0.30,cop:3.2,gas:0.10,gasEff:90,standing:150,pellet:0.075,pelletEff:85,water:2500,solar:60,pump:60,oilMaint:120,hpMaint:150,gasMaint:120,pelletMaint:200,solarMaint:80,install:[0,11000,3500,6500,4500]};
const groups=[['Home & oil',[['demand','Useful heat demand (kWh/year)',1,100000,1],['oil','Delivered oil (€/litre)',.01,10,.01],['energy','Oil energy (kWh/litre)',1,20,.01],['eff','Boiler efficiency (%)',1,100,1],['oilMaint','Oil maintenance (€/year)',0,10000,10]]],['Electricity & heat pump',[['electric','Electricity (€/kWh)',.01,5,.01],['cop','Seasonal COP',1,7,.1],['hpMaint','Heat pump maintenance (€/year)',0,10000,10]]],['Gas & pellets',[['gas','Gas (€/kWh fuel)',.001,5,.001],['gasEff','Gas efficiency (%)',1,100,1],['standing','Gas standing charge (€/year)',0,10000,10],['gasMaint','Gas maintenance (€/year)',0,10000,10],['pellet','Pellets (€/kWh fuel)',.001,5,.001],['pelletEff','Pellet efficiency (%)',1,100,1],['pelletMaint','Pellet maintenance (€/year)',0,10000,10]]],['Solar thermal + oil',[['water','Hot-water demand (kWh/year)',0,100000,100],['solar','Solar share of hot water (%)',0,100,1],['pump','Solar pump electricity (kWh/year)',0,10000,10],['solarMaint','Solar maintenance (€/year)',0,10000,10]]]];
let storageOK=true;function read(k,d){try{return JSON.parse(localStorage.getItem(k))||d}catch{return d}}let state={...defaults,...read('heatwise-settings',{} )};state.install=Array.isArray(state.install)&&state.install.length===5?state.install:defaults.install.slice();let quotes=read('heatwise-quotes',[]);if(!Array.isArray(quotes))quotes=[];
function save(){try{localStorage.setItem('heatwise-settings',JSON.stringify(state));localStorage.setItem('heatwise-quotes',JSON.stringify(quotes))}catch{storageOK=false;document.querySelector('.local').textContent='Storage unavailable';toast('Browser storage unavailable. Export to keep your data.')}}
const money=n=>new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);const names=['Heating oil','Heat pump','Mains gas','Wood pellets','Solar thermal + oil'];
function calculate(s){let unit=s.oil/(s.energy*s.eff/100),offset=Math.min(s.demand,s.water*s.solar/100);return [s.demand*unit+s.oilMaint,s.demand/s.cop*s.electric+s.hpMaint,s.demand/(s.gasEff/100)*s.gas+s.standing+s.gasMaint,s.demand/(s.pelletEff/100)*s.pellet+s.pelletMaint,(s.demand-offset)*unit+s.oilMaint+s.solarMaint+s.pump*s.electric]}
function fields() {
  document.querySelector('#fields').innerHTML = groups.map(([title, inputs]) =>
    `<div class="field-group">${title}</div>` + inputs.map(([id, label, min, max, step]) => {
      const inputStep = id === 'oil' ? 'any' : benchmarks[id] ? 0.0001 : step;
      const demandHelp = id === 'demand' ? ' aria-describedby="demand-feedback"' : '';
      const feedback = id === 'demand' ? '<p id="demand-feedback" role="status"></p>' : '';
      return `<label>${label}<input aria-label="${label}" id="f-${id}" type="number"
        min="${min}" max="${max}" step="${inputStep}" value="${state[id]}" required${demandHelp}></label>
        ${feedback}${benchmarkControl(id)}`;
    }).join('')
  ).join('');

  for (const [id] of groups.flatMap(([, inputs]) => inputs)) {
    const input = document.querySelector('#f-' + id);
    input.addEventListener('input', () => {
      const valid = input.checkValidity();
      if (id === 'demand') {
        const feedback = document.querySelector('#demand-feedback');
        input.setAttribute('aria-invalid', String(!valid));
        feedback.textContent = valid ? '' :
          `Enter a whole number from 1 to 100,000 kWh. Results still use ${state.demand.toLocaleString('en-IE')} kWh.`;
      }
      if (!valid) return;
      state[id] = Number(input.value);
      save();
      render();
    });
  }
}
function render(){renderUpgradeDecision();document.dispatchEvent(new Event("heatwise:comparison-updated"));const costs=calculate(state),lowest=Math.min(...costs),best=costs.indexOf(lowest),max=Math.max(...costs);document.querySelector('#heat').textContent=state.demand.toLocaleString('en-IE')+' kWh';document.querySelector('#baseline').textContent=money(costs[0]);document.querySelector('#winner').textContent=names[best];document.querySelector('#saving').textContent=money(costs[0]-lowest)+' / year below oil';document.querySelector('#bars').innerHTML=costs.map((v,i)=>`<div class="bar-row"><span>${names[i]}</span><div class="track"><div class="bar ${i===0?'oil':i===best?'best':''}" style="width:${v/max*100}%"></div></div><strong>${money(v)}</strong></div>`).join('');document.querySelector('#table').innerHTML=costs.map((v,i)=>`<tr><td>${names[i]}</td><td>${i===0?'Existing system':`<input aria-label="Net installation cost for ${names[i]}" type="number" min="0" max="1000000" step="1" data-install="${i}" value="${state.install[i]}">`}</td><td>${money(v)}</td><td>${i===0?'Baseline':costs[0]>v?(state.install[i]/(costs[0]-v)).toFixed(1)+' yrs':'No saving'}</td><td>${money(state.install[i]+15*v)}</td></tr>`).join('');document.querySelectorAll('[data-install]').forEach(el=>el.addEventListener('change',e=>{if(e.target.checkValidity()&&e.target.value!==''){state.install[+e.target.dataset.install]=+e.target.value;save();render()}}))}
function toast(t){const el=document.querySelector('#toast');el.textContent=t;el.style.display='block';setTimeout(()=>el.style.display='none',3000)}
function esc(t){return String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function renderQuotes(){let sorted=[...quotes].sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));document.querySelector('#quotes').innerHTML=sorted.slice().reverse().map(q=>`<tr><td>${esc(q.date)}<br><strong>${esc(q.supplier)}</strong></td><td>${q.litres} L</td><td>${money(q.total)}</td><td>€${(q.total/q.litres).toFixed(3)}</td><td><button data-use="${q.id}">Use &amp; compare</button> <button data-delete="${q.id}" aria-label="Delete quote from ${esc(q.supplier)}">×</button></td></tr>`).join('')||'<tr><td class="empty" colspan="5">Your next oil quote belongs here.<br>Add a quote to start tracking.</td></tr>';document.querySelector('#quoteSummary').textContent=sorted.length?sorted.length+' saved quotes · Lowest recorded: €'+Math.min(...sorted.map(q=>q.total/q.litres)).toFixed(3)+'/L':'No sample quotes — your history starts with your data.';
const svg=document.querySelector('#chart');if(!sorted.length){svg.innerHTML='<text x="325" y="70" text-anchor="middle" fill="#7a8b7d" font-size="12">Your price trend will appear here · €/litre</text>';return}let vals=sorted.map(q=>q.total/q.litres),lo=Math.min(...vals)*.9,hi=Math.max(...vals)*1.1;let dates=sorted.map(q=>Date.parse(q.date)),start=Math.min(...dates),end=Math.max(...dates);let points=vals.map((v,i)=>[end===start?325:60+(dates[i]-start)/(end-start)*560,105-(v-lo)/(hi-lo)*85]);svg.innerHTML=`<text x="0" y="15" font-size="10" fill="#708274">€${hi.toFixed(2)}/L</text><text x="0" y="108" font-size="10" fill="#708274">€${lo.toFixed(2)}/L</text><path d="M60 110H625" stroke="#dce3dc"/><polyline points="${points.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#24785a" stroke-width="2"/>`+points.map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#24785a"><title>${esc(sorted[i].date)}: €${vals[i].toFixed(3)}/L</title></circle>`).join('');}
document.querySelector('#quotes').addEventListener('click',e=>{if(e.target.dataset.use){let q=quotes.find(q=>q.id===e.target.dataset.use);applyQuote(q);save();showUpgradeDecision()}if(e.target.dataset.delete){quotes=quotes.filter(q=>q.id!==e.target.dataset.delete);save();renderQuotes();toast('Quote removed')}});
document.querySelector('#quoteForm').addEventListener('submit', event => {
  event.preventDefault();
  const litres = Number(document.querySelector('#litres').value);
  const total = Number(document.querySelector('#total').value);
  if (total / litres > 10) {
    toast('Check quote: price exceeds €10 per litre');
    return;
  }
  const quote = {
    id: globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2),
    supplier: document.querySelector('#supplier').value.trim() || 'Unnamed supplier',
    date: document.querySelector('#date').value,
    litres,
    total
  };
  const compare = event.submitter?.value !== 'save';
  quotes.push(quote);
  if (compare) applyQuote(quote);
  save();
  renderQuotes();
  event.target.reset();
  document.querySelector('#date').value = new Date().toLocaleDateString('en-CA');
  if (compare) showUpgradeDecision();
  toast(compare ? 'Quote saved and applied to your home' : 'Quote saved');
});

function applyQuote(quote) {
  state.oil = quote.total / quote.litres;
}

function showUpgradeDecision() {
  fields();
  render();
  document.querySelector('#upgrade-title').focus({ preventScroll: true });
  document.querySelector('#upgrade-decision').scrollIntoView();
}

function renderUpgradeDecision() {
  const years = 15;
  const atZero = calculate({ ...state, oil: 0 });
  const atOne = calculate({ ...state, oil: 1 });
  const current = calculate(state);
  const price = value => `€${value.toFixed(3)}/L`;
  document.querySelector('#upgrade-oil').textContent = `Using delivered oil at ${price(state.oil)}`;
  document.querySelector('#upgrade-options').innerHTML = [1, 4].map(index => {
    const extraCost = state.install[index] + years * (atZero[index] - atZero[0]);
    const litresSaved = years * ((atOne[0] - atZero[0]) - (atOne[index] - atZero[index]));
    const savings = years * (current[0] - current[index]) - state.install[index];
    let threshold;
    if (Math.abs(litresSaved) < 1e-8) {
      threshold = Math.abs(extraCost) < 0.005 ? 'Same cost at every oil price' : 'No oil-price threshold';
    } else {
      threshold = extraCost < 0 ? 'Cheaper even at €0/L' : price(extraCost / litresSaved);
    }
    const result = Math.abs(savings) < 0.5 ? 'About the same cost as keeping oil'
      : `${money(Math.abs(savings))} ${savings > 0 ? 'less' : 'more'} than keeping oil`;
    return `<article><h3>${names[index]}</h3><strong>${threshold}</strong>
      <p>At your oil price: ${result} over 15 years.</p></article>`;
  }).join('');
}
function csv(filename,rows){const content=rows.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');let blob=new Blob(['\ufeff'+content],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
document.querySelector('#exportQuotes').onclick=()=>csv('heatwise-oil-quotes.csv',[['Date','Supplier','Litres','Delivered EUR','EUR per litre'],...quotes.map(q=>[q.date,/^[=+@-]/.test(q.supplier)?"'"+q.supplier:q.supplier,q.litres,q.total,(q.total/q.litres).toFixed(4)])]);document.querySelector('#export').onclick=()=>{let costs=calculate(state);csv('heatwise-comparison.csv',[['Method','Annual useful heat kWh','Annual EUR','Net install EUR','Simple payback years','15-year EUR'],...names.map((n,i)=>[n,state.demand,costs[i].toFixed(2),state.install[i],i===0?'Baseline':costs[0]>costs[i]?(state.install[i]/(costs[0]-costs[i])).toFixed(2):'No saving',(costs[i]*15+state.install[i]).toFixed(2)]),[],['Assumption','Value'],...Object.entries(state).filter(([k])=>k!=='install')])};document.querySelector('#reset').onclick=()=>{state={...defaults,install:defaults.install.slice()};save();fields();render();toast('Illustrative assumptions restored')};document.querySelector('#date').value=new Date().toLocaleDateString('en-CA');fields();render();renderQuotes();

function benchmarkControl(id) {
  const benchmark = benchmarks[id];
  if (!benchmark) return '';
  const [, description, source, url] = benchmark;
  return `<div class="benchmark"><span>${description}</span>
    <a href="${url}" target="_blank" rel="noopener">${source} ↗</a>
    <button type="button" data-benchmark="${id}" aria-label="Apply benchmark for ${id}">Apply benchmark</button></div>`;
}

document.querySelector('#fields').addEventListener('click', event => {
  const id = event.target.dataset.benchmark;
  if (!id) return;
  state[id] = benchmarks[id][0];
  document.querySelector('#f-' + id).value = state[id];
  save();
  render();
  toast('Benchmark applied to this input');
});

function renderOilIndex() {
  const latest = oilIndex.at(-1);
  document.querySelector('#index-latest').textContent =
    `${latest[1].toFixed(1)} in September 2026 · December 2023 = 100`;
  const values = oilIndex.map(([, value]) => value);
  const low = Math.floor(Math.min(...values) / 10) * 10;
  const high = Math.ceil(Math.max(...values) / 10) * 10;
  const y = value => 130 - 110 * (value - low) / (high - low);
  const points = oilIndex.map(([, value], i) =>
    [45 + i * 570 / (oilIndex.length - 1), y(value)]);
  const base = y(100);
  document.querySelector('#oil-index-chart').innerHTML = `
    <path d="M45 ${base}H615" stroke="#a1ada2" stroke-dasharray="4 4"/>
    <text x="6" y="${base + 4}" font-size="12" fill="#50665e">100</text>
    <polyline points="${points.map(point => point.join(',')).join(' ')}"
      fill="none" stroke="#24785a" stroke-width="3"/>
    <text x="45" y="154" font-size="12" fill="#50665e">Dec 2023</text>
    <text x="615" y="154" text-anchor="end" font-size="12" fill="#50665e">Sep 2026</text>`;
}
renderOilIndex();
