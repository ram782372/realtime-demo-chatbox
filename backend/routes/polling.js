const express = require('express');
const router = express.Router();

router.get('/messages', (req, res) => {
  const since = parseInt(req.query.since) || 0;
  const cache = req.app.get('pollingMessagesCache') || [];
  
  // Sirf vahi messages filter karein jo client ke last incoming timestamp ke BAAD ke hain
  const newMessages = cache.filter(msg => msg.timestamp > since);
  
  res.json(newMessages);
});

module.exports = router;
