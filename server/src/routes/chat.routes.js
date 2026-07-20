const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');

// POST /api/chat — Send a message and get AI response
router.post('/', chatController.sendMessage);

// GET /api/chat/:conversationId — Get conversation history
router.get('/:conversationId', chatController.getHistory);

module.exports = router;