let sseEventSource = null;

function startSSE() {
  stopAllProtocols();
  
  sseEventSource = new EventSource('/api/sse/events');
  updateStatusDisplay('Connecting...', 'status-disconnected');

  sseEventSource.onopen = () => {
    updateStatusDisplay('Stream Open', 'status-connected');
  };

  // Custom event streams trigger listener
  sseEventSource.addEventListener('notification', (event) => {
    const msg = JSON.parse(event.data);
    appendMessageUI(msg.user, msg.content, msg.timestamp);
  });

  sseEventSource.onerror = (err) => {
    console.error('SSE Error dynamic loop:', err);
    updateStatusDisplay('Reconnecting stream', 'status-disconnected');
  };
}

function stopSSE() {
  if (sseEventSource) {
    sseEventSource.close();
    sseEventSource = null;
  }
}
