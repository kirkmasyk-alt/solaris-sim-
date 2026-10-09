function openApiKeyModal() {
  document.getElementById('api-modal').classList.add('open');
  const savedKey = localStorage.getItem('gemini_api_key') || '';
  document.getElementById('api-key-input').value = savedKey;
}

function closeApiKeyModal() {
  document.getElementById('api-modal').classList.remove('open');
}

function saveApiKey() {
  const key = document.getElementById('api-key-input').value.trim();
  if (key) {
    localStorage.setItem('gemini_api_key', key);
    alert("Gemini API key saved securely!");
  } else {
    localStorage.removeItem('gemini_api_key');
    alert("API key removed. Reverting to local telemetry mode.");
  }
  closeApiKeyModal();
  checkApiKeyStatus();
}

function checkApiKeyStatus() {
  const key = localStorage.getItem('gemini_api_key');
  const pill = document.getElementById('ai-status-pill');
  if (key) {
    pill.textContent = "AI: GEMINI LIVE";
    pill.className = "pixel-pill good";
  } else {
    pill.textContent = "AI: Local";
    pill.className = "pixel-pill warn";
  }
}

function openAgentModal(agentId) {
  const agent = agentDefs.find(a => a.id === agentId);
  if (!agent) return;

  const modalContent = document.getElementById('agent-modal-content');
  const totalTrades = agent.wins + agent.losses;
  const winRate = totalTrades > 0 ? ((agent.wins / totalTrades) * 100).toFixed(0) + '%' : '0%';
  
  const historyHtml = agent.history.length > 0 
    ? agent.history.map(h => `<div style="padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.05); font-size:0.75rem;">• ${h}</div>`).join('')
    : '<div style="font-size:0.75rem; color:var(--muted);">No trades executed yet in this session.</div>';

  modalContent.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <h3>${agent.name} // Diagnostics</h3>
      <span class="pixel-pill" style="color:${agent.color}; border-color:${agent.color};">${agent.risk} Risk</span>
    </div>
    <p><strong>Role:</strong> ${agent.role}</p>
    <p><strong>Self-Optimized Strategy Directive:</strong><br><span style="color:var(--cyan); font-style:italic;">"${agent.strategyDirective}"</span></p>
    <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:8px; margin: 12px 0;">
      <div class="mini-metric">Wins <span>${agent.wins}</span></div>
      <div class="mini-metric">Losses <span>${agent.losses}</span></div>
      <div class="mini-metric">Win Rate <span>${winRate}</span></div>
    </div>
    <p><strong>Net Agent P&L:</strong> <span style="color:${agent.pnl >= 0 ? 'var(--green)' : 'var(--red)'}">${agent.pnl >= 0 ? '+' : ''}${fmtCurrency(agent.pnl)}</span></p>
    <h4 style="font-family:'Press Start 2P',monospace; font-size:7px; color:var(--gold); margin: 14px 0 6px; text-transform:uppercase;">Agent Activity Ledger</h4>
    <div style="max-height: 150px; overflow-y: auto; background:#04070d; border:1px solid var(--line); padding:8px;">
      ${historyHtml}
    </div>
    <div class="modal-buttons">
      <button class="action-btn" onclick="closeAgentModal()">Close Menu</button>
    </div>
  `;

  document.getElementById('agent-modal').classList.add('open');
}

function closeAgentModal() {
  document.getElementById('agent-modal').classList.remove('open');
}

function fmtCurrency(value) {
  if (value < 0.001 && value > 0) return `$${value.toFixed(6)}`;
  return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function renderCouncilFeed() {
  const box = document.getElementById('council-feed-box');
  if (!box) return;
  box.innerHTML = state.councilFeed.map(item => `
    <div class="chat-bubble" style="border-left: 3px solid ${item.color};">
      <div class="chat-header-row">
        <span class="chat-sender" style="color: ${item.color};">${item.sender}</span>
        <span class="chat-time">${item.time}</span>
      </div>
      <div class="chat-msg">"${item.text}"</div>
    </div>
  `).join('');
}

function log(message) {
  const term = document.getElementById('terminal-log');
  if (term) {
    term.innerHTML += `<br>[${new Date().toLocaleTimeString()}] ${message}`;
    term.scrollTop = term.scrollHeight;
  }
}

function renderNews() {
  const feed = document.getElementById('news-feed');
  if (!feed) return;
  feed.innerHTML = state.newsFeed.slice(0, 5).map(item => {
    const tone = item.tone === 'positive' ? 'green' : item.tone === 'caution' ? 'gold' : 'cyan';
    return `<div class="news-item"><strong style="color:var(--${tone});">${item.title}</strong><br>${item.detail}</div>`;
  }).join('');
}

function buildMarketNarrative() {
  const best = [...marketCoins].sort((a, b) => (b.price - b.basePrice) - (a.price - a.basePrice))[0];
  const worst = [...marketCoins].sort((a, b) => (a.price - a.basePrice) - (b.price - b.basePrice))[0];
  const leaders = [...marketCoins].sort((a, b) => b.volume - a.volume).slice(0, 3);
  
  const coinLeadersEl = document.getElementById('coin-leaders');
  const marketNarrativeEl = document.getElementById('market-narrative');
  if (coinLeadersEl) coinLeadersEl.innerHTML = leaders.map(coin => `<div>${coin.symbol}: <strong>${fmtCurrency(coin.price)}</strong></div>`).join('');
  if (marketNarrativeEl) marketNarrativeEl.innerHTML = `<div>Top Gainer: <strong>${best.symbol}</strong></div><div>Lagging: <strong>${worst.symbol}</strong></div><div>Active Volume: High</div>`;
}

function renderWarRoom() {
  const container = document.getElementById('war-room-grid');
  if (!container) return;

  container.innerHTML = agentDefs.map(agent => {
    const current = state.agentState[agent.id] || { action: 'hold', coin: 'SOL', speech: 'Waiting for table turn.' };
    const statusClass = current.action === 'buy' ? 'status-buy' : current.action === 'sell' ? 'status-sell' : '';
    const visorColor = current.action === 'buy' ? '#22c55e' : current.action === 'sell' ? '#ef4444' : agent.color;
    const totalTrades = agent.wins + agent.losses;
    const winRate = totalTrades > 0 ? ((agent.wins / totalTrades) * 100).toFixed(0) + '%' : '0%';
    const pnlColor = agent.pnl >= 0 ? 'var(--green)' : 'var(--red)';

    return `
      <div class="ai-agent-card ${statusClass}" onclick="openAgentModal('${agent.id}')">
        <div class="ai-header-flex">
          <div class="ai-portrait">
            <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">
              <svg viewBox="0 0 64 64" width="52" height="52">
                <rect x="16" y="22" width="32" height="26" rx="4" fill="#0f172a" stroke="${agent.color}" stroke-width="2"/>
                <rect x="20" y="27" width="24" height="8" rx="2" fill="${visorColor}"/>
                <circle cx="26" cy="43" r="2" fill="${agent.color}"/>
                <circle cx="38" cy="43" r="2" fill="${agent.color}"/>
                <path d="M28 14 L36 14 L36 22 L28 22 Z" fill="#1e293b" stroke="${agent.color}" stroke-width="1.5"/>
                <line x1="32" y1="8" x2="32" y2="14" stroke="${agent.color}" stroke-width="2"/>
                <circle cx="32" cy="6" r="2" fill="${visorColor}"/>
              </svg>
            </div>
          </div>
          <div class="ai-info">
            <div class="ai-name-row">
              <span class="ai-agent-name">${agent.name}</span>
              <span class="ai-live-badge" style="color: ${current.action === 'buy' ? 'var(--green)' : current.action === 'sell' ? 'var(--red)' : 'var(--gold)'};">${current.action.toUpperCase()}</span>
            </div>
            <p style="font-size:0.65rem; color:var(--muted); margin:0; text-transform:uppercase;">${agent.role} (Tap for Strategy)</p>
            <div class="ai-metrics-row">
              <div class="mini-metric">Win <span>${winRate}</span></div>
              <div class="mini-metric">P&amp;L <span style="color: ${pnlColor}">${agent.pnl >= 0 ? '+' : ''}${fmtCurrency(agent.pnl)}</span></div>
              <div class="mini-metric">Risk <span>${agent.risk}</span></div>
            </div>
          </div>
        </div>
        <div class="game-speech-box">
          <div class="speech-speaker">// TABLE SPEECH // ${agent.name}</div>
          <div class="speech-text">"${current.speech}"</div>
        </div>
      </div>
    `;
  }).join('');
}

function initTabs() {
  const tabs = document.querySelectorAll('.room-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const roomName = tab.dataset.room;
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.room-view').forEach(v => v.classList.remove('active'));
      
      tab.classList.add('active');
      const targetView = document.querySelector(`.room-view[data-room="${roomName}"]`);
      if (targetView) targetView.classList.add('active');
    });
  });
}
