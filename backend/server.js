const express = require('express');
const http = require('http');
const path = require('path');
const EventEmitter = require('events');
const { initWebSocketServer } = require('./websockets/wsHandler');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 8080; // Render automatically configures process.env.PORT

// Ek global Message Emitter jo protocols ke beech messages distribute karega
const messageEmitter = new EventEmitter();
app.set('messageEmitter', messageEmitter);

// Middleware
app.use(express.json());

// Frontend static files ko serve karne ke liye middleware
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes dynamic integration
const pollingRoutes = require('./routes/polling');
const longPollingRoutes = require('./routes/longPolling');
const sseRoutes = require('./routes/sse');

app.use('/api/polling', pollingRoutes);
app.use('/api/long-polling', longPollingRoutes);
app.use('/api/sse', sseRoutes);

// Test endpoint backend me message push karne ke liye (Sabhi protocols par test karne ke liye)
app.post('/api/messages/send', (req, res) => {
  const { content, user } = req.body;
  const msg = {
    user: user || 'Anonymous',
    content: content || '',
    timestamp: Date.now()
  };
  
  // Emitter triggers for Long Polling and SSE
  messageEmitter.emit('new-message', msg);
  
  // HTTP Polling ke liye hum cache list me daal dete hain
  const pollingCache = app.get('pollingMessagesCache') || [];
  pollingCache.push(msg);
  app.set('pollingMessagesCache', pollingCache);

  res.status(200).json({ status: 'sent', message: msg });
});

// WebSocket server setup
initWebSocketServer(server, messageEmitter);

server.listen(port, () => {
  console.log(`🚀 Real-Time Server running on port ${port}`);
});
