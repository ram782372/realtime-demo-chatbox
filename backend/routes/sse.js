const express = require('express');
const router = express.Router();

router.get('/events', (req, res) => {
  const messageEmitter = req.app.get('messageEmitter');

  // SSE ke zaroori content headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no' // Nginx buffering bypass karne ke liye
  });

  // Initial connection trigger event
  res.write('event: connected\ndata: {"status": "ok"}\n\n');

  // Har 15 seconds me Connection alive rakhne ke liye heartbeat chunk
  const heartbeatInterval = setInterval(() => {
    res.write(`event: heartbeat\ndata: ${JSON.stringify({ time: new Date().toISOString() })}\n\n`);
  }, 15000);

  // Jab bhi koi naya message emit hoga, client screen par push hoga
  const listener = (message) => {
    res.write(`event: notification\ndata: ${JSON.stringify(message)}\n\n`);
  };

  messageEmitter.on('new-message', listener);

  req.on('close', () => {
    clearInterval(heartbeatInterval);
    messageEmitter.off('new-message', listener);
    res.end();
  });
});

module.exports = router;
