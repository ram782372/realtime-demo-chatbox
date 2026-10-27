let isLongPollingActive = false;
let longPollingAbortController = null;

async function startLongPolling() {
  stopAllProtocols();
  isLongPollingActive = true;
  updateStatusDisplay('Listening (Held)', 'status-connected');

  while (isLongPollingActive) {
    longPollingAbortController = new AbortController();
    try {
      const response = await fetch('/api/long-polling/subscribe', {
        signal: longPollingAbortController.signal
      });

      if (response.status === 200) {
        const messages = await response.json();
        messages.forEach(msg => appendMessageUI(msg.user, msg.content, msg.timestamp));
      }
      
      // Response status 204 (Timeout) ya 200 aate hi instantly automatic cycle loop fir chalega
    } catch (err) {
      if (err.name === 'AbortError') break;
      console.log('Long polling broken, reconnecting in 3s...');
      await new Promise(res => setTimeout(res, 3000));
    }
  }
}

function stopLongPolling() {
  isLongPollingActive = false;
  if (longPollingAbortController) {
    longPollingAbortController.abort();
  }
}
