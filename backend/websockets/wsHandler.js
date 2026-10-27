const WebSocket = require('ws');

const rooms = new Map(); // room -> Set of clients storage

function initWebSocketServer(server, globalEmitter) {
  const wss = new WebSocket.Server({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    if (request.url === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws) => {
    console.log('🔌 New WebSocket client connected');
    ws.isAlive = true;
    ws.currentRoom = null;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        
        switch (data.type) {
          case 'join':
            joinRoom(ws, data.room);
            break;
          case 'chat':
            const chatPayload = {
              type: 'chat',
              user: data.user || 'Anonymous',
              content: data.content,
              timestamp: Date.now()
            };
            // Room broadast
            broadcastToRoom(ws.currentRoom, chatPayload);
            // HTTP / SSE users ko synchronize rakhne ke liye global trigger
            globalEmitter.emit('new-message', { user: chatPayload.user, content: chatPayload.content, timestamp: chatPayload.timestamp });
            break;
        }
      } catch (err) {
        console.error('Error processing WS message:', err);
      }
    });

    ws.on('close', () => {
      leaveRoom(ws);
      console.log('❌ WebSocket client disconnected');
    });
  });

  // Heartbeat interval check every 30 seconds to clean dead connections
  setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);
}

function joinRoom(ws, roomName) {
  leaveRoom(ws);
  ws.currentRoom = roomName;
  if (!rooms.has(roomName)) {
    rooms.set(roomName, new Set());
  }
  rooms.get(roomName).add(ws);
  ws.send(JSON.stringify({ type: 'presence', content: `Joined room: ${roomName}` }));
}

function leaveRoom(ws) {
  if (ws.currentRoom && rooms.has(ws.currentRoom)) {
    rooms.get(ws.currentRoom).delete(ws);
    if (rooms.get(ws.currentRoom).size === 0) {
      rooms.delete(ws.currentRoom);
    }
  }
}

function broadcastToRoom(roomName, payload) {
  if (!roomName || !rooms.has(roomName)) return;
  const clients = rooms.get(roomName);
  const rawData = JSON.stringify(payload);
  
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(rawData);
    }
  });
}

module.exports = { initWebSocketServer };
