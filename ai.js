let marketCoins = [
  { symbol: 'SOL', price: 145.20, basePrice: 145.20, sentiment: 0.12, volume: 12000, change5m: 0.5, change1h: 2.1, liquidity: 150000, volumeH1: 25000, buysH1: 120, sellsH1: 80 },
  { symbol: 'BONK', price: 0.000025, basePrice: 0.000025, sentiment: 0.18, volume: 9000, change5m: -0.8, change1h: 1.5, liquidity: 80000, volumeH1: 18000, buysH1: 95, sellsH1: 70 },
  { symbol: 'JTO', price: 1.84, basePrice: 1.84, sentiment: 0.14, volume: 7800, change5m: 1.2, change1h: 4.2, liquidity: 60000, volumeH1: 14000, buysH1: 80, sellsH1: 45 },
  { symbol: 'RAY', price: 3.46, basePrice: 3.46, sentiment: 0.1, volume: 7000, change5m: -0.2, change1h: 0.8, liquidity: 90000, volumeH1: 12000, buysH1: 60, sellsH1: 55 },
  { symbol: 'WIF', price: 1.32, basePrice: 1.32, sentiment: 0.09, volume: 6600, change5m: 2.4, change1h: 6.5, liquidity: 110000, volumeH1: 22000, buysH1: 150, sellsH1: 90 }
];

let agentDefs = [
  { id: 'finance', name: 'FIN_BOT v2', role: 'Portfolio Manager', risk: 'Low', color: '#38bdf8', wins: 0, losses: 0, pnl: 0 },
  { id: 'risk', name: 'RISK_CORE', role: 'Exposure Control', risk: 'Med', color: '#f59e0b', wins: 0, losses: 0, pnl: 0 },
  { id: 'trader', name: 'ALPHA_X', role: 'Execution Matrix', risk: 'High', color: '#ef4444', wins: 0, losses: 0, pnl: 0 },
  { id: 'advisor', name: 'MACRO_9', role: 'Strategy Planner', risk: 'Low', color: '#a855f7', wins: 0, losses: 0, pnl: 0 },
  { id: 'cfo', name: 'CFO_UNIT', role: 'Capital Authority', risk: 'Low', color: '#22c55e', wins: 0, losses: 0, pnl: 0 }
];

let state = {
  cash: 10000,
  positions: { SOL: 0, BONK: 0, JTO: 0, RAY: 0, WIF: 0 },
  avgBuyPrice: { SOL: 0, BONK: 0, JTO: 0, RAY: 0, WIF: 0 },
  baseline: 10000,
  realizedPnl: 0,
  councilFeed: [],
  agentState: {},
  archive: {}
};

const bigMoneyBanter = [
  "Deploying 40% of cash reserves into this SOL breakout. Let's ride.",
  "Risk Core is screaming, but ALPHA_X is heavy-loading WIF right now.",
  "That's a massive liquidity sweep. Liquidating half our stack to lock in gains.",
  "If this macro thesis hits, this position is going to print thousands.",
  "Scaling up our exposure. We aren't here to make pennies."
];

// AI Intelligence: Teach the bot the difference between a DUMP and a HEALTHY DIP
function classifyDipOrDump(coin) {
  const buys = coin.buysH1 || 0;
  const sells = coin.sellsH1 || 0;
  const totalTx = Math.max(1, buys + sells);
  const buyRatio = buys / totalTx;
  const turnover = coin.liquidity > 0 ? (coin.volumeH1 / coin.liquidity) : 0;

  if ((coin.change5m || 0) < 0) {
    if (buyRatio < 0.45 || turnover < 0.1) {
      return 'DUMP'; // Structural breakdown, exit or avoid
    }
    if (buyRatio >= 0.50 && turnover >= 0.15) {
      return 'HEALTHY DIP'; // Accumulation zone, buy the dip
    }
  }
  return 'STABLE';
}

// Continuous Bench Scanner & Pump Recovery Unbencher
function checkBenchedPumpRecovery(coin) {
  const now = Date.now();
  const archivedEntry = state.archive[coin.symbol];
  
  if (archivedEntry && archivedEntry.until > now) {
    if ((coin.change1h || 0) > 4.0 || (coin.change5m || 0) > 1.5) {
      delete state.archive[coin.symbol];
      return false; // Unbenched early due to pump
    }
    return true; // Still benched
  }
  return false;
}

function loadFromStorage() {
  const saved = localStorage.getItem('solaris_sim_state_v20');
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
      state.archive = parsed.archive ?? state.archive;
    } catch (e) {
      console.error(e);
    }
  }
  if (typeof renderCouncilFeed === 'function') renderCouncilFeed();
  if (typeof renderWarRoom === 'function') renderWarRoom();
}

function saveToStorage() {
  localStorage.setItem('solaris_sim_state_v20', JSON.stringify(state));
}

function getNetWorth() {
  let total = state.cash;
  marketCoins.forEach(coin => {
    total += (state.positions[coin.symbol] || 0) * coin.price;
  });
  return total;
}

function renderWarRoom() {
  let container = document.getElementById('war-room-container');
  if (!container) {
    const warRoomTab = document.getElementById('war-room') || document.querySelector('.war-room-panel');
    if (warRoomTab) {
      container = document.createElement('div');
      container.id = 'war-room-container';
      warRoomTab.appendChild(container);
    } else {
      return;
    }
  }
  
  container.innerHTML = agentDefs.map(agent => {
    const lastAction = state.agentState[agent.id] || { action: 'HOLD', coin: 'SOL', speech: 'Scanning order books.' };
    return `
      <div class="agent-card" style="border: 1px solid ${agent.color}; margin-bottom: 12px; padding: 10px; background: rgba(0,0,0,0.6); border-radius: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: ${agent.color}; font-size: 13px;">${agent.name}</strong>
          <span style="font-size: 10px; background: #111; padding: 2px 6px; border: 1px solid ${agent.color}; color: #fff;">${(lastAction.action || 'HOLD').toUpperCase()}</span>
        </div>
        <div style="font-size: 10px; color: #aaa; margin-top: 2px;">${agent.role} | Risk: ${agent.risk}</div>
        <div style="margin-top: 6px; font-size: 11px; font-style: italic; color: #ddd;">"${lastAction.speech}"</div>
      </div>
    `;
  }).join('');
}

function processMarketLoop() {
  marketCoins.forEach(coin => {
    const fluctuation = (Math.random() - 0.47) * 0.04;
    coin.price = Math.max(0.000001, coin.price * (1 + fluctuation));
    coin.change5m += (Math.random() - 0.5) * 0.4;
  });

  const agent = agentDefs[Math.floor(Math.random() * agentDefs.length)];
  const coin = marketCoins[Math.floor(Math.random() * marketCoins.length)];
  
  // Apply Dip vs Dump classification logic to influence trading decision
  const sentiment = classifyDipOrDump(coin);
  let action = Math.random() > 0.4 ? 'buy' : 'sell';
  
  if (sentiment === 'HEALTHY DIP') {
    action = 'buy'; // AI learns to accumulate on healthy dips instead of selling
  } else if (sentiment === 'DUMP') {
    action = 'sell'; // AI sells on structural dumps
  }

  const speech = bigMoneyBanter[Math.floor(Math.random() * bigMoneyBanter.length)];

  if (action === 'buy' && state.cash > 500) {
    const allocation = state.cash * 0.3;
    state.cash -= allocation;
    const qtyPurchased = allocation / coin.price;
    const currentQty = state.positions[coin.symbol] || 0;
    const currentAvg = state.avgBuyPrice[coin.symbol] || coin.price;
    
    state.avgBuyPrice[coin.symbol] = currentQty > 0 ? ((currentQty * currentAvg) + allocation) / (currentQty + qtyPurchased) : coin.price;
    state.positions[coin.symbol] = currentQty + qtyPurchased;
  } else {
    const currentQty = state.positions[coin.symbol] || 0;
    if (currentQty > 0) {
      const sellQty = currentQty * 0.5;
      const revenue = sellQty * coin.price;
      const costBasis = sellQty * state.avgBuyPrice[coin.symbol];
      const tradePnl = revenue - costBasis;

      state.cash += revenue;
      state.positions[coin.symbol] -= sellQty;
      state.realizedPnl += tradePnl;
      agent.pnl += tradePnl;
    }
  }

  state.agentState[agent.id] = { action, coin: coin.symbol, speech };

  state.councilFeed.unshift({
    sender: agent.name,
    text: `[${sentiment}] ${speech}`,
    color: agent.color,
    time: new Date().toLocaleTimeString()
  });
  state.councilFeed = state.councilFeed.slice(0, 20);

  updateMarketStats();
  if (typeof renderCouncilFeed === 'function') renderCouncilFeed();
  renderWarRoom();
  saveToStorage();
}

function updateMarketStats() {
  const sol = marketCoins.find(c => c.symbol === 'SOL');
  if (document.getElementById('sol-price') && sol) document.getElementById('sol-price').textContent = sol.price.toFixed(2);
  if (document.getElementById('net-worth')) document.getElementById('net-worth').textContent = getNetWorth().toFixed(2);
  if (document.getElementById('cash-balance')) document.getElementById('cash-balance').textContent = state.cash.toFixed(2);
  if (document.getElementById('realized-pnl')) document.getElementById('realized-pnl').textContent = state.realizedPnl.toFixed(2);
  if (document.getElementById('position-count')) {
    document.getElementById('position-count').textContent = Object.values(state.positions).filter(v => v > 0.01).length;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  updateMarketStats();
  if (typeof initTabs === 'function') initTabs();
  setInterval(processMarketLoop, 5000);
});
