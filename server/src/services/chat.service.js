const logger = require('../utils/logger');
const geminiService = require('./gemini.service');
const memoryService = require('./memory.service');
const leadService = require('./lead.service');
const { saveLeadToDatabase } = require('./lead.service');

// Conversation phase tracking
const PHASES = {
  GREETING: 'greeting',
  EXPLORATION: 'exploration',
  DETAILING: 'detailing',
  QUALIFYING: 'qualifying',
  QUALIFIED: 'qualified',
};

// In-memory conversation store (replaced by Supabase in Phase 2)
const conversations = new Map();

function createConversation() {
  const conversation = {
    id: generateId(),
    messages: [],
    lead: leadService.createEmptyLead(),
    phase: PHASES.GREETING,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Store conversation in the Map
  conversations.set(conversation.id, conversation);

  // Initialize the memory service for this conversation
  memoryService.initMemory(conversation.id);

  logger.info('Conversation created', { conversationId: conversation.id });
  return conversation;
}

function getConversation(id) {
  return conversations.get(id) || null;
}

function generateId() {
  return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Process a user message through the full pipeline:
// 1. Detect corrections — add context to the message if the user is correcting
// 2. Store user message in memory (deduplication handled)
// 3. Build context: use memory's sliding window + summary for long convos
// 4. Call Gemini for response + extraction
// 5. Merge extracted data into lead (never overwrite with null)
// 6. Record field provenance in memory
// 7. Calculate deterministic lead score
// 8. Store AI response in memory
// 9. Return result
async function processMessage(conversationId, messageText) {
  const conversation = getConversation(conversationId);
  if (!conversation) {
    return { error: 'Conversation not found', status: 404 };
  }

  // Detect if user is correcting/updating previous information
  const isCorrection = memoryService.detectCorrection(messageText);

  // Build the user message object
  const now = new Date();
  const userMessage = {
    id: generateId(),
    role: 'user',
    content: messageText,
    timestamp: now,
    isCorrection, // Flag for tracking
  };

  // Store user message through memory service (handles deduplication)
  memoryService.storeMessage(conversationId, userMessage);

  // Also store in the conversation array for API response history
  // (memory service's store tracks deduplication, so we check the result)
  const memoryStore = memoryService.getContextMessages(conversationId);
  const lastMemoryMsg = memoryStore[memoryStore.length - 1];
  if (lastMemoryMsg && lastMemoryMsg.id === userMessage.id) {
    // Message was not duplicate, add to conversation messages too
    conversation.messages.push({
      id: userMessage.id,
      role: 'user',
      content: messageText,
      timestamp: now,
      metadata: isCorrection ? { isCorrection: true } : undefined,
    });
  }

  try {
    // Call Gemini with memory-aware context
    const aiResult = await geminiService.generateResponse(conversation, {
      conversationId,
      isCorrection,
    });

    const reply = aiResult.reply;
    const extracted = aiResult.extracted || {};
    const qualification = aiResult.qualification || {};

    // Merge extracted data into lead (never overwrite with null)
    conversation.lead = mergeLeadData(conversation.lead, extracted);

    // Record field extraction provenance in memory
    memoryService.recordExtraction(
      conversationId,
      extracted,
      userMessage.id,
      now
    );

    // Calculate deterministic score
    conversation.lead.leadScore = calculateScore(conversation.lead);
    conversation.lead.confidence = getConfidence(conversation.lead.leadScore);
    conversation.lead.qualificationStatus = getStatus(conversation.lead.leadScore);
    conversation.lead.summary = generateSummary(conversation.lead);

    // Determine conversation phase
    conversation.phase = determinePhase(conversation.lead);

    // Add AI response to history
    const aiMessage = {
      id: generateId(),
      role: 'assistant',
      content: reply,
      timestamp: new Date(),
      metadata: {
        extracted,
        qualification,
        isCorrection,
        fieldUpdates: Object.keys(extracted).filter(k => extracted[k] !== null),
      },
    };
    conversation.messages.push(aiMessage);

    // Store AI response in memory too
    memoryService.storeMessage(conversationId, {
      id: aiMessage.id,
      role: 'assistant',
      content: reply,
      timestamp: aiMessage.timestamp,
      metadata: aiMessage.metadata,
    });

    conversation.updatedAt = new Date();

    // Log memory stats
    const messageCount = memoryService.getMessageCount(conversationId);
    const updatedFields = memoryService.getUpdatedFields(conversationId);

    logger.debug('Message processed with memory', {
      conversationId,
      phase: conversation.phase,
      score: conversation.lead.leadScore,
      totalMessagesInMemory: messageCount,
      extractedFields: Object.keys(extracted).filter(k => extracted[k] !== null),
      updatedFields: updatedFields.length,
      buyingIntent: qualification.buyingIntent,
      isCorrection,
    });

    // Save qualified lead to Supabase (non-blocking, fire-and-forget)
    // We don't await this so the chat response isn't delayed by DB writes
    const leadForDb = {
      ...conversation.lead,
      conversationId: conversation.id,
      buyingIntent: qualification.buyingIntent || 'low',
    };
    saveLeadToDatabase(leadForDb).catch((err) => {
      // Log but don't fail the request if DB save fails
      logger.error('Failed to save lead to database', {
        error: err.message,
        conversationId: conversation.id,
      });
    });

    return {
      reply,
      lead: conversation.lead,
      conversationId,
    };
  } catch (error) {
    logger.error('Failed to process message through Gemini', {
      error: error.message,
      conversationId,
    });

    // Provide a fallback response if Gemini fails
    const fallbackReply = "I'm sorry, I'm experiencing a technical issue right now. Could you please try again in a moment?";

    const aiMessage = {
      id: generateId(),
      role: 'assistant',
      content: fallbackReply,
      timestamp: new Date(),
      metadata: { error: error.message },
    };
    conversation.messages.push(aiMessage);
    conversation.updatedAt = new Date();

    return {
      reply: fallbackReply,
      lead: conversation.lead,
      conversationId,
    };
  }
}

// Merge extracted data into existing lead using lead service
// Returns { lead, changes } — changes tracks what was updated for logging
function mergeLeadData(existing, extracted) {
  const result = leadService.mergeLeadData(existing, extracted);
  if (result.changes.length > 0) {
    logger.debug('Lead fields updated', {
      changes: result.changes.map(c => ({
        field: c.field,
        from: c.from,
        to: c.to,
        strategy: c.strategy,
      })),
    });
  }
  return result.lead;
}

// Deterministic lead scoring — pure function
function calculateScore(lead) {
  let score = 0;
  if (lead.destination) score += 20;
  if (lead.travelDate) score += 15;
  if (lead.travellers) score += 10;
  if (lead.budget) score += 15;
  if (lead.duration) score += 5;
  if (lead.tripType) score += 10;
  if (lead.departureCity) score += 5;
  if (lead.specialRequirements) score += 5;
  if (lead.customerName) score += 5;
  if (lead.email) score += 10;
  if (lead.phone) score += 10;
  return Math.min(score, 100);
}

function getConfidence(score) {
  if (score >= 60) return 'High';
  if (score >= 30) return 'Medium';
  return 'Low';
}

function getStatus(score) {
  if (score >= 60) return 'Qualified';
  if (score >= 30) return 'In Progress';
  return 'Exploring';
}

function determinePhase(lead) {
  if (lead.customerName || lead.email || lead.phone) return PHASES.QUALIFIED;
  if (lead.leadScore >= 40) return PHASES.QUALIFYING;
  if (lead.destination && lead.travelDate && lead.travellers) return PHASES.DETAILING;
  if (lead.destination) return PHASES.EXPLORATION;
  return PHASES.GREETING;
}

function generateSummary(lead) {
  const parts = [];
  if (lead.destination) parts.push(`Trip to ${lead.destination}`);
  if (lead.departureCity) parts.push(`departing from ${lead.departureCity}`);
  if (lead.travelDate) parts.push(`in ${lead.travelDate}`);
  if (lead.travellers) parts.push(`${lead.travellers} travellers`);
  if (lead.duration) parts.push(`for ${lead.duration}`);
  if (lead.budget) parts.push(`budget ${lead.budget}`);
  if (lead.tripType) parts.push(`(${lead.tripType})`);

  if (parts.length > 0) {
    return parts.join(' ') + '.';
  }
  return 'No travel details collected yet. Start a conversation to plan your trip!';
}

// Export for use in controller
module.exports = {
  createConversation,
  getConversation,
  processMessage,
};