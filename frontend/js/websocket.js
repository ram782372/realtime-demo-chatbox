class ReconnectingWS {
  constructor(url) {
    this.url = url;
    this.instance = null;
    this.retries = 0;
    this.maxRetries = 5;
    this.forcedClose = false;
  }

  connect() {
    this.instance = new WebSocket(this.url);
    updateStatusDisplay('WS Connecting...', 'status-disconnected');

    this.instance.onopen = () => {
      this.retries = 0;
      updateStatusDisplay('WS Connected (General Room)', 'status-connected');
      this.sendRaw({ type: 'join', room: 'general' });
    };

    this.instance.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'chat') {
        appendMessageUI(data.user, data.content, data.timestamp);
      }
    };

    this.instance.onclose = () => {
      if (this.forcedClose) {
        updateStatusDisplay('WS Offline', 'status-disconnected');
        return;
      }
      if (this.retries < this.maxRetries) {
        const backoffDelay = Math.min(1000 * 2 ** this.retries, 15000);
        console.log(`WS connection lost. Retry in ${backoffDelay}ms`);
        setTimeout(() => this.connect(), backoffDelay);
        this.retries++;
      }
    };
  }

  sendRaw(data) {
    if (this.instance && this.instance.readyState === WebSocket.OPEN) {
      this.instance.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  close() {
    this.forcedClose = true;
    if (this.instance) this.instance.close();
  }
}

let wsWrapperInstance = null;

function startWebSocketProtocol() {
  stopAllProtocols();
  
  // 'localhost:8080' likhne ki jagah live server domain pick karne ke liye aisa likhein:
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  wsWrapperInstance = new ReconnectingWS(`${protocol}//${window.location.host}/ws`);
  wsWrapperInstance.connect();
}

function stopWebSocketProtocol() {
  if (wsWrapperInstance) {
    wsWrapperInstance.close();
    wsWrapperInstance = null;
  }
}
