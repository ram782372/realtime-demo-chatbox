let currentActiveProtocol = 'polling';

// Engine starter lifecycle hook
window.addEventListener('DOMContentLoaded', () => {
  startHTTPPolling(); // Default load routine engine
});

function switchProtocol(protocolName) {
  currentActiveProtocol = protocolName;
  
  // Tab elements UI update
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  const targetIndex = ['polling', 'long-polling', 'sse', 'websocket'].indexOf(protocolName);
  document.querySelectorAll('.tab-btn')[targetIndex].classList.add('active');
  
  document.getElementById('active-protocol-name').innerText = protocolName.toUpperCase();

  // Active protocol router engine execution
  if (protocolName === 'polling') startHTTPPolling();
  if (protocolName === 'long-polling') startLongPolling();
  if (protocolName === 'sse') startSSE();
  if (protocolName === 'websocket') startWebSocketProtocol();
}

function stopAllProtocols() {
  stopHTTPPolling();
  stopLongPolling();
  stopSSE();
  stopWebSocketProtocol();
  updateStatusDisplay('Offline', 'status-disconnected');
}

function updateStatusDisplay(text, cssClass) {
  const statusEl = document.getElementById('connection-status');
  statusEl.innerText = text;
  statusEl.className = cssClass;
}

function appendMessageUI(user, content, timestamp) {
  const displayArea = document.getElementById('messages-display');
  const dateStr = new Date(timestamp).toLocaleTimeString();
  
  const msgDiv = document.createElement('div');
  msgDiv.className = 'msg-item';
  msgDiv.innerHTML = `<span class="time">${dateStr}</span><strong>${user}:</strong> ${content}`;
  
  displayArea.appendChild(msgDiv);
  displayArea.scrollTop = displayArea.scrollHeight; // Auto-scroll to view bottom
}

// User dynamic action triggering message pipelines
async function triggerMessageSend() {
  const inputEl = document.getElementById('message-input');
  const userEl = document.getElementById('username');
  const text = inputEl.value.trim();
  if (!text) return;

  // Agar current channel WEBSOCKET hai, toh direct channel frames pipeline se bhejenge
  if (currentActiveProtocol === 'websocket' && wsWrapperInstance) {
    const success = wsWrapperInstance.sendRaw({
      type: 'chat',
      user: userEl.value,
      content: text
    });
    if (success) inputEl.value = '';
    return;
  }

  // Baki HTTP fallbacks (Polling, Long Polling, SSE) ke liye centralized HTTP router pipe push method
  try {
    const response = await fetch('/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: userEl.value, content: text })
    });
    if (response.ok) {
      inputEl.value = '';
    }
  } catch (err) {
    console.error('Failed pushing payload message:', err);
  }
}
