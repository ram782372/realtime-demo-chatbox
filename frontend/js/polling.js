let pollingIntervalId = null;
let lastPollingTimestamp = 0;

function startHTTPPolling() {
  stopAllProtocols();
  updateStatusDisplay('Active', 'status-connected');
  
  // Immediately clear history timeline offset
  lastPollingTimestamp = Date.now();

  pollingIntervalId = setInterval(async () => {
    try {
      const response = await fetch(`/api/polling/messages?since=${lastPollingTimestamp}`);
      if (!response.ok) throw new Error('Polling network error');
      
      const messages = await response.json();
      if (messages.length > 0) {
        messages.forEach(msg => appendMessageUI(msg.user, msg.content, msg.timestamp));
        lastPollingTimestamp = messages[messages.length - 1].timestamp;
      }
    } catch (err) {
      console.error('Polling cycle fail:', err);
    }
  }, 3000); // Har 3 seconds me backend check karega
}

function stopHTTPPolling() {
  if (pollingIntervalId) {
    clearInterval(pollingIntervalId);
    pollingIntervalId = null;
  }
}
