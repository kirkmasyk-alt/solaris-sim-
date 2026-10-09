let marketCoins = [
  { symbol: 'SOL', price: 145.20, basePrice: 145.20, sentiment: 0.12, volume: 12000 },
  { symbol: 'BONK', price: 0.000025, basePrice: 0.000025, sentiment: 0.18, volume: 9000 },
  { symbol: 'JTO', price: 1.84, basePrice: 1.84, sentiment: 0.14, volume: 7800 },
  { symbol: 'RAY', price: 3.46, basePrice: 3.46, sentiment: 0.1, volume: 7000 },
  { symbol: 'WIF', price: 1.32, basePrice: 1.32, sentiment: 0.09, volume: 6600 }
];

let agentDefs = [
  { id: 'finance', name: 'FIN_BOT v2', role: 'Portfolio Manager', risk: 'Low', color: '#38bdf8', wins: 0, losses: 0, pnl: 0, history: [], strategyDirective: 'Focus on stable capital preservation and liquidity allocation.' },
  { id: 'risk', name: 'RISK_CORE', role: 'Exposure Control', risk: 'Med', color: '#f59e0b', wins: 0, losses: 0, pnl: 0, history: [], strategyDirective: 'Monitor volatility spikes and enforce strict drawdown limits.' },
  { id: 'trader', name: 'ALPHA_X', role: 'Execution Matrix', risk: 'High', color: '#ef4444', wins: 0, losses: 0, pnl: 0, history: [], strategyDirective: 'Hunt high-momentum entries and aggressive upside breakouts.' },
  { id: 'advisor', name: 'MACRO_9', role: 'Strategy Planner', risk: 'Low', color: '#a855f7', wins: 0, losses: 0, pnl: 0, history: [], strategyDirective: 'Analyze macro news events and overall token sentiment flows.' },
  { id: 'cfo', name: 'CFO_UNIT', role: 'Capital Authority', risk: 'Low', color: '#22c55e', wins: 0, losses: 0, pnl: 0, history: [], strategyDirective: 'Maximize long-term treasury compounding and risk-adjusted yield.' }
];

let state = {
  cash: 10000,
  positions: { SOL: 0, BONK: 0, JTO: 0, RAY: 0, WIF: 0 },
  avgBuyPrice: { SOL: 0, BONK: 0, JTO: 0, RAY: 0, WIF: 0 },
  baseline: 10000,
  realizedPnl: 0,
  history: ['Fresh session initialized with $10,000 baseline.'],
  councilFeed: [
    { sender: 'SYSTEM', text: 'Table session active. Agents are seated and awaiting Gemini neural link...', color: '#38bdf8', time: new Date().toLocaleTimeString() }
  ],
  latestConsensus: 'Awaiting signal',
  latestNews: 'Standby',
  newsFeed: [{ title: 'System Online', detail: 'Stable price matrix active.', tone: 'positive' }],
  agentState: {},
  lastTimestamp: Date.now()
};

const localTableBanter = [
  "Look, if we don't buy into this dip right now, Alpha X is going to gloat all night.",
  "Risk Core, stop hyperventilating over a 1% drawdown. We have plenty of dry powder.",
  "Macro 9 called the sentiment shift correctly, but our entry price on SOL is too heavy.",
  "CFO Unit is glaring at us because I touched the cash reserve again. Worth it.",
  "Are we seriously staring at BONK order books while SOL is screaming upward?",
  "Let's rotate some capital out of dead weight and fund a proper breakout trade.",
  "If Risk Core blocks this trade one more time, I'm bypassing the safety matrix.",
  "Volume is pooling into JTO. If we miss this wave, don't blame my portfolio math."
];

function loadFromStorage() {
  const saved = localStorage.getItem('solaris_sim_state_v17');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state.cash = parsed.cash ?? state.cash;
      state.positions = parsed.positions ?? state.positions;
      state.avgBuyPrice = parsed.avgBuyPrice ?? state.avgBuyPrice;
      state.baseline = parsed.baseline ?? state.baseline;
      state.realizedPnl = parsed.realizedPnl ?? state.realizedPnl;
      state.history = parsed.history ?? state.history;
      if (parsed.councilFeed && parsed.councilFeed.length > 0) {
        state.councilFeed = parsed.councilFeed;
      }
      state.newsFeed = parsed.newsFeed ?? state.newsFeed;
      if (parsed.marketCoins) {
        parsed.marketCoins.forEach(savedCoin => {
          const target = marketCoins.find(c => c.symbol === savedCoin.symbol);
          if (target) target.price = savedCoin.price;
        });
      }
      if (parsed.agentDefs) {
        parsed.agentDefs.forEach(savedAgent => {
          const target = agentDefs.find(a => a.id === savedAgent.id);
          if (target) {
            target.wins = savedAgent.wins || 0;
            target.losses = savedAgent.losses || 0;
            target.pnl = savedAgent.pnl || 0;
            target.history = savedAgent.history || [];
            target.strategyDirective = savedAgent.strategyDirective || target.strategyDirective;
          }
        });
      }
    } catch (e) {
      console.error("Error loading saved state", e);
    }
  }
  checkApiKeyStatus();
  renderCouncilFeed();
}

function saveToStorage() {
  state.lastTimestamp = Date.now();
  const payload = {
    cash: state.cash,
    positions: state.positions,
    avgBuyPrice: state.avgBuyPrice,
    baseline: state.baseline,
    realizedPnl: state.realizedPnl,
    history: state.history,
    councilFeed: state.councilFeed,
    newsFeed: state.newsFeed,
    marketCoins: marketCoins.map(c => ({ symbol: c.symbol, price: c.price })),
    agentDefs: agentDefs.map(a => ({ id: a.id, wins: a.wins, losses: a.losses, pnl: a.pnl, history: a.history, strategyDirective: a.strategyDirective })),
    lastTimestamp: state.lastTimestamp
  };
  localStorage.setItem('solaris_sim_state_v17', JSON.stringify(payload));
}

function resetTreasury() {
  if (confirm("Reset treasury back to $10,000 fresh slate?")) {
    localStorage.removeItem('solaris_sim_state_v17');
    location.reload();
  }
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
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

function addHistory(message) {
  state.history.unshift(message);
  state.history = state.history.slice(0, 10);
}

function addCouncilMessage(senderName, text, senderColor) {
  state.councilFeed.unshift({ sender: senderName, text: text, color: senderColor || '#38bdf8', time: new Date().toLocaleTimeString() });
  state.councilFeed = state.councilFeed.slice(0, 30);
  renderCouncilFeed();
}

function generateNewsEvent() {
  const events = [
    { title: 'Network Surge', detail: 'Transaction throughput spikes across validator nodes.', tone: 'positive' },
    { title: 'Liquidity Inflow', detail: 'Institutional capital routing into decentralized pools.', tone: 'positive' },
    { title: 'Minor Correction', detail: 'Short-term leveraged positions liquidated in order books.', tone: 'caution' }
  ];
  const ev = randomFrom(events);
  state.newsFeed.unshift({ title: ev.title, detail: ev.detail, tone: ev.tone });
  state.newsFeed = state.newsFeed.slice(0, 5);
  state.latestNews = ev.title;
}

function updateMarketStats() {
  const sol = marketCoins.find(c => c.symbol === 'SOL');
  document.getElementById('sol-price').textContent = fmtCurrency(sol.price);
  
  const top = [...marketCoins].sort((a, b) => b.sentiment - a.sentiment)[0];
  document.getElementById('leading-coin').textContent = top.symbol;
  document.getElementById('sentiment-level').textContent = top.sentiment > 0.15 ? 'Bullish' : 'Neutral';
  
  const totalPositions = Object.values(state.positions).filter(v => v > 0).length;
  const netWorth = getNetWorth();
  const totalPnl = netWorth - state.baseline;
  const unrealized = getUnrealizedPnl();

  document.getElementById('position-count').textContent = totalPositions;
  document.getElementById('asset-cash').textContent = fmtCurrency(state.cash);
  document.getElementById('asset-sol').textContent = `${(state.positions.SOL || 0).toFixed(2)} SOL`;
  document.getElementById('asset-alt').textContent = String(totalPositions);
  document.getElementById('holders-count').textContent = fmtCurrency(state.cash);
  document.getElementById('whales-count').textContent = `${marketCoins.length} tokens`;
  
  document.getElementById('realized-pnl').textContent = `${state.realizedPnl >= 0 ? '+' : '-'}${fmtCurrency(Math.abs(state.realizedPnl))}`;
  document.getElementById('unrealized-pnl').textContent = `${unrealized >= 0 ? '+' : '-'}${fmtCurrency(Math.abs(unrealized))}`;
  document.getElementById('net-worth').textContent = fmtCurrency(netWorth);
  
  const pnlTotalEl = document.getElementById('pnl-total');
  pnlTotalEl.textContent = `${totalPnl >= 0 ? '+' : '-'}${fmtCurrency(Math.abs(totalPnl))}`;
  pnlTotalEl.className = `stat-value ${totalPnl >= 0 ? 'green' : 'red'}`;
  
  document.getElementById('cash-balance').textContent = fmtCurrency(state.cash);
  buildMarketNarrative();
  renderNews();
}

function applyAgentDecision(agent, action, targetCoinSymbol, speechText, newStrategyDirective) {
  const coin = marketCoins.find(c => c.symbol === targetCoinSymbol) || marketCoins[0];
  if (newStrategyDirective && newStrategyDirective.length > 5) agent.strategyDirective = newStrategyDirective;

  if (action === 'buy') {
    const cost = coin.price * 2;
    if (state.cash >= cost) {
      state.cash -= cost;
      const currentQty = state.positions[coin.symbol] || 0;
      const currentAvg = state.avgBuyPrice[coin.symbol] || coin.price;
      state.avgBuyPrice[coin.symbol] = ((currentQty * currentAvg) + cost) / (currentQty + 2);
      state.positions[coin.symbol] = currentQty + 2;
      
      state.agentState[agent.id] = { action: 'buy', coin: coin.symbol, speech: speechText };
      const logMsg = `BOUGHT 2 ${coin.symbol} at ${fmtCurrency(coin.price)}`;
      agent.history.unshift(logMsg);
      addHistory(`[${agent.name}] ${logMsg}`);
      log(`[${agent.name}] BUY ${coin.symbol}`);
    } else {
      state.agentState[agent.id] = { action: 'hold', coin: coin.symbol, speech: `HOLD // Insufficient cash for ${coin.symbol}.` };
    }
  } else if (action === 'sell') {
    const qty = state.positions[coin.symbol] || 0;
    if (qty > 0) {
      const sellQty = Math.min(2, qty);
      const revenue = sellQty * coin.price;
      const costBasis = sellQty * state.avgBuyPrice[coin.symbol];
      const pnl = revenue - costBasis;
      
      state.cash += revenue;
      state.positions[coin.symbol] -= sellQty;
      state.realizedPnl += pnl;
      agent.pnl += pnl;

      if (pnl >= 0) agent.wins++;
      else agent.losses++;

      state.agentState[agent.id] = { action: 'sell', coin: coin.symbol, speech: speechText };
      const logMsg = `SOLD ${sellQty} ${coin.symbol} [P&L: ${fmtCurrency(pnl)}]`;
      agent.history.unshift(logMsg);
      addHistory(`[${agent.name}] ${logMsg}`);
      log(`[${agent.name}] SELL ${coin.symbol}`);
    } else {
      state.agentState[agent.id] = { action: 'hold', coin: coin.symbol, speech: `HOLD // No inventory on ${coin.symbol}.` };
    }
  } else {
    state.agentState[agent.id] = { action: 'hold', coin: coin.symbol, speech: speechText };
  }

  state.latestConsensus = `${agent.name} -> ${action.toUpperCase()} ${coin.symbol}`;
  addCouncilMessage(agent.name, speechText, agent.color);
}

async function fetchGeminiDecision(agent) {
  const apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) {
    log(`[AI Status] No API Key saved. Using local banter.`);
    return false;
  }

  try {
    const marketSnapshot = {
      cash: state.cash,
      netWorth: getNetWorth(),
      coins: marketCoins.map(c => ({ symbol: c.symbol, price: c.price, sentiment: c.sentiment })),
      positions: state.positions,
      latestNews: state.latestNews
    };

    const tableTranscript = state.councilFeed.slice(0, 4).map(m => `${m.sender}: "${m.text}"`).join('\n');

    const prompt = `You are ${agent.name}, a ${agent.role} with a ${agent.risk} risk profile sitting around a strategy table in an autonomous crypto treasury control room.
    Other agents: FIN_BOT v2, RISK_CORE, ALPHA_X, MACRO_9, CFO_UNIT.
    Your strategy directive: "${agent.strategyDirective}"
    Your score: Wins: ${agent.wins}, Losses: ${agent.losses}, P&L: $${agent.pnl.toFixed(2)}.

    Recent Table Discussion:
    ${tableTranscript}

    Market Snapshot & News: ${JSON.stringify(marketSnapshot)}.

    Instructions:
    1. Talk like a real person sitting at the table debating strategy. Directly address or roast another agent's recent comments.
    2. Decide whether to 'buy', 'sell', or 'hold' a coin from [SOL, BONK, JTO, RAY, WIF].
    3. Keep your spoken table dialogue punchy, conversational, and opinionated.
    4. Optimize your strategy directive slightly based on your performance.

    Return ONLY valid JSON format:
    {
      "action": "buy" or "sell" or "hold",
      "coin": "SYMBOL",
      "speech": "Your conversational table dialogue arguing or agreeing with the team",
      "newStrategyDirective": "Your updated strategy focus"
    }`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const data = await response.json();
    
    if (data.error) {
      log(`[AI ERROR] Gemini API rejected key: ${data.error.message}`);
      return false;
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (rawText) {
      // Clean potential markdown code blocks if the model outputs them
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      log(`[AI SUCCESS] Gemini live response generated for ${agent.name}!`);
      applyAgentDecision(agent, parsed.action, parsed.coin, parsed.speech, parsed.newStrategyDirective);
      return true;
    }
  } catch (err) {
    log(`[AI EXCEPTION] Parse/Network error: ${err.message}`);
  }
  return false;
}

async function processMarketLoop() {
  marketCoins.forEach(coin => {
    const fluctuation = (Math.random() - 0.49) * 0.015;
    coin.price = Math.max(0.000001, coin.price * (1 + fluctuation));
    coin.sentiment = Math.min(0.8, Math.max(-0.8, coin.sentiment + (Math.random() - 0.5) * 0.1));
  });

  const activeAgent = randomFrom(agentDefs);
  const aiSuccess = await fetchGeminiDecision(activeAgent);

  if (!aiSuccess) {
    const coin = randomFrom(marketCoins);
    const action = randomFrom(['buy', 'sell', 'hold']);
    const fallbackSpeech = randomFrom(localTableBanter);
    
    applyAgentDecision(activeAgent, action, coin.symbol, fallbackSpeech, activeAgent.strategyDirective);
  }

  if (Math.random() > 0.6) generateNewsEvent();

  updateMarketStats();
  renderWarRoom();
  saveToStorage();
}

window.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  updateMarketStats();
  renderWarRoom();
  initTabs();
  setInterval(processMarketLoop, 7000);
});
