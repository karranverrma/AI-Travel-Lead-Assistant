const logger = require('../utils/logger');

// ─── Constants ──────────────────────────────────────────────
const MAX_HISTORY_MESSAGES = 30;     // Max raw messages before summarization kicks in
const SUMMARIZE_THRESHOLD = 25;      // Start summarizing when messages exceed this
const SLIDING_WINDOW_SIZE = 20;      // Messages to include in Gemini context

// Correction signal keywords — when user says these, they're likely correcting
const CORRECTION_SIGNALS = [
  'actually', 'correction', 'correct', 'change', 'update',
  'no i said', 'no i meant', 'not that', 'let me clarify',
  'i changed', 'different', 'instead', 'rather than', 'revise',
  'my mistake', 'sorry i', 'wait', 'hold on',
];

// ─── Field Provenance ───────────────────────────────────────
// Tracks which message extracted which lead field.
// This allows us to trace back when a correction happens.

class MemoryStore {
  constructor() {
    // conversationId -> { messages, provenance, summary, fieldHistory }
    this.stores = new Map();
  }

  // Initialize memory for a new conversation
  init(conversationId) {
    this.stores.set(conversationId, {
      messages: [],
      provenance: new Map(),  // fieldName -> { messageId, timestamp, value }
      fieldHistory: new Map(), // fieldName -> [{ value, messageId, timestamp }] — all changes
      summary: null,           // Compressed summary of conversation
      needsSummarization: false,
      correctionCount: 0,
    });
  }

  // Get memory store for a conversation
  getStore(conversationId) {
    return this.stores.get(conversationId) || null;
  }

  // Check if store exists
  hasStore(conversationId) {
    return this.stores.has(conversationId);
  }

  // Delete store (cleanup)
  destroy(conversationId) {
    this.stores.delete(conversationId);
  }
}

// Singleton memory store
const memoryStore = new MemoryStore();

// ─── Core Memory Functions ──────────────────────────────────

// Initialize memory for a new conversation
function initMemory(conversationId) {
  if (!memoryStore.hasStore(conversationId)) {
    memoryStore.init(conversationId);
    logger.debug('Memory initialized', { conversationId });
  }
  return memoryStore.getStore(conversationId);
}

// Store a message in memory
function storeMessage(conversationId, message) {
  const store = memoryStore.getStore(conversationId);
  if (!store) return;

  // Prevent exact duplicate messages (same role + same content within 5 seconds)
  const lastMsg = store.messages[store.messages.length - 1];
  if (lastMsg &&
      lastMsg.role === message.role &&
      lastMsg.content === message.content &&
      (new Date(message.timestamp) - new Date(lastMsg.timestamp)) < 5000) {
    logger.debug('Duplicate message detected and skipped', {
      conversationId,
      role: message.role,
    });
    return;
  }

  store.messages.push(message);

  // Check if we need summarization
  if (store.messages.length >= SUMMARIZE_THRESHOLD) {
    store.needsSummarization = true;
  }
}

// Record field extraction provenance
function recordExtraction(conversationId, extractedFields, messageId, timestamp) {
  const store = memoryStore.getStore(conversationId);
  if (!store || !extractedFields) return;

  for (const [field, value] of Object.entries(extractedFields)) {
    if (value === null || value === undefined) continue;

    const prevValue = store.provenance.get(field)?.value || null;

    // Record current provenance
    store.provenance.set(field, {
      messageId,
      timestamp,
      value,
      isUpdate: prevValue !== null && prevValue !== value,
    });

    // Record in field history (for tracking changes over time)
    if (!store.fieldHistory.has(field)) {
      store.fieldHistory.set(field, []);
    }
    store.fieldHistory.get(field).push({
      value,
      messageId,
      timestamp,
    });

    // Detect correction
    if (field === 'destination' && prevValue && prevValue !== value) {
      store.correctionCount++;
      logger.debug('Destination correction detected', {
        conversationId,
        from: prevValue,
        to: value,
      });
    }
  }
}

// Detect if a user message is a correction or update to previous info
function detectCorrection(messageText) {
  const msg = messageText.toLowerCase().trim();
  return CORRECTION_SIGNALS.some(signal => msg.includes(signal));
}

// ─── Context Building ──────────────────────────────────────

// Get messages suitable for Gemini context (sliding window + optional summary)
function getContextMessages(conversationId) {
  const store = memoryStore.getStore(conversationId);
  if (!store) return [];

  const { messages } = store;

  // If under threshold, return all messages
  if (messages.length <= MAX_HISTORY_MESSAGES) {
    return messages;
  }

  // Return sliding window of the most recent messages
  const windowed = messages.slice(-SLIDING_WINDOW_SIZE);
  return windowed;
}

// Build a compressed summary of the conversation for when history gets long
function buildSummary(store) {
  if (!store || store.messages.length === 0) return null;

  const { provenance, fieldHistory } = store;
  const keyFields = [];

  // Extract the current state of each field
  for (const [field, info] of provenance) {
    if (info.value !== null && info.value !== undefined) {
      const changes = fieldHistory.get(field)?.length || 1;
      const changeIndicator = changes > 1 ? ` (updated ${changes - 1} time${changes > 2 ? 's' : ''})` : '';
      keyFields.push(`${field}: ${info.value}${changeIndicator}`);
    }
  }

  const correctionNote = store.correctionCount > 0
    ? ` User has made ${store.correctionCount} correction${store.correctionCount > 1 ? 's' : ''}.`
    : '';

  return {
    text: `[CONVERSATION SUMMARY: ${keyFields.join(' | ')}.${correctionNote}]`,
    fieldCount: keyFields.length,
    messageCount: store.messages.length,
    correctionCount: store.correctionCount,
    generatedAt: new Date().toISOString(),
  };
}

// ─── Message History Queries ───────────────────────────────

// Get the raw field history for a specific field
function getFieldHistory(conversationId, fieldName) {
  const store = memoryStore.getStore(conversationId);
  if (!store) return [];
  return store.fieldHistory.get(fieldName) || [];
}

// Get all fields that have been updated/corrected
function getUpdatedFields(conversationId) {
  const store = memoryStore.getStore(conversationId);
  if (!store) return [];

  const updated = [];
  for (const [field, info] of store.provenance) {
    if (info.isUpdate) {
      updated.push({ field, currentValue: info.value });
    }
  }
  return updated;
}

// Check if conversation needs summarization
function needsSummarization(conversationId) {
  const store = memoryStore.getStore(conversationId);
  return store ? store.needsSummarization : false;
}

// Get the last N messages (for direct querying)
function getRecentMessages(conversationId, count = 10) {
  const store = memoryStore.getStore(conversationId);
  if (!store) return [];
  return store.messages.slice(-count);
}

// Get total message count
function getMessageCount(conversationId) {
  const store = memoryStore.getStore(conversationId);
  return store ? store.messages.length : 0;
}

// ─── Cleanup ───────────────────────────────────────────────

// Remove memory for a conversation (when conversation is deleted/expired)
function clearMemory(conversationId) {
  memoryStore.destroy(conversationId);
  logger.debug('Memory cleared', { conversationId });
}

module.exports = {
  // Lifecycle
  initMemory,
  clearMemory,

  // Storage
  storeMessage,
  recordExtraction,

  // Context
  getContextMessages,
  buildSummary,

  // Correction detection
  detectCorrection,

  // Queries
  getFieldHistory,
  getUpdatedFields,
  needsSummarization,
  getRecentMessages,
  getMessageCount,

  // Constants (for consumer use)
  SUMMARIZE_THRESHOLD,
  SLIDING_WINDOW_SIZE,
  CORRECTION_SIGNALS,
};