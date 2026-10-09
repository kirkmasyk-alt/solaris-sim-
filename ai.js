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
  history: ['System online.'],
  councilFeed: [],
  latestConsensus: 'Awaiting signal',
  latestNews: 'Normal operations',
  newsFeed: []
};

const banterPool = [
  "I'm grabbing 2 units of WIF here before momentum runs away.",
  "We need to trim our SOL stack to protect cash reserves.",
  "Let's keep eyes on JTO. Order books are tightening up.",
  "Risk Core is being too conservative on this dip."
];

function loadFromStorage() {
  const saved = localStorage.getItem('solaris_sim_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state.cash = parsed.cash ?? state.cash;
      state.positions = parsed.positions ?? state.positions;
      state.avgBuyPrice = parsed.avgBuyPrice ?? state.avgBuyPrice;
      state.baseline = parsed.baseline ?? state.baseline;
      state.realizedPnl = parsed.realizedPnl ?? state.realizedPnl;
      state.councilFeed = parsed.councilFeed ?? state.councilFeed;
    } catch (e) {
      console.error(e);
    }
  }
  renderCouncilFeed();
}

function saveToStorage() {
  localStorage.setItem('solaris_sim_state', JSON.stringify({
    cash: state.cash,
    positions: state.positions,
    avgBuyPrice: state.avgBuyPrice,
    baseline: state.baseline,
    realizedPnl: state.realizedPnl,
    councilFeed: state.councilFeed
  }));
}

function getNetWorth() {
  let total = state.cash;
  marketCoins.forEach(coin => {
    total += (state.positions[coin.symbol] || 0) * coin.price;
  });
  return total;
}

function getUnrealizedPnl() {
  let unrealized = 0;
  marketCoins.forEach(coin => {
    const qty = state.positions[coin.symbol] || 0;
    if (qty > 0) unrealized += qty * (coin.price - state.avgBuyPrice[coin.symbol]);
  });
  return unrealized;
}

async function runAgentTurn() {
  const agent = agentDefs[Math.floor(Math.random() * agentDefs.length)];
  const coin = marketCoins[Math.floor(Math.random() * marketCoins.length)];
  const action = ['buy', 'sell', 'hold'][Math.floor(Math.random() * 3)];
  const speech = banterPool[Math.floor(Math.random() * banterPool.length)];

  if (action === 'buy' && state.cash >= coin.price * 2) {
    state.cash -= coin.price * 2;
    state.positions[coin.symbol] = (state.positions[coin.symbol] || 0) + 2;
    state.avgBuyPrice[coin.symbol] = coin.price;
  } else if (action === 'sell' && (state.positions[coin.symbol] || 0) >= 2) {
    state.positions[coin.symbol] -= 2;
    state.cash += coin.price * 2;
    state.realizedPnl += coin.price * 2 * 0.05;
  }

  state.councilFeed.unshift({
    sender: agent.name,
    text: speech,
    color: agent.color,
    time: new Date().toLocaleTimeString()
  });
  state.councilFeed = state.councilFeed.slice(0, 20);

  updateMarketStats();
  renderCouncilFeed();
  saveToStorage();
}

function updateMarketStats() {
  const sol = marketCoins.find(c => c.symbol === 'SOL');
  if (document.getElementById('sol-price')) document.getElementById('sol-price').textContent = fmtCurrency(sol.price);
  if (document.getElementById('net-worth')) document.getElementById('net-worth').textContent = fmtCurrency(getNetWorth());
  if (document.getElementById('cash-balance')) document.getElementById('cash-balance').textContent = fmtCurrency(state.cash);
  if (document.getElementById('position-count')) {
    document.getElementById('position-count').textContent = Object.values(state.positions).filter(v => v > 0).length;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  updateMarketStats();
  initTabs();
  setInterval(runAgentTurn, 7000);
});
