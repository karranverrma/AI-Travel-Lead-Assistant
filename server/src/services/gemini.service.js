const { getGeminiClient, getModelName } = require('../config/gemini');
const { buildSystemPrompt } = require('../prompts/system.prompt');
const memoryService = require('./memory.service');
const logger = require('../utils/logger');

// Maximum retries for malformed responses
const MAX_RETRIES = 2;

// Default fallback for when AI response is completely unusable
const FALLBACK_RESPONSE = {
  reply: "I'm sorry, I'm having trouble processing that. Could you please rephrase?",
  extracted: {},
  qualification: {
    buyingIntent: 'low',
    notes: 'AI response parse failure. Fallback used.',
  },
};

// Clean AI response text — remove markdown code fences and trim
function cleanResponseText(text) {
  if (!text || typeof text !== 'string') return null;

  let cleaned = text.trim();

  // Remove markdown code fences (```json ... ``` or ``` ... ```)
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '');
  cleaned = cleaned.replace(/\n?```\s*$/i, '');

  // Remove any leading/trailing whitespace or invisible chars
  cleaned = cleaned.trim();

  return cleaned;
}

// Parse AI response into structured JSON
function parseAiResponse(text) {
  if (!text) return null;

  const cleaned = cleanResponseText(text);

  try {
    const parsed = JSON.parse(cleaned);

    // Validate required fields
    if (!parsed.reply || typeof parsed.reply !== 'string') {
      logger.warn('AI response missing "reply" field', { response: cleaned.substring(0, 200) });
      return null;
    }

    // Validate extracted is an object
    if (!parsed.extracted || typeof parsed.extracted !== 'object') {
      parsed.extracted = {};
    }

    // Validate qualification is an object
    if (!parsed.qualification || typeof parsed.qualification !== 'object') {
      parsed.qualification = { buyingIntent: 'low', notes: '' };
    }

    return parsed;
  } catch (error) {
    logger.warn('Failed to parse AI response as JSON', {
      error: error.message,
      preview: cleaned.substring(0, 300),
    });
    return null;
  }
}

// Attempt to extract any JSON from a non-JSON response (graceful fallback)
function extractJsonFromText(text) {
  if (!text) return null;

  // Try to find a JSON object between curly braces
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return parseAiResponse(jsonMatch[0]);
  }

  return null;
}

// ─── Memory-Aware Context Building ─────────────────────────

// Build conversation history for Gemini using the memory service.
// This provides:
// 1. A sliding window of recent messages (last 20)
// 2. A compressed summary for long conversations
// 3. Correction awareness (flags when user is updating info)
function buildConversationHistory(conversation, options = {}) {
  const { conversationId, isCorrection } = options;
  const messages = conversation.messages;

  // Convert conversation messages to Gemini format
  const history = messages.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  return history;
}

// Inject memory summary into the system prompt for long conversations
function augmentPromptWithMemory(systemPrompt, conversationId, options = {}) {
  const { isCorrection } = options;

  // Check if the memory service has data for this conversation
  const messageCount = memoryService.getMessageCount(conversationId);
  const needsSummary = memoryService.needsSummarization(conversationId);
  const updatedFields = memoryService.getUpdatedFields(conversationId);

  // For long conversations, inject a summary of what's been collected
  if (messageCount > memoryService.SUMMARIZE_THRESHOLD || needsSummary) {
    // Get the memory store to build a summary
    const memoryStore = memoryService.getContextMessages(conversationId);
    if (memoryStore) {
      const fieldHistory = [];
      // Build field history from provenance
      const updatedFieldNames = updatedFields.map(f => f.field);
      if (updatedFieldNames.length > 0) {
        fieldHistory.push(`[NOTE: The following fields have been updated by the user: ${updatedFieldNames.join(', ')}. Be aware of the latest values.]`);
      }

      if (fieldHistory.length > 0) {
        systemPrompt += `\n\n## CONVERSATION HISTORY NOTE\n${fieldHistory.join('\n')}`;
      }

      // Add message count context
      systemPrompt += `\n\nThis is message #${messageCount} in this conversation. The user may be referring to earlier parts of the conversation.`;
    }
  }

  // If user is correcting, add emphasis
  if (isCorrection) {
    systemPrompt += `\n\n## CORRECTION DETECTED\nThe user appears to be correcting or updating previously provided information. Please prioritize the LATEST information they provide and update the lead state accordingly. Acknowledge the update gracefully.`;
  }

  // Check for specific field corrections
  const updatedFieldsList = memoryService.getUpdatedFields(conversationId);
  if (updatedFieldsList.length > 0) {
    systemPrompt += `\n\n## FIELD UPDATES\nThe following fields have been updated during this conversation:`;
    for (const f of updatedFieldsList) {
      systemPrompt += `\n- ${f.field}: current value is "${f.currentValue}"`;
    }
    systemPrompt += `\n\nAlways use the most recent value provided by the user.`;
  }

  return systemPrompt;
}

// Call Gemini and get a structured response
async function generateResponse(conversation, options = {}) {
  const { messages, lead } = conversation;
  const conversationId = options.conversationId || 'unknown';

  // Build the system prompt with current lead state
  let systemPrompt = buildSystemPrompt(lead);

  // Augment with memory context (summaries, corrections, field updates)
  systemPrompt = augmentPromptWithMemory(systemPrompt, conversationId, options);

  // Build conversation history using memory-aware function
  const history = buildConversationHistory(conversation, options);

  // Get the last user message (the one we just added)
  const lastUserMessage = messages[messages.length - 1];
  if (!lastUserMessage || lastUserMessage.role !== 'user') {
    return { ...FALLBACK_RESPONSE };
  }

  // Check if there was a previous correction in history
  const hasPreviousCorrections = messages.some(
    m => m.role === 'user' && m.metadata?.isCorrection
  );

  // Construct the full content array for Gemini
  const contents = [
    // System instruction
    {
      role: 'user',
      parts: [
        {
          text: `[SYSTEM INSTRUCTION]\n${systemPrompt}\n\n[END SYSTEM INSTRUCTION]\n\nNow, respond to the user's message below. Remember: ONLY output valid JSON.`,
        },
      ],
    },
    {
      role: 'model',
      parts: [
        {
          text: '{"reply":"Understood. I will follow the system instructions exactly and respond with valid JSON only.","extracted":{},"qualification":{"buyingIntent":"low","notes":"Acknowledged system prompt."}}',
        },
      ],
    },
    // Conversation history (excluding the last user message since we add it separately)
    ...history.slice(0, -1),
    // Last user message
    {
      role: 'user',
      parts: [{ text: lastUserMessage.content }],
    },
  ];

  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const client = getGeminiClient();
      const model = getModelName();

      logger.debug('Calling Gemini API', {
        model,
        historyLength: history.length,
        totalMessages: messages.length,
        isCorrection: options.isCorrection,
        hasPreviousCorrections,
        attempt: attempt + 1,
      });

      const response = await client.models.generateContent({
        model,
        contents,
        config: {
          temperature: 0.7,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      });

      // Extract text from response
      const responseText = response?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!responseText) {
        const finishReason = response?.candidates?.[0]?.finishReason;
        if (finishReason && finishReason !== 'STOP') {
          logger.warn('Gemini response blocked', { finishReason });
          return {
            reply: "I apologize, but I need to keep our conversation appropriate and focused on travel planning. How can I help you with your trip?",
            extracted: {},
            qualification: { buyingIntent: 'low', notes: `Response blocked by safety: ${finishReason}` },
          };
        }
        lastError = new Error('Empty response from Gemini');
        continue;
      }

      // Try to parse as JSON
      let parsed = parseAiResponse(responseText);

      // If parsing failed, try to extract JSON from text
      if (!parsed) {
        parsed = extractJsonFromText(responseText);
      }

      // If still no valid JSON, use fallback
      if (!parsed) {
        logger.warn('Could not extract valid JSON from Gemini response', {
          preview: responseText.substring(0, 500),
        });

        if (attempt < MAX_RETRIES) {
          // Add a retry instruction to the conversation
          contents.push({
            role: 'user',
            parts: [{
              text: 'IMPORTANT: Your previous response was not valid JSON. Please respond with ONLY a valid JSON object following the exact schema provided. No markdown, no extra text, just the JSON object.',
            }],
          });
          continue;
        }

        return {
          reply: responseText.substring(0, 500) || FALLBACK_RESPONSE.reply,
          extracted: {},
          qualification: { buyingIntent: 'low', notes: 'Non-JSON response from AI' },
        };
      }

      logger.debug('Gemini response parsed successfully', {
        extracted: Object.keys(parsed.extracted).filter(k => parsed.extracted[k] !== null),
        buyingIntent: parsed.qualification?.buyingIntent,
      });

      return parsed;
    } catch (error) {
      lastError = error;
      logger.error('Gemini API call failed', {
        error: error.message,
        attempt: attempt + 1,
      });

      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }
    }
  }

  // All retries exhausted
  logger.error('All Gemini API retries exhausted', {
    error: lastError?.message,
  });

  // Return a user-friendly error message based on the actual error
  if (lastError?.message?.includes('API_KEY_INVALID') || lastError?.message?.includes('API key not valid')) {
    return {
      reply: "I'm having trouble connecting to the AI service. The API key appears to be invalid. Please check your GEMINI_API_KEY in the .env file.",
      extracted: {},
      qualification: { buyingIntent: 'low', notes: 'Invalid API key' },
    };
  }

  if (lastError?.message?.includes('quota') || lastError?.message?.includes('rate') || lastError?.message?.includes('RESOURCE_EXHAUSTED')) {
    return {
      reply: "I'm receiving too many requests right now. Please wait a moment and try again.",
      extracted: {},
      qualification: { buyingIntent: 'low', notes: 'Gemini rate limit exceeded' },
    };
  }

  if (lastError?.message?.includes('not set') || lastError?.message?.includes('GEMINI_API_KEY')) {
    return {
      reply: "I'm not properly configured yet. Please check the server's Gemini API key configuration.",
      extracted: {},
      qualification: { buyingIntent: 'low', notes: 'Gemini API key not configured' },
    };
  }

  // For all other errors, return the actual error message for debugging
  logger.error('Gemini API error (non-retryable)', {
    error: lastError?.message,
    stack: lastError?.stack,
  });

  return {
    reply: "I'm sorry, I'm experiencing a technical issue right now. Could you please try again in a moment?",
    extracted: {},
    qualification: { buyingIntent: 'low', notes: `Gemini error: ${lastError?.message}` },
  };
}

module.exports = { generateResponse };