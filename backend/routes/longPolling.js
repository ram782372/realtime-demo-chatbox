const express = require('express');
const router = express.Router();

router.get('/subscribe', (req, res) => {
  const messageEmitter = req.app.get('messageEmitter');

  const listener = (message) => {
    res.json([message]);
    cleanup();
  };

  messageEmitter.on('new-message', listener);

  // 30 Seconds ka active timeout connection hold rakhne ke liye
  const timeout = setTimeout(() => {
    res.status(204).end(); // No Content response, tells client to reconnect
    cleanup();
  }, 30000);

  function cleanup() {
    clearTimeout(timeout);
    messageEmitter.off('new-message', listener);
  }

  // Agar client connection tod de ya tab close karein
  req.on('close', cleanup);
});

module.exports = router;
