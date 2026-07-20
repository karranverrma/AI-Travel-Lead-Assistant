const chatService = require('../services/chat.service');
const logger = require('../utils/logger');

// POST /api/chat
// Body: { conversationId?: string, message: string }
async function sendMessage(req, res, next) {
  try {
    const { conversationId, message } = req.body;

    // Validate request
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        error: {
          message: 'Message is required and must be a non-empty string',
          status: 400,
        },
      });
    }

    // Create new conversation if no ID provided
    let activeConversationId = conversationId;
    if (!activeConversationId) {
      const newConv = chatService.createConversation();
      activeConversationId = newConv.id;
      logger.info('New conversation started', { conversationId: activeConversationId });
    }

    // Process the message (now async — calls Gemini)
    const result = await chatService.processMessage(activeConversationId, message.trim());

    // Handle conversation not found
    if (result.error) {
      return res.status(result.status).json({
        error: {
          message: result.error,
          status: result.status,
        },
      });
    }

    logger.info('Message processed successfully', {
      conversationId: activeConversationId,
      score: result.lead.leadScore,
      phase: result.lead.qualificationStatus,
    });

    return res.json(result);
  } catch (error) {
    logger.error('Error processing chat message', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
}

// GET /api/chat/:conversationId
async function getHistory(req, res, next) {
  try {
    const { conversationId } = req.params;
    const conversation = chatService.getConversation(conversationId);

    if (!conversation) {
      return res.status(404).json({
        error: {
          message: 'Conversation not found',
          status: 404,
        },
      });
    }

    return res.json({
      conversationId: conversation.id,
      messages: conversation.messages,
      lead: conversation.lead,
      phase: conversation.phase,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    });
  } catch (error) {
    logger.error('Error fetching conversation history', {
      error: error.message,
    });
    next(error);
  }
}

module.exports = {
  sendMessage,
  getHistory,
};