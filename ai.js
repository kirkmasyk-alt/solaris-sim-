let marketCoins = [
  { symbol: 'SOL', price: 145.20, basePrice: 145.20, sentiment: 0.12, volume: 12000 },
  { symbol: 'BONK', price: 0.000025, basePrice: 0.000025, sentiment: 0.18, volume: 9000 },
  { symbol: 'JTO', price: 1.84, basePrice: 1.84, sentiment: 0.14, volume: 7800 },
  { symbol: 'RAY', price: 3.46, basePrice: 3.46, sentiment: 0.1, volume: 7000 },
  { symbol: 'WIF', price: 1.32, basePrice: 1.32, sentiment: 0.09, volume: 6600 }
];

let agentDefs = [
  { id: 'finance', name: 'FIN_BOT v2', role: 'Portfolio Manager', risk: 'Low', color: '#38bdf8', wins: 0, losses: 0, pnl: 0, history: [] },
  { id: 'risk', name: 'RISK_CORE', role: 'Exposure Control', risk: 'Med', color: '#f59e0b', wins: 0, losses: 0, pnl: 0, history: [] },
  { id: 'trader', name: 'ALPHA_X', role: 'Execution Matrix', risk: 'High', color: '#ef4444', wins: 0, losses: 0, pnl: 0, history: [] },
  { id: 'advisor', name: 'MACRO_9', role: 'Strategy Planner', risk: 'Low', color: '#a855f7', wins: 0, losses: 0, pnl: 0, history: [] },
  { id: 'cfo', name: 'CFO_UNIT', role: 'Capital Authority', risk: 'Low', color: '#22c55e', wins: 0, losses: 0, pnl: 0, history: [] }
];

let state = {
  cash: 10000,
  positions: { SOL: 0, BONK: 0, JTO: 0, RAY: 0, WIF: 0 },
  avgBuyPrice: { SOL: 0, BONK: 0, JTO: 0, RAY: 0, WIF: 0 },
  baseline: 10000,
  realizedPnl: 0,
  history: ['High-stakes treasury matrix initialized.'],
  councilFeed: [],
  agentState: {}
};

const bigMoneyBanter = [
  "Deploying 40% of cash reserves into this SOL breakout. Let's ride.",
  "Risk Core is screaming, but ALPHA_X is heavy-loading WIF right now.",
  "That's a massive liquidity sweep. Liquidating half our JTO stack to lock in gains.",
  "If this macro thesis hits, this position is going to print thousands.",
  "Scaling up our exposure. We aren't here to make pennies."
];

function loadFromStorage() {
  const saved = localStorage.getItem('solaris_sim_state_v19');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state.cash = parsed.cash ?? state.cash;
      state.positions = parsed.positions ?? state.positions;
      state.avgBuyPrice = parsed.avgBuyPrice ?? state.avgBuyPrice;
      state.baseline = parsed.baseline ?? state.baseline;
      state.realizedPnl = parsed.realizedPnl ?? state.realizedPnl;
      state.councilFeed = parsed.councilFeed ?? state.councilFeed;
      state.agentState = parsed.agentState ?? state.agentState;
    } catch (e) {
      console.error(e);
    }
  }
  renderCouncilFeed();
  renderWarRoom();
}

function saveToStorage() {
  localStorage.setItem('solaris_sim_state_v19', JSON.stringify({
    cash: state.cash,
    positions: state.positions,
    avgBuyPrice: state.avgBuyPrice,
    baseline: state.baseline,
    realizedPnl: state.realizedPnl,
    councilFeed: state.councilFeed,
    agentState: state.agentState
  }));
}

function getNetWorth() {
  let total = state.cash;
  marketCoins.forEach(coin => {
    total += (state.positions[coin.symbol] || 0) * coin.price;
  });
  return total;
}

function renderWarRoom() {
  const container = document.getElementById('war-room-container');
  if (!container) return;
  
  container.innerHTML = agentDefs.map(agent => {
    const lastAction = state.agentState[agent.id] || { action: 'hold', coin: 'SOL', speech: 'Scanning order books for heavy volume.' };
    return `
      <div class="agent-card" style="border-color: ${agent.color}; margin-bottom: 15px; padding: 12px; background: rgba(0,0,0,0.4);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: ${agent.color};">${agent.name}</strong>
          <span style="font-size: 10px; background: #111; padding: 2px 6px; border: 1px solid ${agent.color};">${lastAction.action.toUpperCase()}</span>
        </div>
        <div style="font-size: 11px; color: #888; margin-top: 4px;">${agent.role} (${agent.risk} Risk)</div>
        <div style="margin-top: 8px; font-size: 12px; font-style: italic; color: #ddd;">"${lastAction.speech}"</div>
      </div>
    `;
  }).join('');
}

function processMarketLoop() {
  marketCoins.forEach(coin => {
    const fluctuation = (Math.random() - 0.48) * 0.03;
    coin.price = Math.max(0.000001, coin.price * (1 + fluctuation));
  });

  const agent = agentDefs[Math.floor(Math.random() * agentDefs.length)];
  const coin = marketCoins[Math.floor(Math.random() * marketCoins.length)];
  const action = ['buy', 'buy', 'sell', 'hold'][Math.floor(Math.random() * 4)];
  const speech = bigMoneyBanter[Math.floor(Math.random() * bigMoneyBanter.length)];

  if (action === 'buy') {
    const riskMultiplier = agent.risk === 'High' ? 0.4 : agent.risk === 'Med' ? 0.25 : 0.15;
    const allocation = state.cash * riskMultiplier;
    
    if (allocation > 10 && state.cash >= allocation) {
      state.cash -= allocation;
      const qtyPurchased = allocation / coin.price;
      const currentQty = state.positions[coin.symbol] || 0;
      const currentAvg = state.avgBuyPrice[coin.symbol] || coin.price;
      
      state.avgBuyPrice[coin.symbol] = currentQty > 0 ? ((currentQty * currentAvg) + allocation) / (currentQty + qtyPurchased) : coin.price;
      state.positions[coin.symbol] = currentQty + qtyPurchased;
      agent.wins++;
    }
  } else if (action === 'sell') {
    const currentQty = state.positions[coin.symbol] || 0;
    if (currentQty > 0) {
      const sellQty = currentQty * (agent.risk === 'High' ? 0.8 : 0.4);
      const revenue = sellQty * coin.price;
      const costBasis = sellQty * state.avgBuyPrice[coin.symbol];
      const tradePnl = revenue - costBasis;

      state.cash += revenue;
      state.positions[coin.symbol] -= sellQty;
      state.realizedPnl += tradePnl;
      agent.pnl += tradePnl;

      if (tradePnl >= 0) agent.wins++;
      else agent.losses++;
    }
  }

  state.agentState[agent.id] = { action, coin: coin.symbol, speech };

  state.councilFeed.unshift({
    sender: agent.name,
    text: speech,
    color: agent.color,
    time: new Date().toLocaleTimeString()
  });
  state.councilFeed = state.councilFeed.slice(0, 20);

  updateMarketStats();
  renderCouncilFeed();
  renderWarRoom();
  saveToStorage();
}

function updateMarketStats() {
  const sol = marketCoins.find(c => c.symbol === 'SOL');
  if (document.getElementById('sol-price')) document.getElementById('sol-price').textContent = fmtCurrency(sol.price);
  if (document.getElementById('net-worth')) document.getElementById('net-worth').textContent = fmtCurrency(getNetWorth());
  if (document.getElementById('cash-balance')) document.getElementById('cash-balance').textContent = fmtCurrency(state.cash);
  if (document.getElementById('realized-pnl')) document.getElementById('realized-pnl').textContent = fmtCurrency(state.realizedPnl);
  if (document.getElementById('position-count')) {
    document.getElementById('position-count').textContent = Object.values(state.positions).filter(v => v > 0.01).length;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  updateMarketStats();
  initTabs();
  setInterval(processMarketLoop, 7000);
});
